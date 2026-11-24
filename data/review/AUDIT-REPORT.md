# Audit report — 2026-11-24

**Verdict: 1 DISCREPANCY** (0 blocking, 1 warning, a repeat of a deferred policy finding)

Scope: nov24 cycle. Script refresh, then 60 re-check rows (nov24-c1/c2/c3), 10 DISCOVER cities
(nov24-d1/d2) and 75 RETURNING rows (nov24-t1/t2/t3). 41 updates, 45 adds and 1 removal were applied.

Mechanical audit (`audit-run.mjs`): 0 blocking, 0 warnings. 1168 -> 1212 curated events, 1 gone (with a
reason), 60/60 dispatched rows have a ledger entry, 49/49 new or changed links resolve, no unexplained
re-dates, no feed delistings over threshold, no duplicates, no internal-consistency errors.

## Blocking

None.

## Warnings

- **RETURNING adds with no announced next edition (repeat of 2026-11-21-i1-W1, still deferred to owner)**
  - **What is wrong:** t1/t2/t3 added about 14 RETURNING rows as `recurring-tbd` even though each
    organiser's page shows only the edition that just ran. The curators' own reasons say "no 2027 date",
    "no 2027 edition announced" or similar for each one:
    - t1: Memphis Microsoft Community Days, Power BI Days DC, State of the Map US, Beam Summit, UN Open
      Source Week, AWS Community Day Midwest, IEEE Cloud Summit, The Perl and Raku Conference.
    - t2: Summercon, SciPy, MY Hackathon. Denver Dev Day ("COMING SOON!") is borderline.
    - t3: Chain React, M365 Community Days NYC, Secure Carolinas Conference.
  - **Why it matters:** curator.md's RETURNING table allows `added` / `recurring-tbd` only when "next
    edition announced, no dates yet". The same curators did not apply one rule:
    - t1 marked AWS Community Day - East Canada and Accelerate Chicago `unresolved` because no 2027
      edition was announced, but added Power BI Days DC and IEEE Cloud Summit on the same facts.
    - SciPy (Tacoma 2025, Minneapolis 2026), State of the Map US (a new US city every year), AWS Community
      Day Midwest (Milwaukee 2025, Indianapolis 2026) and TPRC (Las Vegas 2024, Greenville 2025-26) are
      rotating events. Each is now pinned to its last host city with no next city known. Meanwhile t2
      rejected AlmaLinux Day, bitcoin++ and Worlds in Action Hack as "one-time city stop of a rotating
      series".
  - **What I checked:** the dates and cities in these records are true as historical facts. I found
    nothing fabricated. This is the policy gap the 2026-11-21 audit raised and the owner deferred.
  - **What to do:** the owner decides one rule for both RETURNING and DISCOVER:
    - **(a) Keep the gate:** revert the adds listed above and record them `unresolved` with a retry date.
    - **(b) Drop the gate in curator.md:** keep them, and add a line telling curators how to place a
      rotating-city event that has no announced next host. Either leave it unplaced or leave it out.
      Do not pin it to the last host city.

## Checked and sound

I checked these against the organisers' own pages, so the next auditor does not need to repeat them.

- **Removal: Central Ohio Software Symposium (Columbus).** Holds up.
  - nofluffjuststuff.com/columbus still shows "Sep 29 - Oct 1, 2023" (JSON-LD 2023-09-29).
  - /conference/columbus/2025/04/canceled reads "the Central Ohio Software Symposium scheduled for
    April 11 - 12, 2025 has been canceled".
  - The removed 2026-04-10 last_date had no organiser support.
- **Django Girls New York City.** The Nov 27-28 2026 -> May 7-8 2027 move is correct.
  - djangogirls.org/en/nyc/ reads "May 7th & 8th, 2027 at Fractal Tech Hub, 111 Conselyea St, Brooklyn".
  - The /en/events/ listing reads "New York City 8th May 2027".
  - The old /en/newyorkcity/ source has no Wayback capture, and no Nov 2026 NYC edition is listed.
- **Tech Alley Vegas.** meetup.com/tech-alley JSON-LD gives 2026-12-19T18:00Z to 2026-12-20T00:00Z
  ("Tech Alley Vegas December 2026 Event", Third Street). last_date 2026-11-21 is carried correctly.
- **City change: SC Conference (Supercomputing), Chicago -> Denver.**
  - sc27.supercomputing.org/all-dates-deadlines/ reads "Program Sunday-Friday 14-19 November 2027".
  - The SC27 home page reads "Explore our host city, Denver" and names the Colorado Convention Center.
