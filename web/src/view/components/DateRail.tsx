import { useEffect, useLayoutEffect, useState } from 'react';
import type { BandMark } from '../../model/bands';

/** Labels closer than this (px) are stacked apart so they stay readable. */
const LABEL_GAP = 24;
/** A row's height, roughly: enough to tell whether the list is worth a rail. */
const ROW_PX = 96;
const BOTTOM = 24;

interface Props {
  marks: BandMark[];
  total: number;
  /** Index of the first row on screen; the board reports it when its range changes. */
  at: number;
  onJump(mark: BandMark): void;
}

/**
 * Desktop: the whole list as a strip down the window's edge, one coloured
 * stretch per time band, each a button that scrolls there. It is built from
 * the cached marks and the row index the board reports — nothing here reads
 * layout while the page scrolls.
 */
export function DateRail({ marks, total, at, onJump }: Props) {
  const [viewH, setViewH] = useState(() => window.innerHeight);
  const [top, setTop] = useState(0);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const onResize = () => setViewH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Clear the sticky filter bar; measured when it changes size, not as the page scrolls.
  useLayoutEffect(() => {
    const bar = document.getElementById('controls');
    if (!bar) return;
    const measure = () => setTop(bar.offsetHeight + 20);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  // Away from the board (the footer), the rail steps aside.
  useEffect(() => {
    const board = document.getElementById('board');
    if (!board || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  if (marks.length === 0 || total * ROW_PX < viewH * 2) return null;

  const height = Math.max(0, viewH - top - BOTTOM - 20);
  const yOf = (index: number) => (index / total) * height;
  let lastLabel = -Infinity;
  const labelY = marks.map((m) => (lastLabel = Math.max(yOf(m.index), lastLabel + LABEL_GAP)));
  const current = marks.reduce((c, m, i) => (m.index <= at ? i : c), 0);

  return (
    <nav className="rail" aria-label="Jump by date" hidden={!inView} style={{ top }}>
      <div className="rail__track" style={{ height }}>
        {marks.map((m, i) => {
          const end = i + 1 < marks.length ? marks[i + 1].index : total;
          return (
            <span key={m.band} className="rail__seg" data-tone={m.band}
              style={{ top: yOf(m.index), height: Math.max(2, yOf(end) - yOf(m.index)) }} aria-hidden="true" />
          );
        })}
        <span className="rail__probe" style={{ top: yOf(Math.min(at, total - 1)) }} aria-hidden="true" />
      </div>
      {marks.map((m, i) => (
        <button key={m.band} type="button" className="rail__mark" data-band={m.band}
          aria-current={i === current ? 'true' : undefined}
          aria-label={`${m.label}, ${m.count} ${m.count === 1 ? 'event' : 'events'}`}
          style={{ top: labelY[i] }} onClick={() => onJump(m)}>
          {m.label}
        </button>
      ))}
    </nav>
  );
}
