# Audit report — 2026-11-17

**Verdict: 2 DISCREPANCIES** (0 blocking, 2 warnings)

Scope: nov17-c1 and nov17-c2 (60 re-check rows from DISPATCHED.tsv), nov17-d1 and nov17-d2 (10 DISCOVER.tsv cities, 17 curated adds plus the CGU Hacks update), nov17-xaudit (BSides CMH month), and new feed follows in sources-nov17-feed/d1/d2.

Mechanical audit (`agent/tools/audit-run.mjs`): 0 blocking, 0 warnings. Curated events went from 1087 to 1101 (13 added, 0 gone). All 60 dispatched rows have a ledger entry, and all 18 new or changed links resolve.

## Blocking

None.

## Warnings

- **Iowa Code Camp (Des Moines)**: the city disagrees with the organiser's page. iowacodecamp.com reads "Iowa Code Camp November 7, 2026 Ankeny, IA". The record has city Des Moines and an empty venue. nov17-c2 confirmed the row and did not mention the mismatch. Ankeny is a separate city in the Des Moines metro area. This was not introduced by this run, but the confirmation let it through. **What to do:** match `{name:'Iowa Code Camp', city:'Des Moines'}` and set `city: "Ankeny"`. If the curator keeps Des Moines as the metro listing, set `venue: "Ankeny, IA"` instead so the record matches the page.
- **PASS Data Community Summit West (Denver)**: the record name is now wrong for the event it points at. The c2 move itself is correct (passdatacommunitysummit.com/north-america/: "PASS Summit North America Denver, Colorado. October 13-15, 2027"). But for 2027 the page replaces the West/East pair with a single North America event, and the curator kept the name "...West" ("Name not changed"). Anyone looking for a Denver event will see a "West" summit name that no longer exists. **What to do:** match `{name:'PASS Data Community Summit West', city:'Denver'}` and set `name: "PASS Data Community Summit North America"`. No sibling East record exists, so the rename creates no duplicate.

## Checked and sound

Large re-dates and city moves (all checked on the organiser page today):
- **KubeCon + CloudNativeCon NA**: Salt Lake City to New Orleans, 2027-11-08..11. The LF page shows "2026 is a wrap" and lists "North America 2027 | November 8-11 | New Orleans, Louisiana". The old cycle1-links REMOVE of a New Orleans KubeCon no longer exists in data/review, and a dry-run apply shows no replay removal.
- **OWASP Global AppSec USA**: San Francisco to Atlanta, 2027-09-20..24. OWASP/owasp.github.io `_data/events.yml` has "OWASP Global AppSec USA 2027 - Atlanta, GA, September 20-24, 2027".
- **PASS Summit**: Seattle to Denver, 2027-10-13..15. Confirmed on the organiser page (only the name is a problem, see Warnings).
- **SANS AI Cybersecurity Summit**: Arlington to Denver, 2027-04-27..28. The Spring 2027 page reads "Summit: Apr 27-28, Training: Apr 21-26, Hilton Denver City Center". The dates are summit days, not the training block.
- **Oracle AI World**: 2027-10-18..21. The organiser page reads "See you next year in Las Vegas, October 18-21".
- **Ocean Exchange**: 2027-10-24..26. The home-page hero and /register/ both say 24-26, and the timeline says 24-27. Taking 24-26 is reasonable.

Other checks:
- **BSides CMH (nov17-xaudit)**: bsidescolumbus.com reads "November 4 - 6, 2026". Month is now November and source is the organiser site. Open finding 2026-11-15-i1-W1 is fixed and can be closed.
- **Discovery adds checked on the organiser page**:
  - North American Blockchain Summit: Nov 18-19 2026, Medal of Honor Museum, Arlington TX.
  - Boston Code Camp 41: the Sessionize page gives 21 Nov 2026, Burlington MA. The Meetup feed copy merged; there is no duplicate.
  - HackUTA: Nov 14-15 2026, UT Arlington.
  - Roots Weekend: April 23-25, 2027, Columbia MO.
  - Wyoming Digital Government Summit: JSON-LD 2027-05-27, Little America Cheyenne.
  - TEKCON 27: April 24, 2027, Cheyenne.
  - TigerHacks: the schedule shows "Friday November 7th" under the MLH 2026 season, which is the 2025 edition. last_date 2025-11-07 and recurring-tbd are right.
  - CGU Hacks update: "November 13-14, 2026", The Hive, 130 E. 7th Street.
  - All adds are in person, in the stated city, tech, and sourced from the organiser. None take a date from dev.events, 10times or an Eventbrite search.
- **Confirmed rows spot-checked**: Microsoft Ignite (Nov 17-20 2026), JSNation US (JSON-LD 2026-11-16), GEW Kansas City (Nov 16-20, Union Station). All hold.
- **Removals**: none in the curated set this run.
- **Dry-run apply**: 18 replay updates are the known re-apply flip-flop of older patches, which later patches settle. One MISS: nov02-t2's SANS AI Cybersecurity Summit (Arlington) update no longer matches because c2 moved the record to Denver. It is harmless, since that patch had already landed.
- **Feed follows**: luma netlifycommunity, sec-nerds and germnetwork are tech calendars. The Junction iCal and Groundswell Meetup are in-person local hubs.
