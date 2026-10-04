import { act, renderHook } from '@testing-library/react';
import { useAppViewModel } from './useAppViewModel';
import { indexes, TODAY } from '../test/fixtures';

describe('useAppViewModel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 4, 12));          // TODAY, local noon
    window.history.replaceState(null, '', '/');
  });
  afterEach(() => vi.useRealTimers());

  const render = (search = '') => renderHook(() => useAppViewModel(indexes(), search));

  it('starts on Upcoming with every dated and undated upcoming event, grouped by month', () => {
    const { result } = render();
    expect(result.current.today).toBe(TODAY);
    expect(result.current.board.events).toHaveLength(8);
    expect(result.current.board.groups.map((g) => g.label)).toEqual([
      'September 2026', 'October 2026', 'November 2026', 'Usually May — date not yet announced']);
    expect(result.current.board.groups.reduce((n, g) => n + g.count, 0)).toBe(8);
    expect(result.current.scopeLabel).toBe('all cities');
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
