import path from "node:path";
import type { StaticMetadata } from "../types/index.js";

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function collectMatches(
  text: string,
  regex: RegExp,
  mapper: (match: RegExpExecArray) => string | null,
): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const value = mapper(match);
    if (value) results.push(value.trim());
  }
  return unique(results);
}

export function detectEntrypoints(filePath: string): string[] {
  const normalized = filePath.replace(/\\/g, "/");
  const entrypoints: string[] = [];

  if (/^app\/.+\/page\.(t|j)sx?$/.test(normalized)) entrypoints.push("page");
  if (/^app\/.+\/layout\.(t|j)sx?$/.test(normalized))
    entrypoints.push("layout");
  if (/^app\/.+\/route\.(t|j)sx?$/.test(normalized))
    entrypoints.push("route-handler");
  if (/^pages\/api\//.test(normalized)) entrypoints.push("api-route");
  if (/(^|\/)middleware\.(t|j)sx?$/.test(normalized))
    entrypoints.push("middleware");
  if (
    /(^|\/)(next|vite|vitest|jest|tailwind|eslint|prettier|tsconfig)(\.|$)/.test(
      path.basename(normalized),
    )
  ) {
    entrypoints.push("config");
  }
  if (
    /\.test\.(t|j)sx?$/.test(normalized) ||
    /\.spec\.(t|j)sx?$/.test(normalized) ||
    /__tests__\//.test(normalized)
  ) {
    entrypoints.push("test");
  }
  return unique(entrypoints);
}

export function extractStaticMetadata(
  filePath: string,
  content: string,
  language: string,
): StaticMetadata {
  const imports = collectMatches(
    content,
    /(?:import\s+[^;]*?from\s+["']([^"']+)["']|export\s+[^;]*?from\s+["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)|import\(\s*["']([^"']+)["']\s*\))/g,
    (match) => match[1] || match[2] || match[3] || match[4] || null,
  );

  const directExports = collectMatches(
    content,
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)|export\s+class\s+([A-Za-z0-9_$]+)|export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)|export\s+(?:interface|type|enum)\s+([A-Za-z0-9_$]+)/g,
    (match) => match[1] || match[2] || match[3] || match[4] || null,
  );

  const groupedExports = collectMatches(
    content,
    /export\s*\{([^}]+)\}/g,
    (match) => match[1] || null,
  ).flatMap((group) =>
    group
      .split(",")
      .map(
        (part) =>
          part.trim().split(/\s+as\s+/i)[1] ??
          part.trim().split(/\s+as\s+/i)[0],
      )
      .filter(Boolean),
  );

  const commonJsExports = collectMatches(
    content,
    /exports\.([A-Za-z0-9_$]+)\s*=|module\.exports\s*=\s*\{([^}]+)\}/g,
    (match) => match[1] || match[2] || null,
  ).flatMap((value) =>
    value.includes(",")
      ? value.split(",").map((part) => part.trim().replace(/:.*$/, ""))
      : [value],
  );

  const functions = collectMatches(
    content,
    /(?:async\s+)?function\s+([A-Za-z0-9_$]+)|(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/g,
    (match) => match[1] || match[2] || null,
  );

  const classes = collectMatches(
    content,
    /class\s+([A-Za-z0-9_$]+)/g,
    (match) => match[1] || null,
  );
  const interfaces = collectMatches(
    content,
    /interface\s+([A-Za-z0-9_$]+)/g,
    (match) => match[1] || null,
  );
  const types = collectMatches(
    content,
    /type\s+([A-Za-z0-9_$]+)/g,
    (match) => match[1] || null,
  );

  const warnings: string[] = [];
  if (content.length > 80000)
    warnings.push("Large file; AI input will be truncated or metadata-only.");
  if (/process\.env\./.test(content))
    warnings.push("Uses environment variables.");

  return {
    language,
    imports,
    exports: unique([...directExports, ...groupedExports, ...commonJsExports]),
    functions,
    classes,
    interfaces,
    types,
    entrypoints: detectEntrypoints(filePath),
    warnings,
    isTestFile:
      /\.test\.(t|j)sx?$/.test(filePath) ||
      /\.spec\.(t|j)sx?$/.test(filePath) ||
      /__tests__\//.test(filePath),
    isConfigFile:
      /(config|\.config|tsconfig|package\.json|bunfig)\./.test(
        path.basename(filePath),
      ) || filePath === "package.json",
  };
}
