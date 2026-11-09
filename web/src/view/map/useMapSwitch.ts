import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { syncUrlToFilters } from '../../viewmodel/useAppViewModel';
import { usePhone } from '../../viewmodel/usePhone';
import { useApp } from '../context';

export interface MapSwitch {
  open: boolean;
  toggle(): void;
}

/** What the open map covers: nothing here should take focus or be read out behind it. */
const BEHIND = 'main, .foot, .controls, .masthead';

/**
 * On a phone the list is home and the map is a screen of its own, one history
 * entry deep, so the back button closes it. The filters can change while it is
 * open, so whichever entry the browser lands on gets them written back to it.
 */
export function useMapSwitch(): MapSwitch {
  const { filters } = useApp();
  const phone = usePhone();
  const [open, setOpen] = useState(false);
  const latest = useRef({ filters, phone });
  useLayoutEffect(() => { latest.current = { filters, phone }; });

  const close = () => {
    setOpen(false);
    if (window.history.state?.mapOpen) window.history.back();
  };

  const toggle = () => {
    if (open) { close(); return; }
    window.history.scrollRestoration = 'manual';
    window.history.pushState({ mapOpen: 1 }, '', window.location.href);
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const behind = document.querySelectorAll(BEHIND);
    root.classList.add('map-open');
    behind.forEach((el) => el.setAttribute('inert', ''));
    return () => {
      root.classList.remove('map-open');
      behind.forEach((el) => el.removeAttribute('inert'));
    };
  }, [open]);

  useEffect(() => {
    const onPop = (ev: PopStateEvent) => {
      const wantMap = !!ev.state?.mapOpen;
      syncUrlToFilters(latest.current.filters);
      if (!wantMap) window.history.scrollRestoration = 'auto';
      setOpen(wantMap && latest.current.phone);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // A reload lands on the map's entry with the list showing: the entry must not claim otherwise.
  useEffect(() => {
    if (window.history.state?.mapOpen) window.history.replaceState(null, '', window.location.href);
  }, []);

  // Rotated or widened out of the phone layout: the map is part of the page again.
  useEffect(() => { if (!phone && open) close(); }, [phone]);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape' && !ev.defaultPrevented) close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return { open, toggle };
}
