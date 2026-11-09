import { test, expect, type Page } from '@playwright/test';
import { dataset, today, isUpcoming, openBoard, shownCount, params, setWhen, choose, rows } from './support';

const ymd = (s: string) => s.replace(/-/g, '');
const nextDay = (iso: string) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

async function openMenu(_page: Page, row: ReturnType<Page['locator']>) {
  await row.locator('.addcal > summary').click();
  const menu = row.locator('.addcal__menu');
  await expect(menu.locator('a')).toHaveCount(5);
  return menu;
}

/** Is this element the one actually drawn on top at its own centre? */
async function onTop(loc: ReturnType<Page['locator']>) {
  // elementFromPoint only sees the viewport, so bring the element into it first.
  await loc.scrollIntoViewIfNeeded();
  return loc.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (hit === el || el.contains(hit));
  });
}

test.describe('Add to calendar', () => {
  test('dated upcoming rows offer it; undated rows do not', async ({ page }) => {
    await openBoard(page);
    const dated = rows(page).first().locator('..');
    await expect(dated.locator('.addcal > summary')).toHaveText(/\+ ?calendar/i);
    const tbd = page.locator('.evrow').filter({ has: page.locator('.ev__when--tbd') }).first();
    if (await tbd.count()) await expect(tbd.locator('.addcal')).toHaveCount(0);
  });

  test('the menu sits beside the row link, not inside it', async ({ page }) => {
    await openBoard(page);
    await expect(page.locator('.ev .addcal')).toHaveCount(0);
    expect(await page.locator('.evrow .addcal').count()).toBeGreaterThan(0);
  });

  test('offers five calendars with the right all-day dates', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    const row = page.locator('.evrow').filter({ has: page.locator('.addcal') }).first();
    const name = await row.locator('.ev__name').textContent();
    const ev = data.events.find((e) => e.name === name && e.next_date)!;
    const menu = await openMenu(page, row);
    await expect(menu.locator('a')).toHaveText(['Google Calendar', 'Outlook.com', 'Outlook / Microsoft 365', 'Yahoo Calendar', 'Apple Calendar / other (.ics)']);
    const endEx = nextDay(ev.next_date_end || ev.next_date!);

    const g = new URL((await menu.locator('a', { hasText: 'Google Calendar' }).getAttribute('href'))!);
    expect(g.searchParams.get('text')).toBe(ev.name);
    expect(g.searchParams.get('dates')).toBe(`${ymd(ev.next_date!)}/${ymd(endEx)}`);
    expect(g.searchParams.get('details')).toContain(ev.url);

    for (const label of ['Outlook.com', 'Outlook / Microsoft 365']) {
      const o = new URL((await menu.locator('a', { hasText: label }).getAttribute('href'))!);
      expect(o.searchParams.get('startdt')).toBe(ev.next_date);
      expect(o.searchParams.get('enddt')).toBe(endEx);
      expect(o.searchParams.get('allday')).toBe('true');
      expect(o.searchParams.get('subject')).toBe(ev.name);
    }
    const y = new URL((await menu.locator('a', { hasText: 'Yahoo' }).getAttribute('href'))!);
    expect(y.searchParams.get('st')).toBe(ymd(ev.next_date!));
    for (const a of await menu.locator('a:not([download])').all()) {
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', /noopener/);
    }
  });

  test('the .ics download is a valid all-day event', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    const row = page.locator('.evrow').filter({ has: page.locator('.addcal') }).first();
    const name = await row.locator('.ev__name').textContent();
    const ev = data.events.find((e) => e.name === name && e.next_date)!;
    const menu = await openMenu(page, row);
    const ics = menu.locator('a[download]');
    await expect(ics).toHaveAttribute('download', /\.ics$/);
    const download = await Promise.all([page.waitForEvent('download'), ics.click()]).then(([d]) => d);
    const text = await (await download.createReadStream()).toArray().then((c: Buffer[]) => Buffer.concat(c).toString('utf8'));
    const lines = text.split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toContain(`DTSTART;VALUE=DATE:${ymd(ev.next_date!)}`);
    expect(lines).toContain(`DTEND;VALUE=DATE:${ymd(nextDay(ev.next_date_end || ev.next_date!))}`);
    expect(lines.every((l) => /^[A-Z][A-Z-]*(;[^:]*)?:/.test(l))).toBe(true);
    expect(text).toContain(`URL:${ev.url}`);
  });

  test('an open menu is drawn on top of every row below it', async ({ page }) => {
    await openBoard(page);
    const row = page.locator('.evrow').filter({ has: page.locator('.addcal') }).first();
    const menu = await openMenu(page, row);
    for (const a of await menu.locator('a').all()) expect(await onTop(a), (await a.textContent()) ?? '').toBe(true);
  });

  test('one menu at a time; Escape and clicking away close it', async ({ page }) => {
    await openBoard(page);
    const withCal = page.locator('.evrow').filter({ has: page.locator('.addcal') });
    await test.step('open a first menu', async () => { await openMenu(page, withCal.nth(0)); });
    await test.step('opening a second menu closes the first', async () => {
      // The open menu is drawn on top of the rows below it, so the next row's
      // button may be under it — a person could not click it either. Use the
      // first row whose button sits clear below the menu, whatever the fonts.
      const menuBottom = (await page.locator('.addcal[open] .addcal__menu').boundingBox())!;
      let second = -1;
      for (let i = 1; i < Math.min(await withCal.count(), 12) && second < 0; i++) {
        const b = await withCal.nth(i).locator('.addcal > summary').boundingBox();
        if (b && b.y > menuBottom.y + menuBottom.height + 4) second = i;
      }
      test.skip(second < 0, 'no menu button below the first open menu on screen');
      await openMenu(page, withCal.nth(second));
      await expect(page.locator('.addcal[open]')).toHaveCount(1);
    });
    await test.step('Escape closes it', async () => {
      await page.keyboard.press('Escape');
      await expect(page.locator('.addcal[open]')).toHaveCount(0);
    });
    await test.step('clicking away closes it', async () => {
      await openMenu(page, withCal.nth(0));
      await page.locator('.masthead').click({ position: { x: 5, y: 5 } });
      await expect(page.locator('.addcal[open]')).toHaveCount(0);
    });
  });

  test('under Past, only events still in progress offer it', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page);
    const t = await today(page);
    await setWhen(page, 'past');
    const names = await page.locator('.evrow').filter({ has: page.locator('.addcal') }).locator('.ev__name').allTextContents();
    for (const n of names) {
      const ev = data.events.find((e) => e.name === n && e.next_date && e.next_date <= t && (e.next_date_end || e.next_date) >= t);
      expect(ev, `${n} is in progress`).toBeTruthy();
    }
  });
});

