# Freelance-app positive benchmark (single pair)

Repo under test: `../freelance-app` cloned into benchmark cases only.

Model used:

- `openai-codex/gpt-5.2`

Task:

- Fix `mergePageConfigDocument` so config-only updates preserve existing live state for `Select` and `Radio` components.

Validation:

- `bun test benchmark/mergePageConfigDocument.test.ts`

## Results

| Condition | Success | Messages | Tool calls | Total tokens | Input | Output | Cache read | Cost |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| control | yes | 22 | 10 | 74,561 | 23,319 | 1,834 | 49,408 | $0.075131 |
| repoty | yes | 20 | 9 | 68,336 | 27,381 | 1,531 | 39,424 | $0.076250 |

## Delta (repoty - control)

- Total tokens: `-6,225`
- Input tokens: `+4,062`
- Output tokens: `-303`
- Cache read tokens: `-9,984`
- Tool calls: `-1`
- Cost: `+$0.001119`

## Interpretation

On this single real-project positive case:

- repoty used fewer total tokens
- repoty used fewer tool calls
- repoty used lower cache-read tokens
- but repoty still cost slightly more because input-token usage was higher

So this one is more mixed than the earlier synthetic results: repoty may have helped reduce some exploration/history overhead, but not enough to beat control on cost.
