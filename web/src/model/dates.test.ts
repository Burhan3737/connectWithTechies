import { addDays, daysBetween, fmtDay, fmtMonYear, fmtRange, isISODate, monthTitle, parseISO, shiftMonth, todayISO } from './dates';

describe('dates', () => {
  it('recognises ISO days only', () => {
    expect(isISODate('2026-10-04')).toBe(true);
    expect(isISODate('2026-10')).toBe(false);
    expect(isISODate('Oct 4')).toBe(false);
  });

  it('parses a day as local midnight, never shifted by time zone', () => {
    const d = parseISO('2026-10-04')!;
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 4, 0]);
    expect(parseISO('nope')).toBeNull();
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-10-02', '2026-10-05')).toBe(3);
  });

  it('formats for the board', () => {
    expect(fmtDay('2026-10-04')).toBe('04');
    expect(fmtMonYear('2026-10-04')).toBe('Oct 2026');
    expect(fmtRange('2026-10-04')).toBe('October 4, 2026');
    expect(fmtRange('2026-10-04', '2026-10-06')).toBe('October 4–6, 2026');
    expect(fmtRange('2026-10-30', '2026-11-02')).toBe('October 30 – November 2, 2026');
  });

  it('moves between months', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(monthTitle('2026-10')).toBe('October 2026');
  });

  it('takes today from the local calendar', () => {
    expect(todayISO(new Date(2026, 9, 4, 23, 59))).toBe('2026-10-04');
  });
});
