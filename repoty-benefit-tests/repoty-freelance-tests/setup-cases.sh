#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$ROOT/../freelance-app" && pwd)"
rm -rf "$ROOT/cases" "$ROOT/runs" "$ROOT/results"
mkdir -p "$ROOT/cases" "$ROOT/results/raw"

copy_repo() {
  local dest="$1"
  mkdir -p "$dest"
  rsync -a \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.repoty' \
    --exclude 'tsconfig.tsbuildinfo' \
    "$SRC/" "$dest/"
}

add_positive_benchmark() {
  local dest="$1"
  mkdir -p "$dest/benchmark"
  cat > "$dest/benchmark/mergePageConfigDocument.test.ts" <<'TS'
import { describe, expect, test } from "bun:test";
import {
  createComponentInstanceId,
  createComponentToken,
  mergePageConfigDocument,
} from "../lib/pageDocument";

describe("mergePageConfigDocument", () => {
  test("preserves select live state when a config-only update changes metadata", () => {
    const id = createComponentInstanceId(1);
    const token = createComponentToken("Select", id);
    const base = {
      version: 1 as const,
      editorText: token,
      components: {
        [id]: {
          id,
          type: "Select" as const,
          config: {
            title: "Priority",
            description: "",
            options: [
              { id: 1, label: "Low" },
              { id: 2, label: "High" },
            ],
          },
          state: {
            selectedOptionIds: [2],
          },
        },
      },
    };
    const update = {
      version: 1 as const,
      editorText: token,
      components: {
        [id]: {
          id,
          type: "Select" as const,
          config: {
            title: "Updated priority",
            description: "",
            options: [
              { id: 1, label: "Low" },
              { id: 2, label: "High" },
            ],
          },
        },
      },
    };

    const merged = mergePageConfigDocument(base, update);
    expect(merged.components[id]?.config.title).toBe("Updated priority");
    expect(merged.components[id]?.state.selectedOptionIds).toEqual([2]);
  });

  test("preserves radio live state when a config-only update changes labels", () => {
    const id = createComponentInstanceId(2);
    const token = createComponentToken("Radio", id);
    const base = {
      version: 1 as const,
      editorText: token,
      components: {
        [id]: {
          id,
          type: "Radio" as const,
          config: {
            title: "Access",
            description: "",
            options: [
              { id: 1, label: "View" },
              { id: 2, label: "Edit" },
            ],
          },
          state: {
            selectedOptionId: 2,
          },
        },
      },
    };
    const update = {
      version: 1 as const,
      editorText: token,
      components: {
        [id]: {
          id,
          type: "Radio" as const,
          config: {
            title: "Access role",
            description: "",
            options: [
              { id: 1, label: "Viewer" },
              { id: 2, label: "Editor" },
            ],
          },
        },
      },
    };

    const merged = mergePageConfigDocument(base, update);
    expect(merged.components[id]?.config.title).toBe("Access role");
    expect(merged.components[id]?.state.selectedOptionId).toBe(2);
  });
});
TS
}

add_negative_benchmark() {
  local dest="$1"
  mkdir -p "$dest/benchmark"
  cat > "$dest/benchmark/pageLimitsLocalFeature.test.ts" <<'TS'
import { describe, expect, test } from "bun:test";
import {
  getPageContentSizeStatus,
  MAX_PAGE_CONTENT_BYTES,
  PAGE_CONTENT_WARNING_BYTES,
} from "../lib/pageLimits";

describe("getPageContentSizeStatus", () => {
  test("returns safe below the warning threshold", () => {
    expect(getPageContentSizeStatus(PAGE_CONTENT_WARNING_BYTES - 1)).toBe("safe");
  });

  test("returns warning from the warning threshold up to the max size", () => {
    expect(getPageContentSizeStatus(PAGE_CONTENT_WARNING_BYTES)).toBe("warning");
    expect(getPageContentSizeStatus(MAX_PAGE_CONTENT_BYTES)).toBe("warning");
  });

  test("returns tooLarge above the max size", () => {
    expect(getPageContentSizeStatus(MAX_PAGE_CONTENT_BYTES + 1)).toBe("tooLarge");
  });
});
TS
}

add_neutral_benchmark() {
  local dest="$1"
  mkdir -p "$dest/benchmark"
  cat > "$dest/benchmark/calendarOrangeColor.test.ts" <<'TS'
import { describe, expect, test } from "bun:test";
import {
  createComponentInstanceId,
  createComponentToken,
  normalizePageDocument,
} from "../lib/pageDocument";

function normalizeCalendarEventColor(color: string) {
  const id = createComponentInstanceId(1);
  const token = createComponentToken("Calendar", id);
  const document = normalizePageDocument({
    version: 1,
    editorText: token,
    components: {
      [id]: {
        id,
        type: "Calendar",
        config: {},
        state: {
          events: [
            {
              id: "event-1",
              title: "Kickoff",
              color,
              startAt: 1_700_000_000_000,
              endAt: 1_700_000_360_000,
            },
          ],
        },
      },
    },
  });

  return document.components[id]?.state.events[0]?.color;
}

describe("calendar color normalization", () => {
  test("preserves the new orange color instead of falling back to none", () => {
    expect(normalizeCalendarEventColor("orange")).toBe("orange");
  });

  test("still falls back to none for unsupported colors", () => {
    expect(normalizeCalendarEventColor("ultraviolet")).toBe("none");
  });
});
TS
}

for case_name in positive negative neutral; do
  for condition in control repoty; do
    dest="$ROOT/cases/${case_name}-${condition}"
    copy_repo "$dest"
    case "$case_name" in
      positive) add_positive_benchmark "$dest" ;;
      negative) add_negative_benchmark "$dest" ;;
      neutral) add_neutral_benchmark "$dest" ;;
    esac
  done
done
