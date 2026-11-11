# Night Map Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship design J "Night Pass" in the real React app: a dark night-side reskin, a thumb-first phone layout, and a draggable night map of North America where tapping cities adds them to the search, released once at the end.

**Architecture:** J is a spec, not code to copy. The app's model and view-model stay and grow by one filter (`r`, a radius). All map maths are pure tested functions in `web/src/model/`; one imperative canvas engine, loaded on demand, draws them. Styling happens in the existing per-area stylesheets, keeping the class names and ids the end-to-end suite relies on.

**Tech Stack:** React 19 + React Compiler, TypeScript 7, Vite 8, react-virtuoso, Vitest, Playwright, `@fontsource`.

**Spec:** `design-lab/j/CONCEPT.md` (idea and behaviour), `design-lab/j/` (the running prototype: open `index.html`), `design-lab/briefs/batch4/00-contract.md` (app behaviour that must hold). These are local only: `design-lab/` is excluded from git. Read them on this machine; never add them to a commit. The prototype's constants and copy are the visual source of truth. Where the prototype's numbers differ from these tests, the prototype used a frozen 9,431-event snapshot; the live data is larger, and tests compute expectations from the served dataset.

## Global Constraints

- Work on branch `feat/night-map`, one release: nothing merges to `main` until Task 12 passes, because a push to `main` publishes the site.
- Commits use the configured git identity. No `Co-Authored-By`, no tool attribution. Never use `--no-verify`. Do not push or merge unless the user asks.
- Never commit anything from `design-lab/` or `.agentTempWork/`.
- Dependencies point down: view → view-model → model. Model files import no React.
- Keep existing ids and classes the e2e suite uses: `#q`, `#cityq`, `#type-dd`, `#country-dd`, `#region-dd`, `#sort-dd`, `#count`, `#board`, `#chips`, `.tally dd` (5 of them), `.groupbar`, `.ev`, `.ev__name`, `.ev__d1`, `.ev__d2`, `.ev__city`, `.ev__geo`, `.ev__tag--kind`, `.segmented`, `.controls`.
- Search is unchanged: accent-free substring over `IndexedEvent.hay`, including the raw description.
- With no city picked and no radius, every count equals today's app.
- No third-party requests at runtime. Fonts via `@fontsource`; map data ships in the build.
- Phone layout condition, used in CSS and JS identically: `(max-width: 720px), (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-height: 460px) and (orientation: landscape)`.
- Touch targets ≥ 44 px, phone body text ≥ 15 px, contrast ≥ 4.5:1, no sideways scroll from 280 px up, `prefers-reduced-motion` respected.
- Idle page does no work: no `requestAnimationFrame` loop unless something is moving.
- Banned look: starfield, neon, glassmorphism, radar rings, thin-bordered dark admin panels, letterspaced uppercase mono labels.

## Review Focus

1. `data/places.json` fails to load: the list, filters and calendar still work; the Map control is absent, not broken. (Task 6)
2. A shared URL with an unknown city, `r=banana`, `r=75`, or `r=150` with no city: falls back to no radius, never an empty or crashed page. (Task 7)
3. A picked city with no map position, alone or with a radius: its events stay listed, its row shows no distance, no `NaN km` anywhere. (Tasks 7 and 10)
4. Rotating a phone or widening the window while the map is open: the map closes cleanly and the page is not left inert or unscrollable. (Task 11)
5. The map's code or data chunk fails on a poor connection: a plain retry message on the map, and the list is still reachable. (Task 9)

---

### Task 1: Night theme foundation and masthead

**Files:**
- Modify: `web/src/main.tsx`, `web/index.html`, `web/src/styles/base.css`, `web/src/styles/masthead.css`, `web/src/styles/footer.css`, `web/src/view/components/Masthead.tsx`, `web/src/view/App.tsx`, `package.json`
- Test: `tests/e2e/board.spec.ts`

**Interfaces:**
- Produces: CSS custom properties on `:root`, copied exactly from the `:root` block of `design-lab/j/style.css` (`--space`, `--g0..2`, `--ground`, `--raised*`, `--ink`, `--sec`, `--ter`, `--limb`, `--ray`, `--ray-ink`, `--airglow`, `--sun`, `--sun-ink`, `--led`, `--b0..4`, `--bn`, `--bpast`, `--focus`, `--display`, `--font`, `--pad`). Later tasks use these names.

- [ ] **Step 1: Create the branch**

Run: `git switch -c feat/night-map`
Expected: `Switched to a new branch 'feat/night-map'`

- [ ] **Step 2: Write the failing test** in `board.spec.ts`

```ts
test('the masthead speaks as a night map and uses the new type', async ({ page }) => {
  await openBoard(page);
  await expect(page.locator('.masthead__sub')).toContainText('A night map of the tech events');
  await expect(page.locator('body')).not.toContainText('departures board');
  const font = await page.locator('.ev__name').first().evaluate((e) => getComputedStyle(e).fontFamily);
  expect(font).toContain('B612');
  await expect(page.locator('.tally dd')).toHaveCount(5);
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx playwright test tests/e2e/board.spec.ts --project=desktop -g "night map"`
Expected: FAIL on the masthead text.

- [ ] **Step 4: Swap the fonts and restyle**

`npm i @fontsource/b612 @fontsource/big-shoulders-display` and `npm rm @fontsource/archivo @fontsource/ibm-plex-mono @fontsource/instrument-serif`. Import in `main.tsx`: b612 `400`, `400-italic`, `700`; big-shoulders-display `400`, `500`, `600`, `700`. Remove `.grain` from `App.tsx`. Masthead copy: `A night map of the tech events of the <em>United States</em> and <em>Canada</em> — hackathons, conferences, tech weeks, CTFs, meetups and demo nights. Pick your city.` Render the tally as one quiet line while keeping the `dl.tally` with 5 `dd`. Keep the credit, breaking onto two lines at ≤ 380 px (`flex-wrap: wrap`). Update `index.html`: `theme-color` `#04060c`, viewport `width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content`, and a meta description without "departures board".

