import { circle } from '../../model/geo';
import {
  clusterLights, layoutLabels, lightRadius, topCount, zoomGrowth,
  type Cluster, type DOMRectLike, type Light,
} from '../../model/mapCluster';
import {
  cityZoom, clampView, decodeLine, fitPoints, homeView, mercator, scaleOf, toScreen, toWorld, unmercator,
  type Size, type View,
} from '../../model/mapGeometry';
import type { LatLon } from '../../model/places';
import { PHONE_QUERY } from '../../viewmodel/phoneQuery';

interface MapLevel { land: string[]; borders: string[]; states: string[]; provinces: string[]; lakes: string[] }
export interface MapData { q: number; lo: MapLevel; hi: MapLevel }
export interface MapCallbacks {
  onToggle(key: string): void;
  /** `byKeys`: the light is the one under the keyboard's cross, not under the pointer. */
  onHover(key: string | null, byKeys: boolean): void;
  onSettle(v: View): void;
  /** The light under the keyboard's cross. `pressed`: Enter or Space found nothing there to toggle. */
  onCross(light: Cluster | null, pressed: boolean): void;
}

/** A light as last drawn, in screen pixels. */
export interface DrawnLight { cluster: Cluster; x: number; y: number; r: number }

interface Base { canvas: HTMLCanvasElement; x0: number; y0: number; scale: number; w: number; h: number; z: number }
interface Geo { land: Path2D; lakes: Path2D; borders: Path2D; lines: Path2D }
interface Anim { from: View; to: View; t0: number; ms: number }
interface Inertia { vx: number; vy: number; t: number }
interface Drag { x: number; y: number; vx: number; vy: number; t: number }
interface Pinch { d: number; z: number; world: [number, number] }
interface Press { x: number; y: number; type: string; moved: boolean }
interface Tap { x: number; y: number; t: number }
interface PlacedLabel { cluster: Cluster; text: string; dx: number; dy: number; w: number; h: number }

const SEA = '#04070a';
const HIT_MOUSE = 12;
const HIT_TOUCH = 22;
const SETTLE_MS = 160;
const MIN_REBASE_MS = 140;
/** Under this zoom the coarser outlines look the same and draw far faster. */
const DETAIL_Z = 5.4;
/** Roughly a city and its surroundings, when fitting to a single point. */
const CITY_KM = 260;
const FIT_PAD_DESKTOP = 70;
const FIT_PAD_PHONE = 36;
const MAX_LABELS_DESKTOP = 30;
const MAX_LABELS_PHONE = 12;
/** How close to the keyboard's cross a light has to be, in px, to be the one under it. */
const CROSS_REACH = 48;
const KEY_STEP = 90;
const KEY_STEP_LARGE = 240;
/** After the keys stop: long enough that holding an arrow doesn't read every light it passes. */
const CROSS_READ_MS = 180;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const labelFont = (bold: boolean) => `${bold ? 700 : 400} 13px B612, "B612 fallback", system-ui, sans-serif`;

function pathOf(lines: string[], closed: boolean): Path2D {
  const p = new Path2D();
  for (const line of lines) {
    // Quantised units, not unit-world ones: Path2D keeps these precise at every zoom.
    const a = decodeLine(line, 1);
    p.moveTo(a[0], a[1]);
    for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]);
    if (closed) p.closePath();
  }
  return p;
}

function sprite(core: string, mid: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.16, core); g.addColorStop(0.38, mid); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return c;
}

/**
 * The map on a canvas. Speed comes from three rules: the land is rasterised once
 * into an oversized bitmap that a drag only moves, lights are pre-drawn sprites
 * (never shadowBlur or filters), and a frame is requested only when something
 * has changed, so an idle map costs nothing.
 */
