/**
 * Meetup discovery: a city's upcoming in-person tech events, and the groups
 * behind them. Meetup's API now sits behind OAuth and a paid Pro plan, but its
 * search page embeds its results as structured data, and every group publishes
 * an iCal feed at /<group>/events/ical/ that needs no key. So search finds the
 * groups, and each group's own events page maintains them — it embeds the same
 * structured data, with venue and in-person/online type. (The iCal feed has
 * neither: no location, no way to tell an online event from one in the room.)
 */
import { get, pageData } from '../lib/http.mjs';
import { fromParts } from '../lib/geo.mjs';

// Technology is Meetup's category 546; a keyword search broadens it to the
// founder and startup crowd, who often file under Career & Business instead.
const QUERIES = ['categoryId=546', 'keywords=startup', 'keywords=developers'];

/** Meetup's Apollo cache -> [feed event, group] for every in-person event with a place. */
export function readApollo(body) {
  const apollo = pageData(body)?.props?.pageProps?.__APOLLO_STATE__;
  if (!apollo) return null;
  const deref = (x) => (x && x.__ref ? apollo[x.__ref] : x);
  const out = [];
  for (const node of Object.values(apollo)) {
    if (!node || node.__typename !== 'Event' || !node.dateTime || !node.eventUrl) continue;
    if (node.eventType && node.eventType !== 'PHYSICAL') continue;
    const venue = deref(node.venue) || {};
    const group = deref(node.group) || {};
    const place = fromParts({ city: venue.city, region: venue.state, country: venue.country === 'us' ? 'United States' : venue.country === 'ca' ? 'Canada' : venue.country });
    if (!place) continue;
    // dateTime carries the local offset ("2026-10-10T09:00:00-07:00"), so its
    // date part is already the local calendar date.
    out.push([{
      feed: 'meetup',
      feed_id: `meetup:${node.id}`,
      title: node.title,
      description: String(node.description || '').replace(/\s+/g, ' ').slice(0, 600),
      organiser: { id: group.urlname, name: group.name, description: '', website: '' },
      url: node.eventUrl,
      start_date: String(node.dateTime).slice(0, 10),
      end_date: '',
      place,
      venue: venue.name || '',
      online: false,
      cost: node.feeSettings ? 'paid' : 'free',
    }, group]);
  }
  return out;
}

export async function discover(city) {
  if (!city.meetup) return { events: [], organisers: [] };
  const events = [];
  const organisers = new Map();
  let failures = 0;
  for (const q of QUERIES) {
    const url = `https://www.meetup.com/find/?location=${encodeURIComponent(city.meetup)}&source=EVENTS&${q}`;
    const res = await get(url);
    const found = res.status === 200 ? readApollo(res.body) : null;
    if (!found) { failures++; continue; }
    for (const [event, group] of found) {
      const place = event.place;
      if (q === 'categoryId=546') event.platformTech = 'meetup';
      events.push(event);
      if (group.urlname && !organisers.has(group.urlname)) {
        organisers.set(group.urlname, {
          id: `meetup:${group.urlname}`,
          kind: 'meetup-group',
          platform: 'meetup',
          url: `https://www.meetup.com/${group.urlname}/events/ical/`,
          name: group.name || group.urlname,
          description: '',
          website: '',
          home: { city: place.city, region: place.region, country: place.country },
          page: `https://www.meetup.com/${group.urlname}/`,
        });
      }
    }
  }
  if (failures === QUERIES.length) throw new Error('every search page failed');
  return { events, organisers: [...organisers.values()] };
}

/** Maintenance: a registered group's upcoming in-person events. */
export async function readGroup(source) {
  const res = await get(`${source.page}events/?type=upcoming`);
  const found = res.status === 200 ? readApollo(res.body) : null;
  if (!found) return { events: [], ok: false, status: res.status };
  // The page also suggests other groups' events; only this group's are its own.
  const own = source.id.replace(/^meetup:/, '');
  const events = found.filter(([, g]) => g.urlname === own).map(([e]) => ({ ...e,
    organiser: { id: source.id, name: source.name, description: source.description, website: source.website } }));
  return { events, ok: true, status: 200 };
}
