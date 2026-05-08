import type { FileSummary, RepoStore } from "../types/index.js";
import { scoreRelatedFiles } from "./graph.js";
import { searchStore, tokenizeQuery } from "./search.js";

export type FocusFile = {
  path: string;
  score: number;
  why: string[];
};

export type FocusResult = {
  task: string;
  startHere: FocusFile[];
  verifyWith: FocusFile[];
  likelyRoutes: string[];
  ignoreRoutes: string[];
};

function addCandidate(
  candidates: Map<string, { score: number; why: string[] }>,
  path: string,
  score: number,
  why: string,
): void {
  const current = candidates.get(path) ?? { score: 0, why: [] };
  current.score += score;
  current.why.push(why);
  candidates.set(path, current);
}

function hasEntrypoint(file: FileSummary, entrypoint: string): boolean {
  return file.entrypoints.includes(entrypoint);
}

function isLikelyTest(file: FileSummary): boolean {
  return (
    hasEntrypoint(file, "test") ||
    /(^|\/)(__tests__|test|tests)\//.test(file.path) ||
    /\.(test|spec)\.[^.]+$/.test(file.path)
  );
}

function formatCandidates(
  candidates: Map<string, { score: number; why: string[] }>,
  store: RepoStore,
  options: { limit: number; tests?: boolean },
): FocusFile[] {
  return [...candidates.entries()]
    .filter(([path]) => {
      const file = store.files[path];
      if (!file) return false;
      return options.tests === undefined || isLikelyTest(file) === options.tests;
    })
    .map(([path, value]) => {
      const file = store.files[path];
      const why = [...new Set(value.why)].slice(0, 3);
      if (file?.purpose && why.length < 3) why.push(file.purpose);
      return { path, score: value.score, why };
    })
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, options.limit);
}

export function focusStore(
  store: RepoStore,
  task: string,
  options: { limit?: number } = {},
): FocusResult {
  const limit = options.limit ?? 5;
  const queryTokens = tokenizeQuery(task);
  const candidates = new Map<string, { score: number; why: string[] }>();
  const routeScores = new Map<string, number>();
  const searchResults = searchStore(store, task, Math.max(12, limit * 3));

  for (const result of searchResults) {
    if (result.type === "file") {
      addCandidate(
        candidates,
        result.path,
        result.score * 3,
        `matches task query (${result.score})`,
      );
      const route = store.files[result.path]?.primaryRoute;
      if (route) routeScores.set(route, (routeScores.get(route) ?? 0) + result.score);
      continue;
    }

    const route = store.routes[result.name];
    routeScores.set(result.name, (routeScores.get(result.name) ?? 0) + result.score);
    for (const filePath of route?.recommendedReadingOrder.slice(0, 4) ?? []) {
      addCandidate(
        candidates,
        filePath,
        result.score,
        `belongs to matching route ${result.name}`,
      );
    }
  }

  const seedPaths = [...candidates.entries()]
    .sort((a, b) => b[1].score - a[1].score || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([path]) => path);

  for (const seedPath of seedPaths) {
    for (const related of scoreRelatedFiles(seedPath, store.graph.edges, 5)) {
      const file = store.files[related.path];
      if (!file) continue;
      const relatedTokenHit = queryTokens.some((token) =>
        [
          file.path,
          file.purpose,
          file.primaryRoute ?? "",
          file.domain,
          ...file.tags,
          ...file.exports,
          ...file.functions,
        ]
          .join(" ")
          .toLowerCase()
          .includes(token),
      );
      const weight = isLikelyTest(file) || relatedTokenHit ? related.score : related.score / 2;
      addCandidate(
        candidates,
        related.path,
        weight,
        `related to ${seedPath}: ${related.reasons.slice(0, 2).join("; ")}`,
      );
      if (file.primaryRoute)
        routeScores.set(file.primaryRoute, (routeScores.get(file.primaryRoute) ?? 0) + weight);
    }
  }

  const likelyRoutes = [...routeScores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([route]) => route)
    .slice(0, 4);
  const likelyRouteSet = new Set(likelyRoutes);
  const ignoreRoutes = Object.keys(store.routes)
    .filter((route) => !likelyRouteSet.has(route))
    .sort()
    .slice(0, 8);

  return {
    task,
    startHere: formatCandidates(candidates, store, { limit, tests: false }),
    verifyWith: formatCandidates(candidates, store, {
      limit: Math.max(2, Math.min(4, limit)),
      tests: true,
    }),
    likelyRoutes,
    ignoreRoutes,
  };
}
