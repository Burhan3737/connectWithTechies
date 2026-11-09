import { Component, lazy, Suspense, useEffect, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from 'react';
import { RADII, type CityOption, type Radius } from '../../model/types';
import { announce } from '../announce';
import { useApp } from '../context';
import type { MapData } from './mapEngine';

/** The map's code and data arrive together; the list above and below never waits for them. */
function loadMap(): ComponentType {
  return lazy(async () => {
    const [{ NightMap }, data] = await Promise.all([import('./NightMap'), import('./map-data.json')]);
    return { default: () => <NightMap data={data.default as MapData} /> };
  });
}

class MapBoundary extends Component<{ onRetry(): void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="map__frame">
        <button type="button" className="map__retry" onClick={this.props.onRetry}>The map didn&apos;t load. Try again</button>
      </div>
    );
  }
}

function cityNames(keys: string[], cities: CityOption[]): string {
  const names = keys.map((k) => cities.find((c) => c.key === k)?.city ?? k);
  if (names.length > 3) return `${names.length} cities`;
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}` : names[0];
}

const RADIUS_OPTIONS: readonly Radius[] = [0, ...RADII];

/** Include nearby places: one tab stop, the arrow keys move between the radios and choose. */
function RadiusControl() {
  const { map, filters, options, actions } = useApp();
  if (!map.placed.length) return null;
  const only = map.placed.length === 1 ? options.cities.find((c) => c.key === map.placed[0])?.city : undefined;

  const onKey = (ev: KeyboardEvent<HTMLDivElement>) => {
    const at = RADIUS_OPTIONS.indexOf(filters.r), n = RADIUS_OPTIONS.length;
    const to = ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? (at + 1) % n
      : ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' ? (at - 1 + n) % n : -1;
    if (to < 0) return;
    ev.preventDefault();
    actions.setRadius(RADIUS_OPTIONS[to]);
    ev.currentTarget.querySelector<HTMLElement>(`[data-r="${RADIUS_OPTIONS[to]}"]`)?.focus({ preventScroll: true });
  };

  return (
    <div className="radius" role="radiogroup" aria-label="Include nearby places around every picked city" onKeyDown={onKey}>
      {RADIUS_OPTIONS.map((r) => (
        <button key={r} type="button" role="radio" className="rad__b" data-r={r} aria-checked={filters.r === r}
          tabIndex={filters.r === r ? 0 : -1} onClick={() => actions.setRadius(r)}>
          {r ? `${r} km` : only ? `Just ${only}` : 'Just these'}
        </button>
      ))}
    </div>
  );
}

/** Says what a changed radius did, here because the radius can change before the map has downloaded. */
function useRadiusAnnouncement() {
  const { map, options, shown, board, calendar } = useApp();
  const seen = useRef(shown.r);
  useEffect(() => {
    if (seen.current === shown.r) return;
    seen.current = shown.r;
    if (!map.placed.length) return;
    const names = cityNames(map.placed, options.cities);
    const n = shown.view === 'calendar' ? calendar.grid.eventsInMonth : board.events.length;
    announce(`${shown.r ? `Within ${shown.r} km of ${names}` : `Just ${names}`}: ${n} ${n === 1 ? 'event' : 'events'}.`);
  }, [shown.r]);
}

/** The map section under the masthead: absent with no positions, a retry if its download fails. */
export function MapSlot() {
  const { map, options } = useApp();
  useRadiusAnnouncement();
  const [attempt, setAttempt] = useState(() => ({ n: 0, View: loadMap() }));
  if (!map.available) return null;

  const single = map.picked.length === 1 ? options.cities.find((c) => c.key === map.picked[0]) : undefined;
  return (
    <section id="map" className="map" aria-labelledby="mapTitle">
      <div className="map__bar">
        <h2 className="map__title" id="mapTitle">
          Over{' '}
          {single ? <><b>{single.city}</b><span className="map__reg">, {single.region}</span></>
            : <b>{map.picked.length ? cityNames(map.picked, options.cities) : 'North America'}</b>}
        </h2>
        <RadiusControl />
      </div>
      <MapBoundary key={attempt.n} onRetry={() => setAttempt({ n: attempt.n + 1, View: loadMap() })}>
        <Suspense fallback={<div className="map__frame" />}>
          <attempt.View />
        </Suspense>
      </MapBoundary>
    </section>
  );
}
