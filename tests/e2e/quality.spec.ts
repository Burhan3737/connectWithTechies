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

  test('the masthead holds at 360px: credit on screen, tally on one flowing line @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openBoard(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth) - 360;
    expect(overflow).toBeLessThanOrEqual(1);
    const credit = await page.locator('.masthead__credit').boundingBox();
    expect(credit!.x).toBeGreaterThanOrEqual(0);
    expect(credit!.x + credit!.width).toBeLessThanOrEqual(360);
    // Not a two-column grid: the first two tally items sit on the same row and are narrower than half the width.
    const [a, b] = await page.locator('.tally__i').evaluateAll((els) => els.slice(0, 2).map((e) => e.getBoundingClientRect()));
    expect(Math.abs(a.top - b.top)).toBeLessThan(4);
    expect(a.width).toBeLessThan(180);
    expect(await page.locator('.masthead__rule').evaluate((e) => getComputedStyle(e).letterSpacing)).toBe('normal');
  });

  test('the dock stays in thumb reach while scrolling @mobile', async ({ page }) => {
    await openBoard(page);
    await page.mouse.wheel(0, 3000);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1500);
    const r = await page.locator('.controls').evaluate((e) => e.getBoundingClientRect().bottom);
    expect(r).toBeCloseTo(page.viewportSize()!.height, -1);
  });

  test('filters open in a sheet and Done shows the live count @mobile', async ({ page }) => {
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

  test('the page reserves room for the dock and publishes its height @mobile', async ({ page }) => {
    await openBoard(page);
    const { dockH, height, pad } = await page.evaluate(() => ({
      dockH: getComputedStyle(document.documentElement).getPropertyValue('--dockH').trim(),
      height: document.querySelector('.controls')!.getBoundingClientRect().height,
      pad: parseFloat(getComputedStyle(document.body).paddingBottom),
    }));
    expect(parseFloat(dockH)).toBeCloseTo(height, 0);
    expect(pad).toBeGreaterThanOrEqual(height);
  });

  test('the filter sheet closes on Done, and the badge counts active filters @mobile', async ({ page }) => {
    await openBoard(page, 'type=hackathon&when=all');
    await expect(page.locator('#deckBtn .deckbtn__n')).toHaveText('2');
    await page.tap('#deckBtn');
    await expect(page.locator('#deckBtn')).toHaveAttribute('aria-expanded', 'true');
    await page.tap('#deckDone');
    await expect(page.locator('#deck .field--type')).toBeHidden();
    await expect(page.locator('#deckBtn')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#deckBtn')).toBeFocused();
  });

  test('a dropdown is a full-height sheet that leaves the keyboard down @mobile', async ({ page }) => {
    await openBoard(page);
    await page.tap('#deckBtn');
    await page.tap('#type-dd');
    const panel = page.locator('.dd__panel');
    await expect(panel).toBeVisible();
    await expect.poll(() => panel.evaluate((e) => e.getBoundingClientRect().top)).toBeLessThanOrEqual(1);   // after the slide-in
    const r = await panel.evaluate((e) => { const b = e.getBoundingClientRect(); return { bottom: b.bottom, w: b.width }; });
    const vp = page.viewportSize()!;
    expect(r.bottom).toBeCloseTo(vp.height, -1);
    expect(r.w).toBeCloseTo(vp.width, 0);
    expect(await page.evaluate(() => document.activeElement?.classList.contains('dd__search'))).toBe(false);
    await page.tap('.dd__close');
    await expect(panel).toBeHidden();
  });

  test('the city list opens at the top of a full sheet and stays on it @mobile', async ({ page }) => {
    await openBoard(page);
    await page.tap('#deckBtn');
    await page.tap('#cityq');
    await expect(page.locator('.controls')).toHaveClass(/deck-full/);
    await expect(page.locator('#citylist li').first()).toBeVisible();
    const fit = await page.evaluate(() => {
      const list = document.querySelector('#citylist')!.getBoundingClientRect();
      const body = document.querySelector('.deck__body')!.getBoundingClientRect();
      const q = document.querySelector('#cityq')!.getBoundingClientRect();
      return { listBottom: list.bottom, bodyBottom: body.bottom, inputTop: q.top };
    });
    expect(fit.listBottom).toBeLessThanOrEqual(fit.bodyBottom + 1);
    expect(fit.inputTop).toBeLessThan(120);
    await page.tap('#citylist li');
    await expect(page.locator('#chips .chip')).toHaveCount(1);
    await expect(page.locator('.controls')).not.toHaveClass(/deck-full/);
  });

  test('sheet controls keep touch-sized targets @mobile', async ({ page }) => {
    await openBoard(page, 'cities=toronto|ontario');
    await page.tap('#deckBtn');
    await page.tap('#region-dd');
    const small = (sel: string) => page.locator(sel).evaluateAll((els) =>
      els.filter((e) => e.getClientRects().length && e.getBoundingClientRect().height < 44).length);
    await expect(page.locator('.dd__panel [role="option"]').first()).toBeVisible();
    expect(await small('.dd__panel [role="option"], .dd__search')).toBe(0);
    await page.tap('.dd__close');
    await page.tap('#cityq');
    await expect(page.locator('#citylist li').first()).toBeVisible();
    expect(await small('#citylist li, .field__clear, .chip button')).toBe(0);
  });

  test('row text is big enough to read on a phone @mobile', async ({ page }) => {
    await openBoard(page, 'when=upcoming');
    const sizes = await page.locator('.ev__desc, .ev__tags, .ev__d2, .addcal > summary, .seam').evaluateAll((els) =>
      els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(15);
  });

  test('sheet text is big enough to read on a phone @mobile', async ({ page }) => {
    const sizes = (sel: string) => page.locator(sel).evaluateAll((els) =>
      els.filter((e) => e.getClientRects().length).map((e) => parseFloat(getComputedStyle(e).fontSize)));
    const expectReadable = async (sel: string) => {
      const found = await sizes(sel);
      expect(found.length, `${sel} is on screen`).toBeGreaterThan(0);
      expect(Math.min(...found), sel).toBeGreaterThanOrEqual(15);
    };
    await openBoard(page);
    await page.tap('#deckBtn');
    await expectReadable('.deck .field__label');
    await page.tap('#region-dd');
    await expect(page.locator('.dd__panel [role="option"]').first()).toBeVisible();
    await expectReadable('.dd__count');
    await expectReadable('.dd__group');
    await page.tap('.dd__close');
    await page.tap('#cityq');
    await expect(page.locator('#citylist li').first()).toBeVisible();
    await expectReadable('.citylist small');
  });

  test('held sideways, the dock and two-column rows still apply @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await openBoard(page);
    const placed = await page.locator('.ev').first().evaluate((e) => ({
      cols: getComputedStyle(e).gridTemplateColumns.split(' ').length,
      row: getComputedStyle(e.querySelector('.ev__where')!).gridRowStart,
    }));
    expect(placed).toEqual({ cols: 2, row: '2' });
    await expect(page.locator('#deckBtn')).toBeVisible();
    const b = await page.locator('.controls').evaluate((e) => e.getBoundingClientRect().bottom);
    expect(b).toBeCloseTo(390, -1);
  });

  for (const width of [280, 320]) {
    test(`no sideways scroll with the dock at ${width}px @mobile`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await openBoard(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth) - width;
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

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
  test('the phone dock is absent from the desktop', async ({ page }) => {
    await openBoard(page);
    await expect(page.locator('#deckBtn')).toBeHidden();
    await expect(page.locator('#deckDone')).toBeHidden();
    await expect(page.locator('#cityq')).toBeVisible();
    await expect(page.locator('#type-dd')).toBeVisible();
  });

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
    // The field is underlined, not boxed: focus thickens the line to 2px in the limb colour.
    // It animates, so wait for the transition rather than read it mid-way.
    await expect.poll(() => page.locator('#q').locator('..').evaluate((e) => getComputedStyle(e).boxShadow))
      .toMatch(/rgb\(212, 229, 255\) 0px -2px 0px 0px inset/);
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

test.describe('Bundle budget @mobile', () => {
  test('the first load on a phone does not fetch the map data until the map is opened @mobile', async ({ page }) => {
    const urls: string[] = [];
    page.on('response', (r) => urls.push(r.url()));
    await openBoard(page);
    await expect(page.locator('.viewpill')).toBeVisible();
    await page.waitForTimeout(1500);
    expect(urls.filter((u) => /map-data/.test(u))).toEqual([]);
    await page.tap('.viewpill');
    await expect(page.locator('#mapView')).toBeVisible();
    await expect.poll(() => urls.some((u) => /map-data/.test(u))).toBe(true);
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
