#!/usr/bin/env node
/**
 * Offline checks for the scripts outside the feed — no network, nothing read
 * from data/. Same shape as scripts/feeds/selftest.mjs: add a section per
 * script, each under its own console.log heading.
 *
 *   node scripts/selftest.mjs
 */
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { validateRecord, decideAdd } from './lib/record.mjs';
import { diffEvents, changesMarkdown, historyRow, upsertHistory, delistings, retiredOrganisers } from './lib/changes.mjs';
import { planCities, mergeSearched, candidateCities, TYPES } from '../agent/tools/discovery-plan.mjs';

let failed = 0, passed = 0;
function ok(cond, label, detail = '') {
  if (cond) passed++; else failed++;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
}

console.log('validateRecord');
{
  const NOW = '2026-10-21';
  const good = {
    name: 'Hack Canada', type: 'hackathon', topics: ['hackathon', 'student'], city: 'Toronto', region: 'Ontario',
    country: 'Canada', venue: 'Myhal Centre', cadence: 'annual', month: 'January',
    next_date: '2027-01-08', next_date_end: '2027-01-10', last_date: '2026-03-06', status: 'upcoming',
    attendance: '', cost: 'free', audience: 'students', url: 'https://hackcanada.org/',
    description: 'A student hackathon.', source: 'https://hackcanada.org/',
  };
  const problems = (patch, drop = []) => {
    const rec = { ...good, ...patch };
    for (const k of drop) delete rec[k];
    return validateRecord(rec, NOW).join(' | ');
  };

  ok(validateRecord(good, NOW).length === 0, 'a complete record is valid', problems({}));
  ok(validateRecord({ ...good, next_date: '', next_date_end: '', last_date: '' }, NOW).length === 0, 'empty dates are valid');
  ok(/missing field: venue/.test(problems({}, ['venue'])), 'a missing field is reported');
  ok(/unexpected field: feed_source/.test(problems({ feed_source: 'luma' })), 'an extra field is reported');
  ok(/type must be/.test(problems({ type: 'meetup' })), 'the feed-only type "meetup" is refused');
  ok(/type must be/.test(problems({ type: 'party' })), 'an unknown type is refused');
  ok(/country must be/.test(problems({ country: 'Canda' })), 'a misspelt country is refused');
  ok(/cadence must be/.test(problems({ cadence: 'yearly' })), 'an unknown cadence is refused');
  ok(/status must be/.test(problems({ status: 'soon' })), 'an unknown status is refused');
  ok(/cost must be/.test(problems({ cost: 'cheap' })), 'an unknown cost is refused');
  ok(/next_date must be/.test(problems({ next_date: 'January 8' })), 'a prose date is refused');
  ok(/next_date must be/.test(problems({ next_date: '2027-02-30' })), 'an impossible date is refused');
  ok(/last_date must be/.test(problems({ last_date: '2026-3-6' })), 'an unpadded date is refused');
  ok(/next_date_end is before/.test(problems({ next_date_end: '2027-01-07' })), 'an end before the start is refused');
  ok(!/before/.test(problems({ next_date_end: '2027-01-08' })), 'a one-day event (end = start) is fine');
  ok(/in the future/.test(problems({ last_date: '2026-10-22' })), 'a last_date in the future is refused');
  ok(!/future/.test(problems({ last_date: NOW })), 'a last_date of today is fine');
  ok(/url must be/.test(problems({ url: 'hackcanada.org' })), 'a url without a scheme is refused');
  ok(/source must be/.test(problems({ source: 'ftp://example.com/x' })), 'a non-http source is refused');
  for (const f of ['name', 'city', 'region', 'description']) {
    ok(new RegExp(`${f} must be a non-empty`).test(problems({ [f]: '  ' })), `a blank ${f} is refused`);
  }
  ok(/topics must be/.test(problems({ topics: ['AI'] })), 'an upper-case topic is refused');
  ok(/topics must be/.test(problems({ topics: 'ai' })), 'topics that is not an array is refused');
  ok(validateRecord(null, NOW).length === 1 && validateRecord([], NOW).length === 1, 'a non-object is refused');
}

