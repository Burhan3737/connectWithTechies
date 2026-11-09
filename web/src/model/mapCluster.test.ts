import { describe, expect, it } from 'vitest';
import { clusterLights, layoutLabels, lightRadius, placeLights, zoomGrowth, type Cluster, type LabelBox } from './mapCluster';
import { fitPoints, mercator, toScreen } from './mapGeometry';
import { parsePlaces } from './places';
import type { CityOption, IndexedEvent } from './types';

const a = { key: 'a', x: 0.5, y: 0.5, n: 10, soon: 0 };
const b = { key: 'b', x: 0.50001, y: 0.5, n: 3, soon: 0 };

describe('clusterLights', () => {
  it('merges lights closer than the radius and keeps the biggest as the lead', () => {
    const out = clusterLights([b, a], 3, new Set(), 24);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ key: 'a', own: 10, n: 13, more: 1, moreN: 3, picked: false });
  });

  it('never merges a picked light', () => {
    const out = clusterLights([a, b], 3, new Set(['b']), 24);
    expect(out.map((c) => c.key).sort()).toEqual(['a', 'b']);
    expect(out.find((c) => c.key === 'b')?.picked).toBe(true);
  });

  it('separates the same lights once zoomed in', () => {
    expect(clusterLights([a, b], 16, new Set(), 24)).toHaveLength(2);
  });

  it('weights the soon share by event count', () => {
    const out = clusterLights([{ ...a, soon: 1 }, { ...b, soon: 0 }], 3, new Set(), 24);
    expect(out[0].soon).toBeCloseTo(10 / 13, 8);
  });
});

describe('layoutLabels', () => {
  const s = { w: 800, h: 600 };
  const v = fitPoints([[40, -80], [44, -75]], s, 40, false);
  const manyClusters: Cluster[] = Array.from({ length: 60 }, (_, i) => ({
    key: `c${i}`, x: 0.28 + (i % 10) * 0.0016, y: 0.37 + Math.floor(i / 10) * 0.0016,
    n: 60 - i, soon: 0, own: 60 - i, more: 0, moreN: 0, picked: i === 7,
  }));
  const overlap = (p: LabelBox, q: LabelBox) =>
    p.x < q.x + q.w && p.x + p.w > q.x && p.y < q.y + q.h && p.y + p.h > q.y;

  it('never overlaps, never sits under a zone, and respects the cap', () => {
    const boxes = layoutLabels(manyClusters, v, s, () => 60, [], 12, false);
    expect(boxes.length).toBeGreaterThan(0);
    expect(boxes.length).toBeLessThanOrEqual(12);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j])).toBe(false);
    }
  });

  it('keeps labels out of a zone placed where they would otherwise fall', () => {
    const free = layoutLabels(manyClusters, v, s, () => 60, [], 12, false);
    const first = free[0];
    const zone = { left: first.x - 1, top: first.y - 1, right: first.x + first.w + 1, bottom: first.y + first.h + 1 };
    const rect = { key: '', text: '', x: zone.left, y: zone.top, w: zone.right - zone.left, h: zone.bottom - zone.top };
    expect(free.some((q) => overlap(q, rect))).toBe(true);
    const zoned = layoutLabels(manyClusters, v, s, () => 60, [zone], 12, false);
    expect(zoned.length).toBeGreaterThan(0);
    expect(zoned.some((q) => overlap(q, rect))).toBe(false);
  });

  it('labels a picked city first, in bold width, even among many', () => {
    const seen: boolean[] = [];
    const boxes = layoutLabels(manyClusters, v, s, (_t, bold) => { seen.push(bold); return 60; }, [], 3, false);
    expect(boxes.map((q) => q.key)).toContain('c7');
    expect(seen).toContain(true);
  });

  it('skips lights that are off screen', () => {
    const off: Cluster = { ...manyClusters[0], key: 'far', x: 0.9, y: 0.9 };
    const [px] = toScreen(v, s, off.x, off.y);
    expect(px).toBeGreaterThan(800);
    expect(layoutLabels([off], v, s, () => 60, [], 5, false)).toEqual([]);
  });

  it('reads the place name and its own count', () => {
    const named: Cluster = { ...manyClusters[0], key: 'toronto|ontario', label: 'Toronto', own: 172, n: 200, picked: false };
    const [box] = layoutLabels([named], v, s, () => 60, [], 1, false);
    expect(box.text).toBe('Toronto 172');
  });

  it('falls back to the key for a light with no name', () => {
    const [box] = layoutLabels([{ ...manyClusters[0], own: 5, picked: false }], v, s, () => 60, [], 1, false);
    expect(box.text).toBe('c0 5');
  });

  it('sizes lights by the phone argument, not by the screen width', () => {
    // A landscape phone is wider than 720 and still the phone layout. The label
    // sits just outside its light, so it moves with the light's size.
    const one: Cluster = { ...manyClusters[0], n: 100, own: 100, picked: false };
    const place = (phone: boolean) => layoutLabels([one], v, s, () => 60, [], 1, phone)[0].x;
    const [px] = toScreen(v, s, one.x, one.y);
    const zk = zoomGrowth(v.z);
    expect(place(false) - px).toBeCloseTo(lightRadius(100, 100, zk, false) + 3, 8);
    expect(place(true) - px).toBeCloseTo(lightRadius(100, 100, zk, true) + 3, 8);
    expect(place(false)).toBeGreaterThan(place(true));
  });
});

