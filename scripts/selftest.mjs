#!/usr/bin/env node
/**
 * Offline checks for the scripts outside the feed — no network, nothing read
 * from data/. Same shape as scripts/feeds/selftest.mjs: add a section per
 * script, each under its own console.log heading.
 *
 *   node scripts/selftest.mjs
 */
import { validateRecord, decideAdd } from './lib/record.mjs';
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
  const verdict = (r, curated = [], again = false) => decideAdd(r, curated, again, NOW);

  ok(verdict(rec).verdict === 'ADD', 'a valid new record is added');
  const bad = verdict({ ...rec, country: 'Canda' });
  ok(bad.verdict === 'REJECT' && /invalid record: .*country/.test(bad.message), 'an invalid record is rejected with its problems');
  ok(verdict(rec, [{ ...rec, topics: [...rec.topics] }]).verdict === 'DONE', 'an identical curated record is DONE (idempotent re-run)');
  const differs = verdict(rec, [{ ...rec, next_date: '2027-01-15' }]);
  ok(differs.verdict === 'REJECT' && /update/.test(differs.message), 'a differing curated record is rejected, pointing at update');
  ok(verdict(rec, []).verdict === 'ADD', 'a feed-only twin (not passed as curated) does not block');
  ok(verdict(rec, [rec], true).verdict === 'REJECT' && /this run/.test(verdict(rec, [rec], true).message), 'a repeat of an identical add in one run is rejected, not DONE');
  ok(verdict({ ...rec, venue: '' }, [rec], true).verdict === 'REJECT', 'a differing repeat in one run is rejected');
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

  ok(names(plan()).join() === 'Denver,Boise,Cary,Toronto,Austin', 'never searched first, ties by fewest curated records then name', names(plan()).join());
  const searched = { 'Denver|Colorado': '2026-10-01', 'Boise|Idaho': '2026-08-01', 'Austin|Texas': '2026-08-01' };
  ok(names(plan(searched)).join() === 'Cary,Toronto,Boise,Austin,Denver',
    'then longest since searched, ties by fewest curated records', names(plan(searched)).join());
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
  ok(Object.keys(merged).length === 3, 'logs with no cities, or a city entry with no name, add nothing');
}

console.log(failed ? `\n${failed} CHECK(S) FAILED` : `\nALL ${passed} SCRIPT CHECKS PASSED`);
process.exit(failed ? 1 : 0);
