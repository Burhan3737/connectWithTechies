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
  'kitchener-waterloo':   ['Waterloo', 'Ontario'],
  'kitchener':            ['Waterloo', 'Ontario'],
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

export function canonPlace(city, region) {
  const c = titleCity(city);
  const r = titleCity(region);
  const ck = c.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
  const hit = CITY_ALIASES.get(`${ck}|${r.toLowerCase()}`) || CITY_ALIASES.get(ck);
  if (hit) return { city: hit[0], region: hit[1] };
  const rk = r.toLowerCase().replace(/\s+/g, ' ').trim();
  return { city: c, region: REGION_ALIASES.get(rk) || r };
}
