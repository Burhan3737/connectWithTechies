/**
 * Eventbrite discovery: a city's Science & Tech listings.
 *
 * Eventbrite retired its public search API, and organisers there publish no
 * calendar feed, so these events are found afresh on every discovery run
 * rather than maintained through a registry entry. The listing page embeds its
 * results as schema.org Event data, which is what is read here.
 */
import { get, jsonLd, findAll } from '../lib/http.mjs';
import { fromParts } from '../lib/geo.mjs';

const PAGES = Number(process.env.EVENTBRITE_PAGES || 2);

export async function discover(city) {
  if (!city.eventbrite) return { events: [], organisers: [] };
  const events = [];
  for (let page = 1; page <= PAGES; page++) {
    const url = `https://www.eventbrite.com/d/${city.eventbrite}/science-and-tech--events/?page=${page}`;
    const res = await get(url);
    if (res.status !== 200) {
      // A failed first page is a failure to report, not an empty city.
      if (page === 1) throw new Error(`HTTP ${res.status}`);
      break;
    }
    const items = findAll(jsonLd(res.body), (o) => o.startDate && o.name && o.location && o.url);
    if (!items.length) break;
    for (const e of items) {
      if (/OnlineEventAttendanceMode/.test(e.eventAttendanceMode || '')) continue;
      const a = e.location?.address || {};
      const place = fromParts({ city: a.addressLocality, region: a.addressRegion, country: a.addressCountry || 'United States' });
      if (!place) continue;
      const offers = [].concat(e.offers || []);
      const free = offers.length && offers.every((o) => Number(o.price || o.lowPrice || 0) === 0);
      events.push({
        feed: 'eventbrite',
        feed_id: `eventbrite:${(String(e.url).match(/(\d{9,})/) || [])[1] || e.url}`,
        title: e.name,
        description: String(e.description || '').replace(/\s+/g, ' ').slice(0, 600),
        organiser: { id: e.organizer?.url || '', name: e.organizer?.name || '', description: '', website: e.organizer?.url || '' },
        url: String(e.url).split('?')[0],
        start_date: String(e.startDate).slice(0, 10),
        end_date: e.endDate ? String(e.endDate).slice(0, 10) : '',
        place,
        venue: e.location?.name || '',
        online: false,
        cost: free ? 'free' : (offers.length ? 'paid' : 'varies'),
      });
    }
  }
  return { events, organisers: [] };
}