- [ ] **Step 5: Verify**

Run: `npm run typecheck; npx playwright test --project=desktop`
Expected: type check clean, the new test and all desktop tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json web tests/e2e/board.spec.ts
git commit -m "Set the night theme: type, colour tokens and the masthead"
```

### Task 2: Rows, filter bar, menus and the On-now group

**Files:**
- Modify: `web/src/model/text.ts`, `web/src/model/events.ts`, `web/src/model/repository.ts`, `web/src/view/components/EventRow.tsx`, `web/src/styles/board.css`, `web/src/styles/controls.css`, `web/src/styles/dropdown.css`, `web/src/styles/addcal.css`
- Test: `web/src/model/text.test.ts`, `web/src/model/events.test.ts`, `tests/e2e/board.spec.ts`

**Interfaces:**
- Produces: `cleanDescription(desc: string | undefined): string` in `text.ts`. `groupLabel` returns `'On now'` for running events under Upcoming + Date.

- [ ] **Step 1: Write the failing unit tests**

```ts
expect(cleanDescription('Listed on Luma by Acme')).toBe('');
expect(cleanDescription('Listed on Meetup by A Group')).toBe('');
expect(cleanDescription('A **bold** claim\\*\\*')).toBe('A bold claim');
expect(cleanDescription(undefined)).toBe('');
// a real description survives
expect(cleanDescription('Hands-on Git workshop.')).toBe('Hands-on Git workshop.');

const running = { ...ev, next_date: '2026-08-27', next_date_end: '2026-11-19' };
expect(groupLabel(running, 'date', 'upcoming', '2026-10-23')).toBe('On now');
expect(groupLabel(running, 'date', 'all', '2026-10-23')).toBe('August 2026');
expect(groupLabel(running, 'city', 'upcoming', '2026-10-23')).toBe(`${running.city}, ${running.region}`);
```

Add to `repository` kind labels: `expect(kindLabel('ctf')).toBe('CTF')`, and export `kindLabel(value: string): string` from `repository.ts`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run web/src/model/text.test.ts web/src/model/events.test.ts`
Expected: FAIL, `cleanDescription` is not a function.

- [ ] **Step 3: Implement**

`cleanDescription` treats `/^Listed on (Luma|Eventbrite|Meetup) by (.+)$/` as empty and strips escaped and plain markdown emphasis. Apply it in `EventRow` only; `haystackOf` keeps the raw text. Running = `runsUntil(e, when, today)` returns a date and the key date is before today. Restyle per `design-lab/j/style.css`: rows have no heavy borders, the date numeral in `--display` coloured by band, the name in B612 700, a demoted `+ Calendar` (shown on hover/focus with `(hover: hover)`, always on touch), filter fields underlined rather than boxed. Keep all listed classes.

- [ ] **Step 4: Update the date-order e2e**

In `board.spec.ts` `upcoming rows run in date order under month headings`, skip a leading `On now` heading when collecting month headings, and assert that if `On now` exists it is the first `.groupbar`.

- [ ] **Step 5: Verify**

Run: `npm test; npx playwright test --project=desktop`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web tests/e2e/board.spec.ts
git commit -m "Restyle rows and controls, clean descriptions, group running events as On now"
```

### Task 3: Night calendar

**Files:**
- Modify: `web/src/view/components/CalendarView.tsx`, `web/src/styles/calendar.css`, `web/src/view/components/ResultBar.tsx`
- Test: `tests/e2e/calendar.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
test('each day shows a light sized by its count', async ({ page }) => {
  await openBoard(page, 'view=calendar');
  const g = await page.locator('.cal__day.has-ev').first().evaluate((e) => getComputedStyle(e).getPropertyValue('--g'));
  expect(Number(g)).toBeGreaterThan(0);
});
test('an empty opened day offers the next day with events', async ({ page }) => {
  await openBoard(page, 'view=calendar&type=hackathon&cities=nowhere%7Cnone');
  await expect(page.locator('.cal__next')).toHaveCount(0); // no events at all: no offer
});
```

Add a case using a filter that leaves today empty but later days filled (choose kind `hackathon` in a city computed from `dataset()`), asserting `.cal__next` selects that day when tapped.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test tests/e2e/calendar.spec.ts --project=desktop`
Expected: FAIL on `--g`.

- [ ] **Step 3: Implement**

Set `--g` on each day to `min(1, sqrt(count / maxCountInMonth))`. The dot is a CSS radial gradient as in the prototype's `.cal__day.has-ev .cal__count::before`. No gradient-filled cells. Add `.cal__next` ("Next day with events…"), a one-line note `Each day counts every event running that day.`, and label other-month days with their month. Phones (the Global layout condition) show number + light only; desktop keeps up to 3 names and `+N more`. The sticky bar must not clip `.cal__head`.

- [ ] **Step 4: Verify**

Run: `npx playwright test tests/e2e/calendar.spec.ts`
Expected: PASS on desktop and mobile.

- [ ] **Step 5: Commit**

```bash
git add web tests/e2e/calendar.spec.ts
git commit -m "Give the calendar city-light days and a next-day offer"
```

### Task 4: Phone shell

**Files:**
- Create: `web/src/view/components/PhoneDock.tsx`, `web/src/viewmodel/usePhone.ts`
- Modify: `web/src/view/components/FilterBar.tsx`, `web/src/view/components/Dropdown.tsx`, `web/src/view/components/CityPicker.tsx`, `web/src/view/components/ResultBar.tsx`, `web/src/styles/controls.css`, `web/src/styles/dropdown.css`, `web/src/styles/responsive.css`
- Test: `tests/e2e/quality.spec.ts`

