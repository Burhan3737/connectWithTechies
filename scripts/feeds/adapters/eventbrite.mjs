/**
 * Eventbrite: city discovery, and the organisers behind it.
 *
 * Eventbrite retired its public search API, but its listing pages embed their
 * results as server data (window.__SERVER_DATA__) — richer than the schema.org
 * markup on the same page: organiser id, venue, time zone, and Eventbrite's own
 * sub-category tags. "High Tech" is the tag that separates a dev meetup from a
 * proteomics symposium, which share the Science & Tech category.
 *
 * Organiser pages (/o/<id>) embed their upcoming events the same way (Next.js
 * page data), so an organiser that keeps running tech events is followed like a
 * Luma calendar or a Meetup group. Eventbrite throttles hard (see HOST_GAP_MS in
 * lib/http.mjs), so only organisers with a "High Tech" event are even looked at,
 * and only those with more than one upcoming event are followed — a one-off
 * organiser is found again by discovery if they ever run another.
 */
import { get, pageData, jsonLd, findAll, assignedJson } from '../lib/http.mjs';
import { fromParts } from '../lib/geo.mjs';

const PAGES = Number(process.env.EVENTBRITE_PAGES || 4);
// Free-text searches beyond the category: hackathons and founder networking are
// often filed under Business or Other.
const KEYWORDS = ['hackathon', 'startup', 'tech-networking'];

const ORG_PAGE = (id) => `https://www.eventbrite.com/o/${id}`;

/** One Eventbrite event object (listing or organiser page) -> feed event. */
export function toEvent(e) {
  if (e.is_online_event || e.is_cancelled) return null;
  const a = e.primary_venue?.address || {};
  const country = a.country === 'US' ? 'United States' : a.country === 'CA' ? 'Canada' : a.country;
  const place = fromParts({ city: a.city, region: a.region, country });
  if (!place || !e.start_date) return null;
  const tags = (e.tags || []).map((t) => t.display_name).filter(Boolean);
  const event = {
    feed: 'eventbrite',
    feed_id: `eventbrite:${e.eventbrite_event_id || e.id}`,
    title: e.name,
    description: String(e.summary || '').replace(/\s+/g, ' ').slice(0, 600),
    organiser: { id: e.primary_organizer_id ? `eventbrite:${e.primary_organizer_id}` : '', name: '', description: '', website: '' },
    url: String(e.url || '').split('?')[0],
    // start_date is already the local calendar date in the event's own zone.
    start_date: e.start_date,
    end_date: e.end_date && e.end_date !== e.start_date ? e.end_date : '',
    place,
    venue: e.primary_venue?.name || '',
    online: false,
    cost: e.ticket_availability?.is_free ? 'free' : (e.ticket_availability ? 'paid' : 'varies'),
    topics: [],
  };
  if (tags.includes('High Tech')) event.platformTech = 'eventbrite';
  return event;
}

/** Fallback for a listing page without server data: its schema.org events. */
function fromJsonLd(body) {
  const out = [];
  for (const e of findAll(jsonLd(body), (o) => o.startDate && o.name && o.location && o.url)) {
    if (/OnlineEventAttendanceMode/.test(e.eventAttendanceMode || '')) continue;
    const a = e.location?.address || {};
    const place = fromParts({ city: a.addressLocality, region: a.addressRegion, country: a.addressCountry || 'United States' });
    if (!place) continue;
    out.push({
      feed: 'eventbrite',
      feed_id: `eventbrite:${(String(e.url).match(/(\d{9,})/) || [])[1] || e.url}`,
      title: e.name, description: String(e.description || '').replace(/\s+/g, ' ').slice(0, 600),
      organiser: { id: '', name: e.organizer?.name || '', description: '', website: '' },
      url: String(e.url).split('?')[0], start_date: String(e.startDate).slice(0, 10),
      end_date: e.endDate ? String(e.endDate).slice(0, 10) : '', place,
      venue: e.location?.name || '', online: false, cost: 'varies',
    });
  }
  return out;
}

