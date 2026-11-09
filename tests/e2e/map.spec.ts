import { test, expect, type Page } from '@playwright/test';
import { dataset, expectedCount, isUpcoming, openBoard, shownCount } from './support';

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
});
