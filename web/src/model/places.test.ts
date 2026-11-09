import { EMPTY_PLACES, anyPosition, loadPlaces, ownPosition, parsePlaces } from './places';

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
