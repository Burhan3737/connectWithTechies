# The app

How the site is built, and where to make a change. For where the data comes from, see
[ARCHITECTURE.md](ARCHITECTURE.md); for the sources, [SOURCES.md](SOURCES.md).

## Stack

| | |
|---|---|
| UI | **React 19**, compiled by the **React Compiler 1.0** — components and hooks are memoised automatically, so a hand-written `useMemo` or `useCallback` is the exception, kept only where the identity itself matters |
| Build | **Vite 8** (Rolldown, Rust) with `@vitejs/plugin-react` |
| Language | **TypeScript 7** (the native compiler), strict |
| Long lists | `react-virtuoso` — only the rows near the screen exist in the page |
| Fonts | **B612** for text and **Big Shoulders Display** for headings, self-hosted with `@fontsource` — no third-party requests |
| Map | drawn on a `<canvas>` by our own code (`mapEngine.ts`) from `map-data.json`, which ships in the build and loads only when the map is first opened — no map library, no tile server |
| Tests | **Vitest** + Testing Library for units; **Playwright** for the end-to-end contract |
| Hosting | GitHub Pages, published by `.github/workflows/deploy.yml` after every check passes |

## Map

```
web/
  index.html                 the page shell
  build/eventsData.ts        Vite plugin: serves data/events.json, ships it trimmed
  public/map-data-license.txt  where the map's outlines come from, and their licences
  src/
    main.tsx                 entry: fonts, styles, starts the data download, mounts <App>
    model/                   M — plain TypeScript. No React. Pure functions + types.
    viewmodel/               VM — React hooks: state, derived data, commands.
    view/                    V — components. Read the view-model, render, forward events.
    view/map/                the night map: its code and outline data, loaded together on demand
    styles/                  one stylesheet per area, imported in cascade order by index.css
    test/                    test setup and the fixture dataset
data/places.json             where each city is (and the metro centres), read at run time
tests/e2e/                   the end-to-end contract (Playwright)
```

## The three layers

```
   ┌───────────── View (web/src/view) ─────────────┐
   │  <FilterBar> <Board> <CalendarView> <NightMap> │   renders; calls commands
   └───────────────┬───────────────▲────────────────┘
          commands │               │ state + derived data
   ┌───────────────▼───────────────┴────────────────┐
   │        ViewModel (web/src/viewmodel)           │   useAppViewModel, useCityPicker,
   │  filters (reducer) → applyFilters, buildMonth  │   filtersReducer, useDataset,
   │                                                │   usePhone
   └───────────────┬───────────────▲────────────────┘
             calls │               │ plain values
   ┌───────────────▼───────────────┴────────────────┐
   │           Model (web/src/model)                │   filters, events, dates, calendar,
   │   pure functions over TechEvent / Filters      │   addToCalendar, urlState, repository,
   │                                                │   places, geo, mapGeometry, mapCluster
   └────────────────────────────────────────────────┘
```

**The one rule: dependencies point down.** A view may import the view-model and model; the
view-model may import the model; the model imports nothing from either. Everything that
decides *what* is shown lives in the model or view-model and is unit-tested without a browser.

### Model — `web/src/model/`

Plain functions over plain data. Same input, same output, no React, no DOM.

| file | what it owns |
|---|---|
| `types.ts` | `TechEvent`, `Filters` and its defaults, option shapes |
| `repository.ts` | fetching the dataset and indexing it once: city keys, search text, city/region/kind lists, counts |
| `filters.ts` | `applyFilters` — every filter, then the sort |
| `events.ts` | per-event rules: which date a row shows (`keyDate`), what Upcoming/Past mean, group headings |
| `calendar.ts` | which days an event is on, a day's occurrence, the month grid, chip ranking |
| `addToCalendar.ts` | Google / Outlook / Yahoo links and the `.ics` file |
| `urlState.ts` | filters ⇄ query string, including the picked cities and the radius `r` |
| `places.ts` | loading `data/places.json`: city and metro positions. Optional — if it fails to load the table is empty, the Map control is absent and nothing else changes |
| `geo.ts` | great-circle distance, `formatKm`, the ring drawn for a radius |
| `mapGeometry.ts` | Web Mercator on a unit world, the view (centre and zoom), fitting and clamping |
| `mapCluster.ts` | which lights the map draws at a zoom: clustering, the share due in the next 7 days, label layout |
| `dates.ts`, `text.ts` | ISO-day arithmetic and formatting; accent-free matching |

### ViewModel — `web/src/viewmodel/`

Hooks that hold state and turn it into what the screen needs.

- **`filtersReducer.ts`** — every way a choice can change, and the rules that tie choices
  together (a province sets its country; another country clears it; leaving a month closes
  its day). One tested place.
- **`useAppViewModel.ts`** — the board's view-model. Owns the filters (seeded from the URL,
  mirrored back to it), derives the list and its groups, the calendar month and the opened
  day, the dropdown options, and exposes `actions`. Only the search text is deferred
  (`useDeferredValue`), so typing never waits for the list while clicks apply at once; only
  the view on screen is computed.
- **`useCityPicker.ts`** — the city typeahead: suggestions, highlight, what each key does.
- **`useDataset.ts`** — loads and indexes the data; `main.tsx` starts the download before
  React renders.
- **`usePhone.ts`**, **`phoneQuery.ts`** — whether the phone layout applies. The query is
  written once and is identical to the one in the stylesheets.

