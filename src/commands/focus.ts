import { focusStore } from "../core/focus.js";
import { loadIndexedContext } from "./_shared.js";

export async function runFocus(task: string, limit = 5) {
  const { store } = await loadIndexedContext();
  return focusStore(store, task, { limit });
}
