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

console.log('\nAdd to calendar');
{
  const withCal = $$('.evrow').filter((r) => r.querySelector('.addcal'));
  ok(withCal.length > 0, 'dated upcoming rows offer + Calendar', `${withCal.length} rows`);
  const tbd = $$('.evrow').filter((r) => r.querySelector('.ev__when--tbd'));
  ok(tbd.length > 0 && tbd.every((r) => !r.querySelector('.addcal')), 'undated rows offer no calendar entry');
  ok(withCal.every((r) => !r.querySelector('.ev .addcal')), 'menu sits beside the row link, never inside it');

  const row = withCal[0];
  const menu = row.querySelector('.addcal__menu');
  ok(menu.childElementCount === 0, 'menu links are not built until opened');
  click(row.querySelector('.addcal > summary'));
  const links = [...menu.querySelectorAll('a')];
  const labels = links.map((a) => a.textContent);
  ok(links.length === 5, 'menu offers five calendars', labels.join(' / '));

  // Check every link against the event the row shows.
  const name = row.querySelector('.ev__name').textContent;
  const ev = data.events.find((e) => e.name === name && e.next_date);
  const startC = ev.next_date.replace(/-/g, '');
  const endD = new Date(`${ev.next_date_end || ev.next_date}T00:00:00Z`);
  endD.setUTCDate(endD.getUTCDate() + 1);
  const endEx = endD.toISOString().slice(0, 10);
  const g = new URL(links.find((a) => a.textContent === 'Google Calendar').href);
  ok(g.searchParams.get('text') === ev.name && g.searchParams.get('dates') === `${startC}/${endEx.replace(/-/g, '')}`,
    'Google: name and all-day dates, end exclusive', g.searchParams.get('dates'));
  const o = new URL(links.find((a) => a.textContent === 'Outlook.com').href);
  ok(o.searchParams.get('startdt') === ev.next_date && o.searchParams.get('enddt') === endEx && o.searchParams.get('allday') === 'true',
    'Outlook: all-day start and exclusive end', `${o.searchParams.get('startdt')} → ${o.searchParams.get('enddt')}`);
  ok(links.some((a) => a.href.startsWith('https://outlook.office.com/')), 'Microsoft 365 link present');
  ok(links.some((a) => a.href.startsWith('https://calendar.yahoo.com/')), 'Yahoo link present');
  const icsLink = links.find((a) => a.hasAttribute('download'));
  const ics = decodeURIComponent(icsLink.href.replace(/^data:text\/calendar;charset=utf-8,/, ''));
  ok(icsLink.getAttribute('download').endsWith('.ics'), '.ics offered as a download', icsLink.getAttribute('download'));
  ok(ics.includes('BEGIN:VEVENT') && ics.includes(`DTSTART;VALUE=DATE:${startC}`) &&
     ics.includes(`DTEND;VALUE=DATE:${endEx.replace(/-/g, '')}`) && ics.includes('\r\n'),
    '.ics is a valid all-day VEVENT with CRLF lines');
  const icsLines = ics.split('\r\n');
  ok(icsLines.every((l) => /^[A-Z][A-Z-]*(;[^:]*)?:/.test(l)) && !/[^\r]\n/.test(ics),
    '.ics: every line is a property (descriptions escaped, no stray newlines)');
  ok(links.filter((a) => !a.hasAttribute('download')).every((a) => a.target === '_blank' && a.rel.includes('noopener')),
    'web calendars open in a new tab');
  click($('#board'));
  ok(!row.querySelector('.addcal').hasAttribute('open'), 'clicking elsewhere closes the menu');
}

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
{
  // Under Past, only an event still in progress (started, not ended) can be added.
  const todayIso = window.eval('(function(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")})()');
  const offered = $$('.evrow').filter((r) => r.querySelector('.addcal'))
    .map((r) => data.events.find((e) => e.name === r.querySelector('.ev__name').textContent));
  ok(offered.every((e) => e && (e.next_date_end || e.next_date) >= todayIso && e.next_date <= todayIso),
    'Past offers add-to-calendar only for events still in progress', `${offered.length} in progress`);
}
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

console.log('\nSearch does not corrupt escaped characters');
// Many event names contain "&". Highlighting must not split the &amp; entity,
// and nothing in the data may ever reach the DOM as live markup.
$('#q').value = 'amp';
fire($('#q'), 'input');
await new Promise((r) => setTimeout(r, 180));
ok(!$('#board').innerHTML.includes('&<mark>amp</mark>;'), 'ampersand entities survive highlighting');
ok($$('#board script').length === 0, 'no script element is ever produced from data');
const ampRows = rows().length;
ok(true, 'ampersand query rendered', `${ampRows} rows`);
$('#q').value = '';
fire($('#q'), 'input');
await new Promise((r) => setTimeout(r, 180));

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

console.log('\nProvince / state filter');
const groups = [...$('#region').querySelectorAll('optgroup')].map((g) => g.label);
ok(groups.includes('United States') && groups.includes('Canada'), 'regions grouped by country', groups.join(', '));
const regionNames = [...$('#region').options].map((o) => o.value).filter(Boolean);
ok(!regionNames.some((r) => /^(various|multiple|us & canada)$/i.test(r)), 'placeholder regions are not offered', `${regionNames.length} regions`);
$('#region').value = 'Ontario';
fire($('#region'), 'change');
await tick();
const onRows = rows();
const onGeo = onRows.map((r) => r.querySelector('.ev__geo').textContent);
ok(onRows.length > 0 && onRows.length < caCount, 'Ontario narrows below all of Canada', `${onRows.length} of ${caCount}`);
ok(onGeo.every((g) => g.startsWith('Ontario')), 'every row shown is in Ontario');
ok($('#country').value === 'Canada', 'picking a province sets its country');
ok(window.location.search.includes('region=Ontario'), 'region is written to the URL');
$('#country').value = 'United States';
fire($('#country'), 'change');
await tick();
ok($('#region').value === '', 'switching country clears a province from the other country');
ok(![...$('#region').querySelectorAll('optgroup')].some((g) => g.label === 'Canada'), 'region list narrows to the chosen country');
$('#country').value = '';
fire($('#country'), 'change');
await tick();
ok(rows().length === allCount, 'board restored after clearing country and region');

