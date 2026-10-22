#!/usr/bin/env node
/**
 * Offline checks for the scripts outside the feed — no network, nothing read
 * from data/. Same shape as scripts/feeds/selftest.mjs: add a section per
 * script, each under its own console.log heading.
 *
 *   node scripts/selftest.mjs
 */
import { validateRecord } from './lib/record.mjs';

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

console.log(failed ? `\n${failed} CHECK(S) FAILED` : `\nALL ${passed} SCRIPT CHECKS PASSED`);
process.exit(failed ? 1 : 0);
