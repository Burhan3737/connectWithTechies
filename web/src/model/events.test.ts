import { cityKeyOf, groupLabel, haystackOf, inWhen, keyDate, keyDateEnd, monthHint, monthIndex } from './events';
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
    it('Past includes anything with an edition held', () => {
      expect(inWhen(byName('Toronto Tech Week'), 'past', TODAY)).toBe(true);
      expect(inWhen(byName('BigRed//Hacks'), 'past', TODAY)).toBe(true);    // started before today
      expect(inWhen(byName('Hack the North'), 'past', TODAY)).toBe(false);
    });
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
