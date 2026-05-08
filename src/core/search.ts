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

function splitWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function tokenVariants(token: string): string[] {
  const variants = new Set([token]);
  if (token.endsWith("ies") && token.length > 4)
    variants.add(`${token.slice(0, -3)}y`);
  if (token.endsWith("es") && token.length > 3) variants.add(token.slice(0, -2));
  if (token.endsWith("s") && token.length > 3) variants.add(token.slice(0, -1));
  if (token.endsWith("ing") && token.length > 5)
    variants.add(token.slice(0, -3));
  if (token.endsWith("ed") && token.length > 4) variants.add(token.slice(0, -2));
  return [...variants];
}

export function tokenizeQuery(query: string): string[] {
  return [...new Set(splitWords(query).flatMap(tokenVariants))].filter(
    (token) => token.length > 1,
  );
}

function scoreText(text: string, tokens: string[], phrase: string): number {
  const lower = text.toLowerCase();
  const words = new Set(splitWords(text));
  let score = 0;
  if (phrase && lower.includes(phrase)) score += 10;
  for (const token of tokens) {
    if (!token) continue;
    if (words.has(token)) score += 5;
    else if (lower.includes(token)) score += 2;
  }
  return score;
}

function scorePath(filePath: string, tokens: string[], phrase: string): number {
  const lower = filePath.toLowerCase();
  const basename = lower.split("/").at(-1) ?? lower;
  const pathWords = new Set(splitWords(filePath));
  let score = 0;
  if (phrase && lower.includes(phrase)) score += 16;
  for (const token of tokens) {
    if (basename.includes(token)) score += 8;
    else if (pathWords.has(token)) score += 5;
    else if (lower.includes(token)) score += 2;
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
  const tokens = tokenizeQuery(query);
  const results: SearchResult[] = [];

  for (const file of Object.values(store.files)) {
    const score =
      scoreText(fileHaystack(file), tokens, phrase) +
      scorePath(file.path, tokens, phrase);
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
