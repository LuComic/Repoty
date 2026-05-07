import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { RepotyConfig } from "../types/index.js";

const LEGACY_DEFAULT_INCLUDE =
  "**/*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,scss,html}";
const PREVIOUS_DEFAULT_INCLUDE =
  "**/*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,scss,html,svelte}";
const CURRENT_DEFAULT_INCLUDE =
  "**/*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,scss,html,svelte,vue,yaml,yml,toml,xml,svg,graphql,gql,sh,bash,zsh,py,rb,php,go,rs,java,kt,kts,swift,c,h,cc,hh,cpp,hpp,cxx,cs,sql}";

function normalizeIncludePatterns(include: string[] | undefined): string[] {
  if (!include || include.length === 0) return [CURRENT_DEFAULT_INCLUDE];
  if (
    include.length === 1 &&
    [LEGACY_DEFAULT_INCLUDE, PREVIOUS_DEFAULT_INCLUDE].includes(include[0])
  ) {
    return [CURRENT_DEFAULT_INCLUDE];
  }
  return include;
}

export const DEFAULT_CONFIG: RepotyConfig = {
  version: 1,
  outDir: ".repoty",
  model: "gpt-4.1-mini",
  aiProvider: "codex-cli",
  codexCommand: "codex",
  codexTimeoutMs: 120000,
  include: [CURRENT_DEFAULT_INCLUDE],
  exclude: [
    "node_modules/**",
    ".git/**",
    ".repoty/**",
    "dist/**",
    "build/**",
    ".next/**",
    "coverage/**",
    ".cache/**",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "*.min.js",
    "*.map",
    ".env",
    ".env.*",
  ],
  maxFileBytesForAi: 80000,
  maxConcurrentAiCalls: 3,
  routes: {
    auto: true,
    minClusterSize: 2,
  },
};

export const RepotyConfigSchema = z.object({
  version: z.literal(1),
  outDir: z.string().min(1),
  model: z.string().min(1),
  aiProvider: z.enum(["auto", "openai-api", "codex-cli"]),
  codexCommand: z.string().min(1),
  codexTimeoutMs: z.number().int().positive(),
  include: z.array(z.string().min(1)).min(1),
  exclude: z.array(z.string().min(1)),
  maxFileBytesForAi: z.number().int().positive(),
  maxConcurrentAiCalls: z.number().int().positive(),
  routes: z.object({
    auto: z.boolean(),
    minClusterSize: z.number().int().positive(),
  }),
});

export class RepotyError extends Error {
  exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "RepotyError";
    this.exitCode = exitCode;
  }
}

export function getConfigPath(projectRoot: string): string {
  return path.join(projectRoot, ".repoty", "config.json");
}

export function resolveOutDir(
  projectRoot: string,
  config: RepotyConfig,
): string {
  return path.resolve(projectRoot, config.outDir);
}

export async function loadConfig(projectRoot: string): Promise<RepotyConfig> {
  const configPath = getConfigPath(projectRoot);
  try {
    const raw = await readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<RepotyConfig> & {
      routes?: Partial<RepotyConfig["routes"]>;
    };
    return RepotyConfigSchema.parse({
      ...DEFAULT_CONFIG,
      ...parsed,
      include: normalizeIncludePatterns(parsed.include),
      routes: { ...DEFAULT_CONFIG.routes, ...parsed.routes },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return structuredClone(DEFAULT_CONFIG);
    }
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      throw new RepotyError(`Invalid config: ${error.message}`, 2);
    }
    throw error;
  }
}

export async function writeConfig(
  projectRoot: string,
  config: RepotyConfig,
): Promise<void> {
  const configPath = getConfigPath(projectRoot);
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(
    configPath,
    `${JSON.stringify(RepotyConfigSchema.parse(config), null, 2)}\n`,
    "utf8",
  );
}

export async function initConfig(
  projectRoot: string,
  overrides: Partial<RepotyConfig> = {},
): Promise<RepotyConfig> {
  const config: RepotyConfig = {
    ...structuredClone(DEFAULT_CONFIG),
    ...overrides,
    include: normalizeIncludePatterns(
      overrides.include ?? DEFAULT_CONFIG.include,
    ),
    routes: {
      ...DEFAULT_CONFIG.routes,
      ...overrides.routes,
    },
  };
  await writeConfig(projectRoot, config);
  return config;
}
