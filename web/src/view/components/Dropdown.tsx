import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { fold } from '../../model/text';

export interface DropdownOption { value: string; label: string; count?: number }
export interface DropdownGroup { label?: string; options: DropdownOption[] }

interface Props {
  /** Becomes `${id}-dd` on the trigger, which the label points at. */
  id: string;
  label: string;
  value: string;
  groups: DropdownGroup[];
  onChange(value: string): void;
  /** The wrapper's class: a filter-bar box, or the results-bar sort. */
  boxClassName?: string;
  /** Lists at least this long open on a filter box. */
  searchableFrom?: number;
  /**
   * Render the label inside the box (the results-bar Sort). Otherwise the
   * caller renders a visible <FieldLabel> with id `${id}-label`.
   */
  inlineLabel?: boolean;
}

/** The visible label above a filter-bar dropdown, pointing at its trigger. */
export function FieldLabel({ id, children }: { id: string; children: string }) {
  return <label className="field__label" htmlFor={`${id}-dd`} id={`${id}-label`}>{children}</label>;
}

/**
 * A listbox drawn in the page's own style. The browser's <select> list can't
 * be styled — no padding, no count column — so this replaces it, with the
 * keyboard behaviour of a native select: arrows, Home/End, Enter, Escape, and
 * typing a letter to jump.
 */
export function Dropdown({ id, label, value, groups, onChange, boxClassName = 'field__box', searchableFrom = 12, inlineLabel = false }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [alignRight, setAlignRight] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const triggerId = `${id}-dd`;

  const all = groups.flatMap((g) => g.options);
  const current = all.find((o) => o.value === value) ?? all[0];
  const searchable = all.length >= searchableFrom;
  const needle = fold(filter.trim());
  const visible = groups
    .map((g) => ({ ...g, options: g.options.filter((o) => !needle || fold(o.label).includes(needle)) }))
    .filter((g) => g.options.length);

  const close = (refocus: boolean) => {
    setOpen(false);
    setFilter('');
    if (refocus) triggerRef.current?.focus();
  };
  const choose = (v: string) => {
    close(true);
    if (v !== value) onChange(v);
  };

  // Clicking anywhere else closes the list.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) close(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // On opening: open toward the side with room, and put focus where typing goes.
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const r = panelRef.current.getBoundingClientRect();
    setAlignRight(r.right > document.documentElement.clientWidth - 8);
    const target = panelRef.current.querySelector<HTMLElement>('.dd__search') ||
      panelRef.current.querySelector<HTMLElement>('[aria-selected="true"]') ||
      panelRef.current.querySelector<HTMLElement>('[role="option"]');
    target?.focus();
    panelRef.current.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [open]);

  const options = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
  const onTriggerKey = (e: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); setOpen(true); }
  };
  const onPanelKey = (e: KeyboardEvent) => {
    const opts = options();
    const active = document.activeElement as HTMLElement | null;
    const at = opts.indexOf(active as HTMLElement);
    const inSearch = !!active?.classList.contains('dd__search');
    const go = (i: number) => { const o = opts[i]; if (o) { o.focus(); o.scrollIntoView?.({ block: 'nearest' }); } };
    switch (e.key) {
      case 'Escape': e.preventDefault(); close(true); return;
      case 'Tab': close(false); return;
      case 'ArrowDown': e.preventDefault(); go(inSearch ? 0 : Math.min(at + 1, opts.length - 1)); return;
      case 'ArrowUp':
        e.preventDefault();
        if (at <= 0) panelRef.current?.querySelector<HTMLElement>('.dd__search')?.focus(); else go(at - 1);
        return;
      case 'Home': if (!inSearch) { e.preventDefault(); go(0); } return;
      case 'End': if (!inSearch) { e.preventDefault(); go(opts.length - 1); } return;
      case 'Enter': {
        e.preventDefault();
        const pick = inSearch ? opts[0] : opts[at];
        if (pick) choose(pick.dataset.value ?? '');
        return;
      }
      case ' ': if (!inSearch) { e.preventDefault(); if (opts[at]) choose(opts[at].dataset.value ?? ''); } return;
      default:
        // Type a letter to jump, as a native select does.
        if (!inSearch && e.key.length === 1 && /\S/.test(e.key)) {
          const k = fold(e.key);
          for (let j = 1; j <= opts.length; j++) {
            const cand = opts[(at + j) % opts.length];
            if (fold(cand.dataset.label).startsWith(k)) { go(opts.indexOf(cand)); break; }
          }
        }
    }
  };

  return (
    <div ref={boxRef} className={`${boxClassName} dd${open ? ' is-open' : ''}`}>
      {inlineLabel && <label htmlFor={triggerId} id={`${id}-label`}>{label}</label>}
      <button ref={triggerRef} type="button" id={triggerId} className={`dd__trigger${!current || current.value === '' ? ' is-all' : ''}`}
        aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-label ${triggerId}`}
        onClick={() => (open ? close(true) : setOpen(true))} onKeyDown={onTriggerKey}>
        <span className="dd__value">{current?.label}</span>
        <svg className="dd__chev" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <div ref={panelRef} className={`dd__panel${alignRight ? ' dd__panel--right' : ''}`} onKeyDown={onPanelKey}>
          {searchable && (
            <input className="dd__search" type="text" placeholder="Filter" aria-label="Filter options" autoComplete="off"
              spellCheck={false} value={filter} onChange={(e) => setFilter(e.target.value)} aria-controls={listId} />
          )}
          <ul className="dd__list" role="listbox" id={listId} aria-labelledby={triggerId}>
            {visible.map((g, gi) => [
              g.label ? <li key={`g${gi}`} className="dd__group" role="presentation">{g.label}</li> : null,
              ...g.options.map((o) => (
                <li key={o.value || '_all'} role="option" tabIndex={-1} data-value={o.value} data-label={o.label}
                  aria-selected={o.value === value} className={o.value === '' ? 'is-all' : undefined}
                  onClick={() => choose(o.value)}>
                  <span className="dd__opt">{o.label}</span>
                  {o.count != null && <span className="dd__count">{o.count}</span>}
                </li>
              )),
            ])}
          </ul>
          {searchable && !visible.length && <p className="dd__none">No match</p>}
        </div>
      )}
    </div>
  );
}
