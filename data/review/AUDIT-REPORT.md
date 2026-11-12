# Audit report — 2026-11-12

**Verdict: 2 DISCREPANCIES** (2 blocking, 2 warnings)

Scope: nov12 cycle. Re-check passes nov12-t1/t2/t3 (60 dispatched rows, 6 corrections), discovery passes nov12-r1/r2/d1/d2 (31 adds), organiser follows/retirements (sources-nov12-*.json). Mechanical audit (`audit-run.mjs`): 0 blocking, 0 warnings, 60/60 ledger, 31/31 links. Both blocking findings below are things that check did not catch.

## Blocking

- **Four nov12-t1 corrections did not land: Milwaukee Tech Hub Code & Coffee (Milwaukee), SecKC (Kansas City), tech SAVannah Tech Tuesday (Savannah), Venture Café Phoenix Thursday Gathering (Phoenix).**
  APPLIED.md logs the nov12-t1 UPDATEs, but in the same run it logs older oct05-r1, oct29-t1 and oct31-t1 UPDATEs to these same records *after* them. Those older updates put back the November dates, and the build then rolled them into the past. In events.json all four now read `next_date: ""` and `status: recurring-tbd`, with no upcoming date.
  Cause: `scripts/lib/patch-order.mjs` dates a pass by `today()`, and `today()` uses Honolulu time. The apply ran at about 03:00 EST on Nov 12, when it was still 2026-11-11 in Honolulu (the APPLIED.md section header reads `## 2026-11-11`). So `patchDate("nov12-…", "2026-11-11")` returned **2025-11-12**, and every nov12 file replayed *first* instead of last. The 30 adds and the two nov12-t2 updates were unaffected because no older patch touches those records.
  I re-read the organiser pages today and the curator’s evidence holds:
  - meetup.com/mitobyte: "December Code & Coffee Sat, Dec 5 · 9:00 AM CST, Wantable Cafe"
  - seckc.org: "Dec 8 December 8, 2026 SecKC - December 2026"
  - meetup.com/techsav: "Tech Tuesday Tue, Dec 8 · 5:30 PM EST, Hop Atomica"
  - community.venturecafephoenix.org/events/249: "Nov 12, 2026, 4:30 PM - 7:00 PM MST". Event 250 is Nov 19, 2026.

  **Fix:** re-run apply and build once Honolulu’s date is 2026-11-12 (after 10:00 UTC), or now with `TODAY=2026-11-12`. Do not add a new patch named `nov12-*`, because it would mis-sort the same way. The expected result:
  - Milwaukee Tech Hub Code & Coffee (Milwaukee): `next_date` 2026-12-05, `next_date_end` 2026-12-05, `status` upcoming, `last_date` 2026-11-07
  - SecKC (Kansas City): `next_date` 2026-12-08, `next_date_end` 2026-12-08, `status` upcoming, `last_date` 2026-11-10
  - tech SAVannah Tech Tuesday (Savannah): `next_date` 2026-12-08, `next_date_end` 2026-12-08, `status` upcoming, `last_date` 2026-11-10
  - Venture Café Phoenix Thursday Gathering (Phoenix): `next_date` 2026-11-12, `next_date_end` 2026-11-12, `status` upcoming, `last_date` 2026-11-05. If this lands on or after 2026-11-13, set instead `next_date`/`next_date_end` 2026-11-19, `last_date` 2026-11-12, `source` https://community.venturecafephoenix.org/events/250.

  Structural fix, so it does not recur: make `patchDate` accept a pass dated up to a few days ahead of `today()` as the current year. Curators name passes by the Eastern date, which runs up to a day ahead of Honolulu.

