/**
 * Guild.host — community groups (civic tech, maker nights, dev meetups,
 * Cocoaheads) hosting events on guild.host. The site's own front end reads a
 * keyless JSON endpoint, a Relay-style connection of every upcoming public
 * event; robots.txt disallows only admin/auth/settings paths.
 *
 * Two quirks, both found by probing rather than from the notes:
 *  - Paging needs `first` as well as `after`. `?after=<endCursor>` alone is
 *    accepted and silently returns page one again, which would read as a
 *    complete (and tiny) listing. `first` itself is capped at 5.
 *  - The venue is coordinates only: no city, region or country. The place is
 *    therefore the nearest city we already follow (the registry's discovery
 *    list, which carries coordinates), if one is close enough.
 */
import { readFileSync } from 'node:fs';
import { getJSON } from '../lib/http.mjs';
import { fromParts, localDate } from '../lib/geo.mjs';

const BASE = 'https://guild.host/api/next/events/upcoming';
// The whole upcoming list is ~70 events, 5 a page. A list that outgrows the
// cap is cut off, so that throws instead of passing for the whole.
const MAX_PAGES = 40;
// A metro, not a pin: Brampton and Mississauga are Toronto's. Further out than
// this, the event is left unplaced for data/feeds/place-overrides.json.
const NEAR_KM = 40;
// Rough North America box, so Europe is dropped here instead of reaching the
// runner as an unplaced event.
const IN_NA = ([lon, lat]) => lat > 24 && lat < 72 && lon > -170 && lon < -50;

function km([lon1, lat1], [lon2, lat2]) {
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

function registryCities() {
  const file = new URL('../../../data/feeds/registry.json', import.meta.url);
  return JSON.parse(readFileSync(file, 'utf8')).discovery.filter((c) => c.lat != null && c.lng != null);
}

/** One node of the connection -> a feed event, or null (online, outside US/Canada, not public). */
export function toEvent(n, cities) {
  const xy = n.venue?.address?.location?.geojson?.coordinates;
  // No venue is an online event (its page just carries an external link).
  if (n.visibility !== 'LISTED' || !Array.isArray(xy) || xy.length < 2 || !IN_NA(xy)) return null;
  let best = null;
  for (const c of cities) {
    const d = km(xy, [c.lng, c.lat]);
    if (d <= NEAR_KM && (!best || d < best.d)) best = { d, c };
  }
  const place = best && fromParts({ city: best.c.city, region: best.c.region, country: best.c.country });
  const tz = n.timeZone || place?.tz;
  const start = localDate(n.startAt, tz);
  const end = n.endAt ? localDate(n.endAt, tz) : '';
  if (!start || !n.fullUrl) return null;
  return {
    feed: 'guild', feed_id: `guild:${n.slug || n.id}`,
    title: n.name, description: String(n.description || '').replace(/\s+/g, ' ').trim().slice(0, 600),
    organiser: { name: n.owner?.name || '' }, url: n.fullUrl,
    start_date: start, end_date: end && end !== start ? end : '',
    place, venue: '', online: false, cost: 'varies', type: 'meetup',
  };
}

export async function guild({ cities = registryCities() } = {}) {
  const out = [];
  let after = '';
  for (let page = 0; ; page++) {
    if (page === MAX_PAGES) throw new Error(`Guild.host: more than ${MAX_PAGES} pages, listing cut off`);
    const { ok, data } = await getJSON(`${BASE}?first=5${after ? `&after=${encodeURIComponent(after)}` : ''}`);
    if (!ok || !Array.isArray(data?.edges)) throw new Error(`Guild.host unreadable (page ${page + 1})`);
    for (const { node } of data.edges) {
      const e = node && toEvent(node, cities);
      if (e) out.push(e);
    }
    const next = data.pageInfo?.hasNextPage && data.pageInfo.endCursor;
    if (!next) break;
    if (next === after) throw new Error('Guild.host: paging did not advance');
    after = next;
  }
  return out;
}
