import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getConfigPath, RepotyError, resolveOutDir } from "./config.js";
import {
  renderFilesMarkdown,
  renderRouteMarkdown,
  renderRoutesMarkdown,
  renderSitemapMarkdown,
} from "./markdown.js";
import type {
  FileSummary,
  GraphEdge,
  ManifestData,
  RepoStore,
  RepotyConfig,
  RouteSummary,
} from "../types/index.js";

const FileSummarySchema = z.object({
  path: z.string(),
  hash: z.string(),
  language: z.string(),
  sizeBytes: z.number(),
  purpose: z.string(),
  domain: z.string(),
  tags: z.array(z.string()),
  imports: z.array(z.string()),
  exports: z.array(z.string()),
  functions: z.array(z.string()),
  classes: z.array(z.string()),
  entrypoints: z.array(z.string()),
  usedFor: z.array(z.string()),
  relatedFiles: z.array(z.string()),
  warnings: z.array(z.string()),
  summaryConfidence: z.number(),
  primaryRoute: z.string().optional(),
  secondaryRoutes: z.array(z.string()).optional(),
});

const GraphEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum([
    "imports",
    "imported-by",
    "same-folder",
    "same-domain",
    "shared-tag",
    "same-route",
    "test-target",
    "config-affects",
  ]),
  weight: z.number(),
  reasons: z.array(z.string()),
});

const RouteSummarySchema = z.object({
  name: z.string(),
  title: z.string(),
  purpose: z.string(),
  tags: z.array(z.string()),
  files: z.array(z.string()),
  entrypoints: z.array(z.string()),
  recommendedReadingOrder: z.array(z.string()),
  relatedRoutes: z.array(z.string()),
});

const ManifestSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string(),
  projectRoot: z.string(),
  indexedFiles: z.number(),
  routes: z.number(),
  allFiles: z.boolean().optional(),
});

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson<T>(
  filePath: string,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return schema.parse(JSON.parse(raw));
}

export function getOutPaths(projectRoot: string, config: RepotyConfig) {
  const outDir = resolveOutDir(projectRoot, config);
  return {
    outDir,
    dataDir: path.join(outDir, "data"),
    agentDir: path.join(outDir, "agent"),
    routesDir: path.join(outDir, "agent", "routes"),
    manifest: path.join(outDir, "data", "manifest.json"),
    files: path.join(outDir, "data", "files.json"),
    graph: path.join(outDir, "data", "graph.json"),
    routes: path.join(outDir, "data", "routes.json"),
    hashes: path.join(outDir, "data", "hashes.json"),
    symbols: path.join(outDir, "data", "symbols.json"),
    sitemapMd: path.join(outDir, "agent", "README.md"),
    sitemapMdAlias: path.join(outDir, "agent", "SITEMAP.md"),
    routesMd: path.join(outDir, "agent", "ROUTES.md"),
    filesMd: path.join(outDir, "agent", "FILES.md"),
  };
}

export async function writeStore(
  projectRoot: string,
  config: RepotyConfig,
  store: RepoStore,
): Promise<void> {
  const paths = getOutPaths(projectRoot, config);
  await rm(paths.routesDir, { recursive: true, force: true });
  await mkdir(paths.routesDir, { recursive: true });
  await writeJson(paths.manifest, store.manifest);
  await writeJson(paths.files, store.files);
  await writeJson(paths.graph, { edges: store.graph.edges });
  await writeJson(paths.routes, store.routes);
  await writeJson(paths.hashes, store.hashes);
  await writeJson(paths.symbols, store.symbols);

  const sitemap = renderSitemapMarkdown(store.routes, store.files);
  const routesMd = renderRoutesMarkdown(store.routes);
  const filesMd = renderFilesMarkdown(store.files);
  const readme = `# repoty\n\nStart with \`repoty focus "<task>"\` for task-specific file narrowing. Use \`SITEMAP.md\` only for architecture-level orientation.\n`;

  await writeFile(paths.sitemapMd, readme, "utf8");
  await writeFile(paths.sitemapMdAlias, sitemap, "utf8");
  await writeFile(paths.routesMd, routesMd, "utf8");
  await writeFile(paths.filesMd, filesMd, "utf8");

  for (const route of Object.values(store.routes)) {
    await writeFile(
      path.join(paths.routesDir, `${route.name}.md`),
      renderRouteMarkdown(route, store.files),
      "utf8",
    );
  }
}

export async function loadStore(
  projectRoot: string,
  config: RepotyConfig,
): Promise<RepoStore> {
  const paths = getOutPaths(projectRoot, config);
  try {
    const [manifest, files, graph, routes, hashes, symbols] = await Promise.all(
      [
        readJson(paths.manifest, ManifestSchema),
        readJson(paths.files, z.record(z.string(), FileSummarySchema)),
        readJson(paths.graph, z.object({ edges: z.array(GraphEdgeSchema) })),
        readJson(paths.routes, z.record(z.string(), RouteSummarySchema)),
        readJson(paths.hashes, z.record(z.string(), z.string())),
        readJson(
          paths.symbols,
          z.record(
            z.string(),
            z.object({
              imports: z.array(z.string()),
              exports: z.array(z.string()),
              functions: z.array(z.string()),
              classes: z.array(z.string()),
            }),
          ),
        ),
      ],
    );

    return { manifest, files, graph, routes, hashes, symbols };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new RepotyError(
        "Missing .repoty index. Run `repoty init` first.",
        3,
      );
    }
    if (error instanceof z.ZodError) {
      throw new RepotyError(`Invalid stored data: ${error.message}`, 2);
    }
    throw error;
  }
}

export function buildManifest(
  projectRoot: string,
  files: Record<string, FileSummary>,
  routes: Record<string, RouteSummary>,
  allFiles = false,
): ManifestData {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    projectRoot,
    indexedFiles: Object.keys(files).length,
    routes: Object.keys(routes).length,
    allFiles,
  };
}

export async function cleanGenerated(
  projectRoot: string,
  config: RepotyConfig,
  cacheOnly: boolean,
): Promise<void> {
  const paths = getOutPaths(projectRoot, config);
  if (cacheOnly) {
    await rm(paths.dataDir, { recursive: true, force: true });
    await rm(paths.agentDir, { recursive: true, force: true });
    return;
  }
  await rm(paths.outDir, { recursive: true, force: true });
  if (paths.outDir !== path.join(projectRoot, ".repoty")) {
    await rm(getConfigPath(projectRoot), { force: true });
  }
}

export type JsonValidation = {
  manifest: ManifestData;
  files: Record<string, FileSummary>;
  graph: { edges: GraphEdge[] };
  routes: Record<string, RouteSummary>;
};

export async function validateStoredJson(
  projectRoot: string,
  config: RepotyConfig,
): Promise<JsonValidation> {
  const store = await loadStore(projectRoot, config);
  return {
    manifest: store.manifest,
    files: store.files,
    graph: store.graph,
    routes: store.routes,
  };
}
