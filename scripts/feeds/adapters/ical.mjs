/**
 * Maintenance: re-read a registered organiser through its public calendar feed.
 *
 * This is the "tag once, maintain forever" half of the feed. Luma calendars and
 * Meetup groups both publish iCal subscriptions — the same feeds people add to
 * Google Calendar — which are stable, keyless and meant for machines. Once an
 * organiser is in the registry, this is all it costs to keep its events current.
 */
import { get } from '../lib/http.mjs';
import { parseIcal } from '../lib/ical.mjs';
import { fromText, localDate } from '../lib/geo.mjs';

export async function read(source) {
  const res = await get(source.url);
  if (res.status !== 200 || !res.body.includes('BEGIN:VCALENDAR')) {
    return { events: [], ok: false, status: res.status };
  }
  const out = [];
  for (const v of parseIcal(res.body)) {
    if (v.status === 'CANCELLED') continue;
    // Meetup feeds carry no location, so the group's home city stands in — a
    // Meetup group meets in its city. Nowhere else is a home city assumed: an
    // organiser that tours would have every event filed under where it is based.
    const place = fromText(v.location) ||
      (!v.location && source.platform === 'meetup' && source.home ? { ...source.home, tz: '' } : null);
    const tz = v.start?.tz || place?.tz || v.calendarTz || '';
    const start = v.start?.dateOnly || localDate(v.start?.instant, tz);
    const end = v.end ? (v.end.dateOnly || localDate(v.end.instant, tz)) : '';
    const link = v.url || ((v.description || '').match(/https?:\/\/(?:luma\.com|lu\.ma)\/[^\s)>"]+/) || [])[0] || source.page || '';
    const online = /^(online|virtual|zoom)/i.test(v.location || '') ||
      (!v.location && source.platform === 'luma');
    out.push({
      feed: source.platform,
      feed_id: `${source.platform}:${v.uid || link}`,
      title: v.title || '',
      description: (v.description || '').replace(/\s+/g, ' ').slice(0, 600),
      organiser: { id: source.id, name: source.name, description: source.description, website: source.website },
      url: link,
      start_date: start,
      end_date: end && end !== start ? end : '',
      place,
      venue: (v.location || '').split(',')[0] || '',
      online,
      cost: 'varies',
    });
  }
  return { events: out, ok: true, status: 200 };
}
