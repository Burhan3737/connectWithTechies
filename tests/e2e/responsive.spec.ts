import { test, expect, type Page } from '@playwright/test';
import { openBoard } from './support';

/**
 * The responsive contract: at every phone width and orientation we support, the
 * list, the open filter sheet, the map and the calendar must not scroll sideways,
 * every control must be big enough to hit, and a row's name must have room to read.
 */
const PORTRAIT = [280, 320, 344, 360, 375, 390, 412, 430, 768].map((w) => ({ w, h: 800 }));
const LANDSCAPE = [[568, 320], [667, 375], [844, 390], [932, 430]].map(([w, h]) => ({ w, h }));

const CONTROLS = 'button, input, select, summary, a[href], [role="radio"], [role="option"], [role="button"], [role="tab"]';

/** Controls on screen that are under 44 px on their smaller side. Calendar days are exempt, and so are visually hidden
 *  elements and the map credit link, which sits in running text. */
async function smallControls(page: Page) {
  return page.locator(CONTROLS).evaluateAll((els) => els.flatMap((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!el.getClientRects().length || cs.visibility === 'hidden' || cs.display === 'none') return [];
    if (el.closest('[aria-hidden="true"]') || el.closest('[inert]')) return [];
    if (el.classList.contains('cal__day')) return [];
    if (cs.position === 'absolute' && (r.width <= 1 || r.height <= 1)) return [];     // visually hidden
    if (cs.clipPath !== 'none' || /rect\(0/.test(cs.clip)) return [];
    if (el.tagName === 'A' && el.closest('p')) return [];                               // the map's attribution
    const side = Math.min(r.width, r.height);
    return side < 44 ? [`${el.tagName.toLowerCase()}.${el.className || el.id} ${Math.round(r.width)}x${Math.round(r.height)}`] : [];
  }));
}

async function check(page: Page, width: number, where: string) {
  // Against the configured width: a phone widens innerWidth to hide overflow.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth) - width;
  expect(overflow, `${where}: sideways overflow`).toBeLessThanOrEqual(1);
  expect(await smallControls(page), `${where}: controls under 44 px`).toEqual([]);
  const narrow = await page.locator('.ev__name').evaluateAll((els) =>
    els.filter((e) => e.getClientRects().length && e.getBoundingClientRect().width < 80).length);
  expect(narrow, `${where}: names under 80 px`).toBe(0);
  // A one-word city sits on one line: it is never broken mid-word to fill the line ("Pitt/sbu/rgh").
  const broken = await page.locator('.ev__city').evaluateAll((els) => els.filter((e) => {
    const text = (e.textContent || '').trim();
    if (!e.getClientRects().length || /\s/.test(text)) return false;
    const range = document.createRange();
    range.selectNodeContents(e);
    return range.getClientRects().length > 1;
  }).map((e) => e.textContent));
  expect(broken, `${where}: cities broken mid-word`).toEqual([]);
  const weekdays = await page.locator('.cal__wd').evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
  if (weekdays.length) expect(Math.min(...weekdays), `${where}: weekday labels`).toBeGreaterThanOrEqual(13);
}

test.describe('Responsive contract @mobile', () => {
  for (const { w, h } of [...PORTRAIT, ...LANDSCAPE]) {
    test(`${w}x${h}: list, filter sheet, map and calendar hold @mobile`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await openBoard(page);
      await expect(page.locator('#board .ev').first()).toBeVisible();
      await check(page, w, 'list');

      const phone = await page.locator('#deckBtn').isVisible();
      if (phone) {
        await page.tap('#deckBtn');
        await expect(page.locator('#deckBtn')).toHaveAttribute('aria-expanded', 'true');
        await check(page, w, 'filter sheet');
        await page.tap('#deckDone');
        await expect(page.locator('#deckBtn')).toHaveAttribute('aria-expanded', 'false');
      }

      if (await page.locator('.viewpill').isVisible()) {
        await page.tap('.viewpill');
        await expect(page.locator('#mapView')).toBeVisible();
        await check(page, w, 'map');
        await page.tap('.viewpill');
        await expect(page.locator('#mapView')).toBeHidden();
      } else {
        await expect(page.locator('#mapView')).toBeVisible();
        await check(page, w, 'map');
      }

      await openBoard(page, 'view=calendar');
      await expect(page.locator('.cal__day').first()).toBeVisible();
      await check(page, w, 'calendar');
    });
  }
});
