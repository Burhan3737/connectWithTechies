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

// NEEDS-AGENT: verdict, name, city, ...
const needs = join(REVIEW, 'NEEDS-AGENT.tsv');
if (existsSync(needs)) {
  for (const line of readFileSync(needs, 'utf8').trim().split('\n').slice(1)) {
    const c = line.split('\t');
    if (c[1]) rows.push([c[1], c[2], `NEEDS-AGENT:${c[0]}`]);
  }
}

const seen = new Set();
const unique = rows.filter(([n, c]) => {
  const k = `${n}|${c}`;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

writeFileSync(join(REVIEW, 'DISPATCHED.tsv'),
  'name\tcity\tsource\n' + unique.map((r) => r.join('\t')).join('\n') + '\n', 'utf8');

console.log(`Snapshotted ${unique.length} row(s) to data/review/DISPATCHED.tsv`);