console.log('decideAdd');
{
  const NOW = '2026-10-21';
  const rec = {
    name: 'Hack Canada', type: 'hackathon', topics: ['hackathon'], city: 'Toronto', region: 'Ontario',
    country: 'Canada', venue: 'Myhal Centre', cadence: 'annual', month: 'January',
    next_date: '2027-01-08', next_date_end: '2027-01-10', last_date: '2026-03-06', status: 'upcoming',
    attendance: '', cost: 'free', audience: 'students', url: 'https://hackcanada.org/',
    description: 'A student hackathon.', source: 'https://hackcanada.org/',
  };
  const verdict = (r, curated = [], again = false, before = false) =>
    decideAdd(r, curated, { addedThisRun: again, appliedBefore: before }, NOW);

  ok(verdict(rec).verdict === 'ADD', 'a valid new record is added');
  const bad = verdict({ ...rec, country: 'Canda' });
  ok(bad.verdict === 'REJECT' && /invalid record: .*country/.test(bad.message), 'an invalid record is rejected with its problems');
  ok(verdict(rec, [{ ...rec, topics: [...rec.topics] }]).verdict === 'DONE', 'an identical curated record is DONE (idempotent re-run)');
  const differs = verdict(rec, [{ ...rec, next_date: '2027-01-15' }]);
  ok(differs.verdict === 'REJECT' && /update/.test(differs.message), 'a differing curated record is rejected, pointing at update');
  ok(verdict(rec, []).verdict === 'ADD', 'a feed-only twin (not passed as curated) does not block');
  ok(verdict(rec, [rec], true).verdict === 'REJECT' && /this run/.test(verdict(rec, [rec], true).message), 'a repeat of an identical add in one run is rejected, not DONE');
  ok(verdict({ ...rec, venue: '' }, [rec], true).verdict === 'REJECT', 'a differing repeat in one run is rejected');
  ok(verdict({ ...rec, venue: '' }, [rec], false, true).verdict === 'DONE', 'an add applied on an earlier run is DONE though the record has since changed');
  ok(verdict(rec, [], false, true).verdict === 'DONE', 'an add applied on an earlier run is DONE though the record has since been removed');
}

/**
 * apply-patches.mjs end to end. It is a script, not a module, and it writes
 * data/raw, so it runs on a copy of itself in a throwaway directory with its own
 * data/ — never this checkout's. Each case is a sequence of runs, because the
 * bug it guards (an applied add replayed every run) only shows on the second.
 */
