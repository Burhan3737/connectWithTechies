import { parseFilters, serializeFilters } from './urlState';
import { DEFAULT_FILTERS } from './types';

describe('URL state', () => {
  it('defaults leave the URL clean', () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toBe('');
    expect(parseFilters('')).toEqual(DEFAULT_FILTERS);
  });

  it('round-trips every filter', () => {
    const f = { ...DEFAULT_FILTERS, q: 'ai & ml', cities: ['toronto|ontario', 'seattle|washington'], when: 'all' as const,
      type: 'hackathon', country: 'Canada', region: 'Ontario', sort: 'city' as const,
      view: 'calendar' as const, month: '2026-12', day: '2026-12-10' };
    expect(parseFilters(serializeFilters(f))).toEqual(f);
  });

  it('ignores malformed values instead of failing', () => {
    const f = parseFilters('?when=sometime&sort=random&view=grid&month=12-2026&day=tomorrow');
    expect([f.when, f.sort, f.view, f.month, f.day]).toEqual(['upcoming', 'date', 'list', '', '']);
  });

  it('folds city keys, so a hand-typed link still matches', () => {
    expect(parseFilters('?cities=Montr%C3%A9al|Quebec').cities).toEqual(['montreal|quebec']);
  });

  it('writes month and day only for the calendar', () => {
    expect(serializeFilters({ ...DEFAULT_FILTERS, month: '2026-12', day: '2026-12-10' })).toBe('');
  });
});

describe('radius in the URL', () => {
  it('honours r only for 50, 150 or 400 and only with a city', () => {
    expect(parseFilters('?r=150').r).toBe(0);
    expect(parseFilters('?cities=p%7Cx&r=banana').r).toBe(0);
    expect(parseFilters('?cities=p%7Cx&r=75').r).toBe(0);
    expect(parseFilters('?cities=p%7Cx&r=150').r).toBe(150);
  });

  it('writes r only with a city', () => {
    expect(serializeFilters({ ...DEFAULT_FILTERS, cities: ['p|x'], r: 150 })).toContain('r=150');
    expect(serializeFilters({ ...DEFAULT_FILTERS, cities: ['p|x'] })).not.toContain('r=');
    expect(serializeFilters({ ...DEFAULT_FILTERS, r: 150 })).not.toContain('r=');
  });
});
