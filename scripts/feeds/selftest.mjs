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
import { devpostRange, looksLikeVenue, devpostPageDone, devpostEvent, devEventWanted } from './adapters/datasets.mjs';
import { toEvent as guildEvent } from './adapters/guild.mjs';
import { toEvent as localistEvent, merge as localistMerge } from './adapters/localist.mjs';
import { coreName, coverageIndex, isCovered, decisions, usCaHint, returning, toTsv } from './returning.mjs';
import { today } from '../lib/today.mjs';
import { parseIcal } from './lib/ical.mjs';
import { fromText, fromParts, localDate } from './lib/geo.mjs';
import { judge, judgeOrganiser } from './lib/relevance.mjs';
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

console.log('\nDevpost past editions');
{
  const since = '2025-04-01';
  ok(devpostPageDone([], since) === true && devpostPageDone([]) === true, 'an empty page ends the listing');
  ok(devpostPageDone(['2025-01-10', '2024-11-02', '2025-03-30'], since) === true, 'every event older than since: stop');
  ok(devpostPageDone(['2024-05-05', '2026-03-06', '2026-02-20'], since) === false, 'a pinned old item among new ones: continue');
  ok(devpostPageDone(['2025-04-01', '2025-01-01'], since) === false, 'an event on the since day is not older');
  ok(devpostPageDone([null, '2025-01-01'], since) === false, 'an unparseable date is not proof of age');
  ok(devpostPageDone(['2020-01-01'], '') === false, 'without since, age never stops it');
  const h = { id: 7, title: 'Hack Canada', url: 'https://hack-canada.devpost.com', submission_period_dates: 'Mar 06 - 08, 2026',
    displayed_location: { location: 'SPUR Innovation Centre' }, organization_name: 'Hack Canada', invite_only: false };
  const e = devpostEvent(h);
  ok(e && e.place === null && e.location_text === 'SPUR Innovation Centre', 'unplaced event kept, with its raw location', JSON.stringify(e));
  ok(e.start_date === '2026-03-06' && e.end_date === '2026-03-08', 'dates from the submission period');
  ok(devpostEvent({ ...h, invite_only: true }) === null, 'invite-only still dropped');
  ok(devpostEvent({ ...h, invite_only: true }, { inviteOnly: true })?.title === 'Hack Canada', 'invite-only kept when asked (past editions)');
  ok(devpostEvent({ ...h, displayed_location: { location: 'Online' } }) === null, 'online-only still dropped');
  ok(devpostEvent({ ...h, submission_period_dates: 'Mar 06 - Apr 30, 2026' }) === null, 'a window of weeks still dropped');
}

console.log('\ndevelopers.events window');
{
  ok(devEventWanted('2020-01-01', '2020-01-02') === false, 'default drops past events');
  ok(devEventWanted('2020-01-01', today()) === true, 'default keeps an event still running');
  ok(devEventWanted('2020-01-01', '', '2019-01-01') === true, 'since keeps past events after it');
  ok(devEventWanted('2018-12-31', '', '2019-01-01') === false, 'since drops events before it');
  ok(devEventWanted('2019-01-01', '', '2019-01-01') === true, 'since is inclusive');
}