**The radius.** A picked city can be widened to everything within 50, 150 or 400 km
(`r` in the URL, `Filters.r` in the model). It only means something with a city picked
and a position for it; with no city, or an unknown value, the URL falls back to no radius.
A place known only by its metro counts by the metro's centre and is never given a distance.
With no city and no radius every count is what it was before the map existed.
### View — `web/src/view/`

Components read the view-model with `useApp()` (from `context.ts`) and call its `actions`.
They hold only presentation state — whether a menu is open, where focus is.

| component | |
|---|---|
| `App.tsx` | composition root: loading and error states, then the page |
| `FilterBar.tsx`, `CityPicker.tsx`, `Dropdown.tsx` | the filters; `Dropdown` is the reusable listbox |
| `ResultBar.tsx` | count, List/Calendar, Sort |
| `Board.tsx` | the virtualised list under sticky group headings |
| `EventRow.tsx`, `AddToCalendar.tsx`, `Highlight.tsx` | one event and its calendar menu |
| `CalendarView.tsx` | month grid and the opened day's list |
| `Masthead.tsx`, `Footer.tsx`, `EmptyState.tsx` | the frame |
| `map/MapSlot.tsx` | the map's place in the page: loads its code and data on demand, shows a retry if that fails, owns the radius control |
| `map/NightMap.tsx`, `map/mapEngine.ts` | the map itself: the canvas engine (drag, pinch, zoom, glide, lights, labels) and the component around it |
| `map/FindCity.tsx`, `map/PlaceList.tsx` | find-a-city over the map, and the plain list of places that is the map's keyboard and screen-reader route |
| `map/ViewPill.tsx`, `map/useMapSwitch.ts` | on a phone the map is a full-screen view; the List/Map switch above the dock, and what it covers while open |

Class names and ids are stable: the styles and the end-to-end suite rely on them.

## Adding something — a worked example

Say you want a **"Free only"** toggle.

1. **Model.** Add `free: boolean` to `Filters` and `DEFAULT_FILTERS` (`types.ts`); add
   `(!f.free || e.cost === 'free')` to `applyFilters` (`filters.ts`); read and write it in
   `urlState.ts`. Add cases to `filters.test.ts` and `urlState.test.ts`.
2. **ViewModel.** Add `{ type: 'free'; free: boolean }` to `FiltersAction` and its case to
   `filtersReducer`; expose `setFree` in `useAppViewModel`'s `actions`. Test it in
   `filtersReducer.test.ts`.
3. **View.** Render the toggle in `FilterBar.tsx`, reading `filters.free` and calling
   `actions.setFree`. Style it in `styles/controls.css`.
4. **Contract.** Add a test to `tests/e2e/filters.spec.ts` that the toggle narrows the count
   and survives a reload.

Each step is testable on its own, and nothing outside those files needs to know.

## Tests

| | command | what it proves | speed |
|---|---|---|---|
| Unit | `npm test` | model rules, view-model behaviour, component interaction, feed parsers | seconds |
| Data | `npm run check:places` | every city in the events has a position on the map; fails when more than 3% of events have none | seconds |
| End to end | `npm run test:e2e` | the whole site in a real browser: filters, URLs, calendar, the map, menus on top, phone layout, accessibility basics, performance budgets | ~4 min |

The end-to-end suite is the **contract**: it was written against the previous app before
this one was built, and this one had to pass it to replace it. Its expected numbers are
computed from the dataset the server under test serves, so it never needs updating when the
data changes. Point it at any copy with `E2E_BASE_URL=https://…`.

Timing budgets (first rows < 4 s, a filter change < 1.5 s, typing < 3 s) run last and alone,
because they are meaningless while other browsers compete for the CPU.

`responsive.spec.ts` sweeps phone widths from 280 to 768 px and four landscape sizes across
the list, the filter sheet, the map and the calendar: no sideways scroll (measured against the
configured width, because a phone widens `innerWidth` to hide overflow), every control at least
44 px on its smaller side (calendar days excepted), and no event name narrower than 80 px.
The first page load on a phone must not fetch the map data; that is asserted in `quality.spec.ts`.

## Performance, and why

| | before (vanilla JS) | now |
|---|---|---|
| first rows visible | 11.3 s | ~0.9 s alone, ~2 s in the test harness |
| a filter change | 4.5 s | ~0.2 s |
| rows in the page | all 4,000+ | ~30 (virtualised) |
| data shipped | 3.5 MB | 7.85 MB (1.71 MB gzipped) — pipeline-only fields dropped, and the dataset has grown since |
| third-party requests | Google Fonts | none |

## Map data and its licence

The map fetches nothing at run time. `web/src/view/map/map-data.json` is generated
(Web Mercator, simplified) from Natural Earth (public domain), `world-atlas` and `us-atlas`
(ISC licence; the US state lines are US Census Bureau data, public domain), and ships in the
build. The full credits and licence texts are in `web/public/map-data-license.txt`, which is
deployed beside the site and linked from the map's attribution line. The city positions in
`data/places.json` are general-knowledge coordinates, not taken from those files. After a data
refresh, `npm run check:places` names any city the map has no position for.

## Deploying

Push to `main`. The workflow type-checks, runs the unit tests and the end-to-end suite
against a fresh build, and only then publishes `dist/`. A pull request runs the same checks
without publishing. Nothing is deployed by hand.
