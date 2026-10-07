#!/usr/bin/env node
/**
 * The feed: our own dynamic event data, built from many sources and maintained
 * by script.
 *
 *   node scripts/feeds/run.mjs              maintain + datasets (every run)
 *   node scripts/feeds/run.mjs --discover   also search every city for new events
 *                                           and new organisers to follow
 *   node scripts/feeds/run.mjs --dry-run    report, write nothing
 *
 * Two jobs:
 *
 *   discover  search Luma, Meetup and Eventbrite city by city. Events found are
 *             kept; organisers that prove to be tech communities are added to
 *             data/feeds/registry.json.
 *   maintain  re-read every registered organiser through its public calendar
 *             feed, plus the tech-only datasets (MLH, Devpost, confs.tech).
 *
 * Both pass through the same gate — in person, in the US or Canada, upcoming,
 * and a place a tech person could plausibly meet other tech people — then are
 * de-duplicated across sources and against the curated dataset, which always
 * wins. The result is data/raw/feed.json, which the build reads like any other
 * research file. The app does not know or care where an event came from.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { today } from '../lib/today.mjs';
import { canonPlace } from '../lib/places.mjs';
import { fromParts } from './lib/geo.mjs';
import { stats, getJSON } from './lib/http.mjs';
import { judge, judgeOrganiser } from './lib/relevance.mjs';
import * as luma from './adapters/luma.mjs';
import * as meetup from './adapters/meetup.mjs';
import * as eventbrite from './adapters/eventbrite.mjs';
import * as ical from './adapters/ical.mjs';
import { readCalendar as readLuma } from './adapters/luma.mjs';
import { readGroup as readMeetup } from './adapters/meetup.mjs';
import { mlh, devpost, confsTech, developersEvents, hackClub } from './adapters/datasets.mjs';
import * as tribe from './adapters/tribe.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RAW = join(ROOT, 'data', 'raw');
const REGISTRY = join(ROOT, 'data', 'feeds', 'registry.json');
const OUT = join(RAW, 'feed.json');
const REPORT = join(ROOT, 'data', 'feeds', 'last-run.json');

const args = process.argv.slice(2);
const DISCOVER = args.includes('--discover');
const DRY = args.includes('--dry-run');
const onlyCity = (args.find((a) => a.startsWith('--city=')) || '').slice(7);
const TODAY = today();
const KEEP_PAST_DAYS = 60;   // held events stay visible under Past for this long

const log = (...a) => console.log(...a);
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const words = (s) => ` ${String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
const daysAgo = (iso) => (Date.parse(TODAY) - Date.parse(iso)) / 86400000;

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
registry.sources ||= [];
const report = { run_on: TODAY, discover: DISCOVER, bySource: {}, dropped: {}, samples: { kept: [], dropped: [] },
  newOrganisers: [], failedSources: [] };
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };

/* ---- 1. collect -------------------------------------------------------- */

const candidates = [];          // { ...event, sourceIsTech, organiserIsTech }
const seenSources = new Set();  // feeds read successfully this run
const orgTitles = new Map();    // organiser id -> titles seen, for track-record judgement
const orgFound = new Map();     // organiser id -> registry candidate

// Reviewed corrections for places a source gets wrong (data/feeds/place-overrides.json).
const OVERRIDES_FILE = join(ROOT, 'data', 'feeds', 'place-overrides.json');
const placeOverrides = existsSync(OVERRIDES_FILE) ? JSON.parse(readFileSync(OVERRIDES_FILE, 'utf8')) : {};

function take(list, flags) {
  for (const raw of list) {
    const fix = placeOverrides[raw.feed_id];
    const e = fix ? { ...raw, place: fromParts(fix) || raw.place, venue: fix.venue ?? raw.venue } : raw;
    candidates.push({ ...e, ...flags });
    bump(report.bySource, e.feed);
    if (e.organiser?.id) {
      if (!orgTitles.has(e.organiser.id)) orgTitles.set(e.organiser.id, []);
      orgTitles.get(e.organiser.id).push(e.title);
    }
  }
}

