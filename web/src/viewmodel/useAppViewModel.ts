import { useDeferredValue, useEffect, useReducer, useState } from 'react';
import { applyFilters } from '../model/filters';
import { groupLabel } from '../model/events';
import { buildMonth, occurrenceOn, type CalendarMonth, type Occurrence } from '../model/calendar';
import { monthTitle, todayISO } from '../model/dates';
import { parseFilters, serializeFilters } from '../model/urlState';
import type { Indexes } from '../model/repository';
import type { Filters, IndexedEvent, KindOption, RegionOption, SortKey, View, When } from '../model/types';
import { filtersReducer, settleFilters } from './filtersReducer';

/**
 * The board's view-model: everything the screen shows, derived from the data
 * and the person's choices, plus the commands that change those choices.
 * Views read from it and call its commands; they hold no rules of their own.
 */
export interface BoardGroup { label: string; count: number }

export interface AppViewModel {
  today: string;
  filters: Filters;
  /** The choices the visible results reflect — trails `filters` while typing. */
  shown: Filters;
  tally: Indexes['counts'] & { generatedOn: string };
  options: {
    kinds: KindOption[];
    countries: { value: string; label: string; count: number }[];
    /** Provinces and states, grouped by country, narrowed to the chosen country. */
    regionGroups: { country: string; regions: RegionOption[] }[];
    cities: Indexes['cities'];
  };
  board: { events: IndexedEvent[]; groups: BoardGroup[]; stale: boolean };
  calendar: {
    month: string; title: string; grid: CalendarMonth;
    day: string; dayEvents: Occurrence[];
  };
  scopeLabel: string;
  actions: {
    setQuery(q: string): void;
    addCity(key: string): void; removeCity(key: string): void; popCity(): void; clearCities(): void;
    setWhen(w: When): void; setKind(k: string): void; setCountry(c: string): void; setRegion(r: string): void;
    setSort(s: SortKey): void; setView(v: View): void;
    shiftMonth(by: number): void; goToday(): void; selectDay(iso: string): void;
    reset(): void;
  };
}

export function useAppViewModel(indexes: Indexes, search: string = window.location.search): AppViewModel {
  // "Today" is fixed for the visit: a session that crosses midnight keeps one clock.
  const [today] = useState(() => todayISO());
  const [filters, dispatch] = useReducer(filtersReducer, search, (s) => settleFilters(parseFilters(s), indexes.regions));

  // Only the search text is deferred: a keystroke never waits for the list,
  // while a click (a day, a dropdown, a toggle) shows its result at once.
  const deferredQ = useDeferredValue(filters.q);
  const shown = deferredQ === filters.q ? filters : { ...filters, q: deferredQ };

  // The URL mirrors the choices, so any view can be bookmarked or shared.
  useEffect(() => {
    const qs = serializeFilters(filters);
    if (qs !== window.location.search) window.history.replaceState(null, '', qs || window.location.pathname);
  }, [filters]);

  // Only the view on screen is computed.
  const inCalendar = shown.view === 'calendar';
  const events = inCalendar ? [] : applyFilters(indexes.events, shown, today);
  const groups: BoardGroup[] = [];
  for (const e of events) {
    const label = groupLabel(e, shown.sort, shown.when, today);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.count++;
    else groups.push({ label, count: 1 });
  }

  // The calendar: every filter except When — the calendar is its own time axis.
  const month = shown.month || today.slice(0, 7);
  const grid = buildMonth(month, inCalendar ? applyFilters(indexes.events, shown, today, 'all') : []);
  // Today is open whenever this month is on screen and no other day is.
  const day = shown.day && shown.day.slice(0, 7) === month ? shown.day : month === today.slice(0, 7) ? today : '';
  const dayEvents = day ? (grid.byDay.get(day) || []).map((e) => occurrenceOn(e, day)) : [];

  const regionsByCountry = new Map<string, RegionOption[]>();
  for (const r of indexes.regions.values()) {
    if (filters.country && r.country !== filters.country) continue;
    const list = regionsByCountry.get(r.country) || [];
    list.push(r);
    regionsByCountry.set(r.country, list);
  }
  const regionGroups = ['United States', 'Canada']
    .filter((c) => regionsByCountry.has(c))
    .map((country) => ({ country, regions: regionsByCountry.get(country)!.sort((a, b) => a.name.localeCompare(b.name)) }));

  const countryCount = (c: string) => indexes.countryCounts.get(c) ?? 0;

  const n = shown.cities.length;
  return {
    today, filters, shown,
    tally: { ...indexes.counts, generatedOn: indexes.generatedOn },
    options: {
      kinds: indexes.kinds,
      countries: [{ value: 'United States', label: 'United States', count: countryCount('United States') },
        { value: 'Canada', label: 'Canada', count: countryCount('Canada') }],
      regionGroups,
      cities: indexes.cities,
    },
    board: { events, groups, stale: shown !== filters },
    calendar: { month, title: monthTitle(month), grid, day, dayEvents },
    scopeLabel: n ? `${n} ${n === 1 ? 'city' : 'cities'}` : 'all cities',
    actions: {
      setQuery: (q) => dispatch({ type: 'query', q }),
      addCity: (key) => dispatch({ type: 'addCity', key }),
      removeCity: (key) => dispatch({ type: 'removeCity', key }),
      popCity: () => dispatch({ type: 'popCity' }),
      clearCities: () => dispatch({ type: 'clearCities' }),
      setWhen: (when) => dispatch({ type: 'when', when }),
      setKind: (kind) => dispatch({ type: 'kind', kind }),
      setCountry: (country) => dispatch({ type: 'country', country, regions: indexes.regions }),
      setRegion: (region) => dispatch({ type: 'region', region, regions: indexes.regions }),
      setSort: (sort) => dispatch({ type: 'sort', sort }),
      setView: (view) => dispatch({ type: 'view', view, today }),
      shiftMonth: (by) => dispatch({ type: 'shiftMonth', by, today }),
      goToday: () => dispatch({ type: 'today', today }),
      selectDay: (iso) => dispatch({ type: 'selectDay', day: iso }),
      reset: () => dispatch({ type: 'reset' }),
    },
  };
}
