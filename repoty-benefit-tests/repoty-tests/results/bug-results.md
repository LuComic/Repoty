# bug results

| Case | Size | Condition | Run | Success | Tokens | Input | Output | Cache read | Tool calls | Seconds | Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| bug | small | control | 1 | yes | 11880 | 7297 | 487 | 4096 | 10 | 18 | $0.053143 |
| bug | small | control | 2 | yes | 13601 | 6434 | 511 | 6656 | 10 | 18 | $0.050828 |
| bug | small | repoty | 1 | yes | 16349 | 5083 | 514 | 10752 | 10 | 19 | $0.046211 |
| bug | small | repoty | 2 | yes | 20151 | 5693 | 634 | 13824 | 11 | 26 | $0.054397 |

| Group | Condition | Runs | Success | Avg tokens | Avg input | Avg output | Avg cache read | Avg tool calls | Avg seconds | Avg cost |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| bug | control | 2 | 100% | 12740.50 | 6865.50 | 499 | 5376 | 10 | 18 | $0.051986 |
| bug | repoty | 2 | 100% | 18250 | 5388 | 574 | 12288 | 10.50 | 22.50 | $0.050304 |
