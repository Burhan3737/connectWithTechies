import type { LatLon } from './places';

/**
 * Web Mercator on a unit world: x and y in [0,1), tiles of 256 px at zoom 0.
 * A View is the world point at the middle of the screen plus a zoom.
 */
export interface View { x: number; y: number; z: number }
export interface Size { w: number; h: number }

export const HOME_BOUNDS = { lon0: -126.5, lon1: -63, lat0: 24, lat1: 53.5 };
/** The extent the shipped map data covers; the view never leaves it. */
const MAP_EXTENT = { lon0: -172, lon1: -48, lat0: 12, lat1: 74 };
const MAX_Z = 10.6;
const RAD = Math.PI / 180;

const mxOf = (lon: number) => (lon + 180) / 360;
const myOf = (lat: number) => {
  const s = Math.sin(Math.max(-85, Math.min(85, lat)) * RAD);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};

export function mercator([lat, lon]: LatLon): [x: number, y: number] {
  return [mxOf(lon), myOf(lat)];
}

export function unmercator(x: number, y: number): LatLon {
  return [90 - (360 * Math.atan(Math.exp((y - 0.5) * 2 * Math.PI))) / Math.PI, x * 360 - 180];
}

export const scaleOf = (z: number) => 256 * 2 ** z;

export function toScreen(v: View, s: Size, x: number, y: number): [number, number] {
  const k = scaleOf(v.z);
  return [(x - v.x) * k + s.w / 2, (y - v.y) * k + s.h / 2];
}

export function toWorld(v: View, s: Size, px: number, py: number): [number, number] {
  const k = scaleOf(v.z);
  return [v.x + (px - s.w / 2) / k, v.y + (py - s.h / 2) / k];
}

/** The zoom at which a world box, with `pad` px kept clear on every side, fits the screen. */
function fitZ(s: Size, x0: number, x1: number, y0: number, y1: number, pad: number): number {
  const w = Math.max(40, s.w - 2 * pad);
  const h = Math.max(40, s.h - 2 * pad);
  const k = Math.min(w / Math.max(1e-9, x1 - x0), h / Math.max(1e-9, y1 - y0));
  return Math.log(k / 256) / Math.LN2;
}

/** Narrow screens get a tighter margin; the same width the phone layout starts at. */
export function homeView(s: Size): View {
  const { lon0, lon1, lat0, lat1 } = HOME_BOUNDS;
  const x0 = mxOf(lon0), x1 = mxOf(lon1), y0 = myOf(lat1), y1 = myOf(lat0);
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: fitZ(s, x0, x1, y0, y1, s.w <= 720 ? 6 : 24) };
}

export function fitPoints(points: LatLon[], s: Size, padPx: number): View {
  if (!points.length) return homeView(s);
  let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
  for (const p of points) {
    const [x, y] = mercator(p);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: Math.min(MAX_Z, fitZ(s, x0, x1, y0, y1, padPx)) };
}

export function clampView(v: View, s: Size): View {
  const { lon0, lon1, lat0, lat1 } = MAP_EXTENT;
  const ex0 = mxOf(lon0), ex1 = mxOf(lon1), ey0 = myOf(lat1), ey1 = myOf(lat0);
  const zMin = Math.min(homeView(s).z - 0.6, fitZ(s, ex0, ex1, ey0, ey1, 0));
  return {
    x: Math.max(ex0, Math.min(ex1, v.x)),
    y: Math.max(ey0, Math.min(ey1, v.y)),
    z: Math.max(zMin, Math.min(MAX_Z, v.z)),
  };
}

/** x,y pairs, delta then zigzag, 5 bits a character from code 63; returned as flat world coordinates (x / q). */
export function decodeLine(str: string, q: number): Float64Array {
  const out: number[] = [];
  let i = 0, x = 0, y = 0;
  const next = () => {
    let v = 0, sh = 0, b: number;
    do { b = str.charCodeAt(i++) - 63; v |= (b & 0x1f) << sh; sh += 5; } while (b >= 0x20);
    return v & 1 ? ~(v >> 1) : v >> 1;
  };
  while (i < str.length) {
    x += next();
    y += next();
    out.push(x / q, y / q);
  }
  return Float64Array.from(out);
}
