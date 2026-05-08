# Repoty A/B benchmark summary - all runs

Includes the original small cases and the newer medium cases. Medium cases used one run per condition to conserve usage. Repoty variants were prepared with `repoty init` and `repoty integrate agents`.

## Per-run data

| Case | Size | Condition | Run | Success | Tokens | Input | Output | Cache read | Tool calls | Seconds | Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| bug | small | control | 1 | yes | 11880 | 7297 | 487 | 4096 | 10 | 18 | $0.053143 |
| bug | small | control | 2 | yes | 13601 | 6434 | 511 | 6656 | 10 | 18 | $0.050828 |
| bug | small | repoty | 1 | yes | 16349 | 5083 | 514 | 10752 | 10 | 19 | $0.046211 |
| bug | small | repoty | 2 | yes | 20151 | 5693 | 634 | 13824 | 11 | 26 | $0.054397 |
| feature | small | control | 1 | yes | 11762 | 6075 | 567 | 5120 | 9 | 28 | $0.049945 |
| feature | small | control | 2 | yes | 11453 | 4351 | 446 | 6656 | 9 | 15 | $0.038463 |
| feature | small | repoty | 1 | yes | 12230 | 6524 | 586 | 5120 | 9 | 25 | $0.052760 |
| feature | small | repoty | 2 | yes | 16793 | 7953 | 648 | 8192 | 10 | 26 | $0.063301 |
| medium-bug | medium | control | 1 | yes | 30609 | 10209 | 432 | 19968 | 12 | 25 | $0.073989 |
| medium-bug | medium | repoty | 1 | yes | 31025 | 7496 | 489 | 23040 | 12 | 21 | $0.063670 |
| medium-feature | medium | control | 1 | yes | 13670 | 4321 | 645 | 8704 | 9 | 21 | $0.045307 |
| medium-feature | medium | repoty | 1 | yes | 26340 | 7031 | 877 | 18432 | 12 | 32 | $0.070681 |

## Per-case averages

| Group | Condition | Runs | Success | Avg tokens | Avg input | Avg output | Avg cache read | Avg tool calls | Avg seconds | Avg cost |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| bug | control | 2 | 100% | 12740.50 | 6865.50 | 499 | 5376 | 10 | 18 | $0.051986 |
| bug | repoty | 2 | 100% | 18250 | 5388 | 574 | 12288 | 10.50 | 22.50 | $0.050304 |
| feature | control | 2 | 100% | 11607.50 | 5213 | 506.50 | 5888 | 9 | 21.50 | $0.044204 |
| feature | repoty | 2 | 100% | 14511.50 | 7238.50 | 617 | 6656 | 9.50 | 25.50 | $0.058030 |
| medium-bug | control | 1 | 100% | 30609 | 10209 | 432 | 19968 | 12 | 25 | $0.073989 |
| medium-bug | repoty | 1 | 100% | 31025 | 7496 | 489 | 23040 | 12 | 21 | $0.063670 |
| medium-feature | control | 1 | 100% | 13670 | 4321 | 645 | 8704 | 9 | 21 | $0.045307 |
| medium-feature | repoty | 1 | 100% | 26340 | 7031 | 877 | 18432 | 12 | 32 | $0.070681 |

## By repo size

| Group | Condition | Runs | Success | Avg tokens | Avg input | Avg output | Avg cache read | Avg tool calls | Avg seconds | Avg cost |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| medium | control | 2 | 100% | 22139.50 | 7265 | 538.50 | 14336 | 10.50 | 23 | $0.059648 |
| medium | repoty | 2 | 100% | 28682.50 | 7263.50 | 683 | 20736 | 12 | 26.50 | $0.067175 |
| small | control | 4 | 100% | 12174 | 6039.25 | 502.75 | 5632 | 9.50 | 19.75 | $0.048095 |
| small | repoty | 4 | 100% | 16380.75 | 6313.25 | 595.50 | 9472 | 10 | 24 | $0.054167 |

## Overall averages

| Group | Condition | Runs | Success | Avg tokens | Avg input | Avg output | Avg cache read | Avg tool calls | Avg seconds | Avg cost |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| overall | control | 6 | 100% | 15495.83 | 6447.83 | 514.67 | 8533.33 | 9.83 | 20.83 | $0.051946 |
| overall | repoty | 6 | 100% | 20481.33 | 6630 | 624.67 | 13226.67 | 10.67 | 24.83 | $0.058503 |

## Deltas: repoty minus control

### bug

- Success: 100% repoty vs 100% control
- Avg tokens delta: 5509.50
- Avg input delta: -1477.50
- Avg output delta: 75
- Avg cost delta: $-0.001682
- Avg seconds delta: 4.50
- Avg tool calls delta: 0.50

### feature

- Success: 100% repoty vs 100% control
- Avg tokens delta: 2904
- Avg input delta: 2025.50
- Avg output delta: 110.50
- Avg cost delta: $0.013826
- Avg seconds delta: 4
- Avg tool calls delta: 0.50

### medium-bug

- Success: 100% repoty vs 100% control
- Avg tokens delta: 416
- Avg input delta: -2713
- Avg output delta: 57
- Avg cost delta: $-0.010319
- Avg seconds delta: -4
- Avg tool calls delta: 0

### medium-feature

- Success: 100% repoty vs 100% control
- Avg tokens delta: 12670
- Avg input delta: 2710
- Avg output delta: 232
- Avg cost delta: $0.025374
- Avg seconds delta: 11
- Avg tool calls delta: 3

### overall

- Success: 100% repoty vs 100% control
- Avg tokens delta: 4985.50
- Avg input delta: 182.17
- Avg output delta: 110
- Avg cost delta: $0.006558
- Avg seconds delta: 4
- Avg tool calls delta: 0.83

## Conclusion

Repoty was mixed on the medium cases: the medium billing bug was cheaper and faster with repoty, while the medium fulfillment feature was more expensive and slower with repoty. Across all current synthetic runs, success stayed equal at 100%, but repoty still averaged higher tokens and cost overall. This suggests the current small/medium synthetic cases are not enough to prove a consistent benefit. A real larger project is a better next test, especially where the agent would otherwise need broad repository discovery.
