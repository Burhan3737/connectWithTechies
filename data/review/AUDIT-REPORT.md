# Audit report - 2026-10-05 (iteration 3, final re-audit)

Run audited: curator passes oct05-r1/r2/r3, the orchestrator’s audit fixes, the iteration-3 changes (`looksLikeVenue` in `scripts/feeds/adapters/datasets.mjs`, `data/feeds/place-overrides.json`, the state-name rule in `scripts/feeds/lib/geo.mjs`, the series-absorption rule, the re-validation of history and the description guards in `scripts/feeds/run.mjs`), and the rebuilt `data/events.json`. Compared against HEAD (67173d4). `C:\temp\head-events.json` is identical to `git show HEAD:data/events.json`.

**Verdict: 6 DISCREPANCIES (2 blocking, 4 warnings)**

Mechanical audit: 0 blocking, 1 warning (the known LF Legal Summit / PyTorch co-location, not a duplicate). Curated records 903 -> 903. 60/60 dispatched rows have a ledger entry, and 2/2 changed links resolve. `scripts/feeds/selftest.mjs`: 36/36 pass. Directory total 4247 -> 4429. 29 records from HEAD are gone, and 0 records carried over from HEAD changed city.

Status of the iteration-2 findings:
- B1 Haven / FutureForge / Swiftsonic dropped: **resolved.** All three are back with the right city (details under Checked and sound). Devpost is back to 9/9 of the records HEAD had.
- W1 December Code & Coffee listed separately: **resolved, but the fix over-reaches** (Blocking 1).
- W2 descriptions: **WE3 is resolved.** The Startup World Cup half of that warning was my error: the HEAD description was already the bare title ("Startup World Cup Grand Finale 2026"). The Pegasus text belongs to the separate Meetup record "Startup World Cup 2026 Grand Finale!", which is intact. Nothing was lost there and nothing is left to restore. **Closed.**
- W3 Tech Week socials and Ascent Valley pairs: **unchanged** (Warning 3).
- W4 online-only records: **unchanged** (Warning 4).

## Blocking

1. **The new series-absorption rule in run.mjs drops real, dated, future events that are not the curated series.** The rule is `SERIES.test(r.cadence)` together with the organiser page equalling the curated `url`. It drops every feed event from an organiser whose page is linked by any weekly or monthly curated record in the same city. That includes curated records with **no next_date**, and events with entirely different titles. Lost:
   - **Hackreation (Milwaukee, 2026-10-31)** and **October Code + Brews (Milwaukee, 2026-10-21)**, plus later Code + Brews sessions on Nov 11, Dec 9 and Jan 13. The Mitobyte iCal (meetup.com/mitobyte/events/ical/) lists all of these as separate events (316630269, 312261435, ...). The iteration-2 report said these "are distinct events and should stay". The curated "Milwaukee Tech Hub Code & Coffee" record only carries the Code & Coffee date, 2026-11-07.
   - **Lightning Talks (Cambridge, 2026-10-07, meetup.com/bostonpython/events/316657277/)** was absorbed into the curated "Boston Python User Group" (monthly, **next_date empty**). The directory went from a dated session to an undated group listing.
   - **Python talk night at City University Seattle (Seattle, 2026-10-15, meetup.com/psppython/events/316587369/)** and **Project Hack Night & Social (Seattle, 2026-10-08, .../316490238/)** were absorbed into the curated "Puget Sound Programming Python (PuPPy)" (monthly, **next_date empty**).

   **Do:** narrow the rule so that a feed event is absorbed only when (a) the curated record has a `next_date`, **and** (b) the feed title shares the curated record’s series stem (for example "Code & Coffee"). That still drops December Code & Coffee and keeps Code + Brews and Hackreation. When the curated series is undated, keep the feed sessions, or use the earliest one to fill the curated `next_date`. Rebuild, then confirm that the five events above are back and December Code & Coffee is still absent.

2. **The state/province-name rule in geo.mjs rejects Quebec City, and Hackfest was lost.** developers.events gives the Hackfest city as "Quebec, QC". `finish()` now returns null because "quebec" is a province name and no curated record’s city is spelt "Quebec" (the curated spelling is "Quebec City"). HEAD had **Hackfest (Quebec City, 2026-10-29..31)**. hackfest.ca today says "29 - 30 - 31 Octobre 2026, Centre des congrès de Québec" and calls it the largest bilingual cybersecurity event in Canada. It is real, in person, and tech. **Do:** map "Quebec" / "Québec" with region Quebec to the city "Quebec City" (via `canonPlace` or an alias, applied before the state-name rejection) instead of rejecting it. Then restore Hackfest with venue "Centre des congrès de Québec". Quebec is the only Canadian city that shares its province’s name; New York is already handled.

## Warnings

1. **"Artificial Intelligence and Automation" (city Washington, region Washington *state*, 2026-10-09, eventbrite ...-washington-tickets-2001387133793) survived the clean-up that dropped its 9 siblings.** The exemption in `finish()` checks `known()` by `city|country`, and curated "Washington" (DC) satisfies it even though this record’s region is Washington state. The venue is "For venue details reach us at info@learnerring.com", which is not a place. **Do:** remove the record, and make the exemption require `spelt.region === reg.name`, so that "Washington, Washington" is rejected and "Washington, District of Columbia" is kept.

