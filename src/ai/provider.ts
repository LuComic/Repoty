import { execFile, spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { RepotyError } from "../core/config.js";
import type { AiProvider, RepotyConfig } from "../types/index.js";

const execFileAsync = promisify(execFile);

async function spawnCommand(
  command: string,
  args: string[],
  timeout: number,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      fn();
    };

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => finish(() => reject(error)));
    child.on("close", (code) =>
      finish(() => resolve({ stdout, stderr, exitCode: code ?? 0 })),
    );

    timer = setTimeout(() => {
      child.kill("SIGTERM");
      finish(() =>
        reject(
          new RepotyError(`Codex CLI call timed out after ${timeout}ms`, 5),
        ),
      );
    }, timeout);
  });
}

export function resolveAiProvider(
  config?: Pick<RepotyConfig, "aiProvider">,
): Exclude<AiProvider, "auto"> {
  if (config?.aiProvider === "openai-api") return "openai-api";
  if (config?.aiProvider === "codex-cli") return "codex-cli";
  return "codex-cli";
}

export async function getOpenAIModel(modelName: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new RepotyError("Missing OPENAI_API_KEY", 5);
  }

  const [{ createOpenAI }] = await Promise.all([import("@ai-sdk/openai")]);
  const openai = createOpenAI({
    apiKey,
    ...(process.env.OPENAI_BASE_URL
      ? { baseURL: process.env.OPENAI_BASE_URL }
      : {}),
  });
  return openai(modelName);
}

export async function isCodexAvailable(command = "codex"): Promise<boolean> {
  try {
    await execFileAsync(command, ["--version"], {
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}

export function extractJsonObjectText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new RepotyError("AI provider returned empty output", 5);
  }

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) return fenced[1].trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        return raw.slice(start, index + 1).trim();
      }
    }
  }

  throw new RepotyError("Could not extract JSON object from Codex output", 5);
}

async function generateWithCodex<T>(input: {
  prompt: string;
  schema: z.ZodType<T>;
  config?: Pick<RepotyConfig, "codexCommand" | "codexTimeoutMs">;
}): Promise<T> {
  const command = input.config?.codexCommand || "codex";
  const timeout = input.config?.codexTimeoutMs ?? 120000;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "repoty-codex-"));
  const outputFile = path.join(tempDir, "output.txt");

  try {
    await writeFile(outputFile, "", "utf8");
    const prompt = `${input.prompt}\n\nReturn only one JSON object. Do not include markdown fences, prose, or explanations.`;

    const { stdout, stderr, exitCode } = await spawnCommand(
      command,
      [
        "exec",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--color",
        "never",
        "--output-last-message",
        outputFile,
        prompt,
      ],
      timeout,
    );

    const fileOutput = await readFile(outputFile, "utf8").catch(() => "");
    const raw = `${fileOutput}\n${stdout}\n${stderr}`.trim();
    if (exitCode !== 0) {
      throw new RepotyError(
        `Codex CLI call failed: ${raw || `exit code ${exitCode}`}`,
        5,
      );
    }
    const jsonText = extractJsonObjectText(raw);
    return input.schema.parse(JSON.parse(jsonText));
  } catch (error) {
    if (error instanceof RepotyError) throw error;
    if (error instanceof z.ZodError) {
      throw new RepotyError(
        `Codex output did not match schema: ${error.message}`,
        5,
      );
    }
    if (error instanceof SyntaxError) {
      throw new RepotyError(
        `Codex output was not valid JSON: ${error.message}`,
        5,
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new RepotyError(`Codex CLI call failed: ${message}`, 5);
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function generateStructuredObject<T>(input: {
  schema: z.ZodType<T>;
  prompt: string;
  model: string;
  config?: Pick<RepotyConfig, "aiProvider" | "codexCommand" | "codexTimeoutMs">;
}): Promise<T> {
  const provider = resolveAiProvider(input.config);

  if (provider === "openai-api") {
    const [{ generateObject }, model] = await Promise.all([
      import("ai"),
      getOpenAIModel(input.model),
    ]);
    const response = await generateObject({
      model,
      schema: input.schema,
      prompt: input.prompt,
    });
    return response.object;
  }

  return generateWithCodex({
    prompt: input.prompt,
    schema: input.schema,
    config: input.config,
  });
}
