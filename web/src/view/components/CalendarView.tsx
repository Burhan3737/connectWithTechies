import { useApp } from '../context';
import { chipsFor } from '../../model/calendar';
import { MONTHS, WEEKDAYS, parseISO } from '../../model/dates';
import { EventRow } from './EventRow';

/**
 * A month at a time. Each day is one button: anywhere in it opens that day's
 * full list below, with the same rows as the board — each dated to the day
 * clicked and addable to a calendar.
 */
export function CalendarView() {
  const { shown, calendar, today, actions } = useApp();
  if (shown.view !== 'calendar') return <section className="cal" id="cal" hidden />;

  const { grid, day, dayEvents, title } = calendar;
  const opened = parseISO(day);
  return (
    <section className="cal" id="cal" aria-live="polite">
      <div className="cal__head">
        <button type="button" className="cal__nav" data-month="-1" aria-label="Previous month" onClick={() => actions.shiftMonth(-1)}>‹</button>
        <h2 className="cal__title">{title}</h2>
        <button type="button" className="cal__nav" data-month="1" aria-label="Next month" onClick={() => actions.shiftMonth(1)}>›</button>
        <button type="button" className="cal__today linky" data-month="0" onClick={actions.goToday}>today</button>
      </div>

      <div className="cal__grid" aria-label={title}>
        {WEEKDAYS.map((w) => <div key={w} className="cal__wd" aria-hidden="true">{w}</div>)}
        {grid.days.map((d) => {
          const chips = chipsFor(d.events);
          const n = d.events.length;
          const cls = ['cal__day',
            !d.inMonth && 'is-out', d.iso === today && 'is-today', d.iso < today && 'is-past',
            d.iso === day && 'is-sel', n > 0 && 'has-ev'].filter(Boolean).join(' ');
          return (
            <button key={d.iso} type="button" className={cls} data-day={d.iso} aria-pressed={d.iso === day}
              aria-label={`${WEEKDAYS[d.weekday]} ${d.date} ${MONTHS[Number(d.iso.slice(5, 7)) - 1]}, ${n} ${n === 1 ? 'event' : 'events'}`}
              onClick={() => actions.selectDay(d.iso)}>
              <span className="cal__num">{d.date}{n > 0 && <span className="cal__count">{n}</span>}</span>
              {chips.map((e) => (
                <span key={e.id} className={`cal__ev${e.type === 'hackathon' ? ' cal__ev--hack' : ''}`}>{e.name}</span>
              ))}
              {n > chips.length && <span className="cal__more">+{n - chips.length} more</span>}
            </button>
          );
        })}
      </div>

      {opened && (
        <div className="cal__dayview">
          <h3 className="groupbar">
            <span>{`${WEEKDAYS[opened.getDay()]}, ${MONTHS[opened.getMonth()]} ${opened.getDate()}`}</span>
            <span>{dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}</span>
          </h3>
          {dayEvents.length ? dayEvents.map((e, i) => (
            <EventRow key={e.id} event={e} when={shown.when} today={today} needle={shown.q.trim()} index={i} menuKey={`d${day}-${e.id}`} />
          )) : <p className="cal__none">Nothing on this day with the current filters.</p>}
        </div>
      )}
    </section>
  );
}
