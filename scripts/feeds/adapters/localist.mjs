/**
 * Localist — university event calendars. Localist is the calendar software many
 * campuses run, and every install serves the same keyless JSON the site itself
 * reads: <host>/api/2/events. Adding a university is one line in HOSTS.
 *
 * Not tech by construction: a campus calendar is mostly lectures, concerts and
 * seminars, so the keywords below pull the few that matter (the Stanford
 * calendar returned 13 hackathon and 23 entrepreneurship rows in a 90-day
 * window; MIT, Harvard SEAS, UT Austin and Cornell returned none for any of
 * these when probed) and every event still goes through the relevance gate.
 *
 * Three quirks, all found by probing:
 *  - The API returns one row per *instance*. A recurring event (a nine-week
 *    hackathon that meets twice a week) comes back as a row per meeting with the
 *    same event id, and again for every keyword it matches. 23 rows were 11
 *    events. The adapter keeps one record per id, at its next instance.
 *  - `experience` is 'inperson', 'hybrid' or 'online'. Only 'inperson' is kept:
 *    a hybrid event has a room but is aimed at a stream as much as at the room.
 *  - An empty result is a valid answer, not a failure ({"events":[],"page":…}),
 *    so only a missing `events` array or a failed request counts as unreadable.
 */
import { getJSON } from '../lib/http.mjs';
import { fromParts, fromText } from '../lib/geo.mjs';

// One line per university. `name` is the organiser shown when an event names no department.
const HOSTS = [
  { host: 'events.stanford.edu', name: 'Stanford University' },
  { host: 'calendar.mit.edu', name: 'MIT' },
  { host: 'events.seas.harvard.edu', name: 'Harvard SEAS' },
  { host: 'calendar.utexas.edu', name: 'UT Austin' },
  { host: 'events.cornell.edu', name: 'Cornell University' },
];
const KEYWORDS = ['hackathon', 'startup', 'entrepreneurship', 'demo day', 'tech talk'];
const DAYS = 90;
const PER_PAGE = 100;
// A listing that outgrows the cap is cut off, so that throws instead of passing for the whole.
const MAX_PAGES = 10;

const flat = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

/**
 * One Localist event object -> a feed event, or null (online, hybrid, private,
 * not live, no instance, no usable URL). Dated at its earliest instance, in the
 * venue's own clock: the offset in "2026-10-24T10:00:00-07:00" is already local,
 * so the date is read off the string rather than converted.
 */
export function toEvent(ev, { host = '', name = '' } = {}) {
  if (!ev || ev.experience !== 'inperson' || ev.private || ev.status !== 'live') return null;
  const inst = (ev.event_instances || []).map((i) => i.event_instance).filter((i) => i?.start)
    .sort((a, b) => (a.start < b.start ? -1 : 1))[0];
  const url = ev.localist_url || ev.url;
  if (!inst || !url) return null;
  const g = ev.geo || {};
  const place = (g.city && fromParts({ city: g.city, region: g.state, country: g.country })) || fromText(ev.address);
  const start = inst.start.slice(0, 10);
  const end = inst.end ? inst.end.slice(0, 10) : '';
  return {
    // Ids are unique within an install, not promised across installs.
    feed: 'localist', feed_id: `localist:${host}:${ev.id}`,
    title: flat(ev.title, 300), description: flat(ev.description_text, 600),
    organiser: { name: ev.departments?.[0]?.name || name }, url,
    start_date: start, end_date: end && end !== start ? end : '',
    place, venue: ev.location_name || '', online: false,
    cost: ev.free ? 'free' : 'varies', type: 'meetup',
  };
}

/** Fold one page of rows into byId: one event per id, at its earliest instance. */
export function merge(byId, rows, h) {
  for (const row of rows) {
    const e = toEvent(row.event, h);
    if (!e) continue;
    const have = byId.get(e.feed_id);
    if (!have || e.start_date < have.start_date) byId.set(e.feed_id, e);
  }
}

export async function localist({ hosts = HOSTS, keywords = KEYWORDS } = {}) {
  // Keyed by id across hosts and keywords: the same event returns for every
  // keyword it matches and once per recurrence.
  const byId = new Map();
  for (const h of hosts) {
    for (const kw of keywords) {
      for (let page = 1; ; page++) {
        if (page > MAX_PAGES) throw new Error(`Localist ${h.host}: more than ${MAX_PAGES} pages for "${kw}", listing cut off`);
        const url = `https://${h.host}/api/2/events?days=${DAYS}&pp=${PER_PAGE}&page=${page}&keyword=${encodeURIComponent(kw)}`;
        const { ok, data } = await getJSON(url);
        // Any host or keyword unreadable throws the whole source. Returning the
        // hosts that did load would make the runner treat `localist` as read in
        // full and take down the failed host's events as "gone from the listing".
        if (!ok || !Array.isArray(data?.events)) throw new Error(`Localist ${h.host} unreadable ("${kw}", page ${page})`);
        merge(byId, data.events, h);
        if (!data.page?.next_page) break;
      }
    }
  }
  return [...byId.values()];
}
