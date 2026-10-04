/**
 * The shapes the app works with. `TechEvent` mirrors a record in
 * data/events.json (see data/SCHEMA.md); only the fields the app reads are
 * listed, and the build strips the rest before shipping the file.
 */

export type EventStatus = 'upcoming' | 'past' | 'recurring-tbd' | 'discontinued';
export type Country = 'United States' | 'Canada';

export interface TechEvent {
  name: string;
  type: string;
  topics?: string[];
  city: string;
  region: string;
  country: Country | string;
  venue?: string;
  cadence?: string;
  month?: string;
  next_date?: string;
  next_date_end?: string;
  last_date?: string;
  status: EventStatus | string;
  attendance?: string;
  cost?: string;
  audience?: string;
  url: string;
  description?: string;
  /** Upcoming sessions of a recurring series, from the feed. */
  feed_dates?: string[];
}

export interface Dataset {
  generated_on: string;
  event_count: number;
  city_count: number;
  events: TechEvent[];
}

export type When = 'upcoming' | 'past' | 'all';
export type SortKey = 'date' | 'city' | 'name';
export type View = 'list' | 'calendar';

/** Everything the person has chosen. Serialised to the URL. */
export interface Filters {
  q: string;
  cities: string[];        // city keys, "toronto|ontario"
  when: When;
  type: string;
  country: string;
  region: string;
  sort: SortKey;
  view: View;
  month: string;           // calendar month, YYYY-MM
  day: string;             // calendar day opened, YYYY-MM-DD
}

export const DEFAULT_FILTERS: Filters = {
  q: '', cities: [], when: 'upcoming', type: '', country: '', region: '',
  sort: 'date', view: 'list', month: '', day: '',
};

/** An event as the app holds it: the record plus precomputed lookups. */
export interface IndexedEvent extends TechEvent {
  /** Stable index into the dataset, used as a React key. */
  id: number;
  cityKey: string;
  /** Folded text of every searchable field. */
  hay: string;
}

export interface CityOption { key: string; city: string; region: string; country: string; count: number }
export interface RegionOption { name: string; country: string; count: number }
export interface KindOption { value: string; label: string; count: number }
