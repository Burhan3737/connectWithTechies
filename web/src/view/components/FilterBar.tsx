import { useApp } from '../context';
import { Dropdown, FieldLabel } from './Dropdown';
import { CityPicker } from './CityPicker';
import type { When } from '../../model/types';

const WHENS: { value: When; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }, { value: 'all', label: 'All' },
];

/** Search, cities, When, Kind, Country and Province/state — and the chosen-city chips beneath. */
export function FilterBar() {
  const { filters, options, actions } = useApp();
  return (
    <nav className="controls" id="controls" aria-label="Filters">
      <div className="controls__inner">
        <div className="field field--search">
          <label className="field__label" htmlFor="q">Search</label>
          <div className="field__box">
            <span className="field__icon" aria-hidden="true">⌕</span>
            <input id="q" type="search" placeholder="Event, topic or venue" autoComplete="off" spellCheck={false}
              value={filters.q} onChange={(e) => actions.setQuery(e.target.value)} />
          </div>
        </div>

        <CityPicker />

        <div className="field field--when">
          <span className="field__label" id="whenLabel">When</span>
          <div className="segmented" role="radiogroup" aria-labelledby="whenLabel">
            {WHENS.map((w) => (
              <button key={w.value} type="button" role="radio" data-when={w.value}
                aria-checked={filters.when === w.value} className={filters.when === w.value ? 'is-on' : undefined}
                onClick={() => actions.setWhen(w.value)}>{w.label}</button>
            ))}
          </div>
        </div>

        <div className="field field--type">
          <FieldLabel id="type">Kind</FieldLabel>
          <Dropdown id="type" label="Kind" value={filters.type} onChange={actions.setKind}
            groups={[{ options: [{ value: '', label: 'All kinds' }, ...options.kinds] }]} />
        </div>

        <div className="field field--country">
          <FieldLabel id="country">Country</FieldLabel>
          <Dropdown id="country" label="Country" value={filters.country} onChange={actions.setCountry}
            groups={[{ options: [{ value: '', label: 'Both countries' }, ...options.countries] }]} />
        </div>

        <div className="field field--region">
          <FieldLabel id="region">Province / state</FieldLabel>
          <Dropdown id="region" label="Province / state" value={filters.region} onChange={actions.setRegion}
            groups={[{ options: [{ value: '', label: 'All provinces & states' }] },
              ...options.regionGroups.map((g) => ({
                label: g.country,
                options: g.regions.map((r) => ({ value: r.name, label: r.name, count: r.count })),
              }))]} />
        </div>
      </div>
      <Chips />
    </nav>
  );
}

function Chips() {
  const { filters, options, actions } = useApp();
  if (!filters.cities.length) return null;
  return (
    <div className="chips" id="chips" aria-live="polite">
      {filters.cities.map((key) => {
        const c = options.cities.find((x) => x.key === key);
        const label = c ? `${c.city}, ${c.region}` : key.split('|')[0];
        return (
          <span key={key} className="chip">
            {label}
            <button type="button" data-remove={key} aria-label={`Remove ${label}`} onClick={() => actions.removeCity(key)}>×</button>
          </span>
        );
      })}
    </div>
  );
}