console.log('\nReturning editions (returning.mjs)');
{
  for (const [title, core] of [['Hack Canada 2026', 'hack canada'], ['Hack Western 13', 'hack western'],
    ['Cal Hacks 13.0 ', 'cal hacks'], ['SwampHacks XII', 'swamphacks'], ['HackPrinceton Fall 2026', 'hackprinceton'],
    ['uOttaHack 9', 'uottahack'], ['Hack the North', 'hack the north'], ['11th Annual DevFest', 'annual devfest'],
    ['Columbia x Google', 'columbia x google'], ['Hack4Good', 'hack4good'], ['DC Hacks', 'dc hacks']]) {
    ok(coreName(title) === core, `coreName: ${JSON.stringify(title)} -> ${JSON.stringify(core)}`, coreName(title));
  }

  const NOW = '2026-10-22';
  // Hack Canada 2026 as Devpost's ended listing gave it: a venue, no city.
  const hc = { feed: 'devpost', feed_id: 'devpost:7', title: 'Hack Canada 2026', url: 'https://hack-canada.devpost.com/',
    start_date: '2026-03-06', end_date: '2026-03-08', place: null, location_text: 'SPUR Innovation Centre' };
  const toronto = { name: 'Hack Canada', city: 'Toronto', region: 'Ontario', country: 'Canada',
    url: 'https://hackcanada.org/', next_date: '2027-01-08', last_date: '2026-03-06' };
  const others = [{ name: 'Hack the North', city: 'Waterloo', country: 'Canada', url: 'https://hackthenorth.com/', next_date: '2026-09-12' }];
  ok(!isCovered(hc, coverageIndex(others, NOW)), 'Hack Canada 2026 (Waterloo, Devpost) not covered without a record of it');
  ok(isCovered(hc, coverageIndex([...others, toronto], NOW)), 'covered by a curated record in another city (Toronto)');
  ok(isCovered({ ...hc, title: 'HackCanada' }, coverageIndex([toronto], NOW)), 'names compared with spaces removed too');
  // The feed keeps last year's editions for a while, under the same name and link.
  const pastFeed = { name: 'Hack Canada 2026', city: 'Waterloo', country: 'Canada', url: 'https://hack-canada.devpost.com/',
    next_date: '2026-03-06', next_date_end: '2026-03-08', feed_source: 'devpost' };
  ok(!isCovered(hc, coverageIndex([pastFeed], NOW)), 'a past feed record (the same edition) does not cover');
  ok(isCovered(hc, coverageIndex([{ ...pastFeed, name: 'Hack Canada 2027', next_date: '2027-01-08', next_date_end: '' }], NOW)),
    'an upcoming feed record covers');
  ok(isCovered({ ...hc, title: 'Something Else', url: 'https://www.hackcanada.org/2026' }, coverageIndex([toronto], NOW)),
    'same own host, www. ignored: covered');
  for (const [a, b] of [['https://hack-canada.devpost.com/', 'https://other.devpost.com/'], ['https://mlh.com/e/1', 'https://mlh.com/e/2'],
    ['https://lu.ma/a', 'https://lu.ma/b'], ['https://luma.com/a', 'https://luma.com/b'], ['https://www.eventbrite.ca/e/1', 'https://www.eventbrite.ca/e/2'],
    ['https://www.meetup.com/a/', 'https://www.meetup.com/b/'], ['https://github.com/a', 'https://github.com/b']]) {
    ok(!isCovered({ title: 'Alpha Hacks', url: a }, coverageIndex([{ name: 'Beta Conf', url: b, country: 'Canada' }], NOW)),
      `platform host never a match: ${new URL(a).hostname}`);
  }

  ok(usCaHint(hc), 'unplaced, but the title names Canada: kept');
  ok(!usCaHint({ title: 'Spur Hacks', location_text: 'SPUR Innovation Centre' }), 'unplaced with no hint: dropped');
  ok(usCaHint({ title: 'Spur Hacks', location_text: 'Main Campus, ON' }), 'a province code in the location: kept');
  ok(usCaHint({ title: 'Hacks of Ontario', location_text: '' }), 'a province name in the title: kept');
  ok(!usCaHint({ title: 'HACK IN STYLE', location_text: 'Lagos' }), 'a capitalised word in a title is no state code');

  const logs = [
    { pass: 'oct21-d1', date: '2026-10-21', returning: [{ name: 'Swamp Hacks', verdict: 'rejected', reason: 'x' },
      { name: 'Alpha Hacks', verdict: 'unresolved', reason: 'no site' }] },
    { pass: 'oct14-d1', date: '2026-10-14', returning: [{ name: 'Alpha Hacks 2026', verdict: 'unresolved', reason: 'x' },
      { name: 'Beta Hacks', verdict: 'exists', reason: 'x' }, { name: 'Gamma Hacks', verdict: 'added', reason: 'x' }] },
  ];
  const d = decisions(logs);
  ok(d.get('swamp hacks')?.decided && d.get('beta hacks')?.decided && d.get('gamma hacks')?.decided, 'rejected, exists and added settle a candidate');
  ok(!d.get('alpha hacks')?.decided && d.get('alpha hacks')?.last_tried === '2026-10-21', 'unresolved keeps it, with the last date tried');

  const place = (city, region, country) => ({ city, region, country, tz: '' });
  const ev = (feed, title, start, p, extra = {}) => ({ feed, feed_id: `${feed}:${title}`, title, url: '', start_date: start, end_date: '',
    place: p, location_text: p ? `${p.city}, ${p.region}` : '', ...extra });
  const { rows, counts } = returning({ now: NOW, records: others, logs, editions: {
    devpost: [hc, ev('devpost', 'Swamp Hacks XI', '2026-01-24', place('Gainesville', 'Florida', 'United States')),
      ev('devpost', 'Lost Hacks', '2026-02-01', null, { location_text: 'SPUR Innovation Centre' }),
      ev('devpost', 'Alpha Hacks', '2026-02-10', place('Austin', 'Texas', 'United States')),
      ev('devpost', 'Delta Hacks 2024', '2024-11-01', place('Hamilton', 'Ontario', 'Canada')),
      ev('devpost', 'Euro Hacks', '2026-05-01', place('Paris', 'Ile-de-France', 'France'))],
    mlh: [ev('mlh', 'Hack Canada', '2026-03-06', place('Waterloo', 'Ontario', 'Canada')),
      ev('mlh', 'Epsilon Hacks', '2025-11-14', place('Boston', 'Massachusetts', 'United States')),
      ev('mlh', 'Epsilon Hacks', '2025-04-25', place('Boston', 'Massachusetts', 'United States')),
      ev('mlh', 'Hack the North 2025', '2025-09-12', place('Waterloo', 'Ontario', 'Canada')),
      ev('mlh', 'Zeta Hacks', '2026-10-10', place('Boston', 'Massachusetts', 'United States')),
      ev('mlh', 'Eta Hacks', '2025-10-04', place('Boston', 'Massachusetts', 'United States'))],
  } });
  const hcRow = rows.find((r) => r.core === 'hack canada');
  ok(hcRow && hcRow.sources === 'devpost,mlh' && hcRow.section === 'placed' && hcRow.city === 'Waterloo',
    'one row per event, every source listed; on a tie the placed edition', JSON.stringify(hcRow));
  ok(rows.find((r) => r.core === 'epsilon hacks')?.last_start === '2025-11-14', 'the most recent edition kept');
  ok(!rows.some((r) => ['swamp hacks', 'hack the north', 'delta hacks', 'euro hacks', 'lost hacks'].includes(r.core)),
    'decided, covered, too old, abroad and unhinted all left out', rows.map((r) => r.core).join(','));
  ok(counts.decided === 1 && counts.covered === 1 && counts.outOfWindow === 1 && counts.notUsCa === 1 && counts.unplacedNoHint === 1,
    'each drop counted', JSON.stringify(counts));
  ok(rows.map((r) => r.core).join(',') === 'eta hacks,epsilon hacks,hack canada,zeta hacks,alpha hacks',
    'ordered by when the month comes round again (overdue first, last week’s last); tried after untried', rows.map((r) => r.core).join(','));
  ok(rows.find((r) => r.core === 'alpha hacks')?.last_tried === '2026-10-21', 'last_tried carried to the row');
  ok(toTsv(rows).split('\n')[0].split('\t').length === 13, 'thirteen TSV columns');
}

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
// oct11 audit: one source's "Québec City" split the city in two, and "Boston," made another.
ok(fromParts({ city: 'Québec City', region: 'QC', country: 'CA' })?.city === fromParts({ city: 'Quebec City', region: 'QC', country: 'CA' })?.city,
  'accents do not split a city', fromParts({ city: 'Québec City', region: 'QC', country: 'CA' })?.city);
