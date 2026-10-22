/**
 * Bevy — the community platform behind Google Developer Groups, Salesforce
 * Trailblazer groups, Atlassian community events, Startup Grind and CNCF. One
 * adapter reads every Bevy site in SITES, the same way on each.
 *
 * Bevy has a JSON API, but every site's robots.txt disallows /api/ and /gql/,
 * so it is not used. What robots.txt allows, and what is read here:
 *
 *   1. /sitemap.xml lists one event sitemap per month of event dates,
 *      sitemap-events-YYYY-MM.xml, back to 2015 and ahead to next year. Only
 *      this month's and later ones are read: an earlier month is all past.
 *   2. Those sitemaps are global (GDG's November had 419 events, 92 of them
 *      from US or Canadian chapters), and a page is ~800 KB, so the country is
 *      settled before any page is fetched. Event URLs name their chapter
 *      (/events/details/google-gdg-seattle-presents-devfest-seattle-2026/), and
 *      the site's /chapters/ page carries every chapter with its country in one
 *      inline array (`var localChapters = [...]`, 2,019 chapters on GDG). A site
 *      without that page (CNCF's community2.cncf.io: /chapters/ is a 404) has
 *      few events, and all of its upcoming ones are read.
 *   3. Each wanted event page has one JSON-LD Event: name, startDate and
 *      endDate with the venue's own offset, eventAttendanceMode, and a Place
 *      with a PostalAddress. Online events are dropped; hybrid (Mixed) ones are
 *      kept, as for Localist: there is a room to go to.
 *
 * Read only with --discover (weekly), like Meetup and Eventbrite: a run is a
 * few hundred page reads at the two seconds apart robots.txt asks for
 * (Crawl-delay: 2). On a daily run Bevy is not read at all, so its events are
 * carried forward untouched (lib/history.mjs).
 */
import { get, jsonLd, findAll } from '../lib/http.mjs';
import { fromParts, fromText } from '../lib/geo.mjs';
import { today as todayIso } from '../../lib/today.mjs';

/**
 * Every Bevy site read, in one place. `chapters: false` is a site without a
 * /chapters/ page. `tech` is sourceIsTech, decided per site:
 *  - GDG, Trailblazer, Atlassian and CNCF are developer or practitioner groups
 *    for one technology, so every event is tech by construction (a GDG social
 *    at a brewery is still a room of developers).
 *  - Startup Grind is a founders' community, and founders are not all tech:
 *    its fireside chats and holiday mixers go through the relevance gate, which
 *    keeps "AI Founders Night" and "Founder Signal" and drops a bare "Mixer".
 * Also on Bevy per the source research, not probed and so not included yet
 * (one line each once their /chapters/ page is confirmed): Tableau, Snowflake,
 * UiPath and Figma user groups (Figma is design: tech: false).
 */
export const SITES = [
  { host: 'gdg.community.dev', name: 'Google Developer Groups', chapters: true, tech: true },
  { host: 'trailblazercommunitygroups.com', name: 'Salesforce Trailblazer Community', chapters: true, tech: true },
  { host: 'ace.atlassian.com', name: 'Atlassian Community Events', chapters: true, tech: true },
  { host: 'www.startupgrind.com', name: 'Startup Grind', chapters: true, tech: false },
  // community.cncf.io redirects here; read it directly rather than through the redirect.
  { host: 'community2.cncf.io', name: 'CNCF Community Groups', chapters: false, tech: true },
];
// Event pages a run may read, across all sites: 671 wanted on oct22 (GDG 339,
// Trailblazer 178, Atlassian 72, Startup Grind 64, CNCF 18). A listing that
// outgrows the cap throws before any page is read, rather than reading a cut-off
// part and passing it off as the whole (which would take down the rest).
const MAX_PAGES = 1000;
const GAP_MS = 2000;   // robots.txt on every Bevy site: Crawl-delay: 2

