import { useState } from 'react';
import { fold } from '../model/text';
import type { CityOption } from '../model/types';

/** How many suggestions the list shows at once. */
export const MAX_SUGGESTIONS = 60;

/** Cities matching what was typed (by city or province/state), minus those already chosen. */
export function citySuggestions(cities: readonly CityOption[], chosen: readonly string[], text: string): CityOption[] {
  const needle = fold(text.trim());
  const out: CityOption[] = [];
  for (const c of cities) {
    if (chosen.includes(c.key)) continue;
    if (needle && !fold(c.city).includes(needle) && !fold(c.region).includes(needle)) continue;
    out.push(c);
    if (out.length === MAX_SUGGESTIONS) break;
  }
  return out;
}

/**
 * The city typeahead's view-model: what is typed, whether the list is open,
 * which suggestion is highlighted, and what each key does.
 */
export function useCityPicker(cities: readonly CityOption[], chosen: readonly string[],
  actions: { addCity(key: string): void; popCity(): void }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const suggestions = open ? citySuggestions(cities, chosen, text) : [];

  const choose = (key: string) => {
    actions.addCity(key);
    setText('');
    setOpen(false);
    setHighlight(-1);
  };

  return {
    text, open, highlight, suggestions,
    type(value: string) { setText(value); setOpen(true); setHighlight(-1); },
    focus() { setOpen(true); setHighlight(-1); },
    close() { setOpen(false); setHighlight(-1); },
    choose,
    /** Returns true when the key was handled (the view then prevents the default). */
    key(k: string): boolean {
      const list = citySuggestions(cities, chosen, text);
      switch (k) {
        case 'ArrowDown':
          if (!open) { setOpen(true); return true; }
          if (list.length) setHighlight((h) => (h + 1) % list.length);
          return true;
        case 'ArrowUp':
          if (list.length) setHighlight((h) => (h - 1 + list.length) % list.length);
          return true;
        case 'Enter': {
          const pick = list[highlight >= 0 ? highlight : 0];
          if (pick) choose(pick.key);
          return true;
        }
        case 'Escape': setOpen(false); setHighlight(-1); return true;
        case 'Backspace':
          if (!text && chosen.length) { actions.popCity(); return true; }
          return false;
        default: return false;
      }
    },
  };
}
