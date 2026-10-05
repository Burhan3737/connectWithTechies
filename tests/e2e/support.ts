import { expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Shared helpers for the end-to-end contract.
 *
 * Expectations are computed from the dataset the server under test actually
 * serves, by logic written independently of the app, so the suite checks the
 * app's filtering rather than repeating numbers that drift with every data run.
 */

export type Ev = {
  name: string; type: string; city: string; region: string; country: string;
  url: string; status: string; cadence?: string; month?: string;
  next_date?: string; next_date_end?: string; last_date?: string;
  description?: string; venue?: string; topics?: string[]; feed_dates?: string[];
};
export type Dataset = { generated_on: string; event_count: number; city_count: number; events: Ev[] };

let cached: Dataset | null = null;
export async function dataset(request: APIRequestContext): Promise<Dataset> {
  if (cached) return cached;
  const res = await request.get('data/events.json');
  expect(res.ok(), 'data/events.json is served').toBeTruthy();
  cached = await res.json();
  return cached!;
}

/** The browser's local calendar date — the clock the app itself uses. */
export async function today(page: Page): Promise<string> {
  return page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

/** Today on this machine — the browser under test runs in the same time zone. */
const LOCAL_TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

/** Upcoming by the visitor's clock: an event that has ended is not upcoming, whatever the data build said. */
export const isUpcoming = (e: Ev) => e.status === 'recurring-tbd' ||
  (e.status === 'upcoming' && (!e.next_date || (e.next_date_end || e.next_date) >= LOCAL_TODAY));
export const isPast = (e: Ev, todayIso: string) =>
  !!e.last_date || e.status === 'past' || (!!e.next_date && e.next_date < todayIso);

/** Open the board and wait until it has rendered from data. */
export async function openBoard(page: Page, query = '') {
  await page.goto(`./${query ? `?${query.replace(/^\?/, '')}` : ''}`);
  await expect(page.locator('#count b')).toHaveText(/^\d+$/);
}

/** The number in the results bar ("3866 events · …"). */
export async function shownCount(page: Page): Promise<number> {
  return Number(await page.locator('#count b').textContent());
}

/** The URL's query parameters, as the app wrote them. */
export async function params(page: Page) {
  return new URL(page.url()).searchParams;
}

/** Choose an option in one of the drawn dropdowns by its visible label. */
export async function choose(page: Page, id: 'type' | 'country' | 'region' | 'sort', label: string) {
  await page.locator(`#${id}-dd`).click();
  const panel = page.locator(`#${id}-dd`).locator('..').locator('.dd__panel');
  await expect(panel).toBeVisible();
  await panel.locator('[role="option"]', { has: page.locator('.dd__opt', { hasText: new RegExp(`^${escapeRe(label)}$`) }) }).click();
  await expect(panel).toBeHidden();
}

export async function setWhen(page: Page, when: 'upcoming' | 'past' | 'all') {
  await page.locator(`[data-when="${when}"]`).click();
  await expect(page.locator(`[data-when="${when}"]`)).toHaveAttribute('aria-checked', 'true');
}

export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Rows currently in the document (a virtualised list renders only some). */
export const rows = (page: Page) => page.locator('#board .ev');

/** Fail the test on any uncaught page error or console error. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}
