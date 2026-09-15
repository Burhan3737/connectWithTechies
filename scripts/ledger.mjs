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
/**
 * A batch-verified dataset expires in a batch, so the queue is naturally lumpy.
 * Bounding a pass by effort rather than by threshold keeps each run a sane size
 * without pretending the rest is fine — `--limit` trims the working file only,
 * and the full count is always reported.
 */
const limitArg = process.argv.find((a) => a.startsWith('--limit'));
const LIMIT = limitArg ? Number(limitArg.split('=')[1] || process.argv[process.argv.indexOf(limitArg) + 1]) : 0;

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
      //
      // A pass re-running itself always wins, in either direction. Without this
      // a verdict could only ever be strengthened, so a check that grew more
      // careful could not withdraw its own earlier confidence — which is
      // precisely what is needed when a matcher turns out to have been fooled.
      if (!prev) { state.entries[k] = next; merged++; continue; }
      const sameCycleRedo = next.cycle === prev.cycle && next.checked_on >= prev.checked_on;
      if (sameCycleRedo || RANK[next.status] > RANK[prev.status] || next.checked_on > prev.checked_on) {
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

/**
 * Entries are keyed on (name, city), so a patch that corrects an event's city
 * orphans its own ledger entry and the event resurfaces as unchecked — which
 * is exactly backwards, since correcting the city means someone just verified
 * it. Fall back to matching on name alone, but only when that name is unique
 * on both sides, then re-key the entry so the drift is repaired for good.
 */
const nameCount = new Map();
for (const e of events) nameCount.set(norm(e.name), (nameCount.get(norm(e.name)) || 0) + 1);

const ledgerByName = new Map();
for (const [k, v] of Object.entries(state.entries)) {
  const n = norm(v.name);
  if (!ledgerByName.has(n)) ledgerByName.set(n, []);
  ledgerByName.get(n).push([k, v]);
}

const seen = new Set();
const buckets = { confirmed: [], corrected: [], blocked: [], unchecked: [] };
let rekeyed = 0;

for (const e of events) {
  const k = key(e.name, e.city);
  seen.add(k);
  let hit = state.entries[k];

  if (!hit) {
    const candidates = ledgerByName.get(norm(e.name)) || [];
    if (candidates.length === 1 && nameCount.get(norm(e.name)) === 1) {
      const [oldKey, entry] = candidates[0];
      delete state.entries[oldKey];
      hit = { ...entry, city: e.city };
      state.entries[k] = hit;
      rekeyed++;
    }
  }

  if (!hit) { buckets.unchecked.push({ e }); continue; }
  buckets[hit.status].push({ e, hit });
}

if (rekeyed) {
  writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n', 'utf8');
  console.log(`Re-keyed ${rekeyed} entr${rekeyed === 1 ? 'y' : 'ies'} whose event city was corrected after verification.`);
}

// Ledger rows whose event is no longer in the dataset (removed by a patch).
const stale = Object.entries(state.entries).filter(([k]) => !seen.has(k));

/* ---- staleness scoring --------------------------------------------------- */

/**
 * A verification is a snapshot, not a subscription. These rules decide when a
 * settled record has to be looked at again, so TO-VERIFY.tsv refills itself
 * instead of sitting empty and reading as "done" when it means "not watching".
 */
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];
const OFTEN = new Set(['weekly', 'monthly', 'rolling', 'quarterly']);

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** Months until the next occurrence of an event's usual month. 99 if unknown. */
function monthsAway(e) {
  const m = String(e.month || '').toLowerCase();
  const i = MONTHS.findIndex((n) => m.includes(n.slice(0, 3)));
  if (i < 0) return 99;
  const now = new Date(today).getMonth();
  return (i - now + 12) % 12;
}

const REASONS = {
  never:    { rank: 1, why: 'never checked' },
  blocked:  { rank: 2, why: 'previous check could not read the page' },
  regroup:  { rank: 3, why: 'a group that meets weekly or monthly, showing no next date — wrong on the page today' },
  imminent: { rank: 4, why: 'coming up, and the check is stale relative to how close it is' },
  rolled:   { rank: 5, why: 'an annual edition ran since it was checked; next one is far off' },
  window:   { rank: 6, why: 'undated, usual month 2-5 months out, not looked at for 45 days' },
  aged:     { rank: 7, why: 'not looked at in a long time' },
};

/**
 * Every time-based reason carries a minimum interval, so a record checked last
 * week is not queued again this week. Without them the queue reported 192 items
 * five days after all 880 had been verified — which would have sent a pass to
 * re-read pages whose ink was still wet.
 *
 * `rolled` is the exception and has no interval: it is event-driven rather than
 * clock-driven. The edition genuinely happened since we looked, so there is new
 * information to go and get no matter how recently we checked.
 */
