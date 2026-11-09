import { useSyncExternalStore } from 'react';
import { PHONE_QUERY } from './phoneQuery';

const phoneQuery = () => (typeof window.matchMedia === 'function' ? window.matchMedia(PHONE_QUERY) : null);

function subscribe(onChange: () => void) {
  const query = phoneQuery();
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

/** Whether the phone layout is showing: true on phones, upright or sideways. */
export function usePhone(): boolean {
  return useSyncExternalStore(subscribe, () => phoneQuery()?.matches ?? false);
}
