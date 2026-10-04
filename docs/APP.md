# The app

How the site is built, and where to make a change. For where the data comes from, see
[ARCHITECTURE.md](ARCHITECTURE.md); for the sources, [SOURCES.md](SOURCES.md).

## Stack

| | |
|---|---|
| UI | **React 19**, compiled by the **React Compiler 1.0** — components and hooks are memoised automatically, so there is no hand-written `useMemo`/`useCallback` |
| Build | **Vite 8** (Rolldown, Rust) with `@vitejs/plugin-react` |
| Language | **TypeScript 7** (the native compiler), strict |
| Long lists | `react-virtuoso` — only the rows near the screen exist in the page |
| Fonts | self-hosted with `@fontsource` — no third-party requests |
| Tests | **Vitest** + Testing Library for units; **Playwright** for the end-to-end contract |
| Hosting | GitHub Pages, published by `.github/workflows/deploy.yml` after every check passes |

## Map

```
web/
  index.html                 the page shell
  build/eventsData.ts        Vite plugin: serves data/events.json, ships it trimmed
  src/
    main.tsx                 entry: fonts, styles, starts the data download, mounts <App>
    model/                   M — plain TypeScript. No React. Pure functions + types.
    viewmodel/               VM — React hooks: state, derived data, commands.
    view/                    V — components. Read the view-model, render, forward events.
    styles/                  one stylesheet per area, imported in cascade order by index.css
    test/                    test setup and the fixture dataset
tests/e2e/                   the end-to-end contract (Playwright)
```

## The three layers

```
   ┌───────────── View (web/src/view) ─────────────┐
   │  <FilterBar> <Board> <CalendarView> <EventRow> │   renders; calls commands
   └───────────────┬───────────────▲────────────────┘
          commands │               │ state + derived data
   ┌───────────────▼───────────────┴────────────────┐
   │        ViewModel (web/src/viewmodel)           │   useAppViewModel, useCityPicker,
   │  filters (reducer) → applyFilters, buildMonth  │   filtersReducer, useDataset
   └───────────────┬───────────────▲────────────────┘
             calls │               │ plain values
   ┌───────────────▼───────────────┴────────────────┐
   │           Model (web/src/model)                │   filters, events, dates, calendar,
   │   pure functions over TechEvent / Filters      │   addToCalendar, urlState, repository
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
| `urlState.ts` | filters ⇄ query string |
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
| End to end | `npm run test:e2e` | the whole site in a real browser: filters, URLs, calendar, menus on top, phone layout, accessibility basics, performance budgets | ~4 min |

The end-to-end suite is the **contract**: it was written against the previous app before
this one was built, and this one had to pass it to replace it. Its expected numbers are
computed from the dataset the server under test serves, so it never needs updating when the
data changes. Point it at any copy with `E2E_BASE_URL=https://…`.

Timing budgets (first rows < 4 s, a filter change < 1.5 s, typing < 3 s) run last and alone,
because they are meaningless while other browsers compete for the CPU.

## Performance, and why

| | before (vanilla JS) | now |
|---|---|---|
| first rows visible | 11.3 s | ~0.9 s alone, ~2 s in the test harness |
| a filter change | 4.5 s | ~0.2 s |
| rows in the page | all 4,000+ | ~30 (virtualised) |
| data shipped | 3.5 MB | 2.5 MB (583 KB gzipped) — pipeline-only fields dropped |
| third-party requests | Google Fonts | none |

## Deploying

Push to `main`. The workflow type-checks, runs the unit tests and the end-to-end suite
against a fresh build, and only then publishes `dist/`. A pull request runs the same checks
without publishing. Nothing is deployed by hand.
