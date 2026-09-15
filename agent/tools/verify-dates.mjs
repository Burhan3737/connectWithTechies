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

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REVIEW = join(ROOT, 'data', 'review');
const { events } = JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8'));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const today = process.env.TODAY || new Date().toISOString().slice(0, 10);
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const num = (f, d) => { const i = args.indexOf(f); return i > -1 ? Number(args[i + 1]) : d; };
const WRITE = has('--write');
const CONC = Number(process.env.CONCURRENCY || 6);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

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

/* ---- rendering a known date every way a site might print it -------------- */

/**
 * The point is recall, not precision: we already know the date, so a generous
 * set of renderings costs nothing and a missed rendering costs a false alarm.
 */
function renderings(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const M = MONTHS[m - 1], Mon = M.slice(0, 3);
  const dd = String(d).padStart(2, '0'), mm = String(m).padStart(2, '0');
  const out = [
    iso,
    `${M} ${d}, ${y}`, `${M} ${d} ${y}`, `${M} ${d}`,
    `${Mon} ${d}, ${y}`, `${Mon} ${d} ${y}`, `${Mon}. ${d}, ${y}`, `${Mon} ${d}`,
    `${d} ${M} ${y}`, `${d} ${Mon} ${y}`,
    `${m}/${d}/${y}`, `${mm}/${dd}/${y}`, `${mm}/${dd}`,
    `${y}/${mm}/${dd}`, `${dd}.${mm}.${y}`,
  ];
  return [...new Set(out.map((s) => s.toLowerCase()))];
}

const strip = (h) => h
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#8211;|&ndash;|&mdash;|&#8212;/g, '-')
  .replace(/\s+/g, ' ')
  .toLowerCase();

/** JSON-LD is the only extraction trusted enough to propose a replacement. */
function jsonLdDates(body) {
  const m = [...body.matchAll(/"startDate"\s*:\s*"(\d{4}-\d{2}-\d{2})[^"]*"(?:[\s\S]{0,400}?"endDate"\s*:\s*"(\d{4}-\d{2}-\d{2})[^"]*")?/g)];
  return m.map((x) => ({ start: x[1], end: x[2] || x[1] }))
    .filter((x) => x.start >= today)
    .sort((a, b) => a.start.localeCompare(b.start));
}

async function fetchBody(url) {
  try {
    const { stdout } = await run('curl', ['-sSL', '--max-time', '25', '-A', UA, url],
      { maxBuffer: 24 * 1024 * 1024 });
    return stdout || '';
  } catch { return ''; }
}

/* ---- the check ----------------------------------------------------------- */

async function check(e) {
  const body = await fetchBody(e.url);
  if (!body || body.length < 500) return { e, verdict: 'unreadable', note: body ? `${body.length}-byte stub, likely a captcha` : 'no response' };

  /**
   * Match against readable text only, never the raw HTML.
   *
   * Matching the source let hits land inside another event's JSON-LD, an .ics
   * href query string, and The Events Calendar's own `selected_end_datetime`
   * view window — which made an ISO match close to self-fulfilling on any
   * WordPress events page.
   */
  const text = strip(body);
  const hit = renderings(e.next_date).find((r) => text.includes(r));

  if (hit) {
    /**
     * The decoy test: does this page also "confirm" dates the event does not
     * have? If it does, it is a page the matcher cannot read — a listing of
     * many events, a calendar grid, a run of unrelated dates — and a hit on the
     * real date there is a coincidence, not evidence.
     *
     * An audit measured this: on listing pages, 32% of confirmations also
     * matched a fabricated date. Those were being recorded as settled, so
     * nothing would ever look at them again. An unchecked event is recoverable;
     * a falsely-confirmed one is not.
     */
    const decoys = [7, -21, 35, 14].map((d) => {
      const dt = new Date(e.next_date);
      dt.setDate(dt.getDate() + d);
      return dt.toISOString().slice(0, 10);
    });
    const fooled = decoys.filter((d) => renderings(d).some((r) => text.includes(r)));
    if (fooled.length) {
      return {
        e, verdict: 'ambiguous',
        note: `"${hit}" appears, but so do ${fooled.length} date(s) this event does not have ` +
              `(e.g. ${fooled[0]}) — the page lists too many dates for a match to mean anything`,
      };
    }
    return { e, verdict: 'confirmed', note: `page shows "${hit}" and no decoy date` };
  }

  // Not found. Only JSON-LD is trusted to say where it went.
  const ld = jsonLdDates(body);
  if (ld.length && ld[0].start !== e.next_date) {
    return { e, verdict: 'moved', note: `page JSON-LD gives ${ld[0].start}${ld[0].end !== ld[0].start ? '..' + ld[0].end : ''}`, proposed: ld[0] };
  }
  return { e, verdict: 'ambiguous', note: 'page loads but the stored date is not on it and it publishes no structured date' };
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
