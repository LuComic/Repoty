import { RepotyError } from "../core/config.js";
import { loadIndexedContext } from "./_shared.js";

export async function runRoute(name: string) {
  const { store } = await loadIndexedContext();
  const route = store.routes[name.toLowerCase()];
  if (!route) throw new RepotyError(`Route not found: ${name}`, 1);
  return {
    ...route,
    coreFiles: route.files.slice(0, 8).map((filePath) => ({
      path: filePath,
      purpose: store.files[filePath]?.purpose ?? "",
    })),
  };
}
