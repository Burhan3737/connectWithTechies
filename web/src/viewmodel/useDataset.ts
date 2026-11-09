import { useEffect, useState } from 'react';
import { loadPlaces, type PlaceTable } from '../model/places';
import { buildIndexes, loadDataset, type Indexes } from '../model/repository';
import type { Dataset } from '../model/types';

export type DatasetState =
  | { status: 'loading' }
  | { status: 'ready'; indexes: Indexes }
  | { status: 'error'; message: string };

/** The dataset served beside the app. */
export const DATA_URL = `${import.meta.env.BASE_URL}data/events.json`;
/** City positions, served beside the events. Optional: without them there is no map. */
export const PLACES_URL = `${import.meta.env.BASE_URL}data/places.json`;

/**
 * Downloads are started once per URL and shared. main.tsx calls this before
 * React renders, so the data downloads alongside the app instead of after it.
 */
const pending = new Map<string, Promise<Dataset>>();
export function prefetchDataset(url: string = DATA_URL): Promise<Dataset> {
  let p = pending.get(url);
  if (!p) {
    p = loadDataset(url);
    p.catch(() => pending.delete(url));   // a failure may be retried by a later visit
    pending.set(url, p);
  }
  return p;
}

const pendingPlaces = new Map<string, Promise<PlaceTable>>();
export function prefetchPlaces(url: string = PLACES_URL): Promise<PlaceTable> {
  let p = pendingPlaces.get(url);
  if (!p) {
    p = loadPlaces(url);      // never rejects, so no retry bookkeeping
    pendingPlaces.set(url, p);
  }
  return p;
}

export function useDataset(url: string = DATA_URL, placesUrl: string = PLACES_URL): DatasetState {
  const [state, setState] = useState<DatasetState>({ status: 'loading' });
  useEffect(() => {
    let live = true;
    // Both downloads run side by side; positions failing soft never reach the error state.
    Promise.all([prefetchDataset(url), prefetchPlaces(placesUrl)])
      .then(([data, places]) => { if (live) setState({ status: 'ready', indexes: buildIndexes(data, undefined, places) }); })
      .catch((err: Error) => { if (live) setState({ status: 'error', message: `Could not load the events (${err.message}). Reload to try again.` }); });
    return () => { live = false; };
  }, [url, placesUrl]);
  return state;
}
