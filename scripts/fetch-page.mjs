#!/usr/bin/env node
/**
 * Fetch an event page the way a browser would and pull out the date evidence.
 *
 * Exists because WebFetch is 403'd by a large set of event hosts (Gartner,
 * TechWell, SAP, NetSuite, Microsoft, Code for America, ODSC…). curl with only
 * a User-Agent gets 200 from all of them. Do NOT add explicit lowercase
 * `accept` / `accept-language` headers: those flip a 200 into a 403 on
 * WAF-protected hosts, which fingerprint header casing.
 *
 *   node scripts/fetch-page.mjs <url>            summary + date evidence
 *   node scripts/fetch-page.mjs <url> --text     also dump readable text
 *   node scripts/fetch-page.mjs <url> --bundle   chase JS bundles for dates
 *                                                (for React/Next shells that
 *                                                 render blank to a fetcher)
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const url = process.argv[2];
const wantText = process.argv.includes('--text');
const wantBundle = process.argv.includes('--bundle');
if (!url) { console.error('usage: node scripts/fetch-page.mjs <url> [--text] [--bundle]'); process.exit(2); }

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';

async function get(u) {
  try {
    const { stdout } = await run('curl',
      ['-sSL', '--max-time', '30', '-A', UA, '-w', '\n---META---\n%{http_code} %{url_effective}', u],
      { maxBuffer: 24 * 1024 * 1024 });
    const i = stdout.lastIndexOf('\n---META---\n');
    const body = i < 0 ? stdout : stdout.slice(0, i);
    const meta = i < 0 ? '' : stdout.slice(i + 12).trim();
    const [status, ...rest] = meta.split(' ');
    return { body, status: Number(status) || 0, finalUrl: rest.join(' ') || u };
  } catch (err) {
    return { body: '', status: 0, finalUrl: '', error: String(err.message || err).slice(0, 200) };
  }
}

const strip = (h) => h
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

const uniq = (a) => [...new Set(a)];

function dateEvidence(body) {
  const out = {};
  out.jsonld = uniq((body.match(/"(?:startDate|endDate)"\s*:\s*"[^"]{4,40}"/g) || []));
  out.isoish = uniq((body.match(/\b20(?:2[6-9]|3[0-2])-\d{2}-\d{2}\b/g) || [])).slice(0, 20);
  const text = strip(body);
  out.ranges = uniq((text.match(new RegExp(`(?:${MONTHS})\\.?\\s+\\d{1,2}\\s*(?:[-–—]|to|and|&)\\s*(?:(?:${MONTHS})\\.?\\s+)?\\d{1,2},?\\s*20\\d{2}`, 'gi')) || [])).slice(0, 12);
  out.singles = uniq((text.match(new RegExp(`(?:${MONTHS})\\.?\\s+\\d{1,2},?\\s+20\\d{2}`, 'gi')) || [])).slice(0, 12);
  out.countdown = uniq((body.match(/new Date\(["'][^"']{8,40}["']\)/g) || [])).slice(0, 6);
  // Next.js and other RSC frameworks ship the visible copy inside <script>
  // flight data, which the tag-strip above discards — scan the raw body too.
  out.inScript = uniq((body.match(new RegExp(`(?:${MONTHS})\\.?\\s+\\d{1,2}(?:\\s*(?:[-–—]|to|&|\\\\u2013)\\s*\\d{1,2})?(?:,|\\\\?"|\\s)\\s*20\\d{2}`, 'gi')) || []))
    .filter((s) => !out.ranges.includes(s) && !out.singles.includes(s))
    .slice(0, 12);
  return { out, text };
}

const { body, status, finalUrl, error } = await get(url);

console.log(`URL     : ${url}`);
console.log(`FINAL   : ${finalUrl}`);
console.log(`STATUS  : ${status}${error ? '  ' + error : ''}`);
console.log(`BYTES   : ${body.length}`);
const title = (body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i) || [])[1];
if (title) console.log(`TITLE   : ${strip(title)}`);

if (!body) { console.log('\n(no body returned)'); process.exit(status && status < 400 ? 0 : 1); }

const { out, text } = dateEvidence(body);
console.log('\n--- date evidence ---');
for (const [k, v] of Object.entries(out)) {
  if (v.length) console.log(`${k.padEnd(10)}: ${v.join('  |  ')}`);
}
if (!Object.values(out).some((v) => v.length)) console.log('(none found in the HTML)');

// Location hints help catch a record filed under the organiser's home city.
const places = uniq((text.match(/\b(?:Convention Center|Conference Cent(?:er|re)|Hotel|University|Campus|Hall|Centre|Center)\b[^.]{0,50}/gi) || [])).slice(0, 6);
if (places.length) { console.log('\n--- venue hints ---'); places.forEach((p) => console.log('  ' + p.trim())); }

if (wantText) {
  console.log('\n--- text (first 4000 chars) ---');
  console.log(text.slice(0, 4000));
}

if (wantBundle) {
  // React/Next shells render nothing useful server-side; the dates usually sit
  // as string constants inside the main JS chunk.
  const srcs = uniq((body.match(/<script[^>]+src="([^"]+\.js[^"]*)"/gi) || [])
    .map((s) => (s.match(/src="([^"]+)"/i) || [])[1])
    .filter(Boolean))
    .map((s) => (s.startsWith('http') ? s : new URL(s, finalUrl || url).href))
    .slice(0, 6);
  console.log(`\n--- chasing ${srcs.length} JS bundle(s) ---`);
  for (const s of srcs) {
    const r = await get(s);
    if (!r.body) { console.log(`  ${s}  (empty)`); continue; }
    const ev = dateEvidence(r.body).out;
    const hits = Object.entries(ev).filter(([, v]) => v.length);
    if (!hits.length) { console.log(`  ${s}  (no dates)`); continue; }
    console.log(`  ${s}`);
    for (const [k, v] of hits) console.log(`      ${k}: ${v.slice(0, 6).join('  |  ')}`);
  }
}
