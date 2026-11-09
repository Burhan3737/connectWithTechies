import { describe, expect, it } from 'vitest';
import { clusterLights, layoutLabels, type Cluster, type LabelBox } from './mapCluster';
import { fitPoints, toScreen } from './mapGeometry';

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
  const v = fitPoints([[40, -80], [44, -75]], s, 40);
  const manyClusters: Cluster[] = Array.from({ length: 60 }, (_, i) => ({
    key: `c${i}`, x: 0.28 + (i % 10) * 0.0016, y: 0.37 + Math.floor(i / 10) * 0.0016,
    n: 60 - i, soon: 0, own: 60 - i, more: 0, moreN: 0, picked: i === 7,
  }));
  const overlap = (p: LabelBox, q: LabelBox) =>
    p.x < q.x + q.w && p.x + p.w > q.x && p.y < q.y + q.h && p.y + p.h > q.y;

  it('never overlaps, never sits under a zone, and respects the cap', () => {
    const boxes = layoutLabels(manyClusters, v, s, () => 60, [], 12);
    expect(boxes.length).toBeGreaterThan(0);
    expect(boxes.length).toBeLessThanOrEqual(12);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j])).toBe(false);
    }
  });

  it('keeps labels out of a zone placed where they would otherwise fall', () => {
    const free = layoutLabels(manyClusters, v, s, () => 60, [], 12);
    const first = free[0];
    const zone = { left: first.x - 1, top: first.y - 1, right: first.x + first.w + 1, bottom: first.y + first.h + 1 };
    const rect = { key: '', text: '', x: zone.left, y: zone.top, w: zone.right - zone.left, h: zone.bottom - zone.top };
    expect(free.some((q) => overlap(q, rect))).toBe(true);
    const zoned = layoutLabels(manyClusters, v, s, () => 60, [zone], 12);
    expect(zoned.length).toBeGreaterThan(0);
    expect(zoned.some((q) => overlap(q, rect))).toBe(false);
  });

  it('labels a picked city first, in bold width, even among many', () => {
    const seen: boolean[] = [];
    const boxes = layoutLabels(manyClusters, v, s, (_t, bold) => { seen.push(bold); return 60; }, [], 3);
    expect(boxes.map((q) => q.key)).toContain('c7');
    expect(seen).toContain(true);
  });

  it('skips lights that are off screen', () => {
    const off: Cluster = { ...manyClusters[0], key: 'far', x: 0.9, y: 0.9 };
    const [px] = toScreen(v, s, off.x, off.y);
    expect(px).toBeGreaterThan(800);
    expect(layoutLabels([off], v, s, () => 60, [], 5)).toEqual([]);
  });
});
