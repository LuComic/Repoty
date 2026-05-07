import { searchStore } from "../core/search.js";
import { loadIndexedContext } from "./_shared.js";

export async function runFind(query: string, limit = 10) {
  const { store } = await loadIndexedContext();
  return {
    query,
    results: searchStore(store, query, limit),
  };
}
