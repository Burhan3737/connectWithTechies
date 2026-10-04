import { filtersReducer, settleFilters } from './filtersReducer';
import { DEFAULT_FILTERS, type Filters } from '../model/types';
import { indexes, TODAY } from '../test/fixtures';

const regions = indexes().regions;
const start = (f: Partial<Filters> = {}): Filters => ({ ...DEFAULT_FILTERS, ...f });

describe('filtersReducer', () => {
  it('adds a city once, removes it, pops the last, clears all', () => {
    let f = filtersReducer(start(), { type: 'addCity', key: 'a|x' });
    f = filtersReducer(f, { type: 'addCity', key: 'a|x' });
    f = filtersReducer(f, { type: 'addCity', key: 'b|y' });
    expect(f.cities).toEqual(['a|x', 'b|y']);
    expect(filtersReducer(f, { type: 'removeCity', key: 'a|x' }).cities).toEqual(['b|y']);
    expect(filtersReducer(f, { type: 'popCity' }).cities).toEqual(['a|x']);
    expect(filtersReducer(f, { type: 'clearCities' }).cities).toEqual([]);
    expect(filtersReducer(start(), { type: 'popCity' })).toEqual(start());
  });

  it('a province settles its country', () => {
    expect(filtersReducer(start(), { type: 'region', region: 'Ontario', regions })).toMatchObject({ region: 'Ontario', country: 'Canada' });
  });

  it('another country clears a province not in it; the same country keeps it', () => {
    const on = start({ region: 'Ontario', country: 'Canada' });
    expect(filtersReducer(on, { type: 'country', country: 'United States', regions })).toMatchObject({ country: 'United States', region: '' });
    expect(filtersReducer(on, { type: 'country', country: 'Canada', regions }).region).toBe('Ontario');
    expect(filtersReducer(on, { type: 'country', country: '', regions }).region).toBe('Ontario');
  });

  it('opening the calendar lands on this month with today open', () => {
    expect(filtersReducer(start(), { type: 'view', view: 'calendar', today: TODAY })).toMatchObject({ view: 'calendar', month: '2026-10', day: TODAY });
    const later = start({ view: 'list', month: '2026-12', day: '2026-12-10' });
    expect(filtersReducer(later, { type: 'view', view: 'calendar', today: TODAY })).toMatchObject({ month: '2026-12', day: '2026-12-10' });
  });

  it('changing month closes the opened day; today goes back', () => {
    const f = start({ view: 'calendar', month: '2026-10', day: '2026-10-09' });
    expect(filtersReducer(f, { type: 'shiftMonth', by: 1, today: TODAY })).toMatchObject({ month: '2026-11', day: '' });
    expect(filtersReducer(start(), { type: 'shiftMonth', by: -1, today: TODAY }).month).toBe('2026-09');
    expect(filtersReducer(start({ month: '2027-03' }), { type: 'today', today: TODAY })).toMatchObject({ month: '2026-10', day: TODAY });
  });

  it('selecting a day from a neighbouring month moves to that month', () => {
    expect(filtersReducer(start({ month: '2026-10' }), { type: 'selectDay', day: '2026-11-01' })).toMatchObject({ month: '2026-11', day: '2026-11-01' });
  });

  it('reset clears every narrowing and shows all dates, keeping view and sort', () => {
    const f = start({ q: 'x', cities: ['a|b'], type: 'hackathon', country: 'Canada', region: 'Ontario', sort: 'city', view: 'calendar' });
    expect(filtersReducer(f, { type: 'reset' })).toMatchObject({ q: '', cities: [], when: 'all', type: '', country: '', region: '', sort: 'city', view: 'calendar' });
  });
});

describe('settleFilters', () => {
  it('a shared province link gets its country', () => {
    expect(settleFilters(start({ region: 'Quebec' }), regions)).toMatchObject({ region: 'Quebec', country: 'Canada' });
  });
  it('an unknown province is dropped', () => {
    expect(settleFilters(start({ region: 'Atlantis' }), regions).region).toBe('');
  });
});
