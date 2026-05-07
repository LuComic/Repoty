import { loadConfig, RepotyError } from "../core/config.js";
import { findProjectRoot } from "../core/project-root.js";
import { loadStore } from "../core/store.js";

export async function loadContext(start = process.cwd()) {
  const projectRoot = await findProjectRoot(start);
  const config = await loadConfig(projectRoot);
  return { projectRoot, config };
}

export async function loadIndexedContext(start = process.cwd()) {
  const { projectRoot, config } = await loadContext(start);
  const store = await loadStore(projectRoot, config);
  return { projectRoot, config, store };
}

export function resolveStoredFilePath(
  inputPath: string,
  knownPaths: string[],
): string {
  const normalized = inputPath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (knownPaths.includes(normalized)) return normalized;
  const found = knownPaths.find((value) => value.endsWith(normalized));
  if (!found) throw new RepotyError(`File not found in index: ${inputPath}`, 1);
  return found;
}
