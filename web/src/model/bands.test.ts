import { bandMarks, bandOf } from './bands';
import { EVENTS } from '../test/fixtures';
import type { IndexedEvent } from './types';

const base = { ...EVENTS[0], id: 0, cityKey: '', hay: '' };
const on = (next_date: string, next_date_end = ''): IndexedEvent =>
  ({ ...base, next_date, next_date_end, last_date: '', feed_dates: [], status: 'upcoming' });
const undated: IndexedEvent = { ...base, next_date: '', next_date_end: '', last_date: '', feed_dates: [], status: 'recurring-tbd' };
const running = on('2026-10-01', '2026-11-19');
const today = '2026-10-23'; // a Friday

describe('time bands', () => {
  it('puts an event in the band of its date, weeks running Monday to Sunday', () => {
    expect(bandOf(on('2026-10-25'), 'upcoming', today)).toBe('thisWeek');
    expect(bandOf(on('2026-10-26'), 'upcoming', today)).toBe('nextWeek');
    expect(bandOf(on('2026-11-01'), 'upcoming', today)).toBe('nextWeek');
    expect(bandOf(on('2026-11-02'), 'upcoming', today)).toBe('weeks2to5');
    expect(bandOf(on('2026-11-29'), 'upcoming', today)).toBe('weeks2to5');
    expect(bandOf(on('2026-11-30'), 'upcoming', today)).toBe('weeks6plus');
    expect(bandOf(undated, 'upcoming', today)).toBe('noDate');
    expect(bandOf(running, 'upcoming', today)).toBe('now');
  });

  it('marks the first row of each band, with how many it holds', () => {
    const list = [running, on('2026-10-24'), on('2026-10-25'), on('2026-10-27'), on('2026-12-20'), undated];
    expect(bandMarks(list, 'upcoming', today)).toEqual([
      { band: 'now', index: 0, count: 1, label: 'On now' },
      { band: 'thisWeek', index: 1, count: 2, label: 'This week' },
      { band: 'nextWeek', index: 3, count: 1, label: 'Next week' },
      { band: 'weeks6plus', index: 4, count: 1, label: '6+ weeks out' },
      { band: 'noDate', index: 5, count: 1, label: 'No date yet' },
    ]);
  });

  it('has no marks without events, or outside Upcoming', () => {
    expect(bandMarks([], 'upcoming', today)).toEqual([]);
    expect(bandMarks([on('2026-10-24')], 'past', today)).toEqual([]);
    expect(bandMarks([on('2026-10-24')], 'all', today)).toEqual([]);
  });
});
