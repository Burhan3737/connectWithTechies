import { test, expect, type Page } from '@playwright/test';
import { dataset, expectedCount, isUpcoming, openBoard, params, scrollToRail, shownCount } from './support';

test.describe('City positions', () => {
  test('the board works when places.json cannot be loaded', async ({ page, request }) => {
    const data = await dataset(request);
    await page.route('**/data/places.json', (route) => route.abort());
    await openBoard(page);
    expect(await shownCount(page)).toBe(data.events.filter((e) => isUpcoming(e)).length);
    await expect(page.locator('#board .ev').first()).toBeVisible();
    // Becomes meaningful from Tasks 9 and 11, when the Map control exists.
    await expect(page.locator('.viewpill')).toHaveCount(0);
    await expect(page.locator('#map')).toHaveCount(0);
  });

  test('serves the city positions beside the events', async ({ request }) => {
    const res = await request.get('data/places.json');
    expect(res.ok()).toBeTruthy();
    const places = await res.json();
    expect(Object.keys(places.cities).length).toBeGreaterThan(100);
  });
});

test.describe('The night map', () => {
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

  test('a click that stops a glide still reports where the map stopped', async ({ page }) => {
    await openBoard(page);
    const before = await center(page);
    const b = (await page.locator('#mapView').boundingBox())!;
    await page.mouse.move(b.x + 700, b.y + 200); await page.mouse.down();
    await page.mouse.move(b.x + 400, b.y + 120, { steps: 6 }); await page.mouse.up();
    await page.mouse.down(); await page.mouse.up();
    await expect.poll(() => center(page)).not.toBe(before);
    const stopped = await center(page);
    await page.waitForTimeout(500);
    expect(await center(page)).toBe(stopped);
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

  test('clicking a light on the map toggles that city', async ({ page }) => {
    await openBoard(page, 'cities=toronto%7Contario');
    await expect(page.locator('#chips .chip')).toHaveCount(1);
    await expect(page.locator('#mapView')).toHaveAttribute('data-center', /^43\./);
    const b = (await page.locator('#mapView').boundingBox())!;
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await expect(page.locator('#chips .chip')).toHaveCount(0);
  });

  test('an idle page does no animation work @perf', async ({ page }) => {
    await page.addInitScript(() => { const r = window.requestAnimationFrame; (window as any).__raf = 0; window.requestAnimationFrame = (f) => { (window as any).__raf++; return r(f); }; });
    await openBoard(page);
    await expect(page.locator('#mapView')).toHaveAttribute('data-center', /./);
    await page.waitForTimeout(3000);
    await page.evaluate(() => { (window as any).__raf = 0; }); await page.waitForTimeout(3000);
    expect(await page.evaluate(() => (window as any).__raf)).toBe(0);
  });

  test('a failed map download shows a retry and the list still works', async ({ page }) => {
    await page.route(/map-data.*\.js|NightMap.*\.js/, (r) => r.abort());
    await openBoard(page);
    await expect(page.locator('.map__retry')).toBeVisible();
    expect(await shownCount(page)).toBeGreaterThan(0);
  });

  test('the retry brings the map back once the download works', async ({ page }) => {
    await page.route(/map-data.*\.js|NightMap.*\.js/, (r) => r.abort());
    await openBoard(page);
    await expect(page.locator('.map__retry')).toBeVisible();
    await page.unrouteAll();
    await page.click('.map__retry');
    await expect(page.locator('#mapView')).toHaveAttribute('data-center', /^-?[\d.]+,-?[\d.]+$/);
    await expect(page.locator('.map__retry')).toHaveCount(0);
  });

  test('the title names the picked cities', async ({ page }) => {
    await openBoard(page);
    await expect(page.locator('#mapTitle')).toHaveText('Over North America');
    await openBoard(page, 'cities=pittsburgh%7Cpennsylvania%2Ccolumbus%7Cohio');
    await expect(page.locator('#mapTitle')).toHaveText('Over Pittsburgh & Columbus');
  });

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

  test('holding Enter toggles the city under the cross once', async ({ page }) => {
    await openBoard(page, 'cities=toronto%7Contario');
    await expect(page.locator('#mapView')).toHaveAttribute('data-center', /^43\./);
    await page.focus('#mapView');
    await page.keyboard.down('Enter');
    await expect(page.locator('#chips .chip')).toHaveCount(0);
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    await page.waitForTimeout(100);
    await expect(page.locator('#chips .chip')).toHaveCount(0);
  });

  test('the date rail stays off the map and its controls, and shows once they are past', async ({ page }) => {
    await openBoard(page, 'cities=pittsburgh%7Cpennsylvania&r=150');
    await expect(page.locator('#mapView')).toHaveAttribute('data-center', /./);
    await page.waitForTimeout(100);
    const covered = () => page.evaluate(() => {
      const shown = (el: Element) => el.getClientRects().length > 0;
      const marks = [...document.querySelectorAll('.rail__mark')].filter(shown).map((m) => m.getBoundingClientRect());
      const under = [...document.querySelectorAll('#mapView, .radius, .rad__b, .map__listbtn, .resultbar button, .resultbar [role=radio]')]
        .filter(shown).map((t) => t.getBoundingClientRect());
      return { marks: marks.length, hits: marks.filter((m) => under.some((t) =>
        m.left < t.right && m.right > t.left && m.top < t.bottom && m.bottom > t.top)).length };
    });
    expect(await covered()).toEqual({ marks: 0, hits: 0 });
    await scrollToRail(page);
    await expect(page.locator('.rail__mark').first()).toBeVisible();
    expect((await covered()).hits).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('.rail__mark').first()).toBeHidden();
  });

  test('picking from the Cities box also flies there, at a city-sized view', async ({ page }) => {
    await openBoard(page);
    const before = await center(page);
    await page.fill('#cityq', 'pittsburgh');
    await page.click('#citylist li[data-key="pittsburgh|pennsylvania"]');
    await expect.poll(() => center(page)).not.toBe(before);
    const lat = Number((await center(page))!.split(',')[0]);
    expect(lat).toBeCloseTo(40.44, 0);
    const zoom = Number(await page.locator('#mapView').getAttribute('data-zoom'));
    expect(zoom).toBeLessThan(9);
  });

  test('the radius moves by arrow keys as one tab stop, and its chip takes it off', async ({ page }) => {
    await openBoard(page, 'cities=pittsburgh%7Cpennsylvania');
    await expect(page.locator('.rad__b')).toHaveText(['Just Pittsburgh', '50 km', '150 km', '400 km']);
    await expect(page.locator('.rad__b[tabindex="0"]')).toHaveCount(1);
    await page.focus('.rad__b[aria-checked=true]');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.rad__b[data-r="50"]')).toBeFocused();
    await expect(page.locator('.rad__b[data-r="50"]')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#chips .chip--rad')).toHaveText(/^\+ \d+ places? within 50 km/);
    await expect(page.locator('#sr')).toContainText('Within 50 km of Pittsburgh');
    await page.click('.chip--rad button');
    await expect(page.locator('.chip--rad')).toHaveCount(0);
    await expect(page.locator('.rad__b[data-r="0"]')).toHaveAttribute('aria-checked', 'true');
    expect((await params(page)).get('r')).toBeNull();
  });

  test('a picked city with no position gets no radius control and no distance', async ({ page }) => {
    await openBoard(page, 'cities=multiple%20cities%7Cus%20%26%20canada&r=150&when=all');
    await expect(page.locator('.radius')).toHaveCount(0);
    await expect(page.locator('.chip--rad')).toHaveCount(0);
    await expect(page.locator('.ev__range')).toHaveCount(0);
    expect(await shownCount(page)).toBeGreaterThan(0);
  });
});

/** The results' first row, not somewhere down the list. */
async function expectAtFirstResult(page: Page) {
  await expect.poll(() => page.evaluate(() => Math.abs(scrollY - document.querySelector('main')!.offsetTop))).toBeLessThan(8);
  await expect(page.locator('#board [data-row="0"]')).toBeInViewport();
}

test.describe('The phone List/Map switch', () => {
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

  // Picks changed while the map was open: the list behind it is a new list, so it starts at its top.
  for (const how of ['the pill', 'the back button']) {
    test(`after a map pick, ${how} lands on the first result @mobile`, async ({ page }) => {
      await openBoard(page);
      await page.evaluate(() => scrollTo(0, 9000)); await page.waitForTimeout(400);
      await page.tap('.viewpill');
      await page.fill('#mapq', 'pittsburgh');
      await page.tap('#mapopts li[data-key="pittsburgh|pennsylvania"]');
      await expect(page.locator('.viewpill')).toHaveText(/^Show \d+ events$/);
      if (how === 'the pill') await page.tap('.viewpill'); else await page.goBack();
      await expect(page.locator('html')).not.toHaveClass(/map-open/);
      await expectAtFirstResult(page);
    });
  }

  test('changing the radius on the map also lands on the first result @mobile', async ({ page }) => {
    await openBoard(page, 'cities=pittsburgh%7Cpennsylvania&r=400&when=all');
    await page.evaluate(() => scrollTo(0, 3000)); await page.waitForTimeout(400);
    await page.tap('.viewpill');
    await page.tap('.rad__b[data-r="50"]');
    await expect(page).toHaveURL(/r=50/);
    await page.tap('.viewpill');
    await expect(page.locator('html')).not.toHaveClass(/map-open/);
    await expectAtFirstResult(page);
  });

  test('tapping a light on the map toggles that city @mobile', async ({ page }) => {
    await openBoard(page, 'cities=toronto%7Contario');
    await page.tap('.viewpill');
    await expect(page.locator('#mapView')).toHaveAttribute('data-center', /^43\./);
    await page.tap('#mapView');
    await expect(page.locator('#chips .chip')).toHaveCount(0);
  });

  test('the full-height sheet puts the pill out of reach, and gives it back @mobile', async ({ page }) => {
    await openBoard(page);
    await page.tap('#deckBtn');
    await page.tap('#cityq');
    await expect(page.locator('#controls')).toHaveClass(/deck-full/);
    await expect(page.locator('.viewpill')).toHaveAttribute('inert', '');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(page.locator('#deckBtn')).toHaveAttribute('aria-expanded', 'false');
    expect(await page.locator('.viewpill').getAttribute('inert')).toBeNull();
  });

  test('picks survive the back button and stay in the URL @mobile', async ({ page }) => {
    await openBoard(page);
    await page.tap('.viewpill');
    await page.fill('#mapq', 'toronto'); await page.tap('#mapopts li[data-key="toronto|ontario"]');
    await page.goBack();
    await expect(page).toHaveURL(/toronto/);
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

  test('with no city positions there is no pill and no map @mobile', async ({ page }) => {
    await page.route('**/data/places.json', (route) => route.abort());
    await openBoard(page);
    await expect(page.locator('.viewpill')).toHaveCount(0);
    await expect(page.locator('#map')).toHaveCount(0);
  });

  test('a failed download shows the retry in the open map, and the pill still returns to the list @mobile', async ({ page }) => {
    await page.route(/map-data.*\.js|NightMap.*\.js/, (r) => r.abort());
    await openBoard(page);
    await expect(page.locator('.map__retry')).toHaveCount(0);
    await page.tap('.viewpill');
    await expect(page.locator('.map__retry')).toBeVisible();
    await page.tap('.viewpill');
    await expect(page.locator('html')).not.toHaveClass(/map-open/);
    await expect(page.locator('.ev').first()).toBeVisible();
    await expect(page.locator('.map__retry')).toBeHidden();
  });

  test('opening moves focus to the map and closing returns it to the pill @mobile', async ({ page }) => {
    await openBoard(page);
    await page.tap('.viewpill');
    await expect(page.locator('#mapView')).toBeFocused();
    await expect(page.locator('main')).toHaveAttribute('inert', '');
    await page.tap('.viewpill');
    await expect(page.locator('.viewpill')).toBeFocused();
    expect(await page.locator('main').getAttribute('inert')).toBeNull();
  });

  test('reopening keeps the view, unless the picks changed while it was closed @mobile', async ({ page }) => {
    const center = () => page.locator('#mapView').getAttribute('data-center');
    await openBoard(page);
    await page.tap('.viewpill');
    await expect(page.locator('#mapView')).toHaveAttribute('data-center', /./);
    const home = await center();
    await expect(page.locator('#mapView')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect.poll(center).not.toBe(home);
    const moved = await center();
    await page.tap('.viewpill');
    await expect(page.locator('html')).not.toHaveClass(/map-open/);
    await page.tap('.viewpill');
    await expect(page.locator('html')).toHaveClass(/map-open/);
    await expect(page.locator('#mapView')).toBeFocused();
    expect(await center()).toBe(moved);
    await page.tap('.viewpill');
    await expect(page.locator('html')).not.toHaveClass(/map-open/);
    await page.tap('#deckBtn');
    await page.fill('#cityq', 'toronto');
    await page.tap('#citylist li[data-key="toronto|ontario"]');
    await expect(page.locator('#chips .chip')).toHaveCount(1);
    await page.tap('#deckDone');
    await page.tap('.viewpill');
    await expect(page.locator('#mapView')).toHaveAttribute('data-center', /^43\./);
  });
});
