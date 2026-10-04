import { fold } from './text';
import { addDays, daysBetween, isoOf, parseISO } from './dates';
import type { IndexedEvent } from './types';

/** A programme longer than this shows on its first day only, not on every day of it. */
export const LONG_SPAN_DAYS = 7;
export const CHIPS_PER_DAY = 3;

/**
 * Every day an event is on the calendar for: each day of its next edition
 * (unless it is a long programme), the day its last edition was held, and
 * each upcoming session of a recurring series.
 */
export function eventDays(e: IndexedEvent): string[] {
  const days: string[] = [];
  if (e.next_date) {
    const end = e.next_date_end || e.next_date;
    const span = parseISO(end) ? daysBetween(e.next_date, end) : 0;
    if (span < 0 || span > LONG_SPAN_DAYS) days.push(e.next_date);
    else for (let d = e.next_date; d <= end; d = addDays(d, 1)) days.push(d);
  }
  if (e.last_date && e.last_date !== e.next_date) days.push(e.last_date);
  for (const x of e.feed_dates || []) if (!days.includes(x)) days.push(x);
  return days;
}

/** An event as it stands for one calendar day. */
export type Occurrence = IndexedEvent & { occurrence: true };

/**
 * The edition a calendar day stands for: the next edition if the day falls
 * inside it, otherwise that single day (the edition last held, or one session
 * of a series). The day list shows it, and adds it to a calendar, as such.
 */
export function occurrenceOn(e: IndexedEvent, iso: string): Occurrence {
  const end = e.next_date_end || e.next_date;
  if (e.next_date && e.next_date <= iso && iso <= end!) return { ...e, occurrence: true };
  return { ...e, next_date: iso, next_date_end: '', occurrence: true };
}

/** Hackathons and conferences lead a day; the rest follow. */
const KIND_RANK = ['hackathon', 'conference', 'summit', 'tech-week', 'startup-week', 'expo',
  'demo-day', 'ctf', 'game-jam', 'unconference', 'festival', 'career-fair', 'workshop'];
const kindRank = (e: IndexedEvent) => { const i = KIND_RANK.indexOf(e.type); return i < 0 ? KIND_RANK.length : i; };
const bareName = (e: IndexedEvent) => fold(e.name).replace(/^[^a-z0-9]+/, '');
export const compareForDay = (a: IndexedEvent, b: IndexedEvent) =>
  kindRank(a) - kindRank(b) || bareName(a).localeCompare(bareName(b));

/** The names a day cell shows: the same title in three cities is one line. */
export function chipsFor(evs: readonly IndexedEvent[]): IndexedEvent[] {
  const seen = new Set<string>();
  const out: IndexedEvent[] = [];
  for (const e of evs) {
    if (out.length >= CHIPS_PER_DAY) break;
    const k = bareName(e);
    if (!seen.has(k)) { seen.add(k); out.push(e); }
  }
  return out;
}

export interface CalendarDay {
  iso: string;
  date: number;
  weekday: number;
  inMonth: boolean;
  events: IndexedEvent[];
}

export interface CalendarMonth {
  month: string;              // YYYY-MM
  days: CalendarDay[];        // whole weeks, Sunday first
  eventsInMonth: number;      // distinct events with a day in this month
  byDay: Map<string, IndexedEvent[]>;
}

/** Lay a month out as whole weeks and file each event under its days. */
export function buildMonth(month: string, events: readonly IndexedEvent[]): CalendarMonth {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const gridStart = new Date(y, m - 1, 1 - first.getDay());
  const weeks = Math.ceil((first.getDay() + new Date(y, m, 0).getDate()) / 7);
  const lo = isoOf(gridStart);
  const hi = addDays(lo, weeks * 7 - 1);

  const byDay = new Map<string, IndexedEvent[]>();
  let eventsInMonth = 0;
  for (const e of events) {
    let counted = false;
    for (const d of eventDays(e)) {
      if (d < lo || d > hi) continue;
      let list = byDay.get(d);
      if (!list) byDay.set(d, (list = []));
      list.push(e);
      if (!counted && d.slice(0, 7) === month) { eventsInMonth++; counted = true; }
    }
  }
  for (const list of byDay.values()) list.sort(compareForDay);

  const days: CalendarDay[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const iso = addDays(lo, i);
    const d = parseISO(iso)!;
    days.push({ iso, date: d.getDate(), weekday: d.getDay(), inMonth: iso.slice(0, 7) === month, events: byDay.get(iso) || [] });
  }
  return { month, days, eventsInMonth, byDay };
}
