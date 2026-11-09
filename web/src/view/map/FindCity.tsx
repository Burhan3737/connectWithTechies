import { useState, type KeyboardEvent } from 'react';
import type { CityOption } from '../../model/types';
import { citySuggestions } from '../../viewmodel/useCityPicker';

const MAX_OPTIONS = 8;

interface Props {
  cities: readonly CityOption[];
  picked: readonly string[];
  onChoose(key: string): void;
}

/** The map's own search: find a city, move there and pick it, as one action. */
export function FindCity({ cities, picked, onChoose }: Props) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const options = text.trim() ? citySuggestions(cities, [], text).slice(0, MAX_OPTIONS) : [];
  const showing = open && !!text.trim();

  const close = () => { setOpen(false); setHighlight(-1); };
  const choose = (key: string) => { setText(''); close(); onChoose(key); };

  const onKey = (ev: KeyboardEvent<HTMLInputElement>) => {
    const n = options.length;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      setOpen(true);
      if (n) setHighlight((h) => (h + 1) % n);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (n) setHighlight((h) => (h - 1 + n) % n);
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      const pick = options[highlight >= 0 ? highlight : 0];
      if (pick) choose(pick.key);
    } else if (ev.key === 'Escape' && showing) {
      ev.preventDefault();
      ev.stopPropagation();
      close();
    }
  };

  return (
    <div className="map__find">
      <label className="vh" htmlFor="mapq">Find a city on the map</label>
      <svg className="ico map__findico" aria-hidden="true" viewBox="0 0 16 16">
        <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="m10.4 10.4 3.6 3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input id="mapq" type="text" placeholder="Find a city" autoComplete="off" spellCheck={false} enterKeyHint="go"
        role="combobox" aria-expanded={showing} aria-controls="mapopts" aria-autocomplete="list"
        aria-activedescendant={showing && highlight >= 0 ? `map-opt-${highlight}` : undefined}
        value={text} onChange={(e) => { setText(e.target.value); setOpen(true); setHighlight(-1); }}
        onFocus={() => setOpen(true)} onBlur={close} onKeyDown={onKey} />
      <ul id="mapopts" className="citylist map__opts" role="listbox" aria-label="Cities to find and pick" hidden={!showing}>
        {showing && (options.length ? options.map((c, i) => (
          <li key={c.key} id={`map-opt-${i}`} role="option" aria-selected={i === highlight} data-key={c.key}
            // mousedown, not click: choose before the input's blur.
            onMouseDown={(e) => { e.preventDefault(); choose(c.key); }}>
            <span>{c.city}</span><small>{picked.includes(c.key) ? 'picked · ' : ''}{c.region} · {c.count}</small>
          </li>
        )) : <li className="citylist__none">no matching city</li>)}
      </ul>
    </div>
  );
}
