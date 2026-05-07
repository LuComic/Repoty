import { initConfig, loadConfig, writeConfig } from "../core/config.js";
import { findProjectRoot } from "../core/project-root.js";

function parseValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  const maybeNumber = Number(value);
  if (!Number.isNaN(maybeNumber) && value.trim() !== "") return maybeNumber;
  return value;
}

export async function runConfigInit() {
  const projectRoot = await findProjectRoot();
  const config = await initConfig(projectRoot);
  return { projectRoot, config };
}

export async function runConfigGet() {
  const projectRoot = await findProjectRoot();
  const config = await loadConfig(projectRoot);
  return config;
}

export async function runConfigSet(key: string, value: string) {
  const projectRoot = await findProjectRoot();
  const config = await loadConfig(projectRoot);
  const parsedValue = parseValue(value);

  if (key.includes(".")) {
    const [first, second] = key.split(".", 2);
    (config as Record<string, unknown>)[first] = {
      ...((config as Record<string, unknown>)[first] as Record<
        string,
        unknown
      >),
      [second]: parsedValue,
    };
  } else {
    (config as Record<string, unknown>)[key] = parsedValue;
  }

  await writeConfig(projectRoot, config);
  return config;
}
