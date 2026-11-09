import { test, expect } from '@playwright/test';
import { dataset, isUpcoming, openBoard, shownCount } from './support';

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