2. **Two developers.events conferences with a state-only city are still unplaced and silently dropped.** These are not regressions, since HEAD did not have them either, but `place-overrides.json` now exists for exactly this case:
   - **Iowa Code Camp Fall 2026**: developers.events says "Iowa (USA)". iowacodecamp.com says "November 7, 2026, Ankeny, IA". Add an override `devevents:https://iowacodecamp.com|2026-11-07` -> Ankeny, Iowa.
   - **M365 Community Days Atlanta 2026**: developers.events says "Georgia (USA)". The Eventbrite page (tickets-1996346079865) gives Saturday, November 14, 9 AM-4 PM, at a university in Morrow, GA. Add an override -> Morrow, Georgia, with the venue from the Eventbrite page.
   Longer term: have the gate list the overrides it needs (state-only city, future date) in `NEEDS-AGENT.tsv` instead of counting them under "no US/Canada location".

3. **SF/LA Tech Week socials and the Ascent Valley pairs are unchanged from iteration 2.** Still listed: Proof of Buckets basketball (SF 10-12), YOUNG FOUNDERS HIKE (10-11), Intro to boxing for tech founders (10-10), Tech Basketball Run (10-10), FC SF Founders Run & Coffee (10-06), GTM VIP Bowling Night (10-07) and Smartlead x Chatbase Bowling Mixer (10-09). Ascent Valley is still listed twice per city: SF 10-07 (luma.com/san_francisco_tech_week07 plus the Meetup listing 316160736), and LA 10-15 (luma.com/8epsts3e plus the Eventbrite listing 1997950134636). **Do:** as before, filter sport and social titles from the Tech Week calendars (or set `judgeEvents`), and merge feed records that share city, date and organiser.

4. **Online-only feed records are still listed. This predates the run and is unchanged.** Examples: the Blockchain Council "live online training" series across 8 cities, "AI Revolution December 4th" ("virtual learning series"), and "STARTUP FUNDRAISING STRATEGY SESSION 2026" ("Zoom consultation"). **Do:** add a description-level online filter to the feed ingester. Keep hybrid events that have a real in-person option.

## Checked and sound

- **Haven Asbury Park Game Jam - High School**: Asbury Park, NJ, 2026-11-14, placed by override `devpost:31529`. The page says "Our event is happening right here in Asbury Park, New Jersey" and "IMPORTANT: The city is Asbury Park!". The venue keeps the Devpost spelling, "iCode Shrewbury". That is cosmetic and not counted.
- **FutureForge Hacks**: Pleasanton, CA, 2026-11-21. It now passes `looksLikeVenue` as a well-formed new city.
- **Swiftsonic 2026**: Nashville, TN, 2026-11-20..22, venue Loews Nashville Hotel at Vanderbilt Plaza, placed by override. It matches swiftsonicconf.com (checked in iteration 2).
- **The `looksLikeVenue` gate against live Devpost data**: none of the 90 current in-person hackathons is rejected by the new venue check, and every one that parses to a place (Ottawa, SF, Vancouver, New York, Pleasanton, London ON, Cincinnati) is accepted. Devpost records match HEAD 9 for 9.
- **History re-validation**: the 9 "Artificial Intelligence and Automation | State" rows (AZ, CO, MI, MN, NV, OR, PA, TN, UT) are gone. The two daretoshift socials with city "North Carolina" are also gone, which is correct (state as city, and social events). The only state-level coverage drops are these state-as-city rows.
- **December Code & Coffee** is no longer listed separately. Milwaukee shows one Code & Coffee record (2026-11-07).
- **WE3 Global AI Summit 2026 By SEW.AI (Las Vegas)**: the full description is restored ("WE3 is the only global AI summit built for the energy and utilities sector...").
- **Descriptions overall**: 0 records carried over from HEAD have a description more than 40% shorter, and only 1 regressed to stand-in text.
- **Other removals from HEAD**: past events (StormHacks, WolfHacks, the SF Oct 4 items, the Potsdam camp, Greensboro speed dating), and re-ingests under a new id with the same URL (Tech Beach Party, Build & Host on AWS Workshop, Claude Impact Lab -> Claude Build Day NY, the Discord game-dev session via Luma, the SEA AI WEEK Frontier panel, and TechCon dallas -> irving).
- **Curated date changes spot-checked against the live pages**: Maker Faire Bay Area -> 2027-09-24..26 ("returns to Mare Island September 24-26, 2027"), Ignite Seattle -> 2027-02-25 ("Next event: Feb 25, 2027 at Town Hall Seattle"), and JumpStart VC Fest -> 2027-09-21..22 ("returns September 21-22, 2027"). All three hold. The other cleared dates (the BSides events, PyBay, SANS DC Metro, Boston FIG, Boston Data and AI Saturday) are editions held on or before Oct 3, which rolled off correctly.
- **Not counted**: duplicate ids (80, against 66 in HEAD) and the malformed cities "Boston,", "Toronto,", "Washington,", "Montreal,", "Vancovuer" all predate this run. They are worth a future pass.