log('Datasets: MLH, Devpost, confs.tech, developers.events, Hack Club');
for (const [name, fn] of [['mlh', mlh], ['devpost', devpost], ['confstech', confsTech],
  ['devevents', developersEvents], ['hackclub', hackClub]]) {
  try {
    const list = await fn();
    take(list, { sourceIsTech: true });
    seenSources.add(name);
    log(`  ${name.padEnd(10)} ${list.length}`);
  } catch (err) {
    report.failedSources.push(`${name}: ${err.message}`);
    log(`  ${name.padEnd(10)} FAILED ${err.message}`);
  }
}

if (DISCOVER) {
  const cities = registry.discovery.filter((c) => !onlyCity || c.city === onlyCity);
  log(`\nDiscovery across ${cities.length} cities`);
  for (const city of cities) {
    const counts = [];
    for (const [name, mod] of [['luma', luma], ['meetup', meetup], ['eventbrite', eventbrite]]) {
      try {
        const { events, organisers } = await mod.discover(city);
        take(events, {});
        for (const o of organisers) if (!orgFound.has(o.id)) orgFound.set(o.id, o);
        seenSources.add(`${name}:${city.city}`);
        counts.push(`${name} ${events.length}`);
      } catch (err) {
        report.failedSources.push(`${name}:${city.city}: ${err.message}`);
        counts.push(`${name} FAILED`);
      }
    }
    log(`  ${city.city.padEnd(16)} ${counts.join('  ')}`);
  }
}

/* ---- 2. organisers: judge, and register the tech ones ------------------- */

const registered = new Map(registry.sources.map((s) => [s.id, s]));
// judgeEvents sources (a city calendar mixing tech with life sciences) are
// followed, but each of their events must pass the gate on its own merits.
const techOrg = new Set(registry.sources.filter((s) => s.tech !== false && !s.judgeEvents).map((s) => s.id));

// Eventbrite listings name no organiser, so a candidate's profile page is read
// before judging it — one throttled request each, hence the cap. Rejections are
// remembered (tech: false) and not looked at again for RECHECK_DAYS.
const PROFILE_LIMIT = Number(process.env.FEED_PROFILE_LIMIT || 80);
const RECHECK_DAYS = 60;
let profiled = 0;

for (const [id, o] of orgFound) {
  const rawId = id.replace(/^(luma-cal|meetup):/, '');
  let titles = orgTitles.get(rawId) || orgTitles.get(id) || [];
  let candidate = o;

  if (o.needsProfile) {
    const known = registered.get(id);
    if (known && (known.tech !== false || daysAgo(known.checked || known.added) < RECHECK_DAYS)) {
      if (known.tech !== false) techOrg.add(id);
      continue;
    }
    if (profiled >= PROFILE_LIMIT) continue;
    profiled++;
    const p = await eventbrite.profile(o).catch(() => null);
    if (!p) continue;
    candidate = { ...o, name: p.name, description: p.description, website: p.website };
    delete candidate.needsProfile;
    titles = p.titles;
    const verdict = judgeOrganiser(candidate, titles);
    // Follow only organisers that keep running events; a one-off is found
    // again by discovery if they ever run another.
    const follow = verdict.tech && p.total >= 2;
    const reason = follow ? verdict.reason : verdict.tech ? `only ${p.total} upcoming event(s)` : verdict.reason;
    const entry = { ...candidate, tech: follow, reason, added: known?.added || TODAY, checked: TODAY };
    if (known) Object.assign(known, entry); else { registered.set(id, entry); registry.sources.push(entry); }
    if (follow) {
      techOrg.add(id);
      report.newOrganisers.push(`${entry.name} (eventbrite, ${o.home?.city || '?'}) — ${reason}`);
    }
    continue;
  }

  const verdict = judgeOrganiser(candidate, titles);
  if (verdict.tech) techOrg.add(id);
  if (verdict.tech && !registered.has(id)) {
    const entry = { ...o, tech: true, reason: verdict.reason, added: TODAY };
    registered.set(id, entry);
    registry.sources.push(entry);
    report.newOrganisers.push(`${o.name} (${o.platform}, ${o.home?.city || '?'}) — ${verdict.reason}`);
  }
}

