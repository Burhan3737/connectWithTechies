/** Lower-case and strip accents, so "Montréal" matches "montreal". */
export function fold(s: unknown): string {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** A slug safe for file names: "AI Builders' Night!" -> "ai-builders-night". */
export function slugify(s: string, max = 60): string {
  return fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, max);
}

/**
 * Split text around the first match of a needle, accent- and case-insensitive,
 * for highlighting: [before, match, after], or null when there is no match.
 */
export function splitMatch(text: string, needle: string): [string, string, string] | null {
  const raw = String(text ?? '');
  if (!needle || fold(raw).indexOf(fold(needle)) < 0) return null;
  // Plain text folds character for character, so indexes carry straight over.
  if (fold(raw).length === raw.length) {
    const i = fold(raw).indexOf(fold(needle));
    const len = fold(needle).length;
    return [raw.slice(0, i), raw.slice(i, i + len), raw.slice(i + len)];
  }
  return walkSplit(raw, needle);
}

/** Text whose folding changes its length: walk it so the match keeps its original accents. */
function walkSplit(raw: string, needle: string): [string, string, string] | null {
  const n = fold(needle);
  for (let start = 0; start < raw.length; start++) {
    let folded = '';
    for (let end = start; end < raw.length && folded.length < n.length; end++) {
      folded += fold(raw[end]);
      if (folded === n) return [raw.slice(0, start), raw.slice(start, end + 1), raw.slice(end + 1)];
    }
  }
  return null;
}
