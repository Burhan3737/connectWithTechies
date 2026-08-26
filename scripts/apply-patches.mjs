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
 *   node scripts/apply-patches.mjs            # apply every data/review/*.json
 *   node scripts/apply-patches.mjs --dry-run  # report without writing
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonPlace } from './lib/places.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = join(ROOT, 'data', 'raw');
const REVIEW_DIR = join(ROOT, 'data', 'review');
const dryRun = process.argv.includes('--dry-run');

if (!existsSync(REVIEW_DIR)) { mkdirSync(REVIEW_DIR, { recursive: true }); }

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// Load every raw file once, keeping records addressable by (name, city).
const rawFiles = readdirSync(RAW_DIR).filter((f) => f.endsWith('.json')).sort();
const store = new Map();          // filename -> array of records
const index = new Map();          // "name|city" -> { file, i }

for (const f of rawFiles) {
  const arr = JSON.parse(readFileSync(join(RAW_DIR, f), 'utf8'));
  store.set(f, arr);
  arr.forEach((e, i) => {
    // Patches are written against the manifest, which carries the canonical
    // city name, while the raw record may still hold the researcher's spelling.
    // Index under both so either form resolves to the same record.
    const cities = new Set([e.city, canonPlace(e.city, e.region).city]);
    for (const city of cities) {
      const k = `${norm(e.name)}|${norm(city)}`;
      if (!index.has(k)) index.set(k, []);
      index.get(k).push({ file: f, i });
    }
  });
}

const patchFiles = readdirSync(REVIEW_DIR).filter((f) => f.endsWith('.json')).sort();
if (!patchFiles.length) { console.log('No patch files in data/review/ — nothing to do.'); process.exit(0); }

let applied = 0, removed = 0, unmatched = 0, noop = 0;
const touched = new Set();
const log = [];

for (const pf of patchFiles) {
  const ops = JSON.parse(readFileSync(join(REVIEW_DIR, pf), 'utf8'));
  if (!Array.isArray(ops)) { console.error(`FATAL: ${pf} must be a JSON array`); process.exit(1); }
  console.log(`\n${pf} — ${ops.length} operation(s)`);

  for (const op of ops) {
    const name = op?.match?.name, city = op?.match?.city;
    const hits = index.get(`${norm(name)}|${norm(city)}`);
    if (!hits || !hits.length) {
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
      for (const [k, v] of Object.entries(op.set || {})) {
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

console.log(`\nUpdated ${applied} · removed ${removed} · already-correct ${noop} · unmatched ${unmatched}`);

if (dryRun) { console.log('\n--dry-run: nothing written.'); process.exit(0); }

for (const f of touched) {
  const kept = store.get(f).filter(Boolean);
  writeFileSync(join(RAW_DIR, f), JSON.stringify(kept, null, 2) + '\n', 'utf8');
  console.log(`wrote data/raw/${f} (${kept.length} records)`);
}

if (log.length) {
  const logPath = join(ROOT, 'data', 'review', 'APPLIED.md');
  const stamp = process.env.TODAY || new Date().toISOString().slice(0, 10);
  const prior = existsSync(logPath) ? readFileSync(logPath, 'utf8') : '# Applied review patches\n';
  writeFileSync(logPath, `${prior}\n## ${stamp}\n\n${log.map((l) => `- ${l}`).join('\n')}\n`, 'utf8');
  console.log(`appended ${log.length} entries to data/review/APPLIED.md`);
}
