import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rawDir = path.join(root, 'results', 'raw');
const cases = [
  { name: 'positive', hypothesis: 'repoty-positive', description: 'cross-file reminder scheduling bug in a medium repo' },
  { name: 'negative', hypothesis: 'repoty-negative', description: 'explicit local feature in src/ui/badge.js' },
  { name: 'neutral', hypothesis: 'repoty-neutral', description: 'moderate search-filter feature touching a couple of files' },
];
const conditions = ['control', 'repoty'];

function parseSession(file) {
  const s = fs.readFileSync(file, 'utf8');
  const tokens = s.match(/Tokens: ([\d,]+) total \(([\d,]+) input, ([\d,]+) output, ([\d,]+) cache read, ([\d,]+) cache write\)/);
  const cost = s.match(/Cost: \$([\d.]+)/);
  const toolCalls = s.match(/Tool calls: (\d+)/);
  const messages = s.match(/Messages: (\d+) active-branch/);
  const model = s.match(/Last model: (.+)/);
  return {
    totalTokens: Number(tokens?.[1].replaceAll(',', '') ?? 0),
    inputTokens: Number(tokens?.[2].replaceAll(',', '') ?? 0),
    outputTokens: Number(tokens?.[3].replaceAll(',', '') ?? 0),
    cacheReadTokens: Number(tokens?.[4].replaceAll(',', '') ?? 0),
    cacheWriteTokens: Number(tokens?.[5].replaceAll(',', '') ?? 0),
    costUsd: Number(cost?.[1] ?? 0),
    toolCalls: Number(toolCalls?.[1] ?? 0),
    messages: Number(messages?.[1] ?? 0),
    model: model?.[1]?.trim() ?? 'unknown',
  };
}

const rows = [];
for (const c of cases) {
  for (const condition of conditions) {
    const base = `${c.name}-${condition}-run1`;
    rows.push({
      case: c.name,
      hypothesis: c.hypothesis,
      description: c.description,
      condition,
      success: fs.readFileSync(path.join(rawDir, `${base}.test-status.txt`), 'utf8').trim() === 'PASS',
      seconds: Number(fs.readFileSync(path.join(rawDir, `${base}.seconds.txt`), 'utf8').trim()),
      ...parseSession(path.join(rawDir, `${base}.session.txt`)),
    });
  }
}

const money = (n) => `$${n.toFixed(6)}`;
const mdTable = (rows) => [
  '| Case | Hypothesis | Condition | Success | Tokens | Input | Output | Cache read | Tool calls | Seconds | Cost |',
  '|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...rows.map((r) => `| ${r.case} | ${r.hypothesis} | ${r.condition} | ${r.success ? 'yes' : 'no'} | ${r.totalTokens} | ${r.inputTokens} | ${r.outputTokens} | ${r.cacheReadTokens} | ${r.toolCalls} | ${r.seconds} | ${money(r.costUsd)} |`),
].join('\n');

for (const c of cases) {
  const pair = rows.filter((r) => r.case === c.name);
  const control = pair.find((r) => r.condition === 'control');
  const repoty = pair.find((r) => r.condition === 'repoty');
  const md = `# ${c.name} benchmark\n\n- Hypothesis bucket: **${c.hypothesis}**\n- Task: ${c.description}\n- Model: ${control.model}\n- Note: single run per condition to preserve usage\n\n${mdTable(pair)}\n\n## Delta (repoty - control)\n\n- Tokens: ${repoty.totalTokens - control.totalTokens}\n- Input tokens: ${repoty.inputTokens - control.inputTokens}\n- Output tokens: ${repoty.outputTokens - control.outputTokens}\n- Cost: ${money(repoty.costUsd - control.costUsd)}\n- Seconds: ${repoty.seconds - control.seconds}\n- Tool calls: ${repoty.toolCalls - control.toolCalls}\n\n## Result\n\n${repoty.costUsd < control.costUsd ? 'Repoty was cheaper on this run.' : repoty.costUsd > control.costUsd ? 'Repoty was more expensive on this run.' : 'Repoty cost the same on this run.'} ${repoty.seconds < control.seconds ? 'It was also faster.' : repoty.seconds > control.seconds ? 'It was also slower.' : 'Time was the same.'}\n`;
  fs.writeFileSync(path.join(root, 'results', `${c.name}-results.md`), md);
}

