import { act, renderHook } from '@testing-library/react';
import { useAppViewModel } from './useAppViewModel';
import { indexes, TODAY } from '../test/fixtures';
import { parsePlaces } from '../model/places';

describe('useAppViewModel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 4, 12));          // TODAY, local noon
    window.history.replaceState(null, '', '/');
  });
  afterEach(() => vi.useRealTimers());

  const render = (search = '') => renderHook(() => useAppViewModel(indexes(), search));

  it('starts on Upcoming with every dated and undated upcoming event, grouped by month, with events under way first as On now', () => {
    const { result } = render();
    expect(result.current.today).toBe(TODAY);
    expect(result.current.board.events).toHaveLength(8);
    expect(result.current.board.groups.map((g) => g.label)).toEqual([
      'On now', 'October 2026', 'November 2026', 'Usually May — date not yet announced']);
    expect(result.current.board.groups.reduce((n, g) => n + g.count, 0)).toBe(8);
    expect(result.current.scopeLabel).toBe('all cities');
  });

  it('brings nearby places in with a radius, and says so', () => {
    const places = parsePlaces({ cities: { 'waterloo|ontario': [43.46, -80.52], 'toronto|ontario': [43.65, -79.38], 'austin|texas': [30.27, -97.74] } });
    const { result } = renderHook(() => useAppViewModel({ ...indexes(), places }, '?cities=waterloo%7Contario&r=150'));
    expect(result.current.filters.r).toBe(150);
    expect(result.current.scope.added).toBe(1);
    expect(result.current.scope.keys).toEqual(new Set(['waterloo|ontario', 'toronto|ontario']));
    expect(result.current.scopeLabel).toBe('1 city + 1 place within 150 km');
    expect(result.current.board.events.some((e) => e.city === 'Toronto')).toBe(true);
    act(() => result.current.actions.clearCities());
    expect(result.current.scope.keys).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('lights every placed city whatever is picked, and has no map without positions', () => {
    expect(render().result.current.map).toEqual({ lights: [], picked: [], available: false });
    const places = parsePlaces({ cities: { 'toronto|ontario': [43.65, -79.38], 'austin|texas': [30.27, -97.74] } });
    const { result } = renderHook(() => useAppViewModel({ ...indexes(), places }, '?cities=toronto%7Contario'));
    expect(result.current.map.available).toBe(true);
    expect(result.current.map.picked).toEqual(['toronto|ontario']);
    expect(result.current.map.lights.map((l) => l.key).sort()).toEqual(['austin|texas', 'toronto|ontario']);
    expect(result.current.map.lights.find((l) => l.key === 'toronto|ontario')?.label).toBe('Toronto');
  });

  it('reads a shared link, settling a province without its country', () => {
    const { result } = render('?region=Ontario&type=hackathon');
    expect(result.current.filters).toMatchObject({ region: 'Ontario', country: 'Canada', type: 'hackathon' });
    expect(result.current.board.events.map((e) => e.name)).toEqual(['Hack the North']);
  });

  it('commands change the board and are mirrored to the URL', () => {
    const { result } = render();
    act(() => result.current.actions.setCountry('United States'));
    expect(result.current.board.events.every((e) => e.country === 'United States')).toBe(true);
    expect(window.location.search).toBe('?country=United+States');
    act(() => result.current.actions.addCity('austin|texas'));
    expect(result.current.scopeLabel).toBe('1 city');
    act(() => result.current.actions.setWhen('all'));
    expect(result.current.board.events.map((e) => e.name)).toEqual(['Old Summit', 'DevOpsDays Austin']);
    act(() => result.current.actions.reset());
    expect(window.location.search).toBe('?when=all');
  });

  it('narrows the province list to the chosen country', () => {
    const { result } = render();
    expect(result.current.options.regionGroups.map((g) => g.country)).toEqual(['United States', 'Canada']);
    act(() => result.current.actions.setCountry('Canada'));
    expect(result.current.options.regionGroups.map((g) => g.country)).toEqual(['Canada']);
    expect(result.current.options.regionGroups[0].regions.map((r) => r.name)).toEqual(['Ontario', 'Quebec']);
  });

  it('the calendar opens on this month with today selected, and lists a day as occurrences', () => {
    const { result } = render();
    act(() => result.current.actions.setView('calendar'));
    expect(result.current.calendar).toMatchObject({ month: '2026-10', title: 'October 2026', day: TODAY });
    expect(result.current.board.events).toEqual([]);                    // the hidden list is not computed
    act(() => result.current.actions.selectDay('2026-11-12'));
    expect(result.current.calendar.month).toBe('2026-11');
    expect(result.current.calendar.dayEvents.map((e) => [e.name, e.next_date, e.occurrence])).toEqual([
      ['Seattle Python Meetup', '2026-11-12', true]]);
    expect(window.location.search).toBe('?view=calendar&month=2026-11&day=2026-11-12');
  });

  it('leaving the current month clears the day; returning re-opens today', () => {
    const { result } = render('?view=calendar');
    act(() => result.current.actions.shiftMonth(1));
    expect(result.current.calendar.day).toBe('');
    act(() => result.current.actions.shiftMonth(-1));
    expect(result.current.calendar.day).toBe(TODAY);
  });
});