function stalenessOf(e, hit) {
  if (!hit) return 'never';
  if (hit.status === 'blocked') return 'blocked';

  const age = hit.checked_on ? daysBetween(hit.checked_on, today) : 9999;
  const until = e.next_date && e.next_date >= today ? daysBetween(today, e.next_date) : null;
  const ranSinceChecked = e.last_date && hit.checked_on && e.last_date >= hit.checked_on;

  // A weekly or monthly group whose last meeting rolled over now shows "date not
  // yet announced" while it actually meets again within weeks. That is wrong on
  // the page right now, so it outranks everything except never-checked.
  if (until === null && ranSinceChecked && OFTEN.has(e.cadence)) return 'regroup';

  /**
   * Freshness scaled to proximity: a check has to be newer the closer the event
   * gets, because that is when organisers move things. An event three weeks out
   * checked last week is fine; the same check on an event two days out is not.
   *
   * A flat "within N days" window cannot express that, and it also misreads a
   * batch-verified dataset — when 883 records are all checked on one day they
   * all age together, so any flat threshold fires for the whole cohort at once.
   * Ordering the queue by urgency and working it to a budget handles that far
   * better than tuning the threshold.
   */
  if (until !== null && age > until / 2) return 'imminent';

  if (until === null && ranSinceChecked) return 'rolled';

  if (age >= 45 && !e.next_date) {
    const away = monthsAway(e);
    if (away >= 2 && away <= 5) return 'window';
  }

  // Recurring groups need a liveness check, not a date check — ask far less often.
  if (age > (OFTEN.has(e.cadence) ? 180 : 90)) return 'aged';
  return null;
}

/** Days until the event, for ordering within a reason. Undated sinks. */
function urgencyOf(e) {
  if (e.next_date && e.next_date >= today) return daysBetween(today, e.next_date);
  if (OFTEN.has(e.cadence)) return 0;   // meets again imminently by definition
  return 9999;
}

const queue = [];
for (const e of events) {
  const hit = state.entries[key(e.name, e.city)];
  const reason = stalenessOf(e, hit);
  if (reason) queue.push({ e, hit, reason });
}

queue.sort((a, b) => {
  const r = REASONS[a.reason].rank - REASONS[b.reason].rank;
  if (r !== 0) return r;
  return urgencyOf(a.e) - urgencyOf(b.e) || a.e.name.localeCompare(b.e.name);
});

const byReason = {};
for (const q of queue) byReason[q.reason] = (byReason[q.reason] || 0) + 1;

const working = LIMIT > 0 ? queue.slice(0, LIMIT) : queue;
const todo = working.map((q) => q.e);
const reasonOf = new Map(queue.map((q) => [q.e, q.reason]));

const statusOf = (e) => {
  const h = state.entries[key(e.name, e.city)];
  return h ? h.status : 'unchecked';
};

writeFileSync(TODO,
  'reason\tstatus\tname\tcity\tregion\ttype\tcadence\tnext_date\tnext_end\tlast_date\tchecked_on\turl\n' +
  todo.map((e) => {
    const h = state.entries[key(e.name, e.city)];
    return [reasonOf.get(e), statusOf(e), e.name, e.city, e.region, e.type, e.cadence,
      e.next_date || '-', e.next_date_end || '-', e.last_date || '-',
      (h && h.checked_on) || '-', e.url].join('\t');
  }).join('\n') + '\n',
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
md.push('## Re-check queue');
md.push('');
md.push('A verification is a snapshot, not a subscription. `data/review/TO-VERIFY.tsv` is');
md.push('regenerated on every run from the rules below, so it refills itself rather than');
md.push('sitting empty and reading as "done" when it means "no longer watching".');
md.push('');
if (!queue.length) {
  md.push('**Queue is empty** — nothing is due for a re-check right now.');
} else {
  md.push(`**${queue.length} of ${events.length} events are due for a re-check.**`);
  md.push('');
  md.push('| reason | count | why it fires |');
  md.push('|---|---:|---|');
  for (const [r, meta] of Object.entries(REASONS)) {
    if (byReason[r]) md.push(`| \`${r}\` | ${byReason[r]} | ${meta.why} |`);
  }
}
md.push('');
md.push('Recurring groups (`weekly`, `monthly`, `rolling`, `quarterly`) are re-checked on a');
md.push('180-day clock rather than 90, because for them the useful question is whether the');
md.push('group still meets, not what its next date is.');
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
if (queue.length) {
  console.log(`
Re-check queue: ${queue.length} of ${events.length} events`);
  for (const [r, meta] of Object.entries(REASONS)) {
    if (byReason[r]) console.log(`  ${String(byReason[r]).padStart(4)}  ${r.padEnd(9)} ${meta.why}`);
  }
} else {
  console.log('Re-check queue: empty — nothing is due.');
}
if (LIMIT > 0 && queue.length > LIMIT) {
  console.log(`  TO-VERIFY.tsv trimmed to the ${LIMIT} most urgent; ${queue.length - LIMIT} remain for the next pass.`);
}
console.log(`Wrote ${MD} and ${TODO}`);