/* ---- 2b. organisers an agent found: data/review/sources-*.json ----------- */
//
// The hand-off from discovery by judgement to maintenance by script. A curator
// who finds a university club's Luma calendar or an accelerator's Meetup group
// lists it once:
//
//   [{ "url": "https://luma.com/genai-sf", "reason": "largest AI meetup in SF" },
//    { "url": "https://www.meetup.com/sf-python/", "reason": "..." },
//    { "url": "https://example.org/events.ics", "name": "...", "reason": "..." },
//    { "url": "https://luma.com/some-cal", "tech": false, "reason": "all wine nights" }]
//
// and from then on it is read here on every run. "tech": false retires a
// registered organiser whose events turned out not to be ours.

const proposals = existsSync(join(ROOT, 'data', 'review'))
  ? readdirSync(join(ROOT, 'data', 'review')).filter((f) => /^sources-.*\.json$/.test(f)).sort() : [];
for (const file of proposals) {
  let list;
  try { list = JSON.parse(readFileSync(join(ROOT, 'data', 'review', file), 'utf8')); }
  catch (err) { report.failedSources.push(`${file}: unreadable (${err.message})`); continue; }
  for (const p of Array.isArray(list) ? list : []) {
    const src = await resolveProposal(p).catch(() => null);
    if (!src) { report.failedSources.push(`${file}: could not resolve ${p.url}`); continue; }
    const existing = registered.get(src.id);
    if (p.tech === false) {
      if (existing && existing.tech !== false) {
        existing.tech = false;
        existing.reason = `retired by ${file}: ${p.reason || ''}`.trim();
        techOrg.delete(src.id);
        report.newOrganisers.push(`- ${existing.name} retired — ${p.reason || file}`);
      }
      continue;
    }
    if (existing) continue;
    const entry = { ...src, tech: true, ...(p.judge_each ? { judgeEvents: true } : {}),
      reason: `proposed in ${file}: ${p.reason || ''}`.trim(), added: TODAY };
    registered.set(src.id, entry);
    registry.sources.push(entry);
    if (!entry.judgeEvents) techOrg.add(src.id);
    report.newOrganisers.push(`${entry.name} (${entry.platform}) — ${entry.reason}`);
  }
}

