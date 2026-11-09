import type { Ref } from 'react';
import { useApp } from '../context';

interface Props {
  open: boolean;
  onToggle(): void;
  buttonRef: Ref<HTMLButtonElement>;
}

/** The phone's List/Map switch, above the dock: it names what pressing it will show. */
export function ViewPill({ open, onToggle, buttonRef }: Props) {
  const { map, shown, board } = useApp();
  const n = board.events.length;
  const picks = map.picked.length;
  const text = !open ? 'Map' : shown.view === 'calendar' ? 'Show calendar' : `Show ${n} ${n === 1 ? 'event' : 'events'}`;

  return (
    <button ref={buttonRef} type="button" className="viewpill" onClick={onToggle}
      aria-label={!open && picks ? `Map, ${picks} ${picks === 1 ? 'city' : 'cities'} picked` : undefined}>
      <svg className="ico viewpill__ico viewpill__ico--map" aria-hidden="true" viewBox="0 0 16 16">
        <path d="M8 14.5s4.6-4.3 4.6-8a4.6 4.6 0 0 0-9.2 0c0 3.7 4.6 8 4.6 8Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="6.4" r="1.7" fill="currentColor" />
      </svg>
      <svg className="ico viewpill__ico viewpill__ico--list" aria-hidden="true" viewBox="0 0 16 16">
        <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="viewpill__t">{text}</span>
      {!open && picks > 0 && <span className="viewpill__n">{picks}</span>}
    </button>
  );
}