- **City change: BSides SLC, Salt Lake City -> Sandy.** bsidesslc.org reads "BUY TICKETS May 6-7, 2027"
  and gives the venue as "Conference Center at Miller Campus, 9750 S 300 W Sandy, Utah 84070". The
  "March 26, 2027" on the same page is BSides Red Rocks and was correctly ignored.
- **City change: CDAO New York (added in Hoboken).** The organiser's pages read "JOIN US April 14, 2027,
  W Hoboken" and give the venue as "W Hoboken 225 River St Hoboken, New Jersey 07030".
- **City change: BSDCan (added in Vancouver).** bsdcan.org/2027/ reads "BSDCan 2027 July 7 - 11, 2027
  Vancouver, Canada".
- **Microsoft Ignite.** The banner reads "Mark your calendar: Microsoft Ignite in San Francisco, November
  16-19, 2027".
- **Live! 360 Tech Con.** The orlando-2027 page reads "November 14-19, 2027".
- **BSides MKE.**
  - bsidesmke.org reads "March 26, 2027".
  - Its ticket block still says "Sept 2027". That contradiction is on the organiser's own page.
  - sessionize.com/CypherCon2027 independently reads "BSidesMKE March 26, 2027", so March 26 is right.
- **BSidesKC.** bsideskc.org reads "April 24, 2027" and gives "7250 State Ave, Kansas City KS". BSides KC
  and BSidesKC are two raw records that build merges into one, which is why APPLIED.md shows the patch
  twice. The same applies to the doubled BSides MKE line.
- **BSides San Diego.** bsidessd.org reads "Saturday, March 27, 2027, Location 6075 Aztec Circle Dr".
- **Confirmed rows sampled at random:**
  - All Things Open: "Save the date for All Things Open 2027! Join us in Raleigh, NC October 17-19".
  - Florida Startup Summit: Luma JSON-LD 2026-10-09, Reitz Union.
  - East Meets West: JSON-LD 2026-04-08/09, no 2027 date.
  - AI Tinkerers Fort Wayne: JSON-LD latest 2026-10-21, none after it.
  - QCon San Francisco: the 2027 dates on its page are QCon London and QCon AI Boston, not SF, so
    `recurring-tbd` is right.
  - Cutie Hack: "November 21, 2026".
- **New adds checked on organiser pages:**
  - GrrCON: "September 16th and 17th, 2027", DeVos Place.
  - Tech Week Grand Rapids: "tech week 2027 9.13 - 9.18". The 2026 JSON-LD gives 2026-09-14/19.
  - Blastoff Rails: "June 10 - 11, 2027".
  - ÜberConf: JSON-LD 2027-07-13/16.
  - PA TechCon: "08.12.2027".
  - HU Data Analytics Summit: "4/29/2027".
  - Stevens Innovation Expo: JSON-LD 2027-05-07.
  - ISU Startup Factory Demo Day: JSON-LD 2026-12-08 17:30, ISU Research Park.
  - Community College Cyber Defense Challenge: "December 4-5, 2026". The page reads "open to any
    community college in Iowa and surrounding states", and the ISU-only CDCs were correctly left out.
  - AI in Finance Summit NY: "April 12-13, 2027".
  - Perl Community Conference: "December 17-18, 2026, Austin, Texas and online ... Join us in person".
  - swampUP: JSON-LD 2026-09-01/03, "Waitlist for 2027".
  - DC864: monthly, hybrid with an in-person meeting. Its latest post is still Sep 3.
- **Eligibility note, not a finding: MY Hackathon (Gaithersburg).** The Devpost rules read "Open to Muslim
  high school, college, and university students". This is an identity-community audience, like Django
  Girls (women). It is not a single-institution enrolment limit. The record discloses it in `audience`.
  It is a candidate for the W1 revert only because no 2027 edition is announced.
- **Aggregators:** no curated record changed this run cites dev.events, 10times, Eventbrite search or MLH
  as its `source`. Every new date comes from an organiser page.
- **Coverage:** the only curated city or state losses are the three explained moves above: Columbus -1
  (removal), Chicago -1 (SC moved to Denver), Salt Lake City -1 (BSides SLC moved to Sandy). No feed
  region lost more than 20% of its non-past records.
- **Duplicates:** none of the 45 adds collides with an existing record under another name. The 6 new
  organiser follows are in-person groups, and their online-only series are named for the feed to drop.