**Interfaces:**
- Produces: `usePhone(): boolean` (subscribes to the Global layout condition). `#deckBtn` opens the filter sheet; `#deckDone` reads `Done · {n} events`. CSS variable `--dockH` set on `:root` to the dock's height.

- [ ] **Step 1: Replace the two tests that assert the old phone layout**

Delete `filters stack into full-width controls of one height @mobile` and `the stacked filter bar scrolls away instead of covering the screen @mobile` from `quality.spec.ts`, and add:

```ts
test('the dock stays in thumb reach while scrolling @mobile', async ({ page }) => {
  await openBoard(page);
  await page.mouse.wheel(0, 3000);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1500);
  const r = await page.locator('.controls').evaluate((e) => e.getBoundingClientRect().bottom);
  expect(r).toBeCloseTo(page.viewportSize()!.height, -1);
});
test('filters open in a sheet and Done shows the live count @mobile', async ({ page, request }) => {
  await openBoard(page);
  await page.tap('#deckBtn');
  await page.tap('#type-dd');
  await page.tap('.dd__panel li[data-label="Hackathon"]');
  await expect(page.locator('#deckDone')).toHaveText(new RegExp(`Done · ${await shownCount(page)} events`));
});
test('open option lists are tall enough to use @mobile', async ({ page }) => {
  await openBoard(page);
  await page.tap('#deckBtn');
  await page.tap('#type-dd');
  const h = await page.locator('.dd__list').evaluate((e) => e.getBoundingClientRect().height);
  expect(h).toBeGreaterThan(200);
  const s = await page.locator('.dd__search').evaluate((e) => e.getBoundingClientRect().height);
  expect(s).toBeLessThanOrEqual(56);
});
test('touch controls are at least 44 px @mobile', async ({ page }) => {
  await openBoard(page);
  const small = await page.locator('.controls button, .controls input, .resultbar button').evaluateAll((els) =>
    els.filter((e) => e.getClientRects().length && Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height) < 44).length);
  expect(small).toBe(0);
});
```

Check `filter controls share one height` and `the filter bar stays on screen while scrolling` still describe desktop.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test tests/e2e/quality.spec.ts --project=mobile`
Expected: FAIL, `#deckBtn` not found.

- [ ] **Step 3: Implement**

Each control exists once in the DOM and is moved by CSS; never clone one (ids stay unique). On phones `.controls` is a fixed bottom dock of search + a 64 px filter button with a count badge. The rest sit in a sheet with half and full heights, `env(safe-area-inset-*)`, and the sticky `Done` button. Dropdowns on phones are full-height sheets; don't autofocus their filter box on touch. The city list sits at the top of a full-height sheet and sizes from `visualViewport`, so the keyboard never covers it. Hide `Press / to search` on touch. Port the sweep's fixes from the end of `design-lab/j/style.css`, including landscape rows (`grid-template-columns: 118px minmax(0, 1fr)`, place under the title in `grid-row: 2`), `.ev__desc { flex: 1 1 120px }` and `(pointer: coarse)` 44 px minimums.

- [ ] **Step 4: Verify**

Run: `npx playwright test --project=mobile --project=desktop`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web tests/e2e/quality.spec.ts
git commit -m "Move phone controls to a thumb dock with filter sheets"
```

### Task 5: Time bands, desktop date rail and phone jumps

**Files:**
- Create: `web/src/model/bands.ts`, `web/src/model/bands.test.ts`, `web/src/view/components/DateRail.tsx`, `web/src/view/components/JumpChips.tsx`
- Modify: `web/src/view/components/Board.tsx`, `web/src/view/components/EventRow.tsx`, `web/src/view/components/ResultBar.tsx`, `web/src/viewmodel/useAppViewModel.ts`, `web/src/styles/board.css`
- Test: `tests/e2e/board.spec.ts`

**Interfaces:**
- Produces: `type Band = 'now' | 'thisWeek' | 'nextWeek' | 'weeks2to5' | 'weeks6plus' | 'noDate'`, `bandOf(e: IndexedEvent, when: When, today: string): Band`, `bandMarks(events: IndexedEvent[], when: When, today: string): { band: Band; index: number; count: number; label: string }[]`. `AppViewModel.board.marks`. Weeks run Monday to Sunday.

- [ ] **Step 1: Write the failing test**

```ts
const today = '2026-10-23'; // a Friday
expect(bandOf(on('2026-10-25'), 'upcoming', today)).toBe('thisWeek');
expect(bandOf(on('2026-10-26'), 'upcoming', today)).toBe('nextWeek');
expect(bandOf(on('2026-11-01'), 'upcoming', today)).toBe('nextWeek');
expect(bandOf(on('2026-11-02'), 'upcoming', today)).toBe('weeks2to5');
expect(bandOf(on('2026-11-30'), 'upcoming', today)).toBe('weeks6plus');
expect(bandOf(undated, 'upcoming', today)).toBe('noDate');
expect(bandOf(running, 'upcoming', today)).toBe('now');
expect(bandMarks([], 'upcoming', today)).toEqual([]);
```

Add e2e `Next week jumps without filtering`: at `?cities=seattle%7Cwashington`, read `#count`, click `.rail [data-band=nextWeek]`, assert `#count` is unchanged and a `.seam` containing `Next week` is in the viewport.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run web/src/model/bands.test.ts`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement**

Marks only exist for Upcoming + Date. Render a `.seam` above the first row of each band inside `itemContent`, not as a Virtuoso group, so heading tests hold. Jumps call `GroupedVirtuoso`'s `scrollToIndex` via a ref. Row edges and date numerals take the band's colour (`--bn`, `--b0..4`). Desktop rail hides below 2 screens of rows. **It must not read layout on scroll frames**: compute positions from `rangeChanged` and cached marks. The phone uses `JumpChips` (no rail): short labels `now · this wk · next wk · 2–5 wk · 6+ wk · no date`, in a scroller that doesn't sit under Sort.

