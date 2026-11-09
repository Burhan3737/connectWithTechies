import { bearingDeg, compass8, haversineKm } from './geo';
import { fold } from './text';
import type { CityOption, Radius } from './types';

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

/**
 * Every place the filter should show: the picked cities, plus (with a radius)
 * any place within `r` km of any picked city. A picked city with no position of
 * its own adds only itself; a place with no position at all is never added.
 */
export function radiusScope(picked: readonly string[], r: Radius, t: PlaceTable, allKeys: Iterable<string>): Set<string> {
  const scope = new Set(picked);
  if (!r) return scope;
  const centres = picked.map((k) => ownPosition(t, k)).filter((p): p is LatLon => !!p);
  if (!centres.length) return scope;
  for (const key of allKeys) {
    if (scope.has(key)) continue;
    const pos = anyPosition(t, key);
    if (pos && centres.some((c) => haversineKm(c, pos) <= r)) scope.add(key);
  }
  return scope;
}

export type Range = { kind: 'here' } | { kind: 'away'; km: number; dir: string; fromKey: string };

/**
 * How far a city is from the nearest picked one. Only cities with a position of
 * their own get a distance: a metro-only place or an unplaced one gives null.
 */
export function rangeFrom(cityKey: string, picked: readonly string[], t: PlaceTable): Range | null {
  if (picked.includes(cityKey)) return { kind: 'here' };
  const here = ownPosition(t, cityKey);
  if (!here) return null;
  let best: { km: number; key: string; pos: LatLon } | null = null;
  for (const key of picked) {
    const pos = ownPosition(t, key);
    if (!pos) continue;
    const km = haversineKm(pos, here);
    if (!best || km < best.km) best = { km, key, pos };
  }
  if (!best) return null;
  if (best.km < 1) return { kind: 'here' };
  return { kind: 'away', km: best.km, dir: compass8(bearingDeg(best.pos, here)), fromKey: best.key };
}

/** Abbreviations for the regions that share a city name with another region. Any other region is spelled out. */
const REGION_ABBR: Readonly<Record<string, string>> = {
  Alabama: 'AL', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE',
  Florida: 'FL', Georgia: 'GA', Illinois: 'IL', Indiana: 'IN', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME',
  Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT',
  Nebraska: 'NE', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New York': 'NY', 'North Carolina': 'NC', Ohio: 'OH',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN',
  Texas: 'TX', Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
  'British Columbia': 'BC', Ontario: 'ON',
};

/** What to call each place by key: its city, with its state or province when another region has a city of that name. */
export function placeNames(cities: readonly CityOption[]): Map<string, string> {
  const uses = new Map<string, number>();
  for (const c of cities) uses.set(fold(c.city), (uses.get(fold(c.city)) ?? 0) + 1);
  return new Map(cities.map((c) => [
    c.key,
    (uses.get(fold(c.city)) ?? 0) > 1 ? `${c.city} ${REGION_ABBR[c.region] ?? c.region}` : c.city,
  ]));
}
