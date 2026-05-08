# Repoty benefit benchmark summary

This benchmark used medium/slightly-bigger synthetic repositories and one run per condition to preserve usage.

- Control: no `.repoty/`, no repoty integration
- Repoty: `repoty init` + `repoty integrate agents`
- Model: openai-codex/gpt-5.4-mini
- Note: task-session costs below do **not** include the separate one-time cost of `repoty init`

## All runs

| Case | Hypothesis | Condition | Success | Tokens | Input | Output | Cache read | Tool calls | Seconds | Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| positive | repoty-positive | control | yes | 14446 | 4181 | 537 | 9728 | 11 | 15 | $0.006282 |
| positive | repoty-positive | repoty | yes | 20711 | 6350 | 537 | 13824 | 9 | 18 | $0.008216 |
| negative | repoty-negative | control | yes | 11462 | 3326 | 456 | 7680 | 7 | 21 | $0.005123 |
| negative | repoty-negative | repoty | yes | 14114 | 3903 | 483 | 9728 | 8 | 14 | $0.005830 |
| neutral | repoty-neutral | control | yes | 15509 | 4175 | 582 | 10752 | 11 | 20 | $0.006557 |
| neutral | repoty-neutral | repoty | yes | 27422 | 6539 | 915 | 19968 | 17 | 28 | $0.010519 |

## Overall averages

| Condition | Success rate | Avg tokens | Avg input | Avg output | Avg cache read | Avg tool calls | Avg seconds | Avg cost |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| control | 100% | 13805.67 | 3894.00 | 525.00 | 9386.67 | 9.67 | 18.67 | $0.005987 |
| repoty | 100% | 20749.00 | 5597.33 | 645.00 | 14506.67 | 11.33 | 20.00 | $0.008188 |

## Overall delta (repoty - control)

- Avg tokens: 6943.33
- Avg input tokens: 1703.33
- Avg output tokens: 120.00
- Avg cache read tokens: 5120.00
- Avg tool calls: 1.67
- Avg seconds: 1.33
- Avg cost: $0.002201

## Interpretation

Expected buckets:
- positive: repoty should help
- negative: repoty should hurt or add overhead
- neutral: unclear/mixed

Observed on this single-run benchmark:
- **positive**: repoty cost more and used more tokens
- **negative**: repoty also cost more and used more tokens, as expected
- **neutral**: repoty cost much more and used many more tokens

So in this specific run set, repoty did not win on any of the three tasks, even though all runs succeeded. The strongest pattern is extra cache-read/context overhead from reading repoty-generated material in addition to the source files.

Because this uses only one run per condition, treat the results as directional rather than final proof.
