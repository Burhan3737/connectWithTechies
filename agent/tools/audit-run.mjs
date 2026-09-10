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

const runP = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REVIEW = join(ROOT, 'data', 'review');

const args = process.argv.slice(2);
const sinceIdx = args.indexOf('--since');
const SINCE = sinceIdx > -1 ? args[sinceIdx + 1] : 'HEAD';
const AS_JSON = args.includes('--json');
const today = process.env.TODAY || new Date().toISOString().slice(0, 10);

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const findings = [];
const add = (severity, kind, detail) => findings.push({ severity, kind, detail });

/* ---- load before / after ------------------------------------------------ */

const now = JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8'));
let before = null;
try {
  before = JSON.parse(execFileSync('git', ['show', `${SINCE}:data/events.json`],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
} catch {
  add('note', 'no-baseline', `Could not read data/events.json at ${SINCE}; skipping before/after checks.`);
}

const byKey = (arr) => new Map(arr.map((e) => [`${norm(e.name)}|${norm(e.city)}`, e]));

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

const answeredToday = new Set(
  Object.values(ledger).filter((v) => v.checked_on === today)
    .map((v) => `${norm(v.name)}|${norm(v.city)}`));

const unanswered = dispatched.filter((d) => !answeredToday.has(`${norm(d.name)}|${norm(d.city)}`));
if (dispatched.length) {
  add(unanswered.length ? 'blocking' : 'info', 'queue-coverage',
    `${dispatched.length - unanswered.length}/${dispatched.length} dispatched rows have a ledger entry dated ${today}`);
  for (const u of unanswered.slice(0, 40)) {
    add('blocking', 'row-skipped', `${u.name} (${u.city}) was in ${u.from} but has no ledger entry from this run`);
  }
  if (unanswered.length > 40) add('blocking', 'row-skipped', `... and ${unanswered.length - 40} more`);
}

/* ---- 3. evidence quality ------------------------------------------------- */

const thin = Object.values(ledger)
  .filter((v) => v.checked_on === today && (!v.evidence || v.evidence.trim().length < 25));
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

const nameCity = new Map(), pageCity = new Map();
for (const e of now.events) {
  const nk = `${norm(e.name)}|${norm(e.city)}`;
  const page = String(e.url).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
  const pk = `${page}|${norm(e.city)}`;
  if (nameCity.has(nk)) add('blocking', 'duplicate', `${e.name} (${e.city}) appears twice by name+city`);
  nameCity.set(nk, e);
  if (pageCity.has(pk)) {
    add('warn', 'duplicate',
      `${e.name} and ${pageCity.get(pk).name} share ${page} in ${e.city} — these merge into one on the next build`);
  }
  pageCity.set(pk, e);
}

/* ---- 6. links the run touched ------------------------------------------- */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

let changedUrls = [];
if (before) {
  const a = byKey(before.events);
  for (const e of now.events) {
    const prev = a.get(`${norm(e.name)}|${norm(e.city)}`);
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
