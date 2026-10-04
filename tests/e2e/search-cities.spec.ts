import { test, expect } from '@playwright/test';
import { dataset, isUpcoming, openBoard, shownCount, params, rows, type Ev } from './support';

/** Accent- and case-insensitive, as a person typing expects. */
const fold = (s: unknown) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const haystack = (e: Ev & { audience?: string }) => fold([e.name, e.description, e.city, e.region, e.country, e.venue,
  e.type, e.audience, (e.topics || []).join(' ')].join(' · '));
const cityKey = (e: Ev) => `${fold(e.city)}|${fold(e.region)}`;

test.describe('Search', () => {
  test('narrows to events mentioning the words, anywhere in the listing', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    await page.locator('#q').fill('hackathon');
    const expected = data.events.filter((e) => isUpcoming(e) && haystack(e).includes('hackathon')).length;
    await expect.poll(() => shownCount(page)).toBe(expected);
    expect((await params(page)).get('q')).toBe('hackathon');
  });

  test('highlights the match', async ({ page }) => {
    await openBoard(page, 'q=summit');
    await expect(page.locator('#board mark').first()).toHaveText(/summit/i);
  });

  test('ignores accents and case', async ({ page, request }) => {
    const data = await dataset(request);
    const accented = data.events.find((e) => /[éèàçô]/i.test(e.name));
    test.skip(!accented, 'no accented names in this dataset');
    const word = accented!.name.split(/\s+/).find((w) => /[éèàçô]/i.test(w))!.replace(/[^\p{L}]/gu, '');
    await openBoard(page, 'when=all');
    await page.locator('#q').fill(fold(word).toUpperCase());
    await expect(page.locator('#board .ev__name', { hasText: accented!.name }).first()).toBeVisible();
  });

  test('treats input as text, never markup', async ({ page }) => {
    let dialogs = 0;
    page.on('dialog', (d) => { dialogs++; d.dismiss(); });
    await openBoard(page);
    await page.locator('#q').fill('<img src=x onerror=alert(1)>');
    await expect.poll(() => shownCount(page)).toBe(0);
    await expect(page.locator('#board img, #empty img')).toHaveCount(0);
    expect(dialogs).toBe(0);
  });

  test('is restored from the URL', async ({ page }) => {
    await openBoard(page, 'q=bsides');
    await expect(page.locator('#q')).toHaveValue('bsides');
    await expect(page.locator('#board .ev__name').first()).toContainText(/bsides/i);
  });
});

test.describe('Cities', () => {
  test('typing suggests cities with their region and event count', async ({ page }) => {
    await openBoard(page);
    await page.locator('#cityq').fill('toron');
    const first = page.locator('#citylist li[data-key]').first();
    await expect(first).toBeVisible();
    await expect(first).toContainText('Toronto');
    await expect(first.locator('small')).toHaveText(/Ontario · \d+/);
    await expect(page.locator('#cityq')).toHaveAttribute('aria-expanded', 'true');
  });

  test('Enter adds the first suggestion as a chip and narrows the board', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    await page.locator('#cityq').fill('toronto');
    await page.locator('#cityq').press('Enter');
    await expect(page.locator('#chips .chip')).toHaveCount(1);
    await expect(page.locator('#chips .chip')).toContainText('Toronto, Ontario');
    const expected = data.events.filter((e) => isUpcoming(e) && cityKey(e) === 'toronto|ontario').length;
    expect(await shownCount(page)).toBe(expected);
    await expect(page.locator('#count')).toContainText('1 city');
    expect((await params(page)).get('cities')).toBe('toronto|ontario');
    await expect(page.locator('#cityq')).toHaveValue('');
  });

  test('arrow keys choose among suggestions; several cities combine', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    await page.locator('#cityq').fill('san f');
    await page.locator('#cityq').press('ArrowDown');
    await expect(page.locator('#citylist li[aria-selected="true"]')).toHaveCount(1);
    await page.locator('#cityq').press('Enter');
    await page.locator('#cityq').fill('seattle');
    await page.locator('#citylist li[data-key]').first().click();
    await expect(page.locator('#chips .chip')).toHaveCount(2);
    const keys = (await params(page)).get('cities')!.split(',');
    expect(keys).toHaveLength(2);
    const expected = data.events.filter((e) => isUpcoming(e) && keys.includes(cityKey(e))).length;
    expect(await shownCount(page)).toBe(expected);
    await expect(page.locator('#count')).toContainText('2 cities');
  });

  test('a chosen city is not suggested again', async ({ page }) => {
    await openBoard(page, 'cities=toronto|ontario');
    await page.locator('#cityq').fill('toronto');
    await expect(page.locator('#citylist li[data-key="toronto|ontario"]')).toHaveCount(0);
  });

  test('no match says so', async ({ page }) => {
    await openBoard(page);
    await page.locator('#cityq').fill('qqqzzz');
    await expect(page.locator('#citylist .citylist__none')).toBeVisible();
  });

  test('chips remove one at a time; Backspace removes the last; clear removes all', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page, 'cities=toronto|ontario,seattle|washington,austin|texas');
    await expect(page.locator('#chips .chip')).toHaveCount(3);
    await page.locator('#chips .chip button').first().click();
    await expect(page.locator('#chips .chip')).toHaveCount(2);
    await page.locator('#cityq').focus();
    await page.locator('#cityq').press('Backspace');
    await expect(page.locator('#chips .chip')).toHaveCount(1);
    await expect(page.locator('#chips .chip')).toContainText('Seattle');
    await page.locator('#clearCities').click();
    await expect(page.locator('#chips .chip')).toHaveCount(0);
    expect(await shownCount(page)).toBe(data.events.filter(isUpcoming).length);
  });

  test('Escape and clicking away close the suggestions', async ({ page }) => {
    await openBoard(page);
    await page.locator('#cityq').fill('van');
    await expect(page.locator('#citylist')).toBeVisible();
    await page.locator('#cityq').press('Escape');
    await expect(page.locator('#citylist')).toBeHidden();
    await page.locator('#cityq').fill('vanc');
    await expect(page.locator('#citylist')).toBeVisible();
    await page.locator('.masthead, header').first().click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#citylist')).toBeHidden();
  });

  test('rows from a chosen city are all in that city', async ({ page }) => {
    await openBoard(page, 'cities=toronto|ontario&when=all');
    const cities = await rows(page).locator('.ev__city').allTextContents();
    expect(cities.length).toBeGreaterThan(0);
    expect(new Set(cities)).toEqual(new Set(['Toronto']));
  });
});
