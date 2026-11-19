# Audit report — 2026-11-19 (audit 2026-11-19-i1)

**Verdict: CLEAN**

Scope: the nov19 cycle. Re-check passes c1/c2 covered 60 dispatched rows. Discovery passes t1-t3 (returning events) and d1-d2 (10 cities) added 46 records. nov19-xaudit renamed PASS Data Community Summit West to North America.

## Blocking
None.

## Warnings
None.

## Checked and sound

Mechanical (`audit-run.mjs`): 0 blocking, 0 warnings.
- Curated events went from 1101 to 1147: 47 added and 1 gone. The 1 gone is the PASS "West" name, replaced by the "North America" record, which is present in events.json (Denver, 2027-10-13..15).
- All 60 dispatched rows have a ledger entry.
- All 54 new or changed links resolve.
- No duplicates, no internal-consistency errors, no feed delistings over threshold.

I re-read the organiser pages for these changes and each matches its patch:
- **City changes:**
  - SANS DFIR Summit (Arlington -> Washington): the 2027 page reads Aug 23-24 summit, Aug 25-30 training, Westin DC Downtown, 999 9th St NW.
  - SHPE National Convention (Indianapolis -> Houston): the page reads "October 6-9, 2027 | Houston".
  - Scrum Day Madison (-> Middleton): scrumday.org carries Oct 15 2026. Madison Marriott West is at 1313 John Q Hammons Dr, Middleton.
  - Upscale Conf added as Brooklyn: May 5-6 2027 at The Refinery.
- **Large date moves:**
  - Pearl Hacks 2027-02-13..14: the Next.js bundle has an "after" state that renders "Pearl Hacks 2027 is happening Feb 13–14!", and the countdown ends 2026-02-22.
  - TigerHacks: tigerhacks.dev bundle reads "September 25th – 27th, 2026", with rooms in Lafferre. last_date 2026-09-25 holds.
  - Toronto Game Expo: May 1 & 2, 2027, Better Living Centre.
  - Triangle InfoSeCon: October 29, 2027.
  - Venture Atlanta: OCT 13-14 2027.
  - VCF Swap Meet: May 22, 2027.
  - AI Tinkerers San Diego: JSON-LD 2026-12-03 17:00.
  - PASS North America: October 13-15, 2027.
- **Plain confirmed rows (random):**
  - TechCon 365 Dallas: Nov 2-6 2026. The page's Aug JSON-LD is stale, as the curator noted.
  - Montreal Games Week: Nov 10-16 2026.
- **New adds:**
  - Hacktech: JSON-LD 2027-02-26..28.
  - KeanUHackThis: the bundle carries aria-label "April 2, 2027".
  - Blue Ridge Ruby: April 29 & 30, 2027.
  - VulnCon: March 30-April 2, 2027.
  - SO-CON: Apr 26-May 1 2027.
  - Applied ML Conference: April 16-17 2027.
  - Postgres Conference: April 21-23 2027.
  - MSPGeekCon: JSON-LD 2027-05-23..25, Orlando. The www host 404s, but the record uses the bare host, which serves 200.
  - MAU Vegas: May 4-6 2027.
  - cackalackycon: May 14-16 2027.
  - CS4CA Canada: June 1-2 2027, Calgary.
  - BSides Maine: June 5th 2027, Hannaford Hall.
  - Ohio AI Conference: August 25, 2027.
  - Taste of IT: Nov 18 2026.
  - Data Science + AI Summit: Oct 20 2027.
  - Fairfield StartUp Showcase: April 15 2027.
  - Horizon AI Hackathon: Feb 6-7 2027.
  - Northwestern Quantum Week: March 15-19 2027.
  - VentureCat: May 27 2027.
- **Aggregator sources:** no new or changed record takes a date from dev.events, 10times or an Eventbrite search. Two records (Scrum Day Madison, Tech Fuse Des Moines) moved off dev.events to the organiser's own page.
- **Removals:** there were none apart from the PASS rename.
- **Open finding 2026-11-17-i1-W2** (PASS "West" name) is fixed by nov19-xaudit-fixes.json.

Notes, not findings:
- With Scrum Day Madison now in Middleton, it shares a city with the past feed record "Scrum Day 2026" (Meetup URL). That record is past-dated and will age out.
- SpiceWorld 2027 dates are labelled tentative by the organiser and should be re-checked as the event nears. The patch already says so.
