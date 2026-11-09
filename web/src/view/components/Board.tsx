import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GroupedVirtuoso, type GroupedVirtuosoHandle } from 'react-virtuoso';
import { useApp } from '../context';
import { useJump } from '../jump';
import { usePhone } from '../../viewmodel/usePhone';
import type { BandMark } from '../../model/bands';
import { DateRail, type RowPosition } from './DateRail';
import { EventRow } from './EventRow';

function createRowPosition(): RowPosition {
  let at = 0;
  const listeners = new Set<() => void>();
  return {
    get: () => at,
    set(i) { if (i !== at) { at = i; listeners.forEach((l) => l()); } },
    subscribe(l) { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}

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

/** Rows touching the edge of the covered strip don't count as on screen. */
const COVERED_MARGIN = 1;

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
  const [position] = useState(createRowPosition);
  const rowWatch = useRef<IntersectionObserver | null>(null);
  // Indexes of the rows the browser reports on screen.
  const onScreen = useRef(new Set<number>());
  const report = useCallback(() => { if (onScreen.current.size) position.set(Math.min(...onScreen.current)); }, [position]);
  const watchRow = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    rowWatch.current?.observe(el);
    // unobserve() sends no last entry: a row that leaves the page while on
    // screen (an instant jump, a new filter) must be forgotten here.
    return () => {
      rowWatch.current?.unobserve(el);
      onScreen.current.delete(Number(el.dataset.row));
      report();
    };
  }, [report]);
  // The top strip no row can be read in: the sticky filter bar (desktop) and the month heading stuck under it.
  const [stickyBar, setStickyBar] = useState(0);
  const [heading, setHeading] = useState(0);
  const onHeading = useCallback((el: HTMLElement | null) => {
    if (el) setHeading((h) => h || el.getBoundingClientRect().height);
  }, []);
  useEffect(() => {
    const bar = document.getElementById('controls');
    if (!bar || phone) { setStickyBar(0); return; }
    const measure = () => setStickyBar(bar.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [phone]);
  const covered = Math.ceil(stickyBar + heading) + COVERED_MARGIN;

  const jump = useCallback((mark: BandMark) => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The seam is the first thing in the band's first row, so that row's top is the seam's.
    list.current?.scrollToIndex({ index: mark.index, align: 'start', behavior: still ? 'auto' : 'smooth', offset: -stickyClearance() });
  }, []);
  useEffect(() => register(jump), [register, jump]);

  // Which rows are on screen, as the browser reports it (not from the virtualiser's
  // range, which includes the rows kept ready above and below). Held outside React
  // state: a scroll moves the rail, never re-renders the list. Only the desktop
  // rail reads it. A new list renumbers rows that stay on the page, so it starts over.
  useEffect(() => {
    if (phone || typeof IntersectionObserver === 'undefined') return;
    const on = onScreen.current;
    on.clear();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const i = Number((entry.target as HTMLElement).dataset.row);
        if (entry.isIntersecting) on.add(i); else on.delete(i);
      }
      report();
    }, { rootMargin: `${-covered}px 0px 0px 0px` });
    rowWatch.current = observer;
    // Rows already on the page were watched by the observer this one replaces.
    document.querySelectorAll('#board [data-row]').forEach((el) => observer.observe(el));
    return () => { observer.disconnect(); rowWatch.current = null; };
  }, [phone, covered, board.events, report]);

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
          groupCounts={board.groups.map((g) => g.count)}
          groupContent={(i) => <h3 className="groupbar" ref={onHeading}><span>{board.groups[i].label}</span></h3>}
          itemContent={(i) => {
            // The list can shrink between the virtualiser's measuring pass and
            // this call (a new search): an index past the end renders nothing.
            const e = board.events[i];
            if (!e) return null;
            const seam = seamAt.get(i);
            return (
              <div data-row={i} ref={watchRow}>
                {seam && (
                  <p className="seam" data-band={seam.band}>
                    <span className="seam__l">{seam.label}</span>
                    <span className="seam__n">{seam.count} {seam.count === 1 ? 'event' : 'events'}</span>
                  </p>
                )}
                <EventRow event={e} when={shown.when} today={today} needle={needle} index={i} menuKey={`b${e.id}`} />
              </div>
            );
          }}
          computeItemKey={(i) => board.events[i]?.id ?? `gone-${i}`}
        />
      )}
      {!phone && <DateRail marks={board.marks} total={board.events.length} position={position} onJump={jump} />}
    </section>
  );
}
