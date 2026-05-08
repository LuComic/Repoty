#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$ROOT/runs" "$ROOT/results/raw"

run_one() {
  local case_name="$1" condition="$2" prompt="$3"
  local src="$ROOT/cases/${case_name}-${condition}"
  local dir="$ROOT/runs/${case_name}-${condition}-run1"
  rm -rf "$dir"
  cp -R "$src" "$dir"
  echo "===== ${case_name} ${condition} run 1 ====="
  local start end
  start=$(date +%s)
  (cd "$dir" && pi -p "$prompt") > "$ROOT/results/raw/${case_name}-${condition}-run1.pi.log" 2>&1 || true
  end=$(date +%s)
  echo "$((end-start))" > "$ROOT/results/raw/${case_name}-${condition}-run1.seconds.txt"
  (cd "$dir" && pi --last-session-info) > "$ROOT/results/raw/${case_name}-${condition}-run1.session.txt" 2>&1 || true
  (cd "$dir" && npm test) > "$ROOT/results/raw/${case_name}-${condition}-run1.test.log" 2>&1 && echo PASS > "$ROOT/results/raw/${case_name}-${condition}-run1.test-status.txt" || echo FAIL > "$ROOT/results/raw/${case_name}-${condition}-run1.test-status.txt"
}

BUG_PROMPT='Fix the failing tests in this subscription billing project. Keep the change minimal and run the tests before you finish.'
FEATURE_PROMPT='Implement atomic inventory reservation in the fulfillment service. It should reserve stock, mark orders ready only after all stock is available, throw an Insufficient stock error when any line cannot be fulfilled, leave inventory/order unchanged on failure, and run the tests before you finish.'

run_one medium-bug control "$BUG_PROMPT"
run_one medium-bug repoty "$BUG_PROMPT"
run_one medium-feature control "$FEATURE_PROMPT"
run_one medium-feature repoty "$FEATURE_PROMPT"