ok(fromParts({ city: 'Boston,', region: 'MA', country: 'US' })?.city === 'Boston', 'trailing comma dropped');
ok(fromParts({ city: 'Boston, MA', region: 'MA', country: 'US' })?.city === 'Boston', 'state named in the city field dropped, comma too');

console.log('\nVenues standing in for cities (free-text sources)');
for (const [city, venue] of [['iCode Shrewbury', true], ['Princeton High School', true], ['Tennessee', true],
  ['Pleasanton', false], ['Asbury Park', false], ['New York', false], ['Washington', false]]) {
  ok(looksLikeVenue({ city, country: 'United States' }) === venue, `${city}: ${venue ? 'not a place' : 'a city'}`);
}

console.log('\nRelevance');
ok(judge({ title: 'Python developers meetup' }).keep, 'clear tech title kept');
ok(!judge({ title: 'Romantasy Book Club' }).keep, 'off-topic title dropped');
ok(!judge({ title: 'Negotiation Skills Training | 2 Day Workshop', platformTech: 'eventbrite' }).keep, 'corporate course dropped despite tag');
// Missed before Luma's full listings were read (oct07): how tech people name their events.
for (const t of ['Waterloo.Dev Fest: Who Gets to Build, Own, and Define the Future?', 'INNOVATE x Amazon: Tech Careers Edition',
  'CTO Dinner (Ripple x Mycroft x QA Wolf)', 'Toronto Mac Admins Meetup', 'Private Dinner on Personal Agent Evals']) {
  ok(judge({ title: t }).keep, `kept: ${t.slice(0, 40)}`);
}
ok(judgeOrganiser({ name: 'Waterloo.dev', description: '' }, []).tech, 'a .dev organiser name reads as tech');
ok(!judge({ title: 'Real Estate Investor Pitch Night' }).keep, 'real-estate investing dropped even beside pitch words');
ok(judge({ title: 'Proptech founders night: AI meets real estate' }).keep, 'proptech still kept');

