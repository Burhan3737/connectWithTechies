import { EMPTY_PLACES, anyPosition, loadPlaces, ownPosition, parsePlaces, radiusScope, rangeFrom } from './places';

describe('parsePlaces', () => {
  const t = parsePlaces({ cities: { 'a|b': [1, 2] }, metros: [{ lat: 5, lon: 6, members: ['c|d', 'a|b'] }] });

  it('reads a city own position', () => {
    expect(ownPosition(t, 'a|b')).toEqual([1, 2]);
    expect(ownPosition(t, 'c|d')).toBeUndefined();
  });

  it('falls back to the metro centre for any position', () => {
    expect(anyPosition(t, 'c|d')).toEqual([5, 6]);
    expect(anyPosition(t, 'a|b')).toEqual([1, 2]);
    expect(anyPosition(t, 'x|y')).toBeUndefined();
  });

  it('gives the empty table for malformed input', () => {
    expect(parsePlaces('nonsense')).toBe(EMPTY_PLACES);
    expect(parsePlaces(null)).toBe(EMPTY_PLACES);
    expect(parsePlaces({ cities: { 'a|b': ['x', 2] } }).own.size).toBe(0);
  });
});

describe('loadPlaces', () => {
  it('never rejects: a bad status or a network error gives the empty table', async () => {
    await expect(loadPlaces('u', async () => new Response('', { status: 500 }))).resolves.toBe(EMPTY_PLACES);
    await expect(loadPlaces('u', async () => { throw new Error('offline'); })).resolves.toBe(EMPTY_PLACES);
    await expect(loadPlaces('u', async () => new Response('not json', { status: 200 }))).resolves.toBe(EMPTY_PLACES);
  });

  it('parses a served file', async () => {
    const body = JSON.stringify({ cities: { 'a|b': [1, 2] } });
    const t = await loadPlaces('u', async () => new Response(body, { status: 200 }));
    expect(ownPosition(t, 'a|b')).toEqual([1, 2]);
  });
});

describe('radius', () => {
  const t = parsePlaces({ cities: { 'p|x': [40.44, -80], 'near|x': [40.5, -80], 'far|x': [50, -80] }, metros: [{ lat: 40.45, lon: -80, members: ['town|x'] }] });
  const all = ['p|x', 'near|x', 'far|x', 'town|x'];

  it('adds every place within r of any picked city, metro members by their centre', () => {
    expect([...radiusScope(['p|x'], 50, t, all)].sort()).toEqual(['near|x', 'p|x', 'town|x']);
    expect([...radiusScope(['far|x'], 50, t, all)]).toEqual(['far|x']);
    expect([...radiusScope(['p|x', 'far|x'], 50, t, all)].sort()).toEqual(['far|x', 'near|x', 'p|x', 'town|x']);
  });

  it('is just the picked cities with no radius', () => {
    expect([...radiusScope(['p|x'], 0, t, ['p|x', 'near|x'])]).toEqual(['p|x']);
  });

  it('lets a picked city with no position contribute itself only', () => {
    expect([...radiusScope(['ghost|x'], 150, t, ['ghost|x', 'near|x'])]).toEqual(['ghost|x']);
  });

  it('says here, or how far and which way from the nearest picked city', () => {
    expect(rangeFrom('p|x', ['p|x'], t)).toEqual({ kind: 'here' });
    expect(rangeFrom('town|x', ['p|x'], t)).toBeNull();
    expect(rangeFrom('near|x', ['ghost|x'], t)).toBeNull();
    expect(rangeFrom('near|x', [], t)).toBeNull();
    const r = rangeFrom('near|x', ['p|x', 'far|x'], t);
    expect(r).toMatchObject({ kind: 'away', dir: 'N', fromKey: 'p|x' });
    expect((r as { km: number }).km).toBeCloseTo(6.7, 0);
  });
});
