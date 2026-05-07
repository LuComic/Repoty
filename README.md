# repoty

`repoty` builds a deterministic, AI-friendly repository map in `.repoty/`.

## Install

```bash
bun install
```

## Develop

```bash
bun run dev -- --help
bun test
bun run typecheck
bun run build
```

## AI modes

`repoty` supports:

- `codex-cli` - default
- `openai-api` - when you pass `--key`
- `--no-ai` - no model calls at all

### Default: Codex CLI

If you have Codex CLI installed and logged in:

```bash
codex login
bun run src/cli.ts init
```

`repoty` will use Codex CLI by default for structured summaries.

### OpenAI API key mode

If you want to use a normal API key instead, pass `--key`:

```bash
export OPENAI_API_KEY=sk-...
bun run src/cli.ts init --key
```

Optional custom API base URL:

```bash
export OPENAI_BASE_URL=https://your-endpoint.example.com/v1
```

### No AI

```bash
bun run src/cli.ts init --no-ai
```

### Broader indexing with `--all-files`

By default, `repoty` indexes a broad set of common source and text files across many languages and frameworks.

If you want a broader pass for mixed-language repos or unusual file types, use:

```bash
bun run src/cli.ts init --all-files
```

This scans an even wider set of non-binary, non-ignored files and can take longer.

When you run default mode, `repoty` also prints a tip reminding you that `--all-files` is available.

## How Codex mode works

`repoty` does not implement browser login itself.

Instead, it shells out to your installed `codex` CLI and asks it to return one JSON object for each summary. `repoty` then validates that JSON with Zod.

So the flow is:

1. `codex login`
2. `repoty init`
3. `repoty` does deterministic indexing
4. `repoty` uses Codex only for structured file summaries

## Agent integration

After creating a map, add instructions so coding agents know to consult `.repoty/` first:

```bash
bun run src/cli.ts integrate agents  # AGENTS.md
bun run src/cli.ts integrate claude  # CLAUDE.md
bun run src/cli.ts integrate cursor  # .cursor/rules/repoty.mdc
bun run src/cli.ts integrate all
```

`integrate` uses `<!-- repoty:start -->` / `<!-- repoty:end -->` markers, so rerunning it updates only the repoty-managed block and preserves your other instructions.

## Output

Generated files go to:

```text
.repoty/
  config.json
  agent/
  data/
```

Useful generated docs:

- `.repoty/agent/SITEMAP.md`
- `.repoty/agent/ROUTES.md`
- `.repoty/agent/FILES.md`

## Notes

- Source files are never modified.
- `.gitignore` and built-in secret/build excludes are respected.
- Source files are never executed by `repoty`.
- `--no-ai` skips model calls entirely.

## Config

Default config shape:

```json
{
  "version": 1,
  "outDir": ".repoty",
  "model": "gpt-4.1-mini",
  "aiProvider": "codex-cli",
  "codexCommand": "codex",
  "codexTimeoutMs": 120000,
  "include": ["**/*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,scss,html,svelte,vue,yaml,yml,toml,xml,svg,graphql,gql,sh,bash,zsh,py,rb,php,go,rs,java,kt,kts,swift,c,h,cc,hh,cpp,hpp,cxx,cs,sql}"],
  "exclude": [
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
    ".env.*"
  ],
  "maxFileBytesForAi": 80000,
  "maxConcurrentAiCalls": 3,
  "routes": {
    "auto": true,
    "minClusterSize": 2
  }
}
```

Relevant config keys:

- `aiProvider`
  - `codex-cli`
  - `openai-api`
  - `auto`
- `codexCommand`
  - command or absolute path for Codex CLI
  - default: `codex`
- `codexTimeoutMs`
  - timeout for one Codex subprocess call

Examples:

```bash
bun run src/cli.ts config set aiProvider codex-cli
bun run src/cli.ts config set codexCommand codex
bun run src/cli.ts config set codexTimeoutMs 180000
```

## Running repoty in another repo

Build once:

```bash
cd /Users/ainurakk/Documents/GitHub/agent-cli
bun run build
```

Then from inside the target repo:

### Default Codex mode

```bash
codex login
cd /path/to/target-repo
bun run /Users/ainurakk/Documents/GitHub/agent-cli/dist/cli.js init
```

### API key mode

```bash
cd /path/to/target-repo
OPENAI_API_KEY=sk-... bun run /Users/ainurakk/Documents/GitHub/agent-cli/dist/cli.js init --key
```

### No AI mode

```bash
cd /path/to/target-repo
bun run /Users/ainurakk/Documents/GitHub/agent-cli/dist/cli.js init --no-ai
```

## Command reference

All commands can be run as:

```bash
bun run src/cli.ts <command>
```

or after build:

```bash
bun run dist/cli.js <command>
```