console.log('\nGuild.host');
{
  // Trimmed from the real /api/next/events/upcoming payload (oct22): the venue is
  // coordinates only, and an online event has no venue at all.
  const cities = [{ city: 'Toronto', region: 'Ontario', country: 'Canada', lat: 43.6532, lng: -79.3832 },
    { city: 'Columbus', region: 'Ohio', country: 'United States', lat: 39.9612, lng: -82.9988 }];
  const node = (o) => ({ slug: 'vtxfsz', fullUrl: 'https://guild.host/events/technology-walk-brampton-vtxfsz', name: 'Technology Walk Brampton',
    description: 'An educational, guided tour.\n\nCivicTechBrampton is hosting a walk.', startAt: '2026-10-22T22:00:00+00:00',
    endAt: '2026-10-23T00:30:00+00:00', timeZone: 'America/Toronto', visibility: 'LISTED', hasVenue: true,
    owner: { name: 'Civic Tech Brampton' }, venue: { address: { location: { geojson: { type: 'Point', coordinates: [-79.7597488, 43.6862613] } } } }, ...o });
  const at = (lon, lat) => ({ address: { location: { geojson: { coordinates: [lon, lat] } } } });
  const walk = guildEvent(node(), cities);
  ok(walk?.place?.city === 'Toronto' && walk.place.country === 'Canada', 'coordinates resolve to the nearest followed city', walk?.place?.city);
  ok(walk?.feed_id === 'guild:vtxfsz' && walk.organiser.name === 'Civic Tech Brampton', 'id from the slug, organiser is the group');
  ok(walk?.start_date === '2026-10-22' && walk.end_date === '', "same local day: no end date");
  ok(walk?.description === 'An educational, guided tour. CivicTechBrampton is hosting a walk.', 'description flattened to one line');
  const late = guildEvent(node({ startAt: '2026-10-23T01:00:00+00:00', endAt: '2026-10-23T03:00:00+00:00' }), cities);
  ok(late?.start_date === '2026-10-22', 'an evening start falls on its local day, not the UTC one', late?.start_date);
  ok(guildEvent(node({ venue: null, hasVenue: false }), cities) === null, 'no venue: online, skipped');
  ok(guildEvent(node({ venue: at(-0.0916051, 51.5206763), timeZone: 'Europe/London' }), cities) === null, 'London skipped');
  const far = guildEvent(node({ venue: at(-100.3, 41.1) }), cities);
  ok(far && far.place === null, 'North America but near no followed city: unplaced, left to the place overrides');
  ok(guildEvent(node({ visibility: 'UNLISTED' }), cities) === null, 'unlisted event skipped');
  // Windsor, ON is 2 km from Detroit: the zone must keep it out of the US.
  const detroit = { city: 'Detroit', region: 'Michigan', country: 'United States', lat: 42.3314, lng: -83.0458 };
  const windsor = guildEvent(node({ venue: at(-83.0364, 42.3149), timeZone: 'America/Toronto' }), [...cities, detroit]);
  ok(windsor && windsor.place === null, 'Windsor, ON is not placed in Detroit (zone says Canada)');
  const det = guildEvent(node({ venue: at(-83.0458, 42.3314), timeZone: 'America/Detroit' }), [...cities, detroit]);
  ok(det?.place?.city === 'Detroit' && det.place.country === 'United States', 'a Detroit event is still placed in Detroit');
  const montreal = { city: 'Montreal', region: 'Quebec', country: 'Canada', lat: 45.5019, lng: -73.5674 };
  const mtl = guildEvent(node({ venue: at(-73.5674, 45.5019), timeZone: 'America/Montreal' }), [...cities, montreal]);
  ok(mtl?.place?.country === 'Canada' && mtl.place.city, 'an America/Montreal (legacy alias) event is placed', mtl?.place?.city);
  const utc = guildEvent(node({ timeZone: 'Etc/UTC' }), cities);
  ok(utc?.place?.city === 'Toronto', 'a zone naming no country (Etc/UTC) falls back to distance', utc?.place?.city);
}

