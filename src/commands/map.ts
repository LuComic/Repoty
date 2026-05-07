import { loadIndexedContext } from "./_shared.js";

export async function runMap() {
  const { store } = await loadIndexedContext();
  return Object.values(store.routes).map((route) => ({
    name: route.name,
    title: route.title,
    purpose: route.purpose,
    files: route.files.length,
    entrypoints: route.entrypoints,
    relatedRoutes: route.relatedRoutes,
  }));
}
