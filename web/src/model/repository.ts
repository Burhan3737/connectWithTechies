import { cityKeyOf, haystackOf } from './events';
import type { CityOption, Dataset, IndexedEvent, KindOption, RegionOption } from './types';

/**
 * The one place the app gets its data. Everything above this layer works with
 * an `Indexes` object and never knows the data came over HTTP — tests build
 * one from fixtures with `buildIndexes`.
 */

/** Region names that are placeholders, not places to filter by. */
const NOT_A_REGION = /^(various|multiple|n\/a|us & canada)$/i;

export interface Indexes {
  generatedOn: string;
  events: IndexedEvent[];
  cities: CityOption[];                // most events first
  regions: Map<string, RegionOption>;  // by region name
  kinds: KindOption[];                 // most events first
  countryCounts: Map<string, number>;
  counts: { events: number; cities: number; upcoming: number; tbd: number };
}

export function buildIndexes(data: Dataset): Indexes {
  const events: IndexedEvent[] = data.events.map((e, id) => ({ ...e, id, cityKey: cityKeyOf(e), hay: haystackOf(e) }));

  const cityMap = new Map<string, CityOption>();
  const regions = new Map<string, RegionOption>();
  const kindCount = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  for (const e of events) {
    const c = cityMap.get(e.cityKey) || { key: e.cityKey, city: e.city, region: e.region, country: e.country, count: 0 };
    c.count++;
    cityMap.set(e.cityKey, c);
    if (e.region && !NOT_A_REGION.test(e.region)) {
      const r = regions.get(e.region) || { name: e.region, country: e.country, count: 0 };
      r.count++;
      regions.set(e.region, r);
    }
    kindCount.set(e.type, (kindCount.get(e.type) || 0) + 1);
    countryCounts.set(e.country, (countryCounts.get(e.country) || 0) + 1);
  }

  const cities = [...cityMap.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
  const kinds = [...kindCount.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => {
    const label = value.replace(/-/g, ' ');
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1), count };
  });

  return {
    generatedOn: data.generated_on,
    events, cities, regions, kinds, countryCounts,
    counts: {
      events: events.length,
      cities: cities.length,
      upcoming: events.filter((e) => e.status === 'upcoming').length,
      tbd: events.filter((e) => e.status === 'recurring-tbd').length,
    },
  };
}

/** Fetch the dataset served beside the app. */
export async function loadDataset(url: string, fetchImpl: typeof fetch = fetch): Promise<Dataset> {
  const res = await fetchImpl(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as Dataset;
  if (!data || !Array.isArray(data.events)) throw new Error('the file holds no events');
  return data;
}
