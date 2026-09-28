/**
 * Minimal RFC 5545 reader for calendar feeds (Luma calendars, Meetup groups,
 * Google Calendar and the like). Handles what those feeds actually emit:
 * folded lines, escaped text, DATE and DATE-TIME values, UTC (`Z`) times and
 * TZID-qualified local times.
 *
 * Every event comes back with its start as an absolute instant *and* with the
 * TZID it was written in, if any, so the caller can compute the calendar date
 * in the event's own zone rather than in UTC.
 */

function unfold(text) {
  // A line beginning with a space or tab continues the previous one.
  return String(text).replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

function unescape(v) {
  return v.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

/** Wall-clock time in a zone -> absolute Date. */
function zonedToInstant(y, mo, d, h, mi, s, tz) {
  // Guess the instant as if UTC, then correct by the zone's offset at that moment.
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  const asZone = new Date(new Date(guess).toLocaleString('en-US', { timeZone: tz }));
  const asUtc = new Date(new Date(guess).toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(guess - (asZone - asUtc));
}

function parseDate(value, params) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  const tz = (params.match(/TZID=([^;:]+)/) || [])[1] || '';
  if (!h) return { dateOnly: `${y}-${mo}-${d}`, tz, instant: null };       // all-day
  if (z) return { dateOnly: '', tz: '', instant: new Date(Date.UTC(+y, mo - 1, +d, +h, +mi, +s)) };
  if (tz) return { dateOnly: '', tz, instant: zonedToInstant(+y, +mo, +d, +h, +mi, +s, tz) };
  // Floating local time with no zone: keep its own calendar date.
  return { dateOnly: `${y}-${mo}-${d}`, tz: '', instant: null };
}

export function parseIcal(text) {
  const lines = unfold(text).split('\n');
  const events = [];
  let cur = null;
  let calTz = '';
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null; continue; }
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const head = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const [name, ...rest] = head.split(';');
    const params = rest.join(';');
    if (!cur) {
      if (name === 'X-WR-TIMEZONE') calTz = value.trim();
      continue;
    }
    switch (name) {
      case 'UID': cur.uid = value.trim(); break;
      case 'SUMMARY': cur.title = unescape(value).trim(); break;
      case 'DESCRIPTION': cur.description = unescape(value).trim(); break;
      case 'LOCATION': cur.location = unescape(value).trim(); break;
      case 'URL': cur.url = value.trim(); break;
      case 'GEO': cur.geo = value.trim(); break;
      case 'STATUS': cur.status = value.trim().toUpperCase(); break;
      case 'DTSTART': cur.start = parseDate(value.trim(), params); break;
      case 'DTEND': cur.end = parseDate(value.trim(), params); break;
      default: break;
    }
  }
  for (const e of events) e.calendarTz = calTz;
  return events;
}
