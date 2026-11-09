import { Component, lazy, Suspense, useState, type ComponentType, type ReactNode } from 'react';
import type { CityOption } from '../../model/types';
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

/** The map section under the masthead: absent with no positions, a retry if its download fails. */
export function MapSlot() {
  const { map, options } = useApp();
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
      </div>
      <MapBoundary key={attempt.n} onRetry={() => setAttempt({ n: attempt.n + 1, View: loadMap() })}>
        <Suspense fallback={<div className="map__frame" />}>
          <attempt.View />
        </Suspense>
      </MapBoundary>
    </section>
  );
}
