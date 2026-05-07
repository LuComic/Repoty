import { scoreRelatedFiles } from "../core/graph.js";
import { searchStore } from "../core/search.js";
import { loadIndexedContext } from "./_shared.js";

export async function runExplain(target: string) {
  const { store } = await loadIndexedContext();
  const route = store.routes[target.toLowerCase()];
  if (route) {
    return {
      type: "route",
      target: route.name,
      readingPath: route.recommendedReadingOrder
        .slice(0, 8)
        .map((filePath, index) => ({
          path: filePath,
          why:
            index === 0
              ? "Start with an entrypoint or highest-importance file."
              : (store.files[filePath]?.purpose ?? "Related route file."),
        })),
    };
  }

  const file =
    store.files[target] ??
    store.files[
      Object.keys(store.files).find((path) =>
        path.endsWith(target.replace(/^\.\//, "")),
      ) ?? ""
    ];
  if (file) {
    return {
      type: "file",
      target: file.path,
      readingPath: [
        { path: file.path, why: file.purpose },
        ...scoreRelatedFiles(file.path, store.graph.edges, 6).map((item) => ({
          path: item.path,
          why: item.reasons.join("; "),
        })),
      ],
    };
  }

  const results = searchStore(store, target, 6);
  return {
    type: "query",
    target,
    readingPath: results.map((result) =>
      result.type === "file"
        ? {
            path: result.path,
            why: `${result.purpose} [score ${result.score}]`,
          }
        : {
            path: result.name,
            why: `${result.purpose} [route score ${result.score}]`,
          },
    ),
  };
}