- **DubHacks (Seattle): added by nov12-d1, then merged away by the build.**
  The record is in data/raw/discovered.json but not in events.json, which is why CHANGES.md shows 30 curated adds rather than 31. "DubHacks" and "DubHacks NEXT Demo Day" were both added with `url: https://dubhacks.co/` in Seattle. `samePageSameEvent` in build-data.mjs treats two records on the same page as one event when one name contains the other, so the hackathon was merged into the Demo Day record. The surviving record carries the Demo Day data (`last_date` 2026-05-07). The flagship hackathon is lost; dubhacks.co confirms it ran "October 17-18, 2026, University of Washington, Seattle".
  **Fix:** update DubHacks NEXT Demo Day (Seattle) to `url: https://next.dubhacks.co/`. That is the incubator’s own site: dubhacks.co links to it as "NEXT Website", and it returns 200 with the title "DubHacks Next". With separate pages, both records survive the build. Then confirm "DubHacks — Seattle" is listed in CHANGES.md under Curated adds.

## Warnings

- **The Reinforcement Learning Conference (RLC) (Providence): `last_date` 2026-08-15 belongs to an edition held somewhere else.**
  rl-conference.cc/2026/ held the 2026 edition in Montreal. The nov12-t2 curator noted this and kept it. The new `next_date` (2027-08-02..06, Brown University) is correct per rl-conference.cc/2027/ ("Conference (Providence) August 2 - 6"). But the record now says the event was last held in Providence on a date when it was in Montreal. Earlier editions were in Amherst (2024) and Edmonton (2025), not Providence.
  **Fix:** set `last_date` to "" on the Providence record. This was not introduced by this run, so it is low priority.

- **The mechanical audit cannot see either blocking failure.**
  `audit-run.mjs` reported 0/0. It does not check that each patch op’s `set` values are present in events.json, and coverage reported "30 added" without comparing that to the 31 adds in the patch files. The build merges a just-added curated record into a different-named curated record without warning.
  **Fix (tooling):** in audit-run, compare every update op of this cycle’s patches field by field, and every add for presence, against events.json. Flag anything that did not land. In build-data, warn when two curated records with different names merge by page.

## Checked and sound

- **PROPOSED-moves.json (Techstars Boston / NYC Demo Day → 2027-03-08): correctly not applied. Reject it.** Both techstars.com accelerator pages read "Mar 08 2027 Accelerator Starts / Jun 03 2027 Demo Day". The JSON-LD `startDate` is the programme start, and the stored 2027-06-03 is still on the page. The confirm (t1) and the new Techstars NYC add are right. The NYC programme says "in-person sessions at the start, midpoint, and demo day".
- **InfoSec Nashville** 2027-09-08..09: the organiser page says "Save the date for InfoSec 2027 September 8 - 9". Correct.
- **Re-checks:** Splunk .conf (Chicago, McCormick Place) and SpiceWorld (Austin, Nov 12-13) were confirmed against pages that still say so.
- **New adds re-read:**
  - Cognite Impact (Houston, May 10-13 2027, Hilton of the Americas)
  - LDX3 New York (Sept 8-9 2027; "first year in New York")
  - UXCON (Silver Spring, Oct 6-7 2027)
  - Global AI Conference Toronto (May 29)
  - CyberSci Toronto Regional (Nov 21 2026, Toronto among the regional cities)
  - The Jam @ GDC (kick-off Feb 28 at Moscone)
  - Tech Alley Vegas (3rd Saturday, Nov 21)
  - Kong Summit (2026 at the InterContinental, Los Angeles)
  - Global Game Jam Vancouver (Douglas College, New Westminster; the city placement is right)
  - Data Saturday Chicago ("planning is underway", recurring-tbd is right)
  - DubHacks NEXT Demo Day (luma: May 7, Kane Hall)
- **Removals and city changes:** no curated removals and no city changes this cycle. The four "organiser retired" feed removals match sources-nov12-feed.json (synth meetup, repair circle, NGO networking: none of them tech).
- **No aggregator sources:** no new date takes its source from dev.events, 10times or an Eventbrite search page.
- **Borderline but acceptable:** UMassCTF (Amherst) is mainly an online CTF with an in-person starting ceremony in CSL E144.