---

## `repoty init`

Create `.repoty/` from scratch.

```bash
bun run src/cli.ts init [options]
```

Options:

- `--model <model>`: override configured model name
- `--out <dir>`: override output directory
- `--key`: force OpenAI API key mode instead of default Codex CLI mode
- `--all-files`: scan a much broader set of text/code files, not just the common default set
- `--dry-run`: show what would be indexed without writing files
- `--no-ai`: skip AI summaries
- `--verbose`: print extra indexing logs
- `--json`: print machine-readable output

Examples:

```bash
bun run src/cli.ts init
bun run src/cli.ts init --key
bun run src/cli.ts init --no-ai
bun run src/cli.ts init --all-files
bun run src/cli.ts init --dry-run --json
```

---

## `repoty update`

Update only changed, new, and deleted files.

```bash
bun run src/cli.ts update [options]
```

Options:

- `--all`: rebuild everything
- `--key`: force OpenAI API key mode instead of default Codex CLI mode
- `--all-files`: rescan/index a much broader set of text/code files
- `--dry-run`: compute changes without writing files
- `--no-ai`: skip AI summaries
- `--verbose`: print extra logs
- `--json`: print machine-readable output

Examples:

```bash
bun run src/cli.ts update
bun run src/cli.ts update --key
bun run src/cli.ts update --all-files
bun run src/cli.ts update --all --no-ai
```

---

## `repoty status`

Show index freshness.

```bash
bun run src/cli.ts status [options]
```

Options:

- `--json`: print machine-readable output

---

## `repoty map`

Show the top-level route/domain map.

```bash
bun run src/cli.ts map [options]
```

Options:

- `--json`: print machine-readable output
- `--compact`: print one line per route

---

## `repoty route <name>`

Show one route/domain.

```bash
bun run src/cli.ts route <name> [options]
```

Parameters:

- `<name>`: route name like `auth`, `api`, `ui`, `database`, `tests`

Options:

- `--json`: print machine-readable output

---

## `repoty file <path>`

Show one indexed file summary.

```bash
bun run src/cli.ts file <path> [options]
```

Parameters:

- `<path>`: indexed repo path like `src/auth/session.ts`

Options:

- `--json`: print machine-readable output

---

## `repoty related <path>`

Show related files for one indexed file.

```bash
bun run src/cli.ts related <path> [options]
```

Parameters:

- `<path>`: indexed repo path

Options:

- `--limit <n>`: max results, default `10`
- `--json`: print machine-readable output

---

## `repoty find <query>`

Keyword search over the stored repo map.

```bash
bun run src/cli.ts find <query> [options]
```

Parameters:

- `<query>`: search text like `login session cookie`

Options:

- `--limit <n>`: max results, default `10`
- `--json`: print machine-readable output

---

## `repoty integrate [target]`

Create or update agent instruction files so agents know to consult the repoty map before reading source files.

```bash
bun run src/cli.ts integrate [agents|claude|cursor|all]
```

Targets:

- `agents`: creates/updates `AGENTS.md`
- `claude`: creates/updates `CLAUDE.md`
- `cursor`: creates/updates `.cursor/rules/repoty.mdc`
- `all`: updates all supported integrations; this is the default

The managed section is bounded by markers:

```md
<!-- repoty:start -->
## Repository map
...
<!-- repoty:end -->
```

---

## `repoty explain <target>`

Show a recommended reading path.

```bash
bun run src/cli.ts explain <target> [options]
```

Parameters:

- `<target>`: route name, file path, or free-text query

Options:

- `--json`: print machine-readable output

---

## `repoty config init`

Write default `.repoty/config.json`.

```bash
bun run src/cli.ts config init
```

## `repoty config get`

Print the current config.

```bash
bun run src/cli.ts config get
```

## `repoty config set <key> <value>`

Update a config field.

```bash
bun run src/cli.ts config set <key> <value>
```

Examples:

```bash
bun run src/cli.ts config set model gpt-4.1-mini
bun run src/cli.ts config set aiProvider codex-cli
bun run src/cli.ts config set codexCommand codex
bun run src/cli.ts config set codexTimeoutMs 120000
```

---

## `repoty doctor`

Validate setup and generated output.

```bash
bun run src/cli.ts doctor [options]
```

Options:

- `--json`: print machine-readable output

Checks include:

- `.repoty/` exists
- config is valid
- stored JSON is valid
- indexed files still exist
- Markdown matches JSON
- stale index detection
- missing AI credentials/tool detection
- secret file indexing detection

---

## `repoty clean`

Remove generated output.

```bash
bun run src/cli.ts clean [options]
```

Options:

- `--cache-only`: remove generated data/agent files only
- `--yes`: skip confirmation prompt
- `--json`: print machine-readable output
