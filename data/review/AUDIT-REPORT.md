# Audit report — 2026-11-15

**Verdict: CLEAN (0 blocking, 1 warning)**

Scope: 2026-11-15 cycle. Re-check passes nov15-c1/c2/c3 (60 dispatched rows), returning-candidate passes nov15-r1/r2, city discovery passes nov15-d1/d2, and the source proposals in sources-nov15-d1.json and sources-nov15-feed.json. Mechanical audit (`agent/tools/audit-run.mjs`): 0 blocking, 0 warnings. 60/60 dispatched rows have a ledger entry. 17/17 new or changed links resolve. No curated removals.

## Blocking

None.

## Warnings

- **BSides CMH (Columbus)**: `month` still says "September", but the 2026 edition the record now holds as `last_date` ran November 4-6, 2026. bsidescolumbus.com reads "BSides Columbus Conference | November 4 - 6, 2026". The curator saw this in nov15-c3 and left it on purpose ("matches its 2025 edition"). The record is `recurring-tbd`, so `month` is the only hint a reader gets for when the next edition will run, and right now it points two months too early. Fix: match `{name: "BSides CMH", city: "Columbus"}` and set `month: "November"`. If you would rather keep both editions visible, use `"September-November"`. Its `source` is also allbsides.com, a listing, when the organiser's own page is available; set `source: "https://www.bsidescolumbus.com/"`.

## Checked and sound

Pages re-read this audit, all matching what the record now says:

- **City change**: BSidesDFW, Dallas to Arlington. bsidesdfw.com is titled "...Conference in Arlington, TX". JSON-LD startDate is 2026-11-07. Correct. The old Dallas key is gone and no duplicate is left behind. The LibreTechnica feed row is also in Arlington.
- **Large date moves**:
  - DevLearn: now 2027-10-06..08 at Caesars Forum. The page header reads "Main Conference: October 6–8, 2027". The page's 2026 copy confirms Nov 4-6. The stale 2025 JSON-LD was rightly ignored.
  - AFROTECH: now 2027-11-01..05 in Houston. JSON-LD and page text agree.
  - U of T Entrepreneurship Week: now 2027-03-01..05. The prize page redirects to /desjardins-startup-prize-2027/ and reads "March 1–5, 2027". The site's own E-Week nav link still points at the 2026 page, so the prize page is a reasonable `url`.
  - Cultivator Community Night: Jan 28 moved to Jan 19, 2027. I downloaded the card image `assets/community-night-2-2.png` and it reads "JAN 19 2027 Community Night Cultivator HQ".
  - Digital Offshore: /overview-1 reads "April 27-28, 2027, St. John's Convention Centre".
- **Recurring roll-forwards**:
  - PitchBreakfast: the page lists "Day 2 09 Dec 2026" at Sparkhouse West.
  - Steel City AI: this is the organiser's own Eventbrite /e/ page, not a search URL. JSON-LD gives 2026-12-09T17:30.
  - Venture Café Phoenix: event 250 is Nov 19, 2026, 4:30-7:00 PM.
- **New events**:
  - TechNet Augusta: the Augusta27 page reads "August 17-19, 2027, three-day". The Augusta26 countdown points at Aug 17, 2026.
  - AFCEA Bethesda Health IT Summit: hits27 reads "January 25-26, 2027" at 5701 Marinelli Rd, Rockville. hits26 reads "May 26-27, 2026". The city is correctly set to Rockville.
  - HackPSU: the page reads "October 24th, 2026, ECoRE Building", "bi-annual".
  - MMS: May 2-6, 2027 at Radisson Blu.
  - RGV Startup Week: "APRIL 26 - 30, 2027".
  - WebCamp NJ: JSON-LD 2027-03-11..12. The directions page names McDonnell & Jadwin Halls, Princeton.
  - SecureWorld Twin Cities: Nov 19. SecureWorld's Meetup page names JW Marriott MOA, 2141 Lindau Ln, Bloomington. The feed row was absorbed into the curated record, so there is no duplicate.
  - Startup425 Eastside Summit: Luma JSON-LD 2026-07-29, Bellevue City Hall, "third annual".
  - IU Venture Summit: the schedule says Thursday May 21 and Friday May 22. "Nights of May 20-21" is the hotel block, as the curator said.
  - SummitCTF: in person April 18-19, 2026, "no virtual option". Note that it is open to college students only.
  - Luddy Hackathon: April 17-18, 2026.
  - Demo Day & Tech the Halls: member.rbtc.tech/events lists only Dec 10 and Dec 16, 2026 items, with no 2026 Demo Day, so `recurring-tbd` is right.
- **Plain confirmed rows spot-checked**, all as the evidence states:
  - Tech Alley Vegas: Meetup 312978633, Nov 21, 814 S 3rd St.
  - Current: no 2027 dates.
  - AngelNV Finale.
  - BSides Philly: JSON-LD 2026-12-11.
  - CSAW: Nov 12-14, 2026.
  - Capital Hacks: Nov 6-8, Carlsen Center.
  - GEW KC: Nov 16-20, Union Station.
  - CyberForce: Nov 13-14, Tinley Park Convention Center.
  - BSides Halifax: Nov 12, Dalhousie.
  - Microsoft Ignite: November 17-20, 2026.
- **All c1/c2/c3 patches landed** in data/events.json. I compared the final values for every patched row, so the 2026-11-12-i1-W2 failure mode (updates not landing) did not recur. The older patch files replayed under the 2026-11-15 APPLIED heading (oct05-r1, oct29-t1/t2, oct31-t1, nov05-r3, nov12-t1) end on their latest values: Milwaukee Dec 5, SecKC Dec 8, Savannah Dec 8, Open Door recurring-tbd, Sioux Falls /events/ URLs.
- **No new curated date or source is taken from dev.events, 10times or an Eventbrite search URL.** Three dev.events sources were moved off to organiser pages (DevLearn, BeyondConf, CISO Fireside).
- **Minor tooling note, not a data problem**: the coverage line says "11 added" while 12 curated adds landed. SecureWorld Twin Cities is counted as "now a curated record" instead.
