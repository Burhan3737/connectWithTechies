/**
 * The curated record, as data/SCHEMA.md defines it.
 *
 * A curated record used to arrive only by hand, so the schema was enforced by
 * whoever typed it. The `add` patch action lets an agent create one, and an
 * agent's typo (a "Canda", a date written "March 3") would land in data/raw/
 * and be read by every later tool as fact. Everything an add carries is
 * checked here, before anything is written.
 */
import { today } from './today.mjs';

// Order is the order of SCHEMA.md; apply-patches compares records field by field.
export const FIELDS = ['name', 'type', 'topics', 'city', 'region', 'country', 'venue', 'cadence', 'month',
  'next_date', 'next_date_end', 'last_date', 'status', 'attendance', 'cost', 'audience', 'url', 'description', 'source'];

// `meetup` is in the schema for feed records only; a curated record is never one.
export const TYPES = ['conference', 'hackathon', 'workshop', 'tech-week', 'meetup-series', 'summit', 'expo', 'festival',
  'ctf', 'game-jam', 'startup-week', 'demo-day', 'unconference', 'career-fair', 'bootcamp', 'awards'];
export const COUNTRIES = ['Canada', 'United States'];
export const CADENCES = ['annual', 'biannual', 'quarterly', 'monthly', 'weekly', 'one-off', 'rolling'];
export const STATUSES = ['upcoming', 'past', 'recurring-tbd', 'discontinued'];
export const COSTS = ['free', 'paid', 'freemium', 'invite-only', 'varies'];

// Round-trips through Date so "2027-02-30" is not accepted as a date.
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))
  && new Date(s).toISOString().slice(0, 10) === s;
const isHttp = (s) => {
  try { return /^https?:$/.test(new URL(s).protocol); } catch { return false; }
};

/** Problems with a candidate curated record; an empty list means it is valid. `now` is injectable for tests. */
export function validateRecord(rec, now = today()) {
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return ['record is not an object'];
  const bad = [];
  for (const f of FIELDS) if (!(f in rec)) bad.push(`missing field: ${f}`);
  for (const f of Object.keys(rec)) if (!FIELDS.includes(f)) bad.push(`unexpected field: ${f}`);

  const oneOf = (f, list) => {
    if (f in rec && !list.includes(rec[f])) bad.push(`${f} must be one of ${list.join(' | ')} (got ${JSON.stringify(rec[f])})`);
  };
  oneOf('type', TYPES); oneOf('country', COUNTRIES); oneOf('cadence', CADENCES);
  oneOf('status', STATUSES); oneOf('cost', COSTS);

  for (const f of ['next_date', 'next_date_end', 'last_date']) {
    if (f in rec && rec[f] !== '' && !isDate(rec[f])) bad.push(`${f} must be "" or YYYY-MM-DD (got ${JSON.stringify(rec[f])})`);
  }
  if (isDate(rec.next_date) && isDate(rec.next_date_end) && rec.next_date_end < rec.next_date) bad.push('next_date_end is before next_date');
  if (isDate(rec.last_date) && rec.last_date > now) bad.push(`last_date ${rec.last_date} is in the future`);

  for (const f of ['url', 'source']) if (f in rec && !isHttp(rec[f])) bad.push(`${f} must be an http(s) URL (got ${JSON.stringify(rec[f])})`);
  for (const f of ['name', 'city', 'region', 'description']) {
    if (f in rec && (typeof rec[f] !== 'string' || !rec[f].trim())) bad.push(`${f} must be a non-empty string`);
  }
  if ('topics' in rec && !(Array.isArray(rec.topics) && rec.topics.every((t) => typeof t === 'string' && t && t === t.toLowerCase()))) {
    bad.push('topics must be an array of lowercase strings');
  }
  return bad;
}

/**
 * What an `add` should do. `curated` is the records already on file under the
 * same name+city in curated files (never feed.json: the curated record wins on
 * the next feed run, so a feed twin is no reason to refuse); `addedThisRun` is
 * whether an earlier add in this run already took that name+city;
 * `appliedBefore` is whether this same add, from this same patch file, landed
 * on an earlier run (the caller reads that from APPLIED.md).
 * Returns { verdict: 'ADD' | 'DONE' | 'REJECT', message }.
 */
export function decideAdd(rec, curated, { addedThisRun = false, appliedBefore = false } = {}, now = today()) {
  // First, and unconditionally: an add happens once. What became of the record
  // since — updated by a later patch, removed by a curator — is that later
  // patch's business, and replaying the add would undo it or REJECT on every run.
  if (appliedBefore) return { verdict: 'DONE', message: 'applied on an earlier run' };
  const problems = validateRecord(rec, now);
  if (problems.length) return { verdict: 'REJECT', message: `invalid record: ${problems.join('; ')}` };
  // Checked before the idempotency test: the first add is already on file by now,
  // so an identical repeat would otherwise read as "already applied".
  if (addedThisRun) return { verdict: 'REJECT', message: 'duplicate add in this run' };
  if (curated.length) {
    const same = curated.some((have) => FIELDS.every((k) => JSON.stringify(have[k]) === JSON.stringify(rec[k])));
    return same ? { verdict: 'DONE', message: 'already applied' }
      : { verdict: 'REJECT', message: 'exists — patch it with update instead' };
  }
  return { verdict: 'ADD', message: '' };
}
