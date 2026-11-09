import { test, expect } from '@playwright/test';
import { dataset, today, isUpcoming, isPast, standing, openBoard, shownCount, params, setWhen, rows, watchErrors } from './support';

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
    // As each event stands today, not as the data build filed it.
    expect(nums[2]).toBe(data.events.filter((e) => standing(e).status === 'upcoming').length);
    expect(nums[3]).toBe(data.events.filter((e) => standing(e).status === 'recurring-tbd').length);
    expect(nums[4]).toBe(2);
  });

  test('the data date is stamped', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    await expect(page.locator('#footmeta')).toContainText(data.generated_on);
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
    // The board is virtualised: only rows within a screen (plus 1600px) exist.
    // How many that is depends on how tall today's top rows are, so on a
    // default-height screen it fell to exactly 10 on 2026-11-06 with the same
    // data that passed on 11-03. A tall window keeps enough rows to compare.
    await page.setViewportSize({ width: page.viewportSize()?.width ?? 1280, height: 2400 });
    await openBoard(page);
    const dated = await page.locator('#board').evaluate((board) => {
      const out: { group: string; day: string; mon: string }[] = [];
      let group = '';
      for (const n of Array.from(board.querySelectorAll('.groupbar, .ev'))) {
        if (n.classList.contains('groupbar')) group = n.textContent || '';
        // Events under way sit in a leading On now group, ahead of the month headings.
        else if (group.trim() !== 'On now' && !n.querySelector('.ev__when--tbd')) out.push({ group, day: n.querySelector('.ev__d1')!.textContent!, mon: n.querySelector('.ev__d2')!.textContent! });
      }
      return out.slice(0, 80);
    });
    const headings = (await page.locator('#board .groupbar').allTextContents()).map((t) => t.trim());
    if (headings.includes('On now')) expect(headings[0]).toBe('On now');
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
    const tbd = data.events.map((e) => standing(e)).filter((e) => e.status === 'recurring-tbd' && /^[A-Z][a-z]+$/.test(e.month || ''));
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

test('the masthead speaks as a night map and uses the new type', async ({ page }) => {
  await openBoard(page);
  await expect(page.locator('.masthead__sub')).toContainText('A night map of the tech events');
  await expect(page.locator('body')).not.toContainText('departures board');
  const font = await page.locator('.ev__name').first().evaluate((e) => getComputedStyle(e).fontFamily);
  expect(font).toContain('B612');
  await expect(page.locator('.tally dd')).toHaveCount(5);
});

test.describe('Time bands', () => {
  test('Next week jumps without filtering', async ({ page }) => {
    await openBoard(page, 'cities=seattle%7Cwashington');
    const before = await page.locator('#count').textContent();
    await page.locator('.rail [data-band=nextWeek]').click();
    const seam = page.locator('.seam', { hasText: 'Next week' });
    await expect(seam).toBeInViewport();
    await expect(page.locator('#count')).toHaveText(before!);
    // It lands clear of the sticky filter bar, and the rail follows the screen, not the overscan.
    await expect.poll(async () => (await seam.boundingBox())!.y - (await page.locator('#controls').boundingBox())!.y
      - (await page.locator('#controls').boundingBox())!.height).toBeGreaterThanOrEqual(-1);
    await expect(page.locator('.rail [data-band=nextWeek]')).toHaveAttribute('aria-current', 'true');
  });

  test('the rail follows an instant jump far down the list', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openBoard(page);
    await expect(page.locator('.rail [data-band=weeks6plus]')).toBeVisible();
    await page.locator('.rail [data-band=weeks6plus]').click();
    await expect(page.locator('.seam', { hasText: '6+ weeks' })).toBeInViewport();
    // A long instant jump can land a row short of the seam, so the band above may still be
    // the first on screen; what must not happen is the rail staying where the list began.
    await expect(page.locator('.rail [aria-current=true]')).toHaveAttribute('data-band', /weeks2to5|weeks6plus/);
  });

  test('Next week jumps from the chips on a phone @mobile', async ({ page }) => {
    await openBoard(page, 'cities=seattle%7Cwashington');
    await expect(page.locator('.rail')).toHaveCount(0);
    const before = await page.locator('#count').textContent();
    await page.locator('.jumps [data-band=nextWeek]').click();
    const seam = page.locator('.seam', { hasText: 'Next week' });
    await expect(seam).toBeInViewport();
    // Clear of the sticky month heading.
    await expect.poll(async () => (await seam.boundingBox())!.y - (await page.locator('.groupbar').boundingBox())!.y
      - (await page.locator('.groupbar').boundingBox())!.height).toBeGreaterThanOrEqual(-1);
    await expect(page.locator('#count')).toHaveText(before!);
  });
});
