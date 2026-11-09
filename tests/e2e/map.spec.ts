import { test, expect, type Page } from '@playwright/test';
import { dataset, expectedCount, isUpcoming, openBoard, params, shownCount } from './support';

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
