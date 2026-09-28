#!/usr/bin/env node
/**
 * Mechanical audit of a curator run.
 *
 * The auditor agent's job is judgement — was this removal justified, does this
 * evidence actually support this date. Everything countable should be counted
 * before it starts, so its tokens go on the part a script cannot do.
 *
 * Compares the working tree against a git ref (default HEAD) and cross-checks
 * whatever the curator left in data/review/.
 *
 *   node agent/tools/audit-run.mjs                 compare against HEAD
 *   node agent/tools/audit-run.mjs --since <ref>   compare against another ref
 *   node agent/tools/audit-run.mjs --json          machine-readable
 *
 * Exit code is the number of BLOCKING findings, so a caller can branch on it.
 */
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { today as todayInDirectory } from '../../scripts/lib/today.mjs';

const runP = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REVIEW = join(ROOT, 'data', 'review');

const args = process.argv.slice(2);
const sinceIdx = args.indexOf('--since');
const SINCE = sinceIdx > -1 ? args[sinceIdx + 1] : 'HEAD';
const AS_JSON = args.includes('--json');
const today = todayInDirectory();

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const findings = [];
const add = (severity, kind, detail) => findings.push({ severity, kind, detail });

/* ---- load before / after ------------------------------------------------ */

// The audit judges curated rows — the ones curators touch. Feed rows
// (feed_source) come and go with their sources on every feed run; counting
// them here would report each expired meetup as a lost event.
const curatedOnly = (d) => d && { ...d, events: (d.events || []).filter((e) => !e.feed_source) };

const now = curatedOnly(JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8')));
let before = null;
try {
  before = curatedOnly(JSON.parse(execFileSync('git', ['show', `${SINCE}:data/events.json`],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })));
} catch {
  add('note', 'no-baseline', `Could not read data/events.json at ${SINCE}; skipping before/after checks.`);
}

/**
 * Identity is the name, not name+city.
 *
 * Keying on name+city made every legitimate city correction look like a
 * catastrophe: the record vanished under its old key and reappeared under a new
 * one, so a single fix reported as one removal, one addition and one skipped
 * queue row. Correcting a city is the most common repair this dataset needs,
 * and an audit that calls it data loss is an audit nobody will read.
 *
 * Names are near-unique here; where one is not, the city disambiguates.
 */
const idOf = (e) => norm(e.name);
const byKey = (arr) => {
  const m = new Map();
  for (const e of arr) {
    const k = idOf(e);
    // Two genuinely different events sharing a name are kept apart by city.
    m.set(m.has(k) ? `${k}|${norm(e.city)}` : k, e);
  }
  return m;
};

/* ---- 1. coverage --------------------------------------------------------- */

if (before) {
  const a = byKey(before.events), b = byKey(now.events);
  const gone = [...a.keys()].filter((k) => !b.has(k));
  const added = [...b.keys()].filter((k) => !a.has(k));
  const delta = now.events.length - before.events.length;

  add('info', 'coverage',
    `${before.events.length} -> ${now.events.length} events (${delta >= 0 ? '+' : ''}${delta}); ${added.length} added, ${gone.length} gone`);

  // A run that quietly loses events is the worst outcome, so every departure is
  // named and has to be accounted for by a patch reason.
  if (gone.length) {
    const reasons = existsSync(join(REVIEW, 'APPLIED.md'))
      ? readFileSync(join(REVIEW, 'APPLIED.md'), 'utf8') : '';
    for (const k of gone) {
      const e = a.get(k);
      const named = reasons.includes(e.name);
      add(named ? 'info' : 'blocking', 'event-removed',
        `${e.name} (${e.city})${named ? ' — has a recorded reason' : ' — NO recorded reason in APPLIED.md'}`);
    }
  }
}

/* ---- 2. did the curator answer for everything it was given? -------------- */

/**
 * Read what was actually handed to the curator, not what is queued now — the
 * queue is regenerated after every run, so comparing against the live file
 * would accuse the curator of skipping rows it was never given.
 *
 * The orchestrator writes this snapshot before dispatching. Without it the
 * check is skipped rather than guessed at.
 */
