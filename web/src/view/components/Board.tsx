import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GroupedVirtuoso, type GroupedVirtuosoHandle } from 'react-virtuoso';
import { useApp } from '../context';
import { useJump } from '../jump';
import { usePhone } from '../../viewmodel/usePhone';
import type { BandMark } from '../../model/bands';
import { DateRail } from './DateRail';
import { EventRow } from './EventRow';

/**
 * How much of the top of the window the sticky bars cover, measured when a
 * jump is asked for. The desktop's filter bar sits over the month heading;
 * on a phone the bar is a dock below, and the heading is what covers the top.
 */
function stickyClearance(): number {
  const bar = document.getElementById('controls');
  if (bar && getComputedStyle(bar).position === 'sticky') return bar.offsetHeight;
  return document.querySelector<HTMLElement>('.groupbar')?.offsetHeight ?? 0;
}

/**
 * The list of events, under month (or city, or letter) headings.
 *
 * Virtualised against the window: only the rows near the screen exist in the
 * page, so four thousand events cost what forty do — the page scrolls as one,
 * and the headings still stick as their group passes.
 */
export function Board() {
  const { board, shown, today } = useApp();
  const phone = usePhone();
  const { register } = useJump();
  const list = useRef<GroupedVirtuosoHandle>(null);
  const [at, setAt] = useState(0);

  const jump = useCallback((mark: BandMark) => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The seam is the first thing in the band's first row, so that row's top is the seam's.
    list.current?.scrollToIndex({ index: mark.index, align: 'start', behavior: still ? 'auto' : 'smooth', offset: -stickyClearance() });
  }, []);
  useEffect(() => register(jump), [register, jump]);

  // A band starts a row: the seam above it is drawn inside that row, not as a group.
  const seamAt = useMemo(() => new Map(board.marks.map((m) => [m.index, m])), [board.marks]);

  if (shown.view === 'calendar') return <section className="board" id="board" hidden aria-busy="false" />;

  const needle = shown.q.trim();
  return (
    <section className="board" id="board" aria-live="polite" aria-busy="false" data-stale={board.stale || undefined}>
      {board.events.length > 0 && (
        <GroupedVirtuoso
          ref={list}
          useWindowScroll
          // Keep a screen's worth either side, so fast scrolling rarely meets blank space.
          increaseViewportBy={{ top: 800, bottom: 1600 }}
          rangeChanged={(r) => setAt(r.startIndex)}
          groupCounts={board.groups.map((g) => g.count)}
          groupContent={(i) => <h3 className="groupbar"><span>{board.groups[i].label}</span></h3>}
          itemContent={(i) => {
            // The list can shrink between the virtualiser's measuring pass and
            // this call (a new search): an index past the end renders nothing.
            const e = board.events[i];
            if (!e) return null;
            const seam = seamAt.get(i);
            return (
              <>
                {seam && (
                  <p className="seam" data-band={seam.band}>
                    <span className="seam__l">{seam.label}</span>
                    <span className="seam__n">{seam.count} {seam.count === 1 ? 'event' : 'events'}</span>
                  </p>
                )}
                <EventRow event={e} when={shown.when} today={today} needle={needle} index={i} menuKey={`b${e.id}`} />
              </>
            );
          }}
          computeItemKey={(i) => board.events[i]?.id ?? `gone-${i}`}
        />
      )}
      {!phone && <DateRail marks={board.marks} total={board.events.length} at={at} onJump={jump} />}
    </section>
  );
}