console.log('apply-patches (sandboxed copy)');
{
  const NOW = '2026-10-21';
  const HERE = dirname(fileURLToPath(import.meta.url));
  const rec = {
    name: 'Foo Conf', type: 'conference', topics: ['web'], city: 'Toronto', region: 'Ontario',
    country: 'Canada', venue: '', cadence: 'annual', month: 'March',
    next_date: '2027-03-04', next_date_end: '2027-03-05', last_date: '2026-03-05', status: 'upcoming',
    attendance: '', cost: 'paid', audience: '', url: 'https://fooconf.example/',
    description: 'A web conference.', source: 'https://fooconf.example/',
  };
  const add = (r = rec) => [{ action: 'add', reason: 'found on its own site', record: r }];
  const remove = [{ match: { name: rec.name, city: rec.city }, action: 'remove', reason: 'retired' }];
  const update = [{ match: { name: rec.name, city: rec.city }, action: 'update', reason: 'new date', set: { next_date: '2027-03-11', next_date_end: '2027-03-12' } }];

  function sandbox(raw = {}) {
    const dir = mkdtempSync(join(tmpdir(), 'apply-selftest-'));
    mkdirSync(join(dir, 'scripts'));
    cpSync(join(HERE, 'apply-patches.mjs'), join(dir, 'scripts', 'apply-patches.mjs'));
    cpSync(join(HERE, 'lib'), join(dir, 'scripts', 'lib'), { recursive: true });
    mkdirSync(join(dir, 'data', 'raw'), { recursive: true });
    mkdirSync(join(dir, 'data', 'review'));
    for (const [f, list] of Object.entries({ 'curated.json': [], ...raw })) {
      writeFileSync(join(dir, 'data', 'raw', f), JSON.stringify(list));
    }
    return {
      put: (f, json) => writeFileSync(join(dir, 'data', 'review', f), JSON.stringify(json)),
      run: () => execFileSync(process.execPath, [join(dir, 'scripts', 'apply-patches.mjs')],
        { env: { ...process.env, TODAY: NOW }, encoding: 'utf8' }),
      found: () => {
        const p = join(dir, 'data', 'raw', 'discovered.json');
        return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')).filter((e) => e.name === rec.name) : [];
      },
      done: () => rmSync(dir, { recursive: true, force: true }),
    };
  }
  // One patch file's lines of a run's output, on one line, for the check's detail.
  const line = (out, pf) => (out.split(`\n${pf} — `)[1]?.split('\n\n')[0] || '').replace(/\s*\n\s*/g, ' | ');
  const sb = [];
  try {
    {
      const s = sandbox(); sb.push(s);
      s.put('oct21-x-fixes.json', add());
      const first = s.run();
      ok(/ADD {4}Foo Conf/.test(first) && s.found().length === 1, 'first application: ADD, and the record lands in discovered.json', line(first, 'oct21-x-fixes.json'));
      const again = s.run();
      ok(/DONE {3}Foo Conf .*applied on an earlier run/.test(again) && s.found().length === 1, 'the same add on the next run is DONE', line(again, 'oct21-x-fixes.json'));
    }
    {
      const s = sandbox(); sb.push(s);
      s.put('oct21-x-fixes.json', add()); s.run();
      s.put('pa01-x-fixes.json', remove);   // sorts after the add
      const r1 = s.run(), r2 = s.run();
      ok(/REMOVE Foo Conf/.test(r1) && !/ADD {4}/.test(r1 + r2) && /DONE {3}Foo Conf .*applied on an earlier run/.test(r2) && s.found().length === 0,
        'added, then removed by a later-sorting patch: stays removed, the add is DONE', line(r2, 'oct21-x-fixes.json'));
    }
    {
      const s = sandbox(); sb.push(s);
      s.put('oct21-x-fixes.json', add()); s.run();
      s.put('nov04-x-fixes.json', remove);  // sorts before the add: the case that re-added it every run
      const r1 = s.run(), r2 = s.run(), r3 = s.run();
      ok(/REMOVE Foo Conf/.test(r1) && !/ADD {4}/.test(r1 + r2 + r3) && /DONE {3}Foo Conf .*applied on an earlier run/.test(r3) && s.found().length === 0,
        'added, then removed by an earlier-sorting patch: stays removed, the add is DONE', line(r3, 'oct21-x-fixes.json'));
    }
    {
      const s = sandbox(); sb.push(s);
      s.put('oct21-x-fixes.json', add()); s.run();
      s.put('pb01-x-fixes.json', update);
      const r1 = s.run(), r2 = s.run();
      ok(/UPDATE Foo Conf/.test(r1) && !/REJECT/.test(r1 + r2) && /DONE {3}Foo Conf .*applied on an earlier run/.test(r2)
        && s.found()[0]?.next_date === '2027-03-11', 'added, then updated: the add is DONE, never REJECT, and the update holds', line(r2, 'oct21-x-fixes.json'));
    }
    {
      const s = sandbox({ 'curated.json': [{ ...rec, city: 'New York City', region: 'New York', country: 'United States' }] }); sb.push(s);
      s.put('oct21-x-fixes.json', add({ ...rec, city: 'NYC', region: 'New York', country: 'United States' }));
      const out = s.run();
      ok(/REJECT Foo Conf \(NYC\) {2}exists/.test(out) && s.found().length === 0,
        'an add in "NYC" finds the curated record in "New York City" (canonical city), no duplicate', line(out, 'oct21-x-fixes.json'));
    }
    {
      const s = sandbox(); sb.push(s);
      s.put('discover-x.json', { pass: 'x', date: NOW, returning: [{ name: 'Foo Conf', verdict: 'added' }] });
      s.put('discover-x-fixes.json', add());
      const out = s.run();
      ok(/discover-x\.json — not an operation array, skipping/.test(out), 'a discovery log (an object) is never applied, and says so');
      ok(/ADD {4}Foo Conf/.test(out) && s.found().length === 1, 'a pass named "discover-x" still has its discover-x-fixes.json applied');
    }
  } finally {
    for (const s of sb) s.done();
  }
}

