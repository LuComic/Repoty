import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const raw = path.join(root, 'results/raw');
const cases = ['bug', 'feature'];
const conditions = ['control', 'repoty'];
const runs = [1, 2];

function parseSession(file) {
  const s = fs.readFileSync(file, 'utf8');
  const toolCalls = Number((s.match(/Tool calls: (\d+)/) ?? [])[1] ?? 0);
  const tok = s.match(/Tokens: ([\d,]+) total \(([\d,]+) input, ([\d,]+) output, ([\d,]+) cache read, ([\d,]+) cache write\)/);
  const cost = s.match(/Cost: \$([\d.]+)/);
  const model = s.match(/Last model: (.+)/);
  return {
    toolCalls,
    totalTokens: Number(tok?.[1].replaceAll(',', '') ?? 0),
    inputTokens: Number(tok?.[2].replaceAll(',', '') ?? 0),
    outputTokens: Number(tok?.[3].replaceAll(',', '') ?? 0),
    cacheReadTokens: Number(tok?.[4].replaceAll(',', '') ?? 0),
    cacheWriteTokens: Number(tok?.[5].replaceAll(',', '') ?? 0),
    costUsd: Number(cost?.[1] ?? 0),
    model: model?.[1]?.trim() ?? 'unknown'
  };
}

function avg(xs, key) { return xs.reduce((a, x) => a + x[key], 0) / xs.length; }
function money(n) { return `$${n.toFixed(6)}`; }
function num(n) { return Number.isInteger(n) ? String(n) : n.toFixed(2); }

const rows = [];
for (const c of cases) for (const cond of conditions) for (const r of runs) {
  const base = `${c}-${cond}-run${r}`;
  const session = parseSession(path.join(raw, `${base}.session.txt`));
  const status = fs.readFileSync(path.join(raw, `${base}.test-status.txt`), 'utf8').trim();
  const seconds = Number(fs.readFileSync(path.join(raw, `${base}.seconds.txt`), 'utf8').trim());
  rows.push({ case: c, condition: cond, run: r, success: status === 'PASS', seconds, ...session });
}

fs.writeFileSync(path.join(root, 'results/results.json'), JSON.stringify(rows, null, 2));

function table(rs) {
  return [
    '| Case | Condition | Run | Success | Tokens | Input | Output | Cache read | Tool calls | Seconds | Cost |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...rs.map(r => `| ${r.case} | ${r.condition} | ${r.run} | ${r.success ? 'yes' : 'no'} | ${r.totalTokens} | ${r.inputTokens} | ${r.outputTokens} | ${r.cacheReadTokens} | ${r.toolCalls} | ${r.seconds} | ${money(r.costUsd)} |`)
  ].join('\n');
}

function avgTable(groups) {
  return [
    '| Case | Condition | Runs | Success rate | Avg tokens | Avg input | Avg output | Avg cache read | Avg tool calls | Avg seconds | Avg cost |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...groups.map(({label, rs}) => `| ${label.case} | ${label.condition} | ${rs.length} | ${(100 * avg(rs, 'success')).toFixed(0)}% | ${num(avg(rs, 'totalTokens'))} | ${num(avg(rs, 'inputTokens'))} | ${num(avg(rs, 'outputTokens'))} | ${num(avg(rs, 'cacheReadTokens'))} | ${num(avg(rs, 'toolCalls'))} | ${num(avg(rs, 'seconds'))} | ${money(avg(rs, 'costUsd'))} |`)
  ].join('\n');
}

for (const c of cases) {
  const rs = rows.filter(r => r.case === c);
  const groups = conditions.map(condition => ({ label: { case: c, condition }, rs: rs.filter(r => r.condition === condition) }));
  const control = groups[0].rs, repoty = groups[1].rs;
  const deltaCost = avg(repoty, 'costUsd') - avg(control, 'costUsd');
  const deltaTokens = avg(repoty, 'totalTokens') - avg(control, 'totalTokens');
  const md = `# ${c} case results\n\n## Raw runs\n\n${table(rs)}\n\n## Averages\n\n${avgTable(groups)}\n\n## Delta\n\nRepoty minus control average:\n\n- Tokens: ${num(deltaTokens)}\n- Cost: ${money(deltaCost)}\n- Seconds: ${num(avg(repoty, 'seconds') - avg(control, 'seconds'))}\n- Tool calls: ${num(avg(repoty, 'toolCalls') - avg(control, 'toolCalls'))}\n\nAll runs used model: ${rs[0].model}.\n`;
  fs.writeFileSync(path.join(root, `results/${c}-results.md`), md);
}

const groups = [];
for (const c of cases) for (const condition of conditions) groups.push({ label: { case: c, condition }, rs: rows.filter(r => r.case === c && r.condition === condition) });
const overallGroups = conditions.map(condition => ({ label: { case: 'overall', condition }, rs: rows.filter(r => r.condition === condition) }));
const controlAll = rows.filter(r => r.condition === 'control');
const repotyAll = rows.filter(r => r.condition === 'repoty');
const md = `# Repoty A/B benchmark summary\n\nSmall benchmark with two tasks and two runs per condition. Repoty variants were prepared with \`repoty init\` and \`repoty integrate agents\`; control variants had no \`.repoty/\` or \`AGENTS.md\`.\n\n## Per-run data\n\n${table(rows)}\n\n## Per-case averages\n\n${avgTable(groups)}\n\n## Overall averages\n\n${avgTable(overallGroups)}\n\n## Overall delta: repoty minus control\n\n- Success rate: ${(100 * avg(repotyAll, 'success')).toFixed(0)}% vs ${(100 * avg(controlAll, 'success')).toFixed(0)}%\n- Avg tokens: ${num(avg(repotyAll, 'totalTokens') - avg(controlAll, 'totalTokens'))}\n- Avg input tokens: ${num(avg(repotyAll, 'inputTokens') - avg(controlAll, 'inputTokens'))}\n- Avg output tokens: ${num(avg(repotyAll, 'outputTokens') - avg(controlAll, 'outputTokens'))}\n- Avg cost: ${money(avg(repotyAll, 'costUsd') - avg(controlAll, 'costUsd'))}\n- Avg seconds: ${num(avg(repotyAll, 'seconds') - avg(controlAll, 'seconds'))}\n- Avg tool calls: ${num(avg(repotyAll, 'toolCalls') - avg(controlAll, 'toolCalls'))}\n\n## Conclusion\n\nOn these very small projects, repoty did not show a cost/token advantage. All control and repoty runs succeeded, but repoty variants averaged higher total tokens, higher cost, and slightly more time/tool calls. This is not a strong negative result for repoty because the repos are tiny; the map overhead can dominate when the agent only needs to inspect a handful of files. A better follow-up is the same benchmark on a medium repo where navigation is non-trivial.\n`;
fs.writeFileSync(path.join(root, 'results/FINAL-SUMMARY.md'), md);
