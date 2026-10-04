import { fmtDay, fmtMonYear, fmtRange } from '../../model/dates';
import { dateLine, keyDate, monthHint } from '../../model/events';
import type { TechEvent, When } from '../../model/types';
import { Highlight } from './Highlight';
import { AddToCalendar } from './AddToCalendar';

interface Props {
  event: TechEvent & { occurrence?: boolean };
  when: When;
  today: string;
  needle: string;
  /** Position on screen, for the staggered entrance of the first rows. */
  index: number;
  menuKey: string;
}

/** One event: the whole row links to the organiser; + Calendar sits beside it. */
export function EventRow({ event: e, when, today, needle, index, menuKey }: Props) {
  const k = keyDate(e, when, today);
  // + Calendar only when the row shows the date that would go in a calendar:
  // under Past an annual event shows the edition held, not the next one.
  const offerCalendar = !!k && k === e.next_date;

  const tags = [<span key="kind" className="ev__tag ev__tag--kind">{e.type.replace(/-/g, ' ')}</span>];
  if (e.cost === 'free') tags.push(<span key="cost" className="ev__tag ev__tag--free">free</span>);
  else if (e.cost && e.cost !== 'varies') tags.push(<span key="cost" className="ev__tag">{e.cost}</span>);
  if (e.attendance) tags.push(<span key="att" className="ev__tag">~{e.attendance} people</span>);
  (e.topics || []).slice(0, 4).forEach((t) => tags.push(<span key={`t-${t}`} className="ev__tag">{t}</span>));

  return (
    <div className="evrow">
      <a className="ev" href={e.url} target="_blank" rel="noopener noreferrer"
        style={{ animationDelay: `${Math.min(index, 14) * 22}ms` }}
        aria-label={`${e.name} — ${dateLine(e, when, today, fmtRange)} — ${e.city} — opens the official site in a new tab`}>
        {k ? (
          <span className="ev__when">
            <span className="ev__d1">{fmtDay(k)}</span>
            <span className="ev__d2">{fmtMonYear(k)}</span>
          </span>
        ) : (
          <span className="ev__when ev__when--tbd">
            <span className="ev__d1">{monthHint(e)}</span>
            <span className="ev__d2">{e.cadence || 'date tba'}</span>
          </span>
        )}
        <div className="ev__main">
          <h2 className="ev__name"><Highlight text={e.name} needle={needle} /></h2>
          {e.description && <p className="ev__desc"><Highlight text={e.description} needle={needle} /></p>}
          <div className="ev__tags">{tags}</div>
        </div>
        <span className="ev__where">
          <span className="ev__city"><Highlight text={e.city} needle={needle} /></span>
          <span className="ev__geo">{e.region}{e.country === 'Canada' ? ' · CA' : ' · US'}</span>
          {e.venue && <span className="ev__venue">{e.venue}</span>}
        </span>
        <span className="ev__go" aria-hidden="true">↗</span>
      </a>
      {offerCalendar && <AddToCalendar event={e} menuKey={menuKey} today={today} />}
    </div>
  );
}
