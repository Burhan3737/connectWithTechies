#!/usr/bin/env node
/**
 * Headless smoke test for the board UI.
 * Boots index.html + assets/app.js in jsdom against the real data/events.json
 * and asserts the things a user would notice if they broke: rows render, every
 * row links out, the city typeahead filters, and the when/type filters narrow.
 *
 *   npx --yes -p jsdom node scripts/smoke-test.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch {
  console.error('jsdom is not available. Run:  npx --yes -p jsdom node scripts/smoke-test.mjs');
  process.exit(2);
}

const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const appJs = readFileSync(join(ROOT, 'assets', 'app.js'), 'utf8');
const data = JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8'));

let failures = 0;
const ok = (cond, label, detail = '') => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

const dom = new JSDOM(html, {
  url: 'http://localhost:5173/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const { window } = dom;

// Stub fetch with the real dataset, and scrollIntoView which jsdom lacks.
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
window.Element.prototype.scrollIntoView = function () {};

window.eval(appJs);

const $ = (s) => window.document.querySelector(s);
const $$ = (s) => [...window.document.querySelectorAll(s)];
const tick = () => new Promise((r) => setTimeout(r, 30));

const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

await tick();
await tick();

console.log(`\nDataset: ${data.event_count} events / ${data.city_count} cities\n`);

console.log('Boot');
const rows = () => $$('.ev');
ok(rows().length > 0, 'rows rendered', `${rows().length} rows`);
ok($('#board').getAttribute('aria-busy') === 'false', 'board no longer busy');
ok($('.tally').children.length === 5, 'tally rendered');
ok($('#type').options.length > 1, 'kind dropdown populated', `${$('#type').options.length - 1} kinds`);

console.log('\nEvery row links out to the organiser');
const bad = rows().filter((a) => !/^https?:\/\//.test(a.getAttribute('href') || ''));
ok(bad.length === 0, 'all hrefs absolute', bad.length ? bad[0].getAttribute('href') : '');
const notBlank = rows().filter((a) => a.getAttribute('target') !== '_blank');
ok(notBlank.length === 0, 'all rows open in a new tab');
const noRel = rows().filter((a) => !(a.getAttribute('rel') || '').includes('noopener'));
ok(noRel.length === 0, 'all rows set rel=noopener');

console.log('\nWhen filter');
const upcomingCount = rows().length;
click($('[data-when="all"]'));
await tick();
const allCount = rows().length;
ok(allCount >= upcomingCount, 'All >= Upcoming', `${allCount} vs ${upcomingCount}`);
click($('[data-when="past"]'));
await tick();
const pastCount = rows().length;
ok(pastCount < allCount, 'Past narrows the board', `${pastCount} of ${allCount}`);
click($('[data-when="all"]'));
await tick();

console.log('\nSearch');
$('#q').value = 'hackathon';
fire($('#q'), 'input');
await new Promise((r) => setTimeout(r, 180));
const searched = rows().length;
ok(searched > 0 && searched < allCount, 'search narrows the board', `${searched} of ${allCount}`);
ok($$('.ev mark').length > 0 || searched === 0, 'matches are highlighted');
$('#q').value = '';
fire($('#q'), 'input');
await new Promise((r) => setTimeout(r, 180));
ok(rows().length === allCount, 'clearing search restores the board');

console.log('\nCity multi-select');
fire($('#cityq'), 'focus');
await tick();
const opts = $$('#citylist li[data-key]');
ok(opts.length > 0, 'typeahead lists cities', `${opts.length} shown`);

const firstKey = opts[0].getAttribute('data-key');
const firstCity = opts[0].textContent;
opts[0].dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
await tick();
ok($$('.chip').length === 1, 'selecting a city adds a chip', firstCity);
const oneCity = rows().length;
ok(oneCity > 0 && oneCity < allCount, 'one city narrows the board', `${oneCity} of ${allCount}`);
ok(window.location.search.includes('cities='), 'city is mirrored into the URL');

fire($('#cityq'), 'focus');
await tick();
const opts2 = $$('#citylist li[data-key]');
ok(!opts2.some((o) => o.getAttribute('data-key') === firstKey), 'already-picked city is not offered again');
opts2[0].dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
await tick();
ok($$('.chip').length === 2, 'second city adds a second chip');
const twoCities = rows().length;
ok(twoCities > oneCity, 'multi-select is a union, not an intersection', `${twoCities} > ${oneCity}`);

click($$('.chip button')[0]);
await tick();
ok($$('.chip').length === 1, 'chip x removes one city');
click($('#clearCities'));
await tick();
ok($$('.chip').length === 0, 'clear removes all cities');
ok(rows().length === allCount, 'board restored after clearing cities');

console.log('\nKind + country filters');
const kind = $('#type').options[1].value;
$('#type').value = kind;
fire($('#type'), 'change');
await tick();
const kindCount = rows().length;
ok(kindCount > 0 && kindCount < allCount, `kind "${kind}" narrows the board`, `${kindCount} of ${allCount}`);
$('#type').value = '';
fire($('#type'), 'change');
await tick();

$('#country').value = 'Canada';
fire($('#country'), 'change');
await tick();
const caCount = rows().length;
ok(caCount > 0 && caCount < allCount, 'Canada narrows the board', `${caCount} of ${allCount}`);
$('#country').value = '';
fire($('#country'), 'change');
await tick();

console.log('\nSorting');
$('#sort').value = 'city';
fire($('#sort'), 'change');
await tick();
const cityHeads = $$('.groupbar').map((h) => h.textContent.trim());
ok(cityHeads.length > 1, 'city sort groups by city', `${cityHeads.length} groups`);

// Compare on (city, region) the way the app sorts. Comparing the joined
// "City, Region" label instead would wrongly flag Miami before Miami Beach.
const cityKeyOf = (label) => {
  const i = label.lastIndexOf(', ');
  return i < 0 ? [label, ''] : [label.slice(0, i), label.slice(i + 2)];
};
let outOfOrder = null;
for (let i = 1; i < cityHeads.length; i++) {
  const [ca, ra] = cityKeyOf(cityHeads[i - 1]);
  const [cb, rb] = cityKeyOf(cityHeads[i]);
  if ((ca.localeCompare(cb) || ra.localeCompare(rb)) > 0) {
    outOfOrder = `${cityHeads[i - 1]} before ${cityHeads[i]}`;
    break;
  }
}
ok(!outOfOrder, 'city groups are in city-then-region order', outOfOrder || '');
ok(new Set(cityHeads).size === cityHeads.length, 'each city appears as exactly one group');

$('#sort').value = 'date';
fire($('#sort'), 'change');
await tick();
ok($$('.groupbar').length > 1, 'date sort groups by month');

console.log('\nEmpty state');
$('#q').value = 'zzzzzznotathing';
fire($('#q'), 'input');
await new Promise((r) => setTimeout(r, 180));
ok(rows().length === 0, 'impossible query yields no rows');
ok($('#empty').hidden === false, 'empty state is shown');
click($('#empty').querySelector('[data-reset]'));
await tick();
ok(rows().length > 0, 'reset link restores the board');

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}\n`);
process.exit(failures === 0 ? 0 : 1);
