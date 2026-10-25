import { asOf, cityKeyOf, groupLabel, haystackOf, inWhen, keyDate, keyDateEnd, monthHint, monthIndex, runsUntil } from './events';
import { EVENTS, TODAY } from '../test/fixtures';

const byName = (n: string) => EVENTS.find((e) => e.name === n)!;

describe('event rules', () => {
  it('keys cities by folded city and region', () => {
    expect(cityKeyOf({ city: 'Montréal', region: 'Quebec' })).toBe('montreal|quebec');
  });

  it('searches every listed field, accent-free', () => {
    const hay = haystackOf(byName('Montréal AI Night'));
    for (const word of ['montreal', 'machine learning', 'quebec', 'canada', 'meetup']) expect(hay).toContain(word);
  });

  describe('which date a row is filed under', () => {
    const week = byName('Toronto Tech Week');
    it('Upcoming shows the next edition', () => expect(keyDate(week, 'upcoming', TODAY)).toBe('2026-10-20'));
    it('Past shows the edition held, even with one scheduled', () => expect(keyDate(week, 'past', TODAY)).toBe('2025-10-21'));
    it('All prefers the next edition', () => expect(keyDate(week, 'all', TODAY)).toBe('2026-10-20'));
    it('an end date belongs only to the next edition', () => {
      expect(keyDateEnd(week, 'upcoming', TODAY)).toBe('2026-10-24');
      expect(keyDateEnd(week, 'past', TODAY)).toBe('');
    });
    it('a calendar occurrence is filed under its own day', () => {
      expect(keyDate({ ...week, next_date: '2026-10-22', occurrence: true }, 'past', TODAY)).toBe('2026-10-22');
    });
  });

  describe('When', () => {
    it('Upcoming includes dated and undated annual events', () => {
      expect(inWhen(byName('Hack the North'), 'upcoming', TODAY)).toBe(true);
      expect(inWhen(byName('DevOpsDays Austin'), 'upcoming', TODAY)).toBe(true);
      expect(inWhen(byName('Old Summit'), 'upcoming', TODAY)).toBe(false);
    });
    it("Upcoming goes by the visitor's date, not the data build's status", () => {
      const endedYesterday = { ...byName('Hack the North'), next_date: '2026-10-01', next_date_end: '2026-10-03', status: 'upcoming' };
      expect(inWhen(endedYesterday, 'upcoming', TODAY)).toBe(false);
      expect(inWhen(endedYesterday, 'past', TODAY)).toBe(true);
      expect(inWhen(byName('BigRed//Hacks'), 'upcoming', TODAY)).toBe(true);   // still running today
    });
    it('Past includes anything with an edition held', () => {
      expect(inWhen(byName('Toronto Tech Week'), 'past', TODAY)).toBe(true);
      expect(inWhen(byName('BigRed//Hacks'), 'past', TODAY)).toBe(true);    // started before today
      expect(inWhen(byName('Hack the North'), 'past', TODAY)).toBe(false);
    });
  });

  describe('as of today, not the data build', () => {
    const later = '2026-10-25';
    it('leaves an event still to come or under way as it is', () => {
      const htn = byName('Hack the North');
      expect(asOf(htn, TODAY)).toBe(htn);
      expect(asOf(byName('BigRed//Hacks'), TODAY)).toBe(byName('BigRed//Hacks'));
    });
    it('moves a series on to its next listed session', () => {
      const s = asOf(byName('Seattle Python Meetup'), later);
      expect([s.next_date, s.last_date, s.status]).toEqual(['2026-11-12', '2026-10-08', 'upcoming']);
    });
    it('finds the next session of a series the build already rolled over', () => {
      const rolled = { ...byName('Seattle Python Meetup'), next_date: '', last_date: '2026-10-08', status: 'recurring-tbd' };
      expect(asOf(rolled, later)).toMatchObject({ next_date: '2026-11-12', last_date: '2026-10-08', status: 'upcoming' });
    });
    it('rolls a recurring event with nothing listed over to date TBA, keeping the edition held', () => {
      const r = asOf(byName('Toronto Tech Week'), later);
      expect([r.next_date, r.next_date_end, r.last_date, r.status]).toEqual(['', '', '2026-10-20', 'recurring-tbd']);
      expect(inWhen(r, 'upcoming', later)).toBe(true);
      expect(inWhen(r, 'past', later)).toBe(true);
    });
    it('makes a one-off that has ended past', () => {
      const r = asOf({ ...byName('Hack the North'), cadence: 'one-off' }, later);
      expect([r.next_date, r.status]).toEqual(['2026-10-09', 'past']);
      expect(inWhen(r, 'upcoming', later)).toBe(false);
    });
  });

  it('says how long an event under way runs', () => {
    expect(runsUntil(byName('BigRed//Hacks'), 'upcoming', TODAY)).toBe('2026-10-05');
    expect(runsUntil(byName('Hack the North'), 'upcoming', TODAY)).toBe('');      // not started
    expect(runsUntil(byName('BigRed//Hacks'), 'past', TODAY)).toBe('');
    expect(runsUntil({ ...byName('Hack the North'), next_date: TODAY, next_date_end: '' }, 'upcoming', TODAY)).toBe('');
  });

  it('reads the usual month of an undated event', () => {
    expect(monthIndex({ month: 'May' })).toBe(4);
    expect(monthIndex({ month: 'Varies' })).toBe(99);
    expect(monthHint({ month: 'May' })).toBe('May');
    expect(monthHint({ month: 'September-October' })).toBe('Septembe.');
    expect(monthHint({ month: 'Varies' })).toBe('TBA');
  });

  it('labels groups by sort', () => {
    const e = byName('Hack the North');
    expect(groupLabel(e, 'date', 'upcoming', TODAY)).toBe('October 2026');
    expect(groupLabel(e, 'city', 'upcoming', TODAY)).toBe('Waterloo, Ontario');
    expect(groupLabel(e, 'name', 'upcoming', TODAY)).toBe('H');
    expect(groupLabel(byName('DevOpsDays Austin'), 'date', 'upcoming', TODAY)).toBe('Usually May — date not yet announced');
  });
});