const dispatched = [];
const snapshot = join(REVIEW, 'DISPATCHED.tsv');
if (existsSync(snapshot)) {
  const rows = readFileSync(snapshot, 'utf8').trim().split('\n').slice(1);
  for (const r of rows) {
    const c = r.split('\t');
    if (c[0]) dispatched.push({ name: c[0], city: c[1], from: c[2] || 'queue' });
  }
} else {
  add('note', 'no-dispatch-snapshot',
    'data/review/DISPATCHED.tsv is absent, so "did the curator answer every row" was not checked. ' +
    'The orchestrator should write it before dispatching.');
}

const ledger = existsSync(join(REVIEW, 'verified.json'))
  ? JSON.parse(readFileSync(join(REVIEW, 'verified.json'), 'utf8')).entries : {};

// Match the answer on name alone. A curator that corrects an event's city
// files its ledger entry under the corrected city, which is right — insisting
// on the dispatched city would report the fix as a skipped row.
const answeredToday = new Set(
  Object.values(ledger).filter((v) => v.checked_on === today).map((v) => norm(v.name)));

const unanswered = dispatched.filter((d) => !answeredToday.has(norm(d.name)));
if (dispatched.length) {
  add(unanswered.length ? 'blocking' : 'info', 'queue-coverage',
    `${dispatched.length - unanswered.length}/${dispatched.length} dispatched rows have a ledger entry dated ${today}`);
  for (const u of unanswered.slice(0, 40)) {
    add('blocking', 'row-skipped', `${u.name} (${u.city}) was in ${u.from} but has no ledger entry from this run`);
  }
  if (unanswered.length > 40) add('blocking', 'row-skipped', `... and ${unanswered.length - 40} more`);
}

/* ---- 3. evidence quality ------------------------------------------------- */

/**
 * Only a claim needs evidence. `confirmed` and `corrected` assert something
 * about the world and have to show their working; `blocked` asserts only that
 * the page could not be read, and "no response" says that completely. Holding
 * failures to the same word count just fills the report with noise.
 */
const thin = Object.values(ledger)
  .filter((v) => v.checked_on === today && v.status !== 'blocked'
    && (!v.evidence || v.evidence.trim().length < 25));
if (thin.length) {
  add('warn', 'thin-evidence',
    `${thin.length} ledger entries from this run have evidence under 25 characters`);
  thin.slice(0, 10).forEach((v) => add('warn', 'thin-evidence', `  ${v.name} (${v.city}): "${v.evidence}"`));
}

/* ---- 4. internal consistency of the data --------------------------------- */

