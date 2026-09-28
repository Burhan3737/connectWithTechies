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
import { fromText, localDate } from '../lib/geo.mjs';
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
  const m = String(s || '').match(/([A-Za-z]{3})\s+(\d{1,2})\s*-\s*(?:([A-Za-z]{3})\s+)?(\d{1,2}),\s*(\d{4})/);
  if (!m) return null;
  const [, m1, d1, m2, d2, y] = m;
  const a = MONTHS[m1.toLowerCase()], b = MONTHS[(m2 || m1).toLowerCase()];
  if (!a || !b) return null;
  const y1 = b < a ? Number(y) - 1 : Number(y);
  return [`${y1}-${pad(a)}-${pad(d1)}`, `${y}-${pad(b)}-${pad(d2)}`];
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
      const place = fromText(loc);
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