const US_CA = (c) => {
  const s = String((c && typeof c === 'object' ? c.name : c) || '').trim();
  return /^(us|usa|u\.s\.a?\.?|united states( of america)?)$/i.test(s) ? 'United States'
    : /^(ca|can|canada)$/i.test(s) ? 'Canada' : '';
};
const decode = (s) => String(s || '')
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** The month sitemaps (and any ?p= pages of them) for this month onwards. */
export function eventSitemaps(indexXml, day) {
  const month = day.slice(0, 7);
  return [...String(indexXml).matchAll(/<loc>([^<]*\/sitemap-events-(\d{4}-\d{2})\.xml(?:\?p=\d+)?)<\/loc>/g)]
    .filter((m) => m[2] >= month).map((m) => m[1].replace(/&amp;/g, '&'));
}

/** Event page URLs listed in one month sitemap. */
export const sitemapEvents = (xml) =>
  [...String(xml).matchAll(/<loc>([^<]*\/events\/details\/[^<]+)<\/loc>/g)].map((m) => m[1]);

/** The /chapters/ page -> Map of chapter slug -> country, or null if the array is missing. */
export function readChapters(html) {
  const m = String(html).match(/var localChapters = (\[[\s\S]*?\]);\s*\n/);
  if (!m) return null;
  try {
    return new Map(JSON.parse(m[1]).map((c) => [String(c.url).replace(/\/+$/, '').split('/').pop(), c.country]));
  } catch { return null; }
}

/**
 * The chapter an event URL names, or ''. The part before "-presents-" is a
 * site prefix ("google-", "salesforce-", "startup-grind-") and the chapter
 * slug; the slug is its longest tail that is a known chapter, so
 * "salesforce-admin-group-boston-united-states" is not taken for "boston-ma"'s
 * sibling "boston".
 */
export function chapterOf(url, chapters) {
  const slug = String(url).split('/events/details/')[1]?.replace(/\/+$/, '') || '';
  const at = slug.indexOf('-presents-');
  if (at < 0) return '';
  const parts = slug.slice(0, at).split('-');
  for (let i = 0; i < parts.length; i++) {
    const k = parts.slice(i).join('-');
    if (chapters.has(k)) return k;
  }
  return '';
}

/**
 * Past by its URL alone: slugs often carry the date ("...-virtual-2026-11-05",
 * a monthly meetup's "-2026-11-10-3"). Past only if every date in it is, so a
 * range ending ahead still counts. A slug with no date is never judged here.
 */
export function pastByUrl(url, day) {
  const dates = [...String(url).matchAll(/(?:^|[^\d])(20\d{2})-(\d{2})-(\d{2})(?!\d)/g)].map((m) => `${m[1]}-${m[2]}-${m[3]}`);
  return dates.length > 0 && dates.every((d) => d < day);
}

/**
 * True when bad outnumbers what a healthy read shows. On the probe 2 of 102
 * Trailblazer URLs named a chapter missing from /chapters/ (retired groups) and
 * none on GDG or Startup Grind; a much larger share means the URL or page
 * format changed, and reading on would pass a broken read for an empty one.
 */
export const tooMany = (bad, total, share = 0.2) => bad > Math.max(3, total * share);

/**
 * From a site's month sitemaps to the pages worth reading: in the US or Canada
 * by chapter (when the site has a chapter map), and not past by URL. Returns
 * { wanted: [{ url, country }], unmatched, considered }.
 */
export function plan(urls, chapters, day) {
  const wanted = [];
  let unmatched = 0, considered = 0;
  for (const url of new Set(urls)) {
    if (pastByUrl(url, day)) continue;
    considered++;
    if (!chapters) { wanted.push({ url, country: '' }); continue; }
    const ch = chapterOf(url, chapters);
    if (!ch) { unmatched++; continue; }
    const country = US_CA(chapters.get(ch));
    if (country) wanted.push({ url, country });
  }
  return { wanted, unmatched, considered };
}

/**
 * What a page is cached as: its JSON-LD and the chapter's title, ~2 KB of ~800.
 * Never empty: a page with neither still reads as a page (counted as "no
 * Event" by the caller), not as an empty, failed response.
 */
export function trimPage(html) {
  const ld = String(html).match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || [];
  const ch = String(html).match(/"chapter_title":\s*"(?:[^"\\]|\\.)*"/);
  return ['<!-- trimmed by adapters/bevy.mjs -->', ...ld, ch ? ch[0] : ''].join('\n');
}

