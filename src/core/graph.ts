import path from "node:path";
import type {
  FileSummary,
  GraphEdge,
  RelatedFileResult,
} from "../types/index.js";

const KNOWN_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".svelte",
  ".vue",
  ".css",
  ".scss",
  ".py",
  ".go",
  ".rs",
];

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function addEdge(edges: GraphEdge[], edge: GraphEdge): void {
  edges.push({
    ...edge,
    reasons: unique(edge.reasons),
  });
}

function resolveImport(
  fromPath: string,
  specifier: string,
  fileSet: Set<string>,
): string | null {
  if (!specifier.startsWith(".")) return null;
  const dir = path.posix.dirname(fromPath);
  const base = path.posix.normalize(path.posix.join(dir, specifier));
  const candidates = new Set<string>([base]);
  for (const ext of KNOWN_EXTENSIONS) {
    candidates.add(`${base}${ext}`);
    candidates.add(path.posix.join(base, `index${ext}`));
  }
  for (const candidate of candidates) {
    if (fileSet.has(candidate)) return candidate;
  }
  return null;
}

function maybeAddPair(
  edges: GraphEdge[],
  from: string,
  to: string,
  type: GraphEdge["type"],
  weight: number,
  reasons: string[],
): void {
  if (from === to) return;
  addEdge(edges, { from, to, type, weight, reasons });
  addEdge(edges, { from: to, to: from, type, weight, reasons });
}

function isLikelyTestTarget(testPath: string, targetPath: string): boolean {
  const testBase = path.posix
    .basename(testPath)
    .replace(/\.(test|spec)\.[^.]+$/, "");
  const targetBase = path.posix.basename(targetPath).replace(/\.[^.]+$/, "");
  return testBase === targetBase || testPath.includes(targetBase);
}

export function buildGraph(files: Record<string, FileSummary>): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const fileEntries = Object.values(files);
  const fileSet = new Set(Object.keys(files));

  for (const file of fileEntries) {
    for (const specifier of file.imports) {
      const resolved = resolveImport(file.path, specifier, fileSet);
      if (!resolved) continue;
      addEdge(edges, {
        from: file.path,
        to: resolved,
        type: "imports",
        weight: 10,
        reasons: [`imports ${specifier}`],
      });
      addEdge(edges, {
        from: resolved,
        to: file.path,
        type: "imported-by",
        weight: 10,
        reasons: [`imported by ${file.path}`],
      });
    }
  }

  for (let i = 0; i < fileEntries.length; i += 1) {
    for (let j = i + 1; j < fileEntries.length; j += 1) {
      const a = fileEntries[i];
      const b = fileEntries[j];
      const dirA = path.posix.dirname(a.path);
      const dirB = path.posix.dirname(b.path);
      if (dirA === dirB) {
        maybeAddPair(edges, a.path, b.path, "same-folder", 3, [
          `same folder ${dirA}`,
        ]);
      }
      if (
        (a.primaryRoute || a.domain) &&
        (a.primaryRoute || a.domain) === (b.primaryRoute || b.domain)
      ) {
        maybeAddPair(edges, a.path, b.path, "same-route", 8, [
          `same route ${a.primaryRoute || a.domain}`,
        ]);
      }
      if (a.domain && a.domain === b.domain) {
        maybeAddPair(edges, a.path, b.path, "same-domain", 6, [
          `same domain ${a.domain}`,
        ]);
      }
      const sharedTags = a.tags.filter((tag) => b.tags.includes(tag));
      if (sharedTags.length > 0) {
        maybeAddPair(
          edges,
          a.path,
          b.path,
          "shared-tag",
          4 + Math.min(sharedTags.length - 1, 2),
          [`shared tags: ${sharedTags.slice(0, 3).join(", ")}`],
        );
      }
      if (
        (a.path.includes("config") || a.entrypoints.includes("config")) &&
        (a.primaryRoute || a.domain) === (b.primaryRoute || b.domain)
      ) {
        maybeAddPair(edges, a.path, b.path, "config-affects", 5, [
          "configuration likely affects this route",
        ]);
      }
      if (
        a.entrypoints.includes("test") &&
        isLikelyTestTarget(a.path, b.path)
      ) {
        maybeAddPair(edges, a.path, b.path, "test-target", 7, [
          "test likely targets this file",
        ]);
      }
      if (
        b.entrypoints.includes("test") &&
        isLikelyTestTarget(b.path, a.path)
      ) {
        maybeAddPair(edges, a.path, b.path, "test-target", 7, [
          "test likely targets this file",
        ]);
      }
    }
  }

  return edges;
}

export function scoreRelatedFiles(
  targetPath: string,
  edges: GraphEdge[],
  limit = 10,
): RelatedFileResult[] {
  const scores = new Map<string, { score: number; reasons: string[] }>();

  for (const edge of edges) {
    if (edge.from !== targetPath) continue;
    const current = scores.get(edge.to) ?? { score: 0, reasons: [] };
    current.score += edge.weight;
    current.reasons.push(...edge.reasons);
    scores.set(edge.to, current);
  }

  return [...scores.entries()]
    .map(([path, value]) => ({
      path,
      score: value.score,
      reasons: unique(value.reasons),
    }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit);
}
