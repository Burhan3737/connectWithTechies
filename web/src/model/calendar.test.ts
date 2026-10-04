import { buildMonth, chipsFor, compareForDay, eventDays, occurrenceOn } from './calendar';
import { indexes } from '../test/fixtures';

const all = indexes().events;
const byName = (n: string) => all.find((e) => e.name === n)!;

describe('which days an event is on', () => {
  it('every day of a short edition, plus the last edition held', () => {
    expect(eventDays(byName('Toronto Tech Week'))).toEqual(['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2025-10-21']);
  });
  it('only the first day of a long programme', () => {
    expect(eventDays(byName('Long Workshop Series'))).toEqual(['2026-09-01']);
  });
  it('every session of a series, once each', () => {
    expect(eventDays(byName('Seattle Python Meetup'))).toEqual(['2026-10-08', '2026-11-12', '2026-12-10']);
  });
});

describe('occurrenceOn', () => {
  it('a day inside the next edition stands for that whole edition', () => {
    const o = occurrenceOn(byName('BigRed//Hacks'), '2026-10-04');
    expect([o.next_date, o.next_date_end, o.occurrence]).toEqual(['2026-10-02', '2026-10-05', true]);
  });
  it('any other day stands for itself', () => {
    const o = occurrenceOn(byName('Seattle Python Meetup'), '2026-11-12');
    expect([o.next_date, o.next_date_end]).toEqual(['2026-11-12', '']);
  });
});

describe('a month', () => {
  const m = buildMonth('2026-10', all);
  it('is whole weeks starting on Sunday', () => {
    expect(m.days.length % 7).toBe(0);
    expect(m.days[0].iso).toBe('2026-09-27');
    expect(m.days[0].weekday).toBe(0);
    expect(m.days.filter((d) => d.inMonth)).toHaveLength(31);
  });
  it('files events under their days and counts each event once for the month', () => {
    expect(m.byDay.get('2026-10-21')!.map((e) => e.name)).toEqual(['Toronto Tech Week']);
    // Five: the long workshop shows only on its first day (September), Multi-City Week is November.
    expect(m.eventsInMonth).toBe(5);
  });
  it('days lead with hackathons, then conferences, then by name', () => {
    const day = [byName('Seattle Python Meetup'), byName('DevOpsDays Austin'), byName('Hack the North')].sort(compareForDay);
    expect(day.map((e) => e.type)).toEqual(['hackathon', 'conference', 'meetup-series']);
  });
  it('a cell shows each title once, three at most', () => {
    const twin = { ...byName('Hack the North'), id: 999, city: 'Toronto' };
    expect(chipsFor([byName('Hack the North'), twin, ...all]).map((e) => e.name).filter((n) => n === 'Hack the North')).toHaveLength(1);
    expect(chipsFor(all)).toHaveLength(3);
  });
});