console.log('discovery-plan');
{
  const ev = (city, region, type, extra = {}) => ({ name: `${type} ${city}`, type, city, region, country: 'United States', ...extra });
  const events = [
    ev('Austin', 'Texas', 'hackathon'), ev('Austin', 'Texas', 'conference'), ev('Austin', 'Texas', 'conference'),
    ev('Boise', 'Idaho', 'summit'),
    ev('Cary', 'North Carolina', 'ctf'),
    ev('Denver', 'Colorado', 'conference', { feed_source: 'luma' }),   // feed only: not curated
    ev('Paris', 'Ile-de-France', 'conference', { country: 'France' }),
    { ...ev('Toronto', 'Ontario', 'hackathon'), country: 'Canada' },
  ];
  const registry = [{ city: 'Denver', region: 'Colorado', country: 'United States' },
    { city: 'Lyon', region: 'Rhone', country: 'France' }];
  const plan = (searched = {}, limit = 10) => planCities({ events, discovery: registry, searched, limit });
  const names = (rows) => rows.map((r) => r.city);

  const cities = candidateCities(events, registry);
  ok(cities.has('Denver|Colorado') && cities.get('Denver|Colorado').count === 0, 'a registry city with no curated record is a candidate with count 0');
  ok(!cities.has('Paris|Ile-de-France') && !cities.has('Lyon|Rhone'), 'cities outside the US and Canada are left out');
  ok(cities.get('Austin|Texas').count === 3, 'curated records are counted per city');

  ok(names(plan()).join() === 'Denver,Boise,Cary,Toronto,Austin', 'registry never-searched first, then other never-searched by fewest records then name', names(plan()).join());
  const searched = { 'Denver|Colorado': '2026-10-01', 'Boise|Idaho': '2026-08-01', 'Austin|Texas': '2026-08-01' };
  ok(names(plan(searched)).join() === 'Cary,Toronto,Boise,Austin,Denver',
    'never-searched before searched; searched by longest ago, ties by fewest records', names(plan(searched)).join());
  ok(plan({}, 2).length === 2 && plan({}, 2)[0].city === 'Denver', '--limit trims the list');

  const austin = plan().find((r) => r.city === 'Austin');
  ok(austin.curated_count === 3 && austin.missing_types === TYPES.filter((t) => t !== 'hackathon' && t !== 'conference').join(','),
    'missing_types are the listed types with no curated record there', austin.missing_types);
  ok(plan().find((r) => r.city === 'Denver').missing_types === TYPES.join(','), 'a feed-only city is missing every type');
  ok(!plan().some((r) => r.missing_types.split(',').includes('expo')), 'only the listed types are ever reported');

  const logs = [
    { pass: 'a', date: '2026-10-21', cities: [{ city: 'Austin', region: 'Texas' }, { city: 'Cary', region: 'North Carolina' }] },
    { pass: 'b', date: '2026-10-10', cities: [{ city: 'Austin', region: 'Texas' }] },
    { pass: 'c', date: '2026-10-22', returning: [{ name: 'X', verdict: 'rejected' }] },
    { pass: 'd', date: '2026-10-22', cities: [{ region: 'Texas' }, null] },
  ];
  const merged = mergeSearched({ 'Austin|Texas': '2026-09-01', 'Boise|Idaho': '2026-08-01' }, logs);
  ok(merged['Austin|Texas'] === '2026-10-21', 'a logged city takes the later date, whichever log comes last');
  ok(merged['Cary|North Carolina'] === '2026-10-21' && merged['Boise|Idaho'] === '2026-08-01', 'new cities are added and others kept');
  ok(mergeSearched({ 'Austin|Texas': '2026-11-01' }, logs)['Austin|Texas'] === '2026-11-01', 'an older log never lowers a date');
  ok(JSON.stringify(mergeSearched(merged, logs)) === JSON.stringify(merged), 'recording twice changes nothing (idempotent)');
  {
    const more = [...events, ...[1, 2, 3].map((n) => ({ ...ev('Reno', 'Nevada', 'summit'), name: 'r' + n }))];
    const reg = [{ city: 'Reno', region: 'Nevada', country: 'United States' }];
    const p = planCities({ events: more, discovery: reg, searched: {} }).map((r) => r.city);
    ok(p[0] === 'Reno', 'a registry city with more records beats a non-registry city with fewer', p.join());
    const p2 = planCities({ events: more, discovery: reg, searched: { 'Reno|Nevada': '2026-01-01' } }).map((r) => r.city);
    ok(p2[p2.length - 1] === 'Reno' && p2[0] !== 'Reno', 'a never-searched non-registry city beats a searched registry city', p2.join());
    ok(!('inRegistry' in plan()[0]), 'the registry flag is not written to the plan rows');
  }
  const warned = [];
  const bad = mergeSearched({}, [{ pass: 'e', date: '10/21/2026', cities: [{ city: 'Austin', region: 'Texas' }] }, { pass: 'f', cities: [{ city: 'Boise', region: 'Idaho' }] }], (m) => warned.push(m));
  ok(Object.keys(bad).length === 0 && warned.length === 2, 'a log whose date is not YYYY-MM-DD is ignored with a warning', warned.join(' | '));
  ok(Object.keys(merged).length === 3, 'logs with no cities, or a city entry with no name, add nothing');
}

