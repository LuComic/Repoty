import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { RepotyError } from "../core/config.js";
import { loadContext } from "./_shared.js";

export type IntegrationTarget = "agents" | "claude" | "cursor";

const START_MARKER = "<!-- repoty:start -->";
const END_MARKER = "<!-- repoty:end -->";

export type IntegrationResult = {
  target: IntegrationTarget;
  path: string;
  action: "created" | "updated" | "unchanged";
};

function normalizeTarget(target: string): IntegrationTarget[] {
  switch (target) {
    case "all":
      return ["agents", "claude", "cursor"];
    case "agents":
    case "claude":
    case "cursor":
      return [target];
    default:
      throw new RepotyError(
        `Unknown integration target: ${target}. Expected agents, claude, cursor, or all.`,
        2,
      );
  }
}

function targetPath(projectRoot: string, target: IntegrationTarget): string {
  switch (target) {
    case "agents":
      return path.join(projectRoot, "AGENTS.md");
    case "claude":
      return path.join(projectRoot, "CLAUDE.md");
    case "cursor":
      return path.join(projectRoot, ".cursor", "rules", "repoty.mdc");
  }
}

function repotyBlock(outDir: string): string {
  const normalizedOutDir = outDir.replace(/\\/g, "/").replace(/\/$/, "");
  return `${START_MARKER}
## Repoty context

Repoty has indexed this repository in \`${normalizedOutDir}/\`.

For broad, unfamiliar, or cross-file tasks, run a targeted query before wide source reads:

- \`repoty focus "<task>"\` — first choice; returns start files, likely tests, and areas to ignore
- \`repoty explain <target>\` — use when you already know a route or file
- \`repoty find <query>\` — use for quick mapped file/route search
- \`repoty status\` — check whether the map is stale

Only open \`${normalizedOutDir}/agent/SITEMAP.md\` for architecture-level orientation. Do not read the full generated file index unless a targeted command is insufficient.
${END_MARKER}`;
}

function initialContent(target: IntegrationTarget, block: string): string {
  if (target === "cursor") {
    return `---
description: Use targeted repoty context before wide source reads
alwaysApply: true
---

${block}
`;
  }
  return `${block}
`;
}

function upsertMarkedBlock(existing: string, block: string): string {
  const start = existing.indexOf(START_MARKER);
  const end = existing.indexOf(END_MARKER);

  if (start >= 0 && end >= 0 && end > start) {
    const afterEnd = end + END_MARKER.length;
    return `${existing.slice(0, start)}${block}${existing.slice(afterEnd)}`;
  }

  const separator = existing.endsWith("\n") ? "\n" : "\n\n";
  return `${existing}${separator}${block}\n`;
}

async function readExisting(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function integrateOne(input: {
  projectRoot: string;
  outDir: string;
  target: IntegrationTarget;
}): Promise<IntegrationResult> {
  const filePath = targetPath(input.projectRoot, input.target);
  const block = repotyBlock(input.outDir);
  const existing = await readExisting(filePath);
  const next =
    existing === undefined
      ? initialContent(input.target, block)
      : upsertMarkedBlock(existing, block);

  if (existing === next) {
    return { target: input.target, path: filePath, action: "unchanged" };
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, next, "utf8");
  return {
    target: input.target,
    path: filePath,
    action: existing === undefined ? "created" : "updated",
  };
}

export async function runIntegrate(target = "all") {
  const { projectRoot, config } = await loadContext();
  const targets = normalizeTarget(target);
  const results: IntegrationResult[] = [];
  for (const integrationTarget of targets) {
    results.push(
      await integrateOne({
        projectRoot,
        outDir: config.outDir,
        target: integrationTarget,
      }),
    );
  }
  return { projectRoot, results };
}
