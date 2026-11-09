import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { circle } from '../../model/geo';
import type { Cluster } from '../../model/mapCluster';
import type { Size, View } from '../../model/mapGeometry';
import type { LatLon } from '../../model/places';
import type { CityOption } from '../../model/types';
import { announce } from '../announce';
import { useApp } from '../context';
import { FindCity } from './FindCity';
import { MapEngine, type DrawnLight, type MapData } from './mapEngine';
import { PlaceList } from './PlaceList';

const LICENSE_URL = `${import.meta.env.BASE_URL}map-data-license.txt`;

const events = (n: number) => `${n} ${n === 1 ? 'event' : 'events'}`;
const these = (n: number, one: string, many: string) => (n === 1 ? one : many);

function hint(coarse: boolean, showsSoon: boolean): string {
  return (coarse ? 'Drag to move, pinch to zoom, tap a light to add its city.' : 'Drag to move, scroll to zoom, click a light to add its city.') +
    (showsSoon ? ' Whiter lights: more events in the next 7 days.' : '');
}

function clusterLine(c: Cluster, cities: readonly CityOption[]): string {
  const place = cities.find((x) => x.key === c.key);
  if (!place) return '';
  return `${place.city}, ${place.region} · ${events(c.own)}${c.more
    ? ` (+${c.moreN} in ${c.more} ${these(c.more, 'place', 'places')} nearby, zoom in to pick ${these(c.more, 'it', 'them')})`
    : ''}`;
}

/** On the page (`inline`), a phone's open map (`open`), or a phone's map parked behind the list (`hidden`). */
export type MapMode = 'inline' | 'open' | 'hidden';

/**
 * The map and what floats on it. The engine is created once and told what
 * changed through its setters; the view only re-renders when a move settles
 * or the hovered light changes, so a drag never touches React.
 */