- [ ] **Step 4: Verify**

Run: `npm test; npx playwright test --project=desktop --project=mobile`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web tests/e2e/board.spec.ts
git commit -m "Mark time bands in the list and add date jumps"
```

### Task 6: City positions as data

**Files:**
- Create: `data/places.json`, `agent/tools/check-places.mjs`, `web/src/model/places.ts`, `web/src/model/places.test.ts`
- Modify: `web/build/eventsData.ts`, `web/src/viewmodel/useDataset.ts`, `web/src/model/repository.ts`, `package.json`, `docs/ARCHITECTURE.md`
- Test: `web/src/model/repository.test.ts`, `tests/e2e/map.spec.ts` (new)

**Interfaces:**
- Produces:

```ts
export type LatLon = readonly [lat: number, lon: number];
export interface PlaceTable { own: ReadonlyMap<string, LatLon>; metro: ReadonlyMap<string, LatLon> }
export const EMPTY_PLACES: PlaceTable;
export function parsePlaces(raw: unknown): PlaceTable;           // malformed input gives EMPTY_PLACES
export function ownPosition(t: PlaceTable, key: string): LatLon | undefined;
export function anyPosition(t: PlaceTable, key: string): LatLon | undefined; // own, else metro centre
export async function loadPlaces(url: string, fetchImpl?: typeof fetch): Promise<PlaceTable>; // never rejects
```

`Indexes.places: PlaceTable`; `buildIndexes(data, today, places = EMPTY_PLACES)`. File shape: `{ "cities": { "toronto|ontario": [43.65, -79.38] }, "metros": [{ "lat": 0, "lon": 0, "members": ["city|region"] }] }`, keys equal to `cityKeyOf`.

- [ ] **Step 1: Write the failing tests**

```ts
const t = parsePlaces({ cities: { 'a|b': [1, 2] }, metros: [{ lat: 5, lon: 6, members: ['c|d', 'a|b'] }] });
expect(ownPosition(t, 'a|b')).toEqual([1, 2]);
expect(ownPosition(t, 'c|d')).toBeUndefined();
expect(anyPosition(t, 'c|d')).toEqual([5, 6]);
expect(parsePlaces('nonsense')).toBe(EMPTY_PLACES);
expect(parsePlaces({ cities: { 'a|b': ['x', 2] } }).own.size).toBe(0);
await expect(loadPlaces('u', async () => new Response('', { status: 500 }))).resolves.toBe(EMPTY_PLACES);
await expect(loadPlaces('u', async () => { throw new Error('offline'); })).resolves.toBe(EMPTY_PLACES);
```

E2E for Review Focus 1: route `**/data/places.json` to abort, open the board, assert the row count matches the dataset and `.viewpill` and `#map` are absent (the assertion on absence becomes meaningful from Tasks 9 and 11; keep the list assertion green now).

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run web/src/model/places.test.ts`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Create `data/places.json` from `design-lab/shared/places.js`**

With a one-off script in `.agentTempWork/`, load `window.PLACES`, fold keys with the same `fold` as `web/src/model/text.ts`, drop entries whose third element is `'approx'`, write the shape above with sorted keys.

- [ ] **Step 4: Implement the tool, the serving and the loading**

`check-places.mjs` (`npm run check:places`) prints events and cities with no position, sorted by events. It exits 1 if more than 3% of events have none, and ignores `multiple cities` and `US & Canada` non-places. Add positions for every real place it lists with ≥ 2 events; list typos (for example `Maimi`) for the user instead of mapping them. Add it to the `refresh` script. Extend `eventsData` to serve and emit `data/places.json`, fetched in parallel with the events by `useDataset`, with `loadPlaces` failing soft.

- [ ] **Step 5: Verify**

Run: `npm test; npm run check:places; npx playwright test tests/e2e/map.spec.ts --project=desktop`
Expected: PASS; `check:places` reports no real place with ≥ 2 events missing.

- [ ] **Step 6: Commit**

```bash
git add data/places.json agent/tools/check-places.mjs web package.json package-lock.json docs/ARCHITECTURE.md tests/e2e/map.spec.ts
git commit -m "Add city positions as checked data the app can load"
```

### Task 7: Radius filter

**Files:**
- Create: `web/src/model/geo.ts`, `web/src/model/geo.test.ts`
- Modify: `web/src/model/types.ts`, `web/src/model/places.ts`, `web/src/model/filters.ts`, `web/src/model/urlState.ts`, `web/src/viewmodel/filtersReducer.ts`, `web/src/viewmodel/useAppViewModel.ts`
- Test: `web/src/model/places.test.ts`, `web/src/model/filters.test.ts`, `web/src/model/urlState.test.ts`, `web/src/viewmodel/filtersReducer.test.ts`

**Interfaces:**
- Consumes: `PlaceTable`, `anyPosition`, `ownPosition`, `Indexes.places`.
- Produces:

```ts
// types.ts
export type Radius = 0 | 50 | 150 | 400;           // Filters.r, default 0
// geo.ts
export function haversineKm(a: LatLon, b: LatLon): number;
export function bearingDeg(a: LatLon, b: LatLon): number;
export function compass8(deg: number): 'N'|'NE'|'E'|'SE'|'S'|'SW'|'W'|'NW';
export function formatKm(km: number): string;      // "305 km", "1,030 km"
export function circle(center: LatLon, km: number, steps?: number): LatLon[];
// places.ts
export function radiusScope(picked: readonly string[], r: Radius, t: PlaceTable, allKeys: Iterable<string>): Set<string>;
export type Range = { kind: 'here' } | { kind: 'away'; km: number; dir: string; fromKey: string };
export function rangeFrom(cityKey: string, picked: readonly string[], t: PlaceTable): Range | null;
// filters.ts
applyFilters(events, f, today, whenOverride?, scope?: ReadonlySet<string>)
// view-model
actions.setRadius(r: Radius): void;  AppViewModel.scope: { keys: ReadonlySet<string> | null; added: number }
```

- [ ] **Step 1: Write the failing tests**

```ts
expect(haversineKm([40.4406, -79.9959], [43.6532, -79.3832])).toBeCloseTo(361, -1);
expect(compass8(bearingDeg([40.44, -80], [43.65, -79.38]))).toBe('N');
expect(formatKm(1030.4)).toBe('1,030 km');
const t = parsePlaces({ cities: { 'p|x': [40.44, -80], 'near|x': [40.5, -80], 'far|x': [50, -80] }, metros: [{ lat: 40.45, lon: -80, members: ['town|x'] }] });
expect([...radiusScope(['p|x'], 50, t, ['p|x', 'near|x', 'far|x', 'town|x'])].sort()).toEqual(['near|x', 'p|x', 'town|x']);
expect([...radiusScope(['p|x'], 0, t, ['p|x', 'near|x'])]).toEqual(['p|x']);
// a picked city with no position contributes itself only (Review Focus 3)
expect([...radiusScope(['ghost|x'], 150, t, ['ghost|x', 'near|x'])]).toEqual(['ghost|x']);
expect(rangeFrom('p|x', ['p|x'], t)).toEqual({ kind: 'here' });
expect(rangeFrom('town|x', ['p|x'], t)).toBeNull();                 // metro-only: never a km
expect(rangeFrom('near|x', ['ghost|x'], t)).toBeNull();
// URLs (Review Focus 2)
expect(parseFilters('?r=150').r).toBe(0);
expect(parseFilters('?cities=p%7Cx&r=banana').r).toBe(0);
expect(parseFilters('?cities=p%7Cx&r=75').r).toBe(0);
expect(parseFilters('?cities=p%7Cx&r=150').r).toBe(150);
expect(serializeFilters({ ...DEFAULT_FILTERS, cities: ['p|x'], r: 150 })).toContain('r=150');
expect(serializeFilters({ ...DEFAULT_FILTERS, cities: ['p|x'] })).not.toContain('r=');
// reducer
expect(filtersReducer({ ...base, cities: ['p|x'], r: 150 }, { type: 'removeCity', key: 'p|x' }).r).toBe(0);
expect(filtersReducer({ ...base, cities: ['p|x'], r: 150 }, { type: 'clearCities' }).r).toBe(0);
expect(filtersReducer({ ...base, cities: ['p|x'] }, { type: 'radius', r: 400 }).r).toBe(400);
// applyFilters scope overrides cities, other filters still apply
expect(applyFilters(evs, { ...DEFAULT_FILTERS, cities: ['p|x'], type: 'meetup' }, today, undefined, new Set(['p|x', 'near|x']))
  .every((e) => e.type === 'meetup' && ['p|x', 'near|x'].includes(e.cityKey))).toBe(true);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run web/src/model web/src/viewmodel/filtersReducer.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`radiusScope` uses `ownPosition` for picked cities and `anyPosition` for candidates, and includes a place within `r` km of **any** picked city. `useAppViewModel` computes the scope once per render and passes it to both `applyFilters` calls. Unknown city keys in a URL stay harmless: they match nothing and add nothing. `scopeLabel` becomes `2 cities + 13 places within 150 km` when a radius adds places.

