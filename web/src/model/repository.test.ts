import { buildIndexes, loadDataset } from './repository';
import { DATASET } from '../test/fixtures';

describe('buildIndexes', () => {
  const ix = buildIndexes(DATASET);

  it('gives every event a stable id, city key and search text', () => {
    expect(ix.events.map((e) => e.id)).toEqual(DATASET.events.map((_, i) => i));
    expect(ix.events[3].cityKey).toBe('montreal|quebec');
    expect(ix.events[3].hay).toContain('montreal');
  });

  it('lists cities by event count', () => {
    expect(ix.cities[0].count).toBeGreaterThanOrEqual(ix.cities[1].count);
    expect(ix.cities.find((c) => c.key === 'waterloo|ontario')!.count).toBe(2);
  });

  it('indexes provinces and states, leaving out placeholders', () => {
    expect(ix.regions.get('Ontario')).toEqual({ name: 'Ontario', country: 'Canada', count: 3 });
    expect(ix.regions.has('US & Canada')).toBe(false);
  });

  it('labels kinds for people, most common first', () => {
    expect(ix.kinds[0].count).toBeGreaterThanOrEqual(ix.kinds[1].count);
    expect(ix.kinds.find((k) => k.value === 'tech-week')!.label).toBe('Tech week');
  });

  it('counts the tally', () => {
    expect(ix.counts).toEqual({ events: 9, cities: 7, upcoming: 7, tbd: 1 });
    expect(ix.countryCounts.get('Canada')).toBe(4);
  });
});

describe('loadDataset', () => {
  const ok = (body: unknown) => (async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch;
  it('returns the dataset', async () => {
    expect((await loadDataset('x', ok(DATASET))).events).toHaveLength(9);
  });
  it('fails clearly on an HTTP error or a file with no events', async () => {
    const notFound = (async () => new Response('', { status: 404 })) as unknown as typeof fetch;
    await expect(loadDataset('x', notFound)).rejects.toThrow('HTTP 404');
    await expect(loadDataset('x', ok({ nope: 1 }))).rejects.toThrow('no events');
  });
});
