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
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { events } = JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8'));
const REPORT = join(ROOT, 'data', 'link-report.json');

const CONCURRENCY = Number(process.env.CONCURRENCY || 8);
const TIMEOUT = Number(process.env.TIMEOUT || 15000);
const onlyBad = process.argv.includes('--bad');
const COOLOFF = Number(process.env.COOLOFF || 75000);
const RETRY_SPACING = Number(process.env.RETRY_SPACING || 900);

/**
 * A real browser User-Agent, not a polite bot string.
 *
 * Roughly 35 hosts in this dataset — Oracle, SAP, NetSuite, Gartner, RSAC,
 * TechWell and friends — return 403 to anything that identifies as a crawler
 * while serving the same page fine to a browser. Reporting those as broken
 * links sent earlier review cycles chasing pages that were never down.
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/**
 * Probe with curl when it is available, falling back to fetch.
 *
 * This is not fussiness. Node's fetch (undici) has a distinctive TLS and HTTP/2
 * fingerprint, and a large set of enterprise event hosts — Oracle, RSAC, THAT
 * Conference, TechCon 365, GrowthZone — answer it with 403 or 404 while serving
 * curl a 200 for the identical URL and User-Agent. Probing with fetch produced
 * around thirty false "broken link" reports, and review cycles were sent to fix
 * pages that had never been down.
 */
let curlAvailable = null;

function curlProbe(url) {
  return new Promise((resolve) => {
    // Send nothing but the User-Agent. Adding lowercase `accept` /
    // `accept-language` headers reliably turns a 200 into a 403 on
    // WAF-protected hosts — they fingerprint header casing and ordering, and
    // curl's own default `Accept: */*` passes where an override does not.
    // Verified on rsaconference.com: bare 200, same request plus those two
    // headers 403.
    const args = ['-sSL', '--max-time', String(Math.ceil(TIMEOUT / 1000)),
      '-A', UA,
      '-o', process.platform === 'win32' ? 'NUL' : '/dev/null',
      '-w', '%{http_code} %{url_effective}',
      url];
    execFile('curl', args, { timeout: TIMEOUT + 5000 }, (err, stdout) => {
      const [codeStr, ...rest] = String(stdout || '').trim().split(' ');
      const status = Number(codeStr) || 0;
      if (!status) {
        return resolve({ status: 0, finalUrl: '', ok: false, error: String(err?.message || 'unreachable').slice(0, 120) });
      }
      resolve({ status, finalUrl: rest.join(' ') || url, ok: status < 400 });
    });
  });
}

async function fetchProbe(url) {
  for (const method of ['HEAD', 'GET']) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: ctrl.signal,
        headers: {
          'user-agent': UA,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
          ...(method === 'GET' ? { range: 'bytes=0-2048' } : {}),
        },
      });
      clearTimeout(timer);
      if (res.status === 405 || res.status === 501) continue;
      return { status: res.status, finalUrl: res.url, ok: res.status < 400 };
    } catch (err) {
      clearTimeout(timer);
      if (method === 'GET') return { status: 0, finalUrl: '', ok: false, error: String(err.message || err) };
    }
  }
  return { status: 0, finalUrl: '', ok: false, error: 'unreachable' };
}

async function probe(url) {
  return curlAvailable ? curlProbe(url) : fetchProbe(url);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

curlAvailable = await new Promise((r) => execFile('curl', ['--version'], (err) => r(!err)));
process.stderr.write(curlAvailable
  ? 'Probing with curl.\n'
  : 'curl not found; falling back to fetch, which enterprise hosts often 403.\n');

process.stderr.write(`Checking ${events.length} links with ${CONCURRENCY} workers\n`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

/**
 * Second pass: re-probe every failure one at a time.
 *
 * Firing a dozen concurrent requests trips rate limiting and bot protection on
 * a lot of hosts, which shows up as a 403 or 429 that has nothing to do with
 * the link being broken. On this dataset the concurrent pass reported 32
 * failures and a serial re-probe cleared 25 of them. Without this, review
 * cycles get sent to repair pages that were never down.
 */
const firstPassFailures = results.filter((r) => !r.ok);
if (firstPassFailures.length) {
  // The cool-off matters more than the spacing. Rate-limit windows run for
  // tens of seconds, so re-probing the instant the concurrent pass ends just
  // collects the same 403 again — an earlier version of this retry cleared 3
  // of 32, where the same probes run a few minutes later cleared 25.
  process.stderr.write(`\nWaiting ${COOLOFF / 1000}s for rate limits to lapse before re-probing ` +
    `${firstPassFailures.length} failure(s) serially\n`);
  await sleep(COOLOFF);
  let cleared = 0;
  for (const r of firstPassFailures) {
    await sleep(RETRY_SPACING);
    const again = await probe(r.url);
    if (again.ok) {
      cleared++;
      Object.assign(r, again, { note: 'passed on serial re-probe; the concurrent failure was rate limiting' });
    } else {
      r.status = again.status || r.status;
    }
  }
  process.stderr.write(`  cleared ${cleared}, still failing ${firstPassFailures.length - cleared}\n`);
}

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
