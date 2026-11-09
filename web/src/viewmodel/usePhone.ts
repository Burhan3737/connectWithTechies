import { useSyncExternalStore } from 'react';

/** The phone layout condition, identical to the one in the stylesheets. */
export const PHONE_QUERY =
  '(max-width: 720px), (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-height: 460px) and (orientation: landscape)';

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
