# neutral benchmark

- Hypothesis bucket: **repoty-neutral**
- Task: moderate search-filter feature touching a couple of files
- Model: openai-codex/gpt-5.4-mini
- Note: single run per condition to preserve usage

| Case | Hypothesis | Condition | Success | Tokens | Input | Output | Cache read | Tool calls | Seconds | Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| neutral | repoty-neutral | control | yes | 15509 | 4175 | 582 | 10752 | 11 | 20 | $0.006557 |
| neutral | repoty-neutral | repoty | yes | 27422 | 6539 | 915 | 19968 | 17 | 28 | $0.010519 |

## Delta (repoty - control)

- Tokens: 11913
- Input tokens: 2364
- Output tokens: 333
- Cost: $0.003962
- Seconds: 8
- Tool calls: 6

## Result

Repoty was more expensive on this run. It was also slower.
