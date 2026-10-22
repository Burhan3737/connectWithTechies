#!/usr/bin/env node
/**
 * Applies review-cycle patch files to the raw research data.
 *
 * Review agents never edit data/raw/*.json directly — they write patch files
 * to data/review/*.json, which keeps parallel agents from clobbering each
 * other and leaves an audit trail of what each cycle changed and why.
 *
 * Patch file: a JSON array of operations.
 *   { "match": { "name": "...", "city": "..." },
 *     "action": "update" | "remove",
 *     "reason": "one line on why",
 *     "set": { "url": "https://...", "next_date": "2027-03-14" } }
 *
 *   A record we do not have yet is added instead, with no "match":
 *   { "action": "add", "reason": "where it was found and confirmed",
 *     "record": { ...every field of data/SCHEMA.md... } }
 *   It lands in data/raw/discovered.json once validateRecord (scripts/lib/record.mjs)
 *   passes it. An add applies once: after that, its patch file re-running it is
 *   DONE whatever has become of the record (see appliedAdd below). A name+city a
 *   curated file already holds with different fields is rejected — patch it with update.
 *
 *   node scripts/apply-patches.mjs            # apply every data/review/*.json
 *   node scripts/apply-patches.mjs --dry-run  # report without writing
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonPlace } from './lib/places.mjs';
import { today } from './lib/today.mjs';
import { decideAdd, FIELDS } from './lib/record.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = join(ROOT, 'data', 'raw');
const DISCOVERED = 'discovered.json';   // curated records that arrived by an `add` patch
const REVIEW_DIR = join(ROOT, 'data', 'review');
/**
 * This script writes data/raw/, so it must never write by accident.
 *
 * It used to ignore any flag it did not recognise, which meant `--help` — the
 * first thing anyone types at an unfamiliar tool — silently performed a real
 * apply. A curator did exactly that and applied four passes of patches before
 * any audit had seen them. Unknown flags are now an error, and `--help` only
 * prints this usage.
 */
const USAGE = `usage: node scripts/apply-patches.mjs [--dry-run]

  (no flags)   apply every patch file in data/review/ to data/raw/
  --dry-run    report what would change, write nothing
  --help       show this message

Curators and auditors must not run this without --dry-run. Applying is the
orchestrator's step, after it has read the patches.`;

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) { console.log(USAGE); process.exit(0); }
const unknown = argv.filter((a) => a !== '--dry-run');
if (unknown.length) {
  console.error(`Unknown option(s): ${unknown.join(' ')}. Nothing was written.\n\n${USAGE}`);
  process.exit(2);
}
const dryRun = argv.includes('--dry-run');

if (!existsSync(REVIEW_DIR)) { mkdirSync(REVIEW_DIR, { recursive: true }); }

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// Load every raw file once, keeping records addressable by (name, city).
const rawFiles = readdirSync(RAW_DIR).filter((f) => f.endsWith('.json')).sort();
const store = new Map();          // filename -> array of records
const index = new Map();          // "name|city" -> { file, i }

function indexRecord(e, f, i) {
  // Patches are written against the manifest, which carries the canonical
  // city name, while the raw record may still hold the researcher's spelling.
  // Index under both so either form resolves to the same record.
  const cities = new Set([e.city, canonPlace(e.city, e.region).city]);
  for (const city of cities) {
    const k = `${norm(e.name)}|${norm(city)}`;
    if (!index.has(k)) index.set(k, []);
    index.get(k).push({ file: f, i });
  }
}

for (const f of rawFiles) {
  const arr = JSON.parse(readFileSync(join(RAW_DIR, f), 'utf8'));
  store.set(f, arr);
  arr.forEach((e, i) => indexRecord(e, f, i));
}
// Treated as present even if missing; only written to disk if an add lands in it.
if (!store.has(DISCOVERED)) store.set(DISCOVERED, []);

// The ledger, the audit, the proposed-moves file and the feed's source proposals
// (sources-*.json, read by scripts/feeds/run.mjs) share this directory but are
// not patches. PROPOSED-moves.json is excluded on purpose: an automated date
// change is a suggestion for a person to accept, never something that applies
// itself by being left in a folder.
//
// The discovery logs (discover-<pass>.json, read by scripts/feeds/returning.mjs)
// are deliberately not excluded by name. They are objects, so the array check
// below skips them out loud; a name rule would also have swallowed, without a
// word, the patches of any pass that happened to be called "discover-…"
// (discover-x-fixes.json). discovery-log.json is excluded by name as before.
const NOT_PATCHES = new Set(['verified.json', 'AUDIT.json', 'PROPOSED-moves.json', 'discovery-log.json']);
const patchFiles = readdirSync(REVIEW_DIR)
  .filter((f) => f.endsWith('.json') && !/^(confirm|sources)-/.test(f) && !NOT_PATCHES.has(f))
  .sort();
