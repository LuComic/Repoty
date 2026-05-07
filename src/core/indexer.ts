import { readFile } from "node:fs/promises";
import { extractStaticMetadata } from "../ast/generic.js";
import { summarizeFileWithAI } from "../ai/summarize-file.js";
import type {
  FileSummary,
  IndexDiff,
  RepoStore,
  RepotyConfig,
  ScanResult,
} from "../types/index.js";
import { hashFile } from "./hash.js";
import { buildGraph, scoreRelatedFiles } from "./graph.js";
import { createLogger, type Logger } from "./logger.js";
import { assignRoutes, buildRoutes } from "./routes.js";
import { scanFiles } from "./scan.js";
import { buildManifest } from "./store.js";

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function run(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length || 1)) },
    () => run(),
  );
  await Promise.all(workers);
  return results;
}

export async function detectDiff(
  scannedFiles: ScanResult[],
  previousHashes: Record<string, string>,
): Promise<{ diff: IndexDiff; hashes: Record<string, string> }> {
  const currentHashes: Record<string, string> = {};
  const newFiles: string[] = [];
  const changedFiles: string[] = [];
  const unchangedFiles: string[] = [];

  for (const file of scannedFiles) {
    const hash = await hashFile(file.absolutePath);
    currentHashes[file.path] = hash;
    if (!(file.path in previousHashes)) newFiles.push(file.path);
    else if (previousHashes[file.path] !== hash) changedFiles.push(file.path);
    else unchangedFiles.push(file.path);
  }

  const deletedFiles = Object.keys(previousHashes)
    .filter((filePath) => !(filePath in currentHashes))
    .sort();

  return {
    diff: {
      newFiles: newFiles.sort(),
      changedFiles: changedFiles.sort(),
      deletedFiles,
      unchangedFiles: unchangedFiles.sort(),
    },
    hashes: currentHashes,
  };
}

async function buildFileSummary(
  scan: ScanResult,
  hash: string,
  config: RepotyConfig,
  aiEnabled: boolean,
): Promise<FileSummary> {
  const content = await readFile(scan.absolutePath, "utf8");
  const staticMetadata = extractStaticMetadata(
    scan.path,
    content,
    scan.language,
  );
  const ai = await summarizeFileWithAI({
    path: scan.path,
    absolutePath: scan.absolutePath,
    language: scan.language,
    metadata: staticMetadata,
    maxFileBytesForAi: config.maxFileBytesForAi,
    model: config.model,
    enabled: aiEnabled,
    config,
  });

  return {
    path: scan.path,
    hash,
    language: scan.language,
    sizeBytes: scan.sizeBytes,
    purpose: ai.purpose,
    domain: ai.domain,
    tags: ai.tags,
    imports: staticMetadata.imports,
    exports: staticMetadata.exports,
    functions: staticMetadata.functions,
    classes: staticMetadata.classes,
    entrypoints: staticMetadata.entrypoints,
    usedFor: ai.usedFor,
    relatedFiles: [],
    warnings: [...new Set([...staticMetadata.warnings, ...ai.warnings])].slice(
      0,
      5,
    ),
    summaryConfidence: ai.summaryConfidence,
  };
}

function attachRelatedFiles(
  files: Record<string, FileSummary>,
  edges: ReturnType<typeof buildGraph>,
): Record<string, FileSummary> {
  const updated: Record<string, FileSummary> = {};
  for (const file of Object.values(files)) {
    updated[file.path] = {
      ...file,
      relatedFiles: scoreRelatedFiles(file.path, edges, 12).map(
        (item) => item.path,
      ),
    };
  }
  return updated;
}

