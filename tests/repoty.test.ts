import { describe, expect, test } from "bun:test";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { extractStaticMetadata } from "../src/ast/generic.js";
import {
  extractJsonObjectText,
  resolveAiProvider,
} from "../src/ai/provider.js";
import { FileSummaryAISchema } from "../src/ai/schemas.js";
import { DEFAULT_CONFIG, RepotyConfigSchema } from "../src/core/config.js";
import { buildGraph, scoreRelatedFiles } from "../src/core/graph.js";
import { detectDiff, indexProject } from "../src/core/indexer.js";
import { runIntegrate } from "../src/commands/integrate.js";
import { hashBuffer } from "../src/core/hash.js";
import {
  renderFilesMarkdown,
  renderSitemapMarkdown,
} from "../src/core/markdown.js";
import { assignRoutes, buildRoutes } from "../src/core/routes.js";
import {
  isNeverIndexPath,
  readGitignore,
  scanFiles,
} from "../src/core/scan.js";

const fixtures = path.resolve("tests/fixtures");

async function copyFixture(name: string): Promise<string> {
  const tempParent = await mkdtemp(path.join(os.tmpdir(), "repoty-"));
  const tempDir = path.join(tempParent, name);
  await cp(path.join(fixtures, name), tempDir, { recursive: true });
  return tempDir;
}

describe("config", () => {
  test("default config is valid", () => {
    expect(() => RepotyConfigSchema.parse(DEFAULT_CONFIG)).not.toThrow();
    expect(DEFAULT_CONFIG.aiProvider).toBe("codex-cli");
    expect(DEFAULT_CONFIG.codexCommand).toBe("codex");
    expect(DEFAULT_CONFIG.include[0]).toContain("svelte");
    expect(DEFAULT_CONFIG.include[0]).toContain("tsx");
    expect(DEFAULT_CONFIG.include[0]).toContain("py");
  });
});

describe("ai provider", () => {
  test("extracts JSON from codex output", () => {
    const raw =
      'Some text\n```json\n{\n  "purpose": "Handles auth",\n  "domain": "auth",\n  "tags": [],\n  "usedFor": [],\n  "warnings": [],\n  "summaryConfidence": 0.9\n}\n```\n';
    expect(extractJsonObjectText(raw)).toContain('"purpose": "Handles auth"');
  });

  test("resolves provider from config", () => {
    expect(resolveAiProvider({ aiProvider: "openai-api" })).toBe("openai-api");
    expect(resolveAiProvider({ aiProvider: "codex-cli" })).toBe("codex-cli");
    expect(resolveAiProvider()).toBe("codex-cli");
  });
});

describe("scan", () => {
  test("built-in ignores and .gitignore are respected", async () => {
    const root = await copyFixture("simple-ts");
    const files = await scanFiles(root, DEFAULT_CONFIG);
    const paths = files.map((file) => file.path);
    expect(paths).toContain("src/auth/session.ts");
    expect(paths).not.toContain("ignored.ts");
    expect(paths).not.toContain(".env");
    expect(paths).toContain("src/tool.py");
    expect(isNeverIndexPath(".env")).toBe(true);
    expect(await readGitignore(root)).toContain("ignored.ts");
    await rm(root, { recursive: true, force: true });
  });

  test("all-files mode includes broader text files", async () => {
    const root = await copyFixture("simple-ts");
    await writeFile(path.join(root, "notes.txt"), "plain text\n", "utf8");
    const files = await scanFiles(root, DEFAULT_CONFIG, { allFiles: true });
    const paths = files.map((file) => file.path);
    expect(paths).toContain("src/tool.py");
    expect(paths).toContain("notes.txt");
    expect(paths).not.toContain(".env");
    await rm(root, { recursive: true, force: true });
  });

  test("custom output directories are not indexed", async () => {
    const root = await copyFixture("simple-ts");
    await mkdir(path.join(root, "custom-repoty", "data"), { recursive: true });
    await writeFile(
      path.join(root, "custom-repoty", "data", "files.json"),
      "{}\n",
      "utf8",
    );
    const files = await scanFiles(
      root,
      { ...DEFAULT_CONFIG, outDir: "./custom-repoty" },
      { allFiles: true },
    );
    const paths = files.map((file) => file.path);
    expect(paths).not.toContain("custom-repoty/data/files.json");
    await rm(root, { recursive: true, force: true });
  });
});

