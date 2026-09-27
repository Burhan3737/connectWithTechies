/**
 * "Today", as this directory means it.
 *
 * Every script used to take today's date from UTC, which flips at 8pm Eastern.
 * An event running that evening in New York — or all afternoon in Los Angeles —
 * would be rolled over to "past" and pulled from Upcoming while it was still on.
 *
 * The directory covers every time zone from Newfoundland to Hawaii, so a date is
 * only over once it has ended everywhere the directory reaches. That makes the
 * right clock the westernmost one: Honolulu. The cost is that an event from
 * yesterday stays "upcoming" until about 6am Eastern the next morning, and
 * lagging by a few hours is far better than retiring an event while it is
 * still running.
 *
 * TODAY=YYYY-MM-DD in the environment overrides it, for tests and replays.
 */
export const DIRECTORY_TZ = 'Pacific/Honolulu';

export function today() {
  if (process.env.TODAY) return process.env.TODAY;
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DIRECTORY_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