console.log('\nLocalist');
{
  // Trimmed from the real events.stanford.edu/api/2/events?keyword=entrepreneurship
  // payload (oct22). One row per instance: the recurring hackathon is three rows.
  const geo = { latitude: '37.42816', longitude: '-122.175935', street: '473 Via Ortega', city: 'Stanford', state: 'CA', country: 'US', zip: '94305' };
  const inst = (start, end = null) => [{ event_instance: { start, end, all_day: !end } }];
  const ev = (o) => ({ event: { id: 53922734404263, title: 'Big Earth Hackathon: Wildland Fire Challenge', url: 'https://www.stanfordbigearthhackathon.com/',
    localist_url: 'https://events.stanford.edu/event/big-earth-hackathon-wildland-fire-challenge', experience: 'inperson', status: 'live', private: false,
    free: false, location_name: 'Y2E2 Building', address: '473 Via Ortega, Stanford, CA 94305', geo, description_text: 'Big Earth   Hackathon\n\nbridges the gap.',
    departments: [{ id: 42863165257059, name: 'Sustainability Accelerator' }], event_instances: inst('2026-10-26T00:00:00-07:00'), ...o } });
  const h = { host: 'events.stanford.edu', name: 'Stanford University' };
  const e = localistEvent(ev().event, h);
  ok(e?.feed_id === 'localist:events.stanford.edu:53922734404263' && e.start_date === '2026-10-26', 'id carries the host; date read off the local string', e?.start_date);
  ok(e?.place?.city === 'Stanford' && e.place.region === 'California' && e.place.country === 'United States', 'place from geo parts', e?.place?.city);
  ok(e?.organiser.name === 'Sustainability Accelerator' && e.venue === 'Y2E2 Building' && e.cost === 'varies' && e.online === false, 'department is the organiser; venue kept');
  ok(e?.description === 'Big Earth Hackathon bridges the gap.', 'description flattened');
  ok(e?.url === 'https://events.stanford.edu/event/big-earth-hackathon-wildland-fire-challenge', 'the calendar page is the url');
  const late = localistEvent(ev({ event_instances: inst('2026-10-26T19:00:00-07:00', '2026-10-27T01:00:00-07:00') }).event, h);
  ok(late?.start_date === '2026-10-26' && late.end_date === '2026-10-27', 'an evening start stays on its local day', late?.start_date);
  const noGeo = localistEvent(ev({ geo: null, address: '475 Via Ortega, Stanford, CA 94305, United States' }).event, h);
  ok(noGeo?.place?.city === 'Stanford', 'no geo: place from the address text');
  const bare = localistEvent(ev({ geo: { city: null }, address: '', location_name: 'Sloan Mathematics Center' }).event, h);
  ok(bare && bare.place === null, 'no address at all: unplaced, left to the place overrides');
  ok(localistEvent(ev({ experience: 'hybrid' }).event, h) === null, 'hybrid skipped');
  ok(localistEvent(ev({ experience: 'online' }).event, h) === null, 'online skipped');
  ok(localistEvent(ev({ private: true }).event, h) === null, 'private skipped');
  ok(localistEvent(ev({ status: 'pending' }).event, h) === null, 'not live skipped');
  ok(localistEvent(ev({ event_instances: [] }).event, h) === null, 'no instance skipped');
  // Dedupe: three rows of one event (and the same rows again for a second keyword), plus another event.
  const rows = [ev({ event_instances: inst('2026-11-02T00:00:00-08:00') }), ev(), ev({ event_instances: inst('2026-11-04T00:00:00-08:00') }),
    ev({ id: 53985696802248, title: 'STVP Observation Lab X Accel' })];
  const byId = new Map();
  localistMerge(byId, rows, h);
  localistMerge(byId, rows, h);
  const kept = [...byId.values()];
  ok(kept.length === 2, 'rows collapse to one event per id, across keywords', String(kept.length));
  ok(kept.find((x) => x.feed_id.endsWith(':53922734404263'))?.start_date === '2026-10-26', 'a recurrence is dated at its next instance, not the order it arrived in');
}

console.log('\nEmbedded JSON');
ok(assignedJson('<script>window.__SERVER_DATA__ = {"a":{"b":"}{\\"x"}};</script>', 'window.__SERVER_DATA__')?.a?.b === '}{"x',
  'object boundary found through braces inside strings');

console.log(failed ? `\n${failed} CHECK(S) FAILED` : `\nALL ${passed} FEED CHECKS PASSED`);
process.exit(failed ? 1 : 0);
