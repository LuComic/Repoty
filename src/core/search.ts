import type { FileSummary, RepoStore, RouteSummary } from "../types/index.js";

export type SearchResult =
  | {
      type: "file";
      path: string;
      score: number;
      purpose: string;
      route: string;
    }
  | { type: "route"; name: string; score: number; purpose: string };

function scoreText(text: string, tokens: string[], phrase: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  if (phrase && lower.includes(phrase)) score += 10;
  for (const token of tokens) {
    if (!token) continue;
    if (lower.includes(token)) score += 3;
  }
  return score;
}

function fileHaystack(file: FileSummary): string {
  return [
    file.path,
    file.purpose,
    file.domain,
    file.primaryRoute,
    ...file.tags,
    ...file.exports,
    ...file.functions,
    ...file.usedFor,
    ...file.imports,
    ...file.warnings,
  ]
    .filter(Boolean)
    .join(" ");
}

function routeHaystack(route: RouteSummary): string {
  return [
    route.name,
    route.title,
    route.purpose,
    ...route.tags,
    ...route.files,
    ...route.entrypoints,
  ].join(" ");
}

export function searchStore(
  store: RepoStore,
  query: string,
  limit = 10,
): SearchResult[] {
  const phrase = query.toLowerCase().trim();
  const tokens = phrase.split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  for (const file of Object.values(store.files)) {
    const score = scoreText(fileHaystack(file), tokens, phrase);
    if (score > 0) {
      results.push({
        type: "file",
        path: file.path,
        score,
        purpose: file.purpose,
        route: file.primaryRoute || file.domain,
      });
    }
  }

  for (const route of Object.values(store.routes)) {
    const score = scoreText(routeHaystack(route), tokens, phrase);
    if (score > 0) {
      results.push({
        type: "route",
        name: route.name,
        score,
        purpose: route.purpose,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
