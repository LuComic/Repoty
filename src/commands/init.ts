import {
  initConfig,
  loadConfig,
  RepotyError,
  writeConfig,
} from "../core/config.js";
import { indexProject } from "../core/indexer.js";
import type { AiProvider } from "../types/index.js";
import { createLogger } from "../core/logger.js";
import { findProjectRoot } from "../core/project-root.js";
import { loadStore, writeStore } from "../core/store.js";

export async function runInit(options: {
  model?: string;
  out?: string;
  aiProvider?: AiProvider;
  key?: boolean;
  dryRun?: boolean;
  noAi?: boolean;
  verbose?: boolean;
  silent?: boolean;
  allFiles?: boolean;
}) {
  const projectRoot = await findProjectRoot();
  const existingConfig = await loadConfig(projectRoot);
  const config = {
    ...existingConfig,
    ...(options.model ? { model: options.model } : {}),
    ...(options.out ? { outDir: options.out } : {}),
    ...(options.aiProvider ? { aiProvider: options.aiProvider } : {}),
    ...(options.key ? { aiProvider: "openai-api" as AiProvider } : {}),
  };
  const logger = createLogger(
    Boolean(options.verbose),
    Boolean(options.silent),
  );

  let previousStore;
  try {
    previousStore = await loadStore(projectRoot, config);
    logger.info(
      "Existing .repoty index found. Reusing unchanged summaries where possible...",
    );
  } catch (error) {
    if (!(error instanceof RepotyError) || error.exitCode !== 3) {
      throw error;
    }
  }

  if (options.dryRun) {
    const { store, diff } = await indexProject({
      projectRoot,
      config,
      previousStore,
      noAi: options.noAi,
      logger,
      all: !previousStore,
      allFiles: options.allFiles,
    });
    return { projectRoot, config, store, diff, dryRun: true };
  }

  await initConfig(projectRoot, config);
  await writeConfig(projectRoot, config);
  const { store, diff } = await indexProject({
    projectRoot,
    config,
    previousStore,
    noAi: options.noAi,
    logger,
    all: !previousStore,
    allFiles: options.allFiles,
  });
  await writeStore(projectRoot, config, store);
  return { projectRoot, config, store, diff, dryRun: false };
}
