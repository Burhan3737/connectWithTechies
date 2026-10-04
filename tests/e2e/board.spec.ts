import { test, expect } from '@playwright/test';
import { dataset, today, isUpcoming, isPast, openBoard, shownCount, params, setWhen, rows, watchErrors } from './support';

test.describe('Boot', () => {
  test('loads from data with no errors', async ({ page, request }) => {
    const errors = watchErrors(page);
    const data = await dataset(request);
    await openBoard(page);
    await expect(page).toHaveTitle(/connectWithTechies/i);
    await expect(rows(page).first()).toBeVisible();
    await expect(page.locator('#board')).toHaveAttribute('aria-busy', 'false');
    expect(errors, errors.join('\n')).toEqual([]);
    expect(data.events.length).toBeGreaterThan(100);
  });

  test('the tally counts the dataset', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    const tally = page.locator('.tally dd');
    await expect(tally).toHaveCount(5);
    const nums = (await tally.allTextContents()).map((t) => Number(t.match(/^\d+/)?.[0]));
    const cities = new Set(data.events.map((e) => `${e.city}|${e.region}`.toLowerCase()));
    expect(nums[0]).toBe(data.events.length);
    expect(nums[1]).toBe(cities.size);
    expect(nums[2]).toBe(data.events.filter((e) => e.status === 'upcoming').length);
    expect(nums[3]).toBe(data.events.filter((e) => e.status === 'recurring-tbd').length);
    expect(nums[4]).toBe(2);
  });

  test('the data date is stamped', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    await expect(page.locator('#stamp')).toContainText(data.generated_on);
    await expect(page.locator('#footmeta')).toContainText(`${data.events.length} events`);
  });
});

test.describe('The board', () => {
  test('Upcoming is the default and counts upcoming and undated annual events', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    await expect(page.locator('[data-when="upcoming"]')).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => shownCount(page)).toBe(data.events.filter(isUpcoming).length);
    await expect(page.locator('#count')).toContainText(/all cities/i);
  });

  test('Past and All change the count', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    const t = await today(page);
    await setWhen(page, 'past');
    await expect.poll(() => shownCount(page)).toBe(data.events.filter((e) => isPast(e, t)).length);
    expect((await params(page)).get('when')).toBe('past');
    await setWhen(page, 'all');
    await expect.poll(() => shownCount(page)).toBe(data.events.length);
    await setWhen(page, 'upcoming');
    expect((await params(page)).has('when')).toBe(false);
  });

  test('every row links to the organiser in a new tab', async ({ page, request }) => {
    const data = await dataset(request);
    const urls = new Set(data.events.map((e) => e.url));
    await openBoard(page);
    const links = await rows(page).evaluateAll((els) => els.slice(0, 60).map((a) => ({
      href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') })));
    expect(links.length).toBeGreaterThan(5);
    for (const l of links) {
      expect(l.href).toMatch(/^https?:\/\//);
      expect(urls.has(l.href!)).toBe(true);
      expect(l.target).toBe('_blank');
      expect(l.rel).toContain('noopener');
    }
  });

  test('a dated row shows its day, month, place and kind', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    const row = rows(page).first();
    const name = await row.locator('.ev__name').textContent();
    const ev = data.events.find((e) => e.name === name && e.next_date)!;
    expect(ev, `row "${name}" is an event`).toBeTruthy();
    const [y, m, d] = ev.next_date!.split('-');
    await expect(row.locator('.ev__d1')).toHaveText(d);
    await expect(row.locator('.ev__d2')).toHaveText(new RegExp(`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1]} ${y}`, 'i'));
    await expect(row.locator('.ev__city')).toHaveText(ev.city);
    await expect(row.locator('.ev__geo')).toContainText(ev.region);
    await expect(row.locator('.ev__geo')).toContainText(ev.country === 'Canada' ? 'CA' : 'US');
    await expect(row.locator('.ev__tag--kind')).toHaveText(ev.type.replace(/-/g, ' '));
  });

  test('upcoming rows run in date order under month headings', async ({ page }) => {
    await openBoard(page);
    const dated = await page.locator('#board').evaluate((board) => {
      const out: { group: string; day: string; mon: string }[] = [];
      let group = '';
      for (const n of Array.from(board.querySelectorAll('.groupbar, .ev'))) {
        if (n.classList.contains('groupbar')) group = n.textContent || '';
        else if (!n.querySelector('.ev__when--tbd')) out.push({ group, day: n.querySelector('.ev__d1')!.textContent!, mon: n.querySelector('.ev__d2')!.textContent! });
      }
      return out.slice(0, 80);
    });
    expect(dated.length).toBeGreaterThan(10);
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const key = (r: { day: string; mon: string }) => {
      const [mon, yr] = r.mon.trim().toLowerCase().split(/\s+/);
      return Number(yr) * 10000 + (months.indexOf(mon.slice(0, 3)) + 1) * 100 + Number(r.day);
    };
    for (let i = 1; i < dated.length; i++) expect(key(dated[i])).toBeGreaterThanOrEqual(key(dated[i - 1]));
    for (const r of dated) {
      const [mon, yr] = r.mon.trim().toLowerCase().split(/\s+/);
      expect(r.group.toLowerCase()).toContain(yr);
      expect(r.group.toLowerCase().slice(0, 3)).toBe(mon.slice(0, 3));
    }
  });

  test('undated annual events show their usual month', async ({ page, request }) => {
    const data = await dataset(request);
    const tbd = data.events.filter((e) => e.status === 'recurring-tbd' && /^[A-Z][a-z]+$/.test(e.month || ''));
    test.skip(!tbd.length, 'no undated annual events in this dataset');
    const ev = tbd[0];
    await openBoard(page, `q=${encodeURIComponent(ev.name)}`);
    const row = rows(page).filter({ has: page.locator('.ev__name', { hasText: ev.name }) }).first();
    await expect(row.locator('.ev__when--tbd')).toBeVisible();
    await expect(row.locator('.ev__when--tbd .ev__d1')).toHaveText(ev.month!.length > 9 ? `${ev.month!.slice(0, 8)}.` : ev.month!);
  });

  test('sort by city groups by city, by name groups by letter', async ({ page }) => {
    await openBoard(page, 'sort=city');
    const cityGroups = await page.locator('.groupbar').allTextContents();
    expect(cityGroups.slice(0, 5).every((g) => /, /.test(g))).toBe(true);
    const sortedCities = [...cityGroups.slice(0, 20)].sort((a, b) => a.localeCompare(b));
    expect(cityGroups.slice(0, 20)).toEqual(sortedCities);
    await openBoard(page, 'sort=name');
    const letters = await page.locator('.groupbar').allTextContents();
    expect(letters.slice(0, 5).every((g) => /^\s*\S\s*$/.test(g))).toBe(true);
  });

  test('an impossible filter shows the empty state, and reset restores everything', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page, 'q=zzzqqqxxx-no-such-event');
    await expect(page.locator('#empty')).toBeVisible();
    await expect.poll(() => shownCount(page)).toBe(0);
    await page.locator('#empty [data-reset]').click();
    await expect(page.locator('#empty')).toBeHidden();
    await expect.poll(() => shownCount(page)).toBe(data.events.length);   // reset shows everything (When = All)
    await expect(page.locator('#q')).toHaveValue('');
  });
});
