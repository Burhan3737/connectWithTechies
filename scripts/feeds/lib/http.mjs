/**
 * Polite, cached HTTP for the feed layer.
 *
 * Every source we read is someone else's server, several of them through
 * endpoints that exist for their own pages rather than for us. So:
 *
 *   - one request at a time per host, with a pause between them
 *   - an on-disk cache, so a re-run inside the TTL costs the host nothing
 *   - curl rather than fetch, because enterprise and platform WAFs answer
 *     Node's fetch with 403 while serving curl the same page (measured)
 *   - only a User-Agent header — explicit lowercase accept headers flip a
 *     200 into a 403 on WAF-protected hosts (measured on rsaconference.com)
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CACHE = join(ROOT, 'data', '.cache');
mkdirSync(CACHE, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const TTL_MS = Number(process.env.FEED_CACHE_HOURS || 6) * 3600 * 1000;
const GAP_MS = Number(process.env.FEED_HOST_GAP_MS || 1200);
// Hosts that throttle harder than the default gap allows. Eventbrite answered
// 429 after ~50 listing pages at 1.2s apart (measured on a full discovery run).
const HOST_GAP_MS = { 'www.eventbrite.com': 6000, 'www.eventbrite.ca': 6000 };
// On 429/503, wait and try again rather than record an empty page as an empty city.
const BACKOFF_MS = [30000, 90000];

const lastHit = new Map();          // host -> timestamp of last request
const hostQueue = new Map();        // host -> promise chain, so one at a time per host

export const stats = { requests: 0, cached: 0, failed: 0, throttled: 0 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cachePath(url) {
  return join(CACHE, createHash('sha1').update(url).digest('hex') + '.txt');
}

async function rawGet(url, gapMs) {
  for (let attempt = 0; ; attempt++) {
    const res = await rawGetOnce(url, gapMs);
    if ((res.status !== 429 && res.status !== 503) || attempt >= BACKOFF_MS.length) return res;
    stats.throttled++;
    await sleep(BACKOFF_MS[attempt]);
  }
}

async function rawGetOnce(url, gapMs) {
  const host = new URL(url).hostname;
  // An adapter may ask for a longer gap, never a shorter one than configured.
  const gap = Math.max(gapMs || 0, HOST_GAP_MS[host] || GAP_MS);
  const since = Date.now() - (lastHit.get(host) || 0);
  if (since < gap) await sleep(gap - since);
  lastHit.set(host, Date.now());
  stats.requests++;
  try {
    const { stdout } = await run('curl',
      ['-sSL', '--max-time', '30', '-A', UA, '-w', '\n@@STATUS:%{http_code}', url],
      { maxBuffer: 48 * 1024 * 1024 });
    const i = stdout.lastIndexOf('\n@@STATUS:');
    const status = Number(stdout.slice(i + 10)) || 0;
    return { status, body: i < 0 ? stdout : stdout.slice(0, i) };
  } catch (err) {
    stats.failed++;
    return { status: 0, body: '', error: String(err.message || err).slice(0, 160) };
  }
}

/**
 * GET with cache. Returns { status, body, fromCache }. Never throws.
 *
 *   gapMs  at least this pause between requests to this host, for a site that asks for more
 *          than the default (Bevy's robots.txt says Crawl-delay: 2)
 *   trim   body -> the part worth keeping, applied before caching so a fresh
 *          read and a cached one look alike. The cache is never pruned, and a
 *          Bevy event page is ~800 KB around ~3 KB of JSON-LD: hundreds of them
 *          a week would otherwise grow data/.cache by hundreds of MB.
 */
export function get(url, { ttlMs = TTL_MS, gapMs = 0, trim = null } = {}) {
  const p = cachePath(url);
  if (existsSync(p) && Date.now() - statSync(p).mtimeMs < ttlMs) {
    stats.cached++;
    return Promise.resolve({ status: 200, body: readFileSync(p, 'utf8'), fromCache: true });
  }
  const host = new URL(url).hostname;
  const chain = (hostQueue.get(host) || Promise.resolve()).then(async () => {
    const res = await rawGet(url, gapMs);
    const body = trim && res.body ? trim(res.body) : res.body;
    if (res.status >= 200 && res.status < 300 && body) writeFileSync(p, body, 'utf8');
    return { ...res, body, fromCache: false };
  });
  hostQueue.set(host, chain.catch(() => {}));
  return chain;
}

export async function getJSON(url, opts) {
  const res = await get(url, opts);
  if (res.status !== 200) return { ok: false, status: res.status, data: null };
  try { return { ok: true, status: 200, data: JSON.parse(res.body) }; }
  catch { return { ok: false, status: res.status, data: null }; }
}

/** Pull Next.js / Inertia page data out of HTML. */
export function pageData(html) {
  const nd = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nd) { try { return JSON.parse(nd[1]); } catch { /* fall through */ } }
  const ip = html.match(/<script[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/);
  if (ip) { try { return JSON.parse(ip[1]); } catch { /* fall through */ } }
  return null;
}

/**
 * A JSON object assigned in an inline script — `window.__SERVER_DATA__ = {...};`.
 * A regex cannot find where such an object ends, so walk it, respecting strings.
 */
export function assignedJson(html, marker) {
  const at = html.indexOf(marker);
  if (at < 0) return null;
  const start = html.indexOf('{', at);
  let depth = 0, inStr = false, esc = false;
  for (let j = start; j < html.length; j++) {
    const c = html[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      try { return JSON.parse(html.slice(start, j + 1)); } catch { return null; }
    }
  }
  return null;
}

export function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => { try { return JSON.parse(m[1]); } catch { return null; } })
    .filter(Boolean);
}

/** Depth-first search of a parsed JSON tree. */
export function findAll(node, pred, acc = []) {
  if (!node || typeof node !== 'object') return acc;
  if (pred(node)) acc.push(node);
  for (const v of Object.values(node)) findAll(v, pred, acc);
  return acc;
}
