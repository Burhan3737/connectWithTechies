import { useEffect, useRef, useSyncExternalStore, type MouseEvent } from 'react';
import { calDates, calLinks } from '../../model/addToCalendar';
import type { TechEvent } from '../../model/types';

/* One menu open at a time, across every row: the open one's key, shared. */
let openKey: string | null = null;
const listeners = new Set<() => void>();
const setOpenKey = (k: string | null) => { openKey = k; listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getOpenKey = () => openKey;

/**
 * "+ Calendar": Google, Outlook.com, Microsoft 365, Yahoo, and an .ics file
 * for everything else. A <details> beside the row's link (a link cannot hold
 * links); its URLs are only built while it is open.
 */
export function AddToCalendar({ event, menuKey, today }: { event: TechEvent; menuKey: string; today: string }) {
  const current = useSyncExternalStore(subscribe, getOpenKey, getOpenKey);
  const open = current === menuKey;
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpenKey(null); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpenKey(null);
      ref.current?.querySelector('summary')?.focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  // A row scrolled out of a virtual list unmounts; its menu should not stay "open".
  useEffect(() => () => { if (getOpenKey() === menuKey) setOpenKey(null); }, [menuKey]);

  const dates = calDates(event, today);
  if (!dates) return null;

  const toggle = (e: MouseEvent) => {
    e.preventDefault();
    setOpenKey(open ? null : menuKey);
  };
  return (
    <details className="addcal" open={open} ref={ref}>
      <summary aria-label={`Add ${event.name} to your calendar`} onClick={toggle}>+ Calendar</summary>
      <div className="addcal__menu" role="menu">
        {open && calLinks(event, dates).map((l) => (
          <a key={l.label} role="menuitem" href={l.href}
            {...(l.download ? { download: l.download } : { target: '_blank', rel: 'noopener noreferrer' })}
            onClick={() => setOpenKey(null)}>{l.label}</a>
        ))}
      </div>
    </details>
  );
}
