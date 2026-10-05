#!/usr/bin/env node
/**
 * Offline checks for the feed's parsing — no network. Each adapter is fed a
 * small fixture shaped like the real payload, and the output is checked field
 * by field. These exist because a parsing slip corrupts data silently: a
 * whitespace regex missing its backslash once stripped every "s" from every
 * Meetup description, and nothing failed.
 *
 *   node scripts/feeds/selftest.mjs
 */
import { readApollo } from './adapters/meetup.mjs';
import { toEvent as lumaEvent } from './adapters/luma.mjs';
import { toEvent as eventbriteEvent } from './adapters/eventbrite.mjs';
import { devpostRange, looksLikeVenue } from './adapters/datasets.mjs';
import { parseIcal } from './lib/ical.mjs';
import { fromText, fromParts, localDate } from './lib/geo.mjs';
import { judge } from './lib/relevance.mjs';
import { assignedJson } from './lib/http.mjs';

let failed = 0, passed = 0;
function ok(cond, label, detail = '') {
  if (cond) passed++; else failed++;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
}

const PROSE = 'Pass the sessions, sips and snacks.\n\nSee   you  soon — sincerely, the organisers.';
const PROSE_FLAT = 'Pass the sessions, sips and snacks. See you soon — sincerely, the organisers.';

