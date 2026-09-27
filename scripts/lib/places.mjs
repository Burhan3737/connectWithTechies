/**
 * Canonical place names, shared by the build and the patch applier.
 *
 * Independent researchers name the same place differently, which would split
 * one city into two entries in the picker. The build folds them together; the
 * patch applier needs the same mapping so that a patch written against the
 * canonical name still finds the raw record it came from.
 */

/** Key is `city|region` lowercased, or just `city` to apply regardless of region. */
export const CITY_ALIASES = new Map(Object.entries({
  'new york city':        ['New York', 'New York'],
  'nyc':                  ['New York', 'New York'],
  'manhattan':            ['New York', 'New York'],
  'urbana':               ['Urbana-Champaign', 'Illinois'],
  'champaign':            ['Urbana-Champaign', 'Illinois'],
  'ankeny':               ['Des Moines', 'Iowa'],
  'st paul':              ['St. Paul', 'Minnesota'],
  'saint paul':           ['St. Paul', 'Minnesota'],
  'st louis':             ['St. Louis', 'Missouri'],
  'saint louis':          ['St. Louis', 'Missouri'],
  'st johns':             ["St. John's", 'Newfoundland and Labrador'],
  'washington dc':        ['Washington', 'District of Columbia'],
  'washington, d.c.':     ['Washington', 'District of Columbia'],
  'washington d.c.':      ['Washington', 'District of Columbia'],
  'quebec':               ['Quebec City', 'Quebec'],
  'montréal':             ['Montreal', 'Quebec'],
  // Kitchener is its own city, so it is no longer folded into Waterloo. The
  // rule every city correction follows is "the town the venue is in", and
  // SWO Drupal Camp, held at Kitchener Public Library, was being published as
  // Waterloo. Only the hyphenated regional label, which names no one town,
  // still maps.
  'kitchener-waterloo':   ['Waterloo', 'Ontario'],
  'research triangle park': ['Durham', 'North Carolina'],
  'winston salem':        ['Winston-Salem', 'North Carolina'],
  'various':              ['Multiple cities', 'US & Canada'],
  'multiple':             ['Multiple cities', 'US & Canada'],
  'nationwide':           ['Multiple cities', 'US & Canada'],
}));

/** Region strings arrive as both full names and postal codes. */
export const REGION_ALIASES = new Map(Object.entries({
  ca: 'California', ny: 'New York', tx: 'Texas', wa: 'Washington', ma: 'Massachusetts',
  il: 'Illinois', on: 'Ontario', bc: 'British Columbia', qc: 'Quebec', ab: 'Alberta',
  dc: 'District of Columbia', 'washington, d.c.': 'District of Columbia',
  'washington dc': 'District of Columbia', 'd.c.': 'District of Columbia',
  various: 'US & Canada',
}));

export const titleCity = (s) => String(s || '').trim().replace(/\s+/g, ' ');

/** Placeholders a researcher uses when an event has no single host city. */
const PLACEHOLDER = /^(various|multiple|nationwide|us & canada|)$/i;

export function canonPlace(city, region) {
  const c = titleCity(city);
  const r = titleCity(region);
  const ck = c.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
  const rk = r.toLowerCase().replace(/\s+/g, ' ').trim();
  const hit = CITY_ALIASES.get(`${ck}|${rk}`) || CITY_ALIASES.get(ck);

  /**
   * A multi-city event is only "US & Canada" if nothing narrower is known.
   * CT Tech Week runs across Connecticut: its record said city "Various",
   * region "Connecticut", and the alias replaced both — so a state-wide event
   * was published as continent-wide and dropped out of every Connecticut
   * search. Keep a real region when the researcher gave one.
   */
  if (hit && hit[0] === 'Multiple cities' && !PLACEHOLDER.test(rk)) {
    return { city: 'Multiple cities', region: REGION_ALIASES.get(rk) || r };
  }
  if (hit) return { city: hit[0], region: hit[1] };
  return { city: c, region: REGION_ALIASES.get(rk) || r };
}