console.log('\nchanges since the last publish');
{
  const T = '2026-10-25';
  const feed = (name, feed_id, next_date, o = {}) => ({ name, city: 'Toronto', region: 'Ontario', type: 'meetup', feed_source: 'luma',
    feed_id, feed_organiser: 'Org', next_date, ...o });
  const cur = (name, next_date, o = {}) => ({ name, city: 'Toronto', region: 'Ontario', type: 'conference', next_date, ...o });
  const before = [
    feed('Stays', 'luma:1', '2026-11-01'),
    feed('Aged out', 'luma:2', '2026-08-01'),
    feed('Bowling seminar', 'luma:3', '2026-11-02', { feed_organiser: 'Strike Zone' }),
    feed('Pulled', 'luma:4', '2026-11-03'),
    feed('Now curated', 'luma:5', '2026-11-04'),
    feed('Weekly', 'luma:6', '2026-10-20'),
    cur('Summit', '2026-11-10'),
    cur('Dropped conf', '2026-12-01'),
    cur('Moved conf', '2026-11-20'),
  ];
  const after = [
    feed('Stays', 'luma:1', '2026-11-01'),
    feed('Weekly', 'luma:6', '2026-10-27'),
    feed('Brand new', 'luma:7', '2026-11-05', { city: 'Waterloo' }),
    cur('Summit', '2026-11-10', { city: 'Mississauga' }),
    cur('Moved conf', '2026-11-27'),
    cur('Now curated', '2026-11-04'),
    cur('Hack Canada', '2027-01-08'),
  ];
  const d = diffEvents(before, after, { today: T, retired: new Set(['Strike Zone']) });
  const names = (l) => l.map((x) => x.e.name).sort();
  ok(JSON.stringify(names(d.added)) === JSON.stringify(['Brand new', 'Hack Canada']), 'added: new feed and new curated events', names(d.added).join(', '));
  ok(d.added.find((x) => x.e.name === 'Hack Canada').curated && !d.added.find((x) => x.e.name === 'Brand new').curated, 'added: curated and feed told apart');
  const why = Object.fromEntries(d.removed.map((x) => [x.e.name, x.why]));
  ok(why['Aged out'] === 'aged out', 'removed: held over 60 days ago is aged out', JSON.stringify(why));
  ok(why['Bowling seminar'] === 'organiser retired', 'removed: a retired organiser is named as the reason');
  ok(why['Pulled'] === 'no longer listed', 'removed: anything else is no longer listed by its source');
  ok(why['Now curated'] === 'now a curated record', 'removed: a feed copy replaced by a curated record says so');
  ok(why['Dropped conf'] === 'curated record removed', 'removed: curated removals are flagged as such');
  ok(!('Summit' in why) && !d.added.some((x) => x.e.name === 'Summit'), 'a city correction is neither a removal nor an addition');
  ok(d.redated.length === 1 && d.redated[0].e.name === 'Moved conf' && d.redated[0].from === '2026-11-20',
    'redated: a date still to come that moved; a weekly series moving on is not', d.redated.map((x) => x.e.name).join(', '));
  ok(d.before === 9 && d.after === 7, 'totals before and after');
  const md = changesMarkdown(d, { since: 'abc1234 (2026-10-22)', today: T });
  ok(/\| Added \| 2 \|/.test(md) && /organiser retired/.test(md) && /Moved conf/.test(md), 'the report lists counts, reasons and changes');
  ok(/no earlier version/.test(changesMarkdown(null, { since: '', today: T })), 'no baseline: says so instead of failing');

  // The same event under a new feed_id: a source's new URL, a Meetup copy
  // replaced by the Luma one, sessions folded into a series row.
  const moved = diffEvents(
    [feed('Knowns and Unknowns', 'meetup:1', '2026-11-17'), feed('Campus Tour', 'eventbrite:9', '2026-11-06'),
      feed('Campus Tour', 'eventbrite:8', '2026-11-13'), feed('Other talk', 'meetup:2', '2026-11-20')],
    [feed('Knowns and Unknowns', 'luma:evt-x', '2026-11-17', { feed_source: 'luma' }),
      feed('Campus Tour', 'series:abc', '2026-11-06', { feed_dates: ['2026-11-06', '2026-11-13'] }),
      feed('Other talk', 'meetup:3', '2026-11-27')],
    { today: T });
  ok(moved.relisted === 3 && moved.removed.length === 1 && moved.added.length === 1,
    're-listed under a new id (same name, city and date, or a series holding the date) is neither removed nor added',
    `relisted ${moved.relisted}, removed ${moved.removed.map((x) => x.e.name)}, added ${moved.added.map((x) => x.e.name)}`);
}

