import { buildIndexes } from '../model/repository';
import type { Dataset, TechEvent } from '../model/types';

/** Fixed "today" for every unit test, so date rules give the same answer whenever they run. */
export const TODAY = '2026-10-04';

const ev = (o: Partial<TechEvent> & Pick<TechEvent, 'name'>): TechEvent => ({
  type: 'meetup', city: 'Toronto', region: 'Ontario', country: 'Canada', status: 'upcoming',
  url: `https://example.org/${o.name.toLowerCase().replace(/\W+/g, '-')}`, ...o,
});

/** A small dataset with one of each shape the rules care about. */
export const EVENTS: TechEvent[] = [
  ev({ name: 'Toronto Tech Week', type: 'tech-week', next_date: '2026-10-20', next_date_end: '2026-10-24', last_date: '2025-10-21', status: 'upcoming', topics: ['startups'] }),
  ev({ name: 'Hack the North', type: 'hackathon', city: 'Waterloo', next_date: '2026-10-09', next_date_end: '2026-10-11', status: 'upcoming', cost: 'free' }),
  ev({ name: 'BigRed//Hacks', type: 'hackathon', city: 'Ithaca', region: 'New York', country: 'United States', next_date: '2026-10-02', next_date_end: '2026-10-05', status: 'upcoming' }),
  ev({ name: 'Montréal AI Night', city: 'Montréal', region: 'Quebec', next_date: '2026-10-15', status: 'upcoming', description: 'Talks on machine learning in Montréal.' }),
  ev({ name: 'Seattle Python Meetup', type: 'meetup-series', city: 'Seattle', region: 'Washington', country: 'United States', cadence: 'monthly',
    next_date: '2026-10-08', feed_dates: ['2026-10-08', '2026-11-12', '2026-12-10'], status: 'upcoming' }),
  ev({ name: 'DevOpsDays Austin', type: 'conference', city: 'Austin', region: 'Texas', country: 'United States', month: 'May', last_date: '2026-05-05', status: 'recurring-tbd' }),
  ev({ name: 'Old Summit', type: 'summit', city: 'Austin', region: 'Texas', country: 'United States', last_date: '2025-03-01', status: 'past' }),
  ev({ name: 'Multi-City Week', type: 'tech-week', city: 'Multiple cities', region: 'US & Canada', country: 'United States', next_date: '2026-11-01', status: 'upcoming' }),
  ev({ name: 'Long Workshop Series', type: 'workshop', city: 'Waterloo', next_date: '2026-09-01', next_date_end: '2026-12-01', status: 'upcoming' }),
];

export const DATASET: Dataset = { generated_on: '2026-10-04', event_count: EVENTS.length, city_count: 0, events: EVENTS };
export const indexes = () => buildIndexes(DATASET);
