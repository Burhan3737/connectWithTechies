# Audit report — 2026-11-27

**Verdict: 1 DISCREPANCY** (1 blocking, 0 warnings)

Scope: the nov27 cycle. Re-check passes nov27-r1/r2/r3 (60 dispatched rows: 44 confirmed, 12 corrected, 4 blocked).
Discovery passes nov27-c1/c2 (10 cities, 13 adds, 1 city correction). Sources files c1, c2 and gate.
Mechanical audit: 1212 -> 1223 curated events, 0 curated gone by name, 60 feed delistings (inside the 56-69 baseline),
60/60 queue coverage, 15/15 new or changed links resolve.

## Blocking

- **Bank Technology & Operations Conference & Showcase (published as New York, New York; should be Manhattan, Kansas)**
  - **What is wrong:** nov27-r3 correctly moved the 2027 edition from Wichita to Manhattan, KS. The raw record
    (`data/raw/us-central.json`, line 1336) says `"city": "Manhattan", "region": "Kansas"`. The build then
    rewrote it through the bare alias `'manhattan': ['New York', 'New York']` in `scripts/lib/places.mjs` line 14.
    `canonPlace()` applies a bare alias whatever the region is, so `data/events.json` now publishes a Kansas
    Bankers Association conference as `city: "New York", region: "New York"`, with id
    `bank-technology-operations-conference-showcase-new-york`. Kansas users will not find it, and New York users will
    see a Kansas bankers' event.
  - **Evidence:** the organiser's page
    https://ksbankers.com/conference/2027-bank-technology-operations-conference-and-showcase/ reads
    "2027 Bank Technology & Operations Conference and Showcase February 9-10, 2027 Hilton Garden Inn, Manhattan, KS",
    and "A block of sleeping rooms has been reserved at the Hilton Garden Inn for the nights of February 8 and 9".
  - **Why the mechanical audit missed it:** per-region counts net out, because Kansas lost this event and gained
    Energy & Data Center Innovation Summit (Kansas City, KS). Nothing checks that the published region matches the
    raw region.
  - **Fix (verified):** the curator's data is right, so do not patch the raw record. Scope the alias to New York in
    `scripts/lib/places.mjs`: replace `'manhattan': ['New York', 'New York']` with
    `'manhattan|new york': ['New York', 'New York']` (add `'manhattan|ny'` too if postal codes appear), then rebuild.
    Expected result: `city: "Manhattan", region: "Kansas"`, id `bank-technology-operations-conference-showcase-manhattan`.
    I scanned every `data/raw/*.json` record for a bare city alias that overrides a different region. This is the only
    record affected, and no raw record uses Manhattan with a New York region, so the change cannot move anything else.

## Warnings

None.

## Checked and sound

- **Mechanical "duplicate" Car.HMI USA / Tech.AD USA (Dearborn) is a false positive. Do not act on it.** These are
  two separate we.CONECT conferences, held side by side, each with its own Tito page and its own programme.
  ti.to/weconect/carhmi-usa: "Car.HMI USA 2026 December 1st-2nd, 2026 The Henry, Dearborn MI ... automotive HMIs and
  UX". ti.to/weconect/tech-ad-usa: "Tech.AD USA 2026 December 1st-2nd, 2026 The Henry, Dearborn MI ... vehicle
  automation ... 300+ stakeholders". Both records existed before this run. The r3 correction (2026-12-01 to 12-02, new
  2026 Tito URLs) is right for both. The audit-run duplicate rule will keep flagging this pair until Dec 2.
- **City changes:** TechConnect WV Women in Tech, South Charleston -> Huntington. techconnectwv.org/women-and-tech
  reads "Women & Tech Conference 13 FEBRUARY ... our 2026 theme ... FRIDAY 8:30AM - 3:30PM EST Double Tree by Hilton
  Huntington, WV". South Charleston is only TechConnect's office address in the footer. Sound. Bank Tech's move to
  Manhattan, KS is also right at the data level (see Blocking for the build problem).
