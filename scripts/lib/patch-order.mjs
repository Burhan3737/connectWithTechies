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
 * taken is the latest that does not put the date after today — right for any
 * file under a year old, which every live patch file is. Names without a date
 * prefix sort first, so any dated pass can supersede them; ties keep name order.
 */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function patchDate(name, now) {
  const m = /^([a-z]{3})(\d{2})-/.exec(name);
  const month = m ? MONTHS.indexOf(m[1]) : -1;
  if (month < 0) return '';
  const mmdd = `${String(month + 1).padStart(2, '0')}-${m[2]}`;
  const year = Number(now.slice(0, 4));
  return `${mmdd <= now.slice(5) ? year : year - 1}-${mmdd}`;
}

export function orderPatchFiles(names, now) {
  return [...names].sort((a, b) => {
    const da = patchDate(a, now), db = patchDate(b, now);
    return da === db ? (a < b ? -1 : a > b ? 1 : 0) : da < db ? -1 : 1;
  });
}
