import { indexProject } from "../core/indexer.js";
import { createLogger } from "../core/logger.js";
import type { AiProvider } from "../types/index.js";
import { loadContext } from "./_shared.js";
import { loadStore, writeStore } from "../core/store.js";

export async function runUpdate(options: {
  all?: boolean;
  dryRun?: boolean;
  noAi?: boolean;
  verbose?: boolean;
  aiProvider?: AiProvider;
  key?: boolean;
  silent?: boolean;
  allFiles?: boolean;
}) {
  const { projectRoot, config: loadedConfig } = await loadContext();
  const config = {
    ...loadedConfig,
    ...(options.aiProvider ? { aiProvider: options.aiProvider } : {}),
    ...(options.key ? { aiProvider: "openai-api" as AiProvider } : {}),
  };
  const previousStore = await loadStore(projectRoot, loadedConfig);
  const logger = createLogger(
    Boolean(options.verbose),
    Boolean(options.silent),
  );
  const { store, diff } = await indexProject({
    projectRoot,
    config,
    previousStore,
    noAi: options.noAi,
    all: options.all,
    allFiles: options.allFiles,
    logger,
  });

  if (!options.dryRun) {
    await writeStore(projectRoot, config, store);
  }

  return { projectRoot, config, store, diff, dryRun: Boolean(options.dryRun) };
}
