#!/usr/bin/env node
import { Command } from "commander";
import { RepotyError } from "./core/config.js";
import { runClean } from "./commands/clean.js";
import {
  runConfigGet,
  runConfigInit,
  runConfigSet,
} from "./commands/config.js";
import { runDoctor } from "./commands/doctor.js";
import { runExplain } from "./commands/explain.js";
import { runFile } from "./commands/file.js";
import { runFind } from "./commands/find.js";
import { runFocus } from "./commands/focus.js";
import { runInit } from "./commands/init.js";
import { runIntegrate } from "./commands/integrate.js";
import { runMap } from "./commands/map.js";
import { runRelated } from "./commands/related.js";
import { runRoute } from "./commands/route.js";
import { runStatus } from "./commands/status.js";
import { runUpdate } from "./commands/update.js";

function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

function printList(items: string[], indent = "- ") {
  if (items.length === 0) {
    console.log(`${indent}None`);
    return;
  }
  for (const item of items) console.log(`${indent}${item}`);
}

function parsePositiveInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RepotyError(`${optionName} must be a positive integer`, 2);
  }
  return parsed;
}

async function runCommand(action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(error instanceof RepotyError ? error.exitCode : 1);
  }
}

const program = new Command();
program
  .name("repoty")
  .description("Build an AI-friendly repository map")
  .version("0.1.0");

program
  .command("init")
  .option("--model <model>")
  .option("--out <dir>")
  .option("--key", "Force OpenAI API key mode")
  .option("--all-files", "Index a much broader set of text/code files")
  .option("--dry-run")
  .option("--no-ai")
  .option("--verbose")
  .option("--json")
  .action((options) =>
    runCommand(async () => {
      const result = await runInit({
        ...options,
        noAi: options.ai === false,
        silent: Boolean(options.json),
      });
      if (options.json) return printJson(result);
      console.log(
        `${options.dryRun ? "Planned" : "Created"} repo map in ${result.config.outDir}`,
      );
      console.log(`Indexed ${Object.keys(result.store.files).length} files.`);
      console.log(
        `Changed: ${result.diff.changedFiles.length}, new: ${result.diff.newFiles.length}, deleted: ${result.diff.deletedFiles.length}`,
      );
      if (!options.allFiles) {
        console.log(
          "Tip: use --all-files for broader indexing across more text/code file types.",
        );
      }
    }),
  );

program
  .command("update")
  .option("--all")
  .option("--key", "Force OpenAI API key mode")
  .option("--all-files", "Index a much broader set of text/code files")
  .option("--dry-run")
  .option("--no-ai")
  .option("--verbose")
  .option("--json")
  .action((options) =>
    runCommand(async () => {
      const result = await runUpdate({
        ...options,
        noAi: options.ai === false,
        silent: Boolean(options.json),
      });
      if (options.json) return printJson(result);
      console.log(`${options.dryRun ? "Planned" : "Updated"} repo map.`);
      console.log(`New: ${result.diff.newFiles.length}`);
      console.log(`Changed: ${result.diff.changedFiles.length}`);
      console.log(`Deleted: ${result.diff.deletedFiles.length}`);
      if (!options.allFiles) {
        console.log(
          "Tip: use --all-files for broader indexing across more text/code file types.",
        );
      }
    }),
  );

program
  .command("status")
  .option("--json")
  .action((options) =>
    runCommand(async () => {
      const status = await runStatus();
      if (options.json) return printJson(status);
      console.log(`Indexed files: ${status.indexedFiles}`);
      console.log(`Changed: ${status.changedFiles.length}`);
      console.log(`New: ${status.newFiles.length}`);
      console.log(`Deleted: ${status.deletedFiles.length}`);
      console.log(`Last update: ${status.lastUpdateTime}`);
      console.log(`Fresh: ${status.stale ? "no" : "yes"}`);
    }),
  );

program
  .command("map")
  .option("--json")
  .option("--compact")
  .action((options) =>
    runCommand(async () => {
      const routes = await runMap();
      if (options.json) return printJson(routes);
      for (const route of routes) {
        if (options.compact) {
          console.log(`${route.name}: ${route.files} files`);
        } else {
          console.log(`## ${route.title}`);
          console.log(route.purpose);
          console.log(`Files: ${route.files}`);
          printList(
            route.entrypoints.map((entrypoint) => `entrypoint ${entrypoint}`),
          );
          console.log("");
        }
      }
    }),
  );

program
  .command("route")
  .argument("<name>")
  .option("--json")
  .action((name, options) =>
    runCommand(async () => {
      const route = await runRoute(name);
      if (options.json) return printJson(route);
      console.log(`# ${route.title}`);
      console.log(route.purpose);
      console.log("Entrypoints:");
      printList(route.entrypoints.map((entrypoint) => `\`${entrypoint}\``));
      console.log("Core files:");
      printList(
        route.coreFiles.map((file) => `\`${file.path}\` — ${file.purpose}`),
      );
      console.log("Related routes:");
      printList(route.relatedRoutes);
      console.log("Reading order:");
      printList(route.recommendedReadingOrder.map((file) => `\`${file}\``));
    }),
  );

