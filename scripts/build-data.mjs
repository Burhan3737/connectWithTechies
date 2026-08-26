#!/usr/bin/env node
/**
 * Merges every data/raw/*.json research file into app/data/events.json.
 * Validates the schema, normalises fields, de-duplicates across regions,
 * and recomputes `status` from today's date so the app never ships stale flags.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = join(ROOT, 'data', 'raw');
const OUT_FILE = join(ROOT, 'data', 'events.json');

const TYPES = new Set(['conference', 'hackathon', 'workshop', 'tech-week', 'meetup-series',
  'summit', 'expo', 'festival', 'ctf', 'game-jam', 'startup-week', 'demo-day',
  'unconference', 'career-fair', 'bootcamp', 'awards']);
const COUNTRIES = new Set(['Canada', 'United States']);
const COSTS = new Set(['free', 'paid', 'freemium', 'invite-only', 'varies']);

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const today = process.env.TODAY || new Date().toISOString().slice(0, 10);

const problems = [];
const warn = (file, name, msg) => problems.push(`${file} :: ${name || '(unnamed)'} :: ${msg}`);

/** Collapse a name to a comparison key so "Collision 2026" == "collision". */
const slug = (s) => String(s || '')
  .toLowerCase()
  .replace(/\b(19|20)\d{2}\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const titleCity = (s) => String(s || '').trim().replace(/\s+/g, ' ');

function normalise(raw, file) {
  const e = { ...raw };
  e.name = String(e.name || '').trim();
  e.city = titleCity(e.city);
  e.region = titleCity(e.region);
  e.country = titleCity(e.country);
  e.url = String(e.url || '').trim();
  e.type = String(e.type || '').trim().toLowerCase();
  e.cost = String(e.cost || '').trim().toLowerCase();
  e.topics = Array.isArray(e.topics) ? e.topics.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [];

  for (const k of ['venue', 'cadence', 'month', 'next_date', 'next_date_end', 'last_date',
    'attendance', 'audience', 'description', 'source']) {
    e[k] = e[k] == null ? '' : String(e[k]).trim();
  }

  if (!e.name) warn(file, e.name, 'missing name');
  if (!e.url || !/^https?:\/\//i.test(e.url)) warn(file, e.name, `bad url: ${e.url}`);
  if (!TYPES.has(e.type)) warn(file, e.name, `unknown type: ${e.type}`);
  if (!COUNTRIES.has(e.country)) warn(file, e.name, `unknown country: ${e.country}`);
  if (!e.city) warn(file, e.name, 'missing city');
  if (e.cost && !COSTS.has(e.cost)) warn(file, e.name, `unknown cost: ${e.cost}`);
  if (!e.description) warn(file, e.name, 'missing description');

  for (const k of ['next_date', 'next_date_end', 'last_date']) {
    if (e[k] && !ISO.test(e[k])) { warn(file, e.name, `bad ${k}: ${e[k]}`); e[k] = ''; }
  }
  if (e.next_date && e.next_date_end && e.next_date_end < e.next_date) {
    warn(file, e.name, 'next_date_end before next_date');
    e.next_date_end = '';
  }

  // Recompute status from dates; the researchers' value is only a fallback.
  const endOfNext = e.next_date_end || e.next_date;
  if (endOfNext && endOfNext >= today) e.status = 'upcoming';
  else if (endOfNext && endOfNext < today) e.status = 'past';
  else if (e.status !== 'discontinued') e.status = e.last_date ? 'recurring-tbd' : 'recurring-tbd';

  e.sort_date = e.next_date || e.last_date || '';
  e.id = `${slug(e.name)}-${slug(e.city)}`.replace(/\s+/g, '-');
  e.source_file = basename(file, '.json');
  return e;
}

const files = readdirSync(RAW_DIR).filter((f) => f.endsWith('.json')).sort();
if (!files.length) { console.error('No raw data files found in data/raw/'); process.exit(1); }

const byKey = new Map();
let read = 0, dupes = 0;

for (const f of files) {
  const path = join(RAW_DIR, f);
  let parsed;
  try { parsed = JSON.parse(readFileSync(path, 'utf8')); }
  catch (err) { console.error(`FATAL: ${f} is not valid JSON — ${err.message}`); process.exit(1); }
  if (!Array.isArray(parsed)) { console.error(`FATAL: ${f} must contain a JSON array`); process.exit(1); }

  for (const raw of parsed) {
    read++;
    const e = normalise(raw, f);
    const key = `${slug(e.name)}|${slug(e.city)}`;
    const existing = byKey.get(key);
    if (!existing) { byKey.set(key, e); continue; }
    dupes++;
    // Keep the richer record: prefer one with a confirmed future date, then more filled fields.
    const score = (x) => (x.next_date ? 100 : 0) + Object.values(x).filter((v) => v !== '' && v != null).length;
    if (score(e) > score(existing)) byKey.set(key, e);
  }
}

const events = [...byKey.values()].sort((a, b) => {
  if (a.city !== b.city) return a.city.localeCompare(b.city);
  return (b.sort_date || '').localeCompare(a.sort_date || '');
});

const cities = [...new Set(events.map((e) => `${e.city}, ${e.region}`))].sort();
const payload = {
  generated_on: today,
  event_count: events.length,
  city_count: cities.length,
  events,
};

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');

console.log(`Files:      ${files.length} (${files.join(', ')})`);
console.log(`Read:       ${read} records`);
console.log(`Duplicates: ${dupes} merged`);
console.log(`Output:     ${events.length} events across ${cities.length} cities`);
console.log(`Upcoming:   ${events.filter((e) => e.status === 'upcoming').length}`);
console.log(`Past:       ${events.filter((e) => e.status === 'past').length}`);
console.log(`Recurring:  ${events.filter((e) => e.status === 'recurring-tbd').length}`);

if (problems.length) {
  console.log(`\n${problems.length} validation problem(s):`);
  for (const p of problems.slice(0, 60)) console.log(`  - ${p}`);
  if (problems.length > 60) console.log(`  ... and ${problems.length - 60} more`);
  process.exitCode = process.env.STRICT ? 1 : 0;
}
