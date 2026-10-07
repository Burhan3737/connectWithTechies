import { test, expect } from '@playwright/test';
import { openBoard, shownCount, rows } from './support';

test.describe('Phone layout @mobile', () => {
  test('nothing overflows the screen sideways @mobile', async ({ page }) => {
    await openBoard(page);
    // Against the device width: if content is too wide a phone zooms out, and
    // then innerWidth grows to match it, hiding the overflow from a naive check.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth) - page.viewportSize()!.width;
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('filters stack into full-width controls of one height @mobile', async ({ page }) => {
    await openBoard(page);
    const boxes = await page.locator('.controls .field__box, .controls .segmented').evaluateAll((els) =>
      els.map((e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height }; }));
    const width = page.viewportSize()!.width;
    for (const b of boxes) expect(b.w).toBeGreaterThan(width * 0.8);
    expect(new Set(boxes.map((b) => Math.round(b.h))).size).toBe(1);
  });

  test('the stacked filter bar scrolls away instead of covering the screen @mobile', async ({ page }) => {
    await openBoard(page);
    await page.mouse.wheel(0, 3000);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1500);
    const bottom = await page.locator('.controls').evaluate((e) => e.getBoundingClientRect().bottom);
    expect(bottom).toBeLessThanOrEqual(0);
  });

  test('the calendar fits and a tapped day lists its events @mobile', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    // Against the device width: if content is too wide a phone zooms out, and
    // then innerWidth grows to match it, hiding the overflow from a naive check.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth) - page.viewportSize()!.width;
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator('.cal__ev').first()).toBeHidden();       // names hide on phones; counts show
    const busy = page.locator('.cal__day:not(.is-out)').filter({ has: page.locator('.cal__count') }).first();
    const iso = await busy.getAttribute('data-day');
    await busy.click();
    await expect(page.locator('.cal__day.is-sel')).toHaveAttribute('data-day', iso!);
    await expect(page.locator('.cal__dayview .ev').first()).toBeVisible();
  });
});

test.describe('Desktop layout', () => {
  test('filter controls share one height', async ({ page }) => {
    await openBoard(page);
    const heights = await page.locator('.controls .field__box, .controls .segmented').evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().height)));
    expect(new Set(heights).size).toBe(1);
  });

  test('the filter bar stays on screen while scrolling', async ({ page }) => {
    await openBoard(page);
    await page.mouse.wheel(0, 4000);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    const top = await page.locator('.controls').evaluate((e) => e.getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThanOrEqual(1);
  });
});

test.describe('Accessibility basics', () => {
  test('every control has a name', async ({ page }) => {
    await openBoard(page);
    const unnamed = await page.locator('input, button, select, a[href]').evaluateAll((els) => els.filter((e) => {
      const h = e as HTMLElement;
      if (h.offsetParent === null && getComputedStyle(h).position !== 'fixed') return false;   // not rendered
      if (h.getAttribute('aria-hidden') === 'true') return false;
      const id = h.id;
      const label = id && document.querySelector(`label[for="${id}"]`);
      const name = (h.getAttribute('aria-label') || h.getAttribute('aria-labelledby') || (label && label.textContent) ||
        h.getAttribute('placeholder') || h.textContent || '').trim();
      return !name;
    }).map((e) => e.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);
  });

  test('keyboard reaches the filters in order', async ({ page }) => {
    await openBoard(page);
    await page.locator('#q').focus();
    const order: string[] = [];
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('Tab');
      order.push(await page.evaluate(() => (document.activeElement as HTMLElement)?.id || document.activeElement?.getAttribute('data-when') || ''));
    }
    const idx = (k: string) => order.indexOf(k);
    expect(idx('cityq')).toBeGreaterThanOrEqual(0);
    expect(idx('type-dd')).toBeGreaterThan(idx('cityq'));
    expect(idx('country-dd')).toBeGreaterThan(idx('type-dd'));
    expect(idx('region-dd')).toBeGreaterThan(idx('country-dd'));
  });

  test('focus is visible on the filter boxes', async ({ page }) => {
    await openBoard(page);
    await page.locator('#q').focus();
    // The border animates to orange; wait for the transition rather than read it mid-way.
    await expect.poll(() => page.locator('#q').locator('..').evaluate((e) => getComputedStyle(e).borderTopColor))
      .toBe('rgb(255, 92, 26)');
  });

  test('motion is reduced when asked', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await openBoard(page);
    const anim = await rows(page).first().evaluate((e) => getComputedStyle(e).animationName);
    expect(anim).toBe('none');
    await ctx.close();
  });
});

test.describe('Performance @perf', () => {
  test.describe.configure({ mode: 'serial' });
  test('first rows appear quickly', async ({ page }) => {
    const t0 = Date.now();
    await page.goto('./');
    await expect(rows(page).first()).toBeVisible();
    const ms = Date.now() - t0;
    test.info().annotations.push({ type: 'first-rows-ms', description: String(ms) });
    expect(ms).toBeLessThan(4000);
  });

  test('a filter change responds quickly', async ({ page }) => {
    await openBoard(page);
    const ms = await page.evaluate(async () => {
      const t = performance.now();
      (document.querySelector('[data-when="all"]') as HTMLElement).click();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return performance.now() - t;
    });
    test.info().annotations.push({ type: 'filter-ms', description: ms.toFixed(0) });
    expect(ms).toBeLessThan(1500);
    await expect.poll(() => shownCount(page)).toBeGreaterThan(0);
  });

  test('typing in search stays responsive', async ({ page }) => {
    await openBoard(page);
    const t0 = Date.now();
    await page.locator('#q').pressSequentially('kubernetes', { delay: 20 });
    await expect(page.locator('#board mark').first()).toBeVisible();
    const ms = Date.now() - t0;
    test.info().annotations.push({ type: 'search-ms', description: String(ms) });
    expect(ms).toBeLessThan(3000);
  });
});
