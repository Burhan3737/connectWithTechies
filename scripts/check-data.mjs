#!/usr/bin/env node
/**
 * Data-quality audit over data/events.json.
 * Run after `npm run build`. Reports the things a review cycle should look at:
 * near-duplicate names, suspicious URLs, thin coverage, date sanity, field gaps.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { events, generated_on } = JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8'));

const today = process.env.TODAY || new Date().toISOString().slice(0, 10);
const line = (s = '') => console.log(s);
const head = (s) => { line(); line(`[1m${s}[0m`); line('-'.repeat(s.length)); };

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return '(invalid)'; } };

/* ---- 1. coverage ------------------------------------------------------- */
head('Coverage');
const byCountry = {}, byCity = {}, byType = {}, byRegion = {};
for (const e of events) {
  byCountry[e.country] = (byCountry[e.country] || 0) + 1;
  byCity[`${e.city}, ${e.region}`] = (byCity[`${e.city}, ${e.region}`] || 0) + 1;
  byRegion[`${e.region} (${e.country})`] = (byRegion[`${e.region} (${e.country})`] || 0) + 1;
  byType[e.type] = (byType[e.type] || 0) + 1;
}
line(`Total events: ${events.length}   Cities: ${Object.keys(byCity).length}   Regions: ${Object.keys(byRegion).length}`);
line(`Generated on: ${generated_on}`);
line();
line('By country: ' + Object.entries(byCountry).map(([k, v]) => `${k} ${v}`).join('   '));
line();
line('By type:');
Object.entries(byType).sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => line(`  ${String(v).padStart(4)}  ${k}`));

/* ---- 2. thin cities ---------------------------------------------------- */
head('Cities with only one event (possible research gaps)');
const thin = Object.entries(byCity).filter(([, v]) => v === 1).map(([k]) => k);
line(thin.length ? thin.join(' · ') : '(none)');

head('Top 25 cities');
Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 25)
  .forEach(([k, v]) => line(`  ${String(v).padStart(4)}  ${k}`));

/* ---- 3. near-duplicate names ------------------------------------------- */
head('Possible duplicates (same normalised name, different city)');
const nameMap = new Map();
for (const e of events) {
  const k = norm(e.name);
  if (!nameMap.has(k)) nameMap.set(k, []);
  nameMap.get(k).push(e);
}
let dupHits = 0;
for (const [, group] of nameMap) {
  if (group.length > 1) {
    dupHits++;
    line(`  "${group[0].name}" -> ${group.map((g) => `${g.city} [${g.source_file}]`).join(' | ')}`);
  }
}
if (!dupHits) line('  (none)');

head('Possible duplicates (one name contained in another, same city)');
const arr = [...events];
let contHits = 0;
for (let i = 0; i < arr.length; i++) {
  for (let j = i + 1; j < arr.length; j++) {
    if (arr[i].city !== arr[j].city) continue;
    const a = norm(arr[i].name), b = norm(arr[j].name);
    if (a.length < 6 || b.length < 6 || a === b) continue;
    if (a.includes(b) || b.includes(a)) {
      contHits++;
      line(`  ${arr[i].city}: "${arr[i].name}" ~ "${arr[j].name}"`);
    }
  }
}
if (!contHits) line('  (none)');

head('Same official URL used by more than one event');
const urlMap = new Map();
for (const e of events) {
  const k = e.url.replace(/\/+$/, '').toLowerCase();
  if (!urlMap.has(k)) urlMap.set(k, []);
  urlMap.get(k).push(e);
}
let urlDup = 0;
for (const [k, group] of urlMap) {
  if (group.length > 1) { urlDup++; line(`  ${k} -> ${group.map((g) => `${g.name} (${g.city})`).join(' | ')}`); }
}
if (!urlDup) line('  (none)');

/* ---- 4. link shape ----------------------------------------------------- */
head('Aggregator / non-official-looking links');
const AGG = ['eventbrite.', 'meetup.com', 'lu.ma', 'luma.', 'ticketmaster.', 'facebook.com',
  'linkedin.com', 'eventbrite.ca', 'ti.to', 'hopin.', 'devpost.com', 'partiful.'];
const aggHits = events.filter((e) => AGG.some((a) => e.url.toLowerCase().includes(a)));
line(`${aggHits.length} of ${events.length} link to an aggregator (acceptable when the event only exists there):`);
aggHits.slice(0, 40).forEach((e) => line(`  ${host(e.url).padEnd(22)} ${e.name} — ${e.city}`));
if (aggHits.length > 40) line(`  ... and ${aggHits.length - 40} more`);

head('Bare-domain links (may point at a company, not the event)');
const bare = events.filter((e) => {
  try { const u = new URL(e.url); return u.pathname === '/' || u.pathname === ''; } catch { return true; }
});
line(`${bare.length} events link to a root domain.`);

/* ---- 5. date sanity ---------------------------------------------------- */
head('Date sanity');
const status = {};
for (const e of events) status[e.status] = (status[e.status] || 0) + 1;
line('Status: ' + Object.entries(status).map(([k, v]) => `${k} ${v}`).join('   '));

const farFuture = events.filter((e) => e.next_date && e.next_date > '2028-12-31');
const ancient = events.filter((e) => e.last_date && e.last_date < '2023-01-01');
const noDates = events.filter((e) => !e.next_date && !e.last_date);
const pastNext = events.filter((e) => e.next_date && e.next_date < today);
line(`next_date beyond 2028: ${farFuture.length}`);
line(`last_date before 2023: ${ancient.length}`);
line(`no date at all:        ${noDates.length}`);
line(`next_date in the past: ${pastNext.length} (correctly reclassified as past by the build)`);
if (noDates.length) {
  line('Undated events:');
  noDates.slice(0, 30).forEach((e) => line(`  ${e.name} — ${e.city}`));
  if (noDates.length > 30) line(`  ... and ${noDates.length - 30} more`);
}

/* ---- 6. field gaps ----------------------------------------------------- */
head('Field completeness');
const FIELDS = ['venue', 'month', 'cadence', 'attendance', 'audience', 'description', 'source', 'topics'];
for (const f of FIELDS) {
  const missing = events.filter((e) => !e[f] || (Array.isArray(e[f]) && !e[f].length)).length;
  const pct = ((1 - missing / events.length) * 100).toFixed(0);
  line(`  ${f.padEnd(12)} ${String(events.length - missing).padStart(4)}/${events.length}  ${pct}% filled`);
}

head('Short or missing descriptions');
const shortDesc = events.filter((e) => (e.description || '').length < 40);
line(`${shortDesc.length} events have a description under 40 characters.`);
shortDesc.slice(0, 25).forEach((e) => line(`  ${e.name} — ${e.city}: "${e.description}"`));

head('Done');
