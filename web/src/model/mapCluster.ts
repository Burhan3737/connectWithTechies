import { scaleOf, toScreen, type Size, type View } from './mapGeometry';

export interface DOMRectLike { left: number; top: number; right: number; bottom: number }

/** One place with events, in world coordinates. `soon` is its share in the next 7 days. */
export interface Light { key: string; x: number; y: number; n: number; soon: number }
export interface Cluster extends Light { own: number; more: number; moreN: number; picked: boolean }
export interface LabelBox { key: string; text: string; x: number; y: number; w: number; h: number }

/**
 * Merge lights that would sit within `radiusPx` of each other on screen. Zoom is
 * bucketed to half steps so clusters do not reshuffle on every wheel tick. The
 * biggest light leads; picked lights lead themselves and absorb nothing.
 */
export function clusterLights(
  lights: Light[], z: number, picked: ReadonlySet<string>, radiusPx: number,
): Cluster[] {
  const r = radiusPx / scaleOf(Math.round(z * 2) / 2);
  const order = lights.slice().sort((p, q) =>
    Number(picked.has(q.key)) - Number(picked.has(p.key)) || q.n - p.n || (p.key < q.key ? -1 : p.key > q.key ? 1 : 0));
  const grid = new Map<string, number[]>();
  order.forEach((l, i) => {
    const k = `${Math.floor(l.x / r)},${Math.floor(l.y / r)}`;
    const cell = grid.get(k);
    if (cell) cell.push(i); else grid.set(k, [i]);
  });
  const used = new Uint8Array(order.length);
  const out: Cluster[] = [];
  order.forEach((l, i) => {
    if (used[i]) return;
    used[i] = 1;
    const isPicked = picked.has(l.key);
    const c: Cluster = { ...l, own: l.n, more: 0, moreN: 0, picked: isPicked };
    if (!isPicked) {
      let soonSum = l.soon * l.n;
      const gx = Math.floor(l.x / r), gy = Math.floor(l.y / r);
      for (let ax = gx - 1; ax <= gx + 1; ax++) {
        for (let ay = gy - 1; ay <= gy + 1; ay++) {
          for (const j of grid.get(`${ax},${ay}`) ?? []) {
            const o = order[j];
            if (used[j] || picked.has(o.key) || Math.hypot(o.x - l.x, o.y - l.y) > r) continue;
            used[j] = 1;
            c.n += o.n; c.more++; c.moreN += o.n; soonSum += o.soon * o.n;
          }
        }
      }
      if (c.more && c.n) c.soon = soonSum / c.n;
    }
    out.push(c);
  });
  return out;
}

const LABEL_H = 17;
const LABEL_PAD = 8;
type Rect = { x: number; y: number; w: number; h: number };
const hits = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/**
 * Screen-space labels: picked places first, then the biggest lights in view, each
 * placed beside its light where it covers no other label and no zone (the page's
 * own controls), and preferably no other light. At most `max` labels. The text is
 * the cluster's key and own count; `measure` sizes it.
 */
export function layoutLabels(
  cs: Cluster[], v: View, s: Size, measure: (t: string, bold: boolean) => number,
  zones: readonly DOMRectLike[], max: number,
): LabelBox[] {
  const zk = Math.min(1.35, Math.max(0.75, 2 ** ((v.z - Math.round(v.z * 2) / 2) * 0.5)));
  const top = cs.reduce((m, c) => Math.max(m, c.n), 1);
  const phone = s.w <= 720;
  const dots = cs.map((c) => {
    const rad = ((phone ? 2.6 : 2.8) + (phone ? 8.5 : 10.5) * Math.sqrt(c.n / top)) * zk;
    const [px, py] = toScreen(v, s, c.x, c.y);
    return { c, px, py, rad, x: px - rad, y: py - rad, w: 2 * rad, h: 2 * rad };
  });
  const visible = dots.filter((d) => d.px >= 0 && d.px <= s.w && d.py >= 0 && d.py <= s.h);
  const want = [
    ...visible.filter((d) => d.c.picked),
    ...visible.filter((d) => !d.c.picked).sort((p, q) => q.c.n - p.c.n),
  ];
  const placed: LabelBox[] = [];
  for (const d of want) {
    if (placed.length >= max) break;
    const text = `${d.c.key} ${d.c.own}`;
    const w = measure(text, d.c.picked) + LABEL_PAD;
    const R = d.rad + 3;
    const spots: [number, number][] = [
      [d.px + R, d.py - LABEL_H / 2], [d.px - R - w, d.py - LABEL_H / 2],
      [d.px - w / 2, d.py + R], [d.px - w / 2, d.py - R - LABEL_H],
      [d.px + R, d.py - LABEL_H / 2 - 13], [d.px + R, d.py - LABEL_H / 2 + 13],
    ];
    let best: LabelBox | null = null;
    let bestCost = Infinity;
    spots.forEach(([x, y], i) => {
      const box: LabelBox = { key: d.c.key, text, x, y, w, h: LABEL_H };
      if (placed.some((p) => hits(box, p))) return;
      if (zones.some((z) => hits(box, { x: z.left, y: z.top, w: z.right - z.left, h: z.bottom - z.top }))) return;
      let cost = i * 0.3;
      for (const o of dots) if (o !== d && hits(box, o)) cost += o.w > 10 ? 3 : 1;
      if (cost < bestCost) { bestCost = cost; best = box; }
    });
    if (best && (d.c.picked || bestCost < 3)) placed.push(best);
  }
  return placed;
}
