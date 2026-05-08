# feature results

| Case | Size | Condition | Run | Success | Tokens | Input | Output | Cache read | Tool calls | Seconds | Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| feature | small | control | 1 | yes | 11762 | 6075 | 567 | 5120 | 9 | 28 | $0.049945 |
| feature | small | control | 2 | yes | 11453 | 4351 | 446 | 6656 | 9 | 15 | $0.038463 |
| feature | small | repoty | 1 | yes | 12230 | 6524 | 586 | 5120 | 9 | 25 | $0.052760 |
| feature | small | repoty | 2 | yes | 16793 | 7953 | 648 | 8192 | 10 | 26 | $0.063301 |

| Group | Condition | Runs | Success | Avg tokens | Avg input | Avg output | Avg cache read | Avg tool calls | Avg seconds | Avg cost |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| feature | control | 2 | 100% | 11607.50 | 5213 | 506.50 | 5888 | 9 | 21.50 | $0.044204 |
| feature | repoty | 2 | 100% | 14511.50 | 7238.50 | 617 | 6656 | 9.50 | 25.50 | $0.058030 |
