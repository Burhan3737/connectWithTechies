/**
 * Carrying the feed forward: when an upcoming event missing from this run was
 * taken down, and when it was only not looked for.
 *
 * An event vouched for by a source (feed_via) that was read in full this run,
 * and is not in it, was taken down by its organiser: cancelled or moved. Every
 * other absence proves nothing, so the event is kept:
 *  - its source failed (a flaky request is not a cancellation);
 *  - its source was not read at all this run. Bevy is read only with
 *    --discover, so on a daily run its weekly events must survive untouched,
 *    neither removed nor counted as a failure;
 *  - it names no source (a discovery hit: discovery reads only the first pages
 *    of a city, so absence there shows nothing).
 *
 * seenSources holds a source only after a successful, complete read.
 */
export const takenDown = (record, seenSources) => !!record.feed_via && seenSources.has(record.feed_via);
