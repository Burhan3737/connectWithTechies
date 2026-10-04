import { useEffect, useRef } from 'react';
import { useApp } from '../context';
import { useCityPicker } from '../../viewmodel/useCityPicker';

/** Type a city, pick it from the list; each pick becomes a chip. */
export function CityPicker() {
  const { filters, options, actions } = useApp();
  const vm = useCityPicker(options.cities, filters.cities, actions);
  const fieldRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Clicking away closes the suggestions.
  useEffect(() => {
    if (!vm.open) return;
    const onClick = (e: MouseEvent) => { if (!fieldRef.current?.contains(e.target as Node)) vm.close(); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [vm.open]);

  // Keep the highlighted suggestion in view while arrowing.
  useEffect(() => {
    if (vm.highlight >= 0) listRef.current?.children[vm.highlight]?.scrollIntoView?.({ block: 'nearest' });
  }, [vm.highlight]);

  return (
    <div className="field field--city" ref={fieldRef}>
      <label className="field__label" htmlFor="cityq">Cities</label>
      <div className="field__box">
        <span className="field__icon" aria-hidden="true">◎</span>
        <input id="cityq" type="text" placeholder="Add a city" autoComplete="off" spellCheck={false}
          role="combobox" aria-expanded={vm.open} aria-controls="citylist" aria-autocomplete="list"
          aria-activedescendant={vm.highlight >= 0 ? `city-opt-${vm.highlight}` : undefined}
          value={vm.text} onFocus={vm.focus} onChange={(e) => vm.type(e.target.value)}
          onKeyDown={(e) => { if (vm.key(e.key)) e.preventDefault(); }} />
        {filters.cities.length > 0 && (
          <button className="field__clear" id="clearCities" type="button" aria-label="Clear all selected cities"
            onClick={actions.clearCities}>clear</button>
        )}
      </div>
      <ul className="citylist" id="citylist" role="listbox" hidden={!vm.open} ref={listRef}>
        {vm.open && (vm.suggestions.length ? vm.suggestions.map((c, i) => (
          <li key={c.key} id={`city-opt-${i}`} role="option" aria-selected={i === vm.highlight} data-key={c.key}
            // mousedown, not click: choose before the input's blur.
            onMouseDown={(e) => { e.preventDefault(); vm.choose(c.key); }}>
            <span>{c.city}</span><small>{c.region} · {c.count}</small>
          </li>
        )) : <li className="citylist__none">no matching city</li>)}
      </ul>
    </div>
  );
}
