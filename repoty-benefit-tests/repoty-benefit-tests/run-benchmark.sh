#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
MODEL="openai-codex/gpt-5.4-mini"
COMMON_FLAGS=(--model "$MODEL" --thinking minimal --no-extensions --no-skills --no-prompt-templates --no-themes)
mkdir -p "$ROOT/runs" "$ROOT/results/raw"

run_one() {
  local case_name="$1" condition="$2" prompt="$3"
  local src="$ROOT/cases/${case_name}-${condition}"
  local dir="$ROOT/runs/${case_name}-${condition}-run1"
  local base="$ROOT/results/raw/${case_name}-${condition}-run1"
  rm -rf "$dir"
  cp -R "$src" "$dir"
  echo "===== ${case_name} ${condition} ====="
  local start end
  start=$(date +%s)
  (cd "$dir" && pi "${COMMON_FLAGS[@]}" -p "$prompt") > "${base}.pi.log" 2>&1 || true
  end=$(date +%s)
  echo "$((end-start))" > "${base}.seconds.txt"
  (cd "$dir" && pi --last-session-info) > "${base}.session.txt" 2>&1 || true
  (cd "$dir" && npm test) > "${base}.test.log" 2>&1 && echo PASS > "${base}.test-status.txt" || echo FAIL > "${base}.test-status.txt"
}

POSITIVE_PROMPT='There is a production bug in this repository: invoice reminder jobs are not being correctly rescheduled when an invoice due date changes within the reminder window. Find the cause, fix it with a minimal safe change, and run the tests before finishing.'
NEGATIVE_PROMPT='Implement the requested feature in src/ui/badge.js: add support for the new xs badge size so the existing tests pass. Keep the change focused and run the tests before finishing.'
NEUTRAL_PROMPT='Implement archived filtering for project search in this repository so the existing tests pass. Preserve the current text matching behavior and run the tests before finishing.'

run_one positive control "$POSITIVE_PROMPT"
run_one positive repoty "$POSITIVE_PROMPT"
run_one negative control "$NEGATIVE_PROMPT"
run_one negative repoty "$NEGATIVE_PROMPT"
run_one neutral control "$NEUTRAL_PROMPT"
run_one neutral repoty "$NEUTRAL_PROMPT"
