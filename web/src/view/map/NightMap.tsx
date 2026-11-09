import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { unmercator } from '../../model/mapGeometry';
import type { Size, View } from '../../model/mapGeometry';
import { useApp } from '../context';
import { MapEngine, type DrawnLight, type MapData } from './mapEngine';
import { PlaceList } from './PlaceList';

const LICENSE_URL = `${import.meta.env.BASE_URL}map-data-license.txt`;

const events = (n: number) => `${n} ${n === 1 ? 'event' : 'events'}`;
const these = (n: number, one: string, many: string) => (n === 1 ? one : many);

function hint(coarse: boolean): string {
  return coarse
    ? 'Drag to move, pinch to zoom, tap a light to add its city. Whiter lights: more events in the next 7 days.'
    : 'Drag to move, scroll to zoom, click a light to add its city. Whiter lights: more events in the next 7 days.';
}

/**
 * The map and what floats on it. The engine is created once and told what
 * changed through its setters; the view only re-renders when a move settles
 * or the hovered light changes, so a drag never touches React.
 */
export function NightMap({ data }: { data: MapData }) {
  const { map, options, actions } = useApp();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const latest = useRef({ picked: map.picked, lights: map.lights, actions });
  const [settled, setSettled] = useState<{ view: View; size: Size } | null>(null);
  const [hot, setHot] = useState<DrawnLight | null>(null);
  const [coarse] = useState(() => window.matchMedia('(pointer: coarse)').matches);

  useLayoutEffect(() => { latest.current = { picked: map.picked, lights: map.lights, actions }; });

  useLayoutEffect(() => {
    const host = hostRef.current!;
    const engine = new MapEngine(host, canvasRef.current!, data, {
      onToggle: (key) => {
        const { picked, actions: a } = latest.current;
        if (picked.includes(key)) a.removeCity(key); else a.addCity(key);
      },
      onHover: (key) => setHot(key ? engineRef.current?.drawnLight(key) ?? null : null),
      onSettle: (view) => setSettled({ view, size: { w: host.clientWidth, h: host.clientHeight } }),
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    engineRef.current = engine;
    const { picked, lights } = latest.current;
    const points = lights.filter((l) => picked.includes(l.key)).map((l) => unmercator(l.x, l.y));
    if (points.length) engine.fitTo(points, 0);
    return () => { engine.destroy(); engineRef.current = null; };
  }, [data]);

  useEffect(() => { engineRef.current?.setLights(map.lights); }, [map.lights]);
  useEffect(() => { engineRef.current?.setPicked(map.picked); }, [map.picked]);

  // The light under the pointer is a snapshot; whether it is picked is not.
  const hotPicked = !!hot && map.picked.includes(hot.cluster.key);
  const place = hot && options.cities.find((c) => c.key === hot.cluster.key);
  const line = hot && place
    ? `${place.city}, ${place.region} · ${events(hot.cluster.own)}${hot.cluster.more
      ? ` (+${hot.cluster.moreN} in ${hot.cluster.more} ${these(hot.cluster.more, 'place', 'places')} nearby, zoom in to pick ${these(hot.cluster.more, 'it', 'them')})`
      : ''}`
    : '';

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
        <div id="mapView" className="map__view" ref={hostRef} role="img" aria-label="Map of tech events">
          <canvas className="map__canvas" ref={canvasRef} aria-hidden="true" />
        </div>
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
        {hot && line && (
          <div className="map__tip" ref={tipRef} aria-hidden="true">
            {line} · click to {hotPicked ? 'remove' : 'add'}
          </div>
        )}
        <p className="map__attr">Map: <a href={LICENSE_URL}>Natural Earth, us-atlas</a></p>
      </div>
      <div className="map__foot">
        <p className="map__read">{line ? `${line}${hotPicked ? ' · picked' : ''}` : hint(coarse)}</p>
        <PlaceList lights={map.lights} picked={map.picked} cities={options.cities} settled={settled}
          onToggle={(key) => (map.picked.includes(key) ? actions.removeCity(key) : actions.addCity(key))} />
      </div>
    </>
  );
}
