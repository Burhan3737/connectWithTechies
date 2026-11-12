/**
 * The order patch files replay in.
 *
 * Every apply replays every patch file in data/review/, so when two passes
 * update the same record, the one replayed last wins. That has to be the most
 * recent pass. Plain name order is not: "nov05-…" sorts before "oct29-…", so an
 * October update put back what a November pass had corrected (the nov05 cycle
 * found oct29-t1 restoring two Startup Sioux Falls URLs that had gone 404, and
 * it is behind the oct05/oct07 flip-flop in audit 2026-10-11-i1-W5).
 *
 * Pass names start with a month and day ("oct29-t1") and no year. The year
 * taken is the latest that does not put the date more than AHEAD_DAYS after
 * today — right for any file under a year old, which every live patch file is.
 * The slack is there because passes are named by the Eastern date while today()
 * is Honolulu's, up to a day behind: with no slack, "nov12" applied at 3am
 * Eastern on Nov 12 read as last year and replayed first (audit 2026-11-12-i1-B1).
 * Names without a date prefix sort first, so any dated pass can supersede them;
 * ties keep name order.
 */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const AHEAD_DAYS = 7;

export function patchDate(name, now) {
  const m = /^([a-z]{3})(\d{2})-/.exec(name);
  const month = m ? MONTHS.indexOf(m[1]) : -1;
  if (month < 0) return '';
  const mmdd = `${String(month + 1).padStart(2, '0')}-${m[2]}`;
  const year = Number(now.slice(0, 4));
  const limit = new Date(Date.parse(now) + AHEAD_DAYS * 86400000).toISOString().slice(0, 10);
  return [year + 1, year, year - 1].map((y) => `${y}-${mmdd}`).find((d) => d <= limit);
}

export function orderPatchFiles(names, now) {
  return [...names].sort((a, b) => {
    const da = patchDate(a, now), db = patchDate(b, now);
    return da === db ? (a < b ? -1 : a > b ? 1 : 0) : da < db ? -1 : 1;
  });
}
