#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
RUNS=2
mkdir -p "$ROOT/runs" "$ROOT/results/raw"

run_one() {
  local case_name="$1" condition="$2" run_no="$3" prompt="$4"
  local src="$ROOT/cases/${case_name}-${condition}"
  local dir="$ROOT/runs/${case_name}-${condition}-run${run_no}"
  rm -rf "$dir"
  cp -R "$src" "$dir"
  echo "===== ${case_name} ${condition} run ${run_no} ====="
  local start end
  start=$(date +%s)
  (cd "$dir" && pi -p "$prompt") > "$ROOT/results/raw/${case_name}-${condition}-run${run_no}.pi.log" 2>&1 || true
  end=$(date +%s)
  echo "$((end-start))" > "$ROOT/results/raw/${case_name}-${condition}-run${run_no}.seconds.txt"
  (cd "$dir" && pi --last-session-info) > "$ROOT/results/raw/${case_name}-${condition}-run${run_no}.session.txt" 2>&1 || true
  (cd "$dir" && npm test) > "$ROOT/results/raw/${case_name}-${condition}-run${run_no}.test.log" 2>&1 && echo PASS > "$ROOT/results/raw/${case_name}-${condition}-run${run_no}.test-status.txt" || echo FAIL > "$ROOT/results/raw/${case_name}-${condition}-run${run_no}.test-status.txt"
}

BUG_PROMPT='Fix the failing tests in this project. Keep the change minimal and run the tests before you finish.'
FEATURE_PROMPT='Implement priority ordering for the ticket queue so urgent > high > normal > low, closed tickets are skipped, and run the tests before you finish.'

for i in $(seq 1 "$RUNS"); do
  run_one bug control "$i" "$BUG_PROMPT"
  run_one bug repoty "$i" "$BUG_PROMPT"
  run_one feature control "$i" "$FEATURE_PROMPT"
  run_one feature repoty "$i" "$FEATURE_PROMPT"
done
