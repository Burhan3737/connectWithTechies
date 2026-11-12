/**
 * Reading a known date off an organiser's page: the judgement behind
 * agent/tools/verify-dates.mjs, kept free of network and files so it can be tested.
 *
 *   confirmed   the stored date is still on the page
 *   moved       the page's JSON-LD publishes a different date for an event
 *   ambiguous   the page loads but says nothing we can read
 *   unreadable  captcha, 403, empty
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Every way a site might print a date we already know.
 *
 * The point is recall, not precision: we already know the date, so a generous
 * set of renderings costs nothing and a missed rendering costs a false alarm.
 * Zero-padded days with a month name ("Jun 03 2027") were missing, so the
 * Techstars timeline never confirmed and fell through to a wrong JSON-LD move
 * (2026-11-12). The decoy test in judgePage covers the extra forms too.
 */
export function renderings(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const M = MONTHS[m - 1], Mon = M.slice(0, 3);
  const dd = String(d).padStart(2, '0'), mm = String(m).padStart(2, '0');
  const out = [
    iso,
    `${M} ${d}, ${y}`, `${M} ${d} ${y}`, `${M} ${d}`,
    `${Mon} ${d}, ${y}`, `${Mon} ${d} ${y}`, `${Mon}. ${d}, ${y}`, `${Mon} ${d}`,
    `${M} ${dd}, ${y}`, `${M} ${dd} ${y}`, `${Mon} ${dd}, ${y}`, `${Mon} ${dd} ${y}`,
    `${d} ${M} ${y}`, `${d} ${Mon} ${y}`, `${dd} ${M} ${y}`, `${dd} ${Mon} ${y}`,
    `${m}/${d}/${y}`, `${mm}/${dd}/${y}`, `${mm}/${dd}`,
    `${y}/${mm}/${dd}`, `${dd}.${mm}.${y}`,
  ];
  return [...new Set(out.map((s) => s.toLowerCase()))];
}

/** Readable text only, lower-cased: scripts, styles and tags become spaces. */
export const stripHtml = (h) => h
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#8211;|&ndash;|&mdash;|&#8212;/g, '-')
  .replace(/\s+/g, ' ')
  .toLowerCase();

/** schema.org types that are events: Event, its subtypes (BusinessEvent, …), Hackathon, Festival. */
const isEventType = (t) => [].concat(t || []).some((x) => /(^|\/)(\w*Event|Hackathon|Festival)$/.test(String(x)));

/**
 * Upcoming events the page's JSON-LD describes, soonest first.
 *
 * Only objects typed as events count. Matching any "startDate" in the raw HTML
 * took the Techstars accelerator's EducationalOccupationalProgram start
 * (2027-03-08) as its Demo Day (2027-06-03) — a programme, a course or an
 * offer has a startDate too, and none of them is the event.
 */
export function jsonLdEvents(body, today) {
  const found = [];
  const walk = (o) => {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!o || typeof o !== 'object') return;
    const start = String(o.startDate || '').slice(0, 10);
    if (isEventType(o['@type']) && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
      const end = String(o.endDate || '').slice(0, 10);
      found.push({ start, end: /^\d{4}-\d{2}-\d{2}$/.test(end) ? end : start, name: String(o.name || '') });
    }
    Object.values(o).forEach(walk);
  };
  for (const m of body.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { walk(JSON.parse(m[1])); } catch { /* a page's broken JSON-LD is not ours to fix */ }
  }
  return found.filter((x) => x.start >= today).sort((a, b) => a.start.localeCompare(b.start));
}

/** The verdict for one event against one fetched page body. */
export function judgePage(e, body, today) {
  if (!body || body.length < 500) return { verdict: 'unreadable', note: body ? `${body.length}-byte stub, likely a captcha` : 'no response' };

  /**
   * Match against readable text only, never the raw HTML.
   *
   * Matching the source let hits land inside another event's JSON-LD, an .ics
   * href query string, and The Events Calendar's own `selected_end_datetime`
   * view window — which made an ISO match close to self-fulfilling on any
   * WordPress events page.
   */
  const text = stripHtml(body);
  const hit = renderings(e.next_date).find((r) => text.includes(r));

  if (hit) {
    /**
     * The decoy test: does this page also "confirm" dates the event does not
     * have? If it does, it is a page the matcher cannot read — a listing of
     * many events, a calendar grid, a run of unrelated dates — and a hit on the
     * real date there is a coincidence, not evidence.
     *
     * An audit measured this: on listing pages, 32% of confirmations also
     * matched a fabricated date. Those were being recorded as settled, so
     * nothing would ever look at them again. An unchecked event is recoverable;
     * a falsely-confirmed one is not.
     */
    const decoys = [7, -21, 35, 14].map((d) => {
      const dt = new Date(`${e.next_date}T00:00:00Z`);
      dt.setUTCDate(dt.getUTCDate() + d);   // pure date arithmetic, pinned to UTC
      return dt.toISOString().slice(0, 10);
    });
    const fooled = decoys.filter((d) => renderings(d).some((r) => text.includes(r)));
    if (fooled.length) {
      return {
        verdict: 'ambiguous',
        note: `"${hit}" appears, but so do ${fooled.length} date(s) this event does not have ` +
              `(e.g. ${fooled[0]}) — the page lists too many dates for a match to mean anything`,
      };
    }
    return { verdict: 'confirmed', note: `page shows "${hit}" and no decoy date` };
  }

  // Not found. Only an event's JSON-LD is trusted to say where it went.
  const ld = jsonLdEvents(body, today);
  if (ld.length && ld[0].start !== e.next_date) {
    return { verdict: 'moved', note: `page JSON-LD gives ${ld[0].start}${ld[0].end !== ld[0].start ? '..' + ld[0].end : ''}`, proposed: ld[0] };
  }
  return { verdict: 'ambiguous', note: 'page loads but the stored date is not on it and it publishes no structured event date' };
}
