/**
 * An event's type, as the runner assigns it.
 *
 * A source that knows the type (MLH lists hackathons, confs.tech conferences)
 * sets `type` and it is kept. Every other source leaves it unset and the title
 * decides. Guild.host and Localist used to set 'meetup' outright, which skipped
 * the title check: a Stanford hackathon from the campus calendar was published
 * as a meetup and was missing from the app's hackathon filter. A source sets
 * `type` only when it knows; "a community platform" is not knowing.
 *
 * Here, not in run.mjs, so the selftest can put an adapter's output through it.
 */

/** Lowercased words, space-padded so a pattern can ask for whole words with ' x '. */
export const words = (s) => ` ${String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;

export function typeOf(e) {
  if (e.type) return e.type;
  const t = words(e.title);
  if (/ (hackathon|hack|hacks|buildathon|codeathon) /.test(t)) return 'hackathon';
  if (/ (ctf|capture the flag) /.test(t)) return 'ctf';
  if (/ game jam /.test(t)) return 'game-jam';
  if (/ (demo day|demo night|pitch night|pitch competition) /.test(t)) return 'demo-day';
  if (/ (career fair|job fair|hiring event) /.test(t)) return 'career-fair';
  if (/ (workshop|bootcamp|masterclass|office hours|hands on) /.test(t)) return 'workshop';
  if (/ tech week /.test(t)) return 'tech-week';
  if (/ (summit) /.test(t)) return 'summit';
  if (/ (conference|conf|con) /.test(t)) return 'conference';
  return 'meetup';
}
