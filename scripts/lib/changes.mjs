/**
 * What a refresh changed: the events added, removed and re-dated since the
 * last published data/events.json.
 *
 * The audit compares curated records only — feed records come and go with
 * their sources every run, and counting them there would report each expired
 * meetup as a lost event. That leaves the feed, most of the data, with no
 * readable account of what moved: the git diff of a refresh runs to hundreds
 * of thousands of lines. This is that account, written by every build to
 * data/review/CHANGES.md.
 *
 * Identity: a feed record by its feed_id, a curated one by its name (as the
 * audit does — a city correction must not read as one removal and one
 * addition).
 */

/** Feed events stay under Past this long after they are held (scripts/feeds/run.mjs). */
const KEEP_PAST_DAYS = 60;

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const isFeed = (e) => !!e.feed_source;

function keyed(events) {
  const m = new Map();
  for (const e of events) {
    let k = isFeed(e) ? `feed:${e.feed_id}` : `cur:${norm(e.name)}`;
    // Two curated events sharing a name are kept apart by city.
    if (m.has(k)) k = `${k}|${norm(e.city)}`;
    m.set(k, e);
  }
  return m;
}

/** Why a feed record left. Curated removals are the audit's to account for. */
function whyGone(e, after, { today, retired }) {
  if (!isFeed(e)) return 'curated record removed';
  if (retired.has(e.feed_organiser)) return 'organiser retired';
  if (after.some((x) => !isFeed(x) && norm(x.name) === norm(e.name))) return 'now a curated record';
  const held = e.next_date || e.last_date;
  if (held && days(held, today) > KEEP_PAST_DAYS) return 'aged out';
  return 'no longer listed';
}

/**
 * before, after: arrays of event records. today: YYYY-MM-DD.
 * retired: organiser names retired by a person (sources-*.json, tech: false).
 */
export function diffEvents(before, after, { today, retired = new Set() }) {
  const a = keyed(before), b = keyed(after);
  const added = [], removed = [], redated = [];
  // A feed id can change while the event does not: a source's new URL, a
  // Meetup copy replaced by the organiser's Luma one, sessions folded into a
  // series row. Same name, city and date (or a series holding the date) is
  // the same event, re-listed — neither removed nor added.
  const fresh = [...b].filter(([k, e]) => !a.has(k) && isFeed(e));
  const claimed = new Set();
  let relisted = 0;
  const sameEvent = (old, e) => norm(old.name) === norm(e.name) && norm(old.city) === norm(e.city) &&
    (old.next_date === e.next_date || (e.feed_dates || []).includes(old.next_date));
  for (const [k, e] of a) {
    if (b.has(k)) continue;
    const twin = isFeed(e) && fresh.find(([fk, f]) => sameEvent(e, f));
    if (twin) { relisted++; claimed.add(twin[0]); continue; }
    removed.push({ e, curated: !isFeed(e), why: whyGone(e, after, { today, retired }) });
  }
  // A feed record taken over by a curated one is the same event, not a new one.
  const takenOver = new Set(removed.filter((x) => x.why === 'now a curated record').map((x) => norm(x.e.name)));
  for (const [k, e] of b) {
    if (a.has(k) || claimed.has(k) || (!isFeed(e) && takenOver.has(norm(e.name)))) continue;
    added.push({ e, curated: !isFeed(e) });
  }
  for (const [k, e] of b) {
    const old = a.get(k);
    // Moved while it was still to come: a postponement or a correction. A
    // series moving on to its next session is not news.
    if (old?.next_date && e.next_date && old.next_date !== e.next_date && old.next_date >= today) {
      redated.push({ e, curated: !isFeed(e), from: old.next_date, to: e.next_date });
    }
  }
  return { before: before.length, after: after.length, added, removed, redated, relisted };
}

const count = (list, f) => list.filter(f).length;
const tally = (list, key) => {
  const m = new Map();
  for (const x of list) m.set(key(x), (m.get(key(x)) || 0) + 1);
  return [...m.entries()].sort((p, q) => q[1] - p[1]);
};
const label = (e) => `${e.name} — ${e.city}${e.next_date ? `, ${e.next_date}` : ''}`;
const source = (e) => e.feed_source || 'curated';

