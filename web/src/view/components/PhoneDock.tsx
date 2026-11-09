import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { useApp } from '../context';
import { usePhone } from '../../viewmodel/usePhone';
import { scrollToResults } from '../scrollToResults';

export type DeckState = 'closed' | 'half' | 'full';

interface DeckControl {
  state: DeckState;
  /** Take the whole screen, for the city list. */
  expand(): void;
  /** Back from the whole screen to the half sheet. */
  settle(): void;
}

const DeckContext = createContext<DeckControl>({ state: 'closed', expand() {}, settle() {} });
export const useDeck = () => useContext(DeckContext);

/** How far a drag on the grab handle has to go to count as one. */
const DRAG = 30;

/**
 * The filter bar's shell. The same elements serve both layouts: on a desktop
 * the sheet's wrappers are `display: contents`, so its contents are cells of
 * the bar; on a phone the bar is a dock at the thumb, and the rest sits in a
 * sheet that rises from it. No control is ever rendered twice.
 */
export function PhoneDock({ search, children }: { search: ReactNode; children: ReactNode }) {
  const { filters, board, calendar } = useApp();
  const phone = usePhone();
  const [deck, setDeck] = useState<DeckState>('closed');
  const navRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Focus moves after the sheet renders: a sheet that is not on screen cannot take it.
  const focusNext = useRef<HTMLElement | null>(null);
  const grabY = useRef<number | null>(null);

  useLayoutEffect(() => {
    focusNext.current?.focus();
    focusNext.current = null;
  }, [deck]);

  const open = () => { focusNext.current = titleRef.current; setDeck('half'); };
  const close = () => { focusNext.current = buttonRef.current; setDeck('closed'); };

  // Widened out of the phone layout: nothing is left open behind the desktop bar.
  useEffect(() => { if (!phone) setDeck('closed'); }, [phone]);

  // The rest of the app reads the dock's height from :root.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const nav = navRef.current;
    if (!phone || !nav) { root.style.setProperty('--dockH', '0px'); return; }
    const measure = () => root.style.setProperty('--dockH', `${nav.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [phone]);

  // The on-screen keyboard shrinks the visual viewport only; the dock and the sheets ride above it.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!phone || !vv) return;
    const root = document.documentElement;
    const onViewport = () => {
      root.style.setProperty('--vvh', `${vv.height}px`);
      const keyboard = window.innerHeight - vv.height - vv.offsetTop;
      root.style.setProperty('--kb', `${keyboard > 40 ? keyboard : 0}px`);
      root.classList.toggle('kb-up', keyboard > 40);
    };
    onViewport();
    vv.addEventListener('resize', onViewport);
    vv.addEventListener('scroll', onViewport);
    return () => {
      vv.removeEventListener('resize', onViewport);
      vv.removeEventListener('scroll', onViewport);
      root.style.removeProperty('--vvh');
      root.style.removeProperty('--kb');
      root.classList.remove('kb-up');
    };
  }, [phone]);

  // A tap on the page behind the sheet closes it, without pulling focus anywhere.
  useEffect(() => {
    if (deck === 'closed') return;
    const onDown = (e: Event) => { if (!navRef.current?.contains(e.target as Node)) setDeck('closed'); };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [deck]);

  // At full height the sheet is the whole screen: nothing behind it takes focus.
  useEffect(() => {
    if (deck !== 'full') return;
    const behind = document.querySelectorAll('.masthead, main, .foot, .viewpill');
    behind.forEach((el) => el.setAttribute('inert', ''));
    return () => behind.forEach((el) => el.removeAttribute('inert'));
  }, [deck]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && deck !== 'closed' && !e.defaultPrevented) { e.preventDefault(); close(); }
  };

  const onDone = () => {
    close();
    scrollToResults();
  };

  const onGrabDown = (e: PointerEvent<HTMLDivElement>) => {
    grabY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onGrabUp = (e: PointerEvent<HTMLDivElement>) => {
    if (grabY.current === null) return;
    const dy = e.clientY - grabY.current;
    grabY.current = null;
    if (dy < -DRAG) setDeck('full');
    else if (dy > DRAG) setDeck(deck === 'full' ? 'half' : 'closed');
    else setDeck(deck === 'full' ? 'half' : 'full');
  };

  const active = filters.cities.length + (filters.when !== 'upcoming' ? 1 : 0) +
    (filters.type ? 1 : 0) + (filters.country ? 1 : 0) + (filters.region ? 1 : 0);
  const n = filters.view === 'calendar' ? calendar.grid.eventsInMonth : board.events.length;
  const openClass = deck === 'closed' ? '' : deck === 'full' ? ' deck-open deck-full' : ' deck-open';

  const control: DeckControl = {
    state: deck,
    expand: () => setDeck('full'),
    settle: () => setDeck((d) => (d === 'full' ? 'half' : d)),
  };

  return (
    <nav ref={navRef} className={`controls${openClass}`} id="controls" aria-label="Filters" onKeyDown={onKeyDown}>
      <div className="controls__inner">
        {search}
        <button ref={buttonRef} id="deckBtn" className="deckbtn" type="button" aria-expanded={deck !== 'closed'} aria-controls="deck"
          aria-label={active ? `Filters, ${active} active` : 'Filters'} onClick={deck === 'closed' ? open : close}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M5.5 10h9M8 15h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          {active > 0 && <span className="deckbtn__n">{active}</span>}
        </button>
        <div id="deck" className="deck">
          <div className="deck__grab" aria-hidden="true" onPointerDown={onGrabDown} onPointerUp={onGrabUp}><i /></div>
          <h2 ref={titleRef} className="deck__title" id="deckTitle" tabIndex={-1}>Filters</h2>
          <div className="deck__body">
            <DeckContext value={control}>{children}</DeckContext>
          </div>
          <button type="button" id="deckDone" className="deck__done" onClick={onDone}>Done · {n} {n === 1 ? 'event' : 'events'}</button>
        </div>
      </div>
    </nav>
  );
}
