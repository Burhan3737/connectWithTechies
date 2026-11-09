import type { LatLon } from './places';

const RAD = Math.PI / 180;
const EARTH_KM = 6371;
const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = (b[0] - a[0]) * RAD, dLon = (b[1] - a[1]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from `a` to `b`, 0 to 360 degrees clockwise from north. */
export function bearingDeg(a: LatLon, b: LatLon): number {
  const dLon = (b[1] - a[1]) * RAD;
  const y = Math.sin(dLon) * Math.cos(b[0] * RAD);
  const x = Math.cos(a[0] * RAD) * Math.sin(b[0] * RAD) - Math.sin(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.cos(dLon);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

export function compass8(deg: number): (typeof POINTS)[number] {
  return POINTS[Math.floor(((((deg % 360) + 360) % 360) + 22.5) / 45) % 8];
}

/** "305 km", "1,030 km". */
export function formatKm(km: number): string {
  return `${Math.round(km).toLocaleString('en-US')} km`;
}

/** A ring of true radius around `center`, closed (first point repeated last). */
export function circle(center: LatLon, km: number, steps = 64): LatLon[] {
  const d = km / EARTH_KM, lat = center[0] * RAD, lon = center[1] * RAD;
  const out: LatLon[] = [];
  for (let i = 0; i < steps; i++) {
    const brg = (i / steps) * 2 * Math.PI;
    const la = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(brg));
    const lo = lon + Math.atan2(Math.sin(brg) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(la));
    out.push([la / RAD, lo / RAD]);
  }
  out.push(out[0]);
  return out;
}
