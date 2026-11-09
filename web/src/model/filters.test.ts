import { applyFilters, isFiltered } from './filters';
import { DEFAULT_FILTERS, type Filters } from './types';
import { indexes, TODAY } from '../test/fixtures';

const run = (f: Partial<Filters>) => applyFilters(indexes().events, { ...DEFAULT_FILTERS, ...f }, TODAY).map((e) => e.name);

describe('applyFilters', () => {
  it('Upcoming, by date: dated events in order, then undated ones by usual month', () => {
    expect(run({})).toEqual([
      'Long Workshop Series', 'BigRed//Hacks', 'Seattle Python Meetup', 'Hack the North', 'Montréal AI Night',
      'Toronto Tech Week', 'Multi-City Week', 'DevOpsDays Austin',
    ]);
  });

  it('Past runs newest first, under the edition held', () => {
    expect(run({ when: 'past' })).toEqual(['BigRed//Hacks', 'Long Workshop Series', 'DevOpsDays Austin', 'Toronto Tech Week', 'Old Summit']);
  });

  it('narrows by country, region, kind and city', () => {
    expect(run({ country: 'United States', when: 'all' })).toHaveLength(5);
    expect(run({ region: 'Texas', when: 'all' })).toEqual(['Old Summit', 'DevOpsDays Austin']);   // All: oldest first
    expect(run({ type: 'hackathon' })).toEqual(['BigRed//Hacks', 'Hack the North']);
    expect(run({ cities: ['waterloo|ontario'] })).toEqual(['Long Workshop Series', 'Hack the North']);
  });

  it('searches any field, accent-free', () => {
    expect(run({ q: 'montreal' })).toEqual(['Montréal AI Night']);
    expect(run({ q: 'MACHINE learning' })).toEqual(['Montréal AI Night']);
    expect(run({ q: 'startups' })).toEqual(['Toronto Tech Week']);       // a topic
    expect(run({ q: 'nothing like this' })).toEqual([]);
  });

  it('sorts by city with region breaking ties, and by name', () => {
    expect(run({ sort: 'city', when: 'all' }).slice(0, 2)).toEqual(['Old Summit', 'DevOpsDays Austin']);   // Austin, then by date
    expect(run({ sort: 'name' })[0]).toBe('BigRed//Hacks');
  });

  it('knows when anything is narrowed', () => {
    expect(isFiltered(DEFAULT_FILTERS)).toBe(false);
    expect(isFiltered({ ...DEFAULT_FILTERS, q: 'x' })).toBe(true);
    expect(isFiltered({ ...DEFAULT_FILTERS, when: 'all' })).toBe(true);
  });
});

describe('applyFilters with a radius scope', () => {
  const scope = new Set(['waterloo|ontario', 'ithaca|new york']);
  const evs = indexes().events;

  it('lets the scope stand in for the cities while other filters still apply', () => {
    const out = applyFilters(evs, { ...DEFAULT_FILTERS, cities: ['waterloo|ontario'], type: 'hackathon' }, TODAY, undefined, scope);
    expect(out.map((e) => e.name).sort()).toEqual(['BigRed//Hacks', 'Hack the North']);
    const other = applyFilters(evs, { ...DEFAULT_FILTERS, cities: ['waterloo|ontario'], type: 'workshop' }, TODAY, undefined, scope);
    expect(other.map((e) => e.name)).toEqual(['Long Workshop Series']);
    expect(applyFilters(evs, { ...DEFAULT_FILTERS, cities: ['waterloo|ontario'], type: 'meetup' }, TODAY, undefined, scope)).toEqual([]);
  });

  it('is ignored when no city is picked', () => {
    expect(applyFilters(evs, DEFAULT_FILTERS, TODAY, undefined, scope)).toHaveLength(applyFilters(evs, DEFAULT_FILTERS, TODAY).length);
  });
});
