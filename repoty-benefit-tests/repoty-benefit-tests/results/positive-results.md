# positive benchmark

- Hypothesis bucket: **repoty-positive**
- Task: cross-file reminder scheduling bug in a medium repo
- Model: openai-codex/gpt-5.4-mini
- Note: single run per condition to preserve usage

| Case | Hypothesis | Condition | Success | Tokens | Input | Output | Cache read | Tool calls | Seconds | Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| positive | repoty-positive | control | yes | 14446 | 4181 | 537 | 9728 | 11 | 15 | $0.006282 |
| positive | repoty-positive | repoty | yes | 20711 | 6350 | 537 | 13824 | 9 | 18 | $0.008216 |

## Delta (repoty - control)

- Tokens: 6265
- Input tokens: 2169
- Output tokens: 0
- Cost: $0.001934
- Seconds: 3
- Tool calls: -2

## Result

Repoty was more expensive on this run. It was also slower.
