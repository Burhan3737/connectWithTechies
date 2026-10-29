# Audit report — 2026-10-29

**Verdict: 1 DISCREPANCY** (0 blocking, 1 warning)

Scope: the 2026-10-29 refresh, iteration 1. Feed and build, 3 re-check passes (oct29-t1/t2/t3, 60 dispatched rows),
5 discovery passes (oct29-d1, d2, r1, r2, rep), 27 updates, 32 adds, 0 removals. Compared against HEAD 7bb1ee2.

Mechanical audit (`agent/tools/audit-run.mjs`): 0 blocking, 0 warnings. 905 -> 937 curated, 0 curated gone; no
feed-source delisting over threshold (69 feed rows "no longer listed", spread across sources); no unexplained curated
re-dates; 60/60 dispatched rows have a ledger entry; 40/40 new or changed links resolve. The BSides COS last_date
going backwards is deliberate and holds (see below).

## Blocking

None.

## Warnings

- **Secular Hub feed (Denver), registered as a tech organiser** — `meetup:secularhub` in `data/feeds/registry.json`
  is admitted as "registered tech organiser". Its calendar is a secular-humanist community centre, not a tech group.
  The directory currently lists about 27 of its events: LifeRing Secular Recovery Group (2026-11-04), Thanksgiving
  Feast at the Hub, Monthly Pancake Breakfast, Family Movie Night, Secular Scouts Meeting, Election Watch Party, Improv
  Playshop and so on. One event, "Getting More Out of AI", is tech. This predates the run: the entry came in with the
  feed discovery commit 8a7c95c and was not changed this cycle. It is still live in the published data. **Action:**
  remove `meetup:secularhub` from the registry, or downgrade it so its events need a per-event tech signal, then rebuild.
  A smaller case of the same thing: "Single Event | Mingles Mixer | Real People & Connection 42-55" (Rockville,
  2026-11-04), a singles mixer posted by `meetup:dctechai`. That group is genuinely tech, so this one is per-event
  noise rather than a registry error.

## Checked and sound

Removals: none this run.

Dates that moved by more than a few days. All are verified against the organiser's page:
- South Dallas Maker Faire (Dallas): 2026-11-07 -> 2027-03-06. southdallas.makerfaire.com reads "PARK SOUTH YMCA
  Sat March 6, 2027". Make:'s upcoming-faires list shows "March 6, 2027 United States South Dallas". The old Nov 7
  date was the Salzburg/Orlando row next to it on that list, so the curator was right not to roll it into last_date.
- All Things Open (Raleigh): next 2027-10-17 to 19. allthingsopen.org reads "Save the date for All Things Open 2027!
  Join us in Raleigh, NC October 17-19".
- BSides Peoria (Peoria): next 2027-10-23. bsidespeoria.com reads "Saturday, October 23rd, 2027 - Bradley University";
  the script still holds October 24, 2026.
- BSides COS (Colorado Springs): next_date cleared and last_date set to 2025-10-25. bsidescos.org shows a
  "BSides Colorado Springs 2026 Postponement" notice. The run correctly removed a 2026 edition that never happened.

City changes, all verified:
- Black Tech Week: Cincinnati -> Columbus. blacktechweek.com is titled "Black Tech Week - Columbus 2027" and reads
  "July 2027 / Columbus, Ohio ... Cincinnati started a chapter." The description says the 2026 last_date was the
  final Cincinnati edition, the same handling the Hack Canada audit accepted.
- JSNation US: New York City -> Jersey City. The venue is Liberty Science Center. Nov 19 is "Conference Remote Day",
  so ending the record on Nov 16 is right.
- ODSC West: San Francisco -> Burlingame. odsc.ai/west/west-venue gives "Hyatt Regency, SFO 1333 Old Bayshore Hwy,
  Burlingame, CA 94010".
- Meeting in the Millyard: Nashua -> Manchester. The ARMI page gives Venue 150 Dow Street, Manchester NH, May 18-20,
  2027 in JSON-LD. Biomanufacturing is in scope: the directory already holds Bio-IT World, the Wisconsin Biohealth
  Summit and others.
- The New York region and Nashua city counts each dropped by one. Both drops are these deliberate moves and not
  lost coverage.

Adds checked against the organiser's page:
- Commit Your Code (Plano): /history gives all three editions in Plano, 2026 on Sep 3-4 at the Capital One Campus.
- QCon AI New York (Jersey City): venue page titled "The Westin Jersey City Newport", Dec 15-16, 2026.
- HackMiami (Sunny Isles Beach): May 12-16, 2026 at Marenas Beach Resort.
- Israel Tech Week (Miami): JSON-LD 2027-04-04 to 2027-04-08.
- MadHacks (Madison): Nov 14-15, 2026, Morgridge Hall.
- Socratica (Waterloo): "a live, IRL co-working session hosted every Sunday in Waterloo". It is in person and was
  user-reported.

Plain `confirmed` rows, spot-checked:
- CHM Live (Mountain View): "Data Are Made, Not Found, Thursday, November 5, 2026 7:00 PM".
- INTERFACE Omaha: "November 5th, 2026 8:30am - 4:30pm CHI Health Center Omaha South Ballroom".
- BSides TC (Minneapolis): "October 23rd, 2026 Open Book 1011 Washington Ave S".

Aggregator sources: no new or re-dated curated record cites dev.events, 10times or an Eventbrite search. This run
moved JSNation US and SpiceWorld off dev.events, and Hackville and South Dallas Maker Faire off MLH and Make:'s list.
Two records still cite MLH as source: HackTX and SBUHacks. Both changes were mechanical rollovers of elapsed dates
into last_date, with no new date asserted.

Open log item 2026-10-11-i2-W4 (Jersey City Entrepreneurs: The Venture Garden): resolved. The record is now
recurring-tbd with no passed next_date. The description now matches the meetup page's co-working format.
