import { test, expect } from '@playwright/test';
import { dataset, isUpcoming, openBoard, shownCount, params, choose, rows } from './support';

const panel = (page: import('@playwright/test').Page, id: string) =>
  page.locator(`#${id}-dd`).locator('..').locator('.dd__panel');

test.describe('Dropdowns', () => {
  test('each filter has a labelled listbox trigger, defaulting to "all"', async ({ page }) => {
    await openBoard(page);
    for (const [id, label, all] of [['type', 'Kind', 'All kinds'], ['country', 'Country', 'Both countries'],
      ['region', 'Province / state', 'All provinces & states']] as const) {
      const t = page.locator(`#${id}-dd`);
      await expect(t).toHaveAttribute('aria-haspopup', 'listbox');
      await expect(t).toHaveAttribute('aria-expanded', 'false');
      await expect(t).toHaveText(all);
      await expect(page.locator(`label[for="${id}-dd"]`)).toHaveText(label);
    }
    await expect(page.locator('#sort-dd')).toHaveText('Date');
  });

  test('options show labels and counts in separate columns', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    await page.locator('#type-dd').click();
    const hack = panel(page, 'type').locator('[role="option"][data-value="hackathon"]');
    await expect(hack.locator('.dd__opt')).toHaveText('Hackathon');
    await expect(hack.locator('.dd__count')).toHaveText(String(data.events.filter((e) => e.type === 'hackathon').length));
    await expect(panel(page, 'type').locator('[role="option"]').first()).toHaveAttribute('aria-selected', 'true');
  });

  test('Kind narrows the board to that kind', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    await choose(page, 'type', 'Hackathon');
    await expect(page.locator('#type-dd')).toHaveText('Hackathon');
    await expect.poll(() => shownCount(page)).toBe(data.events.filter((e) => isUpcoming(e) && e.type === 'hackathon').length);
    expect(new Set(await rows(page).locator('.ev__tag--kind').allTextContents())).toEqual(new Set(['hackathon']));
    expect((await params(page)).get('type')).toBe('hackathon');
  });

  test('Country narrows the board, and the province list with it', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    await choose(page, 'country', 'Canada');
    await expect.poll(() => shownCount(page)).toBe(data.events.filter((e) => isUpcoming(e) && e.country === 'Canada').length);
    await page.locator('#region-dd').click();
    await expect(panel(page, 'region').locator('.dd__group')).toHaveText(['Canada']);
  });

  test('a province sets its country; another country clears it', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    await page.locator('#region-dd').click();
    await expect(panel(page, 'region').locator('.dd__group')).toHaveText(['United States', 'Canada']);
    await panel(page, 'region').locator('.dd__search').fill('ontar');
    await panel(page, 'region').locator('[role="option"][data-value="Ontario"]').click();
    await expect(page.locator('#country-dd')).toHaveText('Canada');
    await expect.poll(() => shownCount(page)).toBe(data.events.filter((e) => isUpcoming(e) && e.region === 'Ontario').length);
    expect(new Set((await rows(page).locator('.ev__geo').allTextContents()).map((g) => g.split('·')[0].trim()))).toEqual(new Set(['Ontario']));
    const p = await params(page);
    expect(p.get('region')).toBe('Ontario');
    await choose(page, 'country', 'United States');
    await expect(page.locator('#region-dd')).toHaveText('All provinces & states');
  });

  test('placeholder regions are not offered', async ({ page }) => {
    await openBoard(page);
    await page.locator('#region-dd').click();
    const values = await panel(page, 'region').locator('[role="option"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-value')));
    expect(values.filter((v) => /^(various|multiple|us & canada)$/i.test(v || ''))).toEqual([]);
    expect(values.length).toBeGreaterThan(40);
  });

  test('the province filter box narrows and says when nothing matches', async ({ page }) => {
    await openBoard(page);
    await page.locator('#region-dd').click();
    const search = panel(page, 'region').locator('.dd__search');
    await expect(search).toBeFocused();
    await search.fill('new');
    const shown = await panel(page, 'region').locator('[role="option"]:visible').evaluateAll((els) => els.map((e) => e.getAttribute('data-value')));
    expect(shown.length).toBeGreaterThan(2);
    expect(shown.every((v) => /new/i.test(v || ''))).toBe(true);
    await search.fill('zzzq');
    await expect(panel(page, 'region').locator('.dd__none')).toBeVisible();
  });

  test('keyboard: arrows open and move, Enter chooses, Escape closes', async ({ page }) => {
    await openBoard(page);
    await page.locator('#country-dd').focus();
    await page.keyboard.press('ArrowDown');
    await expect(panel(page, 'country')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('#country-dd')).toHaveText('Canada');
    await expect(page.locator('#country-dd')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(panel(page, 'country')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel(page, 'country')).toBeHidden();
    await expect(page.locator('#country-dd')).toHaveText('Canada');
  });

  test('one list open at a time; clicking away closes it', async ({ page }) => {
    await openBoard(page);
    await page.locator('#type-dd').click();
    await page.locator('#country-dd').click();
    await expect(panel(page, 'type')).toBeHidden();
    await expect(panel(page, 'country')).toBeVisible();
    await page.locator('.masthead').click({ position: { x: 5, y: 5 } });
    await expect(panel(page, 'country')).toBeHidden();
  });

  test('a list near the right edge stays on screen', async ({ page }) => {
    await openBoard(page);
    await page.locator('#region-dd').click();
    const box = await panel(page, 'region').boundingBox();
    const width = page.viewportSize()!.width;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  });
});

test.describe('URL state', () => {
  test('every filter is restored from a shared link', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page, 'q=ai&country=Canada&region=Ontario&type=meetup&when=all&sort=city');
    await expect(page.locator('#q')).toHaveValue('ai');
    await expect(page.locator('#country-dd')).toHaveText('Canada');
    await expect(page.locator('#region-dd')).toHaveText('Ontario');
    await expect(page.locator('#type-dd')).toHaveText('Meetup');
    await expect(page.locator('#sort-dd')).toHaveText('City');
    await expect(page.locator('[data-when="all"]')).toHaveAttribute('aria-checked', 'true');
    const n = await shownCount(page);
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(data.events.length);
  });

  test('a region-only link fills in its country', async ({ page }) => {
    await openBoard(page, 'region=Quebec');
    await expect(page.locator('#country-dd')).toHaveText('Canada');
    await expect(page.locator('#region-dd')).toHaveText('Quebec');
  });

  test('defaults leave the URL clean', async ({ page }) => {
    await openBoard(page);
    expect(new URL(page.url()).search).toBe('');
  });

  test('a filter survives a reload', async ({ page, request }) => {
    const data = await dataset(request);
    const n = data.events.filter((e) => isUpcoming(e) && e.type === 'conference').length;
    await openBoard(page);
    await choose(page, 'type', 'Conference');
    await expect.poll(() => shownCount(page)).toBe(n);
    await page.reload();
    await expect(page.locator('#type-dd')).toHaveText('Conference');
    await expect.poll(() => shownCount(page)).toBe(n);
  });
});
