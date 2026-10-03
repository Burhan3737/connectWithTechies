/**
 * Sources that are tech by construction, read in full on every run:
 *
 *   MLH        — the student hackathon season, organiser-submitted
 *   Devpost    — in-person hackathons
 *   confs.tech — an open, community-reviewed dataset of tech conferences on GitHub
 *
 * None needs a relevance judgement; every event on them is in scope. What they
 * do need is care with place and date, which each describes differently.
 */
import { get, getJSON, pageData, findAll } from '../lib/http.mjs';
import { fromText, fromParts, localDate, knownCity } from '../lib/geo.mjs';
import { today } from '../../lib/today.mjs';

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');

/* ---- MLH -------------------------------------------------------------- */

export async function mlh() {
  const out = [];
  const year = Number(today().slice(0, 4));
  // A season is named for the year it ends: the 2027 season runs Aug 2026 - Jul 2027.
  for (const season of [year, year + 1]) {
    const res = await get(`https://mlh.com/seasons/${season}/events`);
    if (res.status !== 200) continue;
    const pd = pageData(res.body);
    for (const e of findAll(pd, (o) => o.name && o.startsAt && o.formatType)) {
      if (e.formatType !== 'physical') continue;
      const place = fromText(e.location);
      if (!place) continue;
      out.push({
        feed: 'mlh', feed_id: `mlh:${e.id || e.slug}`,
        title: e.name, description: 'A student hackathon in the Major League Hacking season.',
        organiser: { name: 'Major League Hacking' },
        url: e.websiteUrl || e.url || '',
        start_date: localDate(e.startsAt, place.tz),
        end_date: e.endsAt ? localDate(e.endsAt, place.tz) : '',
        place, venue: '', online: false, cost: 'free', type: 'hackathon',
      });
    }
  }
  return out;
}

/* ---- Devpost ---------------------------------------------------------- */

/** "Oct 10 - 11, 2026" or "Jan 25 - Feb 11, 2027" -> [start, end]. */
function devpostRange(s) {
  // A one-day event: "Oct 10, 2026".
  const one = String(s || '').match(/^\s*([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})\s*$/);
  if (one && MONTHS[one[1].toLowerCase()]) {
    const d = `${one[3]}-${pad(MONTHS[one[1].toLowerCase()])}-${pad(one[2])}`;
    return [d, d];
  }
  const m = String(s || '').match(/([A-Za-z]{3})\s+(\d{1,2})\s*-\s*(?:([A-Za-z]{3})\s+)?(\d{1,2}),\s*(\d{4})/);
  if (!m) return null;
  const [, m1, d1, m2, d2, y] = m;
  const a = MONTHS[m1.toLowerCase()], b = MONTHS[(m2 || m1).toLowerCase()];
  if (!a || !b) return null;
  const y1 = b < a ? Number(y) - 1 : Number(y);
  return [`${y1}-${pad(a)}-${pad(d1)}`, `${y}-${pad(b)}-${pad(d2)}`];
}

function uniqueKnownCity(name) {
  const ca = knownCity(name, 'Canada'), us = knownCity(name, 'United States');
  return ca && us ? null : ca || us;
}

export async function devpost() {
  const out = [];
  for (let page = 1; page <= 15; page++) {
    const { ok, data } = await getJSON(
      `https://devpost.com/api/hackathons?status[]=upcoming&challenge_type[]=in-person&page=${page}`);
    if (!ok || !data?.hackathons?.length) break;
    for (const h of data.hackathons) {
      if (h.invite_only) continue;
      const loc = h.displayed_location?.location || '';
      if (/online/i.test(loc) && !/\+/.test(loc)) continue;
      // Devpost's location is free text — "Princeton High School", "Grand Finals
      // 2027". Only a string that resolves to a real US or Canadian city is used.
      // A bare city ("Toronto") resolves only if our curated data already knows
      // exactly one such city — never a guess between Waterloo ON and Waterloo IA.
      const bare = loc.replace(/\s*\+\s*online\s*$/i, '').trim();
      const place = fromText(bare) || (!bare.includes(',') ? uniqueKnownCity(bare) : null);
      if (!place) continue;
      const range = devpostRange(h.submission_period_dates);
      if (!range) continue;
      // Its dates are the submission period, not the event. For an in-person
      // weekend they coincide; a window of weeks is not an event date and is
      // not published as one.
      const days = (Date.parse(range[1]) - Date.parse(range[0])) / 86400000;
      if (days > 4) continue;
      out.push({
        feed: 'devpost', feed_id: `devpost:${h.id}`,
        title: h.title, description: `A hackathon listed on Devpost${h.organization_name ? ` by ${h.organization_name}` : ''}.`,
        organiser: { name: h.organization_name || '' },
        url: h.url, start_date: range[0], end_date: range[1] !== range[0] ? range[1] : '',
        place, venue: loc.split(',')[0], online: false, cost: 'free', type: 'hackathon',
      });
    }
  }
  return out;
}

