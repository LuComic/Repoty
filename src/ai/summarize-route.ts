import { generateStructuredObject } from "./provider.js";
import { buildRouteSummaryPrompt } from "./prompts.js";
import { RouteSummaryAISchema, type RouteSummaryAI } from "./schemas.js";

import type { RepotyConfig } from "../types/index.js";

export async function summarizeRouteWithAI(input: {
  name: string;
  files: string[];
  filePurposes: string[];
  model: string;
  enabled: boolean;
  config?: Pick<RepotyConfig, "aiProvider" | "codexCommand" | "codexTimeoutMs">;
}): Promise<RouteSummaryAI | null> {
  if (!input.enabled) return null;
  return generateStructuredObject({
    model: input.model,
    schema: RouteSummaryAISchema,
    config: input.config,
    prompt: buildRouteSummaryPrompt({
      name: input.name,
      files: input.files,
      filePurposes: input.filePurposes,
    }),
  });
}
