/**
 * Location -> { city, region, country, tz } for feed events.
 *
 * Sources describe place differently — a structured object, "City, ST", a full
 * street address — and several give times in UTC. An evening event in the west
 * falls on the next calendar day in UTC: Luma writes a 6pm San Jose start as
 * 01:00Z the following morning. So every event needs its local time zone before
 * its date can be trusted, and the zone comes from where it is.
 */
import { readFileSync } from 'node:fs';
import { canonPlace } from '../../lib/places.mjs';

const US = {
  AL: ['Alabama', 'America/Chicago'], AK: ['Alaska', 'America/Anchorage'], AZ: ['Arizona', 'America/Phoenix'],
  AR: ['Arkansas', 'America/Chicago'], CA: ['California', 'America/Los_Angeles'], CO: ['Colorado', 'America/Denver'],
  CT: ['Connecticut', 'America/New_York'], DE: ['Delaware', 'America/New_York'], DC: ['District of Columbia', 'America/New_York'],
  FL: ['Florida', 'America/New_York'], GA: ['Georgia', 'America/New_York'], HI: ['Hawaii', 'Pacific/Honolulu'],
  ID: ['Idaho', 'America/Boise'], IL: ['Illinois', 'America/Chicago'], IN: ['Indiana', 'America/Indiana/Indianapolis'],
  IA: ['Iowa', 'America/Chicago'], KS: ['Kansas', 'America/Chicago'], KY: ['Kentucky', 'America/New_York'],
  LA: ['Louisiana', 'America/Chicago'], ME: ['Maine', 'America/New_York'], MD: ['Maryland', 'America/New_York'],
  MA: ['Massachusetts', 'America/New_York'], MI: ['Michigan', 'America/Detroit'], MN: ['Minnesota', 'America/Chicago'],
  MS: ['Mississippi', 'America/Chicago'], MO: ['Missouri', 'America/Chicago'], MT: ['Montana', 'America/Denver'],
  NE: ['Nebraska', 'America/Chicago'], NV: ['Nevada', 'America/Los_Angeles'], NH: ['New Hampshire', 'America/New_York'],
  NJ: ['New Jersey', 'America/New_York'], NM: ['New Mexico', 'America/Denver'], NY: ['New York', 'America/New_York'],
  NC: ['North Carolina', 'America/New_York'], ND: ['North Dakota', 'America/Chicago'], OH: ['Ohio', 'America/New_York'],
  OK: ['Oklahoma', 'America/Chicago'], OR: ['Oregon', 'America/Los_Angeles'], PA: ['Pennsylvania', 'America/New_York'],
  RI: ['Rhode Island', 'America/New_York'], SC: ['South Carolina', 'America/New_York'], SD: ['South Dakota', 'America/Chicago'],
  TN: ['Tennessee', 'America/Chicago'], TX: ['Texas', 'America/Chicago'], UT: ['Utah', 'America/Denver'],
  VT: ['Vermont', 'America/New_York'], VA: ['Virginia', 'America/New_York'], WA: ['Washington', 'America/Los_Angeles'],
  WV: ['West Virginia', 'America/New_York'], WI: ['Wisconsin', 'America/Chicago'], WY: ['Wyoming', 'America/Denver'],
};
const CA = {
  BC: ['British Columbia', 'America/Vancouver'], AB: ['Alberta', 'America/Edmonton'], SK: ['Saskatchewan', 'America/Regina'],
  MB: ['Manitoba', 'America/Winnipeg'], ON: ['Ontario', 'America/Toronto'], QC: ['Quebec', 'America/Toronto'],
  NB: ['New Brunswick', 'America/Moncton'], NS: ['Nova Scotia', 'America/Halifax'], PE: ['Prince Edward Island', 'America/Halifax'],
  NL: ['Newfoundland and Labrador', 'America/St_Johns'], YT: ['Yukon', 'America/Whitehorse'],
  NT: ['Northwest Territories', 'America/Yellowknife'], NU: ['Nunavut', 'America/Iqaluit'],
};
// States split across zones: the state default is wrong for these cities.
const CITY_TZ = {
  knoxville: 'America/New_York', chattanooga: 'America/New_York', 'el paso': 'America/Denver',
  pensacola: 'America/Chicago', 'sioux falls': 'America/Chicago', boise: 'America/Boise',
};

const byName = new Map();
for (const [code, [name, tz]] of Object.entries(US)) byName.set(name.toLowerCase(), { code, name, tz, country: 'United States' });
for (const [code, [name, tz]] of Object.entries(CA)) byName.set(name.toLowerCase(), { code, name, tz, country: 'Canada' });

