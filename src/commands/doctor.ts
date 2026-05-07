import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { isCodexAvailable, resolveAiProvider } from "../ai/provider.js";
import { loadConfig, RepotyError } from "../core/config.js";
import { detectDiff } from "../core/indexer.js";
import {
  renderFilesMarkdown,
  renderRoutesMarkdown,
  renderSitemapMarkdown,
} from "../core/markdown.js";
import { findProjectRoot } from "../core/project-root.js";
import { isNeverIndexPath, scanFiles } from "../core/scan.js";
import { getOutPaths, loadStore, validateStoredJson } from "../core/store.js";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function runDoctor() {
  const projectRoot = await findProjectRoot();
  const config = await loadConfig(projectRoot);
  const outPaths = getOutPaths(projectRoot, config);

  if (!(await fileExists(outPaths.outDir))) {
    throw new RepotyError(
      "Missing .repoty output. Run `repoty init` first.",
      3,
    );
  }

  const store = await loadStore(projectRoot, config);
  await validateStoredJson(projectRoot, config);

  const issues: string[] = [];
  const warnings: string[] = [];

  for (const filePath of Object.keys(store.files)) {
    if (!(await fileExists(path.join(projectRoot, filePath)))) {
      issues.push(`Indexed file missing from source tree: ${filePath}`);
    }
    if (isNeverIndexPath(filePath)) {
      issues.push(`Sensitive or excluded file was indexed: ${filePath}`);
    }
  }

  const scannedFiles = await scanFiles(projectRoot, config);
  const { diff } = await detectDiff(scannedFiles, store.hashes);
  if (
    diff.changedFiles.length ||
    diff.newFiles.length ||
    diff.deletedFiles.length
  ) {
    warnings.push("Index is stale. Run `repoty update`.");
  }

  const expectedSitemap = renderSitemapMarkdown(store.routes, store.files);
  const expectedRoutes = renderRoutesMarkdown(store.routes);
  const expectedFiles = renderFilesMarkdown(store.files);
  const [actualSitemap, actualRoutes, actualFiles] = await Promise.all([
    readFile(outPaths.sitemapMdAlias, "utf8"),
    readFile(outPaths.routesMd, "utf8"),
    readFile(outPaths.filesMd, "utf8"),
  ]);

  if (expectedSitemap !== actualSitemap)
    issues.push("SITEMAP.md does not match JSON store.");
  if (expectedRoutes !== actualRoutes)
    issues.push("ROUTES.md does not match JSON store.");
  if (expectedFiles !== actualFiles)
    issues.push("FILES.md does not match JSON store.");

  const provider = resolveAiProvider(config);
  if (provider === "openai-api" && !process.env.OPENAI_API_KEY) {
    warnings.push("OPENAI_API_KEY is missing; AI mode will fail.");
  }
  if (
    provider === "codex-cli" &&
    !(await isCodexAvailable(config.codexCommand))
  ) {
    warnings.push(
      `Codex CLI is not available at \`${config.codexCommand}\`; AI mode will fail.`,
    );
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings,
    stale: warnings.some((warning) => warning.includes("stale")),
  };
}
