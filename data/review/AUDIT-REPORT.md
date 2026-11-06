# Audit report — 2026-11-05 (iteration 2)

**Verdict: 1 DISCREPANCY** (0 blocking, 1 warning)

Scope: re-audit of the nov05 cycle after `nov05-audit-fixes.json` (the three iteration-1
fixes) and the orchestrator's repair of the retired-organiser name match
(`scripts/lib/changes.mjs` `retiredOrganisers()`, `scripts/feeds/run.mjs`, feed re-run from
cache). Curated: 998 -> 1044 (46 added, 1 removed: the duplicate taken out by i1-W2). All
records: 14259 -> 14920. 70 removed: 60 no longer listed, 8 organiser retired, 1 now
curated, 1 curated removed.

Mechanical audit: 60/60 queue rows have a ledger entry. There are no duplicate, consistency,
evidence or re-date flags. The one curated removal has a recorded reason. Its 2 blocking
link findings are the same probe artefacts as in iteration 1 (see "Checked and sound").

## Blocking

None.

## Warnings

- **JEWEL CITY HACKS 6.0 (Glendale, 2026-11-14) and Seattle AI Power Holiday Evening
  (Bellevue, 2026-12-06)**: these are live tech events that were removed as "no longer
  listed". Both pages are up:
  - `https://luma.com/jewelcityhacks6` returns 200, with JSON-LD start 2026-11-14 at Glendale
    Community College. It is a Hacker Fund hackathon.
  - `https://luma.com/edixsj8w` returns 200, start 2026-12-06, at Mirra, Bellevue. It has the
    same Luma id (`evt-BqeK5TgXhj9xEA7`) as the removed "Seattle AI Founders & Investors
    Christmas party"; the organiser only retitled it.

  Neither id appears in today's cached Luma reads. Both came in by `luma-area:*`, and
  `takenDown()` treats a "complete" area listing as vouching for every event it once
  carried, so dropping off the listing reads as cancellation. Luma's area listing does not
  show every live event. Both titles still pass the gate today ("title: hacks";
  "title: founders, ai").
  
  In a sample of 10 future-dated "no longer listed" rows, 6 are really gone:
  - Founders Roundtable x2 (Annapolis): Private Event
  - Sales OStin (Austin): 404
  - STLGameDev Holiday Party (St. Louis): 404
  - AI Around the World (Kings County): "This event was canceled"
  - AI Revolution (Philadelphia): Cancelled

  Of the other 4:
  - These 2 are wrongly lost.
  - InsurTech 2027 Spring Conference (Pier 60, New York, 2027-04-05/06) was read today and
    judged "no tech signal". Its unregistered Luma organiser no longer earns the "registered
    tech organiser" verdict, which is re-derived each run from the titles seen.
  - IOS West (Las Vegas) is industrial-outdoor-storage dealmaking, so dropping it is right.

  This is **not a regression of this run**. 60 sits within the 56-69 range of the last
  three refreshes, and the rule is the one noted under 2026-10-07-i3-W2 (Hardware + AI
  Boston), which was closed with the rule unchanged.
  
  **Do:**
  - Restore the two events, either as curated records or by un-removing the feed rows.
  - Consider curating InsurTech 2027 Spring Conference, since the directory already holds
    InsurTech Hartford and America records.
  - In a future pass, re-fetch a future event's own page before taking it down for missing
    from a `luma-area` listing.

## Checked and sound

Iteration-1 fixes, all landed (`nov05-audit-fixes.json`, recorded in APPLIED.md):
- **i1-B1 InfoSec Nashville**: `url` is now
  `https://issamidtn.org/infosec-nashville-cybersecurity-conference/`. The audit probe
  resolves it. Plain curl gets a 403 bot wall, which is not a dead link.
- **i1-W1 API Conference New York**: `source` is now `https://devm.io/newyork-week/`.
- **i1-W2 Startup Sioux Falls Founders Meetup**: removed. Founders Meetup Sioux Falls
  remains, with next_date 2026-11-18.

Retired-organiser name match (the orchestrator's regression fix):
- `retiredOrganisers()` no longer returns "Organizer". None of the ~100 retired names is a
  name a non-retired registry source carries.
- All 36 feed events at HEAD whose organiser is named "Organizer", apart from the retired
  one, are in both `data/raw/feed.json` and `data/events.json` now.
- The only "Organizer" event gone is the retired organiser's own, Forward Deploy Enterprise
  AI Summit 2026 (Toronto). Its event page is 404 and the organiser page is 410, so the
  removal is right. It is filed under "no longer listed" rather than "organiser retired",
  because the name is no longer matched. The id path (`retiredIds.has(r.feed_via)`) still
  drops it. This only affects which bucket CHANGES.md files it under.
- Registry diff against HEAD: only the two intended `tech` flips (Startup Sioux Falls ical,
  eventbrite:121647917107).

CHANGES.md removals:
- 70 = 60 + 8 + 1 + 1. My recomputation with `diffEvents` against HEAD gives the same split.
- The 8 "organiser retired" rows are all the Startup Sioux Falls ical feed and all past
  (Oct 5-28). Iteration 1 already confirmed that retirement.
- The "now curated" row is BostonHacks (MLH), taken over under the same id.
- The "curated removed" row is the i1-W2 duplicate.
- "No longer listed": see the warning above. No source failed this run
  (`failedSources: []`), and no delisting threshold was crossed.

Link-probe artefacts (same as iteration 1):
- `https://associationforsoftwaretesting.org/` (CAST) returns 200 on re-probe.
- `agilealliance.org/event/agile2027/` returns 200 after redirecting to
  `/event/agile2027-an-agile-alliance-x-pmi-event/`.

The rest of the nov05 judgement sample (removals, re-checks, adds, aggregator sources,
in-person/tech/city) was verified in iteration 1 and has not changed since. Only the three
fix patches touched curated data.
