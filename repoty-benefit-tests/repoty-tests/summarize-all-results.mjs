import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const raw = path.join(root, 'results/raw');
function parseSession(file) {
  const s = fs.readFileSync(file, 'utf8');
  const toolCalls = Number((s.match(/Tool calls: (\d+)/) ?? [])[1] ?? 0);
  const tok = s.match(/Tokens: ([\d,]+) total \(([\d,]+) input, ([\d,]+) output, ([\d,]+) cache read, ([\d,]+) cache write\)/);
  const cost = s.match(/Cost: \$([\d.]+)/);
  const model = s.match(/Last model: (.+)/);
  return { toolCalls, totalTokens:+tok?.[1].replaceAll(',','')||0, inputTokens:+tok?.[2].replaceAll(',','')||0, outputTokens:+tok?.[3].replaceAll(',','')||0, cacheReadTokens:+tok?.[4].replaceAll(',','')||0, cacheWriteTokens:+tok?.[5].replaceAll(',','')||0, costUsd:+cost?.[1]||0, model:model?.[1]?.trim()||'unknown' };
}
const rows = [];
for (const name of fs.readdirSync(raw).filter(f=>f.endsWith('.session.txt'))) {
  const m = name.match(/^(.*)-(control|repoty)-run(\d+)\.session\.txt$/);
  if (!m) continue;
  const [, caseName, condition, run] = m;
  const base = `${caseName}-${condition}-run${run}`;
  rows.push({ case:caseName, size:caseName.startsWith('medium-')?'medium':'small', condition, run:+run, success:fs.readFileSync(path.join(raw,`${base}.test-status.txt`),'utf8').trim()==='PASS', seconds:+fs.readFileSync(path.join(raw,`${base}.seconds.txt`),'utf8').trim(), ...parseSession(path.join(raw,name)) });
}
rows.sort((a,b)=>a.case.localeCompare(b.case)||a.condition.localeCompare(b.condition)||a.run-b.run);
const avg=(xs,k)=>xs.reduce((a,x)=>a+(k==='success'?(x[k]?1:0):x[k]),0)/xs.length;
const money=n=>`$${n.toFixed(6)}`; const num=n=>Number.isInteger(n)?String(n):n.toFixed(2);
function table(rs){return ['| Case | Size | Condition | Run | Success | Tokens | Input | Output | Cache read | Tool calls | Seconds | Cost |','|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',...rs.map(r=>`| ${r.case} | ${r.size} | ${r.condition} | ${r.run} | ${r.success?'yes':'no'} | ${r.totalTokens} | ${r.inputTokens} | ${r.outputTokens} | ${r.cacheReadTokens} | ${r.toolCalls} | ${r.seconds} | ${money(r.costUsd)} |`)].join('\n')}
function avgTable(groups){return ['| Group | Condition | Runs | Success | Avg tokens | Avg input | Avg output | Avg cache read | Avg tool calls | Avg seconds | Avg cost |','|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',...groups.map(g=>`| ${g.name} | ${g.condition} | ${g.rs.length} | ${(100*avg(g.rs,'success')).toFixed(0)}% | ${num(avg(g.rs,'totalTokens'))} | ${num(avg(g.rs,'inputTokens'))} | ${num(avg(g.rs,'outputTokens'))} | ${num(avg(g.rs,'cacheReadTokens'))} | ${num(avg(g.rs,'toolCalls'))} | ${num(avg(g.rs,'seconds'))} | ${money(avg(g.rs,'costUsd'))} |`)].join('\n')}
function groupsBy(keys){const map=new Map(); for(const r of rows){const vals=keys.map(k=>r[k]).join(' / '); for(const condition of ['control','repoty']){} const key=vals+'|'+r.condition; if(!map.has(key)) map.set(key,{name:vals,condition:r.condition,rs:[]}); map.get(key).rs.push(r);} return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.condition.localeCompare(b.condition));}
const perCase=groupsBy(['case']); const perSize=groupsBy(['size']); const overall=['control','repoty'].map(condition=>({name:'overall',condition,rs:rows.filter(r=>r.condition===condition)}));
function delta(name, control, repoty){return `### ${name}\n\n- Success: ${(100*avg(repoty,'success')).toFixed(0)}% repoty vs ${(100*avg(control,'success')).toFixed(0)}% control\n- Avg tokens delta: ${num(avg(repoty,'totalTokens')-avg(control,'totalTokens'))}\n- Avg input delta: ${num(avg(repoty,'inputTokens')-avg(control,'inputTokens'))}\n- Avg output delta: ${num(avg(repoty,'outputTokens')-avg(control,'outputTokens'))}\n- Avg cost delta: ${money(avg(repoty,'costUsd')-avg(control,'costUsd'))}\n- Avg seconds delta: ${num(avg(repoty,'seconds')-avg(control,'seconds'))}\n- Avg tool calls delta: ${num(avg(repoty,'toolCalls')-avg(control,'toolCalls'))}`}
let deltas=[]; for(const name of [...new Set(rows.map(r=>r.case))]) deltas.push(delta(name, rows.filter(r=>r.case===name&&r.condition==='control'), rows.filter(r=>r.case===name&&r.condition==='repoty')));
deltas.push(delta('overall', rows.filter(r=>r.condition==='control'), rows.filter(r=>r.condition==='repoty')));
const md=`# Repoty A/B benchmark summary - all runs\n\nIncludes the original small cases and the newer medium cases. Medium cases used one run per condition to conserve usage. Repoty variants were prepared with \`repoty init\` and \`repoty integrate agents\`.\n\n## Per-run data\n\n${table(rows)}\n\n## Per-case averages\n\n${avgTable(perCase)}\n\n## By repo size\n\n${avgTable(perSize)}\n\n## Overall averages\n\n${avgTable(overall)}\n\n## Deltas: repoty minus control\n\n${deltas.join('\n\n')}\n\n## Conclusion\n\nRepoty was mixed on the medium cases: the medium billing bug was cheaper and faster with repoty, while the medium fulfillment feature was more expensive and slower with repoty. Across all current synthetic runs, success stayed equal at 100%, but repoty still averaged higher tokens and cost overall. This suggests the current small/medium synthetic cases are not enough to prove a consistent benefit. A real larger project is a better next test, especially where the agent would otherwise need broad repository discovery.\n`;
fs.writeFileSync(path.join(root,'results/FINAL-SUMMARY-ALL.md'),md);
for(const name of [...new Set(rows.map(r=>r.case))]) fs.writeFileSync(path.join(root,`results/${name}-results.md`),`# ${name} results\n\n${table(rows.filter(r=>r.case===name))}\n\n${avgTable(perCase.filter(g=>g.name===name))}\n`);
fs.writeFileSync(path.join(root,'results/results-all.json'),JSON.stringify(rows,null,2));
