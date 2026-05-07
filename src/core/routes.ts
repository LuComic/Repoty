import path from "node:path";
import type { FileSummary, GraphEdge, RouteSummary } from "../types/index.js";

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  auth: "Handles login, logout, sessions, users, cookies, and access control.",
  api: "Defines API routes, handlers, request parsing, and server entrypoints.",
  database: "Owns database access, schemas, models, queries, and persistence.",
  ui: "Renders pages, layouts, components, and user-facing views.",
  billing:
    "Handles billing, subscriptions, invoices, and account monetization.",
  payments: "Handles payment providers, checkout, webhooks, and payment state.",
  config: "Configures framework, runtime, build, and environment behavior.",
  tests: "Verifies behavior with tests, fixtures, and assertions.",
  state:
    "Stores client/server state, reducers, context, and state transitions.",
  components: "Contains reusable UI building blocks and composition helpers.",
  utils: "Provides generic helpers, utilities, and shared low-level functions.",
};

const ROUTE_KEYWORDS: Record<string, string[]> = {
  auth: ["auth", "login", "logout", "session", "cookie", "oauth", "user"],
  api: ["api", "route", "handler", "request", "response", "server"],
  database: [
    "db",
    "database",
    "prisma",
    "schema",
    "query",
    "model",
    "sql",
    "mongo",
  ],
  ui: ["ui", "page", "layout", "view", "screen", "style", "component"],
  billing: ["billing", "subscription", "invoice", "plan"],
  payments: ["payment", "payments", "stripe", "checkout", "webhook"],
  config: ["config", "env", "settings", "runtime", "build"],
  tests: ["test", "spec", "assert", "fixture"],
  state: ["state", "store", "context", "reducer", "cache"],
  components: ["components"],
  utils: ["util", "utils", "helper", "helpers", "shared", "lib"],
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function tokensForFile(
  file: Pick<FileSummary, "path" | "domain" | "tags" | "entrypoints">,
): string[] {
  const base = path.basename(file.path).toLowerCase();
  const all = [
    file.path.toLowerCase(),
    file.domain.toLowerCase(),
    ...file.tags.map((tag) => tag.toLowerCase()),
    ...file.entrypoints.map((e) => e.toLowerCase()),
    base,
  ];
  return all
    .join(" ")
    .split(/[^a-z0-9_-]+/)
    .filter(Boolean);
}

export function normalizeRouteName(value: string | undefined): string {
  const raw = (value || "").trim().toLowerCase();
  if (!raw) return "utils";
  if (raw === "db") return "database";
  if (raw === "component") return "components";
  if (raw === "payment") return "payments";
  if (raw === "test") return "tests";
  if (ROUTE_DESCRIPTIONS[raw]) return raw;
  const singular = raw.replace(/s$/, "");
  return ROUTE_DESCRIPTIONS[singular] ? singular : raw;
}

export function inferRouteCandidates(
  file: Pick<FileSummary, "path" | "domain" | "tags" | "entrypoints">,
): Record<string, number> {
  const scores: Record<string, number> = {};
  const tokens = tokensForFile(file);

  for (const [route, keywords] of Object.entries(ROUTE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (tokens.includes(keyword)) scores[route] = (scores[route] ?? 0) + 2;
      if (file.path.toLowerCase().includes(keyword))
        scores[route] = (scores[route] ?? 0) + 1;
    }
  }

  const normalizedDomain = normalizeRouteName(file.domain);
  if (ROUTE_DESCRIPTIONS[normalizedDomain])
    scores[normalizedDomain] = (scores[normalizedDomain] ?? 0) + 3;

  if (
    file.entrypoints.includes("api-route") ||
    file.entrypoints.includes("route-handler")
  )
    scores.api = (scores.api ?? 0) + 4;
  if (file.entrypoints.includes("page") || file.entrypoints.includes("layout"))
    scores.ui = (scores.ui ?? 0) + 4;
  if (file.entrypoints.includes("config"))
    scores.config = (scores.config ?? 0) + 4;
  if (file.entrypoints.includes("test")) scores.tests = (scores.tests ?? 0) + 4;

  const folder = file.path.split("/")[0]?.toLowerCase();
  if (folder && ROUTE_DESCRIPTIONS[folder])
    scores[folder] = (scores[folder] ?? 0) + 1;

  return scores;
}

export function assignRoutes(
  files: Record<string, FileSummary>,
): Record<string, FileSummary> {
  const updated: Record<string, FileSummary> = {};

  for (const [filePath, file] of Object.entries(files)) {
    const candidates = Object.entries(inferRouteCandidates(file)).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
    const primaryRoute =
      candidates[0]?.[0] ?? normalizeRouteName(file.domain) ?? "utils";
    const secondaryRoutes = candidates.slice(1, 3).map(([name]) => name);
    updated[filePath] = {
      ...file,
      primaryRoute,
      secondaryRoutes,
      domain: primaryRoute,
    };
  }

  return updated;
}

export function buildRoutes(
  files: Record<string, FileSummary>,
  edges: GraphEdge[],
  minClusterSize: number,
): Record<string, RouteSummary> {
  const grouped = new Map<string, FileSummary[]>();
  for (const file of Object.values(files)) {
    const route =
      file.primaryRoute || normalizeRouteName(file.domain) || "utils";
    const bucket = grouped.get(route) ?? [];
    bucket.push(file);
    grouped.set(route, bucket);
  }

  const routes: Record<string, RouteSummary> = {};

  for (const [name, routeFiles] of grouped.entries()) {
    if (
      routeFiles.length < minClusterSize &&
      !routeFiles.some((file) => file.entrypoints.length > 0)
    )
      continue;

    const tags = [...new Set(routeFiles.flatMap((file) => file.tags))].slice(
      0,
      12,
    );
    const entrypoints = routeFiles
      .flatMap((file) => (file.entrypoints.length > 0 ? [file.path] : []))
      .slice(0, 12);
    const sortedByImportance = [...routeFiles].sort((a, b) => {
      const scoreA =
        (a.entrypoints.length ? 100 : 0) +
        a.imports.length +
        a.exports.length +
        a.relatedFiles.length;
      const scoreB =
        (b.entrypoints.length ? 100 : 0) +
        b.imports.length +
        b.exports.length +
        b.relatedFiles.length;
      return scoreB - scoreA || a.path.localeCompare(b.path);
    });

    const routeNames = new Set(
      routeFiles.map((file) => file.primaryRoute || name),
    );
    const relatedRouteCounts: Record<string, number> = {};
    for (const edge of edges) {
      const fromRoute = files[edge.from]?.primaryRoute;
      const toRoute = files[edge.to]?.primaryRoute;
      if (!fromRoute || !toRoute || fromRoute === toRoute || fromRoute !== name)
        continue;
      relatedRouteCounts[toRoute] =
        (relatedRouteCounts[toRoute] ?? 0) + edge.weight;
    }

    routes[name] = {
      name,
      title: capitalize(name),
      purpose: ROUTE_DESCRIPTIONS[name] ?? `Files related to ${name}.`,
      tags,
      files: sortedByImportance.map((file) => file.path),
      entrypoints,
      recommendedReadingOrder: sortedByImportance
        .map((file) => file.path)
        .slice(0, 10),
      relatedRoutes: Object.entries(relatedRouteCounts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([route]) => route)
        .filter((route) => !routeNames.has(route))
        .slice(0, 6),
    };
  }

  return Object.fromEntries(
    Object.entries(routes).sort((a, b) => a[0].localeCompare(b[0])),
  );
}
