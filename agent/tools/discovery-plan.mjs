#!/usr/bin/env node
/**
 * Which cities to go looking in for events we do not have.
 *
 *   node agent/tools/discovery-plan.mjs [--limit N]   (npm run discover:plan — every cycle)
 *   node agent/tools/discovery-plan.mjs --record      (after applying a discovery pass)
 *
 * The curated pipeline only re-checks records it already holds, and the feed only
 * reads what a registered source lists. Nothing went looking for the event nobody
 * had heard of: Hack Canada 2027 was in neither. So each cycle a few cities get a
 * curator with a search brief, and this picks them: a city never searched first,
 * then the one searched longest ago, ties to the city we hold the fewest curated
 * records for (the thinnest coverage has the most to find). Per city it lists the
 * event types with no curated record there, which is what the curator searches for.
 *
 * Output: data/review/DISCOVER.tsv (git-ignored, rewritten every run). Local only,
 * no network. "Curated" is a record with no feed_source: the feed's one-offs say
 * nothing about whether a city has been looked at by a person.
 *
 * --record reads the curators' discovery logs (data/review/discover-*.json, the
 * format returning.mjs documents) and stamps every city they cover in
 * data/review/discovery-log.json, keeping the later date. Without it a city would
 * be offered again next cycle however thoroughly it was searched. Idempotent.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readLogs } from '../../scripts/feeds/returning.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EVENTS = join(ROOT, 'data', 'events.json');
const REGISTRY = join(ROOT, 'data', 'feeds', 'registry.json');
const OUT = join(ROOT, 'data', 'review', 'DISCOVER.tsv');
const LOG = join(ROOT, 'data', 'review', 'discovery-log.json');

const COUNTRIES = new Set(['United States', 'Canada']);
export const TYPES = ['hackathon', 'conference', 'tech-week', 'startup-week', 'summit', 'demo-day',
  'meetup-series', 'ctf', 'game-jam'];
export const COLUMNS = ['city', 'region', 'country', 'curated_count', 'missing_types', 'last_searched'];

export const cityKey = (city, region) => `${city}|${region}`;

/**
 * { key -> { city, region, country, count, types:Set } } for every US/Canada city
 * with a curated record, plus every registry discovery city (count 0 if none).
 */
export function candidateCities(events, discovery = []) {
  const out = new Map();
  const slot = (city, region, country) => {
    const key = cityKey(city, region);
    if (!out.has(key)) out.set(key, { key, city, region, country, count: 0, types: new Set() });
    return out.get(key);
  };
  for (const d of discovery) if (COUNTRIES.has(d.country) && d.city) slot(d.city, d.region || '', d.country);
  for (const e of events) {
    if (e.feed_source || !e.city || !COUNTRIES.has(e.country)) continue;
    const c = slot(e.city, e.region || '', e.country);
    c.count++;
    c.types.add(e.type);
  }
  return out;
}

/**
 * The cities to search this cycle, in order: never searched, then longest since
 * searched, then fewest curated records, then name (so the order is stable).
 * searched: { "<City>|<Region>": "YYYY-MM-DD" }.
 */
export function planCities({ events, discovery = [], searched = {}, limit = 10 }) {
  const rows = [...candidateCities(events, discovery).values()].map((c) => ({
    city: c.city, region: c.region, country: c.country, curated_count: c.count,
    missing_types: TYPES.filter((t) => !c.types.has(t)).join(','),
    last_searched: searched[c.key] || '',
  }));
  rows.sort((a, b) => (!!a.last_searched - !!b.last_searched)
    || a.last_searched.localeCompare(b.last_searched)
    || a.curated_count - b.curated_count
    || a.city.localeCompare(b.city) || a.region.localeCompare(b.region));
  return rows.slice(0, limit);
}

/**
 * Stamp every city the logs cover with the log's date, keeping the later of that
 * and what was there. Returns a new object; entries without a city or a date are skipped.
 */
export function mergeSearched(searched, logs) {
  const out = { ...searched };
  for (const log of logs) {
    const date = String(log.date || '');
    if (!date) continue;
    for (const c of log.cities || []) {
      if (!c || !c.city) continue;
      const key = cityKey(c.city, c.region || '');
      if (date > (out[key] || '')) out[key] = date;
    }
  }
  return out;
}

export function toTsv(rows) {
  const cell = (v) => String(v ?? '').replace(/[\t\r\n]+/g, ' ');
  return [COLUMNS.join('\t'), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join('\t'))].join('\n') + '\n';
}

/* ---- run --------------------------------------------------------------- */

const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback);
const sortKeys = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

function main() {
  const args = process.argv.slice(2);
  const searched = readJson(LOG, { searched: {} }).searched || {};

  if (args.includes('--record')) {
    const merged = sortKeys(mergeSearched(searched, readLogs()));
    const changed = Object.keys(merged).filter((k) => merged[k] !== searched[k]).length;
    if (changed) writeFileSync(LOG, JSON.stringify({ searched: merged }, null, 2) + '\n');
    console.log(`Discovery log: ${changed} city date(s) updated, ${Object.keys(merged).length} cities recorded`);
    return;
  }

  const i = args.indexOf('--limit');
  const limit = i >= 0 ? Number(args[i + 1]) : 10;
  if (!Number.isInteger(limit) || limit < 1) throw new Error('--limit needs a positive whole number');

  const events = readJson(EVENTS, null)?.events;
  if (!Array.isArray(events)) throw new Error(`${EVENTS} has no events list — run npm run build:data`);
  const registry = readJson(REGISTRY, { discovery: [] });
  const rows = planCities({ events, discovery: registry.discovery || [], searched, limit });
  writeFileSync(OUT, toTsv(rows));

  console.log(`Cities to search (${rows.length}), least recently searched first:`);
  console.log(toTsv(rows));
  console.log(`Wrote ${OUT}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
