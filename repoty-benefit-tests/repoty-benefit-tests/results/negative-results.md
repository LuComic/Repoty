# negative benchmark

- Hypothesis bucket: **repoty-negative**
- Task: explicit local feature in src/ui/badge.js
- Model: openai-codex/gpt-5.4-mini
- Note: single run per condition to preserve usage

| Case | Hypothesis | Condition | Success | Tokens | Input | Output | Cache read | Tool calls | Seconds | Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| negative | repoty-negative | control | yes | 11462 | 3326 | 456 | 7680 | 7 | 21 | $0.005123 |
| negative | repoty-negative | repoty | yes | 14114 | 3903 | 483 | 9728 | 8 | 14 | $0.005830 |

## Delta (repoty - control)

- Tokens: 2652
- Input tokens: 577
- Output tokens: 27
- Cost: $0.000707
- Seconds: -7
- Tool calls: 1

## Result

Repoty was more expensive on this run. It was also faster.