const controlRows = rows.filter((r) => r.condition === 'control');
const repotyRows = rows.filter((r) => r.condition === 'repoty');
const avg = (items, key) => items.reduce((sum, item) => sum + item[key], 0) / items.length;
const summary = `# Repoty benefit benchmark summary\n\nThis benchmark used medium/slightly-bigger synthetic repositories and one run per condition to preserve usage.\n\n- Control: no \`.repoty/\`, no repoty integration\n- Repoty: \`repoty init\` + \`repoty integrate agents\`\n- Model: ${rows[0].model}\n- Note: task-session costs below do **not** include the separate one-time cost of \`repoty init\`\n\n## All runs\n\n${mdTable(rows)}\n\n## Overall averages\n\n| Condition | Success rate | Avg tokens | Avg input | Avg output | Avg cache read | Avg tool calls | Avg seconds | Avg cost |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n| control | ${(100 * avg(controlRows, 'success')).toFixed(0)}% | ${avg(controlRows, 'totalTokens').toFixed(2)} | ${avg(controlRows, 'inputTokens').toFixed(2)} | ${avg(controlRows, 'outputTokens').toFixed(2)} | ${avg(controlRows, 'cacheReadTokens').toFixed(2)} | ${avg(controlRows, 'toolCalls').toFixed(2)} | ${avg(controlRows, 'seconds').toFixed(2)} | ${money(avg(controlRows, 'costUsd'))} |\n| repoty | ${(100 * avg(repotyRows, 'success')).toFixed(0)}% | ${avg(repotyRows, 'totalTokens').toFixed(2)} | ${avg(repotyRows, 'inputTokens').toFixed(2)} | ${avg(repotyRows, 'outputTokens').toFixed(2)} | ${avg(repotyRows, 'cacheReadTokens').toFixed(2)} | ${avg(repotyRows, 'toolCalls').toFixed(2)} | ${avg(repotyRows, 'seconds').toFixed(2)} | ${money(avg(repotyRows, 'costUsd'))} |\n\n## Overall delta (repoty - control)\n\n- Avg tokens: ${(avg(repotyRows, 'totalTokens') - avg(controlRows, 'totalTokens')).toFixed(2)}\n- Avg input tokens: ${(avg(repotyRows, 'inputTokens') - avg(controlRows, 'inputTokens')).toFixed(2)}\n- Avg output tokens: ${(avg(repotyRows, 'outputTokens') - avg(controlRows, 'outputTokens')).toFixed(2)}\n- Avg cache read tokens: ${(avg(repotyRows, 'cacheReadTokens') - avg(controlRows, 'cacheReadTokens')).toFixed(2)}\n- Avg tool calls: ${(avg(repotyRows, 'toolCalls') - avg(controlRows, 'toolCalls')).toFixed(2)}\n- Avg seconds: ${(avg(repotyRows, 'seconds') - avg(controlRows, 'seconds')).toFixed(2)}\n- Avg cost: ${money(avg(repotyRows, 'costUsd') - avg(controlRows, 'costUsd'))}\n\n## Interpretation\n\nExpected buckets:\n- positive: repoty should help\n- negative: repoty should hurt or add overhead\n- neutral: unclear/mixed\n\nObserved on this single-run benchmark:\n- **positive**: repoty cost more and used more tokens\n- **negative**: repoty also cost more and used more tokens, as expected\n- **neutral**: repoty cost much more and used many more tokens\n\nSo in this specific run set, repoty did not win on any of the three tasks, even though all runs succeeded. The strongest pattern is extra cache-read/context overhead from reading repoty-generated material in addition to the source files.\n\nBecause this uses only one run per condition, treat the results as directional rather than final proof.\n`;
fs.writeFileSync(path.join(root, 'results', 'FINAL-SUMMARY.md'), summary);
fs.writeFileSync(path.join(root, 'results', 'results.json'), JSON.stringify(rows, null, 2));
