#!/usr/bin/env node
/**
 * Verification ledger.
 *
 * Records which events have actually been checked against the organiser's own
 * page, so later passes spend their budget on what is still unknown instead of
 * re-verifying what is already settled.
 *
 * State lives in data/review/verified.json (machine-readable) and is rendered
 * to data/review/VERIFIED.md (for people and for agents to read). Reviewers
 * drop confirmation files at data/review/confirm-*.json and this script merges
 * them in.
 *
 *   node scripts/ledger.mjs            merge confirm-*.json, regenerate outputs
 *   node scripts/ledger.mjs --report   regenerate outputs only, merge nothing
 *
 * Statuses:
 *   confirmed  — checked against the organiser's page and correct as recorded
 *   corrected  — checked, found wrong, and patched
 *   blocked    — checked, but the page could not be read (403 / JS-only / cert).
 *                These need a route WebFetch cannot provide — a web search, or
 *                a human with a browser.
 *   (absent)   — never checked
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REVIEW = join(ROOT, 'data', 'review');
const STATE = join(REVIEW, 'verified.json');
const MD = join(REVIEW, 'VERIFIED.md');
const TODO = join(REVIEW, 'TO-VERIFY.tsv');

const today = process.env.TODAY || new Date().toISOString().slice(0, 10);
const reportOnly = process.argv.includes('--report');

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const key = (name, city) => `${norm(name)}|${norm(city)}`;

const RANK = { blocked: 1, confirmed: 2, corrected: 3 };

const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : { entries: {} };
state.entries ||= {};

/* ---- merge any confirmation files reviewers have dropped ---------------- */

let merged = 0, upgraded = 0, files = 0;
if (!reportOnly) {
  for (const f of readdirSync(REVIEW).filter((f) => /^confirm-.*\.json$/.test(f)).sort()) {
    const rows = JSON.parse(readFileSync(join(REVIEW, f), 'utf8'));
    if (!Array.isArray(rows)) { console.error(`FATAL: ${f} must be a JSON array`); process.exit(1); }
    files++;
    for (const r of rows) {
      if (!r?.name || !r?.city || !r?.status) continue;
      if (!RANK[r.status]) { console.error(`  skipping unknown status "${r.status}" for ${r.name}`); continue; }
      const k = key(r.name, r.city);
      const prev = state.entries[k];
      const next = {
        name: r.name, city: r.city, status: r.status,
        checked_on: r.checked_on || today,
        cycle: r.cycle || 'unknown',
        evidence: r.evidence || '',
      };
      // A later, stronger outcome wins: blocked < confirmed < corrected.
      // A re-check on a newer date also wins, so a stale confirmation refreshes.
      if (!prev) { state.entries[k] = next; merged++; continue; }
      if (RANK[next.status] > RANK[prev.status] || next.checked_on > prev.checked_on) {
        state.entries[k] = next; upgraded++;
      }
    }
    renameSync(join(REVIEW, f), join(REVIEW, '.' + f.replace(/\.json$/, '.merged')));
  }
}

state.updated_on = today;
writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n', 'utf8');

/* ---- cross-reference against the live dataset --------------------------- */

const { events } = JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8'));

const seen = new Set();
const buckets = { confirmed: [], corrected: [], blocked: [], unchecked: [] };

for (const e of events) {
  const k = key(e.name, e.city);
  seen.add(k);
  const hit = state.entries[k];
  if (!hit) { buckets.unchecked.push({ e }); continue; }
  buckets[hit.status].push({ e, hit });
}

// Ledger rows whose event is no longer in the dataset (removed by a patch).
const stale = Object.entries(state.entries).filter(([k]) => !seen.has(k));

/* ---- write the to-do list ----------------------------------------------- */

const todo = buckets.unchecked.map(({ e }) => e).concat(buckets.blocked.map(({ e }) => e));
todo.sort((a, b) => {
  // Dated events first, soonest first — a wrong date on an imminent event is
  // the costliest error in the dataset. Undated ones follow.
  const da = a.next_date || '9999', db = b.next_date || '9999';
  return da.localeCompare(db) || a.name.localeCompare(b.name);
});

const statusOf = (e) => {
  const h = state.entries[key(e.name, e.city)];
  return h ? h.status : 'unchecked';
};

writeFileSync(TODO,
  'status\tname\tcity\tregion\ttype\tnext_date\tnext_end\turl\n' +
  todo.map((e) => [statusOf(e), e.name, e.city, e.region, e.type,
    e.next_date || '-', e.next_date_end || '-', e.url].join('\t')).join('\n') + '\n',
  'utf8');

