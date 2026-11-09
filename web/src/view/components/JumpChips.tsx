import { useApp } from '../context';
import { useJump } from '../jump';
import { usePhone } from '../../viewmodel/usePhone';
import type { Band } from '../../model/bands';

const SHORT: Record<Band, string> = {
  now: 'now', thisWeek: 'this wk', nextWeek: 'next wk', weeks2to5: '2–5 wk', weeks6plus: '6+ wk', noDate: 'no date',
};

/** Phones: a row of time bands to jump to, in place of the desktop's date rail. */
export function JumpChips() {
  const { board } = useApp();
  const { jump } = useJump();
  const phone = usePhone();
  if (!phone || board.marks.length === 0) return null;
  return (
    <div className="jumps" role="group" aria-label="Jump to">
      {board.marks.map((m) => (
        <button key={m.band} type="button" className="jump" data-band={m.band} onClick={() => jump(m)}
          aria-label={`${SHORT[m.band]}: ${m.label}, ${m.count} ${m.count === 1 ? 'event' : 'events'}`}>
          <i aria-hidden="true" />{SHORT[m.band]}
        </button>
      ))}
    </div>
  );
}
