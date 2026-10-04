import { useEffect, useState } from 'react';
import { buildIndexes, loadDataset, type Indexes } from '../model/repository';
import type { Dataset } from '../model/types';

export type DatasetState =
  | { status: 'loading' }
  | { status: 'ready'; indexes: Indexes }
  | { status: 'error'; message: string };

/** The dataset served beside the app. */
export const DATA_URL = `${import.meta.env.BASE_URL}data/events.json`;

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

export function useDataset(url: string = DATA_URL): DatasetState {
  const [state, setState] = useState<DatasetState>({ status: 'loading' });
  useEffect(() => {
    let live = true;
    prefetchDataset(url)
      .then((data) => { if (live) setState({ status: 'ready', indexes: buildIndexes(data) }); })
      .catch((err: Error) => { if (live) setState({ status: 'error', message: `Could not load the events (${err.message}). Reload to try again.` }); });
    return () => { live = false; };
  }, [url]);
  return state;
}