export function NightMap({ data, mode }: { data: MapData; mode: MapMode }) {
  const { map, options, actions, shown, board, calendar } = useApp();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const latest = useRef({ picked: map.picked, placed: map.placed, positionOf: map.positionOf, r: shown.r, cities: options.cities, actions });
  // A pick made on the map itself, waiting to be spoken once the results have caught up.
  const mapPick = useRef<{ key: string; adding: boolean } | null>(null);
  const lastCross = useRef('');
  const [settled, setSettled] = useState<{ view: View; size: Size } | null>(null);
  const [hot, setHot] = useState<DrawnLight | null>(null);
  const [hotByKeys, setHotByKeys] = useState(false);
  const [coarse] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  const hidden = mode === 'hidden';

  useLayoutEffect(() => { latest.current = { picked: map.picked, placed: map.placed, positionOf: map.positionOf, r: shown.r, cities: options.cities, actions }; });

  const toggle = (key: string) => {
    const { picked, actions: a } = latest.current;
    const adding = !picked.includes(key);
    mapPick.current = { key, adding };
    if (adding) a.addCity(key); else a.removeCity(key);
  };

  const flyTo = (key: string) => {
    const engine = engineRef.current, at = latest.current.positionOf(key);
    if (engine && at) engine.flyTo(engine.cityView(at));
  };

  const find = (key: string) => {
    const { picked, cities } = latest.current;
    if (picked.includes(key)) announce(`${cities.find((c) => c.key === key)?.city ?? key} is already picked.`);
    else toggle(key);
    flyTo(key);
  };

  const onCross = (light: Cluster | null, pressed: boolean) => {
    if (pressed) { announce('No city light under the cross. Move the map with the arrow keys, or use Find a city.'); return; }
    const { picked, cities } = latest.current;
    const text = light
      ? `Under the cross: ${clusterLine(light, cities)}${picked.includes(light.key) ? ', picked. Enter removes it.' : '. Enter adds it.'}`
      : 'No city light under the cross.';
    if (text !== lastCross.current) { lastCross.current = text; announce(text); }
  };

  useLayoutEffect(() => {
    const host = hostRef.current!;
    const engine = new MapEngine(host, canvasRef.current!, data, {
      onToggle: (key) => { lastCross.current = ''; toggle(key); },
      onHover: (key, byKeys) => { setHot(key ? engineRef.current?.drawnLight(key) ?? null : null); setHotByKeys(byKeys); },
      onSettle: (view) => setSettled({ view, size: { w: host.clientWidth, h: host.clientHeight } }),
      onCross,
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    engineRef.current = engine;
    const { placed, positionOf, r } = latest.current;
    const points = placed.map(positionOf) as LatLon[];
    if (points.length) engine.fitTo(points, 0, r);
    return () => { engine.destroy(); engineRef.current = null; };
  }, [data]);

  // Parked behind the list it draws nothing; these run again when it comes back.
  useEffect(() => { if (!hidden) engineRef.current?.setLights(map.lights); }, [map.lights, hidden]);
  useEffect(() => { if (!hidden) engineRef.current?.setPicked(map.picked); }, [map.picked, hidden]);

  const eventCount = shown.view === 'calendar' ? calendar.grid.eventsInMonth : board.events.length;

  // True-distance outlines of the radius around every pick with a position.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || hidden) return;
    const centres = map.placed.map(map.positionOf) as LatLon[];
    engine.setRings(shown.r ? centres.map((c) => circle(c, shown.r)) : []);
  }, [map.placed.join('|'), shown.r, hidden]);

  // A pick from the Cities box also flies there; one made on the map speaks instead (and stays put, unless Find a city moved it).
  const seenPicks = useRef(map.picked);
  useEffect(() => {
    const before = seenPicks.current;
    seenPicks.current = map.picked;
    // A pending pick counts only if this change is the one it asked for; one that changed nothing must not speak for a later change.
    const pending = mapPick.current;
    mapPick.current = null;
    const pick = pending && pending.adding === map.picked.includes(pending.key) && pending.adding !== before.includes(pending.key) ? pending : null;
    if (pick) {
      const name = options.cities.find((c) => c.key === pick.key);
      const scopeWords = !map.picked.length ? 'all cities' : `${map.picked.length} ${these(map.picked.length, 'city', 'cities')}`;
      announce(`${name ? `${name.city}, ${name.region}` : pick.key}${pick.adding ? ' added' : ' removed'}. ${events(eventCount)}, ${scopeWords}${shown.r ? ` and places within ${shown.r} km` : ''}.`);
      return;
    }
    const added = map.picked.filter((k) => !before.includes(k));
    if (added.length && !hidden) flyTo(added[added.length - 1]);
  }, [map.picked]);

  // A wider radius: keep its rings whole on screen, whichever control changed it.
  const seenRadius = useRef(shown.r);
  useEffect(() => {
    if (seenRadius.current === shown.r) return;
    seenRadius.current = shown.r;
    const centres = map.placed.map(map.positionOf) as LatLon[];
    if (shown.r && centres.length && !hidden) engineRef.current?.revealRings(centres, shown.r);
  }, [shown.r]);

  // Back on screen: the view is as it was left, unless the picks or the radius changed while it was away.
  const picksAndRadius = `${map.picked.join(';')}|${shown.r}`;
  const lastOnScreen = useRef(picksAndRadius);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || hidden) return;
    engine.resize();
    if (lastOnScreen.current !== picksAndRadius) {
      const points = map.placed.map(map.positionOf) as LatLon[];
      if (points.length) engine.fitTo(points, 0, shown.r);
    }
    if (mode === 'open') {
      hostRef.current?.focus({ preventScroll: true });
      announce(`Map open. ${hint(coarse, shown.when !== 'past' && shown.view !== 'calendar')}`);
    }
  }, [mode]);
  useEffect(() => { if (!hidden) lastOnScreen.current = picksAndRadius; }, [hidden, picksAndRadius]);

  // The light under the pointer is a snapshot; whether it is picked is not.
  const hotPicked = !!hot && map.picked.includes(hot.cluster.key);
  const line = hot ? clusterLine(hot.cluster, options.cities) : '';

  // The tip sits over its light, kept inside the frame; its width is only known once it is on screen.
  useLayoutEffect(() => {
    const tip = tipRef.current, host = hostRef.current;
    if (!tip || !host || !hot) return;
    const w = tip.offsetWidth;
    const x = Math.max(4, Math.min(host.clientWidth - w - 4, hot.x - w / 2));
    const above = hot.y - hot.r - 40;
    tip.style.transform = `translate(${Math.round(x)}px,${Math.round(above < 4 ? hot.y + hot.r + 12 : above)}px)`;
  }, [hot]);

  return (
    <>
      <div className="map__frame">
        <div id="mapView" className="map__view" ref={hostRef} tabIndex={0} role="application" aria-roledescription="map" aria-describedby="mapRead"
          aria-label={`Map of tech events${map.picked.length ? `, ${map.picked.length} ${these(map.picked.length, 'city', 'cities')} picked` : ''}. Arrow keys move, plus and minus zoom, Enter adds or removes the city under the cross.`}
          onBlur={() => { lastCross.current = ''; }}>
          <canvas className="map__canvas" ref={canvasRef} aria-hidden="true" />
        </div>
        <FindCity cities={options.cities} picked={map.picked} onChoose={find} />
        <div className="map__zoom">
          <button type="button" className="map__zb" aria-label="Zoom in" onClick={() => engineRef.current?.zoomBy(1)}>
            <svg className="ico" aria-hidden="true" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          <button type="button" className="map__zb" aria-label="Zoom out" onClick={() => engineRef.current?.zoomBy(-1)}>
            <svg className="ico" aria-hidden="true" viewBox="0 0 16 16"><path d="M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          <button type="button" className="map__zb" aria-label="Back to the whole map" onClick={() => engineRef.current?.fitHome()}>
            <svg className="ico" aria-hidden="true" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="8" r="1.6" fill="currentColor" /></svg>
          </button>
        </div>
        {hot && line && !hotByKeys && (
          <div className="map__tip" ref={tipRef} aria-hidden="true">
            {line} · click to {hotPicked ? 'remove' : 'add'}
          </div>
        )}
        <p className="map__attr">Map: <a href={LICENSE_URL}>Natural Earth, us-atlas</a></p>
      </div>
      <div className="map__foot">
        <p className="map__read" id="mapRead">{line ? `${line}${hotPicked ? ' · picked' : ''}` : hint(coarse, shown.when !== 'past' && shown.view !== 'calendar')}</p>
        <PlaceList lights={map.lights} byMetro={map.byMetro} picked={map.picked} cities={options.cities} settled={settled} onToggle={toggle} />
      </div>
    </>
  );
}