test.describe('Calendar view', () => {
  test('replaces the list, keeps the filters, and is written to the URL', async ({ page }) => {
    await openBoard(page);
    await page.locator('[data-view="calendar"]').click();
    await expect(page.locator('#cal')).toBeVisible();
    await expect(page.locator('#board')).toBeHidden();
    await expect(page.locator('#board .ev')).toHaveCount(0);
    await expect(page.locator('[data-view="calendar"]')).toHaveAttribute('aria-checked', 'true');
    expect((await params(page)).get('view')).toBe('calendar');
    await expect(page.locator('#count')).toContainText(/events? in \w+ \d{4}/);
  });

  test('shows whole weeks with today marked and selected', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    const t = await today(page);
    const cells = page.locator('.cal__day');
    expect((await cells.count()) % 7).toBe(0);
    await expect(page.locator('.cal__day.is-today')).toHaveCount(1);
    await expect(page.locator('.cal__day.is-sel')).toHaveAttribute('data-day', t);
    await expect(page.locator('.cal__dayview')).toBeVisible();
    const [y, m] = t.split('-');
    await expect(page.locator('.cal__title')).toHaveText(new RegExp(`${['January','February','March','April','May','June','July','August','September','October','November','December'][+m - 1]} ${y}`));
  });

  test('each day is one button; nothing inside it is separately clickable', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    const cells = page.locator('.cal__day');
    expect(await cells.evaluateAll((els) => els.every((e) => e.tagName === 'BUTTON' && e.hasAttribute('data-day')))).toBe(true);
    expect(await cells.evaluateAll((els) => els.some((e) => e.querySelector('a, button')))).toBe(false);
    await expect(page.locator('.cal__day[aria-pressed="true"]')).toHaveCount(1);
  });

  test('clicking anywhere in a day opens its full list', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    const t = await today(page);
    const busy = page.locator('.cal__day:not(.is-out)').filter({ has: page.locator('.cal__more') });
    const iso = await busy.last().getAttribute('data-day');
    test.skip(!iso || iso === t, 'no crowded day other than today this month');
    const n = Number(await page.locator(`.cal__day[data-day="${iso}"] .cal__count`).textContent());
    for (const part of ['.cal__more', '.cal__ev', '.cal__num']) {
      await page.locator(`.cal__day[data-day="${t}"]`).click();
      await expect(page.locator('.cal__day.is-sel')).toHaveAttribute('data-day', t);
      await page.locator(`.cal__day[data-day="${iso}"] ${part}`).first().click();
      await expect(page.locator('.cal__day.is-sel')).toHaveAttribute('data-day', iso!);
      await expect(page.locator('.cal__dayview .ev')).toHaveCount(n);
    }
    expect((await params(page)).get('day')).toBe(iso);
  });

  test('days lead with hackathons, show each title once, at most three', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    const report = await page.locator('.cal__day').evaluateAll((els) => els.map((c) => {
      const chips = Array.from(c.querySelectorAll('.cal__ev'));
      const names = chips.map((x) => (x.textContent || '').toLowerCase());
      const hack = chips.findIndex((x) => x.classList.contains('cal__ev--hack'));
      return { n: chips.length, unique: new Set(names).size === names.length, hackFirst: hack <= 0,
        count: Number(c.querySelector('.cal__count')?.textContent || 0),
        more: c.querySelector('.cal__more')?.textContent || '' };
    }));
    for (const d of report) {
      expect(d.n).toBeLessThanOrEqual(3);
      expect(d.unique).toBe(true);
      expect(d.hackFirst).toBe(true);
      if (d.more) expect(d.more).toBe(`+${d.count - d.n} more`);
    }
  });

  test('the day list dates rows to that day and offers + Calendar covering it', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    const t = await today(page);
    const later = page.locator('.cal__day:not(.is-out):not(.is-past)').filter({ has: page.locator('.cal__ev') });
    const iso = (await later.evaluateAll((els) => els.map((e) => e.getAttribute('data-day')))).find((d) => d! > t);
    test.skip(!iso, 'no later busy day this month');
    await page.locator(`.cal__day[data-day="${iso}"]`).click();
    await expect(page.locator('.cal__day.is-sel')).toHaveAttribute('data-day', iso!);
    const panelRows = page.locator('.cal__dayview .evrow');
    const n = await panelRows.count();
    expect(n).toBeGreaterThan(0);
    await expect(page.locator('.cal__dayview .addcal')).toHaveCount(n);
    for (let i = 0; i < Math.min(n, 6); i++) {
      const menu = await openMenu(page, panelRows.nth(i));
      const [a, b] = new URL((await menu.locator('a', { hasText: 'Google Calendar' }).getAttribute('href'))!).searchParams.get('dates')!.split('/');
      expect(a <= ymd(iso!) && ymd(iso!) < b, `${a}–${b} covers ${iso}`).toBe(true);
      for (const link of await menu.locator('a').all()) expect(await onTop(link)).toBe(true);
      await page.keyboard.press('Escape');
    }
  });

  test('a day gone by offers + Calendar only for editions still running', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    const t = await today(page);
    const gone = await page.locator('.cal__day.is-past:not(.is-out)').filter({ has: page.locator('.cal__ev') })
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-day')));
    test.skip(!gone.length, 'no past busy day this month');
    await page.locator(`.cal__day[data-day="${gone[0]}"]`).click();
    await expect(page.locator('.cal__day.is-sel')).toHaveAttribute('data-day', gone[0]!);
    for (const row of await page.locator('.cal__dayview .evrow').filter({ has: page.locator('.addcal') }).all()) {
      const menu = await openMenu(page, row);
      const end = new URL((await menu.locator('a', { hasText: 'Google Calendar' }).getAttribute('href'))!).searchParams.get('dates')!.split('/')[1];
      expect(end > ymd(t)).toBe(true);
      await page.keyboard.press('Escape');
    }
  });

  test('filters narrow the month', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page, 'view=calendar');
    const before = await shownCount(page);
    await choose(page, 'country', 'Canada');
    await expect.poll(() => shownCount(page)).toBeLessThan(before);
    const canadian = new Set(data.events.filter((e) => e.country === 'Canada').map((e) => e.name.toLowerCase()));
    for (const name of await page.locator('.cal__ev').allTextContents()) expect(canadian.has(name.toLowerCase()), name).toBe(true);
  });

  test('month navigation, today, and back to the list', async ({ page, request }) => {
    const data = await dataset(request);
    await openBoard(page, 'view=calendar');
    const t = await today(page);
    const title = await page.locator('.cal__title').textContent();
    await page.locator('.cal__nav[data-month="1"]').click();
    await expect(page.locator('.cal__title')).not.toHaveText(title!);
    await expect(page.locator('.cal__dayview')).toHaveCount(0);
    expect((await params(page)).get('month')).not.toBe(t.slice(0, 7));
    await page.locator('.cal__nav[data-month="-1"]').click();
    await expect(page.locator('.cal__title')).toHaveText(title!);
    await expect(page.locator('.cal__day.is-sel')).toHaveAttribute('data-day', t);
    await page.locator('.cal__nav[data-month="-1"]').click();
    await page.locator('.cal__today').click();
    await expect(page.locator('.cal__title')).toHaveText(title!);
    await page.locator('[data-view="list"]').click();
    await expect(page.locator('#board')).toBeVisible();
    expect(new URL(page.url()).search).toBe('');
    await expect.poll(() => shownCount(page)).toBe(data.events.filter(isUpcoming).length);
  });

  test('a month and day are restored from the URL', async ({ page }) => {
    await openBoard(page, 'view=calendar&month=2026-12&day=2026-12-10');
    await expect(page.locator('.cal__title')).toHaveText('December 2026');
    await expect(page.locator('.cal__day.is-sel')).toHaveAttribute('data-day', '2026-12-10');
  });

  test('each day shows a light sized by its count', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    const lit = page.locator('.cal__day.has-ev');
    expect(await lit.count()).toBeGreaterThan(0);
    const lights = await page.locator('.cal__day.has-ev:not(.is-out)').evaluateAll((els) => els.map((e) => ({
      g: Number(getComputedStyle(e).getPropertyValue('--g')),
      n: Number(e.querySelector('.cal__count')?.textContent || 0),
    })));
    for (const l of lights) { expect(l.g).toBeGreaterThan(0); expect(l.g).toBeLessThanOrEqual(1); }
    const busiest = lights.reduce((a, b) => (b.n > a.n ? b : a));
    expect(busiest.g).toBeCloseTo(1, 5);
    for (const l of lights) expect(l.g).toBeCloseTo(Math.min(1, Math.sqrt(l.n / busiest.n)), 3);
    // The light is the dot, not a gradient poured into the cell.
    expect(await page.locator('.cal__day').evaluateAll((els) => els.every((e) => getComputedStyle(e).backgroundImage === 'none'))).toBe(true);
  });

  test('a one-line note says what a day counts', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    await expect(page.locator('.cal__note')).toHaveText('Each day counts every event running that day.');
  });

  test('days of the neighbouring months say which month they belong to', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    const out = page.locator('.cal__day.is-out');
    test.skip(!(await out.count()), 'the month fills whole weeks');
    for (const mo of await out.locator('.cal__mo').allTextContents()) expect(mo).toMatch(/^[A-Z][a-z]{2}$/);
    expect(await out.evaluateAll((els) => els.every((e) => e.querySelector('.cal__mo')))).toBe(true);
    await expect(page.locator('.cal__day:not(.is-out) .cal__mo')).toHaveCount(0);
  });

  test('an empty opened day offers nothing when no day has events', async ({ page }) => {
    await openBoard(page, 'view=calendar&type=hackathon&cities=nowhere%7Cnone');
    await expect(page.locator('.cal__none')).toBeVisible();
    await expect(page.locator('.cal__next')).toHaveCount(0);
  });

  test('an empty opened day offers the next day with events, and tapping it opens that day', async ({ page }) => {
    const t = await today(page);
    let target: string | null = null;
    for (const type of ['hackathon', 'conference', 'workshop', 'ctf', 'game-jam', 'summit', 'meetup']) {
      await openBoard(page, `view=calendar&type=${type}`);
      const busy = await page.locator('.cal__day.has-ev').evaluateAll((els) => els.map((e) => e.getAttribute('data-day')!));
      const quietToday = !busy.includes(t);
      const later = busy.filter((d) => d > t).sort()[0];
      if (quietToday && later) { target = later; break; }
    }
    test.skip(!target, 'no filter leaves today empty with a later day busy');
    await expect(page.locator('.cal__day.is-sel')).toHaveAttribute('data-day', t);
    await expect(page.locator('.cal__none')).toBeVisible();
    await page.locator('.cal__next').click();
    await expect(page.locator('.cal__day.is-sel')).toHaveAttribute('data-day', target!);
    await expect(page.locator('.cal__next')).toHaveCount(0);
  });

  test('the sticky filter bar does not cover the calendar head when it is scrolled to', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    await page.locator('#cal').evaluate((el) => el.scrollIntoView());
    const bar = (await page.locator('.controls').boundingBox())!;
    const head = (await page.locator('.cal__head').boundingBox())!;
    expect(head.y).toBeGreaterThanOrEqual(bar.y + bar.height - 1);
  });

  test('calendar text keeps 4.5:1 contrast on today, past and neighbouring-month days', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    const ratios = await page.evaluate(() => {
      const parse = (c: string) => { const m = c.match(/[\d.]+/g)!.map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
      const mix = (f: { r: number; g: number; b: number; a: number }, b: { r: number; g: number; b: number }) =>
        ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a) });
      const lum = (c: { r: number; g: number; b: number }) => {
        const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
      };
      const ratio = (el: Element) => {
        const chain: Element[] = []; for (let n: Element | null = el; n; n = n.parentElement) chain.push(n);
        // The page ground is a gradient; its lightest stop (--g0, the sunward edge) is the worst case.
        let bg: { r: number; g: number; b: number } = parse(getComputedStyle(document.documentElement).getPropertyValue('--g0').trim().replace(/^#(..)(..)(..)$/, (_m, r, g, b) => `${parseInt(r, 16)} ${parseInt(g, 16)} ${parseInt(b, 16)}`));
        for (const n of chain.reverse()) {
          if (n === document.documentElement || n === document.body) continue;
          const cs = getComputedStyle(n);
          const b = parse(cs.backgroundColor);
          if (b.a > 0) bg = mix({ ...b, a: b.a * Number(cs.opacity) }, bg);
        }
        let op = 1; for (const n of chain) op *= Number(getComputedStyle(n).opacity);
        const fg = mix({ ...parse(getComputedStyle(el).color), a: op }, bg);
        const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
        return (hi + 0.05) / (lo + 0.05);
      };
      const sel = ['.is-today .cal__num', '.is-today .cal__count', '.is-past .cal__ev', '.is-past .cal__more',
        '.is-out .cal__num', '.is-out .cal__mo', '.is-out .cal__count', '.is-out .cal__ev', '.is-out .cal__more', '.cal__ev', '.cal__more'];
      return sel.map((s) => ({ s, rs: Array.from(document.querySelectorAll(`.cal__day ${s}`.replace('.cal__day .is-', '.cal__day.is-'))).map(ratio) }));
    });
    for (const g of ratios) expect(g.rs.length, `${g.s} matched nothing`).toBeGreaterThan(0);
    for (const g of ratios) for (const r of g.rs) expect(r, g.s).toBeGreaterThanOrEqual(4.5);
  });

  test('When and Sort do not apply in the calendar', async ({ page }) => {
    await openBoard(page, 'view=calendar');
    await expect(page.locator('.field--when')).toHaveCSS('pointer-events', 'none');
    await expect(page.locator('.resultbar__sort')).toHaveCSS('visibility', 'hidden');
  });
});