describe("hashing and diffing", () => {
  test("hashes are deterministic", () => {
    expect(hashBuffer(Buffer.from("abc"))).toBe(hashBuffer(Buffer.from("abc")));
  });

  test("new changed deleted detection works", async () => {
    const root = await copyFixture("simple-ts");
    const firstScan = await scanFiles(root, DEFAULT_CONFIG);
    const firstIndex = await indexProject({
      projectRoot: root,
      config: DEFAULT_CONFIG,
      noAi: true,
      all: true,
    });

    await writeFile(
      path.join(root, "src/auth/session.ts"),
      "export function changed() { return true; }\n",
      "utf8",
    );
    await writeFile(
      path.join(root, "src/new-file.ts"),
      "export const created = true;\n",
      "utf8",
    );
    await rm(path.join(root, "src/auth/cookies.ts"));

    const secondScan = await scanFiles(root, DEFAULT_CONFIG);
    const { diff } = await detectDiff(secondScan, firstIndex.store.hashes);
    expect(diff.changedFiles).toContain("src/auth/session.ts");
    expect(diff.newFiles).toContain("src/new-file.ts");
    expect(diff.deletedFiles).toContain("src/auth/cookies.ts");
    expect(firstScan.length).toBeGreaterThan(0);
    await rm(root, { recursive: true, force: true });
  });

  test("all-files mode is preserved on incremental updates", async () => {
    const root = await copyFixture("simple-ts");
    await writeFile(path.join(root, "notes.txt"), "plain text\n", "utf8");
    const firstIndex = await indexProject({
      projectRoot: root,
      config: DEFAULT_CONFIG,
      noAi: true,
      all: true,
      allFiles: true,
    });
    expect(firstIndex.store.files["notes.txt"]).toBeDefined();
    expect(firstIndex.store.manifest.allFiles).toBe(true);

    const secondIndex = await indexProject({
      projectRoot: root,
      config: DEFAULT_CONFIG,
      previousStore: firstIndex.store,
      noAi: true,
    });
    expect(secondIndex.store.files["notes.txt"]).toBeDefined();
    expect(secondIndex.diff.deletedFiles).not.toContain("notes.txt");
    await rm(root, { recursive: true, force: true });
  });
});

describe("metadata extraction", () => {
  test("extracts imports exports functions classes and entrypoints", () => {
    const content = `import x from "./x";\nexport function alpha() {}\nexport class Beta {}\nconst gamma = () => {};`;
    const metadata = extractStaticMetadata(
      "app/api/users/route.ts",
      content,
      "typescript",
    );
    expect(metadata.imports).toContain("./x");
    expect(metadata.exports).toContain("alpha");
    expect(metadata.classes).toContain("Beta");
    expect(metadata.functions).toContain("alpha");
    expect(metadata.entrypoints).toContain("route-handler");
  });
});

describe("graph, routes, markdown", () => {
  test("graph edges and related scoring are created", async () => {
    const root = await copyFixture("simple-ts");
    const { store } = await indexProject({
      projectRoot: root,
      config: DEFAULT_CONFIG,
      noAi: true,
      all: true,
    });
    const edges = buildGraph(store.files);
    expect(edges.some((edge) => edge.type === "imports")).toBe(true);
    const related = scoreRelatedFiles("src/auth/session.ts", edges, 5);
    expect(related.some((item) => item.path === "src/auth/cookies.ts")).toBe(
      true,
    );
    await rm(root, { recursive: true, force: true });
  });

  test("route clustering detects next and auth domains", async () => {
    const root = await copyFixture("next-app");
    const { store } = await indexProject({
      projectRoot: root,
      config: DEFAULT_CONFIG,
      noAi: true,
      all: true,
    });
    const routes = buildRoutes(
      assignRoutes(store.files),
      store.graph.edges,
      DEFAULT_CONFIG.routes.minClusterSize,
    );
    expect(Object.keys(routes)).toContain("api");
    expect(Object.keys(routes)).toContain("ui");
    await rm(root, { recursive: true, force: true });
  });

  test("markdown generation is stable", async () => {
    const root = await copyFixture("simple-ts");
    const { store } = await indexProject({
      projectRoot: root,
      config: DEFAULT_CONFIG,
      noAi: true,
      all: true,
    });
    const sitemap = renderSitemapMarkdown(store.routes, store.files);
    const filesMd = renderFilesMarkdown(store.files);
    expect(sitemap).toContain("# Repo Sitemap");
    expect(filesMd).toContain("# File Index");
    expect(sitemap).toContain("Auth");
    await rm(root, { recursive: true, force: true });
  });
});

describe("integrations", () => {
  test("creates and safely updates agent instruction files", async () => {
    const root = await copyFixture("simple-ts");
    const previousCwd = process.cwd();
    process.chdir(root);
    try {
      const first = await runIntegrate("all");
      expect(first.results.map((item) => item.target).sort()).toEqual([
        "agents",
        "claude",
        "cursor",
      ]);
      expect(first.results.every((item) => item.action === "created")).toBe(true);

      const agentsPath = path.join(root, "AGENTS.md");
      const cursorPath = path.join(root, ".cursor", "rules", "repoty.mdc");
      const agents = await readFile(agentsPath, "utf8");
      const cursor = await readFile(cursorPath, "utf8");
      expect(agents).toContain("<!-- repoty:start -->");
      expect(agents).toContain(".repoty/agent/SITEMAP.md");
      expect(cursor).toContain("alwaysApply: true");

      await writeFile(
        agentsPath,
        `${agents}\nProject-specific instructions stay here.\n`,
        "utf8",
      );
      const second = await runIntegrate("agents");
      expect(second.results[0].action).toBe("unchanged");
      const updatedAgents = await readFile(agentsPath, "utf8");
      expect(updatedAgents).toContain("Project-specific instructions stay here.");
      expect(updatedAgents.match(/<!-- repoty:start -->/g)?.length).toBe(1);
    } finally {
      process.chdir(previousCwd);
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("schemas", () => {
  test("file AI schema validates structured data", () => {
    const parsed = FileSummaryAISchema.parse({
      purpose: "Handles sessions.",
      domain: "auth",
      tags: ["auth", "session"],
      usedFor: ["login flow"],
      warnings: [],
      summaryConfidence: 0.8,
    });
    expect(parsed.domain).toBe("auth");
  });
});
