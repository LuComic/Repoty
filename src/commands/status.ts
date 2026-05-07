import { detectDiff } from "../core/indexer.js";
import { scanFiles } from "../core/scan.js";
import { loadIndexedContext } from "./_shared.js";

export async function runStatus() {
  const { projectRoot, config, store } = await loadIndexedContext();
  const scannedFiles = await scanFiles(projectRoot, config, {
    allFiles: store.manifest.allFiles,
  });
  const { diff } = await detectDiff(scannedFiles, store.hashes);
  return {
    indexedFiles: Object.keys(store.files).length,
    changedFiles: diff.changedFiles,
    newFiles: diff.newFiles,
    deletedFiles: diff.deletedFiles,
    unchangedFiles: diff.unchangedFiles,
    lastUpdateTime: store.manifest.generatedAt,
    stale:
      diff.changedFiles.length > 0 ||
      diff.newFiles.length > 0 ||
      diff.deletedFiles.length > 0,
  };
}
