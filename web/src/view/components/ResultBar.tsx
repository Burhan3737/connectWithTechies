import { useEffect } from 'react';
import { useApp } from '../context';
import { Dropdown } from './Dropdown';
import type { SortKey, View } from '../../model/types';

const VIEWS: { value: View; label: string }[] = [{ value: 'list', label: 'List' }, { value: 'calendar', label: 'Calendar' }];

/** The count, the List / Calendar switch, and Sort. */
export function ResultBar() {
  const { filters, shown, board, calendar, scopeLabel, actions } = useApp();
  const inCal = filters.view === 'calendar';

  // The calendar is its own time axis: dim When and hide Sort while it shows.
  useEffect(() => {
    document.body.classList.toggle('is-cal', inCal);
    return () => document.body.classList.remove('is-cal');
  }, [inCal]);

  const n = inCal ? calendar.grid.eventsInMonth : board.events.length;
  return (
    <div className="resultbar">
      <p id="count" className="resultbar__count" aria-live="polite">
        <b>{n}</b> {n === 1 ? 'event' : 'events'}
        {inCal ? <> in {calendar.title}</> : <> · {scopeLabel} · {shown.when}</>}
      </p>
      <div className="segmented viewtoggle" role="radiogroup" aria-label="View">
        {VIEWS.map((v) => (
          <button key={v.value} type="button" role="radio" data-view={v.value} aria-checked={filters.view === v.value}
            className={filters.view === v.value ? 'is-on' : undefined} onClick={() => actions.setView(v.value)}>{v.label}</button>
        ))}
      </div>
      <Dropdown id="sort" label="Sort" inlineLabel boxClassName="resultbar__sort" value={filters.sort}
        onChange={(v) => actions.setSort(v as SortKey)}
        groups={[{ options: [{ value: 'date', label: 'Date' }, { value: 'city', label: 'City' }, { value: 'name', label: 'Name' }] }]} />
    </div>
  );
}
