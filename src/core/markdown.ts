import type { FileSummary, RouteSummary } from "../types/index.js";

function title(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function renderSitemapMarkdown(
  routes: Record<string, RouteSummary>,
  files: Record<string, FileSummary>,
): string {
  const sections = Object.values(routes)
    .map((route) => {
      const startHere =
        route.entrypoints
          .slice(0, 3)
          .map((file) => `\`${file}\``)
          .join(", ") || "None";
      const core = route.files
        .slice(0, 4)
        .map(
          (filePath) =>
            `- \`${filePath}\` — ${files[filePath]?.purpose ?? "No summary."}`,
        )
        .join("\n");
      const related =
        route.relatedRoutes.slice(0, 4).map(title).join(", ") || "None";

      return `## ${route.title}\n${route.purpose}\n\nStart: ${startHere}\n\nFiles:\n${core || "- None"}\n\nRelated: ${related}`;
    })
    .join("\n\n");

  return `# Repo Sitemap\n\nCompact navigation map. Use this to choose files/routes, then read only the relevant source. For targeted search use \`repoty find <query>\`; for a reading path use \`repoty explain <target>\`.\n\n${sections}\n`;
}

export function renderRoutesMarkdown(
  routes: Record<string, RouteSummary>,
): string {
  const body = Object.values(routes)
    .map((route) => {
      const entrypoints =
        route.entrypoints
          .slice(0, 6)
          .map((file) => `\`${file}\``)
          .join(", ") || "None";
      const readingOrder =
        route.recommendedReadingOrder
          .slice(0, 8)
          .map((file) => `\`${file}\``)
          .join(" → ") || "None";
      const related =
        route.relatedRoutes.slice(0, 6).map(title).join(", ") || "None";
      return `## ${route.title}\n${route.purpose}\n\nEntrypoints: ${entrypoints}\n\nReading order: ${readingOrder}\n\nRelated: ${related}`;
    })
    .join("\n\n");

  return `# Routes\n\n${body}\n`;
}

export function renderFilesMarkdown(
  files: Record<string, FileSummary>,
): string {
  const body = Object.values(files)
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((file) => {
      const route = title(file.primaryRoute || file.domain || "utils");
      const exports = file.exports.slice(0, 8).join(", ") || "None";
      const related =
        file.relatedFiles
          .slice(0, 5)
          .map((related) => `\`${related}\``)
          .join(", ") || "None";
      return `- \`${file.path}\` [${route}] — ${file.purpose} Exports: ${exports}. Related: ${related}.`;
    })
    .join("\n");

  return `# File Index\n\nCompact file index. Prefer \`SITEMAP.md\`, \`repoty find\`, or \`repoty explain\` before reading this whole file.\n\n${body}\n`;
}

export function renderRouteMarkdown(
  route: RouteSummary,
  files: Record<string, FileSummary>,
): string {
  return `# ${route.title}\n\nPurpose: ${route.purpose}\n\nEntrypoints:\n${route.entrypoints.map((file) => `- \`${file}\``).join("\n") || "- None"}\n\nCore files:\n${
    route.files
      .slice(0, 12)
      .map(
        (filePath) =>
          `- \`${filePath}\` — ${files[filePath]?.purpose ?? "No summary."}`,
      )
      .join("\n") || "- None"
  }\n\nReading order:\n${route.recommendedReadingOrder.map((file) => `- \`${file}\``).join("\n") || "- None"}\n`;
}