/** A proposal's URL -> a registry entry, or null if it is not a followable source. */
async function resolveProposal(p) {
  const url = String(p.url || '').trim();
  const lumaSlug = url.match(/^https?:\/\/(?:www\.)?(?:luma\.com|lu\.ma)\/([^/?#]+)\/?$/i)?.[1];
  if (lumaSlug) {
    const { ok, data } = await getJSON(`https://api.lu.ma/url?url=${encodeURIComponent(lumaSlug)}`);
    const cal = ok && data?.kind === 'calendar' ? data.data?.calendar : null;
    if (!cal?.api_id) return null;
    return { id: `luma-cal:${cal.api_id}`, kind: 'luma-calendar', platform: 'luma',
      url: `https://api.lu.ma/ics/get?entity=calendar&id=${cal.api_id}`,
      name: p.name || cal.name || lumaSlug, description: cal.description_short || '', website: cal.website || '',
      home: null, page: `https://luma.com/${lumaSlug}` };
  }
  const ebOrg = url.match(/^https?:\/\/(?:www\.)?eventbrite\.(?:com|ca)\/o\/(?:[a-z0-9-]*-)?(\d{6,})/i)?.[1];
  if (ebOrg) {
    const page = `https://www.eventbrite.com/o/${ebOrg}`;
    return { id: `eventbrite:${ebOrg}`, kind: 'eventbrite-organizer', platform: 'eventbrite', url: page, page,
      name: p.name || '', description: '', website: '', home: null };
  }
  const group = url.match(/^https?:\/\/(?:www\.)?meetup\.com\/([^/?#]+)/i)?.[1];
  if (group && group !== 'find') {
    return { id: `meetup:${group}`, kind: 'meetup-group', platform: 'meetup',
      url: `https://www.meetup.com/${group}/events/ical/`, name: p.name || group,
      description: '', website: '', home: null, page: `https://www.meetup.com/${group}/` };
  }
  if (/\/wp-json\/tribe\/events\/v1/i.test(url)) {
    const base = url.replace(/(\/wp-json\/tribe\/events\/v1).*$/i, '$1');
    const host = new URL(base).host;
    return { id: `tribe:${host}`, kind: 'tribe-rest', platform: 'tribe', url: base,
      name: p.name || host, description: '', website: `https://${host}`, home: null, page: p.page || '' };
  }
  if (/^(https?|webcal):\/\//i.test(url) && /\.ics(\?|$)|ical/i.test(url)) {
    return { id: `ical:${url}`, kind: 'ical', platform: 'ical', url: url.replace(/^webcal:/i, 'https:'),
      name: p.name || new URL(url.replace(/^webcal:/i, 'https:')).host, description: '', website: '',
      home: null, page: p.page || '' };
  }
  return null;
}

/* ---- 3. maintain: every registered organiser, through its feed ---------- */

log(`\nMaintaining ${registry.sources.length} registered organiser feed(s)`);
let feedOk = 0, feedEvents = 0;
for (const src of registry.sources) {
  if (src.tech === false) continue;
  try {
    // Luma calendars and Meetup groups are read where they give places; any
    // other registered source through its iCal feed.
    const reader = src.platform === 'luma' ? readLuma : src.platform === 'meetup' ? readMeetup
      : src.platform === 'eventbrite' ? eventbrite.readOrganizer
      : src.platform === 'tribe' ? tribe.read : ical.read;
    const { events, ok, partial, name } = await reader(src);
    if (!ok) { report.failedSources.push(`${src.id}: feed unreadable`); continue; }
    if (!src.name && name) src.name = name;
    feedOk++;
    feedEvents += events.length;
    // Only a complete read can show an event was taken down.
    if (!partial) seenSources.add(src.id);
    take(events, { organiserIsTech: !src.judgeEvents, registryId: src.id });
    src.last_read = TODAY;
    src.last_count = events.length;
  } catch (err) {
    report.failedSources.push(`${src.id}: ${err.message}`);
  }
}
log(`  read ${feedOk} feed(s), ${feedEvents} event(s)`);

/* ---- 4. the gate ------------------------------------------------------- */

const orgIdOf = (e) => (e.registryId || (e.feed === 'luma' ? `luma-cal:${e.organiser?.id}` :
  e.feed === 'meetup' ? `meetup:${e.organiser?.id}` :
  e.feed === 'eventbrite' ? (e.organiser?.id || '') : ''));

const gated = [];
for (const e of candidates) {
  const why = !e.place ? 'no US/Canada location'
    : e.online ? 'online'
    : !/^\d{4}-\d{2}-\d{2}$/.test(e.start_date || '') ? 'no date'
    // Past once it has ended: a conference on its second day is still on.
    : (e.end_date || e.start_date) < TODAY ? 'already past'
    : !e.url ? 'no link'
    : '';
  if (why) { bump(report.dropped, why); continue; }
  const v = judge(e, { sourceIsTech: e.sourceIsTech, organiserIsTech: e.organiserIsTech || techOrg.has(orgIdOf(e)) });
  if (!v.keep) {
    bump(report.dropped, 'not tech');
    if (report.samples.dropped.length < 300) report.samples.dropped.push(`${e.title} [${e.feed}] — ${v.reason}`);
    continue;
  }
  gated.push({ ...e, relevance: v.reason });
  if (report.samples.kept.length < 40) report.samples.kept.push(`${e.title} [${e.feed}] — ${v.reason}`);
}

/* ---- 5. de-duplicate: across sources, then against the curated data ----- */

// Where one event is listed on several platforms, prefer the organiser's own.
const RANK = { mlh: 1, confstech: 2, devevents: 2, tribe: 3, luma: 3, meetup: 4, hackclub: 5, devpost: 5, ical: 5, eventbrite: 6 };
// Also compare without spaces: "BSidesAtlanta" and "BSides Atlanta" are one event.
const nests = (a, b) => {
  const x = words(a), y = words(b);
  if (x.includes(y) || y.includes(x)) return true;
  const xs = x.replace(/ /g, ''), ys = y.replace(/ /g, '');
  return xs.length >= 6 && ys.length >= 6 && (xs.includes(ys) || ys.includes(xs));
};

gated.sort((a, b) => (RANK[a.feed] || 9) - (RANK[b.feed] || 9));
const unique = [];
const byId = new Set();
for (const e of gated) {
  if (byId.has(e.feed_id)) { bump(report.dropped, 'duplicate within a source'); continue; }
  byId.add(e.feed_id);
  const twin = unique.find((u) => u.place.city === e.place.city && u.start_date === e.start_date &&
    (norm(u.url) === norm(e.url) || nests(u.title, e.title)));
  if (twin) { bump(report.dropped, 'same event on another platform'); (twin.also_on ||= []).push(e.url); continue; }
  unique.push(e);
}

// The curated dataset is verified by hand and always wins.
const curated = [];
for (const f of readdirSync(RAW).filter((f) => f.endsWith('.json') && f !== 'feed.json')) {
  for (const r of JSON.parse(readFileSync(join(RAW, f), 'utf8'))) {
    // Raw files keep the researcher's spelling ("New York City"); compare canonically.
    curated.push({ ...r, city: canonPlace(r.city || '', r.region || '').city });
  }
}
const curatedUrls = new Set(curated.map((r) => norm(String(r.url).replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, ''))));
const fresh = unique.filter((e) => {
  const u = norm(String(e.url).replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, ''));
  if (curatedUrls.has(u)) { bump(report.dropped, 'already curated'); return false; }
  const hit = curated.find((r) => r.city === e.place.city && nests(r.name, e.title) &&
    (!r.next_date || r.next_date === e.start_date));
  if (hit) { bump(report.dropped, 'already curated'); return false; }
  // A curated series that links to the organiser this event came from, meeting
  // that day, is this event under another title ("Milwaukee Tech Hub Code &
  // Coffee" is Mitobyte's "November Code & Coffee").
  const page = norm(String(registered.get(e.registryId)?.page || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, ''));
  // A weekly or monthly series stands for all its sessions, not just the next.
  // Only sessions of that series, though: the same organiser's other events
  // ("Hackreation", "Code + Brews") stay, and an undated group record absorbs
  // nothing — its dated sessions are the better listing.
  const SERIES = /^(weekly|biweekly|monthly)$/;
  const core = ` ${words(e.title.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\b/gi, ' ')
    .replace(/\d+/g, ' ')).trim()} `;
  const sameSeries = (r) => r.next_date === e.start_date ||
    (SERIES.test(r.cadence || '') && !!r.next_date && core.trim().length > 3 && words(r.name).includes(core));
  if (page && curated.some((r) => r.city === e.place.city && sameSeries(r) &&
    norm(String(r.url).replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '')) === page)) {
    bump(report.dropped, 'already curated'); return false;
  }
  return true;
});

/* ---- 5b. a recurring series is one listing, not fifty -------------------- */
//
// Meetup groups publish their weekly events a year ahead: "Meet n Code" every
// Tuesday is 50 rows that bury everything else in the city. Occurrences from
// the same organiser, with the same title, in the same city collapse into one
// series record carrying its next date — the shape the curated data already
// uses for meetup series. Its id is stable, so when this week's session passes
// the next run simply moves next_date on.

const seriesTitle = (t) => words(String(t)
  .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\b/gi, ' ')
  .replace(/[#№]?\d+(st|nd|rd|th)?\b/gi, ' ')).trim();
const groups = new Map();
for (const e of fresh) {
  const k = [orgIdOf(e) || e.organiser?.name || e.feed, seriesTitle(e.title), e.place.city].join('|');
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(e);
}
const collapsed = [];
const folded = new Set();   // every occurrence's own id, so history does not resurrect them
for (const [k, list] of groups) {
  if (list.length < 2 || !seriesTitle(list[0].title)) { collapsed.push(...list); continue; }
  list.sort((a, b) => a.start_date.localeCompare(b.start_date));
  list.forEach((e) => folded.add(e.feed_id));
  const dates = [...new Set(list.map((e) => e.start_date))];
  const gaps = dates.slice(1).map((d, i) => (Date.parse(d) - Date.parse(dates[i])) / 86400000).sort((a, b) => a - b);
  const median = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;
  const cadence = median <= 9 ? 'weekly' : median <= 45 ? 'monthly' : median <= 100 ? 'quarterly' : 'rolling';
  collapsed.push({ ...list[0], series: { key: k, dates, cadence } });
  bump(report.dropped, 'later dates folded into a series', list.length - 1);
}

/* ---- 6. to our schema ---------------------------------------------------- */

const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

function typeOf(e) {
  if (e.type) return e.type;
  const t = words(e.title);
  if (/ (hackathon|hack|hacks|buildathon|codeathon) /.test(t)) return 'hackathon';
  if (/ (ctf|capture the flag) /.test(t)) return 'ctf';
  if (/ game jam /.test(t)) return 'game-jam';
  if (/ (demo day|demo night|pitch night|pitch competition) /.test(t)) return 'demo-day';
  if (/ (career fair|job fair|hiring event) /.test(t)) return 'career-fair';
  if (/ (workshop|bootcamp|masterclass|office hours|hands on) /.test(t)) return 'workshop';
  if (/ tech week /.test(t)) return 'tech-week';
  if (/ (summit) /.test(t)) return 'summit';
  if (/ (conference|conf|con) /.test(t)) return 'conference';
  return 'meetup';
}

const shortDate = (d) => `${MONTH[Number(d.slice(5, 7)) - 1].slice(0, 3)} ${Number(d.slice(8, 10))}`;
const describe = (e) => {
  const base = e.description ||
    `Listed on ${({ luma: 'Luma', meetup: 'Meetup', eventbrite: 'Eventbrite', tribe: e.organiser?.name, ical: e.organiser?.name })[e.feed] || e.feed}` +
    `${e.organiser?.name ? ` by ${e.organiser.name}` : ''}.`;
  if (!e.series) return base;
  const next = e.series.dates.slice(1, 5).map(shortDate).join(', ');
  return `Meets ${e.series.cadence === 'rolling' ? 'regularly' : e.series.cadence}; also ${next}` +
    `${e.series.dates.length > 5 ? ' and later' : ''}. ${base}`;
};

const toRecord = (e) => ({
  name: String(e.title).replace(/\s+/g, ' ').trim(),
  type: e.series && typeOf(e) === 'meetup' ? 'meetup-series' : typeOf(e),
  topics: e.topics || [],
  city: e.place.city,
  region: e.place.region,
  country: e.place.country,
  venue: String(e.venue || '').trim(),
  cadence: e.series?.cadence || 'one-off',
  month: e.series ? 'Varies' : MONTH[Number(e.start_date.slice(5, 7)) - 1],
  next_date: e.start_date,
  next_date_end: e.end_date || '',
  last_date: '',
  status: 'upcoming',
  attendance: '',
  cost: e.cost || 'varies',
  audience: '',
  url: e.url,
  description: describe(e),
  source: e.url,
  feed_source: e.feed,
  // A series keeps one id across runs, whichever session is next.
  feed_id: e.series ? `series:${createHash('sha1').update(e.series.key).digest('hex').slice(0, 16)}` : e.feed_id,
  ...(e.series ? { feed_dates: e.series.dates.slice(0, 12) } : {}),
  // The registry feed or dataset it was read from; discovery hits carry none.
  feed_via: e.registryId || (e.sourceIsTech ? e.feed : ''),
  feed_organiser: e.organiser?.name || registered.get(orgIdOf(e))?.name || '',
  feed_relevance: e.relevance,
  feed_first_seen: TODAY,
  feed_last_seen: TODAY,
});

/* ---- 7. carry history forward ------------------------------------------ */

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
const prevById = new Map(previous.map((r) => [r.feed_id, r]));
// The stand-in text written when a source gives no description.
const SERIES_PREFIX = /^Meets [^.]*\. /;
// The stand-in, or a "description" that only repeats the title, says nothing.
const isStandIn = (d = '', title = '') => /^Listed on .+\.$/.test(d.replace(SERIES_PREFIX, '')) ||
  (!!title && d.trim().toLowerCase() === String(title).trim().toLowerCase());
// Titles are compared case-blind: one listing re-posted as "Summit 2026 by X" vs "summit 2026 by X".
const titleKey = (name, city) => `${String(name).toLowerCase()}|${city}`;
const prevByTitle = new Map(previous.filter((r) => r.description && !isStandIn(r.description, r.name))
  .map((r) => [titleKey(r.name, r.city), r.description]));

const out = collapsed.map((e) => {
  const r = toRecord(e);
  const was = prevById.get(r.feed_id);
  if (was) r.feed_first_seen = was.feed_first_seen || TODAY;
  // A read that brings no description must not erase one already held: an
  // organiser page lists events without the summary their listing carried,
  // and 159 real descriptions were once replaced by the stand-in that way.
  // A new session of a recurring event borrows its sibling's description.
  const held = was?.description && !isStandIn(was.description, was.name) ? was.description : prevByTitle.get(titleKey(r.name, r.city));
  if ((!e.description || isStandIn(e.description, e.title)) && held) {
    r.description = (r.description.match(SERIES_PREFIX)?.[0] || '') + held.replace(SERIES_PREFIX, '');
  }
  return r;
});
const outIds = new Set(out.map((r) => r.feed_id));
const candidateIds = new Set(candidates.map((e) => e.feed_id));

let kept = 0, expired = 0, vanished = 0;
for (const r of previous) {
  if (outIds.has(r.feed_id) || folded.has(r.feed_id)) continue;
  // Seen this run and turned away by the gate (judged off-topic, now curated,
  // a duplicate): history must not bring it back.
  if (candidateIds.has(r.feed_id)) continue;
  // History keeps an event between reads, not past the rules: a place today's
  // checks would reject ("Tennessee" as a city) is not carried forward.
  if (!fromParts({ city: r.city, region: r.region, country: r.country })) { vanished++; continue; }
  const date = r.next_date_end || r.next_date;
  // Held once it has started, not once it has ended: Luma, Meetup and iCal
  // feeds stop listing an event the moment it begins, so an event missing on
  // its own day is happening, not cancelled. (Counting by end date once deleted
  // 73 events on the day they ran, Tacoma's only one among them.)
  if (r.next_date <= TODAY) {
    // Held: keep it for the Past view for a while, then let it go.
    if (daysAgo(date) <= KEEP_PAST_DAYS) { out.push(r); kept++; } else expired++;
    continue;
  }
  // Still upcoming but not seen this run. If its source was read successfully,
  // the organiser took it down — cancelled or moved — so it goes. If its source
  // failed, keep it: a flaky request is not evidence an event was cancelled.
  // Discovery only reads the first few pages of a city, so absence there proves
  // nothing; only a feed read in full can show that an event was taken down.
  const readThisRun = r.feed_via ? seenSources.has(r.feed_via) : false;
  if (readThisRun) { vanished++; continue; }
  out.push(r);
  kept++;
}

/* ---- 8. write ------------------------------------------------------------ */

out.sort((a, b) => a.city.localeCompare(b.city) || a.next_date.localeCompare(b.next_date));
report.totals = {
  candidates: candidates.length, passed_gate: gated.length, unique: unique.length,
  new_or_updated: collapsed.length, carried_forward: kept, expired, vanished,
  written: out.length, organisers_registered: registry.sources.length,
  http: stats,
};

log(`\nGate:   ${candidates.length} candidates -> ${gated.length} in scope`);
for (const [k, v] of Object.entries(report.dropped).sort((a, b) => b[1] - a[1])) log(`          dropped ${String(v).padStart(5)}  ${k}`);
log(`Output: ${out.length} events (${collapsed.length} from this run, ${kept} carried forward, ${expired} expired, ${vanished} taken down)`);
if (report.newOrganisers.length) {
  log(`\nNew organisers registered (${report.newOrganisers.length}) — maintained by feed from now on:`);
  report.newOrganisers.slice(0, 25).forEach((s) => log(`  + ${s}`));
  if (report.newOrganisers.length > 25) log(`  ... and ${report.newOrganisers.length - 25} more`);
}
log(`\nHTTP: ${stats.requests} requests, ${stats.cached} from cache, ${stats.failed} failed, ${stats.throttled} throttled and retried`);
if (report.failedSources.length) log(`Failed sources: ${report.failedSources.length} (see data/feeds/last-run.json)`);

if (DRY) { log('\n--dry-run: nothing written.'); process.exit(0); }
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');
writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n', 'utf8');
writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n', 'utf8');
log(`\nWrote data/raw/feed.json, data/feeds/registry.json, data/feeds/last-run.json`);
