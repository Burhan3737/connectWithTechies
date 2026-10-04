import { fold } from './text';
import { inWhen, keyDate, monthIndex } from './events';
import type { Filters, IndexedEvent, When } from './types';

/**
 * Apply every filter, then sort. Pure: the same inputs always give the same
 * list, which is what lets the view-model memoise it and the tests pin it.
 */
export function applyFilters(events: readonly IndexedEvent[], f: Filters, today: string, whenOverride?: When): IndexedEvent[] {
  const when = whenOverride ?? f.when;
  const needle = fold(f.q.trim());
  const cities = f.cities.length ? new Set(f.cities) : null;
  const out = events.filter((e) =>
    (!cities || cities.has(e.cityKey)) &&
    (!f.country || e.country === f.country) &&
    (!f.region || e.region === f.region) &&
    (!f.type || e.type === f.type) &&
    inWhen(e, when, today) &&
    (!needle || e.hay.includes(needle)));
  return sortEvents(out, f.sort, when, today);
}

export function sortEvents(list: IndexedEvent[], sort: Filters['sort'], when: When, today: string): IndexedEvent[] {
  const dir = when === 'past' ? -1 : 1;
  const byDate = (a: IndexedEvent, b: IndexedEvent, d: number) => {
    // Dated events lead in date order; undated annual ones follow by usual month.
    const da = keyDate(a, when, today), db = keyDate(b, when, today);
    if (!da && !db) return (monthIndex(a) - monthIndex(b)) || a.name.localeCompare(b.name);
    if (!da) return 1;
    if (!db) return -1;
    if (da === db) return a.name.localeCompare(b.name);
    return da < db ? -d : d;
  };
  return list.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'city') {
      // Region breaks the tie, so Bloomington IN and Bloomington MN stay two groups.
      return a.city.localeCompare(b.city) || a.region.localeCompare(b.region) || byDate(a, b, 1);
    }
    return byDate(a, b, dir);
  });
}

/** Has the person narrowed anything? (The empty state offers a reset only then.) */
export const isFiltered = (f: Filters) =>
  !!(f.q || f.cities.length || f.type || f.country || f.region || f.when !== 'upcoming');
