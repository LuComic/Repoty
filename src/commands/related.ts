import { scoreRelatedFiles } from "../core/graph.js";
import { loadIndexedContext, resolveStoredFilePath } from "./_shared.js";

export async function runRelated(inputPath: string, limit = 10) {
  const { store } = await loadIndexedContext();
  const filePath = resolveStoredFilePath(inputPath, Object.keys(store.files));
  const related = scoreRelatedFiles(filePath, store.graph.edges, limit);
  return {
    path: filePath,
    related,
  };
}
