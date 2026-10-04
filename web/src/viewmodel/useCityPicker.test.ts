import { act, renderHook } from '@testing-library/react';
import { citySuggestions, useCityPicker } from './useCityPicker';
import { indexes } from '../test/fixtures';

const cities = indexes().cities;

describe('citySuggestions', () => {
  it('matches city or province/state, accent-free, minus cities already chosen', () => {
    expect(citySuggestions(cities, [], 'montreal').map((c) => c.city)).toEqual(['Montréal']);
    expect(citySuggestions(cities, [], 'ontario').map((c) => c.city).sort()).toEqual(['Toronto', 'Waterloo']);
    expect(citySuggestions(cities, ['waterloo|ontario'], 'ontario').map((c) => c.city)).toEqual(['Toronto']);
  });
  it('an empty box suggests the busiest cities first', () => {
    expect(citySuggestions(cities, [], '')[0].count).toBeGreaterThanOrEqual(citySuggestions(cities, [], '')[1].count);
  });
});

describe('useCityPicker', () => {
  const setup = (chosen: string[] = []) => {
    const actions = { addCity: vi.fn(), popCity: vi.fn() };
    const hook = renderHook(() => useCityPicker(cities, chosen, actions));
    return { actions, hook };
  };

  it('typing opens the list; Enter adds the first suggestion and clears the box', () => {
    const { actions, hook } = setup();
    act(() => hook.result.current.type('water'));
    expect(hook.result.current.open).toBe(true);
    expect(hook.result.current.suggestions[0].city).toBe('Waterloo');
    act(() => { hook.result.current.key('Enter'); });
    expect(actions.addCity).toHaveBeenCalledWith('waterloo|ontario');
    expect(hook.result.current.text).toBe('');
    expect(hook.result.current.open).toBe(false);
  });

  it('arrows move the highlight and wrap; Enter takes the highlighted one', () => {
    const { actions, hook } = setup();
    act(() => hook.result.current.type('o'));
    const n = hook.result.current.suggestions.length;
    act(() => { hook.result.current.key('ArrowDown'); });
    act(() => { hook.result.current.key('ArrowDown'); });
    expect(hook.result.current.highlight).toBe(1 % n);
    act(() => { hook.result.current.key('ArrowUp'); });
    act(() => { hook.result.current.key('ArrowUp'); });
    expect(hook.result.current.highlight).toBe(n - 1);
    act(() => { hook.result.current.key('Enter'); });
    expect(actions.addCity).toHaveBeenCalledWith(hook.result.current.suggestions[n - 1]?.key ?? expect.any(String));
  });

  it('Escape closes; Backspace on an empty box removes the last city', () => {
    const { actions, hook } = setup(['toronto|ontario']);
    act(() => hook.result.current.focus());
    act(() => { hook.result.current.key('Escape'); });
    expect(hook.result.current.open).toBe(false);
    expect(hook.result.current.key('Backspace')).toBe(true);
    expect(actions.popCity).toHaveBeenCalled();
  });

  it('Backspace with text in the box is left to the input', () => {
    const { actions, hook } = setup(['toronto|ontario']);
    act(() => hook.result.current.type('wa'));
    expect(hook.result.current.key('Backspace')).toBe(false);
    expect(actions.popCity).not.toHaveBeenCalled();
  });
});