- [ ] **Step 4: Verify**

Run: `npm test; npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web
git commit -m "Add the include-nearby radius to filters and the URL"
```

### Task 8: Map geometry and clustering

**Files:**
- Create: `web/src/model/mapGeometry.ts`, `web/src/model/mapGeometry.test.ts`, `web/src/model/mapCluster.ts`, `web/src/model/mapCluster.test.ts`, `web/src/view/map/map-data.json`, `web/public/map-data-license.txt`

**Interfaces:**
- Consumes: `LatLon`.
- Produces:

```ts
// mapGeometry.ts
export interface View { x: number; y: number; z: number }
export interface Size { w: number; h: number }
export const HOME_BOUNDS = { lon0: -126.5, lon1: -63, lat0: 24, lat1: 53.5 };
export function mercator([lat, lon]: LatLon): [x: number, y: number];   // [0,1), lat clamped to ±85
export function unmercator(x: number, y: number): LatLon;
export function scaleOf(z: number): number;                              // 256 * 2 ** z
export function toScreen(v: View, s: Size, x: number, y: number): [number, number];
export function toWorld(v: View, s: Size, px: number, py: number): [number, number];
export function homeView(s: Size): View;
export function fitPoints(points: LatLon[], s: Size, padPx: number): View;
export function clampView(v: View, s: Size): View;
export function decodeLine(str: string, q: number): Float64Array;        // delta + zigzag, 5 bits per char from code 63
// mapCluster.ts
export interface Light { key: string; x: number; y: number; n: number; soon: number } // soon = share in the next 7 days
export interface Cluster extends Light { own: number; more: number; moreN: number; picked: boolean }
export function clusterLights(lights: Light[], z: number, picked: ReadonlySet<string>, radiusPx: number): Cluster[];
export interface LabelBox { key: string; text: string; x: number; y: number; w: number; h: number }
export function layoutLabels(cs: Cluster[], v: View, s: Size, measure: (t: string, bold: boolean) => number, zones: readonly DOMRectLike[], max: number): LabelBox[];
```

- [ ] **Step 1: Write the failing tests**

