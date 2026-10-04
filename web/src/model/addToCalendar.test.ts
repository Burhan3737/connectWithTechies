import { calDates, calLinks, icsEscape, icsFile } from './addToCalendar';
import { EVENTS, TODAY } from '../test/fixtures';

const byName = (n: string) => EVENTS.find((e) => e.name === n)!;

describe('calDates', () => {
  it('is all-day with the end exclusive', () => {
    expect(calDates(byName('Hack the North'), TODAY)).toEqual({ start: '2026-10-09', endEx: '2026-10-12' });
    expect(calDates(byName('Montréal AI Night'), TODAY)).toEqual({ start: '2026-10-15', endEx: '2026-10-16' });
  });
  it('allows an event still in progress, refuses one fully past or undated', () => {
    expect(calDates(byName('BigRed//Hacks'), TODAY)).not.toBeNull();
    expect(calDates({ next_date: '2026-09-01' }, TODAY)).toBeNull();
    expect(calDates(byName('DevOpsDays Austin'), TODAY)).toBeNull();
  });
});

describe('calLinks', () => {
  const e = byName('Hack the North');
  const links = calLinks(e, calDates(e, TODAY)!);
  const get = (label: string) => new URL(links.find((l) => l.label === label)!.href);

  it('offers five calendars in a fixed order', () => {
    expect(links.map((l) => l.label)).toEqual(['Google Calendar', 'Outlook.com', 'Outlook / Microsoft 365', 'Yahoo Calendar', 'Apple Calendar / other (.ics)']);
  });
  it('Google: title, dates and the official link', () => {
    const g = get('Google Calendar');
    expect(g.searchParams.get('text')).toBe('Hack the North');
    expect(g.searchParams.get('dates')).toBe('20261009/20261012');
    expect(g.searchParams.get('details')).toContain(e.url);
    expect(g.searchParams.get('location')).toBe('Waterloo, Ontario, Canada');
  });
  it('Outlook and Microsoft 365: all-day, exclusive end', () => {
    for (const label of ['Outlook.com', 'Outlook / Microsoft 365']) {
      const o = get(label);
      expect([o.searchParams.get('startdt'), o.searchParams.get('enddt'), o.searchParams.get('allday')]).toEqual(['2026-10-09', '2026-10-12', 'true']);
    }
  });
  it('.ics is a download named after the event', () => {
    expect(links[4].download).toBe('hack-the-north.ics');
    expect(links[4].href.startsWith('data:text/calendar;charset=utf-8,')).toBe(true);
  });
});

describe('icsFile', () => {
  it('is a valid all-day VEVENT, one property per line', () => {
    const e = { ...byName('Montréal AI Night'), description: 'Line one\nLine two; with, punctuation' };
    const text = icsFile(e, calDates(e, TODAY)!, new Date('2026-10-04T12:00:00Z'));
    const lines = text.split('\r\n');
    expect(lines).toContain('DTSTART;VALUE=DATE:20261015');
    expect(lines).toContain('DTEND;VALUE=DATE:20261016');
    expect(lines).toContain('DTSTAMP:20261004T120000Z');
    expect(lines.every((l) => /^[A-Z][A-Z-]*(;[^:]*)?:/.test(l))).toBe(true);
    expect(text).toContain('Line one\\nLine two\\; with\\, punctuation');
  });
  it('escapes per RFC 5545', () => expect(icsEscape('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne'));
});
