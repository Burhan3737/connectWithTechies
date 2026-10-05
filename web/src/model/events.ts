import { fold } from './text';
import { MONTHS, parseISO } from './dates';
import type { TechEvent, When, SortKey } from './types';

/** "Toronto, Ontario" -> "toronto|ontario": how cities are chosen and put in URLs. */
export const cityKeyOf = (e: Pick<TechEvent, 'city' | 'region'>) => `${fold(e.city)}|${fold(e.region)}`;

/** Every searchable field, folded once. */
export const haystackOf = (e: TechEvent) => fold([
  e.name, e.description, e.city, e.region, e.country, e.venue, e.type, e.audience, (e.topics || []).join(' '),
].join(' · '));

export const isPastISO = (iso: string | undefined, today: string) => !!iso && iso < today;

/**
 * The date an event is filed under depends on which way you are looking.
 * Browsing Past, an annual event shows the edition that actually happened,
 * even when a future one is already scheduled. Everywhere else the next
 * edition leads, falling back to the last one held. An occurrence picked from
 * a calendar day is always filed under that day.
 */
export function keyDate(e: TechEvent & { occurrence?: boolean }, when: When, today: string): string {
  if (e.occurrence) return e.next_date || '';
  if (when === 'past') return e.last_date || (isPastISO(e.next_date, today) ? e.next_date! : '');
  if (when === 'upcoming') return e.next_date || '';      // never advertise a held date as upcoming
  return e.next_date || e.last_date || '';
}

export function keyDateEnd(e: TechEvent & { occurrence?: boolean }, when: When, today: string): string {
  return keyDate(e, when, today) === e.next_date ? e.next_date_end || '' : '';
}

/** Which events each When choice shows. */
export function inWhen(e: TechEvent, when: When, today: string): boolean {
  if (when === 'all') return true;
  // A future date, or an annual event whose next edition is unannounced. The
  // date is judged by the visitor's clock, not the data build's: an event that
  // ended yesterday leaves Upcoming today even if the data is a day old.
  if (when === 'upcoming') {
    if (e.status === 'recurring-tbd') return true;
    if (e.status !== 'upcoming') return false;
    return !e.next_date || (e.next_date_end || e.next_date) >= today;
  }
  // Any edition actually held — an annual event with a future date still has a past one.
  return !!e.last_date || e.status === 'past' || isPastISO(e.next_date, today);
}

/** Index of the first month named in `month`, so undated events still sort by season. 99 = unknown. */
export function monthIndex(e: Pick<TechEvent, 'month'>): number {
  const m = fold(e.month);
  for (let i = 0; i < MONTHS.length; i++) if (m.includes(MONTHS[i].toLowerCase().slice(0, 3))) return i;
  return 99;
}

/** What an undated row shows in its date column: the usual month, or TBA. */
export function monthHint(e: Pick<TechEvent, 'month'>): string {
  const m = String(e.month || '').trim();
  if (!m || /^varies$/i.test(m)) return 'TBA';
  return m.length > 9 ? `${m.slice(0, 8)}.` : m;
}

/** The heading a row sits under, for the current sort. */
export function groupLabel(e: TechEvent, sort: SortKey, when: When, today: string): string {
  if (sort === 'city') return `${e.city}, ${e.region}`;
  if (sort === 'name') return (e.name[0] || '#').toUpperCase();
  const d = parseISO(keyDate(e, when, today));
  if (d) return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const mi = monthIndex(e);
  return mi < 12 ? `Usually ${MONTHS[mi]} — date not yet announced` : 'Date not yet announced';
}

/** The sentence a screen reader hears for a row's date. */
export function dateLine(e: TechEvent, when: When, today: string, fmt: (a: string, b?: string) => string): string {
  const k = keyDate(e, when, today);
  if (k) return fmt(k, keyDateEnd(e, when, today));
  const mi = monthIndex(e);
  return mi < 12 ? `usually ${MONTHS[mi]}, next date not yet announced` : 'date not yet announced';
}
