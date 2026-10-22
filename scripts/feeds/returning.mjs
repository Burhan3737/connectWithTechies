#!/usr/bin/env node
/**
 * Last year's events that have not come back.
 *
 *   node scripts/feeds/returning.mjs        (npm run returning — weekly)
 *
 * The feed reads only what is upcoming, and the curated pipeline only re-checks
 * what it already has. So an annual event that announces its next edition on
 * its own site, and nowhere we read, is never found: Hack Canada 2027 (Jan 8-10,
 * Toronto) was on no feed — MLH's 2027 season did not list it, and its Devpost
 * page was the ended 2026 edition, in Waterloo.
 *
 * This reads the past editions the tech-only datasets still hold (MLH's last two
 * seasons, Devpost's ended listing, developers.events and confs.tech history),
 * keeps those in the US and Canada from the last 18 months, and drops every one
 * we already have a record for, under any city — events move. What is left is a
 * list for a curator to look up on the organiser's own site:
 * data/review/RETURNING.tsv. Nothing here writes data; no date read here is
 * ever published.
 *
 * A curator's verdict on a candidate goes in a discovery log,
 * data/review/discover-<pass>.json; a decided one stops being listed.
 *
 * Known gaps: MLH editions with no place we can read are skipped by the adapter,
 * and a Devpost page that fails mid-crawl ends the crawl with what it had — the
 * per-source edition counts in the summary are there to make a short read show.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { today } from '../lib/today.mjs';
import { knownCity, region } from './lib/geo.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RAW = join(ROOT, 'data', 'raw');
const REVIEW = join(ROOT, 'data', 'review');
const OUT = join(REVIEW, 'RETURNING.tsv');

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];
const COUNTRIES = new Set(['United States', 'Canada']);
const DECIDED = new Set(['rejected', 'exists', 'added']);

/* ---- names ------------------------------------------------------------- */

// Roman edition numerals only when the title writes them in capitals: "SwampHacks
// XII" is the twelfth, but "x" in "Columbia x Google" is a collaboration.
const ROMAN = /^(?=[IVX])X{0,3}(IX|IV|V?I{0,3})$/;
const SEASONS = /\b(fall|spring|summer|winter)\b/g;

/**
 * The name an event keeps from one edition to the next: "Hack Canada 2026" and
 * "Hack Canada 2027" are one event, as are "Cal Hacks 12.0" and "Cal Hacks 13.0".
 * Words that are part of the name stay ("Hack the North").
 */