```ts
const s = { w: 800, h: 600 };
const [x, y] = mercator([43.65, -79.38]);
const v = fitPoints([[40.44, -80], [43.65, -79.38]], s, 40);
const [px, py] = toScreen(v, s, x, y);
expect(px).toBeGreaterThan(0); expect(px).toBeLessThan(800); expect(py).toBeGreaterThan(0);
const [wx, wy] = toWorld(v, s, px, py);
expect(wx).toBeCloseTo(x, 8); expect(wy).toBeCloseTo(y, 8);
expect(unmercator(x, y)[0]).toBeCloseTo(43.65, 6);
expect(decodeLine(encodedFixture, 1048576)).toEqual(expectedFixture); // fixture: one real line from map-data.json
// clustering
const a = { key: 'a', x: .5, y: .5, n: 10, soon: 0 }, b = { key: 'b', x: .50001, y: .5, n: 3, soon: 0 };
expect(clusterLights([a, b], 3, new Set(), 24)).toHaveLength(1);
expect(clusterLights([a, b], 3, new Set(), 24)[0]).toMatchObject({ key: 'a', own: 10, more: 1, moreN: 3 });
expect(clusterLights([a, b], 3, new Set(['b']), 24).map((c) => c.key).sort()).toEqual(['a', 'b']); // picked never merge
expect(clusterLights([a, b], 16, new Set(), 24)).toHaveLength(2);
// labels never overlap or sit under zones
const boxes = layoutLabels(manyClusters, v, s, () => 60, [{ left: 0, top: 0, right: 200, bottom: 60 }], 12);
expect(noOverlaps(boxes)).toBe(true);
expect(boxes.some((b) => b.x < 200 && b.y < 60)).toBe(false);
expect(boxes.length).toBeLessThanOrEqual(12);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run web/src/model/mapGeometry.test.ts web/src/model/mapCluster.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement and add the assets**

Port from the prototype's `mxOf`, `myOf`, `fitZ`, `homeView`, `clampView`, `decode`, `clusterize`, `layoutLabels`, using the same constants. Convert `design-lab/j/map-data.js` to JSON (the value of `window.J_MAP`). Copy `design-lab/j/MAP-DATA-LICENSE.txt` to `web/public/map-data-license.txt`.

- [ ] **Step 4: Verify**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web
git commit -m "Add map projection, line decoding, clustering and label layout"
```

### Task 9: The map on desktop

**Files:**
- Create: `web/src/view/map/mapEngine.ts`, `web/src/view/map/NightMap.tsx`, `web/src/view/map/MapSlot.tsx`, `web/src/view/map/PlaceList.tsx`, `web/src/styles/map.css`
- Modify: `web/src/view/App.tsx`, `web/src/view/components/Masthead.tsx`, `web/src/styles/index.css`, `web/src/viewmodel/useAppViewModel.ts`
- Test: `tests/e2e/map.spec.ts`

**Interfaces:**
- Consumes: Task 7 and 8 exports; `actions.addCity`, `actions.removeCity`.
- Produces:

```ts
export interface MapCallbacks { onToggle(key: string): void; onHover(key: string | null): void; onSettle(v: View): void }
export class MapEngine {
  constructor(host: HTMLElement, canvas: HTMLCanvasElement, data: MapData, cb: MapCallbacks, reducedMotion: boolean);
  setLights(lights: Light[]): void; setPicked(keys: readonly string[]): void; setRings(rings: LatLon[][]): void;
  flyTo(v: View, ms?: number): void; zoomBy(delta: number): void; fitHome(): void; fitTo(points: LatLon[]): void;
  resize(): void; destroy(): void;
}
// AppViewModel
map: { lights: Light[]; picked: string[]; available: boolean }   // available = places table is non-empty
```

`#mapView` carries `data-center="lat,lon"` and `data-zoom` written on settle; e2e reads these. `MapSlot` lazy-loads `NightMap` (`React.lazy`) and `map-data.json` (dynamic import). `PlaceList` is the "List the places in view" panel: `.map__listbtn` opens it, and each place is a `.ml__b` toggle button with `aria-pressed`, most events first.

- [ ] **Step 1: Write the failing tests** in `map.spec.ts`

```ts
const center = (p: Page) => p.locator('#mapView').getAttribute('data-center');
test('dragging moves the map and the list does not change', async ({ page }) => {
  await openBoard(page);
  const before = await center(page), n = await shownCount(page);
  const b = (await page.locator('#mapView').boundingBox())!;
  await page.mouse.move(b.x + 300, b.y + 200); await page.mouse.down();
  await page.mouse.move(b.x + 150, b.y + 120, { steps: 10 }); await page.mouse.up();
  await expect.poll(() => center(page)).not.toBe(before);
  expect(await shownCount(page)).toBe(n);
});
test('picks add up and a second tap removes', async ({ page, request }) => {
  await openBoard(page);
  await page.click('.map__listbtn');
  await page.click('.ml__b:has-text("Toronto, Ontario")');
  await expect(page.locator('#chips .chip')).toHaveCount(1);
  await page.click('.ml__b:has-text("Seattle, Washington")');
  await expect(page.locator('#chips .chip')).toHaveCount(2);
  expect(await shownCount(page)).toBe(await expectedCount(request, page, ['toronto|ontario', 'seattle|washington']));
  await page.click('.ml__b:has-text("Toronto, Ontario")');
  await expect(page.locator('#chips .chip')).toHaveCount(1);
});
test('an idle page does no animation work @perf', async ({ page }) => {
  await page.addInitScript(() => { const r = window.requestAnimationFrame; (window as any).__raf = 0; window.requestAnimationFrame = (f) => { (window as any).__raf++; return r(f); }; });
  await openBoard(page); await page.waitForTimeout(3000);
  await page.evaluate(() => { (window as any).__raf = 0; }); await page.waitForTimeout(3000);
  expect(await page.evaluate(() => (window as any).__raf)).toBe(0);
});
test('a failed map download shows a retry and the list still works', async ({ page }) => {
  await page.route(/map-data.*\.js|NightMap.*\.js/, (r) => r.abort());
  await openBoard(page);
  await expect(page.locator('.map__retry')).toBeVisible();
  expect(await shownCount(page)).toBeGreaterThan(0);
});
```