- **Large date moves (recurring-tbd rows that got dates):** Triangle Game Jam 2027-02-13..21. The NCSU page names a
  Feb 13 kickoff at Duke, a Feb 14 work day and a Feb 21 showcase at NC State, and registration closes Feb 5, 2027.
  Business+AI Forum 2026-12-02 (Stevens page and JSON-LD: "the third Business+AI Forum on December 2"). Summercon
  2027-07-09..10 ("Summercon XL July 9-10, 2027 · gowanus, brooklyn"; Littlefield, Ornate Studios, Lucky 13).
  IEEE Cloud Summit 2027-06-24..25 (/2027-cfp: "Dates: June 24-25, 2027 | Location: Washington DC"). Cybersecurity,
  Stronger Together 2027-04-21 ("SAVE THE DATE 3rd Annual ... April 21, 2027", 2026 "Held February 3, 2026").
  BSidesSF 2027-04-03..04. ConUHacks 2027-02-06..07 (Concordia, John Molson Building). FIRST Championship
  2027-04-28..05-01. BSides ICS/OT 2027-02-08, Tampa. All match the organiser pages word for word.
- **Random confirmed rows:** AI Tinkerers San Diego (JSON-LD 2026-12-03T17:00-08:00, OfflineEventAttendanceMode).
  PA TechCon ("08.12.2027" in the h1). Tech Week Grand Rapids ("tech week 2027 9.13 - 9.18"). AI & Big Data Expo
  North America: the live site is now back and reads "June 16-17, 2027 San Jose McEnery Convention Center", which
  agrees with the Wayback-based confirm. Beer City Code (Aug 14-15, 2026). DC864 (1st Thursday, OpenWorks, hybrid).
  All evidence matched the pages.
- **New adds, all checked on organiser pages:** FrostCon (bsidesclt.org homepage: "FrostCon 3 When: December 2
  Where: Booth Playhouse"; the year inference holds). CyberCon Huntington ("April 12-14, 2027"). Irvine Tech Day
  ("MAY 7-9, 2026 • IRVINE"). Educational Technology Day ("SAVE THE DATE - MARCH 18, 2027"). Networking@Rev
  Prototyping Demo Day (JSON-LD 2027-07-29T18:00-04:00). Aerium ("June 2-4, 2027 | Johnstown, PA"). EDCI
  ("November 13, 2026 Sporting Park - Kansas City, Kansas"). Denver Federal Center Cyber Summit ("GSA Building 41 ...
  TBA for September 2027"). iTECH Summit ("March 17-18, 2026", Mountain America Center). gBETA showcase ("Showcase
  expected in March 2027"). Cornell Systems Summit ("November 1-3, 2026 • Statler Hotel"); the registration form
  takes general attendees as well as Cornell faculty and alumni, so it is not invitation-only. None of these
  duplicates an existing record. All are in person.
- **No aggregator sources:** none of the 24 new or changed curated records cites dev.events, 10times or an
  Eventbrite search URL.
- **No removals** this cycle. No curated event lost. Feed delistings (60, all "no longer listed", meetup/luma) are
  inside the baseline.
- **Blocked rows** (UGAHacks, MakeUofT, RevolutionUC, WEHack): left unchanged, correctly. The organisers publish only
  a season, and the curator would not take the MLH listing's date.
- **Sources:** sources-nov27-c1/c2/gate add in-person tech calendars (Idaho Falls Programmers, TTN Ithaca, Rev .ics,
  TCVN, Communitech, Prefect, AGI Society, jazz.tools). The reasons are specific, and the Rev entry notes that its
  online sessions must be filtered out.
- **Open finding 2026-11-24-i1-W1** (RETURNING rows held as recurring-tbd): this cycle partly works it down. Summercon
  and IEEE Cloud Summit now carry announced 2027 dates. The others were re-confirmed with no 2027 date announced. No
  new instance was added.
- **Note, not a finding:** Business+AI Forum now lists month "March, September, December" but keeps cadence
  "biannual". The cadence vocabulary has no three-times-a-year value, so the record is left as it is.
