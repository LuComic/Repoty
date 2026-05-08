# Repoty A/B benchmark summary

Small benchmark with two tasks and two runs per condition. Repoty variants were prepared with `repoty init` and `repoty integrate agents`; control variants had no `.repoty/` or `AGENTS.md`.

## Per-run data

| Case | Condition | Run | Success | Tokens | Input | Output | Cache read | Tool calls | Seconds | Cost |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| bug | control | 1 | yes | 11880 | 7297 | 487 | 4096 | 10 | 18 | $0.053143 |
| bug | control | 2 | yes | 13601 | 6434 | 511 | 6656 | 10 | 18 | $0.050828 |
| bug | repoty | 1 | yes | 16349 | 5083 | 514 | 10752 | 10 | 19 | $0.046211 |
| bug | repoty | 2 | yes | 20151 | 5693 | 634 | 13824 | 11 | 26 | $0.054397 |
| feature | control | 1 | yes | 11762 | 6075 | 567 | 5120 | 9 | 28 | $0.049945 |
| feature | control | 2 | yes | 11453 | 4351 | 446 | 6656 | 9 | 15 | $0.038463 |
| feature | repoty | 1 | yes | 12230 | 6524 | 586 | 5120 | 9 | 25 | $0.052760 |
| feature | repoty | 2 | yes | 16793 | 7953 | 648 | 8192 | 10 | 26 | $0.063301 |

## Per-case averages

| Case | Condition | Runs | Success rate | Avg tokens | Avg input | Avg output | Avg cache read | Avg tool calls | Avg seconds | Avg cost |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| bug | control | 2 | 100% | 12740.50 | 6865.50 | 499 | 5376 | 10 | 18 | $0.051986 |
| bug | repoty | 2 | 100% | 18250 | 5388 | 574 | 12288 | 10.50 | 22.50 | $0.050304 |
| feature | control | 2 | 100% | 11607.50 | 5213 | 506.50 | 5888 | 9 | 21.50 | $0.044204 |
| feature | repoty | 2 | 100% | 14511.50 | 7238.50 | 617 | 6656 | 9.50 | 25.50 | $0.058030 |

## Overall averages

| Case | Condition | Runs | Success rate | Avg tokens | Avg input | Avg output | Avg cache read | Avg tool calls | Avg seconds | Avg cost |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| overall | control | 4 | 100% | 12174 | 6039.25 | 502.75 | 5632 | 9.50 | 19.75 | $0.048095 |
| overall | repoty | 4 | 100% | 16380.75 | 6313.25 | 595.50 | 9472 | 10 | 24 | $0.054167 |

## Overall delta: repoty minus control

- Success rate: 100% vs 100%
- Avg tokens: 4206.75
- Avg input tokens: 274
- Avg output tokens: 92.75
- Avg cost: $0.006073
- Avg seconds: 4.25
- Avg tool calls: 0.50

## Conclusion

On these very small projects, repoty did not show a cost/token advantage. All control and repoty runs succeeded, but repoty variants averaged higher total tokens, higher cost, and slightly more time/tool calls. This is not a strong negative result for repoty because the repos are tiny; the map overhead can dominate when the agent only needs to inspect a handful of files. A better follow-up is the same benchmark on a medium repo where navigation is non-trivial.