Add `expectedCount(request, page, keys, r?)` to `tests/e2e/support.ts`, computed independently from the served dataset.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test tests/e2e/map.spec.ts --project=desktop`
Expected: FAIL, `#mapView` not found.

- [ ] **Step 3: Implement the engine**

Port from the prototype: `renderBase`, `sprites`, `draw`, `moveTo`, `stepAnim`, `stepInertia`, `zoomAt`, the pointer handlers in `initMap`. These decide the speed and must be kept: dragging moves a cached bitmap; lights are pre-drawn sprites; never use `shadowBlur` or canvas filters; `requestAnimationFrame` runs only while something moves. Hit area: nearest light within 12 px for mouse, 22 px on touch. The engine is plain TypeScript with no React; `NightMap` owns it through a ref and an effect. Light size = events matching the other filters; core whiteness = `soon`. Render under the masthead as in the prototype, with title `Over North America` / `Over Pittsburgh & Columbus`. Render nothing when `map.available` is false. On chunk failure show `.map__retry` ("The map didn't load. Try again").

- [ ] **Step 4: Verify**

Run: `npm test; npx playwright test tests/e2e/map.spec.ts --project=desktop`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web tests/e2e
git commit -m "Add the draggable night map with picks that add up"
```

### Task 10: Find a city, radius control, distances, keyboard

**Files:**
- Modify: `web/src/view/map/NightMap.tsx`, `web/src/view/map/mapEngine.ts`, `web/src/view/components/FilterBar.tsx`, `web/src/view/components/EventRow.tsx`, `web/src/viewmodel/useAppViewModel.ts`, `web/src/styles/map.css`
- Create: `web/src/view/map/FindCity.tsx`
- Test: `tests/e2e/map.spec.ts`

**Interfaces:**
- Consumes: `rangeFrom`, `actions.setRadius`, `circle`, `MapEngine`, `PlaceList`.
- Produces: `AppViewModel.rangeText(cityKey: string): string` returns `''`, `'here'`, or `'305 km SE of Pittsburgh'`, rendered in `EventRow` as `.ev__range` inside `.ev__where` and omitted when empty. `.radius` is a `role="radiogroup"` of `.rad__b` radios labelled `Just {city}` or `Just these`, `50 km`, `150 km`, `400 km`, shown once a city is picked. `#chips .chip--rad` reads `+ {n} places within {r} km`.

- [ ] **Step 1: Write the failing tests**

```ts
test('find a city moves the map and picks it in one action', async ({ page }) => {
  await openBoard(page);
  await page.fill('#mapq', 'pittsburgh');
  await page.click('#mapopts li[data-key="pittsburgh|pennsylvania"]');
  await expect(page.locator('#chips .chip')).toHaveCount(1);
  await expect(page.locator('.ev__range').first()).toHaveText('here');
});
test('radius widens the search around every pick and survives reload', async ({ page, request }) => {
  await openBoard(page, 'cities=pittsburgh%7Cpennsylvania%2Ccolumbus%7Cohio');
  await page.click('.rad__b:has-text("150 km")');
  const want = await expectedCount(request, page, ['pittsburgh|pennsylvania', 'columbus|ohio'], 150);
  expect(await shownCount(page)).toBe(want);
  await expect(page.locator('.chip--rad')).toContainText('within 150 km');
  await page.reload(); await page.waitForSelector('#board[aria-busy=false]');
  expect(await shownCount(page)).toBe(want);
});
test('rows show no distance without a pick and never NaN', async ({ page }) => {
  await openBoard(page);
  await expect(page.locator('.ev__range')).toHaveCount(0);
  await openBoard(page, 'cities=multiple%20cities%7Cus%20%26%20canada&when=all');
  await expect(page.locator('body')).not.toContainText('NaN');
});
test('the map works from the keyboard', async ({ page }) => {
  await openBoard(page, 'cities=toronto%7Contario');
  await page.focus('#mapView');
  const before = await page.locator('#mapView').getAttribute('data-center');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.locator('#mapView').getAttribute('data-center')).not.toBe(before);
  await page.keyboard.press('Enter');
  await expect(page.locator('#sr')).not.toBeEmpty();
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test tests/e2e/map.spec.ts --project=desktop`
Expected: FAIL on `#mapq`.

- [ ] **Step 3: Implement**

Rings are `circle()` true-distance outlines, never screen circles. Places known only by metro are listed `by metro area` and show no km. Keyboard: one tab stop, arrows pan (Shift larger), `+`/`-` zoom, Home returns to the continent, Enter/Space toggles the city under the centre cross; announce through a `#sr` live region. Add the `by metro area` lines to `PlaceList`. Picking from the Cities box also flies there. Disambiguate same-name places in labels (`Vancouver WA`, `Vancouver BC`). Copy from the prototype's `hint()`.

- [ ] **Step 4: Verify**

