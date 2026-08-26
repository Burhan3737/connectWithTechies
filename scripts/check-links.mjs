#!/usr/bin/env node
/**
 * Verifies every event URL in data/events.json actually resolves.
 * Used by the research review cycles to catch fabricated or rotted links.
 *
 *   node scripts/check-links.mjs            # check all
 *   node scripts/check-links.mjs --bad      # print only failures
 *   CONCURRENCY=12 node scripts/check-links.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { events } = JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8'));
const REPORT = join(ROOT, 'data', 'link-report.json');

const CONCURRENCY = Number(process.env.CONCURRENCY || 8);
const TIMEOUT = Number(process.env.TIMEOUT || 15000);
const onlyBad = process.argv.includes('--bad');

const UA = 'Mozilla/5.0 (compatible; forTechies-linkcheck/1.0; +https://github.com/Burhan3737/forTechies)';

async function probe(url) {
  // Some event sites reject HEAD; fall back to a ranged GET.
  for (const method of ['HEAD', 'GET']) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: ctrl.signal,
        headers: { 'user-agent': UA, accept: 'text/html,*/*', ...(method === 'GET' ? { range: 'bytes=0-2048' } : {}) },
      });
      clearTimeout(timer);
      if (res.status === 405 || res.status === 501) continue;  // retry with GET
      return { status: res.status, finalUrl: res.url, ok: res.status < 400 };
    } catch (err) {
      clearTimeout(timer);
      if (method === 'GET') return { status: 0, finalUrl: '', ok: false, error: String(err.message || err) };
    }
  }
  return { status: 0, finalUrl: '', ok: false, error: 'unreachable' };
}

const results = [];
let cursor = 0;
let done = 0;

async function worker() {
  while (cursor < events.length) {
    const e = events[cursor++];
    const r = await probe(e.url);
    results.push({ name: e.name, city: e.city, url: e.url, source_file: e.source_file, ...r });
    done++;
    if (done % 25 === 0) process.stderr.write(`  ...${done}/${events.length}\n`);
  }
}

process.stderr.write(`Checking ${events.length} links with ${CONCURRENCY} workers\n`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

results.sort((a, b) => Number(a.ok) - Number(b.ok) || a.name.localeCompare(b.name));

const bad = results.filter((r) => !r.ok);
const redirected = results.filter((r) => r.ok && r.finalUrl && r.finalUrl.replace(/\/$/, '') !== r.url.replace(/\/$/, ''));

console.log(`\nOK:       ${results.length - bad.length}/${results.length}`);
console.log(`Broken:   ${bad.length}`);
console.log(`Redirect: ${redirected.length}`);

if (bad.length) {
  console.log('\nBROKEN LINKS');
  console.log('-'.repeat(60));
  for (const r of bad) {
    console.log(`  [${String(r.status).padStart(3)}] ${r.name} — ${r.city}`);
    console.log(`        ${r.url}   (${r.source_file})${r.error ? '  ' + r.error : ''}`);
  }
}

if (!onlyBad && redirected.length) {
  console.log('\nREDIRECTS (consider updating the stored url)');
  console.log('-'.repeat(60));
  for (const r of redirected.slice(0, 40)) {
    console.log(`  ${r.name} — ${r.city}`);
    console.log(`        ${r.url}\n     -> ${r.finalUrl}`);
  }
  if (redirected.length > 40) console.log(`  ... and ${redirected.length - 40} more`);
}

writeFileSync(REPORT, JSON.stringify({ checked_on: new Date().toISOString().slice(0, 10), results }, null, 2) + '\n');
console.log(`\nFull report written to data/link-report.json`);
process.exitCode = bad.length ? 1 : 0;