export class MapEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly phone = window.matchMedia(PHONE_QUERY);
  private readonly coarse = window.matchMedia('(pointer: coarse)');
  private readonly levels: { lo?: Geo; hi?: Geo } = {};
  private readonly sodium = sprite('#ffd29a', 'rgba(255,150,60,.45)');
  private readonly led = sprite('#f2f7ff', 'rgba(160,200,255,.42)');
  private readonly resizes = new ResizeObserver(() => this.resize());
  private readonly widths = new Map<string, number>();
  private readonly pointers = new Map<number, [number, number]>();

  private v: View = { x: 0.5, y: 0.5, z: 3 };
  private w = 0;
  private h = 0;
  private dpr = 1;
  private base: Base | null = null;
  private baseAt = 0;

  private lights: Light[] = [];
  private picked = new Set<string>();
  private rings: Float64Array[] = [];
  private clusters: Cluster[] = [];
  private byKey = new Map<string, Cluster>();
  private bucket = 3;
  private clusterKey = '';
  private lightsChanged = false;
  private top = 1;
  private labels: PlacedLabel[] = [];
  private labelZ = 3;
  private drawn: DrawnLight[] = [];
  private zones: DOMRectLike[] = [];
  private hot: string | null = null;
  private hotByKeys = false;
  private keyboard = false;
  private keyTimer = 0;

  private frameId = 0;
  private settleTimer = 0;
  private anim: Anim | null = null;
  private inertia: Inertia | null = null;
  private drag: Drag | null = null;
  private pinch: Pinch | null = null;
  private press: Press | null = null;
  private lastTap: Tap | null = null;
  private wheelAt = 0;
  private pageScrollAt = 0;
  private settled = '';
  private destroyed = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
    private readonly data: MapData,
    private readonly cb: MapCallbacks,
    private readonly reducedMotion: boolean,
  ) {
    this.ctx = canvas.getContext('2d')!;
    host.addEventListener('pointerdown', this.onPointerDown);
    host.addEventListener('pointermove', this.onPointerMove);
    host.addEventListener('pointerup', this.onPointerUp);
    host.addEventListener('pointercancel', this.onPointerUp);
    host.addEventListener('pointerleave', this.onPointerLeave);
    host.addEventListener('dblclick', this.onDoubleClick);
    host.addEventListener('wheel', this.onWheel, { passive: false });
    host.addEventListener('keydown', this.onKeyDown);
    host.addEventListener('focus', this.onFocus);
    host.addEventListener('blur', this.onBlur);
    window.addEventListener('scroll', this.onPageScroll, { passive: true });
    this.phone.addEventListener('change', this.onPhoneChange);
    this.resizes.observe(host);
    this.resize();
    document.fonts?.ready.then(() => {
      if (this.destroyed) return;
      this.widths.clear();
      this.layout();
      this.invalidate();
    });
  }

  setLights(lights: Light[]): void {
    this.lights = lights;
    this.lightsChanged = true;
    this.invalidate();
  }

  setPicked(keys: readonly string[]): void {
    this.picked = new Set(keys);
    this.lightsChanged = true;
    this.invalidate();
  }

  setRings(rings: LatLon[][]): void {
    this.rings = rings.map((ring) => {
      const flat = new Float64Array(ring.length * 2);
      ring.forEach((p, i) => { [flat[i * 2], flat[i * 2 + 1]] = mercator(p); });
      return flat;
    });
    this.invalidate();
  }

  flyTo(v: View, ms = 650): void {
    this.moveTo(v, ms);
  }

  zoomBy(delta: number): void {
    this.zoomAt(this.w / 2, this.h / 2, this.v.z + delta, 260);
  }

  fitHome(): void {
    this.moveTo(homeView(this.size, this.isPhone), 600);
  }

  /** Bring these places into view, and their `km` radius if any. `ms` is 0 to be there at once. */
  fitTo(points: LatLon[], ms = 600, km = 0): void {
    const around = km ? points.flatMap((p) => circle(p, km, 16)) : points.length === 1 ? circle(points[0], CITY_KM, 8) : points;
    this.moveTo(this.framing(around, points[0][0]), ms);
  }

  /** Where to look at one place: close enough to read it, without pulling back if already closer. */
  cityView(at: LatLon): View {
    const [x, y] = mercator(at);
    return { x, y, z: Math.max(this.v.z, cityZoom(at[0], this.w)) };
  }

  /** Keep every ring whole on screen, moving only when one is cut off or the fit is wider than the view. */
  revealRings(centres: LatLon[], km: number): void {
    const around = centres.flatMap((c) => circle(c, km, 16));
    const fit = this.framing(around, centres[0][0]);
    const whole = around.every((p) => {
      const [x, y] = mercator(p);
      const [sx, sy] = toScreen(this.v, this.size, x, y);
      return sx >= 0 && sy >= 0 && sx <= this.w && sy <= this.h;
    });
    if (fit.z < this.v.z - 0.05 || !whole) this.moveTo(fit, 600);
  }

  /** Where a place's light was last drawn, if it is on screen. */
  drawnLight(key: string): DrawnLight | null {
    return this.drawn.find((d) => d.cluster.key === key) ?? null;
  }

  /** Measures the host again. Doing nothing when it has not changed is what makes this safe to call from an observer. */
  resize(): void {
    const r = this.host.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!w || !h || (w === this.w && h === this.h && dpr === this.dpr)) return;
    const first = !this.w;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    if (first) this.v = homeView(this.size, this.isPhone);
    this.v = clampView(this.v, this.size, this.isPhone);
    this.measureZones(r);
    this.base = null;
    this.cluster(true);
    this.draw();
    if (first) this.notifySettled();
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.settleTimer);
    clearTimeout(this.keyTimer);
    this.resizes.disconnect();
    this.host.removeEventListener('pointerdown', this.onPointerDown);
    this.host.removeEventListener('pointermove', this.onPointerMove);
    this.host.removeEventListener('pointerup', this.onPointerUp);
    this.host.removeEventListener('pointercancel', this.onPointerUp);
    this.host.removeEventListener('pointerleave', this.onPointerLeave);
    this.host.removeEventListener('dblclick', this.onDoubleClick);
    this.host.removeEventListener('wheel', this.onWheel);
    this.host.removeEventListener('keydown', this.onKeyDown);
    this.host.removeEventListener('focus', this.onFocus);
    this.host.removeEventListener('blur', this.onBlur);
    window.removeEventListener('scroll', this.onPageScroll);
    this.phone.removeEventListener('change', this.onPhoneChange);
  }

  /** The view that fits these points, never closer than one city's surroundings at `lat`. */
  private framing(around: LatLon[], lat: number): View {
    const v = fitPoints(around, this.size, this.isPhone ? FIT_PAD_PHONE : FIT_PAD_DESKTOP, this.isPhone);
    return { ...v, z: Math.min(v.z, cityZoom(lat, this.w)) };
  }

  private get size(): Size { return { w: this.w, h: this.h }; }
  private get isPhone(): boolean { return this.phone.matches; }

  // ---- the base map -------------------------------------------------------

  private geo(level: 'lo' | 'hi'): Geo {
    const known = this.levels[level];
    if (known) return known;
    const d = this.data[level];
    const geo = {
      land: pathOf(d.land, true), lakes: pathOf(d.lakes, true),
      borders: pathOf(d.borders, false), lines: pathOf(d.states.concat(d.provinces), false),
    };
    this.levels[level] = geo;
    return geo;
  }

  /** Draw the land at this zoom into a bitmap twice the map's size, so a drag has margin to move through. */
  private renderBase(): void {
    const scale = scaleOf(this.v.z), dpr = this.dpr, w = Math.ceil(this.w * 2), h = Math.ceil(this.h * 2);
    const canvas = this.base?.canvas ?? document.createElement('canvas');
    const pxW = Math.round(w * dpr), pxH = Math.round(h * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) { canvas.width = pxW; canvas.height = pxH; }
    const x0 = this.v.x - w / 2 / scale, y0 = this.v.y - h / 2 / scale, k = scale / this.data.q, px = 1 / k;
    const g = canvas.getContext('2d')!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = SEA;
    g.fillRect(0, 0, pxW, pxH);
    g.setTransform(dpr * k, 0, 0, dpr * k, -x0 * scale * dpr, -y0 * scale * dpr);
    const geo = this.geo(this.v.z < DETAIL_Z ? 'lo' : 'hi');
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.fillStyle = '#121b21'; g.fill(geo.land, 'evenodd');
    g.strokeStyle = 'rgba(150, 190, 205, .42)'; g.lineWidth = px; g.stroke(geo.land);
    g.fillStyle = SEA; g.fill(geo.lakes, 'nonzero');
    g.strokeStyle = 'rgba(130, 180, 215, .38)'; g.lineWidth = 0.9 * px; g.stroke(geo.lakes);
    g.strokeStyle = 'rgba(190, 204, 214, .17)'; g.lineWidth = 0.8 * px; g.stroke(geo.lines);
    g.strokeStyle = 'rgba(222, 205, 160, .5)'; g.lineWidth = 1.3 * px; g.stroke(geo.borders);
    this.base = { canvas, x0, y0, scale, w, h, z: this.v.z };
    this.baseAt = performance.now();
  }

  private baseCovers(scale: number): boolean {
    const b = this.base;
    if (!b) return false;
    const k = scale / b.scale;
    const ox = (b.x0 - this.v.x) * scale + this.w / 2, oy = (b.y0 - this.v.y) * scale + this.h / 2;
    return ox <= 0.5 && oy <= 0.5 && ox + b.w * k >= this.w - 0.5 && oy + b.h * k >= this.h - 0.5;
  }

  private get moving(): boolean {
    return !!(this.drag || this.pinch || this.anim || this.inertia || performance.now() - this.wheelAt < SETTLE_MS);
  }

  // ---- lights and labels --------------------------------------------------

  /** Clusters change only with the zoom bucket, the lights, the picks or the layout. Returns whether they changed. */
  private cluster(force: boolean): boolean {
    const bucket = Math.round(this.v.z * 2) / 2;
    const key = `${bucket}|${this.isPhone}`;
    if (!force && !this.lightsChanged && key === this.clusterKey) return false;
    this.clusterKey = key;
    this.bucket = bucket;
    this.lightsChanged = false;
    this.clusters = clusterLights(this.lights, bucket, this.picked, this.isPhone || this.coarse.matches ? 30 : 24);
    this.byKey = new Map(this.clusters.map((c) => [c.key, c]));
    this.top = topCount(this.clusters);
    this.layout();
    return true;
  }

  private measureText = (text: string, bold: boolean): number => {
    const key = (bold ? 'b' : 'r') + text;
    let width = this.widths.get(key);
    if (width === undefined) {
      this.ctx.font = labelFont(bold);
      width = this.ctx.measureText(text).width;
      this.widths.set(key, width);
    }
    return width;
  };

  private layout(): void {
    if (!this.w) return;
    const boxes = layoutLabels(
      this.clusters, this.v, this.size, this.measureText, this.zones,
      this.isPhone ? MAX_LABELS_PHONE : MAX_LABELS_DESKTOP, this.isPhone,
    );
    this.labelZ = this.v.z;
    this.labels = boxes.map((b) => {
      const cluster = this.byKey.get(b.key)!;
      const [px, py] = toScreen(this.v, this.size, cluster.x, cluster.y);
      return { cluster, text: b.text, dx: b.x - px, dy: b.y - py, w: b.w, h: b.h };
    });
  }

  private measureZones(hostRect: DOMRect): void {
    const frame = this.host.parentElement;
    if (!frame) return;
    this.zones = [...frame.querySelectorAll('.map__find, .map__zoom, .map__attr')]
      .filter((el) => el.getClientRects().length)
      .map((el) => {
        const q = el.getBoundingClientRect();
        return { left: q.left - hostRect.left - 4, top: q.top - hostRect.top - 4, right: q.right - hostRect.left + 4, bottom: q.bottom - hostRect.top + 4 };
      });
  }

  // ---- drawing: one frame on demand ---------------------------------------

  private invalidate(): void {
    if (!this.frameId && !this.destroyed) this.frameId = requestAnimationFrame(this.frame);
  }

  private frame = (now: number): void => {
    this.frameId = 0;
    if (this.lightsChanged) this.cluster(true);
    if (this.anim) this.stepAnim(now);
    if (this.inertia) this.stepInertia(now);
    this.draw();
    if (this.anim || this.inertia) this.frameId = requestAnimationFrame(this.frame);
  };

  private draw(): void {
    if (!this.w) return;
    const { ctx, w, h, dpr, v } = this;
    const scale = scaleOf(v.z);
    const stale = !this.base || (!this.baseCovers(scale) && (!this.moving || performance.now() - this.baseAt > MIN_REBASE_MS));
    if (stale || (this.base!.z !== v.z && !this.moving)) this.renderBase();
    const base = this.base!;
    if (base.z !== v.z) this.settleSoon();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = SEA;
    ctx.fillRect(0, 0, w, h);
    const k = scale / base.scale;
    ctx.drawImage(base.canvas, (base.x0 - v.x) * scale + w / 2, (base.y0 - v.y) * scale + h / 2, base.w * k, base.h * k);

    this.drawRings(scale);
    this.drawLights(scale);
    this.drawMarks();
    this.drawLabels(scale);
    if (this.keyboard) this.drawCross();
  }

  /** The keyboard's aim: Enter toggles the light under it. */
  private drawCross(): void {
    const { ctx } = this;
    const cx = this.w / 2, cy = this.h / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, .9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      ctx.moveTo(cx + dx * 4, cy + dy * 4);
      ctx.lineTo(cx + dx * 10, cy + dy * 10);
    }
    ctx.stroke();
  }

  private drawRings(scale: number): void {
    if (!this.rings.length) return;
    const { ctx, w, h, v } = this;
    ctx.beginPath();
    for (const ring of this.rings) {
      for (let i = 0; i < ring.length; i += 2) {
        const sx = (ring[i] - v.x) * scale + w / 2, sy = (ring[i + 1] - v.y) * scale + h / 2;
        if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
      }
      ctx.closePath();
    }
    ctx.fillStyle = 'rgba(163, 227, 180, .07)';
    ctx.fill('nonzero');
    ctx.strokeStyle = 'rgba(163, 227, 180, .7)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  private drawLights(scale: number): void {
    const { ctx, w, h, v } = this;
    const growth = zoomGrowth(v.z, this.bucket);
    const drawn: DrawnLight[] = [];
    for (const c of this.clusters) {
      const x = (c.x - v.x) * scale + w / 2, y = (c.y - v.y) * scale + h / 2;
      if (x < -30 || y < -30 || x > w + 30 || y > h + 30) continue;
      const r = lightRadius(c.n, this.top, growth, this.isPhone);
      drawn.push({ cluster: c, x, y, r });
      // Sodium amber; the share of events in the next seven days whitens the core.
      const s = r * 4.4, white = Math.min(1, 2.6 * c.soon);
      ctx.globalAlpha = 1 - 0.35 * white;
      ctx.drawImage(this.sodium, x - s / 2, y - s / 2, s, s);
      if (white > 0.04) {
        ctx.globalAlpha = white;
        ctx.drawImage(this.led, x - s * 0.42, y - s * 0.42, s * 0.84, s * 0.84);
      }
    }
    ctx.globalAlpha = 1;
    this.drawn = drawn;
  }

  /** Rings round the picked lights and the one under the pointer. */
  private drawMarks(): void {
    const { ctx } = this;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffc27e';
    for (const d of this.drawn) {
      if (!d.cluster.picked) continue;
      ctx.beginPath();
      ctx.arc(d.x, d.y, Math.max(8, d.r + 5), 0, Math.PI * 2);
      ctx.stroke();
    }
    const hot = this.hot ? this.drawnLight(this.hot) : null;
    if (hot) {
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hot.x, hot.y, Math.max(10, hot.r + 8), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /** Labels ride with their lights; mid-zoom only picked ones show, until the layout after the zoom. */
  private drawLabels(scale: number): void {
    const { ctx, w, h, v } = this;
    const zooming = Math.abs(v.z - this.labelZ) > 0.12;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    for (const l of this.labels) {
      const c = l.cluster;
      let x = (c.x - v.x) * scale + w / 2 + l.dx;
      const y = (c.y - v.y) * scale + h / 2 + l.dy;
      const mid = y + l.h / 2;
      if (c.picked) x = Math.max(4, Math.min(w - 4 - l.w, x));
      else if (zooming || x < 4 || x + l.w > w - 4 || mid < 12 || mid > h - 12) continue;
      else if (this.zones.some((z) => x < z.right && x + l.w > z.left && y < z.bottom && y + l.h > z.top)) continue;
      ctx.font = labelFont(c.picked);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(4, 7, 10, .92)';
      ctx.strokeText(l.text, x + 4, mid);
      ctx.fillStyle = c.picked ? '#ffd7a8' : c.key === this.hot ? '#ffffff' : '#e3e9ee';
      ctx.fillText(l.text, x + 4, mid);
    }
  }

  // ---- motion -------------------------------------------------------------

  /** After a gesture: sharpen the land, re-cluster, re-lay labels and report the view. */
  private settleSoon(): void {
    clearTimeout(this.settleTimer);
    this.settleTimer = window.setTimeout(() => {
      if (this.drag || this.anim || this.inertia || this.pinch) { this.settleSoon(); return; }
      if (this.base && this.base.z !== this.v.z) this.renderBase();
      if (!this.cluster(false)) this.layout();
      this.invalidate();
      this.notifySettled();
    }, SETTLE_MS);
  }

  private notifySettled(): void {
    const [lat, lon] = unmercator(this.v.x, this.v.y);
    const center = `${lat.toFixed(4)},${lon.toFixed(4)}`, zoom = this.v.z.toFixed(2);
    if (`${center}@${zoom}` === this.settled) return;
    this.settled = `${center}@${zoom}`;
    this.host.dataset.center = center;
    this.host.dataset.zoom = zoom;
    this.cb.onSettle({ ...this.v });
  }

  private moveTo(target: View, ms: number): void {
    const to = clampView(target, this.size, this.isPhone);
    this.inertia = null;
    if (this.reducedMotion || !ms) {
      this.anim = null;
      this.v = to;
      this.invalidate();
      this.settleSoon();
      return;
    }
    this.anim = { from: { ...this.v }, to, t0: 0, ms };
    this.invalidate();
  }

  private stepAnim(now: number): void {
    const a = this.anim!;
    if (!a.t0) a.t0 = now;
    const t = Math.min(1, (now - a.t0) / a.ms), e = easeInOut(t);
    // Long moves pull out a little on the way, so you see where you are going.
    const dist = (Math.hypot(a.to.x - a.from.x, a.to.y - a.from.y) * scaleOf(Math.min(a.from.z, a.to.z))) / Math.max(this.w, 1);
    const hop = Math.min(1.2, dist * 0.6) * Math.sin(Math.PI * t);
    this.v = { x: a.from.x + (a.to.x - a.from.x) * e, y: a.from.y + (a.to.y - a.from.y) * e, z: a.from.z + (a.to.z - a.from.z) * e - hop };
    if (t >= 1) { this.anim = null; this.v = a.to; this.settleSoon(); }
  }

  private stepInertia(now: number): void {
    const i = this.inertia!, dt = Math.min(40, now - i.t), scale = scaleOf(this.v.z);
    i.t = now;
    this.v = clampView({ x: this.v.x - (i.vx * dt) / scale, y: this.v.y - (i.vy * dt) / scale, z: this.v.z }, this.size, this.isPhone);
    const friction = 0.992 ** dt;
    i.vx *= friction; i.vy *= friction;
    if (Math.hypot(i.vx, i.vy) < 0.02) { this.inertia = null; this.settleSoon(); }
  }

  private zoomAt(px: number, py: number, z: number, ms: number): void {
    const [wx, wy] = toWorld(this.v, this.size, px, py);
    const nz = clampView({ ...this.v, z }, this.size, this.isPhone).z, scale = scaleOf(nz);
    this.moveTo({ x: wx - (px - this.w / 2) / scale, y: wy - (py - this.h / 2) / scale, z: nz }, ms);
  }

  // ---- input --------------------------------------------------------------

  private at(ev: PointerEvent | MouseEvent): [number, number] {
    const r = this.canvas.getBoundingClientRect();
    return [ev.clientX - r.left, ev.clientY - r.top];
  }

  private nearest(px: number, py: number, reach: number): Cluster | null {
    let best: Cluster | null = null, gap = Infinity;
    for (const d of this.drawn) {
      const g = Math.hypot(d.x - px, d.y - py) - d.r;
      if (g < gap) { gap = g; best = d.cluster; }
    }
    return gap <= reach ? best : null;
  }

  private setHot(key: string | null, byKeys = false): void {
    if (key === this.hot && byKeys === this.hotByKeys) return;
    this.hot = key;
    this.hotByKeys = byKeys;
    this.invalidate();
    this.cb.onHover(key, byKeys);
  }

  /** The light under the cross. Draws first, so a move the keys just made counts. */
  private crossLight(): Cluster | null {
    this.draw();
    return this.nearest(this.w / 2, this.h / 2, CROSS_REACH);
  }

  private readCross = (): void => {
    const light = this.crossLight();
    this.setHot(light?.key ?? null, true);
    this.cb.onCross(light, false);
  };

  private onFocus = (): void => {
    if (!this.host.matches(':focus-visible')) return;
    this.keyboard = true;
    this.readCross();
  };

  private onBlur = (): void => {
    clearTimeout(this.keyTimer);
    if (!this.keyboard) return;
    this.keyboard = false;
    this.setHot(null);
    this.invalidate();
  };

  private onKeyDown = (ev: KeyboardEvent): void => {
    // Browser shortcuts (zoom the page, go back) pass straight through.
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const { x, y, z } = this.v;
    const step = (ev.shiftKey ? KEY_STEP_LARGE : KEY_STEP) / scaleOf(z);
    switch (ev.key) {
      case 'ArrowLeft': this.moveTo({ x: x - step, y, z }, 0); break;
      case 'ArrowRight': this.moveTo({ x: x + step, y, z }, 0); break;
      case 'ArrowUp': this.moveTo({ x, y: y - step, z }, 0); break;
      case 'ArrowDown': this.moveTo({ x, y: y + step, z }, 0); break;
      case '+': case '=': case 'PageUp': this.moveTo({ x, y, z: z + 1 }, 0); break;
      case '-': case '_': case 'PageDown': this.moveTo({ x, y, z: z - 1 }, 0); break;
      case 'Home': this.moveTo(homeView(this.size, this.isPhone), 0); break;
      case 'Enter': case ' ': {
        ev.preventDefault();
        // Held down, one press is still one toggle.
        if (ev.repeat) return;
        this.keyboard = true;
        const light = this.crossLight();
        if (light) { this.cb.onToggle(light.key); this.setHot(light.key, true); } else this.cb.onCross(null, true);
        this.invalidate();
        return;
      }
      default: return;
    }
    ev.preventDefault();
    this.keyboard = true;
    clearTimeout(this.keyTimer);
    this.keyTimer = window.setTimeout(this.readCross, CROSS_READ_MS);
  };

  private pointerPair(): [[number, number], [number, number]] {
    const [a, b] = [...this.pointers.values()];
    return [a, b];
  }

  private onPointerDown = (ev: PointerEvent): void => {
    if (ev.button > 0) return;
    this.host.setPointerCapture(ev.pointerId);
    const p = this.at(ev);
    this.pointers.set(ev.pointerId, p);
    // A stopped glide or flight no longer settles itself, and a plain click after it would not either.
    if (this.anim || this.inertia) this.settleSoon();
    this.anim = null;
    this.inertia = null;
    const now = performance.now();
    if (this.pointers.size === 1) {
      this.press = { x: p[0], y: p[1], type: ev.pointerType, moved: false };
      this.drag = { x: p[0], y: p[1], vx: 0, vy: 0, t: now };
    } else if (this.pointers.size === 2) {
      const [a, b] = this.pointerPair();
      this.drag = null;
      if (this.press) this.press.moved = true;
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      this.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, z: this.v.z, world: toWorld(this.v, this.size, mid[0], mid[1]) };
    }
  };

  private onPointerMove = (ev: PointerEvent): void => {
    const p = this.at(ev);
    if (!this.pointers.has(ev.pointerId)) {
      if (ev.pointerType === 'mouse') {
        const c = this.nearest(p[0], p[1], HIT_MOUSE);
        this.setHot(c?.key ?? null);
        this.host.style.cursor = c ? 'pointer' : '';
      }
      return;
    }
    this.pointers.set(ev.pointerId, p);
    if (this.pinch && this.pointers.size >= 2) { this.pinchTo(); return; }
    const g = this.drag;
    if (!g) return;
    const dx = p[0] - g.x, dy = p[1] - g.y, press = this.press;
    if (press && !press.moved && Math.hypot(p[0] - press.x, p[1] - press.y) < (press.type === 'mouse' ? 4 : 8)) return;
    if (press) press.moved = true;
    this.setHot(null);
    const now = performance.now(), dt = Math.max(1, now - g.t), scale = scaleOf(this.v.z);
    g.vx = 0.7 * (dx / dt) + 0.3 * g.vx;
    g.vy = 0.7 * (dy / dt) + 0.3 * g.vy;
    g.t = now; g.x = p[0]; g.y = p[1];
    this.v = clampView({ x: this.v.x - dx / scale, y: this.v.y - dy / scale, z: this.v.z }, this.size, this.isPhone);
    this.host.classList.add('is-dragging');
    this.invalidate();
  };

  private pinchTo(): void {
    const [a, b] = this.pointerPair();
    const pinch = this.pinch!;
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const z = clampView({ ...this.v, z: pinch.z + Math.log2(d / pinch.d) }, this.size, this.isPhone).z, scale = scaleOf(z);
    this.v = clampView({ x: pinch.world[0] - (mx - this.w / 2) / scale, y: pinch.world[1] - (my - this.h / 2) / scale, z }, this.size, this.isPhone);
    this.invalidate();
  }

  private onPointerUp = (ev: PointerEvent): void => {
    if (!this.pointers.has(ev.pointerId)) return;
    this.pointers.delete(ev.pointerId);
    if (this.pointers.size === 1 && this.pinch) {
      this.pinch = null;
      const [only] = this.pointers.values();
      this.drag = { x: only[0], y: only[1], vx: 0, vy: 0, t: performance.now() };
      return;
    }
    if (this.pointers.size) return;
    this.pinch = null;
    this.host.classList.remove('is-dragging');
    const g = this.drag, press = this.press;
    this.drag = null;
    this.press = null;
    if (ev.type === 'pointercancel') { this.settleSoon(); return; }
    if (press && !press.moved) { this.tap(this.at(ev), press.type !== 'mouse'); return; }
    if (g && !this.reducedMotion && performance.now() - g.t < 60 && Math.hypot(g.vx, g.vy) > 0.25) {
      this.inertia = { vx: g.vx, vy: g.vy, t: performance.now() };
      this.invalidate();
    } else {
      this.settleSoon();
    }
  };

  private tap([x, y]: [number, number], touch: boolean): void {
    const c = this.nearest(x, y, touch ? HIT_TOUCH : HIT_MOUSE);
    if (c) {
      this.lastTap = null;
      this.cb.onToggle(c.key);
      if (touch) this.setHot(null);
      return;
    }
    if (!touch) return;
    const now = performance.now(), last = this.lastTap;
    if (last && now - last.t < 320 && Math.hypot(x - last.x, y - last.y) < 30) {
      this.lastTap = null;
      this.zoomAt(x, y, this.v.z + 1, 300);
    } else {
      this.lastTap = { x, y, t: now };
    }
  }

  private onPointerLeave = (ev: PointerEvent): void => {
    if (ev.pointerType !== 'mouse' || this.drag) return;
    this.setHot(null);
    this.host.style.cursor = '';
  };

  private onDoubleClick = (ev: MouseEvent): void => {
    const [x, y] = this.at(ev);
    if (this.nearest(x, y, HIT_MOUSE)) return;
    ev.preventDefault();
    this.zoomAt(x, y, this.v.z + 1, 300);
  };

  /** Zooms the map, except while the page is already scrolling under the pointer. */
  private onWheel = (ev: WheelEvent): void => {
    const now = performance.now();
    if (now - this.pageScrollAt < 300 && !ev.ctrlKey) return;
    ev.preventDefault();
    const [x, y] = this.at(ev);
    const dy = ev.deltaMode === 1 ? ev.deltaY * 33 : ev.deltaMode === 2 ? ev.deltaY * 400 : ev.deltaY;
    const dz = Math.max(-0.7, Math.min(0.7, -dy * (ev.ctrlKey ? 0.012 : 0.0024)));
    this.wheelAt = now;
    this.anim = null;
    this.inertia = null;
    const [wx, wy] = toWorld(this.v, this.size, x, y);
    const z = clampView({ ...this.v, z: this.v.z + dz }, this.size, this.isPhone).z, scale = scaleOf(z);
    this.v = clampView({ x: wx - (x - this.w / 2) / scale, y: wy - (y - this.h / 2) / scale, z }, this.size, this.isPhone);
    this.setHot(null);
    this.invalidate();
    this.settleSoon();
  };

  private onPageScroll = (): void => {
    this.pageScrollAt = performance.now();
  };

  private onPhoneChange = (): void => {
    this.lightsChanged = true;
    this.base = null;
    this.invalidate();
  };
}
