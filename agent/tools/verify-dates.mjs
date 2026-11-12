#!/usr/bin/env node
/**
 * Script-side date maintenance.
 *
 * Agents are for discovery — finding events and working out where they live.
 * Once an event is tagged with a URL, keeping its date honest is a scrape, not
 * a reasoning task, and paying an agent to read a page and conclude "nothing
 * changed" is the most expensive way to learn nothing. In one 22-row agent pass
 * 21 rows came back confirmed-unchanged.
 *
 * So this does the cheap, definitive part:
 *
 *   confirmed   the stored date is still on the page      -> ledger entry, no agent
 *   moved       the page publishes a different date       -> patch proposal, needs a human/agent nod
 *   ambiguous   page loads but says nothing we can read   -> hand to an agent
 *   unreadable  captcha, 403, empty                       -> hand to an agent
 *
 * Confirming is deliberately easier than extracting: it only has to find a date
 * it already knows, rendered any of the ways a site might render it. Extraction
 * is attempted only to explain a failure, never to overwrite silently.
 *
 *   node scripts/verify-dates.mjs                 every dated event
 *   node scripts/verify-dates.mjs --queue         only what the ledger says is due
 *   node scripts/verify-dates.mjs --n 60          a sample
 *   node scripts/verify-dates.mjs --write         write ledger + patch proposals
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { today as todayInDirectory } from '../../scripts/lib/today.mjs';
import { judgePage } from '../../scripts/lib/date-match.mjs';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REVIEW = join(ROOT, 'data', 'review');
// Curated rows only: feed rows (feed_source) are re-read from their source by
// scripts/feeds/run.mjs, which is their verification.
const events = JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8')).events.filter((e) => !e.feed_source);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const today = todayInDirectory();
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const num = (f, d) => { const i = args.indexOf(f); return i > -1 ? Number(args[i + 1]) : d; };
const WRITE = has('--write');
const CONC = Number(process.env.CONCURRENCY || 6);


/* ---- which events to check --------------------------------------------- */

let targets = events.filter((e) => e.next_date && e.next_date >= today);

if (has('--queue')) {
  const todo = join(REVIEW, 'TO-VERIFY.tsv');
  if (!existsSync(todo)) { console.error('No TO-VERIFY.tsv — run `npm run ledger` first.'); process.exit(1); }
  const rows = readFileSync(todo, 'utf8').trim().split('\n').slice(1);
  const want = new Set(rows.map((r) => { const c = r.split('\t'); return `${c[2]}|${c[3]}`; }));
  targets = targets.filter((e) => want.has(`${e.name}|${e.city}`));
}
const N = num('--n', 0);
if (N > 0) targets = targets.slice(0, N);

/* ---- the check: page judgement lives in scripts/lib/date-match.mjs ------ */

async function fetchBody(url) {
  try {
    const { stdout } = await run('curl', ['-sSL', '--max-time', '25', '-A', UA, url],
      { maxBuffer: 24 * 1024 * 1024 });
    return stdout || '';
  } catch { return ''; }
}

async function check(e) {
  return { e, ...judgePage(e, await fetchBody(e.url), today) };
}


const results = [];
let cursor = 0;
async function worker() {
  while (cursor < targets.length) {
    const e = targets[cursor++];
    results.push(await check(e));
    if (results.length % 25 === 0) process.stderr.write(`  ...${results.length}/${targets.length}\n`);
  }
}

process.stderr.write(`Checking ${targets.length} dated events with ${CONC} workers\n`);
await Promise.all(Array.from({ length: CONC }, worker));

const by = (v) => results.filter((r) => r.verdict === v);
const pct = (n) => ((n / results.length) * 100).toFixed(0);

console.log(`\nchecked ${results.length}`);
for (const v of ['confirmed', 'moved', 'ambiguous', 'unreadable']) {
  console.log(`  ${String(by(v).length).padStart(4)}  ${v.padEnd(11)} ${pct(by(v).length)}%`);
}

if (by('moved').length) {
  console.log('\nMOVED — the page publishes a different date:');
  for (const r of by('moved')) {
    console.log(`  ${r.e.name} — ${r.e.city}`);
    console.log(`      stored ${r.e.next_date}   ${r.note}`);
  }
}

console.log(`\nAgent work avoided: ${by('confirmed').length} of ${results.length} settled without one.`);
console.log(`Agent work remaining: ${by('ambiguous').length + by('unreadable').length}.`);

/* ---- outputs ------------------------------------------------------------- */

if (!WRITE) { console.log('\n(dry run — pass --write to record these)'); process.exit(0); }

/**
 * Record the failures as well as the successes.
 *
 * Writing only confirmations left the ledger unable to withdraw a verdict: an
 * event this script had previously confirmed, and can no longer confirm, would
 * keep its old entry and stay off the queue forever. Ambiguous and unreadable
 * are recorded as `blocked`, which is what they are — attempted, not settled.
 */
const entries = [
  ...by('confirmed').map((r) => ({
    name: r.e.name, city: r.e.city, status: 'confirmed', checked_on: today,
    cycle: 'script', evidence: `automated: ${r.note}`,
  })),
  ...[...by('ambiguous'), ...by('unreadable')].map((r) => ({
    name: r.e.name, city: r.e.city, status: 'blocked', checked_on: today,
    cycle: 'script', evidence: `automated: ${r.note}`,
  })),
];
if (entries.length) {
  writeFileSync(join(REVIEW, 'confirm-script.json'), JSON.stringify(entries, null, 2) + '\n');
  console.log(`\nWrote ${entries.length} ledger entries to data/review/confirm-script.json ` +
    `(${by('confirmed').length} confirmed, ${entries.length - by('confirmed').length} blocked)`);
}

/**
 * Moves are proposed, never applied. A script that silently rewrote dates on
 * the strength of one regex would be a worse failure mode than a stale date.
 */
const proposals = by('moved').map((r) => ({
  match: { name: r.e.name, city: r.e.city },
  action: 'update',
  reason: `Automated check: the stored date ${r.e.next_date} no longer appears on ${r.e.url}, and ${r.note}. REVIEW BEFORE APPLYING.`,
  set: { next_date: r.proposed.start, next_date_end: r.proposed.end },
}));
if (proposals.length) {
  writeFileSync(join(REVIEW, 'PROPOSED-moves.json'), JSON.stringify(proposals, null, 2) + '\n');
  console.log(`Wrote ${proposals.length} proposed move(s) to data/review/PROPOSED-moves.json — review, then rename to apply.`);
}

const handoff = [...by('ambiguous'), ...by('unreadable')];
if (handoff.length) {
  writeFileSync(join(REVIEW, 'NEEDS-AGENT.tsv'),
    'verdict\tname\tcity\tnext_date\tnote\turl\n' +
    handoff.map((r) => [r.verdict, r.e.name, r.e.city, r.e.next_date, r.note, r.e.url].join('\t')).join('\n') + '\n');
  console.log(`Wrote ${handoff.length} row(s) needing an agent to data/review/NEEDS-AGENT.tsv`);
}
