#!/usr/bin/env node
/**
 * Record what is about to be handed to a curator.
 *
 * The re-check queue is regenerated after every run, so by the time the auditor
 * looks, the file the curator was given no longer exists. Without a snapshot the
 * auditor cannot tell "the curator skipped this row" from "the curator was never
 * given this row" — and it would accuse it of the former.
 *
 * Run this immediately before dispatching.
 *
 *   node agent/tools/snapshot-dispatch.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REVIEW = join(ROOT, 'data', 'review');

const rows = [];

// TO-VERIFY: reason, status, name, city, ...
const todo = join(REVIEW, 'TO-VERIFY.tsv');
if (existsSync(todo)) {
  for (const line of readFileSync(todo, 'utf8').trim().split('\n').slice(1)) {
    const c = line.split('\t');
    if (c[2]) rows.push([c[2], c[3], `TO-VERIFY:${c[0]}`]);
  }
}

/**
 * NEEDS-AGENT is only current until someone works it.
 *
 * verify-dates writes it, then curators settle those rows and the ledger
 * records the result — but nothing deletes the file, so the next snapshot
 * picked the same rows up again and re-dispatched a hundred events that had
 * been settled the day before. A row the ledger already has as confirmed or
 * corrected is not work; anything still unsettled is also in the ledger's
 * own queue, so nothing is lost by dropping it here.
 */
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const ledgerPath = join(REVIEW, 'verified.json');
const ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')).entries : {};
const settled = new Set(Object.values(ledger)
  .filter((v) => v.status === 'confirmed' || v.status === 'corrected')
  .map((v) => norm(v.name)));

const needs = join(REVIEW, 'NEEDS-AGENT.tsv');
let staleNeeds = 0;
if (existsSync(needs)) {
  for (const line of readFileSync(needs, 'utf8').trim().split('\n').slice(1)) {
    const c = line.split('\t');
    if (!c[1]) continue;
    if (settled.has(norm(c[1]))) { staleNeeds++; continue; }
    rows.push([c[1], c[2], `NEEDS-AGENT:${c[0]}`]);
  }
}

// SHARED-PAGES: name, city, url, shares_with — events whose link is a listing
// shared with other events, so each needs its own URL.
const shared = join(REVIEW, 'SHARED-PAGES.tsv');
if (existsSync(shared)) {
  for (const line of readFileSync(shared, 'utf8').trim().split('\n').slice(1)) {
    const c = line.split('\t');
    if (c[0]) rows.push([c[0], c[1], 'SHARED-PAGE:needs-own-url']);
  }
}

/**
 * One row per event, carrying every reason it was listed for. Keeping only the
 * first reason lost information that changes the job: an event newly surfaced
 * from a shared listing arrived labelled just "never", so the curator verified
 * its date and left it pointing at a page of twenty other events.
 */
const merged = new Map();
for (const [n, c, src] of rows) {
  const k = `${n}|${c}`;
  if (!merged.has(k)) merged.set(k, [n, c, []]);
  const reasons = merged.get(k)[2];
  if (!reasons.includes(src)) reasons.push(src);
}
const unique = [...merged.values()].map(([n, c, r]) => [n, c, r.join('+')]);

writeFileSync(join(REVIEW, 'DISPATCHED.tsv'),
  'name\tcity\tsource\n' + unique.map((r) => r.join('\t')).join('\n') + '\n', 'utf8');

console.log(`Snapshotted ${unique.length} row(s) to data/review/DISPATCHED.tsv` +
  (staleNeeds ? ` (skipped ${staleNeeds} NEEDS-AGENT row(s) the ledger already has settled)` : ''));