export function coreName(title) {
  const words = String(title || '')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/['’]/g, '')
    .split(/[^A-Za-z0-9.]+/)
    .filter((w) => w && !ROMAN.test(w.replace(/\.$/, '')));
  return words.join(' ').toLowerCase()
    .replace(/(?<!\d)(19|20)\d{2}(?!\d)/g, ' ')                  // years, also "hack2026"
    .replace(/(?<![a-z\d.])\d+(\.\d+)?(st|nd|rd|th)?(?![a-z\d])/g, ' ')   // 13, 13.0, 11th
    .replace(SEASONS, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---- links ------------------------------------------------------------- */

// Hosts that carry many organisers' events: sharing one says nothing about
// whether two events are the same.
const PLATFORM = [/(^|\.)devpost\.com$/, /(^|\.)mlh\.com$/, /(^|\.)mlh\.io$/, /^lu\.ma$/, /(^|\.)luma\.com$/,
  /(^|\.)eventbrite\.[a-z.]+$/, /(^|\.)meetup\.com$/, /(^|\.)github\.com$/];

/** An event's own host, without www., or '' for a platform host or no URL. */
export function ownHost(url) {
  let h;
  try { h = new URL(String(url || '')).hostname.toLowerCase(); } catch { return ''; }
  h = h.replace(/^www\./, '');
  return PLATFORM.some((re) => re.test(h)) ? '' : h;
}

/* ---- coverage ---------------------------------------------------------- */

/**
 * What we already have, as names and hosts. A curated record counts whatever
 * its dates — the ledger keeps it checked. A feed record counts only if it is
 * still to come: the feed keeps past events for a while (KEEP_PAST_DAYS in
 * run.mjs), so last year's Devpost or MLH edition sits in feed.json under the
 * same name and link as the candidate itself, and would cover it.
 */
export function coverageIndex(records, now = today()) {
  const names = new Set(), squashed = new Set(), hosts = new Set();
  for (const r of records) {
    if (r.feed_source && (r.next_date_end || r.next_date || '') < now) continue;
    const core = coreName(r.name);
    if (core) { names.add(core); squashed.add(core.replace(/ /g, '')); }
    const h = ownHost(r.url);
    if (h) hosts.add(h);
  }
  return { names, squashed, hosts };
}

export function isCovered(edition, index) {
  const core = coreName(edition.title);
  if (index.names.has(core) || index.squashed.has(core.replace(/ /g, ''))) return true;
  const h = ownHost(edition.url);
  return !!h && index.hosts.has(h);
}

/* ---- discovery logs ---------------------------------------------------- */

/**
 * Curators' verdicts, from data/review/discover-*.json logs, by coreName. A
 * verdict of added, exists or rejected settles a candidate; unresolved keeps
 * it, with the date it was last tried.
 */
export function decisions(logs) {
  const out = new Map();   // core -> { decided: bool, last_tried: date }
  for (const log of logs) {
    for (const r of log.returning || []) {
      const core = coreName(r.name);
      if (!core) continue;
      const d = out.get(core) || { decided: false, last_tried: '' };
      if (DECIDED.has(r.verdict)) d.decided = true;
      if (r.verdict === 'unresolved' && String(log.date || '') > d.last_tried) d.last_tried = String(log.date || '');
      out.set(core, d);
    }
  }
  return out;
}

/* ---- place ------------------------------------------------------------- */

const COUNTRY_WORDS = /\b(canada|united states|usa|u\.s\.a)\b/i;

/**
 * Does an event with no resolvable city still say it is in the US or Canada?
 * By country, state or province (a postal code only in the location, and only
 * in capitals — "IN" and "OR" are words in a title), or a city our curated data
 * knows. Hack Canada 2026's location was just "SPUR Innovation Centre"; its
 * title is what places it.
 */
export function usCaHint(e) {
  const title = String(e.title || ''), loc = String(e.location_text || '');
  if (COUNTRY_WORDS.test(title) || COUNTRY_WORDS.test(loc)) return true;
  for (const code of loc.match(/\b[A-Z]{2}\b/g) || []) if (region(code)) return true;
  for (const text of [title, loc]) {
    const w = text.split(/[^\p{L}.'-]+/u).filter(Boolean);
    for (let n = 1; n <= 4; n++) {
      for (let i = 0; i + n <= w.length; i++) {
        const phrase = w.slice(i, i + n).join(' ');
        if (phrase.length < 4) continue;   // codes are handled above, from the location only
        if (region(phrase) || knownCity(phrase, 'Canada') || knownCity(phrase, 'United States')) return true;
      }
    }
  }
  return false;
}

/* ---- the list ---------------------------------------------------------- */

/** YYYY-MM-DD, `months` before `iso`. */
export function monthsBefore(iso, months) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

/**
 * editions: { source: events[] } from the adapters. records: every data/raw
 * record. logs: parsed discovery logs. Returns the rows and the counts.
 */
export function returning({ editions, records, logs, now = today() }) {
  const since = monthsBefore(now, 18);
  const index = coverageIndex(records, now);
  const decided = decisions(logs);
  const counts = { read: {}, outOfWindow: 0, notUsCa: 0, unplacedNoHint: 0, covered: 0, decided: 0 };
  const byCore = new Map();

  for (const [source, list] of Object.entries(editions)) {
    counts.read[source] = list.length;
    for (const e of list) {
      if (!e.start_date || e.start_date < since || e.start_date >= now) { counts.outOfWindow++; continue; }
      if (e.place) {
        if (!COUNTRIES.has(e.place.country)) { counts.notUsCa++; continue; }
      } else if (!usCaHint(e)) { counts.unplacedNoHint++; continue; }
      const core = coreName(e.title);
      if (!core) { counts.outOfWindow++; continue; }
      if (isCovered(e, index)) { counts.covered++; continue; }
      if (decided.get(core)?.decided) { counts.decided++; continue; }
      const g = byCore.get(core) || { core, editions: [], sources: new Set() };
      g.editions.push(e);
      g.sources.add(source);
      byCore.set(core, g);
    }
  }

  const rows = [];
  for (const g of byCore.values()) {
    // The latest edition; on a tie, one we can place.
    const last = g.editions.sort((a, b) => b.start_date.localeCompare(a.start_date) || (!!b.place - !!a.place))[0];
    const month = Number(last.start_date.slice(5, 7));
    rows.push({
      section: last.place ? 'placed' : 'unplaced',
      core: g.core, last_name: last.title, last_start: last.start_date, last_end: last.end_date || '',
      city: last.place?.city || '', region: last.place?.region || '', country: last.place?.country || '',
      location_text: last.location_text || '', sources: [...g.sources].sort().join(','), url: last.url || '',
      expected_month: MONTH_NAMES[month - 1], last_tried: decided.get(g.core)?.last_tried || '',
      due: monthsBefore(last.start_date, -12),
    });
  }
  // Placed first, then unplaced; within each, never-tried before tried, then
  // by when the month comes round again — a year after the last edition, so
  // one overdue comes first and one held last week, its next a year off, last.
  // (By calendar month alone, last week's editions sorted to the top: the
  // first live run put a dozen October 2026 conferences above everything.)
  rows.sort((a, b) => (a.section === 'placed' ? 0 : 1) - (b.section === 'placed' ? 0 : 1)
    || (!!a.last_tried - !!b.last_tried) || a.due.localeCompare(b.due)
    || a.last_tried.localeCompare(b.last_tried) || a.core.localeCompare(b.core));
  return { rows, counts };
}

export const COLUMNS = ['section', 'core', 'last_name', 'last_start', 'last_end', 'city', 'region', 'country',
  'location_text', 'sources', 'url', 'expected_month', 'last_tried'];

export function toTsv(rows) {
  const cell = (v) => String(v ?? '').replace(/[\t\r\n]+/g, ' ');
  return [COLUMNS.join('\t'), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join('\t'))].join('\n') + '\n';
}

/* ---- run --------------------------------------------------------------- */

function readRecords() {
  const out = [];
  for (const f of readdirSync(RAW).filter((f) => f.endsWith('.json'))) {
    const list = JSON.parse(readFileSync(join(RAW, f), 'utf8'));
    if (Array.isArray(list)) out.push(...list);
  }
  return out;
}

// An unreadable log throws: a lost verdict would put a settled candidate back on the list.
const readLogs = () => readdirSync(REVIEW).filter((f) => /^discover-.*\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(join(REVIEW, f), 'utf8')));

async function main() {
  const { mlh, devpost, developersEvents, confsTech } = await import('./adapters/datasets.mjs');
  const now = today();
  const year = Number(now.slice(0, 4));
  const since = monthsBefore(now, 18);
  const log = (...a) => console.log(...a);
  log(`Past editions since ${since} (MLH, Devpost ended, developers.events, confs.tech)`);

  // Different hosts, so they can run side by side; http.mjs still keeps each host to one request at a time.
  const sources = {
    mlh: () => mlh({ seasons: [year - 1, year] }),
    devpost: () => devpost({ status: 'ended', since, inviteOnly: true }),
    devevents: () => developersEvents({ since }),
    confstech: () => confsTech({ years: [year - 1, year] }),
  };
  const editions = {}, failed = [];
  await Promise.all(Object.entries(sources).map(async ([name, fn]) => {
    const t0 = Date.now();
    try {
      editions[name] = await fn();
      log(`  ${name.padEnd(10)} ${String(editions[name].length).padStart(5)} editions  (${Math.round((Date.now() - t0) / 1000)}s)`);
    } catch (err) {
      failed.push(`${name}: ${err.message}`);
      log(`  ${name.padEnd(10)} FAILED ${err.message}`);
    }
  }));

  const { rows, counts } = returning({ editions, records: readRecords(), logs: readLogs(), now });
  writeFileSync(OUT, toTsv(rows));

  const placed = rows.filter((r) => r.section === 'placed').length;
  log('\nSummary');
  for (const [s, n] of Object.entries(counts.read)) log(`  read ${s.padEnd(10)} ${n}${n ? '' : '   <- nothing read: a failed source?'}`);
  log(`  outside the 18 months   ${counts.outOfWindow}`);
  log(`  dropped, not US/Canada  ${counts.notUsCa}`);
  log(`  dropped, unplaced, no US/Canada hint  ${counts.unplacedNoHint}`);
  log(`  covered by a record     ${counts.covered}`);
  log(`  already decided         ${counts.decided}`);
  log(`  candidates              ${rows.length} (${placed} placed, ${rows.length - placed} unplaced)`);
  log(`\nWrote ${OUT}`);
  if (failed.length) {
    log(`\nFAILED SOURCES — the list is missing their editions:\n  ${failed.join('\n  ')}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) await main();