program
  .command("file")
  .argument("<path>")
  .option("--json")
  .action((filePath, options) =>
    runCommand(async () => {
      const file = await runFile(filePath);
      if (options.json) return printJson(file);
      console.log(`# ${file.path}`);
      console.log(`Purpose: ${file.purpose}`);
      console.log(`Route: ${file.route}`);
      console.log("Exports:");
      printList(file.exports.map((value) => `\`${value}\``));
      console.log(`Tags: ${file.tags.join(", ") || "None"}`);
      console.log("Related:");
      printList(file.relatedFiles.map((value) => `\`${value}\``));
      console.log("Warnings:");
      printList(file.warnings);
    }),
  );

program
  .command("related")
  .argument("<path>")
  .option("--limit <n>", "Limit results", "10")
  .option("--json")
  .action((filePath, options) =>
    runCommand(async () => {
      const result = await runRelated(
        filePath,
        parsePositiveInteger(options.limit, "--limit"),
      );
      if (options.json) return printJson(result);
      console.log(`# Related to ${result.path}`);
      for (const item of result.related) {
        console.log(
          `- ${item.path} (${item.score}) — ${item.reasons.join("; ")}`,
        );
      }
    }),
  );

program
  .command("focus")
  .argument("<task>")
  .option("--limit <n>", "Limit start-here results", "5")
  .option("--json")
  .action((task, options) =>
    runCommand(async () => {
      const result = await runFocus(
        task,
        parsePositiveInteger(options.limit, "--limit"),
      );
      if (options.json) return printJson(result);
      console.log(`# Focus for ${task}`);
      console.log("Start here:");
      printList(
        result.startHere.map(
          (file) => `\`${file.path}\` (${file.score}) — ${file.why.join("; ")}`,
        ),
      );
      console.log("Verify with:");
      printList(
        result.verifyWith.map(
          (file) => `\`${file.path}\` (${file.score}) — ${file.why.join("; ")}`,
        ),
      );
      console.log("Likely routes:");
      printList(result.likelyRoutes);
      console.log("Probably ignore:");
      printList(result.ignoreRoutes);
    }),
  );

program
  .command("find")
  .argument("<query>")
  .option("--limit <n>", "Limit results", "10")
  .option("--json")
  .action((query, options) =>
    runCommand(async () => {
      const result = await runFind(
        query,
        parsePositiveInteger(options.limit, "--limit"),
      );
      if (options.json) return printJson(result);
      console.log(`# Results for ${query}`);
      for (const item of result.results) {
        console.log(
          item.type === "file"
            ? `- file ${item.path} (${item.score}) — ${item.purpose}`
            : `- route ${item.name} (${item.score}) — ${item.purpose}`,
        );
      }
    }),
  );

program
  .command("explain")
  .argument("<target>")
  .option("--json")
  .action((target, options) =>
    runCommand(async () => {
      const result = await runExplain(target);
      if (options.json) return printJson(result);
      console.log(`# Reading path for ${target}`);
      for (const step of result.readingPath) {
        console.log(`- ${step.path} — ${step.why}`);
      }
    }),
  );

program
  .command("integrate")
  .description("Add repoty instructions to agent configuration files")
  .argument("[target]", "agents, claude, cursor, or all", "all")
  .option("--json")
  .action((target, options) =>
    runCommand(async () => {
      const result = await runIntegrate(target);
      if (options.json) return printJson(result);
      for (const item of result.results) {
        console.log(`${item.action}: ${item.path}`);
      }
    }),
  );

const configCommand = program.command("config").description("Manage config");
configCommand
  .command("init")
  .action(() => runCommand(async () => printJson(await runConfigInit())));
configCommand
  .command("get")
  .action(() => runCommand(async () => printJson(await runConfigGet())));
configCommand
  .command("set")
  .argument("<key>")
  .argument("<value>")
  .action((key, value) =>
    runCommand(async () => printJson(await runConfigSet(key, value))),
  );

program
  .command("doctor")
  .option("--json")
  .action((options) =>
    runCommand(async () => {
      const result = await runDoctor();
      if (options.json) return printJson(result);
      console.log(`OK: ${result.ok ? "yes" : "no"}`);
      console.log("Issues:");
      printList(result.issues);
      console.log("Warnings:");
      printList(result.warnings);
      if (result.stale) process.exit(4);
      if (!result.ok) process.exit(1);
    }),
  );

program
  .command("clean")
  .option("--cache-only")
  .option("--yes")
  .option("--json")
  .action((options) =>
    runCommand(async () => {
      const result = await runClean(options);
      if (options.json) return printJson(result);
      console.log(result.cleaned ? "Cleaned repoty output." : "Aborted.");
    }),
  );

await program.parseAsync(process.argv);