export async function indexProject(input: {
  projectRoot: string;
  config: RepotyConfig;
  previousStore?: RepoStore;
  noAi?: boolean;
  all?: boolean;
  allFiles?: boolean;
  logger?: Logger;
}): Promise<{ store: RepoStore; diff: IndexDiff }> {
  const logger = input.logger ?? createLogger(false, true);
  logger.info("Scanning repository files...");
  const allFilesMode = input.allFiles ?? input.previousStore?.manifest.allFiles ?? false;
  const scannedFiles = await scanFiles(input.projectRoot, input.config, {
    allFiles: allFilesMode,
  });
  logger.info(
    `Found ${scannedFiles.length} indexable files${allFilesMode ? " (all-files mode)" : " (default mode)"}.`,
  );
  if (!allFilesMode) {
    logger.info(
      "Tip: use --all-files for broader indexing across more text/code file types.",
    );
  }

  const previousHashes = input.previousStore?.hashes ?? {};
  logger.info("Computing file hashes and detecting changes...");
  const { diff, hashes } = await detectDiff(scannedFiles, previousHashes);
  logger.info(
    `New: ${diff.newFiles.length}, changed: ${diff.changedFiles.length}, deleted: ${diff.deletedFiles.length}, unchanged: ${diff.unchangedFiles.length}`,
  );
  const filesByPath = new Map(scannedFiles.map((file) => [file.path, file]));

  const files: Record<string, FileSummary> = {};
  const pathsToBuild = input.all
    ? scannedFiles.map((file) => file.path)
    : [...diff.newFiles, ...diff.changedFiles];
  const changedSet = new Set(pathsToBuild);

  for (const filePath of diff.unchangedFiles) {
    const previous = input.previousStore?.files[filePath];
    if (previous && !input.all) files[filePath] = previous;
  }

  if (pathsToBuild.length > 0) {
    logger.info(
      `${input.noAi ? "Analyzing" : "Summarizing"} ${pathsToBuild.length} files...`,
    );
  }

  let completed = 0;
  const built = await mapWithConcurrency(
    pathsToBuild,
    input.config.maxConcurrentAiCalls,
    async (filePath) => {
      const scan = filesByPath.get(filePath);
      if (!scan) throw new Error(`Missing scan entry for ${filePath}`);
      logger.debug(`Indexing ${filePath}`);
      const summary = await buildFileSummary(
        scan,
        hashes[filePath],
        input.config,
        !input.noAi,
      );
      completed += 1;
      if (
        logger.verbose ||
        pathsToBuild.length <= 25 ||
        completed === pathsToBuild.length ||
        completed % 10 === 0
      ) {
        logger.info(`[${completed}/${pathsToBuild.length}] ${filePath}`);
      }
      return summary;
    },
  );

  for (const summary of built) files[summary.path] = summary;

  logger.info("Building routes, graph, and related-file links...");
  const routedFiles = assignRoutes(files);
  const edges = buildGraph(routedFiles);
  const withRelated = attachRelatedFiles(routedFiles, edges);
  const reroutedFiles = assignRoutes(withRelated);
  const routes = buildRoutes(
    reroutedFiles,
    edges,
    input.config.routes.minClusterSize,
  );
  const manifest = buildManifest(
    input.projectRoot,
    reroutedFiles,
    routes,
    allFilesMode,
  );

  const symbols = Object.fromEntries(
    Object.values(reroutedFiles).map((file) => [
      file.path,
      {
        imports: file.imports,
        exports: file.exports,
        functions: file.functions,
        classes: file.classes,
      },
    ]),
  );

  const finalHashes: Record<string, string> = {};
  for (const file of scannedFiles) finalHashes[file.path] = hashes[file.path];

  return {
    store: {
      manifest,
      files: reroutedFiles,
      graph: { edges },
      routes,
      hashes: finalHashes,
      symbols,
    },
    diff: input.all
      ? {
          ...diff,
          changedFiles: scannedFiles.map((file) => file.path),
          unchangedFiles: [],
        }
      : {
          ...diff,
          changedFiles: diff.changedFiles,
          unchangedFiles: diff.unchangedFiles.filter(
            (file) => !changedSet.has(file),
          ),
        },
  };
}
