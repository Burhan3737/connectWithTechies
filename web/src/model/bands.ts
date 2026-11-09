import { daysBetween, parseISO } from './dates';
import { keyDate, runsUntil } from './events';
import type { TechEvent, When } from './types';

/**
 * Time as colour: how far off a row's date is. Weeks run Monday to Sunday.
 * 'now' is under way, 'noDate' has no date announced.
 */
export type Band = 'now' | 'thisWeek' | 'nextWeek' | 'weeks2to5' | 'weeks6plus' | 'noDate';

export interface BandMark { band: Band; index: number; count: number; label: string }

export const BAND_LABEL: Record<Band, string> = {
  now: 'On now', thisWeek: 'This week', nextWeek: 'Next week',
  weeks2to5: '2–5 weeks out', weeks6plus: '6+ weeks out', noDate: 'No date yet',
};

export function bandOf(e: TechEvent & { occurrence?: boolean }, when: When, today: string): Band {
  if (runsUntil(e, when, today)) return 'now';
  const key = keyDate(e, when, today);
  if (!key) return 'noDate';
  const toSunday = (7 - (parseISO(today)?.getDay() ?? 0)) % 7;      // days left in this week
  const ahead = daysBetween(today, key);
  if (ahead <= toSunday) return 'thisWeek';
  const week = Math.ceil((ahead - toSunday) / 7);                    // 1 = next week
  return week === 1 ? 'nextWeek' : week <= 5 ? 'weeks2to5' : 'weeks6plus';
}

/**
 * Where each band starts in a date-sorted Upcoming list. Bands exist only
 * there: under Past or All a row's distance from today means little.
 */
export function bandMarks(events: (TechEvent & { occurrence?: boolean })[], when: When, today: string): BandMark[] {
  if (when !== 'upcoming') return [];
  const marks = new Map<Band, BandMark>();
  events.forEach((e, index) => {
    const band = bandOf(e, when, today);
    const mark = marks.get(band);
    if (mark) mark.count++;
    else marks.set(band, { band, index, count: 1, label: BAND_LABEL[band] });
  });
  return [...marks.values()].sort((a, b) => a.index - b.index);
}
