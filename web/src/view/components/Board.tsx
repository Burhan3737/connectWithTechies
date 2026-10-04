import { GroupedVirtuoso } from 'react-virtuoso';
import { useApp } from '../context';
import { EventRow } from './EventRow';

/**
 * The list of events, under month (or city, or letter) headings.
 *
 * Virtualised against the window: only the rows near the screen exist in the
 * page, so four thousand events cost what forty do — the page scrolls as one,
 * and the headings still stick as their group passes.
 */
export function Board() {
  const { board, shown, today } = useApp();
  if (shown.view === 'calendar') return <section className="board" id="board" hidden aria-busy="false" />;

  const needle = shown.q.trim();
  return (
    <section className="board" id="board" aria-live="polite" aria-busy="false" data-stale={board.stale || undefined}>
      {board.events.length > 0 && (
        <GroupedVirtuoso
          useWindowScroll
          // Keep a screen's worth either side, so fast scrolling rarely meets blank space.
          increaseViewportBy={{ top: 800, bottom: 1600 }}
          groupCounts={board.groups.map((g) => g.count)}
          groupContent={(i) => <h3 className="groupbar"><span>{board.groups[i].label}</span></h3>}
          itemContent={(i) => {
            // The list can shrink between the virtualiser's measuring pass and
            // this call (a new search): an index past the end renders nothing.
            const e = board.events[i];
            if (!e) return null;
            return <EventRow event={e} when={shown.when} today={today} needle={needle} index={i} menuKey={`b${e.id}`} />;
          }}
          computeItemKey={(i) => board.events[i]?.id ?? `gone-${i}`}
        />
      )}
    </section>
  );
}