/** Resolve a region given as a code ("CA") or a name ("California"). */
export function region(regionText, countryHint = '') {
  const t = String(regionText || '').trim();
  const up = t.toUpperCase();
  const hint = String(countryHint).toLowerCase();
  const inCanada = /canada|^ca$/.test(hint) && !/united|usa|^us$/.test(hint);
  if (inCanada && CA[up]) return { code: up, name: CA[up][0], tz: CA[up][1], country: 'Canada' };
  if (US[up]) return { code: up, name: US[up][0], tz: US[up][1], country: 'United States' };
  if (CA[up]) return { code: up, name: CA[up][0], tz: CA[up][1], country: 'Canada' };
  return byName.get(t.toLowerCase()) || null;
}

/**
 * Sources type cities freely: "SAN JOSE", "York PA", "SAP Office — San Ramon".
 * Keep the city itself, in ordinary case; refuse anything still carrying digits.
 */
function cleanCity(city, reg) {
  let c = String(city || '').split(/\s+[—–-]\s+/).pop().trim();
  c = c.replace(new RegExp(`\\s+(${reg.code}|${reg.name})$`, 'i'), '').trim();
  if (c === c.toUpperCase() || c === c.toLowerCase()) {
    c = c.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  }
  return /\d/.test(c) ? '' : c;
}

function finish(city, reg) {
  if (!city || !reg) return null;
  city = cleanCity(city, reg);
  if (!city) return null;
  // A city the curated data knows takes its spelling: "Sioux falls" from one
  // calendar and "Sioux Falls" from another are one city, not two.
  // Quebec's capital shares the province's name; sources write it bare.
  if (reg.name === 'Quebec' && /^qu[eé]bec$/i.test(city)) city = 'Quebec City';
  const spelt = known().get(`${city.toLowerCase()}|${reg.country}`);
  const knownHere = !!spelt && spelt.region === reg.name;
  if (knownHere) city = spelt.city;
  // A state or province typed where the city goes ("Tennessee") is no city —
  // unless the curated data lists it as a city in that same state (New York,
  // New York). "Washington, Washington" is not the capital, which is in DC.
  if (!knownHere && byName.has(city.toLowerCase())) return null;
  const place = canonPlace(city, reg.name);
  const tz = CITY_TZ[place.city.toLowerCase()] || reg.tz;
  return { city: place.city, region: place.region, country: reg.country, tz };
}

/** From structured parts (Luma geo_address_info, Eventbrite PostalAddress, Meetup venue). */
export function fromParts({ city, region: reg, country } = {}) {
  const r = region(reg, country);
  if (!r) return null;
  if (country && !/united states|usa|^us$|canada|^ca$/i.test(String(country).trim())) return null;
  return finish(String(city || '').trim(), r);
}

/**
 * From free text: "4600 Hyland Ave, San Jose, CA 95127, USA",
 * "Toronto, ON M5V 2T6, Canada", "San Jose, CA", "Ithaca, New York".
 * Reads from the right, where addresses keep the city and region.
 */
export function fromText(text) {
  const parts = String(text || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  let country = '';
  if (/^(usa|u\.s\.a\.?|united states( of america)?|us|canada)$/i.test(parts[parts.length - 1])) {
    country = parts.pop();
  }
  if (parts.length === 1 && country) return knownCity(parts[0], country);
  for (let i = parts.length - 1; i >= 1; i--) {
    const regionToken = parts[i].replace(/\s+[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, '')   // Canadian postal code
                                 .replace(/\s+\d{5}(-\d{4})?$/, '')               // US ZIP
                                 .trim();
    const r = region(regionToken, country);
    if (r) return finish(parts[i - 1], r);
  }
  return null;
}

/**
 * "Toronto, Canada" names no province, and some sources give only a city. The
 * curated dataset already knows where every city it lists is, so that is the
 * fallback — never a guess from outside our own data.
 */
//
// Only curated (hand-verified) records count. Feed records are excluded: a
// feed city is whatever a source typed, and letting those in made the index
// vouch for itself — a Devpost venue line, "iCode Shrewbury", became a "known
// city" on the run after it first appeared.
let knownIndex = null;   // "city|country" (lower-case) -> { city: proper spelling, region }
function known() {
  if (!knownIndex) {
    knownIndex = new Map();
    try {
      const root = new URL('../../../', import.meta.url);
      const { events } = JSON.parse(readFileSync(new URL('data/events.json', root), 'utf8'));
      for (const e of events) {
        if (e.feed_source || e.city === 'Multiple cities') continue;
        const k = `${e.city.toLowerCase()}|${e.country}`;
        if (!knownIndex.has(k)) knownIndex.set(k, { city: e.city, region: e.region });
      }
    } catch { /* no dataset yet: no fallback */ }
  }
  return knownIndex;
}

export function knownCity(city, countryHint = '') {
  const country = /canada/i.test(countryHint) ? 'Canada' : 'United States';
  const hit = known().get(`${String(city).trim().toLowerCase()}|${country}`);
  return hit ? finish(hit.city, region(hit.region, country)) : null;
}

/** True when a place is a city the curated data already lists. */
export const isKnownPlace = (p) => !!p && known().has(`${p.city.toLowerCase()}|${p.country}`);

/** An instant as a calendar date in a given zone. */
export function localDate(instant, tz) {
  const d = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