for (const e of now.events) {
  const where = `${e.name} (${e.city})`;
  for (const k of ['next_date', 'next_date_end', 'last_date']) {
    if (e[k] && !ISO.test(e[k])) add('blocking', 'bad-date', `${where}: ${k} = "${e[k]}"`);
  }
  if (e.next_date && e.next_date_end && e.next_date_end < e.next_date) {
    add('blocking', 'bad-date', `${where}: next_date_end before next_date`);
  }
  if (e.last_date && e.last_date > today) {
    add('blocking', 'bad-date', `${where}: last_date ${e.last_date} is in the future`);
  }
  if (e.next_date && e.last_date && e.next_date === e.last_date) {
    add('warn', 'bad-date', `${where}: next_date and last_date are identical (${e.next_date})`);
  }
  if (!/^https?:\/\//i.test(e.url || '')) add('blocking', 'bad-url', `${where}: ${e.url}`);
}

/* ---- 5. duplicates ------------------------------------------------------- */

/**
 * Near-name duplicates, whatever their URLs.
 *
 * The build merges a shared page only when names nest, and the same-day check
 * below only compares events on one host. Neither sees one event filed under
 * two nesting names on two different sites — and that is exactly what a curator
 * produces when it gives one copy of a duplicate its own URL. The Kentucky
 * Entrepreneur Hall of Fame "Induction" and "Induction Celebration" were merged
 * while they shared a page, then silently split into two listings the moment
 * one got a proper link.
 */
{
  // Whole words only: a plain substring test matched "CES" inside "Access".
  const words = (s) => ` ${String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  const nests = (a, b) => {
    const wa = words(a), wb = words(b);
    return wa !== wb && (wa.includes(wb) || wb.includes(wa));
  };
  // Undated events are compared on their held edition, so a duplicate does not
  // hide simply because neither copy has a next date yet.
  const dayOf = (e) => e.next_date || e.last_date || '';
  const byCityDay = new Map();
  for (const e of now.events) {
    const day = dayOf(e);
    if (!day) continue;
    const k = `${norm(e.city)}|${day}`;
    if (!byCityDay.has(k)) byCityDay.set(k, []);
    byCityDay.get(k).push(e);
  }
  for (const group of byCityDay.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (nests(group[i].name, group[j].name)) {
          add('blocking', 'duplicate',
            `${group[i].name} and ${group[j].name}: same city and date (${dayOf(group[i])}) and one name contains the other — one event listed twice`);
        }
      }
    }
  }
}

/**
 * A held edition must never be lost.
 *
 * last_date only ever moves forward: an edition, once held, stays held. When it
 * goes backwards or is emptied, some patch has overwritten the record of an
 * event that happened. Five events lost their 2026 edition this way in one
 * cycle, and nothing here noticed — the dates were all well-formed, just older
 * than they should have been.
 */
if (before) {
  /**
   * A backwards move is only a loss if nobody meant it. Correcting a wrong
   * last_date — a blog post's publication date stored as the event's — moves it
   * backwards too, and that is a fix. The patch log records every field a patch
   * set deliberately, so a last_date change that appears there is a correction;
   * one that does not was a side effect of overwriting something else.
   */
  const applied = existsSync(join(REVIEW, 'APPLIED.md')) ? readFileSync(join(REVIEW, 'APPLIED.md'), 'utf8') : '';
  const deliberate = new Set();
  for (const line of applied.split('\n')) {
    const m = line.match(/UPDATE (.+?) \([^)]*\) — .*last_date: /);
    if (m) deliberate.add(norm(m[1]));
  }

  const prev = byKey(before.events);
  for (const e of now.events) {
    const was = prev.get(idOf(e)) || prev.get(`${idOf(e)}|${norm(e.city)}`);
    if (!was || !was.last_date) continue;
    if (!e.last_date || e.last_date < was.last_date) {
      const meant = deliberate.has(norm(e.name));
      add(meant ? 'info' : 'blocking', meant ? 'last-date-corrected' : 'lost-edition',
        `${e.name} (${e.city}): last_date went ${was.last_date} -> ${e.last_date || '(empty)'}` +
        (meant ? ' — set deliberately by a patch' : ' — no patch set it, so a held edition was overwritten'));
    }
  }
}

const nameCity = new Map(), pageCity = new Map(), sameDay = new Map();
for (const e of now.events) {
  const nk = `${norm(e.name)}|${norm(e.city)}`;
  const page = String(e.url).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
  const pk = `${page}|${norm(e.city)}`;
  if (nameCity.has(nk)) add('blocking', 'duplicate', `${e.name} (${e.city}) appears twice by name+city`);
  nameCity.set(nk, e);
  if (pageCity.has(pk)) {
    add('warn', 'duplicate',
      `${e.name} and ${pageCity.get(pk).name} share ${page} in ${e.city} — kept as two events; each needs its own URL`);
  }
  pageCity.set(pk, e);

  /**
   * Same host, same city, same start date, different path. The page-key dedup
   * misses these because the paths differ — Tech Week Los Angeles and LA Tech
   * Week hid there for weeks.
   *
   * But a shared host and start date is also exactly what a tech week and the
   * events inside it look like: a2Tech360 runs eleven days and Tech Homecoming
   * is a career fair on its opening day, both on a2tech360.com. So only an
   * identical type *and* an identical span is treated as a duplicate; anything
   * else is a warning, because the honest reading is usually "one is part of
   * the other".
   */
  if (e.next_date) {
    const host = String(e.url).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    const sk = `${host}|${norm(e.city)}|${e.next_date}`;
    const twin = sameDay.get(sk);
    if (twin) {
      const sameType = twin.type === e.type;
      const sameSpan = (twin.next_date_end || '') === (e.next_date_end || '');
      const sameVenue = norm(twin.venue) === norm(e.venue);

      /**
       * Two events on one host and one morning are usually not a duplicate.
       * a2Tech360 runs eleven days with a career fair inside it; the Roux
       * Institute simply had a conference and a breakfast series on the same
       * date at different addresses. Both were audited and both are legitimate.
       *
       * A differing type *and* a differing venue is strong enough evidence of
       * two real events to say nothing at all — flagging those trained the eye
       * to skip this check, which is worse than not having it.
       */
      if (!sameType && !sameVenue) { sameDay.set(sk, e); continue; }

      add(sameType && sameSpan ? 'blocking' : 'warn', 'duplicate',
        sameType && sameSpan
          ? `${e.name} and ${twin.name}: same city, type and span on ${e.next_date} via ${host} — one event filed twice`
          : `${e.name} (${e.type}) and ${twin.name} (${twin.type}) share ${host} and start ${e.next_date} in ${e.city} — check whether one runs inside the other`);
    }
    sameDay.set(sk, e);
  }
}

/* ---- 6. links the run touched ------------------------------------------- */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

let changedUrls = [];
if (before) {
  const a = byKey(before.events);
  for (const e of now.events) {
    // Must use the same key shape byKey builds, or every event reads as new and
    // the "changed links" probe silently becomes a full re-probe of the dataset.
    const prev = a.get(idOf(e)) || a.get(`${idOf(e)}|${norm(e.city)}`);
    if (prev && prev.url !== e.url) changedUrls.push(e);
    else if (!prev) changedUrls.push(e);   // newly added: never been probed
  }
}

if (changedUrls.length) {
  process.stderr.write(`Probing ${changedUrls.length} new or changed URL(s)\n`);
  const probe = async (e) => {
    try {
      const { stdout } = await runP('curl',
        ['-sSL', '--max-time', '20', '-A', UA, '-o', process.platform === 'win32' ? 'NUL' : '/dev/null',
          '-w', '%{http_code}', e.url], { timeout: 25000 });
      return { e, status: Number(stdout.trim()) || 0 };
    } catch { return { e, status: 0 }; }
  };
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < changedUrls.length) out.push(await probe(changedUrls[i++]));
  }));
  const dead = out.filter((r) => r.status === 0 || r.status === 404 || r.status === 410);
  add(dead.length ? 'blocking' : 'info', 'link-health',
    `${out.length - dead.length}/${out.length} new or changed links resolve`);
  // 403/429 are bot walls, not regressions — a human clicking through is fine.
  for (const r of dead) add('blocking', 'dead-link', `${r.e.name} (${r.e.city}) -> [${r.status}] ${r.e.url}`);
}

/* ---- report -------------------------------------------------------------- */

const blocking = findings.filter((f) => f.severity === 'blocking');
const warn = findings.filter((f) => f.severity === 'warn');

if (AS_JSON) {
  console.log(JSON.stringify({ audited_on: today, since: SINCE, blocking: blocking.length, warnings: warn.length, findings }, null, 2));
} else {
  const bySev = { blocking: [], warn: [], info: [], note: [] };
  for (const f of findings) bySev[f.severity].push(f);
  for (const sev of ['blocking', 'warn', 'info', 'note']) {
    if (!bySev[sev].length) continue;
    console.log(`\n${sev.toUpperCase()} (${bySev[sev].length})`);
    console.log('-'.repeat(40));
    for (const f of bySev[sev]) console.log(`  [${f.kind}] ${f.detail}`);
  }
  console.log(`\n${blocking.length} blocking, ${warn.length} warnings.`);
}

writeFileSync(join(REVIEW, 'AUDIT.json'),
  JSON.stringify({ audited_on: today, since: SINCE, blocking: blocking.length, warnings: warn.length, findings }, null, 2) + '\n');

process.exitCode = Math.min(blocking.length, 250);