async function readListing(url) {
  const res = await get(url);
  if (res.status !== 200) return { status: res.status, events: null, more: false };
  const data = assignedJson(res.body, 'window.__SERVER_DATA__');
  const block = data?.search_data?.events;
  if (!block) return { status: 200, events: fromJsonLd(res.body), more: false };
  const p = block.pagination || {};
  return { status: 200, events: (block.results || []).map(toEvent).filter(Boolean),
    more: Number(p.page_number) < Number(p.page_count) };
}

export async function discover(city) {
  if (!city.eventbrite) return { events: [], organisers: [] };
  const events = [];
  const base = `https://www.eventbrite.com/d/${city.eventbrite}`;
  const urls = [];
  for (let page = 1; page <= PAGES; page++) urls.push([`${base}/science-and-tech--events/?page=${page}`, page]);
  for (const k of KEYWORDS) urls.push([`${base}/${k}/`, 1]);

  let failures = 0, stopCategory = false;
  for (const [url, page] of urls) {
    const isCategory = url.includes('science-and-tech');
    if (isCategory && stopCategory) continue;
    const r = await readListing(url);
    if (!r.events) {
      failures++;
      // A failed first category page is a failure to report, not an empty city.
      if (isCategory && page === 1) throw new Error(`HTTP ${r.status}`);
      if (isCategory) stopCategory = true;
      continue;
    }
    events.push(...r.events);
    if (isCategory && !r.more) stopCategory = true;
  }

  // Organisers worth a look: those behind at least one "High Tech" event.
  const organisers = new Map();
  for (const e of events) {
    if (!e.platformTech || !e.organiser.id || organisers.has(e.organiser.id)) continue;
    organisers.set(e.organiser.id, {
      id: e.organiser.id, kind: 'eventbrite-organizer', platform: 'eventbrite',
      url: ORG_PAGE(e.organiser.id.replace(/^eventbrite:/, '')), page: ORG_PAGE(e.organiser.id.replace(/^eventbrite:/, '')),
      name: '', description: '', website: '',
      home: { city: e.place.city, region: e.place.region, country: e.place.country },
      needsProfile: true,
    });
  }
  return { events, organisers: [...organisers.values()] };
}

/** An organiser page: who they are, and their upcoming events. */
async function readOrganizerPage(id) {
  const res = await get(ORG_PAGE(id));
  const pp = res.status === 200 ? pageData(res.body)?.props?.pageProps : null;
  if (!pp || !pp.organizer) return null;
  const o = pp.organizer;
  const desc = [o.summary, o.description?.text, typeof o.description === 'string' ? o.description : '', o.long_description?.text]
    .filter(Boolean).join(' ');
  return {
    name: o.name || '', description: String(desc).replace(/<[^>]+>/g, ' ').slice(0, 600),
    website: o.website || o.website_url || '',
    upcoming: pp.upcomingEvents || [],
    total: Number(pp.upcomingEventsTotal ?? (pp.upcomingEvents || []).length),
    partial: Boolean(pp.hasMoreUpcoming),
  };
}

/**
 * Registration check for a candidate organiser: its profile, and whether it is
 * worth following at all. Returns { name, description, website, titles, total }.
 */
export async function profile(candidate) {
  const p = await readOrganizerPage(candidate.id.replace(/^eventbrite:/, ''));
  if (!p) return null;
  return { name: p.name, description: p.description, website: p.website,
    titles: p.upcoming.map((e) => e.name), total: p.total };
}

/** Maintenance: a registered organiser's upcoming in-person events. */
export async function readOrganizer(source) {
  const p = await readOrganizerPage(source.id.replace(/^eventbrite:/, ''));
  if (!p) return { events: [], ok: false, status: 0 };
  const events = p.upcoming.map(toEvent).filter(Boolean).map((e) => ({ ...e,
    organiser: { id: source.id, name: source.name, description: source.description, website: source.website } }));
  // Only the first page of upcoming events is embedded. When there are more,
  // absence from this read proves nothing, so the runner must not take any down.
  return { events, ok: true, status: 200, partial: p.partial, name: p.name };
}