Run: `npm test; npx playwright test tests/e2e/map.spec.ts --project=desktop`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web tests/e2e
git commit -m "Add find-a-city, the nearby radius control, row distances and map keyboard use"
```

### Task 11: Phone List/Map switch

**Files:**
- Create: `web/src/view/map/useMapSwitch.ts`, `web/src/view/map/ViewPill.tsx`
- Modify: `web/src/view/App.tsx`, `web/src/view/map/MapSlot.tsx`, `web/src/view/map/NightMap.tsx`, `web/src/viewmodel/useAppViewModel.ts`, `web/src/styles/map.css`, `web/src/styles/responsive.css`
- Test: `tests/e2e/map.spec.ts`

**Interfaces:**
- Consumes: `usePhone`, `AppViewModel.map`.
- Produces: `useMapSwitch(): { open: boolean; toggle(): void }`. Sets `map-open` on `<html>`. `.viewpill` text: `Map` plus the pick count, or `Show {n} events` / `Show 1 event` / `Show calendar` when open. On phones `NightMap` isn't mounted until first open.

- [ ] **Step 1: Write the failing tests** (all `@mobile`)

```ts
test('phones open on the list with the map one tap away @mobile', async ({ page }) => {
  await openBoard(page);
  await expect(page.locator('html')).not.toHaveClass(/map-open/);
  await expect(page.locator('#mapView')).toHaveCount(0);
  await expect(page.locator('.viewpill')).toHaveText('Map');
  const top = await page.locator('.ev').first().evaluate((e) => e.getBoundingClientRect().top);
  expect(top).toBeLessThan(page.viewportSize()!.height - 140);
});
test('picking on the map updates the pill and the list @mobile', async ({ page, request }) => {
  await openBoard(page);
  await page.tap('.viewpill');
  await page.fill('#mapq', 'pittsburgh');
  await page.tap('#mapopts li[data-key="pittsburgh|pennsylvania"]');
  const n = await expectedCount(request, page, ['pittsburgh|pennsylvania']);
  await expect(page.locator('.viewpill')).toHaveText(`Show ${n} events`);
  await page.tap('.viewpill');
  await expect(page.locator('.viewpill')).toContainText('Map');
  await expect(page.locator('.viewpill__n')).toHaveText('1');
  expect(await shownCount(page)).toBe(n);
});
test('the list keeps its place and the back button closes the map @mobile', async ({ page }) => {
  await openBoard(page);
  await page.evaluate(() => scrollTo(0, 1500)); await page.waitForTimeout(400);
  const y = await page.evaluate(() => scrollY);
  await page.tap('.viewpill');
  await page.goBack();
  await expect(page.locator('html')).not.toHaveClass(/map-open/);
  expect(Math.abs(await page.evaluate(() => scrollY) - y)).toBeLessThan(8);
});
test('picks survive the back button and stay in the URL @mobile', async ({ page }) => {
  await openBoard(page);
  await page.tap('.viewpill');
  await page.fill('#mapq', 'toronto'); await page.tap('#mapopts li[data-key="toronto|ontario"]');
  await page.goBack();
  expect(page.url()).toContain('toronto');
  await expect(page.locator('#chips .chip')).toHaveCount(1);
});
test('rotating with the map open leaves a usable page @mobile', async ({ page }) => {
  await openBoard(page);
  await page.tap('.viewpill');
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.locator('html')).not.toHaveClass(/map-open/);
  expect(await page.locator('main').getAttribute('inert')).toBeNull();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});
test('the pill never covers the empty-state reset @mobile', async ({ page }) => {
  await openBoard(page, 'q=zzzzqqq');
  await page.locator('#empty [data-reset], .empty button').first().tap();
  await expect.poll(() => shownCount(page)).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test tests/e2e/map.spec.ts --project=mobile`
Expected: FAIL on `.viewpill`.

- [ ] **Step 3: Implement**

Follow `setMapOpen`, `updatePill` and the `popstate` handler in `design-lab/j/app.js`. Opening does `pushState({ mapOpen: 1 })`; closing by the pill does `history.back()` guarded so the pop doesn't re-read an older URL; a back-button close re-writes the current filters to the URL. **The view-model's URL effect must pass `history.state`** instead of `null` to `replaceState`, or picks wipe the entry. While open, make `main`, `.foot`, `.controls` and the masthead text `inert`, and lock body scroll. On leaving the phone layout, close. Keep the view on reopen unless picks or radius changed, then refit. The pill: fixed above the dock (`bottom: calc(var(--dockH) + 12px)`), right corner in landscape, hidden when the keyboard is up. Body padding-bottom on phones: `calc(var(--dockH) + 84px + env(safe-area-inset-bottom) + var(--kb, 0px))`.

- [ ] **Step 4: Verify**

Run: `npx playwright test --project=mobile --project=desktop`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web tests/e2e
git commit -m "Make the list home on phones with a List/Map switch"
```

### Task 12: Release readiness

**Files:**
- Create: `tests/e2e/responsive.spec.ts`
- Modify: `docs/APP.md`, `README.md`, `tests/e2e/quality.spec.ts`

- [ ] **Step 1: Add the responsive sweep to the contract**

For widths `[280, 320, 344, 360, 375, 390, 412, 430, 768]` and landscape `[568×320, 667×375, 844×390, 932×430]`, in the mobile project, assert on the list, the open filter sheet, the map view and the calendar: `scrollWidth <= viewport width` measured against the **configured** width (a phone widens `innerWidth` to hide overflow); every visible control other than a calendar day is ≥ 44 px on its smaller side; no `.ev__name` narrower than 80 px.

- [ ] **Step 2: Add a bundle budget** in `quality.spec.ts`

The first page load must not request the map data chunk on phones; assert no response URL matches `/map-data/` before `.viewpill` is tapped.

- [ ] **Step 3: Run everything**

Run: `npm run typecheck; npm test; npm run check:places; npm run test:e2e`
Expected: all PASS, including the `@perf` budgets (first rows < 4 s, filter change < 1.5 s, typing < 3 s).

- [ ] **Step 4: Update the docs**

`docs/APP.md`: new stack lines (fonts, the map), the map's files in the Map and component tables, the radius in "the three layers", and the map data licence. Remove every mention of the departures board.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e docs README.md
git commit -m "Add the responsive contract and document the night map"
```

- [ ] **Step 6: Check on real phones**

Build and serve (`npm run build; npm run preview -- --host`), then open on one iPhone and one Android phone: the first screen, drag and pinch, the keyboard over Find a city, the back button, safe areas, `+ Calendar`. Record the results for the user; everything before this step was simulated.

- [ ] **Step 7: Stop for the release decision**

Report the branch, test results and phone check. Merging to `main` publishes the site, so wait for the user to ask.
