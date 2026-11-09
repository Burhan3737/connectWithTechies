#!/usr/bin/env node
/**
 * Which events sit in a city the map has no position for?
 * Reads data/events.json and data/places.json, prints the missing cities with
 * their event counts (most first), and exits 1 when more than 3% of events
 * have none. "multiple cities" and "US & Canada" are not places and are skipped.
 * Keys are folded exactly as web/src/model/text.ts folds them.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAX_MISSING = 0.03;
const NOT_A_PLACE = /^(multiple cities|us & canada)\b/i;

const fold = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const keyOf = (e) => `${fold(e.city)}|${fold(e.region)}`;

const { events } = JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8'));
const places = JSON.parse(readFileSync(join(ROOT, 'data', 'places.json'), 'utf8'));
const own = new Set(Object.keys(places.cities));
const inMetro = new Set(places.metros.flatMap((m) => m.members));

const missing = new Map();
let checked = 0;
let unplaced = 0;
for (const e of events) {
  if (NOT_A_PLACE.test(e.city) || NOT_A_PLACE.test(e.region)) continue;
  checked++;
  const key = keyOf(e);
  if (own.has(key) || inMetro.has(key)) continue;
  unplaced++;
  const m = missing.get(key) || { city: e.city, region: e.region, count: 0 };
  m.count++;
  missing.set(key, m);
}

const rows = [...missing.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
for (const r of rows) console.log(`${String(r.count).padStart(4)}  ${r.city}, ${r.region}`);
const share = checked ? unplaced / checked : 0;
console.log(`\n${unplaced} of ${checked} events (${(share * 100).toFixed(2)}%) in ${rows.length} cities have no position.`);
const real = rows.filter((r) => r.count >= 2);
if (real.length) console.log(`${real.length} cities with 2+ events need a position or a note.`);
if (share > MAX_MISSING) {
  console.error(`More than ${MAX_MISSING * 100}% of events have no position.`);
  process.exit(1);
}