/** The report. diff null: there was nothing to compare with. */
export function changesMarkdown(diff, { since, today }) {
  const md = ['# Changes since the last publish', ''];
  if (!diff) {
    md.push(`Generated ${today}. There is no earlier version of data/events.json to compare with, so nothing is listed.`);
    return md.join('\n') + '\n';
  }
  const { added, removed, redated } = diff;
  md.push(`Generated ${today} by \`scripts/build-data.mjs\`, against \`data/events.json\` at ${since}. Every build`,
    'rewrites this file, so it always describes the data as it stands against what was last committed.', '');

  const row = (name, list) => `| ${name} | ${list.length} | ${count(list, (x) => x.curated)} | ${count(list, (x) => !x.curated)} |`;
  md.push('| | Total | Curated | Feed |', '|---|---|---|---|',
    `| Events | ${diff.before} → ${diff.after} | | |`,
    row('Added', added), row('Removed', removed), row('Re-dated', redated),
    `| Re-listed under a new id | ${diff.relisted} | | ${diff.relisted} |`, '');

  md.push('## Removed', '');
  if (!removed.length) md.push('Nothing.', '');
  else {
    md.push('| Reason | Events |', '|---|---|', ...tally(removed, (x) => x.why).map(([w, n]) => `| ${w} | ${n} |`), '');
    const cur = removed.filter((x) => x.curated);
    if (cur.length) {
      md.push('Curated records removed — each needs a reason in `data/review/APPLIED.md`; the audit checks:', '');
      md.push(...cur.map((x) => `- ${label(x.e)}`), '');
    }
    for (const [why] of tally(removed.filter((x) => !x.curated), (x) => x.why)) {
      const list = removed.filter((x) => !x.curated && x.why === why);
      md.push(`**${why}** (${list.length}):`, '', ...list.slice(0, 15).map((x) => `- ${label(x.e)} (${source(x.e)})`));
      if (list.length > 15) md.push(`- … and ${list.length - 15} more`);
      md.push('');
    }
  }

  md.push('## Added', '');
  if (!added.length) md.push('Nothing.', '');
  else {
    md.push(`By source: ${tally(added, (x) => source(x.e)).map(([s, n]) => `${s} ${n}`).join(' · ')}`, '');
    md.push(`Top cities: ${tally(added, (x) => `${x.e.city}`).slice(0, 12).map(([c, n]) => `${c} ${n}`).join(' · ')}`, '');
    const cur = added.filter((x) => x.curated);
    if (cur.length) md.push('Curated:', '', ...cur.map((x) => `- ${label(x.e)}`), '');
    const fd = added.filter((x) => !x.curated);
    if (fd.length) {
      md.push(`From the feed (${fd.length}; the first 30):`, '', ...fd.slice(0, 30).map((x) => `- ${label(x.e)} (${source(x.e)})`), '');
    }
  }

  md.push('## Re-dated', '', 'Dates still to come that moved — postponements and corrections.', '');
  if (!redated.length) md.push('Nothing.', '');
  else {
    md.push(...redated.slice(0, 50).map((x) => `- ${x.e.name} — ${x.e.city}: ${x.from} → ${x.to}${x.curated ? '' : ` (${source(x.e)})`}`));
    if (redated.length > 50) md.push(`- … and ${redated.length - 50} more`);
    md.push('');
  }
  return md.join('\n') + '\n';
}

/**
 * Organisers a person retired (sources-*.json, tech: false), as the registry
 * records them. reg: data/feeds/registry.json, parsed.
 */
export function retiredOrganisers(reg) {
  return new Set((reg?.sources || []).filter((s) => s.tech === false && /^retired by /.test(s.reason || '')).map((s) => s.name));
}

/**
 * The counts of a diff, as one row of data/review/refresh-history.json.
 * base: the commit compared against — the last publish.
 */
export function historyRow(diff, { base, today }) {
  const split = (list) => ({ total: list.length, curated: count(list, (x) => x.curated), feed: count(list, (x) => !x.curated) });
  return {
    base, built_on: today, before: diff.before, after: diff.after,
    added: split(diff.added), removed: split(diff.removed), redated: split(diff.redated),
    removed_by_reason: Object.fromEntries(tally(diff.removed, (x) => x.why)),
    relisted: diff.relisted,
  };
}

/**
 * One row per publish. A cycle builds several times against the same base, so
 * a row for that base is replaced, not added to; a build that changed nothing
 * writes no row — a rebuild straight after a publish is not a refresh.
 */
export function upsertHistory(rows, row) {
  const rest = rows.filter((r) => r.base !== row.base);
  const empty = !row.added.total && !row.removed.total && !row.redated.total;
  return empty ? rest : [...rest, row];
}

/**
 * Feed sources that lost more events than a refresh normally does. Past
 * refreshes lost 0.5–2% of a source as "no longer listed", once 9%; this
 * flags a source above both bars. failed: platforms with a source that failed
 * this run (data/feeds/last-run.json) — a loss behind a failure is a partial
 * read, not events withdrawn.
 */
export const DELIST_MIN = 50, DELIST_SHARE = 0.05;
export function delistings(diff, before, failed = new Set()) {
  const held = new Map();
  for (const e of before) if (isFeed(e)) held.set(e.feed_source, (held.get(e.feed_source) || 0) + 1);
  return tally(diff.removed.filter((x) => !x.curated && x.why === 'no longer listed'), (x) => x.e.feed_source)
    .filter(([s, n]) => n > DELIST_MIN && n > DELIST_SHARE * (held.get(s) || 0))
    .map(([source, n]) => ({ source, removed: n, held: held.get(source) || 0, failed: failed.has(source) }));
}