/* ---- developers.events ------------------------------------------------ */

/**
 * The developers-conferences-agenda dataset (MIT, github.com/scraly), served as
 * one JSON file. Six times confs.tech's US/Canada coverage. Dates are epoch ms
 * at UTC midnight, so the UTC calendar date is the event date.
 */
export async function developersEvents() {
  const out = [];
  const { ok, data } = await getJSON('https://developers.events/all-events.json');
  if (!ok || !Array.isArray(data)) throw new Error('developers.events unreadable');
  const utcDate = (ms) => new Date(Number(ms)).toISOString().slice(0, 10);
  for (const c of data) {
    if (!['USA', 'Canada'].includes(c.country) || !Array.isArray(c.date) || !c.date[0] || !c.hyperlink) continue;
    if (/online/i.test(c.location || '')) continue;
    const place = fromText(`${c.city || ''}, ${c.country}`) || fromText(String(c.location || '').replace(/\s*\(([^)]+)\)$/, ', $1'));
    if (!place) continue;
    const start = utcDate(c.date[0]);
    if ((c.date[1] ? utcDate(c.date[1]) : start) < today()) continue;   // the file keeps history back to 2017
    const end = c.date[1] ? utcDate(c.date[1]) : '';
    const topics = (c.tags || []).map((t) => String(t.value || '').toLowerCase()).filter(Boolean).slice(0, 6);
    out.push({
      feed: 'devevents', feed_id: `devevents:${c.hyperlink}|${start}`,
      title: c.name, description: `A developer conference${topics.length ? ` (${topics.slice(0, 3).join(', ')})` : ''}, listed on developers.events.`,
      organiser: { name: '' }, url: c.hyperlink,
      start_date: start, end_date: end && end !== start ? end : '',
      place, venue: '', online: false, cost: 'varies', type: 'conference', topics,
    });
  }
  return out;
}

/* ---- Hack Club -------------------------------------------------------- */

/** High-school hackathons from Hack Club's public directory (MIT). */
export async function hackClub() {
  const out = [];
  const { ok, data } = await getJSON('https://hackathons.hackclub.com/api/events/upcoming');
  if (!ok || !Array.isArray(data)) throw new Error('Hack Club unreadable');
  for (const h of data) {
    if (!['US', 'CA'].includes(h.countryCode) || h.virtual) continue;
    // MLH-associated events already come from MLH, under their own name.
    if (h.mlhAssociated) continue;
    const place = fromParts({ city: h.city, region: h.state, country: h.countryCode === 'CA' ? 'Canada' : 'United States' });
    if (!place || !h.website) continue;
    const start = localDate(h.start, place.tz);
    const end = h.end ? localDate(h.end, place.tz) : '';
    out.push({
      feed: 'hackclub', feed_id: `hackclub:${h.id}`,
      title: h.name, description: 'A hackathon for high-school students, listed in the Hack Club directory.',
      organiser: { name: '' }, url: h.website,
      start_date: start, end_date: end && end !== start ? end : '',
      place, venue: '', online: false, cost: 'free', type: 'hackathon', audience: 'high-school students',
    });
  }
  return out;
}

/* ---- confs.tech ------------------------------------------------------- */

export async function confsTech() {
  const out = [];
  const year = Number(today().slice(0, 4));
  for (const y of [year, year + 1]) {
    const { ok, data } = await getJSON(
      `https://api.github.com/repos/tech-conferences/conference-data/contents/conferences/${y}`);
    if (!ok || !Array.isArray(data)) continue;
    for (const file of data.filter((f) => f.name.endsWith('.json'))) {
      const topic = file.name.replace(/\.json$/, '');
      const list = await getJSON(file.download_url);
      if (!list.ok || !Array.isArray(list.data)) continue;
      for (const c of list.data) {
        if (c.online === true && !c.city) continue;
        if (!/u\.s\.a|usa|united states|canada/i.test(c.country || '')) continue;
        const place = fromText(`${c.city}, ${c.country}`);
        if (!place) continue;
        out.push({
          feed: 'confstech', feed_id: `confstech:${c.url}|${c.startDate}`,
          title: c.name, description: `A ${topic} conference, listed in the confs.tech open dataset.`,
          organiser: { name: '' }, url: c.url,
          start_date: c.startDate, end_date: c.endDate && c.endDate !== c.startDate ? c.endDate : '',
          place, venue: '', online: false, cost: 'varies', type: 'conference', topics: [topic],
        });
      }
    }
  }
  return out;
}
