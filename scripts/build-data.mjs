#!/usr/bin/env node
/**
 * Merges every data/raw/*.json research file into app/data/events.json.
 * Validates the schema, normalises fields, de-duplicates across regions,
 * and recomputes `status` from today's date so the app never ships stale flags.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonPlace, titleCity } from './lib/places.mjs';

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
const dropped = [];
const rolledOver = [];
const warn = (file, name, msg) => problems.push(`${file} :: ${name || '(unnamed)'} :: ${msg}`);

class Fatal extends Error {}
const fatal = (file, name, msg) => {
  dropped.push(`${file} :: ${name || '(unnamed)'} :: ${msg}`);
  throw new Fatal(msg);
};

/** Collapse a name to a comparison key so "Collision 2026" == "collision". */
const slug = (s) => String(s || '')
  .toLowerCase()
  .replace(/\b(19|20)\d{2}\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

function normalise(raw, file) {
  const e = { ...raw };
  e.name = String(e.name || '').trim();
  e.country = titleCity(e.country);
  const place = canonPlace(titleCity(e.city), titleCity(e.region));
  e.city = place.city;
  e.region = place.region;
  e.url = String(e.url || '').trim();
  e.type = String(e.type || '').trim().toLowerCase();
  e.cost = String(e.cost || '').trim().toLowerCase();
  e.topics = Array.isArray(e.topics) ? e.topics.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [];

  for (const k of ['venue', 'cadence', 'month', 'next_date', 'next_date_end', 'last_date',
    'attendance', 'audience', 'description', 'source']) {
    e[k] = e[k] == null ? '' : String(e[k]).trim();
  }

  // Fatal problems drop the record entirely — a listing with no name, no city
  // or no working link is worse than no listing at all.
  if (!e.name) fatal(file, e.name, 'missing name');
  if (!e.url || !/^https?:\/\//i.test(e.url)) fatal(file, e.name, `bad url: ${e.url}`);
  if (!COUNTRIES.has(e.country)) fatal(file, e.name, `unknown country: ${e.country}`);
  if (!e.city) fatal(file, e.name, 'missing city');

  // Recoverable problems are corrected in place and reported.
  if (!TYPES.has(e.type)) { warn(file, e.name, `unknown type "${e.type}" -> conference`); e.type = 'conference'; }
  if (!COSTS.has(e.cost)) { warn(file, e.name, `unknown cost "${e.cost}" -> varies`); e.cost = 'varies'; }
  if (!e.description) warn(file, e.name, 'missing description');

  for (const k of ['next_date', 'next_date_end', 'last_date']) {
    if (e[k] && !ISO.test(e[k])) { warn(file, e.name, `bad ${k}: ${e[k]}`); e[k] = ''; }
  }
  if (e.next_date && e.next_date_end && e.next_date_end < e.next_date) {
    warn(file, e.name, 'next_date_end before next_date');
    e.next_date_end = '';
  }

  // last_date means an edition that has been held, so it cannot be in the
  // future. When it merely duplicates next_date it carries nothing and is
  // dropped; otherwise it is a real mistake and only reported, because the
  // right correction (is it a mis-filed next date? a typo'd year?) is a
  // judgement the build should not make.
  if (e.last_date && e.last_date > today) {
    if (e.last_date === e.next_date) {
      warn(file, e.name, `last_date duplicated next_date (${e.last_date}) — dropped`);
      e.last_date = '';
    } else {
      warn(file, e.name, `last_date ${e.last_date} is in the future; a held edition cannot be`);
    }
  }

  // Recompute status from dates; the researchers' value is only a fallback.
  const endOfNext = e.next_date_end || e.next_date;

  if (endOfNext && endOfNext >= today) {
    e.status = 'upcoming';
  } else if (endOfNext && endOfNext < today) {
    /**
     * The edition has been held. Roll it over rather than parking the record
     * on `past`.
     *
     * Without this an annual event drops out of Upcoming the day after it runs
     * and never comes back, because nothing goes looking for next year's date —
     * and Past keeps showing the *previous* edition, since the fresher date is
     * still sitting unread in next_date. A weekly meetup vanishes entirely for
     * having met once. Both were observed live: five days after a build,
     * thirteen events had broken this way, five of them weekly or monthly
     * groups that meet again within days.
     *
     * Rolling over loses nothing — the held date is preserved in last_date —
     * and it puts the record back in front of people as "usually <month>,
     * date not yet announced", which is true.
     */
    const finished = e.status === 'discontinued' || e.cadence === 'one-off';
    if (finished) {
      e.status = 'past';
    } else {
      if (!e.last_date || e.next_date > e.last_date) e.last_date = e.next_date;
      e.next_date = '';
      e.next_date_end = '';
      e.status = 'recurring-tbd';
      rolledOver.push(`${e.name} (${e.city}) — held ${e.last_date}, next edition unannounced`);
    }
  } else if (e.status !== 'discontinued') {
    e.status = 'recurring-tbd';
  }

  e.sort_date = e.next_date || e.last_date || '';
  e.id = `${slug(e.name)}-${slug(e.city)}`.replace(/\s+/g, '-');
  e.source_file = basename(file, '.json');
  return e;
}

const files = readdirSync(RAW_DIR).filter((f) => f.endsWith('.json')).sort();
if (!files.length) { console.error('No raw data files found in data/raw/'); process.exit(1); }

/**
 * Two records are the same event if they agree on (name, city) or on (page, city).
 *
 * "Page" means host AND path, not host alone. Matching on the host would fold
 * every event a single organisation runs in its home city into one record —
 * PEI BioAlliance publishes four distinct events under peibioalliance.com in
 * Charlottetown, and host-only matching silently collapsed all four. Two
 * records pointing at the very same page in the same city are still merged,
 * which is what catches one event filed twice under different titles.
 */
function keysFor(e) {
  const city = slug(e.city);
  const page = e.url.toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '');
  return [`n:${slug(e.name)}|${city}`, `u:${page}|${city}`];
}

/** Richer record wins: a confirmed future date first, then more populated fields. */
const score = (x) => (x.next_date ? 100 : 0) +
  Object.values(x).filter((v) => v !== '' && v != null && !(Array.isArray(v) && !v.length)).length;

const byKey = new Map();   // dedup key -> canonical record
const kept = new Set();    // the surviving record objects
let read = 0, dupes = 0;

for (const f of files) {
  const path = join(RAW_DIR, f);
  let parsed;
  try { parsed = JSON.parse(readFileSync(path, 'utf8')); }
  catch (err) { console.error(`FATAL: ${f} is not valid JSON — ${err.message}`); process.exit(1); }
  if (!Array.isArray(parsed)) { console.error(`FATAL: ${f} must contain a JSON array`); process.exit(1); }

  for (const raw of parsed) {
    read++;
    let e;
    try { e = normalise(raw, f); }
    catch (err) { if (err instanceof Fatal) continue; throw err; }

    const keys = keysFor(e);
    const hit = keys.map((k) => byKey.get(k)).find(Boolean);

    if (!hit) {
      kept.add(e);
      for (const k of keys) byKey.set(k, e);
      continue;
    }

    dupes++;
    let winner = hit;
    if (score(e) > score(hit)) {
      // Promote the richer record and repoint every key that referenced the old one.
      winner = e;
      kept.delete(hit);
      kept.add(e);
      for (const [k, v] of byKey) if (v === hit) byKey.set(k, e);
    }
    // Both records' keys now resolve to the survivor, so a third copy found by
    // either name or url still collapses into the same entry.
    for (const k of keys) byKey.set(k, winner);
  }
}

const events = [...kept].sort((a, b) => {
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
console.log(`Dropped:    ${dropped.length} unusable`);
console.log(`Duplicates: ${dupes} merged`);
console.log(`Output:     ${events.length} events across ${cities.length} cities`);
console.log(`Upcoming:   ${events.filter((e) => e.status === 'upcoming').length}`);
console.log(`Past:       ${events.filter((e) => e.status === 'past').length}`);
console.log(`Recurring:  ${events.filter((e) => e.status === 'recurring-tbd').length}`);

if (rolledOver.length) {
  console.log(`
Rolled over ${rolledOver.length} held edition(s) — these need their next date found:`);
  for (const r of rolledOver.slice(0, 30)) console.log(`  > ${r}`);
  if (rolledOver.length > 30) console.log(`  ... and ${rolledOver.length - 30} more`);
}

if (dropped.length) {
  console.log(`\n${dropped.length} record(s) dropped as unusable:`);
  for (const d of dropped.slice(0, 40)) console.log(`  ! ${d}`);
  if (dropped.length > 40) console.log(`  ... and ${dropped.length - 40} more`);
}

if (problems.length) {
  console.log(`\n${problems.length} validation problem(s):`);
  for (const p of problems.slice(0, 60)) console.log(`  - ${p}`);
  if (problems.length > 60) console.log(`  ... and ${problems.length - 60} more`);
  process.exitCode = process.env.STRICT ? 1 : 0;
}
