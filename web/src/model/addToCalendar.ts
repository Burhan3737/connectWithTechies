import { addDays, isISODate } from './dates';
import { slugify } from './text';
import type { TechEvent } from './types';

/**
 * Calendar entries for an event. Event dates are whole days (organisers rarely
 * publish times in a form we keep), so every entry is all-day with the end
 * date exclusive, as every calendar format expects.
 */
export interface CalDates { start: string; endEx: string }

/** Only a confirmed date that has not fully passed can go in a calendar. */
export function calDates(e: Pick<TechEvent, 'next_date' | 'next_date_end'>, today: string): CalDates | null {
  if (!isISODate(e.next_date)) return null;
  const end = e.next_date_end && e.next_date_end > e.next_date ? e.next_date_end : e.next_date;
  if (end < today) return null;
  return { start: e.next_date, endEx: addDays(end, 1) };
}

const describe = (e: TechEvent) =>
  `${e.description ? `${e.description}\n\n` : ''}Official page: ${e.url}\n` +
  'Found on connectWithTechies — confirm details with the organiser before you go.';
const place = (e: TechEvent) => [e.venue, e.city, e.region, e.country].filter(Boolean).join(', ');
const compact = (iso: string) => iso.replace(/-/g, '');
const query = (o: Record<string, string>) =>
  Object.entries(o).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

/** RFC 5545 text escaping: backslash, semicolon, comma, newline. */
export const icsEscape = (s: string) =>
  String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** An .ics file: what Apple Calendar, Thunderbird and most desktop calendars import. */
export function icsFile(e: TechEvent, d: CalDates, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//connectWithTechies//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${compact(d.start)}-${slugify(e.name, 40)}@connectwithtechies`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(d.start)}`,
    `DTEND;VALUE=DATE:${compact(d.endEx)}`,
    `SUMMARY:${icsEscape(e.name)}`,
    `DESCRIPTION:${icsEscape(describe(e))}`,
    `LOCATION:${icsEscape(place(e))}`,
    `URL:${e.url}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

export interface CalLink { label: string; href: string; download?: string }

export function calLinks(e: TechEvent, d: CalDates): CalLink[] {
  const outlook = {
    path: '/calendar/action/compose', rru: 'addevent', allday: 'true',
    startdt: d.start, enddt: d.endEx, subject: e.name, body: describe(e), location: place(e),
  };
  return [
    { label: 'Google Calendar', href: `https://calendar.google.com/calendar/render?${query({
      action: 'TEMPLATE', text: e.name, dates: `${compact(d.start)}/${compact(d.endEx)}`, details: describe(e), location: place(e) })}` },
    { label: 'Outlook.com', href: `https://outlook.live.com/calendar/0/deeplink/compose?${query(outlook)}` },
    { label: 'Outlook / Microsoft 365', href: `https://outlook.office.com/calendar/0/deeplink/compose?${query(outlook)}` },
    { label: 'Yahoo Calendar', href: `https://calendar.yahoo.com/?${query({
      v: '60', title: e.name, st: compact(d.start), et: compact(d.endEx), dur: 'allday', desc: describe(e), in_loc: place(e) })}` },
    { label: 'Apple Calendar / other (.ics)',
      href: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsFile(e, d))}`,
      download: `${slugify(e.name) || 'event'}.ics` },
  ];
}
