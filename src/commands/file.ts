import { loadIndexedContext, resolveStoredFilePath } from "./_shared.js";

export async function runFile(inputPath: string) {
  const { store } = await loadIndexedContext();
  const filePath = resolveStoredFilePath(inputPath, Object.keys(store.files));
  const file = store.files[filePath];
  return {
    path: file.path,
    purpose: file.purpose,
    route: file.primaryRoute || file.domain,
    exports: file.exports,
    imports: file.imports,
    tags: file.tags,
    relatedFiles: file.relatedFiles,
    warnings: file.warnings,
    functions: file.functions,
    classes: file.classes,
    entrypoints: file.entrypoints,
    usedFor: file.usedFor,
  };
}
