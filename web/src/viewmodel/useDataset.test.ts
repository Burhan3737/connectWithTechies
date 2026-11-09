import { renderHook, waitFor } from '@testing-library/react';
import { EMPTY_PLACES } from '../model/places';
import { DATASET } from '../test/fixtures';
import { useDataset } from './useDataset';

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const NEVER = new Promise<Response>(() => {});

/** Answers each URL its own way. Downloads are shared per URL, so every test uses its own pair. */
function serve(routes: Record<string, () => Promise<Response>>) {
  vi.stubGlobal('fetch', (url: string) => routes[url]());
}

describe('useDataset', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is ready on the events alone while the positions never answer', async () => {
    serve({ '/a/events': async () => json(DATASET), '/a/places': () => NEVER });
    const { result } = renderHook(() => useDataset('/a/events', '/a/places'));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    if (result.current.status !== 'ready') throw new Error('unreachable');
    expect(result.current.indexes.events).toHaveLength(DATASET.events.length);
    expect(result.current.indexes.places).toBe(EMPTY_PLACES);
  });

  it('merges the positions in when they arrive after the events', async () => {
    let answer: (r: Response) => void = () => {};
    const late = new Promise<Response>((resolve) => { answer = resolve; });
    serve({ '/b/events': async () => json(DATASET), '/b/places': () => late });
    const { result } = renderHook(() => useDataset('/b/events', '/b/places'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    answer(json({ cities: { 'toronto|ontario': [43.65, -79.38] } }));
    await waitFor(() => {
      if (result.current.status !== 'ready') throw new Error('not ready');
      expect(result.current.indexes.places.own.get('toronto|ontario')).toEqual([43.65, -79.38]);
    });
  });

  it('uses positions that were already there when the events arrive', async () => {
    let answer: (r: Response) => void = () => {};
    const late = new Promise<Response>((resolve) => { answer = resolve; });
    serve({ '/c/events': () => late, '/c/places': async () => json({ cities: { 'toronto|ontario': [43.65, -79.38] } }) });
    const { result } = renderHook(() => useDataset('/c/events', '/c/places'));
    await new Promise((r) => setTimeout(r, 20));
    answer(json(DATASET));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    if (result.current.status !== 'ready') throw new Error('unreachable');
    expect(result.current.indexes.places.own.size).toBe(1);
  });

  it('is ready with no positions when they fail to load', async () => {
    serve({ '/d/events': async () => json(DATASET), '/d/places': async () => { throw new Error('offline'); } });
    const { result } = renderHook(() => useDataset('/d/events', '/d/places'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    if (result.current.status !== 'ready') throw new Error('unreachable');
    expect(result.current.indexes.places).toBe(EMPTY_PLACES);
  });

  it('reports an error when the events fail, whatever the positions do', async () => {
    serve({ '/e/events': async () => new Response('', { status: 500 }), '/e/places': () => NEVER });
    const { result } = renderHook(() => useDataset('/e/events', '/e/places'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    if (result.current.status !== 'error') throw new Error('unreachable');
    expect(result.current.message).toContain('HTTP 500');
  });
});
