/**
 * Is this run's output fit to publish? Warnings for the person (or agent)
 * running the refresh, judged against earlier runs.
 *
 * data/feeds/last-run.json is overwritten every run and not tracked, so on
 * its own it cannot say what changed, nor when Meetup and Eventbrite were last
 * searched — discovery once went 17 days without anyone noticing. Each run is
 * therefore also appended to data/feeds/run-history.json (tracked), and
 * checked against it here.
 */

/** Meetup and Eventbrite city searches are meant to run weekly. */
export const DISCOVER_EVERY_DAYS = 7;
/** A source this far below the last comparable run was probably read only in part. */
const DROP = 0.3;
/** Below this many events a source's count moves too much to judge. */
const MIN_COUNT = 50;

const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** The part of a run report worth keeping. */
export function runEntry(report) {
  return { run_on: report.run_on, discover: !!report.discover, bySource: report.bySource,
    failed: (report.failedSources || []).length, written: report.totals?.written ?? 0 };
}

/** Warnings for `entry`, given the runs before it (oldest first). */
export function health(history, entry) {
  const out = [];

  if (!entry.discover) {
    const last = [...history].reverse().find((r) => r.discover);
    if (!last) out.push('no discovery run recorded — run `npm run feeds:discover` (Meetup and Eventbrite city searches)');
    else if (days(last.run_on, entry.run_on) > DISCOVER_EVERY_DAYS) {
      out.push(`discovery last ran ${last.run_on}, ${days(last.run_on, entry.run_on)} days ago — ` +
        'run `npm run feeds:discover`: until it does, new Meetup and Eventbrite organisers are not found');
    }
  }

  // A weekly run reads Meetup and Eventbrite many times over a daily one, so
  // compare like with like.
  const prev = [...history].reverse().find((r) => r.discover === entry.discover);
  if (prev) {
    for (const [source, before] of Object.entries(prev.bySource || {})) {
      const now = entry.bySource?.[source] || 0;
      if (before >= MIN_COUNT && now < before * (1 - DROP)) {
        out.push(`${source} fell from ${before} to ${now} since ${prev.run_on} — a partial read? Check failed sources before publishing`);
      }
    }
  }

  if (entry.failed) out.push(`${entry.failed} source(s) failed — listed in data/feeds/last-run.json`);
  return out;
}