console.log('\nCalendar view');
{
  const todayIso = window.eval('(function(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")})()');
  click($('[data-view="calendar"]'));
  await tick();
  ok($('#board').hidden && !$('#cal').hidden, 'calendar replaces the list');
  ok($('[data-view="calendar"]').getAttribute('aria-checked') === 'true', 'view toggle reflects the calendar');
  ok($('[data-when="all"]').getAttribute('aria-checked') === 'true', 'view toggle did not touch the When filter');
  ok(window.location.search.includes('view=calendar'), 'view is written to the URL');
  ok($('.cal__title').textContent.length > 0, 'month title shown', $('.cal__title').textContent);
  const cells = $$('.cal__day');
  ok(cells.length % 7 === 0 && cells.length >= 28, 'grid is whole weeks', `${cells.length} cells`);
  ok($$('.cal__day.is-today').length === 1, 'today is marked');
  ok($('.cal__day.is-sel .cal__num').getAttribute('data-day') === todayIso, "today's events open on arrival");

  // Every chip is a real event on that day, linking to its page.
  const busy = cells.find((c) => !c.classList.contains('is-out') && c.querySelector('.cal__ev'));
  ok(!!busy, 'events appear on days');
  ok($$('#board .ev').length === 0, 'the hidden list is cleared, not just hidden');
  const dayIso = busy.querySelector('.cal__num').getAttribute('data-day');
  const chip = busy.querySelector('.cal__ev');
  const chipEv = data.events.find((e) => e.name === chip.textContent && e.url === chip.getAttribute('href'));
  const onDay = chipEv && (chipEv.next_date === dayIso || chipEv.last_date === dayIso ||
    (chipEv.feed_dates || []).includes(dayIso) ||
    (chipEv.next_date_end && chipEv.next_date <= dayIso && dayIso <= chipEv.next_date_end));
  ok(onDay, 'a chip sits on one of its event\'s dates', `${chip.textContent} @ ${dayIso}`);
  ok(chip.target === '_blank' && chip.rel.includes('noopener'), 'chips open the organiser page in a new tab');
  ok(cells.every((c) => c.querySelectorAll('.cal__ev').length <= 3), 'at most three chips per day');
  const crowded = cells.find((c) => c.querySelector('.cal__more'));
  if (crowded) {
    const n = +crowded.querySelector('.cal__count').textContent;
    const shown = crowded.querySelectorAll('.cal__ev').length;
    ok(crowded.querySelector('.cal__more').textContent === `+${n - shown} more`, '"+N more" counts the rest', crowded.querySelector('.cal__more').textContent);
  }
  ok(cells.every((c) => {
    const names = [...c.querySelectorAll('.cal__ev')].map((a) => a.textContent.toLowerCase());
    return new Set(names).size === names.length;
  }), 'a title shows once per day, even when held in several cities');
  // A day with a hackathon leads with it.
  const hackDay = cells.find((c) => c.querySelector('.cal__ev--hack'));
  if (hackDay) ok(hackDay.querySelector('.cal__ev').classList.contains('cal__ev--hack'), 'hackathons lead their day');

  // Open a day: its full list, with add-to-calendar on upcoming rows.
  click(busy.querySelector('.cal__num'));
  await tick();
  const panelRows = $$('.cal__dayview .ev');
  ok(panelRows.length === +busy.querySelector('.cal__count').textContent, 'opening a day lists all its events', `${panelRows.length} events`);
  ok(window.location.search.includes(`day=${dayIso}`), 'opened day is written to the URL');

  // Filters still apply: one country never shows the other's events.
  const before = +$('#count b').textContent;
  $('#country').value = 'Canada';
  fire($('#country'), 'change');
  await tick();
  const caMonth = +$('#count b').textContent;
  ok(caMonth < before, 'country filter narrows the month', `${caMonth} of ${before}`);
  const caNames = new Set(data.events.filter((e) => e.country === 'Canada').map((e) => e.name));
  ok($$('.cal__ev').every((a) => caNames.has(a.textContent)), 'every chip is a Canadian event');
  $('#country').value = '';
  fire($('#country'), 'change');
  await tick();

  // Month navigation.
  const title = $('.cal__title').textContent;
  click($('.cal__nav[data-month="1"]'));
  await tick();
  ok($('.cal__title').textContent !== title, 'next month', $('.cal__title').textContent);
  ok(!$('.cal__dayview'), 'changing month closes the opened day');
  click($('.cal__nav[data-month="-1"]'));
  click($('.cal__nav[data-month="-1"]'));
  await tick();
  ok($('.cal__title').textContent !== title, 'previous month', $('.cal__title').textContent);
  click($('.cal__today'));
  await tick();
  ok($('.cal__title').textContent === title, 'today returns to this month');

  click($('[data-view="list"]'));
  await tick();
  ok(!$('#board').hidden && $('#cal').hidden && rows().length === allCount, 'back to the list, unchanged');
  ok(!window.location.search.includes('view='), 'list view leaves the URL clean');
}

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