console.log('Meetup');
{
  const apollo = {
    'Event:1': { __typename: 'Event', id: '1', title: 'Seattle Python Meetup', dateTime: '2026-10-14T18:30:00-07:00',
      eventUrl: 'https://www.meetup.com/seapy/events/1/', eventType: 'PHYSICAL', description: PROSE,
      venue: { __ref: 'Venue:9' }, group: { __ref: 'Group:seapy' } },
    'Event:2': { __typename: 'Event', id: '2', title: 'Online only', dateTime: '2026-10-15T18:30:00-07:00',
      eventUrl: 'https://www.meetup.com/seapy/events/2/', eventType: 'ONLINE', group: { __ref: 'Group:seapy' } },
    'Venue:9': { name: 'Fremont Hall', city: 'Seattle', state: 'WA', country: 'us' },
    'Group:seapy': { urlname: 'seapy', name: 'Seattle Python' },
  };
  const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { __APOLLO_STATE__: apollo } } })}</script>`;
  const found = readApollo(html);
  ok(found.length === 1, 'keeps in-person events, drops online ones', `${found.length}`);
  const [e, g] = found[0];
  ok(e.description === PROSE_FLAT, 'description: whitespace collapsed, letters intact', e.description);
  ok(e.start_date === '2026-10-14', 'date is the local calendar date from the offset timestamp');
  ok(e.place?.city === 'Seattle' && e.place?.region === 'Washington', 'place from venue', JSON.stringify(e.place));
  ok(g.urlname === 'seapy', 'group dereferenced');
}

console.log('\nLuma');
{
  const e = lumaEvent({
    event: { api_id: 'evt-1', name: 'SF Builders Night', url: 'sf-builders', start_at: '2026-10-08T01:00:00.000Z',
      end_at: '2026-10-08T04:00:00.000Z', timezone: 'America/Los_Angeles', location_type: 'offline',
      geo_address_info: { city: 'San Francisco', region: 'California', country: 'United States', address: '1 Market St' } },
    ticket_info: { is_free: true },
  }, { api_id: 'cal-1', name: 'Builders' });
  ok(e.start_date === '2026-10-07', '6pm Pacific stays on its local day, not the UTC one', e.start_date);
  ok(e.url === 'https://luma.com/sf-builders' && e.cost === 'free', 'link and cost');
  ok(e.place?.city === 'San Francisco', 'place from geo_address_info');
  const abroad = lumaEvent({ event: { api_id: 'evt-2', name: 'x', url: 'x', start_at: '2026-10-08T10:00:00Z',
    timezone: 'Europe/Dublin', geo_address_info: { city: 'Dublin', region: 'County Dublin', country: 'Ireland' } } }, {});
  ok(abroad.place === null, 'an event outside the US and Canada gets no place');
}

console.log('\nEventbrite');
{
  const e = eventbriteEvent({
    id: '123456789012', name: 'Austin AI Meetup', url: 'https://www.eventbrite.com/e/x-123456789012?aff=1',
    start_date: '2026-11-05', end_date: '2026-11-05', summary: PROSE, primary_organizer_id: '42',
    primary_venue: { name: 'Capital Factory', address: { city: 'Austin', region: 'TX', country: 'US' } },
    tags: [{ display_name: 'High Tech' }], ticket_availability: { is_free: true },
  });
  ok(e.description === PROSE_FLAT, 'summary: whitespace collapsed, letters intact', e.description);
  ok(e.url === 'https://www.eventbrite.com/e/x-123456789012', 'tracking query stripped from the link');
  ok(e.platformTech === 'eventbrite' && e.organiser.id === 'eventbrite:42', 'High Tech tag and organiser id kept');
  ok(e.place?.region === 'Texas', 'region code resolved', e.place?.region);
  ok(eventbriteEvent({ is_online_event: true, start_date: '2026-11-05' }) === null, 'online events dropped');
}

console.log('\nDevpost dates');
ok(JSON.stringify(devpostRange('Oct 10 - 11, 2026')) === '["2026-10-10","2026-10-11"]', 'same-month range');
ok(JSON.stringify(devpostRange('Dec 30 - Jan 02, 2027')) === '["2026-12-30","2027-01-02"]', 'range across new year');
ok(JSON.stringify(devpostRange('Oct 10, 2026')) === '["2026-10-10","2026-10-10"]', 'single day');

console.log('\niCal');
{
  const ics = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:a1', 'SUMMARY:Hack Night\\, Seattle',
    'DESCRIPTION:Line one\\nLine two with a long tail that is', ' folded onto the next line',
    'DTSTART;TZID=America/Los_Angeles:20261020T180000', 'LOCATION:Hyatt\\, 900 Bellevue Way NE\\, Bellevue\\, WA\\, 98004\\, United States',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const [v] = parseIcal(ics);
  ok(v.title === 'Hack Night, Seattle', 'escaped comma unescaped', v.title);
  ok(v.description.includes('tail that isfolded'), 'folded line rejoined');
  ok(localDate(v.start.instant, 'America/Los_Angeles') === '2026-10-20', 'TZID start kept on its local day');
  ok(fromText(v.location)?.city === 'Bellevue', 'place from LOCATION', fromText(v.location)?.city);
}

console.log('\nPlaces');
ok(fromText('Toronto, ON M5V 2T6, Canada')?.region === 'Ontario', 'Canadian postal code');
ok(fromParts({ city: 'SAN JOSE', region: 'CA', country: 'US' })?.city === 'San Jose', 'shouting city normalised');
ok(fromParts({ city: 'SAP Office — San Ramon', region: 'CA', country: 'US' })?.city === 'San Ramon', 'venue prefix dropped');
ok(fromParts({ city: 'San francisco', region: 'CA', country: 'US' })?.city === 'San Francisco', 'mixed case takes the curated spelling');

console.log('\nVenues standing in for cities (free-text sources)');
for (const [city, venue] of [['iCode Shrewbury', true], ['Princeton High School', true], ['Tennessee', true],
  ['Pleasanton', false], ['Asbury Park', false], ['New York', false], ['Washington', false]]) {
  ok(looksLikeVenue({ city, country: 'United States' }) === venue, `${city}: ${venue ? 'not a place' : 'a city'}`);
}

console.log('\nRelevance');
ok(judge({ title: 'Python developers meetup' }).keep, 'clear tech title kept');
ok(!judge({ title: 'Romantasy Book Club' }).keep, 'off-topic title dropped');
ok(!judge({ title: 'Negotiation Skills Training | 2 Day Workshop', platformTech: 'eventbrite' }).keep, 'corporate course dropped despite tag');

console.log('\nEmbedded JSON');
ok(assignedJson('<script>window.__SERVER_DATA__ = {"a":{"b":"}{\\"x"}};</script>', 'window.__SERVER_DATA__')?.a?.b === '}{"x',
  'object boundary found through braces inside strings');

console.log(failed ? `\n${failed} CHECK(S) FAILED` : `\nALL ${passed} FEED CHECKS PASSED`);
process.exit(failed ? 1 : 0);
