/**
 * Where cities are. Positions are optional data: the list, filters and
 * calendar never depend on them, so every failure here ends in the empty table.
 */
export type LatLon = readonly [lat: number, lon: number];
export interface PlaceTable { own: ReadonlyMap<string, LatLon>; metro: ReadonlyMap<string, LatLon> }

export const EMPTY_PLACES: PlaceTable = { own: new Map(), metro: new Map() };

const isCoord = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const asPosition = (v: unknown): LatLon | null =>
  Array.isArray(v) && v.length >= 2 && isCoord(v[0]) && isCoord(v[1]) ? [v[0], v[1]] : null;

/** Read the served file; anything that is not that shape gives `EMPTY_PLACES`. */
export function parsePlaces(raw: unknown): PlaceTable {
  if (!raw || typeof raw !== 'object') return EMPTY_PLACES;
  const { cities, metros } = raw as { cities?: unknown; metros?: unknown };
  const own = new Map<string, LatLon>();
  const metro = new Map<string, LatLon>();
  if (cities && typeof cities === 'object') {
    for (const [key, v] of Object.entries(cities)) {
      const pos = asPosition(v);
      if (pos) own.set(key, pos);
    }
  }
  if (Array.isArray(metros)) {
    for (const m of metros) {
      if (!m || typeof m !== 'object' || !isCoord(m.lat) || !isCoord(m.lon) || !Array.isArray(m.members)) continue;
      for (const key of m.members) if (typeof key === 'string') metro.set(key, [m.lat, m.lon]);
    }
  }
  return own.size || metro.size ? { own, metro } : EMPTY_PLACES;
}

/** The city's own position, if it has one. */
export function ownPosition(t: PlaceTable, key: string): LatLon | undefined {
  return t.own.get(key);
}

/** The city's own position, else the centre of the metro it belongs to. */
export function anyPosition(t: PlaceTable, key: string): LatLon | undefined {
  return t.own.get(key) ?? t.metro.get(key);
}

/** Fetch the positions. Never rejects: no positions only means no map. */
export async function loadPlaces(url: string, fetchImpl: typeof fetch = fetch): Promise<PlaceTable> {
  try {
    const res = await fetchImpl(url, { cache: 'no-cache' });
    if (!res.ok) return EMPTY_PLACES;
    return parsePlaces(await res.json());
  } catch {
    return EMPTY_PLACES;
  }
}
