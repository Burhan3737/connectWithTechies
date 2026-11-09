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
    expect(render().result.current.map).toMatchObject({ lights: [], picked: [], available: false });
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

  describe('a shared link', () => {
    const late = parsePlaces({ cities: { 'waterloo|ontario': [43.46, -80.52], 'toronto|ontario': [43.65, -79.38] } });

    it('drops a city the data does not know instead of showing an empty page', () => {
      const { result } = render('?cities=ghost%7Cnowhere&r=150');
      expect(result.current.filters).toMatchObject({ cities: [], r: 0 });
      expect(result.current.board.events).toHaveLength(8);
      expect(window.location.search).toBe('');
    });

    it('keeps its radius through the wait for positions, and applies it when they come', () => {
      const data = indexes();
      const { result, rerender } = renderHook(({ ix }) => useAppViewModel(ix, '?cities=waterloo%7Contario&r=150'), { initialProps: { ix: data } });
      expect(result.current.filters.r).toBe(150);
      expect(window.location.search).toContain('r=150');
      expect(result.current.scope.added).toBe(0);
      rerender({ ix: { ...data, places: late } });
      expect(result.current.filters.r).toBe(150);
      expect(result.current.scope.added).toBe(1);
      expect(window.location.search).toContain('r=150');
    });

    it('clears the radius once positions arrive and no pick has one', () => {
      const data = indexes();
      const { result, rerender } = renderHook(({ ix }) => useAppViewModel(ix, '?cities=austin%7Ctexas&r=150'), { initialProps: { ix: data } });
      expect(result.current.filters.r).toBe(150);
      rerender({ ix: { ...data, places: late } });
      expect(result.current.filters).toMatchObject({ cities: ['austin|texas'], r: 0 });
      expect(window.location.search).not.toContain('r=');
    });
  });

  describe('rangeText', () => {
    const places = parsePlaces({
      cities: { 'waterloo|ontario': [43.46, -80.52], 'toronto|ontario': [43.65, -79.38] },
      metros: [{ lat: 43.7, lon: -79.4, members: ['seattle|washington'] }],
    });
    const at = (search: string) => renderHook(() => useAppViewModel({ ...indexes(), places }, search)).result.current;

    it('is empty with no city picked', () => {
      expect(at('').rangeText('toronto|ontario')).toBe('');
    });

    it('says here for a picked city and how far from the nearest pick for the rest', () => {
      const vm = at('?cities=waterloo%7Contario');
      expect(vm.rangeText('waterloo|ontario')).toBe('here');
      expect(vm.rangeText('toronto|ontario')).toMatch(/^\d+ km E of Waterloo$/);
    });

    it('gives no distance to a place known only by its metro or to a pick with no position', () => {
      expect(at('?cities=waterloo%7Contario').rangeText('seattle|washington')).toBe('');
      const vm = at('?cities=austin%7Ctexas');
      expect(vm.rangeText('austin|texas')).toBe('');
      expect(vm.rangeText('toronto|ontario')).toBe('');
    });

    it('lists places the radius reached only by metro area', () => {
      const vm = at('?cities=waterloo%7Contario&r=150');
      expect(vm.map.placed).toEqual(['waterloo|ontario']);
      expect(vm.map.byMetro.map((l) => [l.key, l.n])).toEqual([['seattle|washington', 1]]);
    });
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
