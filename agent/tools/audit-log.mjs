#!/usr/bin/env node
/**
 * The audit log: every auditor run, every finding it raised, and what became of it.
 * Kept so that, over time, we can see how often audits find anything and set the
 * audit cadence from evidence rather than habit.
 *
 *   node agent/tools/audit-log.mjs add [findings.json]     log a run (default: data/review/AUDIT-FINDINGS.json)
 *   node agent/tools/audit-log.mjs resolve <id> <fixed|wont-fix|deferred> "<what was done>"
 *   node agent/tools/audit-log.mjs open                    list findings still open
 *   node agent/tools/audit-log.mjs render                  rewrite docs/AUDIT-LOG.md
 *
 * `add` and `resolve` re-render on their own. The JSON is the record; the markdown is
 * generated from it and never edited by hand.
 *
 * Findings file (written by the auditor next to AUDIT-REPORT.md):
 *   { "date": "2026-10-11", "iteration": 1, "scope": "what was audited",
 *     "checked": "what was sampled and held up (one line)",
 *     "findings": [ { "severity": "blocking"|"warning", "event": "...", "summary": "...",
 *                     "recommendation": "...", "repeat_of": "<earlier id, optional>" } ] }
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const LOG = 'data/review/audit-log.json';
const MD = 'docs/AUDIT-LOG.md';
const STATUSES = ['open', 'fixed', 'wont-fix', 'deferred'];

const load = () => (existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : { runs: [] });
const save = (log) => writeFileSync(LOG, JSON.stringify(log, null, 2) + '\n');
const today = () => new Date().toISOString().slice(0, 10);
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const allFindings = (log) => log.runs.flatMap((r) => r.findings.map((f) => ({ ...f, run: r.id })));

function add(file = 'data/review/AUDIT-FINDINGS.json') {
  const log = load();
  const input = JSON.parse(readFileSync(file, 'utf8'));
  const date = input.date || today();
  const iteration = input.iteration || 1;
  const id = `${date}-i${iteration}`;
  if (log.runs.some((r) => r.id === id)) throw new Error(`run ${id} is already logged`);
  let b = 0, w = 0;
  const findings = (input.findings || []).map((f) => {
    const n = f.severity === 'blocking' ? `B${++b}` : `W${++w}`;
    return { id: `${id}-${n}`, severity: f.severity, event: f.event || '', summary: f.summary,
      recommendation: f.recommendation || '', repeat_of: f.repeat_of || null,
      status: 'open', resolved_on: null, resolution: null };
  });
  log.runs.push({ id, date, iteration, scope: input.scope || '', checked: input.checked || '',
    blocking: b, warnings: w, findings });
  log.runs.sort((x, y) => x.id.localeCompare(y.id));
  save(log);
  console.log(`logged ${id}: ${b} blocking, ${w} warning(s)`);
  render(log);
}

function resolve(id, status, note) {
  if (!STATUSES.includes(status) || status === 'open') throw new Error(`status must be one of fixed, wont-fix, deferred`);
  if (!note) throw new Error('say what was done');
  const log = load();
  const f = log.runs.flatMap((r) => r.findings).find((x) => x.id === id);
  if (!f) throw new Error(`no finding ${id}`);
  Object.assign(f, { status, resolved_on: today(), resolution: note });
  save(log);
  console.log(`${id} -> ${status}`);
  render(log);
}

function listOpen() {
  const open = allFindings(load()).filter((f) => f.status === 'open' || f.status === 'deferred');
  for (const f of open) console.log(`${f.id}  [${f.severity}/${f.status}]  ${f.event ? f.event + ' — ' : ''}${f.summary}`);
  if (!open.length) console.log('nothing open');
}

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ');

function render(log = load()) {
  const runs = log.runs;
  const findings = allFindings(log);
  const open = findings.filter((f) => f.status === 'open' || f.status === 'deferred');
  const out = [];
  out.push('# Audit log', '',
    'Every auditor run, what it flagged, and what was done about it. Generated from',
    '`data/review/audit-log.json` by `node agent/tools/audit-log.mjs render`; do not edit by hand.', '');

  // The cadence question: does a longer gap between audits mean more findings?
  out.push('## Runs', '', '| run | days since previous run | blocking | warnings | fixed | still open | scope |', '|---|---|---|---|---|---|---|');
  // A cycle is every run on one date; its first run is the one that says what a gap costs.
  let prevDate = null;
  const first = [];
  for (const r of runs) {
    const opens = r.date !== prevDate;
    const gap = !opens ? 're-audit' : prevDate ? days(prevDate, r.date) : '—';
    const fixed = r.findings.filter((f) => f.status === 'fixed').length;
    const still = r.findings.filter((f) => f.status === 'open' || f.status === 'deferred').length;
    out.push(`| ${r.id} | ${gap} | ${r.blocking} | ${r.warnings} | ${fixed} | ${still} | ${cell(r.scope)} |`);
    if (opens) first.push(r);
    prevDate = r.date;
  }
  if (first.length) {
    const withBlocking = first.filter((r) => r.blocking > 0).length;
    const repeats = findings.filter((f) => f.repeat_of).length;
    out.push('', `**${first.length} audit cycle(s); ${withBlocking} found something blocking on its first audit.** ` +
      `${findings.length} findings in total, ${findings.filter((f) => f.status === 'fixed').length} fixed, ${open.length} open or deferred, ` +
      `${repeats} repeat(s) of an earlier finding.`);
  }

  out.push('', '## Open', '');
  if (!open.length) out.push('Nothing open.');
  for (const f of open) {
    out.push(`- **${f.id}** · ${f.severity}${f.status === 'deferred' ? ' · deferred' : ''} · ${f.event ? `**${f.event}** — ` : ''}${f.summary}`);
    if (f.recommendation) out.push(`  - recommended: ${f.recommendation}`);
    if (f.resolution) out.push(`  - note: ${f.resolution}`);
  }

  out.push('', '## History', '');
  for (const r of [...runs].reverse()) {
    out.push(`### ${r.id} — ${r.blocking} blocking, ${r.warnings} warning(s)`, '');
    if (r.scope) out.push(`Scope: ${r.scope}`, '');
    if (r.findings.length) {
      out.push('| id | severity | event | finding | status | resolution |', '|---|---|---|---|---|---|');
      for (const f of r.findings) {
        out.push(`| ${f.id.slice(r.id.length + 1)} | ${f.severity} | ${cell(f.event)} | ${cell(f.summary)} | ${f.status}${f.resolved_on ? ` (${f.resolved_on})` : ''} | ${cell(f.resolution)} |`);
      }
      out.push('');
    } else out.push('Clean.', '');
    if (r.checked) out.push(`Checked and sound: ${r.checked}`, '');
  }
  writeFileSync(MD, out.join('\n'));
  console.log(`wrote ${MD}`);
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'add') add(args[0]);
  else if (cmd === 'resolve') resolve(args[0], args[1], args.slice(2).join(' '));
  else if (cmd === 'open') listOpen();
  else if (cmd === 'render') render();
  else { console.log('usage: audit-log.mjs add [file] | resolve <id> <status> "<note>" | open | render'); process.exit(1); }
} catch (err) { console.error(err.message); process.exit(1); }
