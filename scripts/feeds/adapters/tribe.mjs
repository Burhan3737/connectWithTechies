/**
 * The Events Calendar — the WordPress plugin behind bsides.org and many
 * community sites — exposes a keyless REST API at /wp-json/tribe/events/v1/.
 * One adapter therefore follows any site that runs it. Unlike the plugin's
 * iCal export, the REST data gives structured venues (city, state, country).
 *
 * Check a site's robots.txt before registering it: GeekWire disallows
 * /wp-json/, so GeekWire is followed through its iCal export instead.
 */
import { getJSON } from '../lib/http.mjs';
import { fromParts } from '../lib/geo.mjs';
import { today } from '../../lib/today.mjs';

const PAGES = 6;

const decode = (s) => String(s || '')
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** Maintenance: every upcoming event a Tribe site lists. source.url is the REST base. */
export async function read(source) {
  const events = [];
  let url = `${source.url.replace(/\/+$/, '')}/events?per_page=50&start_date=${today()}`;
  let partial = false;
  for (let page = 0; url; page++) {
    if (page === PAGES) { partial = true; break; }
    const { ok, status, data } = await getJSON(url);
    if (!ok || !data) {
      if (page === 0) return { events: [], ok: false, status };
      partial = true;
      break;
    }
    for (const e of data.events || []) {
      const title = decode(e.title);
      // Organisers announce changes in the title: "BSides COS 2026 POSTPONED TO 2027".
      if (/postponed|cancel/i.test(title)) continue;
      const v = e.venue || {};
      const place = fromParts({ city: v.city, region: v.state || v.province, country: v.country });
      events.push({
        feed: source.platform,
        feed_id: `${source.platform}:${source.id}:${e.id}`,
        title,
        description: decode(e.excerpt || e.description).slice(0, 600),
        organiser: { id: source.id, name: source.name, description: source.description, website: source.website },
        // The organiser's own site when the listing gives one, else the listing.
        url: e.website || e.url,
        start_date: String(e.start_date || '').slice(0, 10),
        end_date: String(e.end_date || '').slice(0, 10) !== String(e.start_date || '').slice(0, 10)
          ? String(e.end_date || '').slice(0, 10) : '',
        place,
        venue: decode(v.venue),
        online: false,
        cost: /free/i.test(e.cost || '') ? 'free' : (e.cost ? 'paid' : 'varies'),
      });
    }
    url = data.next_rest_url || '';
  }
  return { events, ok: true, status: 200, partial };
}
