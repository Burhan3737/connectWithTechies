#!/usr/bin/env node
/**
 * How much of the dataset can a script maintain without an agent?
 *
 * Samples event URLs and reports which yield a machine-readable date. The
 * answer decides how much of the refresh loop can be deterministic: anything
 * with a stable extractor never needs an agent again, and agents can be spent
 * on discovery instead of re-reading pages we already know how to read.
 *
 *   node scripts/probe-extractors.mjs            sample 80
 *   node scripts/probe-extractors.mjs --all      every event (slow)
 *   node scripts/probe-extractors.mjs --n 200
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { today as todayInDirectory } from '../../scripts/lib/today.mjs';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { events } = JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8'));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const all = process.argv.includes('--all');
const nArg = process.argv.indexOf('--n');
const N = all ? events.length : (nArg > -1 ? Number(process.argv[nArg + 1]) : 80);
const CONC = Number(process.env.CONCURRENCY || 6);

async function fetchBody(url) {
  try {
    const { stdout } = await run('curl',
      ['-sSL', '--max-time', '25', '-A', UA, url],
      { maxBuffer: 24 * 1024 * 1024 });
    return stdout || '';
  } catch { return ''; }
}

/**
 * Extractors, tried in order. Each returns { start, end } or null.
 * These are deliberately narrow — a wrong date is worse than no date, so an
 * extractor either recognises the shape it was written for or declines.
 */
const EXTRACTORS = [
  {
    id: 'jsonld',
    // schema.org Event markup. The best case: unambiguous and stable.
    run(body) {
      const m = [...body.matchAll(/"startDate"\s*:\s*"(\d{4}-\d{2}-\d{2})[^"]*"(?:[\s\S]{0,400}?"endDate"\s*:\s*"(\d{4}-\d{2}-\d{2})[^"]*")?/g)];
      if (!m.length) return null;
      // Prefer the earliest future start; a page may list several events.
      const today = todayInDirectory();
      const future = m.map((x) => ({ start: x[1], end: x[2] || x[1] }))
        .filter((x) => x.start >= today)
        .sort((a, b) => a.start.localeCompare(b.start));
      return future[0] || null;
    },
  },
  {
    id: 'meetup-nextevent',
    // Meetup embeds upcoming events as JSON in __NEXT_DATA__.
    run(body) {
      const m = body.match(/"dateTime"\s*:\s*"(\d{4}-\d{2}-\d{2})T/);
      return m ? { start: m[1], end: m[1] } : null;
    },
  },
  {
    id: 'og-date',
    run(body) {
      const m = body.match(/<meta[^>]+property="event:start_time"[^>]+content="(\d{4}-\d{2}-\d{2})/i);
      return m ? { start: m[1], end: m[1] } : null;
    },
  },
];

function extract(body) {
  for (const ex of EXTRACTORS) {
    const hit = ex.run(body);
    if (hit) return { id: ex.id, ...hit };
  }
  return null;
}

const sample = all ? events : [...events].sort(() => Math.random() - 0.5).slice(0, N);

const results = [];
let cursor = 0;
async function worker() {
  while (cursor < sample.length) {
    const e = sample[cursor++];
    const body = await fetchBody(e.url);
    const hit = body ? extract(body) : null;
    results.push({ name: e.name, city: e.city, url: e.url, host: hostOf(e.url),
      stored: e.next_date || '', cadence: e.cadence, bytes: body.length, hit });
    if (results.length % 20 === 0) process.stderr.write(`  ...${results.length}/${sample.length}\n`);
  }
}
function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return '?'; } }

process.stderr.write(`Probing ${sample.length} of ${events.length} events with ${CONC} workers\n`);
await Promise.all(Array.from({ length: CONC }, worker));

const withDate = results.filter((r) => r.hit);
const byExtractor = {};
for (const r of withDate) byExtractor[r.hit.id] = (byExtractor[r.hit.id] || 0) + 1;

console.log(`\nMachine-readable: ${withDate.length}/${results.length} (${(withDate.length / results.length * 100).toFixed(0)}%)`);
for (const [k, v] of Object.entries(byExtractor).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(3)}  ${k}`);
}

const agree = withDate.filter((r) => r.stored && r.hit.start === r.stored);
const differ = withDate.filter((r) => r.stored && r.hit.start !== r.stored);
const gained = withDate.filter((r) => !r.stored);
console.log(`\nOf those, against the stored date:`);
console.log(`  agrees:  ${agree.length}`);
console.log(`  differs: ${differ.length}`);
console.log(`  stored had no date: ${gained.length}`);

if (differ.length) {
  console.log('\nDISAGREEMENTS (each is either a moved date or a bad extractor):');
  for (const r of differ.slice(0, 25)) {
    console.log(`  ${r.name} — ${r.city}`);
    console.log(`      stored ${r.stored}   page ${r.hit.start}${r.hit.end !== r.hit.start ? '..' + r.hit.end : ''}   via ${r.hit.id}   ${r.host}`);
  }
}

if (gained.length) {
  console.log('\nDATE FOUND WHERE THE RECORD HAD NONE:');
  for (const r of gained.slice(0, 25)) {
    console.log(`  ${r.name} — ${r.city}: ${r.hit.start}${r.hit.end !== r.hit.start ? '..' + r.hit.end : ''} via ${r.hit.id}`);
  }
}

console.log('\nTop hosts with NO machine-readable date:');
const noHit = {};
for (const r of results.filter((x) => !x.hit)) noHit[r.host] = (noHit[r.host] || 0) + 1;
Object.entries(noHit).sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([h, n]) => console.log(`  ${String(n).padStart(3)}  ${h}`));

writeFileSync(join(ROOT, 'data', 'extractor-probe.json'),
  JSON.stringify({ probed_on: todayInDirectory(), results }, null, 2) + '\n');
console.log('\nFull result written to data/extractor-probe.json');