// Minutes east of UTC: the offset written on an ISO time, and a zone's on that day.
const offsetOf = (iso) => {
  const m = String(iso).match(/([+-])(\d{2}):?(\d{2})$/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : null;
};
function zoneOffset(tz, iso) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
    .formatToParts(new Date(iso)).find((p) => p.type === 'timeZoneName')?.value || '';
  const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}
// Newfoundland summer (-2:30) to Hawaii (-10:00).
const NA_CLOCK = (off) => off <= -150 && off >= -600;

/**
 * Where a JSON-LD Event is: a place, null (unplaced, left to the place
 * overrides), or false (not in the US or Canada at all: drop).
 *
 * Bevy's addressCountry cannot be trusted when it says US: it is "US" for
 * KCDs in Edinburgh, Bandung, CERN and Aix-en-Provence and for a Startup Grind
 * venue on Granville St, Vancouver (probe, oct22), so it reads as the
 * platform's default. Only a value that is not US is taken as typed ("MX" is
 * dropped, "CA" is Canada). Beyond that:
 *  - the chapter's country is the hint, and a place resolving to the other
 *    country is refused: "BC" from a US chapter is not British Columbia;
 *  - a full address typed into streetAddress wins over the region field, which
 *    is a picker: "Broadway 5th floor, Cambridge, MA 02142" came with region FL;
 *  - the event's own clock settles the rest. A start offset outside North
 *    America is not ours (Edinburgh's +01:00); one more than an hour off the
 *    place's zone means the address is wrong, so it is left unplaced. An hour
 *    is allowed for states split across zones (NW Indiana, west Kentucky).
 */
export function placeOf(ld, chapterCountry = '') {
  const at = [].concat(ld.location || []).find((l) => l && (l['@type'] === 'Place' || l.address));
  const off = offsetOf(ld.startDate);
  if (off != null && !NA_CLOCK(off)) return false;
  const a = at?.address;
  if (!a) return null;
  if (typeof a !== 'object') return fromText(a);
  const typed = String(a.addressCountry?.name ?? a.addressCountry ?? '').trim();
  if (typed && !US_CA(typed)) return false;
  const hint = (US_CA(typed) === 'Canada' ? 'Canada' : '') || US_CA(chapterCountry);
  let place = fromText(a.streetAddress) ||
    fromParts({ city: a.addressLocality, region: a.addressRegion, country: hint || undefined });
  if (place && hint && place.country !== hint) place = null;
  if (place && off != null && Math.abs(zoneOffset(place.tz, ld.startDate) - off) > 60) place = null;
  return place;
}

/**
 * One event page (whole or trimmed) -> a feed event, or null: online,
 * cancelled or postponed, outside the US and Canada, or no date. `country` is
 * the chapter's (from /chapters/), a hint for placeOf.
 */
