import { readFile } from "node:fs/promises";
import path from "node:path";
import { generateStructuredObject } from "./provider.js";
import { buildFileSummaryPrompt } from "./prompts.js";
import { FileSummaryAISchema, type FileSummaryAI } from "./schemas.js";
import type { RepotyConfig, StaticMetadata } from "../types/index.js";

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function pathTokens(filePath: string): string[] {
  return filePath
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function inferDomain(filePath: string, metadata: StaticMetadata): string {
  const tokens = new Set([
    ...pathTokens(filePath),
    ...metadata.entrypoints.map((v) => v.toLowerCase()),
  ]);
  if (
    ["auth", "login", "logout", "session", "cookie"].some((token) =>
      tokens.has(token),
    )
  )
    return "auth";
  if (["api", "route", "handler"].some((token) => tokens.has(token)))
    return "api";
  if (
    ["db", "database", "prisma", "schema", "model"].some((token) =>
      tokens.has(token),
    )
  )
    return "database";
  if (
    ["payment", "payments", "stripe", "checkout"].some((token) =>
      tokens.has(token),
    )
  )
    return "payments";
  if (["billing", "subscription", "invoice"].some((token) => tokens.has(token)))
    return "billing";
  if (["page", "layout", "component", "ui"].some((token) => tokens.has(token)))
    return "ui";
  if (["test", "spec"].some((token) => tokens.has(token))) return "tests";
  if (["config", "env"].some((token) => tokens.has(token))) return "config";
  if (
    ["state", "store", "context", "reducer"].some((token) => tokens.has(token))
  )
    return "state";
  return "utils";
}

function inferTags(filePath: string, metadata: StaticMetadata): string[] {
  const tags = new Set<string>();
  for (const token of pathTokens(filePath)) {
    if (
      [
        "auth",
        "api",
        "database",
        "db",
        "ui",
        "component",
        "config",
        "test",
        "state",
        "session",
        "cookie",
        "middleware",
        "route",
        "page",
      ].includes(token)
    ) {
      tags.add(token === "db" ? "database" : token);
    }
  }
  for (const entrypoint of metadata.entrypoints) tags.add(entrypoint);
  if (metadata.isTestFile) tags.add("tests");
  if (metadata.isConfigFile) tags.add("config");
  return [...tags].slice(0, 12);
}

function fallbackPurpose(filePath: string, metadata: StaticMetadata): string {
  const name = path.basename(filePath);
  if (metadata.entrypoints.includes("page"))
    return `Page entrypoint for ${name}.`;
  if (metadata.entrypoints.includes("layout"))
    return `Layout entrypoint for ${name}.`;
  if (
    metadata.entrypoints.includes("route-handler") ||
    metadata.entrypoints.includes("api-route")
  )
    return `API or route handler in ${name}.`;
  if (metadata.isTestFile) return `Test file covering behavior in ${name}.`;
  if (metadata.isConfigFile) return `Configuration file ${name}.`;
  if (metadata.exports.length > 0)
    return `Exports ${metadata.exports.slice(0, 3).join(", ")} for reuse.`;
  return `Support file for ${name}.`;
}

function safeChunk(
  content: string,
  metadata: StaticMetadata,
  maxBytes: number,
): string {
  const byteLength = Buffer.byteLength(content, "utf8");
  if (byteLength <= Math.min(20000, maxBytes)) return content;
  if (byteLength > maxBytes) {
    return [
      `imports: ${JSON.stringify(metadata.imports)}`,
      `exports: ${JSON.stringify(metadata.exports)}`,
      `functions: ${JSON.stringify(metadata.functions)}`,
      `classes: ${JSON.stringify(metadata.classes)}`,
    ].join("\n");
  }

  const interestingLines = content
    .split(/\r?\n/)
    .filter((line) =>
      /^(import|export|async function|function|class|const\s+[A-Za-z0-9_$]+\s*=\s*(async\s*)?\(|const\s+[A-Za-z0-9_$]+\s*=\s*(async\s*)?.*=>)/.test(
        line.trim(),
      ),
    )
    .slice(0, 240)
    .join("\n");
  return interestingLines || content.slice(0, Math.min(content.length, 20000));
}

export async function summarizeFileWithAI(input: {
  path: string;
  absolutePath: string;
  language: string;
  metadata: StaticMetadata;
  maxFileBytesForAi: number;
  model: string;
  enabled: boolean;
  config?: Pick<RepotyConfig, "aiProvider" | "codexCommand" | "codexTimeoutMs">;
}): Promise<FileSummaryAI> {
  if (!input.enabled) {
    const domain = inferDomain(input.path, input.metadata);
    return {
      purpose: fallbackPurpose(input.path, input.metadata),
      domain,
      tags: inferTags(input.path, input.metadata),
      usedFor: unique([
        input.metadata.entrypoints[0]
          ? `${input.metadata.entrypoints[0]} entrypoint`
          : "shared helper",
        input.metadata.isTestFile ? "tests" : "implementation",
      ]).slice(0, 8),
      warnings: input.metadata.warnings.slice(0, 5),
      summaryConfidence: 0.45,
    };
  }

  const content = await readFile(input.absolutePath, "utf8");
  const safeContent = safeChunk(
    content,
    input.metadata,
    input.maxFileBytesForAi,
  );
  return generateStructuredObject({
    model: input.model,
    schema: FileSummaryAISchema,
    config: input.config,
    prompt: buildFileSummaryPrompt({
      path: input.path,
      language: input.language,
      imports: input.metadata.imports,
      exports: input.metadata.exports,
      functions: input.metadata.functions,
      classes: input.metadata.classes,
      safeContent,
    }),
  });
}
