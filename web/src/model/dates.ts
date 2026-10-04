/**
 * Calendar dates as plain ISO strings ("2026-10-04"). Event dates are whole
 * days in the event's own place, so they are never turned into instants — a
 * Date built from "2026-10-04" in UTC would show as the 3rd west of London.
 */

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'] as const;
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export const isISODate = (s: unknown): s is string => typeof s === 'string' && ISO.test(s);

export const pad = (n: number) => String(n).padStart(2, '0');

/** A local Date at midnight for an ISO day, or null. */
export function parseISO(iso: string | undefined | null): Date | null {
  if (!isISODate(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today in the browser's own zone — the person's calendar, not UTC. */
export function todayISO(now: Date = new Date()): string {
  return isoOf(now);
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso)!;
  d.setDate(d.getDate() + n);
  return isoOf(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b)!.getTime() - parseISO(a)!.getTime()) / 86_400_000);
}

export const fmtDay = (iso: string) => { const d = parseISO(iso); return d ? pad(d.getDate()) : ''; };
export const fmtMonYear = (iso: string) => {
  const d = parseISO(iso);
  return d ? `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}` : '';
};

/** "October 4, 2026", "October 4–6, 2026", "October 30 – November 2, 2026". */
export function fmtRange(a: string, b?: string): string {
  const da = parseISO(a);
  if (!da) return '';
  const db = parseISO(b);
  if (!db || b === a) return `${MONTHS[da.getMonth()]} ${da.getDate()}, ${da.getFullYear()}`;
  if (da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()) {
    return `${MONTHS[da.getMonth()]} ${da.getDate()}–${db.getDate()}, ${da.getFullYear()}`;
  }
  return `${MONTHS[da.getMonth()]} ${da.getDate()} – ${MONTHS[db.getMonth()]} ${db.getDate()}, ${db.getFullYear()}`;
}

export const monthTitle = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

/** Shift a YYYY-MM month by n months. */
export function shiftMonth(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
