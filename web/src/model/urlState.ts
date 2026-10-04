import { fold } from './text';
import { DEFAULT_FILTERS, type Filters } from './types';

/**
 * Filters <-> query string. Every view can be bookmarked or shared, and the
 * defaults leave the URL clean. Unknown or malformed values fall back to the
 * defaults rather than producing an impossible state.
 */
export function parseFilters(search: string): Filters {
  const p = new URLSearchParams(search);
  const f: Filters = { ...DEFAULT_FILTERS, cities: [] };
  const pick = <T extends string>(v: string | null, ok: readonly T[]) => (v && (ok as readonly string[]).includes(v) ? v as T : null);

  f.q = p.get('q') || '';
  f.when = pick(p.get('when'), ['upcoming', 'past', 'all'] as const) || 'upcoming';
  f.type = p.get('type') || '';
  f.country = p.get('country') || '';
  f.region = p.get('region') || '';
  f.sort = pick(p.get('sort'), ['date', 'city', 'name'] as const) || 'date';
  f.view = p.get('view') === 'calendar' ? 'calendar' : 'list';
  if (/^\d{4}-\d{2}$/.test(p.get('month') || '')) f.month = p.get('month')!;
  if (/^\d{4}-\d{2}-\d{2}$/.test(p.get('day') || '')) f.day = p.get('day')!;
  if (p.get('cities')) f.cities = p.get('cities')!.split(',').map(fold).filter(Boolean);
  return f;
}

export function serializeFilters(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.cities.length) p.set('cities', f.cities.join(','));
  if (f.when !== 'upcoming') p.set('when', f.when);
  if (f.type) p.set('type', f.type);
  if (f.country) p.set('country', f.country);
  if (f.region) p.set('region', f.region);
  if (f.sort !== 'date') p.set('sort', f.sort);
  if (f.view === 'calendar') {
    p.set('view', 'calendar');
    if (f.month) p.set('month', f.month);
    if (f.day) p.set('day', f.day);
  }
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}