console.log('\nrefresh history and delistings');
{
  const T = '2026-10-29';
  const ev = (name, feed_id, o = {}) => ({ name, city: 'Austin', feed_source: 'meetup', feed_id, feed_organiser: 'Org', next_date: '2026-11-10', ...o });
  const before = Array.from({ length: 1000 }, (_, i) => ev(`Talk ${i}`, `meetup:${i}`));
  const after = before.slice(60).concat([ev('New one', 'meetup:new'), { name: 'Conf', city: 'Austin', next_date: '2027-03-01' }]);
  const d = diffEvents(before, after, { today: T });
  const row = historyRow(d, { base: 'abc1234', today: T });
  ok(row.added.total === 2 && row.added.curated === 1 && row.added.feed === 1, 'row: added split curated and feed', JSON.stringify(row.added));
  ok(row.removed.feed === 60 && row.removed_by_reason['no longer listed'] === 60 && row.before === 1000 && row.after === 942,
    'row: removals by reason and totals');

  const r1 = upsertHistory([], row);
  const r2 = upsertHistory(r1, { ...row, added: { total: 5, curated: 0, feed: 5 } });
  ok(r2.length === 1 && r2[0].added.total === 5, 'history: a rebuild against the same base replaces its row');
  const r3 = upsertHistory(r2, { ...row, base: 'def5678' });
  ok(r3.length === 2 && r3.map((r) => r.base).join() === 'abc1234,def5678', 'history: a new base adds a row');
  const none = { ...row, base: 'fff0000', added: { total: 0 }, removed: { total: 0 }, redated: { total: 0 } };
  ok(upsertHistory(r3, none).length === 2, 'history: a build that changed nothing adds no row');

  const flagged = delistings(d, before);
  ok(flagged.length === 1 && flagged[0].source === 'meetup' && flagged[0].removed === 60 && !flagged[0].failed,
    'delistings: above 50 and 5% of a source is flagged', JSON.stringify(flagged));
  ok(delistings(d, before, new Set(['meetup']))[0].failed, 'delistings: a source that failed this run is marked');
  ok(!delistings(diffEvents(before, before.slice(40), { today: T }), before).length, 'delistings: 40 events is not flagged');
  const many = Array.from({ length: 5000 }, (_, i) => ev(`Big ${i}`, `meetup:b${i}`));
  ok(!delistings(diffEvents(many, many.slice(100), { today: T }), many).length, 'delistings: 100 of 5000 (2%) is not flagged');

  const reg = { sources: [{ name: 'Strike Zone', tech: false, reason: 'retired by oct25 review' }, { name: 'Kept', tech: false, reason: 'gate' }, { name: 'X', tech: true }] };
  ok([...retiredOrganisers(reg)].join() === 'Strike Zone' && retiredOrganisers(null).size === 0, 'retired: only organisers a person retired');
}

console.log(failed ? `\n${failed} CHECK(S) FAILED` : `\nALL ${passed} SCRIPT CHECKS PASSED`);
process.exit(failed ? 1 : 0);
