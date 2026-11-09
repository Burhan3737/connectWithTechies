import { useState } from 'react';
import type { Light } from '../../model/mapCluster';
import { toScreen, type Size, type View } from '../../model/mapGeometry';
import type { CityOption } from '../../model/types';

const LIMIT = 80;

interface Props {
  lights: Light[];
  picked: string[];
  cities: CityOption[];
  settled: { view: View; size: Size } | null;
  onToggle(key: string): void;
}

function inView(lights: Light[], { view, size }: { view: View; size: Size }): Light[] {
  return lights
    .filter((l) => {
      const [x, y] = toScreen(view, size, l.x, l.y);
      return x >= 0 && y >= 0 && x <= size.w && y <= size.h;
    })
    .sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
}

/** The places on screen as plain buttons: the way to read the map and pick from it without seeing it. */
export function PlaceList({ lights, picked, cities, settled, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const places = settled ? inView(lights, settled) : [];
  const byKey = new Map(cities.map((c) => [c.key, c]));

  return (
    <>
      <button type="button" className="map__listbtn" aria-expanded={open} aria-controls="mapList" onClick={() => setOpen(!open)}>
        {open ? 'Hide the places' : 'List the places in view'} ({places.length})
      </button>
      <div className="map__list" id="mapList" hidden={!open}>
        {open && (places.length ? (
          <ul className="ml" aria-label="Places in view, most events first">
            {places.slice(0, LIMIT).map((l) => {
              const c = byKey.get(l.key);
              return (
                <li key={l.key}>
                  <button type="button" className="ml__b" aria-pressed={picked.includes(l.key)} onClick={() => onToggle(l.key)}>
                    <span className="ml__name"><b>{c?.city ?? l.key}</b><span className="ml__reg">, {c?.region}</span></span>
                    <span className="ml__n">{l.n}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : <p className="ml__none">No city lights in view. Zoom out or move the map.</p>)}
      </div>
    </>
  );
}
