/**
 * Luma discovery: a city's upcoming in-person events, and the organiser
 * calendars behind them.
 *
 * Uses the paginated endpoint Luma's own city pages call. It is undocumented —
 * Luma's official API only lists calendars you manage — so it is read gently
 * (a few pages per city, cached, one request at a time) and treated as a way
 * to *find* organisers. Once an organiser is found, its calendar is re-read
 * through the endpoint Luma's own calendar pages call, which gives each event's
 * city, region and time zone. Luma's iCal subscription does not: it withholds
 * the address until you register, so a calendar that runs events in Dublin,
 * Taipei and San Francisco looks the same in iCal for all three.
 */
import { getJSON } from '../lib/http.mjs';
import { fromParts, localDate } from '../lib/geo.mjs';

const PAGES = Number(process.env.LUMA_PAGES || 3);
const CALENDAR_PAGES = Number(process.env.LUMA_CALENDAR_PAGES || 4);

/** A Luma entry as a feed event; place is null when Luma gives no US/Canada city. */
function toEvent(x, cal) {
  const ev = x.event || {};
  const g = ev.geo_address_info || {};
  const place = fromParts({ city: g.city, region: g.region, country: g.country }) || null;
  const tz = ev.timezone || place?.tz;
  return {
    feed: 'luma',
    feed_id: `luma:${ev.api_id}`,
    title: ev.name,
    description: '',
    organiser: { id: cal.api_id, name: cal.name, description: cal.description_short, website: cal.website },
    url: ev.url ? `https://luma.com/${ev.url}` : '',
    start_date: localDate(ev.start_at, tz),
    end_date: ev.end_at ? localDate(ev.end_at, tz) : '',
    place,
    venue: g.address || '',
    online: ev.location_type === 'online',
    cost: x.ticket_info?.is_free ? 'free' : (x.ticket_info ? 'paid' : 'varies'),
  };
}

export async function discover(city) {
  if (!city.luma_place) return { events: [], organisers: [] };
  const events = [];
  const organisers = new Map();
  let cursor = '';
  for (let page = 0; page < PAGES; page++) {
    const url = 'https://api.lu.ma/discover/get-paginated-events?discover_place_api_id=' +
      encodeURIComponent(city.luma_place) + '&pagination_limit=50' +
      (cursor ? `&pagination_cursor=${encodeURIComponent(cursor)}` : '');
    const { ok, status, data } = await getJSON(url);
    if (!ok || !data) {
      if (page === 0) throw new Error(`HTTP ${status}`);
      break;
    }

    for (const x of data.entries || []) {
      const ev = x.event || {};
      const cal = x.calendar || {};
      if (ev.location_type === 'online') continue;
      const e = toEvent(x, cal);
      events.push(e);
      const place = e.place;

      // Personal calendars are one person's events, not an organiser worth following.
      if (cal.api_id && !cal.is_personal && !organisers.has(cal.api_id)) {
        organisers.set(cal.api_id, {
          id: `luma-cal:${cal.api_id}`,
          kind: 'luma-calendar',
          platform: 'luma',
          url: `https://api.lu.ma/ics/get?entity=calendar&id=${cal.api_id}`,
          name: cal.name || '',
          description: cal.description_short || '',
          website: cal.website || '',
          home: place ? { city: place.city, region: place.region, country: place.country } : null,
          page: cal.slug ? `https://luma.com/${cal.slug}` : '',
        });
      }
    }
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }
  return { events, organisers: [...organisers.values()] };
}

/**
 * Maintenance: a registered Luma calendar's upcoming events, with places.
 * Returns the same shape as the iCal reader, so the runner treats both alike.
 */
export async function readCalendar(source) {
  const id = source.id.replace(/^luma-cal:/, '');
  const cal = { api_id: id, name: source.name, description_short: source.description, website: source.website };
  const events = [];
  let cursor = '';
  // Complete unless a later page failed or the page cap cut the calendar short;
  // the runner only takes events down after a complete read.
  let partial = false;
  for (let page = 0; page < CALENDAR_PAGES; page++) {
    const url = 'https://api.lu.ma/calendar/get-items?calendar_api_id=' + encodeURIComponent(id) +
      '&pagination_limit=50&period=future' + (cursor ? `&pagination_cursor=${encodeURIComponent(cursor)}` : '');
    const { ok, status, data } = await getJSON(url);
    if (!ok || !data) {
      // The first page failing means the calendar was not read at all.
      if (page === 0) return { events: [], ok: false, status };
      partial = true;
      break;
    }
    for (const x of data.entries || []) events.push(toEvent(x, cal));
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
    if (page === CALENDAR_PAGES - 1) partial = true;
  }
  return { events, ok: true, status: 200, partial };
}