export function toEvent(html, { url, country = '' }, site) {
  const ld = findAll(jsonLd(html), (n) => n['@type'] === 'Event')[0];
  if (!ld) return undefined;   // not an event page: counted by the caller
  if (/Online/i.test(ld.eventAttendanceMode || '')) return null;
  if (/Cancelled|Postponed/i.test(ld.eventStatus || '')) return null;
  const at = [].concat(ld.location || []).find((l) => l && (l['@type'] === 'Place' || l.address));
  // No physical place and no attendance mode: a VirtualLocation alone is online.
  if (!at) return null;
  const place = placeOf(ld, country);
  if (place === false) return null;
  const start = String(ld.startDate || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
  // The offset in "2026-11-07T09:00:00-08:00" is the venue's, so the date is read
  // off the string rather than converted.
  const end = String(ld.endDate || '').slice(0, 10);
  const offer = [].concat(ld.offers || [])[0];
  const chapter = String(html).match(/"chapter_title":\s*("(?:[^"\\]|\\.)*")/)?.[1];
  let organiser = site.name;
  try { if (chapter) organiser = JSON.parse(chapter) || site.name; } catch { /* keep the site's name */ }
  const slug = String(url).split('/events/details/')[1]?.replace(/\/+$/, '') || url;
  return {
    feed: 'bevy', feed_id: `bevy:${site.host}:${slug}`,
    title: decode(ld.name).slice(0, 300), description: decode(ld.description).slice(0, 600),
    organiser: { name: organiser }, url,
    start_date: start, end_date: /^\d{4}-\d{2}-\d{2}$/.test(end) && end !== start ? end : '',
    place, venue: decode(at.name), online: false,
    cost: offer && Number(offer.price) === 0 ? 'free' : 'varies',
    sourceIsTech: site.tech,
  };
}

/**
 * Not yet ended. This month's sitemap still lists last week's events, and one
 * returned would be a candidate the gate turns away as past, which tells the
 * runner's history not to hold it: it would leave the Past view at once rather
 * than after 60 days, as events from sources that stop listing them do.
 */
export const notEnded = (e, day) => (e.end_date || e.start_date) >= day;

async function fetchText(url, what, opts = {}) {
  const res = await get(url, { gapMs: GAP_MS, ...opts });
  if (res.status !== 200 || !res.body) throw new Error(`Bevy ${what} unreadable (${res.status || res.error || 'no body'}): ${url}`);
  return res.body;
}

/** Sitemaps and chapter map for one site -> its wanted pages. Throws if any is unreadable. */
async function planSite(site, day) {
  const index = await fetchText(`https://${site.host}/sitemap.xml`, `${site.host} sitemap`);
  const months = eventSitemaps(index, day);
  // An index with no month sitemaps at all is a changed format, not a quiet month:
  // every site lists months a year ahead, empty or not.
  if (!months.length) throw new Error(`Bevy ${site.host}: no event sitemaps from ${day.slice(0, 7)} on`);
  const urls = [];
  for (const m of months) urls.push(...sitemapEvents(await fetchText(m, `${site.host} event sitemap`)));
  let chapters = null;
  if (site.chapters) {
    chapters = readChapters(await fetchText(`https://${site.host}/chapters/`, `${site.host} chapters`));
    if (!chapters?.size) throw new Error(`Bevy ${site.host}: no chapter list on /chapters/`);
  }
  const p = plan(urls, chapters, day);
  if (chapters && tooMany(p.unmatched, p.considered)) {
    throw new Error(`Bevy ${site.host}: ${p.unmatched} of ${p.considered} event URLs name no known chapter`);
  }
  return { site, ...p };
}

async function readSite({ site, wanted }, stop, day) {
  const out = [];
  let notEvent = 0;
  for (const w of wanted) {
    if (stop.err) return out;   // another site failed: the whole read is void anyway
    const res = await get(w.url, { gapMs: GAP_MS, trim: trimPage });
    // Deleted between the sitemap and the read: it is gone, which is what a
    // takedown is. Anything else unreadable fails the source.
    if (res.status === 404 || res.status === 410) continue;
    if (res.status !== 200 || !res.body) throw new Error(`Bevy ${site.host}: event page unreadable (${res.status || res.error}): ${w.url}`);
    const e = toEvent(res.body, w, site);
    if (e === undefined) { notEvent++; continue; }
    if (e && notEnded(e, day)) out.push(e);
  }
  if (tooMany(notEvent, wanted.length, 0.1)) throw new Error(`Bevy ${site.host}: ${notEvent} of ${wanted.length} event pages carry no JSON-LD Event`);
  return out;
}

/**
 * Every upcoming in-person or hybrid US/Canada event on every site. Any site
 * unreadable throws the whole source: returning the sites that did load would
 * let the runner take down the failed site's events as "gone from the listing".
 * Sites are read side by side (http.mjs keeps it to one request per host).
 */
export async function bevy({ sites = SITES, maxPages = MAX_PAGES, day = todayIso() } = {}) {
  const plans = await Promise.all(sites.map((s) => planSite(s, day)));
  const total = plans.reduce((n, p) => n + p.wanted.length, 0);
  if (total > maxPages) {
    throw new Error(`Bevy: ${total} event pages to read, over the cap of ${maxPages} (${plans.map((p) => `${p.site.host} ${p.wanted.length}`).join(', ')})`);
  }
  const stop = { err: null };
  const lists = await Promise.all(plans.map((p) => readSite(p, stop, day).catch((err) => { stop.err ||= err; return []; })));
  if (stop.err) throw stop.err;
  return lists.flat();
}
