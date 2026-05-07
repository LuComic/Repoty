import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { loadContext } from "./_shared.js";
import { cleanGenerated } from "../core/store.js";

async function confirm(): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question("Remove generated repoty files? [y/N] ");
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

export async function runClean(options: {
  cacheOnly?: boolean;
  yes?: boolean;
}) {
  const { projectRoot, config } = await loadContext();
  const accepted = options.yes ? true : await confirm();
  if (!accepted) return { cleaned: false };
  await cleanGenerated(projectRoot, config, Boolean(options.cacheOnly));
  return { cleaned: true, cacheOnly: Boolean(options.cacheOnly) };
}