if (!patchFiles.length) { console.log('No patch files in data/review/ — nothing to do.'); process.exit(0); }

let applied = 0, removed = 0, unmatched = 0, noop = 0, added = 0, rejected = 0;
const touched = new Set();
const log = [];

/**
 * Has this add, from this patch file, landed on an earlier run?
 *
 * Patch files stay in data/review/ and every run replays all of them, in name
 * order. For update and remove that is harmless, but an add replayed is a new
 * record: once a later cycle's remove had retired it, the next run put it back
 * (nov04-s1-fixes.json sorts before oct21-…-fixes.json, so every run removed it
 * and re-added it), and once a later update had changed it, the add no longer
 * matched what was on file and was REJECTed on every run — noise in the very
 * dry-run that gates an apply. Comparing against the record cannot tell "never
 * added" from "added, then changed or retired"; only a record of the add can.
 *
 * That record is APPLIED.md. This script only ever appends to it, it is
 * committed with the data it describes, and the ADD line is written by the same
 * run that writes the record — so it is already the durable "this landed" fact,
 * and a separate ledger would be a second copy that could disagree with it. The
 * line is `- <patch file>: ADD <name> (<city>) — <reason>`, so the part before the
 * reason identifies one add of one patch file. Should a run die between writing
 * data/raw and appending the log, the record is on file unchanged and the
 * field-by-field check in decideAdd still makes the re-run DONE.
 */
const APPLIED_LOG = join(REVIEW_DIR, 'APPLIED.md');
const loggedAdds = existsSync(APPLIED_LOG)
  ? readFileSync(APPLIED_LOG, 'utf8').split('\n').filter((l) => l.includes(': ADD '))
  : [];
const appliedAdd = (pf, rec) => {
  const head = `- ${pf}: ADD ${rec?.name} (${rec?.city}) — `;
  return loggedAdds.some((l) => l.startsWith(head));
};

/**
 * Add a new curated record; decideAdd (scripts/lib/record.mjs) makes the call.
 */
const addedKeys = new Set();   // name|city of every add that landed in this run
function addRecord(op, pf) {
  const rec = op.record;
  const label = `${rec?.name ?? '?'} (${rec?.city ?? '?'})`;
  const key = `${norm(rec?.name)}|${norm(rec?.city)}`;
  // The run-local repeat check uses the canonical city, so "Montreal" and "Montréal" count as one.
  const runKey = `${norm(rec?.name)}|${norm(canonPlace(rec?.city, rec?.region).city)}`;
  // Looked up under the canonical city as well as the one the add spells: the
  // index holds every curated record under both, but an add of "Foo Conf" in
  // "NYC" looked up only "nyc" and missed the "New York City" record, adding a
  // duplicate. store[i] is null for a record removed earlier in this run; it no
  // longer blocks. One record can sit under both keys, so hits are de-duplicated.
  const seen = new Set();
  const hits = [...(index.get(key) || []), ...(index.get(runKey) || [])].filter(({ file, i }) => {
    const id = `${file}#${i}`;
    if (seen.has(id) || file === 'feed.json' || !store.get(file)[i]) return false;
    seen.add(id);
    return true;
  });
  const { verdict, message } = decideAdd(rec, hits.map(({ file, i }) => store.get(file)[i]),
    { addedThisRun: addedKeys.has(runKey), appliedBefore: appliedAdd(pf, rec) });
  if (verdict === 'DONE') { noop++; console.log(`  DONE   ${label}  (${message})`); return; }
  if (verdict === 'REJECT') { rejected++; console.log(`  REJECT ${label}  ${message}`); return; }
  const arr = store.get(DISCOVERED);
  arr.push(Object.fromEntries(FIELDS.map((k) => [k, rec[k]])));
  indexRecord(arr[arr.length - 1], DISCOVERED, arr.length - 1);
  added++; touched.add(DISCOVERED); addedKeys.add(runKey);
  log.push(`${pf}: ADD ${rec.name} (${rec.city}) — ${op.reason || ''}`);
  console.log(`  ADD    ${rec.name} — ${rec.city}  [${DISCOVERED}]  ${op.reason || ''}`);
}