describe('lightRadius', () => {
  it('grows with the share of the biggest light and is smaller on phones', () => {
    expect(lightRadius(100, 100, 1, false)).toBeCloseTo(13.3, 8);
    expect(lightRadius(100, 100, 1, true)).toBeCloseTo(11.1, 8);
    expect(lightRadius(0, 100, 1, false)).toBeCloseTo(2.8, 8);
    expect(lightRadius(25, 100, 2, false)).toBeCloseTo((2.8 + 10.5 * 0.5) * 2, 8);
  });
});

describe('placeLights', () => {
  const TODAY = '2026-11-09';
  const places = parsePlaces({ cities: { 'a|x': [43, -79], 'b|x': [47, -122], 'quiet|x': [40, -80] } });
  const cities: CityOption[] = ['a', 'b', 'quiet', 'nowhere'].map((c) => ({ key: `${c}|x`, city: c.toUpperCase(), region: 'X', country: 'Canada', count: 1 }));
  const ev = (key: string, next_date: string, next_date_end = ''): IndexedEvent =>
    ({ cityKey: key, next_date, next_date_end, status: 'upcoming' }) as unknown as IndexedEvent;

  it('gives each placed city its count, its name, its world position and its share in the next 7 days', () => {
    const out = placeLights([ev('a|x', '2026-11-09'), ev('a|x', '2026-11-15'), ev('a|x', '2026-11-16'), ev('a|x', '')], cities, places, [], TODAY, 'upcoming');
    expect(out).toHaveLength(1);
    const [x, y] = mercator([43, -79]);
    expect(out[0]).toEqual({ key: 'a|x', label: 'A', x, y, n: 4, soon: 0.5 });
  });

  it('counts an event already under way as soon, and nothing as soon when looking back', () => {
    const under = ev('a|x', '2026-11-01', '2026-11-10');
    expect(placeLights([under], cities, places, [], TODAY, 'upcoming')[0].soon).toBe(1);
    expect(placeLights([under], cities, places, [], TODAY, 'past')[0].soon).toBe(0);
  });

  it('keeps a picked place lit with no matching events, and leaves other empty places dark', () => {
    const out = placeLights([], cities, places, ['quiet|x'], TODAY, 'upcoming');
    expect(out.map((l) => [l.key, l.n, l.soon])).toEqual([['quiet|x', 0, 0]]);
  });

  it('leaves out cities with no position of their own', () => {
    expect(placeLights([ev('nowhere|x', '2026-11-10')], cities, places, ['nowhere|x'], TODAY, 'upcoming')).toEqual([]);
  });
});