/* ---- render the human-readable ledger ----------------------------------- */

const pct = (n) => ((n / events.length) * 100).toFixed(1);
const row = ({ e, hit }) =>
  `| ${e.name} | ${e.city} | ${e.next_date || '—'} | ${hit.checked_on} | ${hit.cycle} | ${(hit.evidence || '').replace(/\|/g, '/')} |`;

const md = [];
md.push('# Verification ledger');
md.push('');
md.push('**Read this before verifying anything.** It records which events have already been');
md.push('checked against the organiser\'s own page, so a pass can spend its budget on what is');
md.push('still unknown rather than re-confirming what is settled.');
md.push('');
md.push(`Updated ${today} · dataset holds ${events.length} events.`);
md.push('');
md.push('| status | count | share | meaning |');
md.push('|---|---:|---:|---|');
md.push(`| \`confirmed\` | ${buckets.confirmed.length} | ${pct(buckets.confirmed.length)}% | checked against the organiser's page, correct as recorded — **skip these** |`);
md.push(`| \`corrected\` | ${buckets.corrected.length} | ${pct(buckets.corrected.length)}% | checked, found wrong, patched — **skip these** |`);
md.push(`| \`blocked\` | ${buckets.blocked.length} | ${pct(buckets.blocked.length)}% | attempted, page unreadable by fetch — **needs a web search or a human with a browser** |`);
md.push(`| _unchecked_ | ${buckets.unchecked.length} | ${pct(buckets.unchecked.length)}% | never attempted — **verify these first** |`);
md.push('');
md.push('`data/review/TO-VERIFY.tsv` is the working list: everything unchecked or blocked,');
md.push('dated events first and soonest first, because a wrong date on an imminent event is');
md.push('the costliest error the dataset can carry.');
md.push('');
md.push('## How to add to this ledger');
md.push('');
md.push('Write a JSON array to `data/review/confirm-<yourcycle>.json`:');
md.push('');
md.push('```json');
md.push('[');
md.push('  { "name": "DEF CON", "city": "Las Vegas", "status": "confirmed",');
md.push('    "cycle": "5a", "evidence": "defcon.org shows Aug 5-8 2027, matches record" },');
md.push('  { "name": "HackMIT", "city": "Cambridge", "status": "blocked",');
md.push('    "cycle": "5a", "evidence": "JS-only site, date only in hero image" }');
md.push(']');
md.push('```');
md.push('');
md.push('Then run `node scripts/ledger.mjs`. Use `corrected` when you also emitted a patch.');
md.push('A stronger outcome or a newer date always wins, so re-checks refresh a stale entry.');
md.push('');

if (stale.length) {
  md.push(`## Ledger rows with no matching event (${stale.length})`);
  md.push('');
  md.push('These were checked, then the event was removed from the dataset by a later patch.');
  md.push('Kept so the same dead lead is not researched again.');
  md.push('');
  for (const [, v] of stale) md.push(`- **${v.name}** — ${v.city} (${v.status}, ${v.cycle}): ${v.evidence || 'no note'}`);
  md.push('');
}

for (const [label, list, blurb] of [
  ['blocked', buckets.blocked, 'Attempted and unreadable by fetch. These are where a web search actually earns its cost.'],
  ['corrected', buckets.corrected, 'Checked and patched.'],
  ['confirmed', buckets.confirmed, 'Checked and correct as recorded.'],
]) {
  md.push(`## ${label} (${list.length})`);
  md.push('');
  if (blurb) { md.push(blurb); md.push(''); }
  if (!list.length) { md.push('_none_'); md.push(''); continue; }
  md.push('| event | city | next date | checked | cycle | evidence |');
  md.push('|---|---|---|---|---|---|');
  list.sort((a, b) => a.e.name.localeCompare(b.e.name));
  for (const r of list) md.push(row(r));
  md.push('');
}

writeFileSync(MD, md.join('\n'), 'utf8');

if (!reportOnly) console.log(`Merged ${files} confirmation file(s): ${merged} new, ${upgraded} updated.`);
console.log(`confirmed ${buckets.confirmed.length} · corrected ${buckets.corrected.length} · blocked ${buckets.blocked.length} · unchecked ${buckets.unchecked.length}`);
console.log(`TO-VERIFY.tsv holds ${todo.length} events (unchecked + blocked).`);
console.log(`Wrote ${MD} and ${TODO}`);