for (const pf of patchFiles) {
  const ops = JSON.parse(readFileSync(join(REVIEW_DIR, pf), 'utf8'));
  /**
   * Not every JSON file here is a patch. The ledger, the audit report and the
   * proposed-moves file all live alongside them, and this used to die on the
   * first one it met — a curator run that had gone perfectly could not be
   * applied because an unrelated report was sitting in the directory.
   * Anything that is not an array of operations is simply not ours.
   */
  if (!Array.isArray(ops)) {
    console.log(`\n${pf} — not an operation array, skipping`);
    continue;
  }
  console.log(`\n${pf} — ${ops.length} operation(s)`);

  for (const op of ops) {
    if (op?.action === 'add') { addRecord(op, pf); continue; }
    const name = op?.match?.name, city = op?.match?.city;
    const hits = index.get(`${norm(name)}|${norm(city)}`);
    if (!hits || !hits.length) {
      /**
       * A miss is only a problem if the patch has not already landed. Once a
       * city correction is applied the record lives under its new city, so a
       * re-run cannot find it under the old one; once a removal is applied the
       * record is gone. Both looked identical to a patch that failed to match,
       * which made a re-run after a partial apply unreadable. Check whether the
       * intended end state already holds before calling it a miss.
       */
      if (op.action === 'remove') {
        noop++;
        console.log(`  DONE   ${name} — ${city}  (already removed)`);
        continue;
      }
      const moved = op.set?.city ? index.get(`${norm(name)}|${norm(op.set.city)}`) : null;
      if (moved && moved.length) {
        const settled = moved.every(({ file, i }) => {
          const rec = store.get(file)[i];
          return rec && Object.entries(op.set).every(([k, v]) =>
            String(Array.isArray(rec[k]) ? rec[k].join(',') : rec[k]) === String(Array.isArray(v) ? v.join(',') : v));
        });
        if (settled) {
          noop++;
          console.log(`  DONE   ${name} — ${city} -> ${op.set.city}  (already applied)`);
          continue;
        }
      }
      unmatched++;
      console.log(`  MISS   ${name} — ${city}  (no such record)`);
      continue;
    }

    for (const { file, i } of hits) {
      const rec = store.get(file)[i];

      if (op.action === 'remove') {
        store.get(file)[i] = null;
        removed++; touched.add(file);
        log.push(`${pf}: REMOVE ${rec.name} (${rec.city}) — ${op.reason || ''}`);
        console.log(`  REMOVE ${rec.name} — ${rec.city}  [${file}]  ${op.reason || ''}`);
        continue;
      }

      const changes = [];

      /**
       * Never let a new next_date erase the edition it replaces.
       *
       * In data/raw a held edition often still sits in next_date — the build
       * rolls it into last_date, but only in its output. Curators read the
       * built file, see last_date already filled, and patch next_date alone;
       * the raw held date is overwritten and the edition vanishes. It happened
       * to PAX West, then to five more events in one cycle despite a written
       * rule against it, because the rule asked curators to guard against a
       * mismatch they cannot see. So the patcher guards it: if the date being
       * replaced has already passed and the patch does not set last_date
       * itself, the passed date is carried into last_date first.
       */
      const set = op.set || {};
      if ('next_date' in set && !('last_date' in set) && rec.next_date
          && rec.next_date < today() && rec.next_date !== set.next_date
          && (!rec.last_date || rec.last_date < rec.next_date)) {
        changes.push(`last_date: ${JSON.stringify(rec.last_date || '')} -> ${JSON.stringify(rec.next_date)} (carried from the replaced next_date)`);
        rec.last_date = rec.next_date;
      }

      for (const [k, v] of Object.entries(set)) {
        const before = Array.isArray(rec[k]) ? rec[k].join(',') : rec[k];
        const after = Array.isArray(v) ? v.join(',') : v;
        if (String(before) === String(after)) continue;
        changes.push(`${k}: ${JSON.stringify(before)} -> ${JSON.stringify(v)}`);
        rec[k] = v;
      }
      if (!changes.length) { noop++; console.log(`  SAME   ${rec.name} — ${rec.city}  (already matches)`); continue; }
      applied++; touched.add(file);
      log.push(`${pf}: UPDATE ${rec.name} (${rec.city}) — ${op.reason || ''} — ${changes.join('; ')}`);
      console.log(`  UPDATE ${rec.name} — ${rec.city}  [${file}]`);
      for (const c of changes) console.log(`           ${c}`);
      if (op.reason) console.log(`           reason: ${op.reason}`);
    }
  }
}

console.log(`\nUpdated ${applied} · added ${added} · removed ${removed} · already-correct ${noop} · unmatched ${unmatched} · rejected ${rejected}`);

if (dryRun) { console.log('\n--dry-run: nothing written.'); process.exit(0); }

for (const f of touched) {
  const kept = store.get(f).filter(Boolean);
  writeFileSync(join(RAW_DIR, f), JSON.stringify(kept, null, 2) + '\n', 'utf8');
  console.log(`wrote data/raw/${f} (${kept.length} records)`);
}

if (log.length) {
  const stamp = today();
  const prior = existsSync(APPLIED_LOG) ? readFileSync(APPLIED_LOG, 'utf8') : '# Applied review patches\n';
  writeFileSync(APPLIED_LOG, `${prior}\n## ${stamp}\n\n${log.map((l) => `- ${l}`).join('\n')}\n`, 'utf8');
  console.log(`appended ${log.length} entries to data/review/APPLIED.md`);
}
