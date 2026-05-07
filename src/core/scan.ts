import { open, readFile, stat } from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import ignore from "ignore";
import type { RepotyConfig, ScanResult } from "../types/index.js";

const SECRET_OR_NEVER_INDEX_PATTERNS = [
  /^node_modules\//,
  /^\.git\//,
  /^\.repoty\//,
  /^dist\//,
  /^build\//,
  /^\.next\//,
  /^coverage\//,
  /^\.cache\//,
  /(^|\/)\.env(\..+)?$/,
  /\.pem$/,
  /\.key$/,
  /\.cert$/,
  /\.min\.js$/,
  /\.map$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
];

export function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

const LIKELY_BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".tar",
  ".tgz",
  ".7z",
  ".rar",
  ".mp3",
  ".wav",
  ".mp4",
  ".mov",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".wasm",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".bin",
  ".class",
  ".jar",
  ".pyc",
  ".svgz",
  ".sqlite",
  ".db",
  ".lockb",
]);

export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".ts":
      return "typescript";
    case ".tsx":
      return "tsx";
    case ".js":
      return "javascript";
    case ".jsx":
      return "jsx";
    case ".mjs":
      return "mjs";
    case ".cjs":
      return "cjs";
    case ".json":
      return "json";
    case ".md":
      return "markdown";
    case ".css":
      return "css";
    case ".scss":
      return "scss";
    case ".html":
      return "html";
    case ".svelte":
      return "svelte";
    default:
      return ext.replace(/^\./, "") || "text";
  }
}

export function isLikelyBinaryPath(filePath: string): boolean {
  return LIKELY_BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function isTextLikeFile(filePath: string): Promise<boolean> {
  if (isLikelyBinaryPath(filePath)) return false;

  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(4096);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    for (let index = 0; index < bytesRead; index += 1) {
      if (buffer[index] === 0) return false;
    }
    return true;
  } finally {
    await handle.close();
  }
}

export function isNeverIndexPath(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  return SECRET_OR_NEVER_INDEX_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );
}

function getOutDirIgnorePath(projectRoot: string, outDir: string): string {
  const relative = path.relative(projectRoot, path.resolve(projectRoot, outDir));
  return normalizePath(relative).replace(/^\.\//, "").replace(/\/$/, "");
}

function isInsideOutDir(filePath: string, outDirIgnorePath: string): boolean {
  return (
    outDirIgnorePath !== "" &&
    outDirIgnorePath !== ".." &&
    !outDirIgnorePath.startsWith("../") &&
    (filePath === outDirIgnorePath || filePath.startsWith(`${outDirIgnorePath}/`))
  );
}

export async function readGitignore(projectRoot: string): Promise<string[]> {
  const gitignorePath = path.join(projectRoot, ".gitignore");
  try {
    const raw = await readFile(gitignorePath, "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  } catch {
    return [];
  }
}

export async function scanFiles(
  projectRoot: string,
  config: RepotyConfig,
  options?: { allFiles?: boolean },
): Promise<ScanResult[]> {
  const gitignoreLines = await readGitignore(projectRoot);
  const ig = ignore();
  ig.add(config.exclude);
  ig.add(gitignoreLines);

  const matches = await fg(options?.allFiles ? ["**/*"] : config.include, {
    cwd: projectRoot,
    onlyFiles: true,
    dot: true,
    unique: true,
    followSymbolicLinks: false,
  });

  const results: ScanResult[] = [];
  const outDirIgnorePath = getOutDirIgnorePath(projectRoot, config.outDir);

  for (const match of matches) {
    const normalized = normalizePath(match);
    if (isInsideOutDir(normalized, outDirIgnorePath)) continue;
    if (ig.ignores(normalized)) continue;
    if (isNeverIndexPath(normalized)) continue;

    const absolutePath = path.join(projectRoot, match);
    try {
      const fileStat = await stat(absolutePath);
      if (!fileStat.isFile()) continue;
      if (options?.allFiles) {
        const textLike = await isTextLikeFile(absolutePath);
        if (!textLike) continue;
      }

      results.push({
        path: normalized,
        absolutePath,
        sizeBytes: fileStat.size,
        language: detectLanguage(normalized),
      });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (["ENOENT", "ENOTDIR", "EACCES", "EPERM"].includes(code ?? "")) {
        continue;
      }
      throw error;
    }
  }

  return results.sort((a, b) => a.path.localeCompare(b.path));
}
