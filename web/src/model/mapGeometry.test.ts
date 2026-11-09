import { describe, expect, it } from 'vitest';
import {
  cityZoom, clampView, decodeLine, fitPoints, homeView, mercator, scaleOf, toScreen, toWorld, unmercator,
} from './mapGeometry';

const s = { w: 800, h: 600 };

describe('projection', () => {
  const [x, y] = mercator([43.65, -79.38]);
  const v = fitPoints([[40.44, -80], [43.65, -79.38]], s, 40, false);

  it('round-trips between the world and the screen', () => {
    const [px, py] = toScreen(v, s, x, y);
    expect(px).toBeGreaterThan(0);
    expect(px).toBeLessThan(800);
    expect(py).toBeGreaterThan(0);
    const [wx, wy] = toWorld(v, s, px, py);
    expect(wx).toBeCloseTo(x, 8);
    expect(wy).toBeCloseTo(y, 8);
  });

  it('inverts mercator', () => {
    const [lat, lon] = unmercator(x, y);
    expect(lat).toBeCloseTo(43.65, 6);
    expect(lon).toBeCloseTo(-79.38, 6);
  });

  it('keeps the world in [0,1) and clamps the poles', () => {
    expect(mercator([0, 0])).toEqual([0.5, 0.5]);
    const [, top] = mercator([90, 0]);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(0.01);
  });

  it('scales by 256 * 2 ** z', () => {
    expect(scaleOf(0)).toBe(256);
    expect(scaleOf(3)).toBe(2048);
  });
});

describe('views', () => {
  it('home view shows the whole of the US and Canada', () => {
    const h = homeView(s, false);
    const [x0, y0] = toScreen(h, s, ...mercator([53.5, -126.5]));
    const [x1, y1] = toScreen(h, s, ...mercator([24, -63]));
    expect(x0).toBeGreaterThanOrEqual(0);
    expect(y0).toBeGreaterThanOrEqual(0);
    expect(x1).toBeLessThanOrEqual(800);
    expect(y1).toBeLessThanOrEqual(600);
  });

  it('uses the phone margin by the phone argument, not by the screen width', () => {
    const landscapePhone = { w: 800, h: 360 };
    expect(homeView(landscapePhone, true).z).toBeGreaterThan(homeView(landscapePhone, false).z);
    const narrowDesktop = { w: 700, h: 500 };
    expect(homeView(narrowDesktop, false).z).toBeLessThan(homeView(narrowDesktop, true).z);
    expect(fitPoints([], landscapePhone, 40, true)).toEqual(homeView(landscapePhone, true));
    expect(clampView({ x: 0.3, y: 0.4, z: -3 }, landscapePhone, true).z).toBeLessThan(homeView(landscapePhone, true).z);
  });

  it('clamps zoom and centre without mutating the input', () => {
    const wild = { x: 5, y: -5, z: 40 };
    const c = clampView(wild, s, false);
    expect(wild).toEqual({ x: 5, y: -5, z: 40 });
    expect(c.z).toBeCloseTo(10.6, 8);
    expect(c.x).toBeLessThan(1);
    expect(c.y).toBeGreaterThan(0);
    expect(clampView({ x: 0.2, y: 0.4, z: -3 }, s, false).z).toBeLessThan(homeView(s, false).z);
  });
});

describe('decodeLine', () => {
  // 'o' 'd' 'v' 'J' read as 5-bit groups 16, 5, 23, 11: 16 + 5*32 + 23*1024 + 11*32768
  // = 384176; zigzag halves it to 192088. The second pair continues from there.
  const encoded = 'odvJoc|Won[K';
  it('decodes delta + zigzag pairs scaled by q', () => {
    const q = 1048576;
    expect(Array.from(decodeLine(encoded, q))).toEqual([
      192088 / q, 408136 / q, 206672 / q, 408142 / q,
    ]);
  });
});

describe('shipped map data', () => {
  it('decodes every line to points inside the world', async () => {
    const data = (await import('../view/map/map-data.json')).default as {
      q: number; lo: Record<string, string[]>; hi: Record<string, string[]>;
    };
    let lines = 0;
    for (const lod of [data.lo, data.hi]) {
      for (const list of Object.values(lod)) {
        for (const str of list) {
          const pts = decodeLine(str, data.q);
          lines++;
          expect(pts.length % 2).toBe(0);
          expect(pts.every((n) => n > 0 && n < 1)).toBe(true);
        }
      }
    }
    expect(lines).toBeGreaterThan(100);
  });
});

describe('cityZoom', () => {
  it('frames about 520 km across the width at that latitude', () => {
    const lat = 43.65, z = cityZoom(lat, 1000);
    const kmPerWorld = 40075 * Math.cos((lat * Math.PI) / 180);
    expect((1000 / scaleOf(z)) * kmPerWorld).toBeCloseTo(520, 3);
  });

  it('stays well under the closest zoom the map allows', () => {
    expect(cityZoom(40, 1440)).toBeLessThan(9);
  });
});
