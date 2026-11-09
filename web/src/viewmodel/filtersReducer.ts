import { type Filters, type Radius, type SortKey, type View, type When, type RegionOption } from '../model/types';
import { shiftMonth } from '../model/dates';
import { ownPosition } from '../model/places';
import type { Indexes } from '../model/repository';

/**
 * Every way the person can change what they are looking at, as one reducer.
 * The rules that tie choices together live here, in one tested place: a
 * province settles its country; another country clears a province that is
 * not in it; leaving a month closes its opened day.
 */
export type FiltersAction =
  | { type: 'query'; q: string }
  | { type: 'addCity'; key: string }
  | { type: 'removeCity'; key: string }
  | { type: 'popCity' }
  | { type: 'clearCities' }
  | { type: 'radius'; r: Radius }
  | { type: 'when'; when: When }
  | { type: 'kind'; kind: string }
  | { type: 'country'; country: string; regions: ReadonlyMap<string, RegionOption> }
  | { type: 'region'; region: string; regions: ReadonlyMap<string, RegionOption> }
  | { type: 'sort'; sort: SortKey }
  | { type: 'view'; view: View; today: string }
  | { type: 'shiftMonth'; by: number; today: string }
  | { type: 'today'; today: string }
  | { type: 'selectDay'; day: string }
  | { type: 'reset' }
  | { type: 'replace'; filters: Filters }
  | { type: 'settle'; known: Known };

/** What a state from outside is checked against. */
type Known = Pick<Indexes, 'regions' | 'cities' | 'places'>;

/** The radius reaches out from the picked cities, so it ends with the last of them. */
const withCities = (f: Filters, cities: string[]): Filters => ({ ...f, cities, r: cities.length ? f.r : 0 });

export function filtersReducer(f: Filters, a: FiltersAction): Filters {
  switch (a.type) {
    case 'query': return { ...f, q: a.q };
    case 'addCity': return f.cities.includes(a.key) ? f : { ...f, cities: [...f.cities, a.key] };
    case 'removeCity': return withCities(f, f.cities.filter((k) => k !== a.key));
    case 'popCity': return f.cities.length ? withCities(f, f.cities.slice(0, -1)) : f;
    case 'clearCities': return withCities(f, []);
    case 'radius': return f.cities.length ? { ...f, r: a.r } : f;
    case 'when': return { ...f, when: a.when };
    case 'kind': return { ...f, type: a.kind };
    case 'country': {
      const r = f.region ? a.regions.get(f.region) : undefined;
      const keepRegion = !f.region || !a.country || (r && r.country === a.country);
      return { ...f, country: a.country, region: keepRegion ? f.region : '' };
    }
    case 'region': {
      const r = a.region ? a.regions.get(a.region) : undefined;
      return { ...f, region: a.region, country: r ? r.country : f.country };
    }
    case 'sort': return { ...f, sort: a.sort };
    case 'view':
      // Opening the calendar lands on this month with today open.
      if (a.view === 'calendar' && !f.month) return { ...f, view: a.view, month: a.today.slice(0, 7), day: a.today };
      return { ...f, view: a.view };
    case 'shiftMonth': return { ...f, month: shiftMonth(f.month || a.today.slice(0, 7), a.by), day: '' };
    case 'today': return { ...f, month: a.today.slice(0, 7), day: a.today };
    case 'selectDay': return { ...f, month: a.day.slice(0, 7), day: a.day };
    // The empty state's way out: everything cleared, every date shown.
    case 'reset': return { ...f, q: '', cities: [], r: 0, when: 'all', type: '', country: '', region: '' };
    case 'replace': return a.filters.cities.length || !a.filters.r ? a.filters : { ...a.filters, r: 0 };
    case 'settle': return settleFilters(f, a.known);
  }
}

/**
 * Settle a state that arrived from outside (a shared link): a city or province
 * that does not exist is dropped, a province without its country gets it, and a
 * radius with no picked city to reach out from ends. Positions may not have
 * loaded yet, so an empty table says nothing about whether a pick has one.
 */
export function settleFilters(f: Filters, known: Known): Filters {
  const cities = f.cities.filter((key) => known.cities.some((c) => c.key === key));
  if (cities.length !== f.cities.length) f = { ...f, cities };
  const positioned = known.places.own.size > 0 || known.places.metro.size > 0;
  if (f.r && (!f.cities.length || (positioned && !f.cities.some((key) => ownPosition(known.places, key))))) f = { ...f, r: 0 };
  if (!f.region) return f;
  const r = known.regions.get(f.region);
  if (!r) return { ...f, region: '' };
  return f.country === r.country ? f : { ...f, country: r.country };
}
