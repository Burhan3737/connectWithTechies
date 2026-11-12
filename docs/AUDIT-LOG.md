# Audit log

Every auditor run, what it flagged, and what was done about it. Generated from
`data/review/audit-log.json` by `node agent/tools/audit-log.mjs render`; do not edit by hand.

## Runs

| run | days since previous run | blocking | warnings | fixed | still open | scope |
|---|---|---|---|---|---|---|
| 2026-10-07-i3 | — | 1 | 2 | 2 | 1 | Oct 7 refresh, final re-audit (logged after the fact from AUDIT-REPORT.md; earlier runs predate the log) |
| 2026-10-11-i1 | 4 | 4 | 7 | 8 | 3 | Oct 11 refresh: curator passes oct11-t1/t2/t3 (60 rows, 13 real updates), BSidesStPete script move, 17 new discovery cities with 121 auto-registered organisers (15 retired) |
| 2026-10-11-i2 | re-audit | 0 | 6 | 5 | 1 | Re-audit of iteration-1 fixes: 21 retirements (sources-oct11-audit.json) and new retire/drop gate logic in run.mjs, Charleston Digital Connect removal, place-override drops, judge_each, Offensive AI Con source, ledger last_attempt / audit-run / snapshot-dispatch tooling |
| 2026-10-22-i1 | 11 | 0 | 3 | 2 | 0 | Uncommitted run vs HEAD: first 'add' patch (oct21-coverage-fixes.json -> Hack Canada, Toronto, in data/raw/discovered.json), Venture Garden patches re-applied, build:data + ledger; no queue dispatched (stale Oct 11 DISPATCHED.tsv: 60/60 covered, 0 row-skipped). |
| 2026-10-29-i1 | 7 | 0 | 1 | 1 | 0 | 2026-10-29 refresh: feed+build, re-check passes oct29-t1/t2/t3 (60 rows), discovery oct29-d1/d2/r1/r2/rep; 27 updates, 32 adds, 0 removals vs HEAD 7bb1ee2 |
| 2026-10-31-i1 | 2 | 1 | 1 | 2 | 0 | Cycle oct31: rechecks t1-t3 (60 rows), returning briefs r1-r2, city briefs d1-d2; 24 curated adds, 9 updates, 0 removals |
| 2026-10-31-i2 | re-audit | 1 | 2 | 3 | 0 | Cycle oct31 re-audit: orchestrator fixes for i1-B1/i1-W1 plus feed re-run adding ShiftKey Labs, Unreal LA and 8 Eventbrite organisers |
| 2026-10-31-i3 | re-audit | 0 | 1 | 1 | 0 | Cycle oct31 final re-audit: orchestrator fixes for i2-B1 (BSides Halifax), i2-W1 (run.mjs judgeEvents techOrg re-add), i2-W2 (AWS Prep Course drops), feed re-run from cache |
| 2026-11-03-i1 | 3 | 2 | 4 | 6 | 0 | Cycle nov02: re-check t1-t3 (60 rows), discovery r1/r2/d1/d2 (38 adds), PNSS move, 14 organiser retirements, place-override drop, feed-gate relevance.mjs change |
| 2026-11-03-i2 | re-audit | 0 | 0 | 0 | 0 | Cycle nov02 re-audit: nov02-audit-fixes.json (B1, B2, W1, W2), relevance.mjs Massachusetts normalisation (W3), place-override drops (W4), rebuilt feed |
| 2026-11-05-i1 | 2 | 1 | 2 | 3 | 0 | nov05 cycle: re-check passes nov05-r1/r2/r3 (60 rows), discovery nov05-c1/c2/t1/t2 (47 adds), feed retirements, patch replay-order change |
| 2026-11-05-i2 | re-audit | 0 | 1 | 0 | 1 | nov05 cycle re-audit: nov05-audit-fixes.json (i1-B1/W1/W2) and the retired-organiser name-match repair (retiredOrganisers, feed re-run from cache); CHANGES.md 70 removals |
| 2026-11-12-i1 | 7 | 2 | 2 | 3 | 1 | nov12 cycle: re-check t1-t3 (60 rows, 6 corrections), discovery r1/r2/d1/d2 (31 adds), sources-nov12-* follows/retirements |

**8 audit cycle(s); 6 found something blocking on its first audit.** 44 findings in total, 36 fixed, 7 open or deferred, 9 repeat(s) of an earlier finding.

## Open

- **2026-10-07-i3-W1** · warning · deferred · **Tech Week non-tech socials** — Wine tasting, speed dating, run club and a party from Tech Week calendars are listed.
  - recommended: User decision: filter non-tech socials from tech-week calendars or keep them.
  - note: Left for the user to decide.
- **2026-10-11-i1-W5** · warning · deferred · **Jersey City Entrepreneurs: The Venture Garden (Jersey City)** — next_date 2026-10-10 has passed; oct05-r1 and oct07-s1 patches flip-flop next_date (cancelled 10-06 vs 10-10), correct only by sort order.
  - recommended: Re-check the Meetup group for the next active session; delete the superseded op from oct05-r1-fixes.json.
  - note: Carried over as 2026-10-11-i2-W4.
- **2026-10-11-i1-W6** · warning · deferred · **City spelling splits (Québec City, United States, trailing commas)** — Run added 'Québec City' beside 'Quebec City' and a city 'United States'; 9 older feed records have trailing commas (Boston, Seattle, Toronto, Washington, Montréal).
  - recommended: Strip trailing punctuation, add a québec city alias in scripts/lib/places.mjs, reject a country as a city.
  - note: Carried over as 2026-10-11-i2-W5.
- **2026-10-11-i1-W7** · warning · deferred · **Tech Week non-tech socials** — Still applies, smaller: NTW Closing Party, Hard Tech Week Opening Party, SF Funds Week party, Young Founders Hike.
  - recommended: User decision (deferred).
  - note: Carried over as 2026-10-11-i2-W6.
- **2026-10-11-i2-W6** · warning · deferred · **Tech Week non-tech socials** — Unchanged, deferred to user: NTW Closing Party, Hard Tech Week Opening Party, Big Cayman Bash, Young Founders Hike still listed.
  - recommended: No action until the user decides.
  - note: Waiting on the user's decision (same as 2026-10-07-i3-W1).
- **2026-11-05-i2-W1** · warning · deferred · **JEWEL CITY HACKS 6.0 (Glendale) / Seattle AI Power Holiday Evening (Bellevue)** — Two live tech events (luma.com/jewelcityhacks6 2026-11-14; luma.com/edixsj8w 2026-12-06, same Luma id, retitled) were removed as 'no longer listed' because they dropped off a luma-area listing that takenDown() treats as complete. InsurTech 2027 Spring Conference (New York) was also lost, by a gate verdict that flips from run to run. Pre-existing rule, the same as 2026-10-07-i3-W2, not a regression; the count (60) is within the 56-69 baseline.
  - recommended: Restore the two events (curate them or un-remove the feed rows); consider curating InsurTech 2027 Spring Conference; in a future pass, re-fetch an upcoming event's own page before taking it down for missing from a luma-area listing.
  - note: takenDown() drops an upcoming event when it leaves a luma-area listing, without re-reading its own page. Changing that rule (or restoring the two events by hand) is left to the user; same root as closed 2026-10-07-i3-W2.
- **2026-11-12-i1-W2** · warning · deferred · **audit-run.mjs / build-data.mjs (tooling)** — Mechanical audit reported 0/0 despite 4 updates not landing and 1 curated add merged away; build-data merges different-named curated records by shared page silently.
  - recommended: audit-run: verify each this-cycle update op's set fields and each add's presence in events.json. build-data: warn when two curated records of different names merge by page.
  - note: Tooling change for the user to approve: audit-run.mjs to verify every patch value reached events.json and every add survived; build-data.mjs to warn when it merges differently-named curated records by shared page.

## History

### 2026-11-12-i1 — 2 blocking, 2 warning(s)

Scope: nov12 cycle: re-check t1-t3 (60 rows, 6 corrections), discovery r1/r2/d1/d2 (31 adds), sources-nov12-* follows/retirements

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| B1 | blocking | Milwaukee Tech Hub Code & Coffee (Milwaukee); SecKC (Kansas City); tech SAVannah Tech Tuesday (Savannah); Venture Café Phoenix Thursday Gathering (Phoenix) | nov12-t1 corrections did not land: patch-order dated nov12 as 2025-11-12 because today() (Honolulu) was still 2026-11-11 at apply time, so older oct05-r1/oct29-t1/oct31-t1 updates replayed after it and the build rolled the records to recurring-tbd with no next_date. | fixed (2026-11-12) | Re-applied nov12-t1 with scripts/lib/patch-order.mjs fixed: patchDate now accepts passes dated up to 7 days ahead of today() (Honolulu), with selftest cases incl. across new year. All 4 rows re-checked ok (RECHECK-nov12.md). |
| B2 | blocking | DubHacks (Seattle) | Added by nov12-d1 but merged away by build-data: it and DubHacks NEXT Demo Day share url https://dubhacks.co/ and one name contains the other, so samePageSameEvent folded the hackathon (Oct 17-18 2026) into the Demo Day record. | fixed (2026-11-12) | nov12-xaudit-fixes.json sets DubHacks NEXT Demo Day url to https://next.dubhacks.co/; DubHacks (Seattle) now survives the build. Re-checked ok. |
| W1 | warning | The Reinforcement Learning Conference (RLC) (Providence) | last_date 2026-08-15 is the Montreal edition (rl-conference.cc/2026/); RLC has not been held in Providence before (2024 Amherst, 2025 Edmonton). next_date 2027-08-02..06 is correct. | fixed (2026-11-12) | nov12-xaudit-fixes.json clears RLC (Providence) last_date (2026 edition was Montreal), carries nov12-t2's 2027-08-02..06. Re-checked ok. |
| W2 | warning | audit-run.mjs / build-data.mjs (tooling) | Mechanical audit reported 0/0 despite 4 updates not landing and 1 curated add merged away; build-data merges different-named curated records by shared page silently. | deferred (2026-11-12) | Tooling change for the user to approve: audit-run.mjs to verify every patch value reached events.json and every add survived; build-data.mjs to warn when it merges differently-named curated records by shared page. |

Checked and sound: InfoSec Nashville and RLC 2027 dates; Techstars Boston/NYC Jun 03 2027 (PROPOSED-moves rightly rejected: JSON-LD is Accelerator Starts); Splunk .conf, SpiceWorld confirms; adds Cognite Impact, LDX3 NY, UXCON, Global AI Conf Toronto, CyberSci Toronto, Jam @ GDC, Tech Alley Vegas, Kong Summit, GGJ Vancouver, Data Saturday Chicago; feed retirements

### 2026-11-05-i2 — 0 blocking, 1 warning(s)

Scope: nov05 cycle re-audit: nov05-audit-fixes.json (i1-B1/W1/W2) and the retired-organiser name-match repair (retiredOrganisers, feed re-run from cache); CHANGES.md 70 removals

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| W1 | warning | JEWEL CITY HACKS 6.0 (Glendale) / Seattle AI Power Holiday Evening (Bellevue) | Two live tech events (luma.com/jewelcityhacks6 2026-11-14; luma.com/edixsj8w 2026-12-06, same Luma id, retitled) were removed as 'no longer listed' because they dropped off a luma-area listing that takenDown() treats as complete. InsurTech 2027 Spring Conference (New York) was also lost, by a gate verdict that flips from run to run. Pre-existing rule, the same as 2026-10-07-i3-W2, not a regression; the count (60) is within the 56-69 baseline. | deferred (2026-11-06) | takenDown() drops an upcoming event when it leaves a luma-area listing, without re-reading its own page. Changing that rule (or restoring the two events by hand) is left to the user; same root as closed 2026-10-07-i3-W2. |

Checked and sound: All 3 i1 fixes landed; all 36 namesake 'Organizer' feed events present in feed.json and events.json; Forward Deploy Toronto (retired organiser's own) is 404/410; registry tech flips only the 2 intended; 70-removal split recomputed; 8 Sioux Falls retirements past; 6/10 sampled no-longer-listed rows really gone; CAST/Agile2027 flags are probe artefacts

### 2026-11-05-i1 — 1 blocking, 2 warning(s)

Scope: nov05 cycle: re-check passes nov05-r1/r2/r3 (60 rows), discovery nov05-c1/c2/t1/t2 (47 adds), feed retirements, patch replay-order change

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| B1 | blocking | InfoSec Nashville (Nashville) | url https://www.infosecnashville.com does not connect (port 443 unreachable); curator noted ECONNREFUSED and set it anyway. Bare host redirects to issamidtn.org. | fixed (2026-11-06) | url -> issamidtn.org event page (nov05-audit-fixes.json) |
| W1 | warning | API Conference New York (New York) | source apiconference.net/new-york/ shows only a 2027 teaser, not the 2026-09-28 date; the date was confirmed on devm.io/newyork-week/. | fixed (2026-11-06) | source -> devm.io/newyork-week/ (nov05-audit-fixes.json) |
| W2 | warning | Startup Sioux Falls Founders Meetup (Sioux Falls) | Pre-existing duplicate of 'Founders Meetup Sioux Falls' (same monthly meeting); stale recurring-tbd, last_date 2026-08-19, while the twin has next_date 2026-11-18. Missed by the duplicate check (different name and url). | fixed (2026-11-06) | stale us-central duplicate removed (nov05-audit-fixes.json) |

Checked and sound: CHM Live, Full Indie, Northeast Dreamin', DevRelCon NY, Sioux Falls repoints (patch order holds); Utah Tech Week, JSNation US, PTC, Into The Box, AI Tinkerers Raleigh; ETHDenver, Agile2027, Techstars Boston/Columbus, Georgetown, Tampa Bay Tech Week, WWHF, AI Risk Summit, Enterprise AI Summit, SquiggleConf, Buffer-Free, CAST, BostonHacks; CAST/Agile2027 dead-link flags are probe artefacts

### 2026-11-03-i2 — 0 blocking, 0 warning(s)

Scope: Cycle nov02 re-audit: nov02-audit-fixes.json (B1, B2, W1, W2), relevance.mjs Massachusetts normalisation (W3), place-override drops (W4), rebuilt feed

Clean.

Checked and sound: All six i1 findings verified fixed in events.json; SF Tech Week pair merged to one 2027-10-04 record; one SLC Day of Data; Brain Fry admitted and its Philadelphia venue matches the Eventbrite page; W3 pattern scanned across built feed and 5,693 cache files with no new non-tech admits; 4,022 keyword admits re-judged current vs HEAD gate (13 newly admitted, all tech, none from W3; 0 newly dropped)

### 2026-11-03-i1 — 2 blocking, 4 warning(s)

Scope: Cycle nov02: re-check t1-t3 (60 rows), discovery r1/r2/d1/d2 (38 adds), PNSS move, 14 organiser retirements, place-override drop, feed-gate relevance.mjs change

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| B1 | blocking | Day of Data (Salt Lake City) | nov02-r2 add duplicates the existing Salt Lake City Day of Data (review-additions-2), same city and 2026-09-19 date | fixed (2026-11-03) | Older Salt Lake City Day of Data removed (nov02-audit-fixes.json); nov02-r2 'Day of Data' kept. Confirmed by re-audit 2026-11-03-i2. |
| B2 | blocking | SF Tech Week / Tech Week San Francisco (San Francisco) | nov02-t2 moved Tech Week San Francisco to 2027-10-04, breaking the build's same-date merge with us-west SF Tech Week (shared tech-week.com); the duplicate resurfaced as recurring-tbd beside a 2027 upcoming copy | fixed (2026-11-03) | us-west SF Tech Week given 2027-10-04..10, last 2026-10-05 (nov02-audit-fixes.json); merges with Tech Week San Francisco again. Confirmed by re-audit i2. |
| W1 | warning | Pacific Northwest Software Symposium (Redmond) | Date moved to 2027-03-18 from the organiser page but source is still dev.events and month still November | fixed (2026-11-03) | PNSS source -> nofluffjuststuff.com/seattle, month March (nov02-audit-fixes.json). |
| W2 | warning | Vintage Computer Festival Montreal (Saint-Lambert) | City changed to Saint-Lambert (correct) but the description still says talks in Montreal | fixed (2026-11-03) | VCF Montreal description -> Saint-Lambert (nov02-audit-fixes.json). |
| W3 | warning | Feed gate: AI Brain Fry - BOSTON/MASS (Philadelphia) | The new split copy in relevance.mjs makes BOSTON/MASS hit the NEGATIVE 'mass ' term; a CISO tech talk the old gate kept will be dropped on its next fresh judgement | fixed (2026-11-03) | relevance.mjs normalises '<place>/mass' and '<place>, mass' to massachusetts; 3 selftest cases. Re-audit confirmed Philadelphia is the Eventbrite venue. |
| W4 | warning | Oak Park FIX IT CAFE (Sacramento); Founder-led Branding in the Built World (Boston) | The gate change newly admitted two non-tech feed records: a MADE repair cafe (same host as the dropped Sac Made Market) on makerspace/electronics, and a built-world branding session on a lone 'founder' freed by the hyphen split | fixed (2026-11-03) | Oak Park FIX IT CAFE (meetup:317200430) and Founder-led Branding (luma:evt-e4CiRHKg22Jg0BI) dropped in data/feeds/place-overrides.json; lone 'founder' left admitted by the gate's stated bar. |

Checked and sound: InnovateHer Feb 13-14, Utah Tech Week recurring-tbd, Raleigh-Durham SW under Durham, VCF Saint-Lambert city/dates, PNSS Mar 2027, INTERFACE Omaha, CHM Live, UB Hacking, Lassonde, MLSys, GRO Demo Day, AI Tinkerers Houston, 62 feed delistings (re-listings), 14 retirements, Sac Made Market drop

### 2026-10-31-i3 — 0 blocking, 1 warning(s)

Scope: Cycle oct31 final re-audit: orchestrator fixes for i2-B1 (BSides Halifax), i2-W1 (run.mjs judgeEvents techOrg re-add), i2-W2 (AWS Prep Course drops), feed re-run from cache

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| W1 | warning | Sac Made Market First Fridays (Sacramento) | Upcoming feed record series:5fcdc0004983786c from judge_each MADE Makerspace (meetup:hackerlab) still has relevance 'registered tech organiser'. It was admitted 2026-10-25 by the techOrg re-add bug fixed for i2-W1 and carried forward unjudged because it was not re-read. It is an artisan and pop-up market, not tech. | fixed (2026-11-03) | Dropped series:5fcdc0004983786c in data/feeds/place-overrides.json; nov02 feed re-run carries it no longer (0 matches in data/raw/feed.json). |

Checked and sound: BSides Halifax curated next_date 2026-11-12 matches halifaxbsides.ca, ledger corrected, ShiftKey duplicate dropped; four AWS Prep drops effective; run.mjs fix holds and upcoming Red Fridge events are judged by title (socials gone); mechanical audit 0/0, 25/25 links, queue 61/61; selftest 212/212

### 2026-10-31-i2 — 1 blocking, 2 warning(s)

Scope: Cycle oct31 re-audit: orchestrator fixes for i1-B1/i1-W1 plus feed re-run adding ShiftKey Labs, Unreal LA and 8 Eventbrite organisers

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| B1 | blocking | BSides Halifax (Halifax) | ShiftKey Labs feed added 'BSides Cybersecurity Conference 2026' (ical:104889-1794474000-1794502800@shiftkeylabs.ca, 2026-11-12), which is BSides Halifax 2026 per its own page and halifaxbsides.ca. The curated record bsides-halifax-halifax still says recurring-tbd with next_date blank (ledger from 2026-08-26), so one event is listed twice with contradicting dates. | fixed (2026-10-31) | Curated BSides Halifax set to 2026-11-12 (oct31-audit-fixes.json, ledger confirm-oct31-audit2.json); ShiftKey duplicate ical:104889-...@shiftkeylabs.ca dropped in data/feeds/place-overrides.json. |
| W1 | warning | Red Fridge Society (Austin) | judge_each did not take effect: all Red Fridge events still carry relevance 'registered tech organiser' (Santa Happy Hour, wine course, poker, Torque and Tacos). In scripts/feeds/run.mjs (around lines 182 and 206) the organiser found in the Luma Austin listing is re-added to techOrg regardless of judgeEvents. Even after that is fixed, the '(founders)' title suffix passes judge() on 'title: founders'. | fixed (2026-10-31) | Bug fixed in scripts/feeds/run.mjs: Luma/Meetup and Eventbrite discovery no longer re-trust an organiser marked judgeEvents. Red Fridge events are now judged by title: wine course, poker, Santa happy hour dropped. Founder Coffee Tasting and Torque and Tacos pass on '(founders)'; kept, since relevance.mjs's stated bar admits a founders' social. |
| W2 | warning | Cloud Practitioner - AWS Prep Course (1/4) (Halifax) | ShiftKey judge_each source admitted a four-week AWS exam-prep course for first- and second-year Dalhousie students (series:3b87d6841ea212e0) on 'title: cloud, aws'. It is a student class, not an event. | fixed (2026-10-31) | All four AWS Prep Course occurrences dropped in data/feeds/place-overrides.json. |

Checked and sound: i1-B1 holds (dev.events BSides COS record dropped, ledger confirmed, queue 61/61); philosophy-austin and Toronto Social Club retired with no events left; 10 events from the 8 Eventbrite organisers are in person and tech (Indy Init, GameBiz Lab checked on page); ShiftKey hackathons sound; Unreal LA 0 events; mechanical audit 0/0, 25/25 links

### 2026-10-31-i1 — 1 blocking, 1 warning(s)

Scope: Cycle oct31: rechecks t1-t3 (60 rows), returning briefs r1-r2, city briefs d1-d2; 24 curated adds, 9 updates, 0 removals

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| B1 | blocking | BSides COS / BSides Colorado Springs 2026 (Colorado Springs) | Dispatched SHARED-PAGE row 62 was never chunked (61 dispatched, 60 chunked), so no ledger entry. The dev.events feed record bsides-colorado-springs-colorado-springs lists a 2026-10-24 edition that bsidescos.org says was postponed to next year, so the directory shows a phantom past edition. | fixed (2026-10-31) | Feed record devevents:https://www.bsidescos.org/\|2026-10-24 dropped in data/feeds/place-overrides.json; curated BSides COS confirmed in confirm-oct31-audit.json. Cause: orchestrator chunked TO-VERIFY.tsv instead of the DISPATCHED.tsv snapshot; refresh-events SKILL.md now says which file to split. |
| W1 | warning | Austin Philosophy Discussion Group / Toronto Social Club / Red Fridge Society (Austin, Toronto) | Registry marks meetup:philosophy-austin and meetup:greater-toronto-travel-and-social-club tech:true on a false track record. They list philosophy seminars, trivia nights and a clothing swap. Red Fridge Society (luma-cal:cal-ouHgAHCszM3INEo) added wine courses, poker and a car meet this run. | fixed (2026-10-31) | sources-oct31-audit.json retires meetup:philosophy-austin and meetup:greater-toronto-travel-and-social-club (25 events taken down) and switches Red Fridge Society to judge_each. Most Red Fridge titles carry a '(founders)' ticket label so they still pass; accepted as a founders' community. |

Checked and sound: Mechanical audit otherwise clean (25/25 links). Verified on organiser pages: Great Lakes Software Symposium, dev2next, Gartner re-dates; DevOpsDays Boston city move to Cambridge; Health Wildcatters, PitchBreakfast, UnDemo Day, Datathon PolyFinances, VIPSS, WiE Hackathon, Michigan DevFest, Upfront Summit adds; Hackfest CTF, BSides Fredericton, Future Summit confirmed rows. New relevance terms admitted only 4 real tech events

### 2026-10-29-i1 — 0 blocking, 1 warning(s)

Scope: 2026-10-29 refresh: feed+build, re-check passes oct29-t1/t2/t3 (60 rows), discovery oct29-d1/d2/r1/r2/rep; 27 updates, 32 adds, 0 removals vs HEAD 7bb1ee2

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| W1 | warning | Secular Hub feed (Denver) | meetup:secularhub is in the feed registry as a registered tech organiser; about 27 non-tech events are live (LifeRing Secular Recovery Group, Thanksgiving Feast, Pancake Breakfast, Movie Night, Secular Scouts). Predates this run (commit 8a7c95c). Related per-event noise: 'Mingles Mixer 42-55' singles event from meetup:dctechai (Rockville). | fixed (2026-10-29) | Secular Hub retired in data/review/sources-oct29-audit.json (tech:false); feed re-run, 0 of its events remain. The single dctechai singles event is per-event noise, left to the gate. |

Checked and sound: Mechanical audit clean; verified on organiser pages: South Dallas Maker Faire, All Things Open, BSides Peoria, BSides COS re-dates; Black Tech Week, JSNation US, ODSC West, Meeting in the Millyard city moves; Commit Your Code, QCon AI NY, HackMiami, Israel Tech Week, MadHacks, Socratica adds; CHM Live, INTERFACE Omaha, BSides TC confirmed rows; Jersey City Venture Garden (2026-10-11-i2-W4) now resolved

### 2026-10-22-i1 — 0 blocking, 3 warning(s)

Scope: Uncommitted run vs HEAD: first 'add' patch (oct21-coverage-fixes.json -> Hack Canada, Toronto, in data/raw/discovered.json), Venture Garden patches re-applied, build:data + ledger; no queue dispatched (stale Oct 11 DISPATCHED.tsv: 60/60 covered, 0 row-skipped).

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| W1 | warning | Hack Canada (Toronto) | last_date 2026-03-06 is the 2026 edition held at SPUR Innovation Centre, Waterloo (Devpost), not a Toronto edition. | fixed (2026-10-22) | Description notes the 2026 edition was in Waterloo; last_date kept as the same event's last edition (data/review/oct22-audit-fixes.json) |
| W2 | warning | Hack Canada (Toronto) | Record was verified at add time but has no ledger entry; shows as unchecked and queued 'never' in TO-VERIFY.tsv. | wont-fix (2026-10-22) | By design: refresh-events Step 2b queues every added record as 'never' so the next cycle's curators re-check it |
| W3 | warning | Jersey City Entrepreneurs: The Venture Garden (Jersey City) | oct05-r1 / oct07-s1 flip-flop applied again this run; net record unchanged, but the superseded cancelled-10-06 op still lives in oct05-r1-fixes.json and is correct only by apply order. | fixed (2026-10-22) | Removed the superseded cancelled-10-06 operation from oct05-r1-fixes.json; apply now reports Venture Garden SAME |

Checked and sound: Hack Canada dates/venue/city/cost/type/in-person/audience against hackcanada.org; no duplicate in events.json; discovered.json picked up once with source_file 'discovered'; Venture Garden byte-identical to HEAD; non-curated events.json churn traced to the date rebuild over unchanged feed files.

### 2026-10-11-i2 — 0 blocking, 6 warning(s)

Scope: Re-audit of iteration-1 fixes: 21 retirements (sources-oct11-audit.json) and new retire/drop gate logic in run.mjs, Charleston Digital Connect removal, place-override drops, judge_each, Offensive AI Con source, ledger last_attempt / audit-run / snapshot-dispatch tooling

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| W1 | warning | aiventurelab network remnants (Salt Lake City, Nashville, Calgary) | 3 past listings from groups not named in B1 link to aiventurelab.org (plus-code venues, same Claude Vibe Coding template); lace-up-for-casual-hockey-nights is registered tech:true so new templated listings pass unjudged. | fixed (2026-10-11) | 3 groups retired (sources-oct11-audit.json). |
| W2 | warning | The Longevity Social Club (Austin, Miami) | Registered as 'track record 10/10 clearly tech' but lists founder coffee hours, dinners, headshots, goal setting; only the two AI workshops are tech. Predates this run (added 2026-10-07). | fixed (2026-10-11) | Set to judge_each (sources-oct11-audit.json). |
| W3 | warning | Tech organisers rejected in new cities | Unchanged: TechSTL, Indy Hackers, ISSA Kentuckiana, New Media Manitoba, RockIT Women, GDG Kansas City, 16 Tech, TAB still tech:false. | fixed (2026-10-31) | All eight followed via data/review/sources-oct31-audit.json. Root cause: scripts/feeds/run.mjs ignored a tech:true proposal for an organiser already in the registry, so a gate rejection could never be overturned; it now un-retires gate rejections (a person's retirement still wins and is reported). |
| W4 | warning | Jersey City Entrepreneurs: The Venture Garden (Jersey City) | Unchanged: next_date 2026-10-10 passed, still upcoming; oct05-r1-fixes.json still carries the superseded 10-06 operation. | fixed (2026-10-29) | Jersey City Venture Garden is recurring-tbd with no elapsed date after oct29-t1 (confirmed by audit 2026-10-29-i1). |
| W5 | warning | City spelling splits (Québec City, trailing commas) | Partly resolved: city 'United States' gone. Still 1 'Québec City' vs 16 'Quebec City', and 9 feed records with trailing comma (Boston, Seattle, Toronto, Washington, Montréal). | fixed (2026-10-11) | geo.mjs matches cities accent-blind to the curated spelling and drops separators left by a state suffix ('Boston, MA'); carried records are re-spelt. It also broke the Pages deploy: the app folds accents, so its city count disagreed with the contract test. |
| W6 | warning | Tech Week non-tech socials | Unchanged, deferred to user: NTW Closing Party, Hard Tech Week Opening Party, Big Cayman Bash, Young Founders Hike still listed. | deferred (2026-10-11) | Waiting on the user's decision (same as 2026-10-07-i3-W1). |

Checked and sound: 0 events left from all 21 retired organisers; no name collisions; all non-retirement feed losses vs HEAD are cross-platform dedupe or earlier re-judgement (4 fetched); city drops only in network cities; Claude Workshops/Community calendars intact (29/28); B3, B4, W1, W2, W4 applied; 11 last_attempt rows genuine (2 re-fetched); selftest 44/44

### 2026-10-11-i1 — 4 blocking, 7 warning(s)

Scope: Oct 11 refresh: curator passes oct11-t1/t2/t3 (60 rows, 13 real updates), BSidesStPete script move, 17 new discovery cities with 121 auto-registered organisers (15 retired)

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| B1 | blocking | Templated Claude Code Meetup network (14 groups, 56 listings) | Mass-produced '<City> ... Claude Code ...' sessions at rotating private residential addresses and plus-codes, several per day, boilerplate text, one contiguous event-ID batch; includes repurposed non-tech groups. | fixed (2026-10-11) | 14 groups retired (data/review/sources-oct11-audit.json); retirement now also covers never-followed organisers and matches carried events by Meetup URL. 0 events left; genuine Claude Workshops / Claude Community Events calendars kept. |
| B2 | blocking | Non-tech organisers auto-registered in new cities (46 events) | Charlotte Mecklenburg Library Meetup, Hammerspace, Hartwig Inc., Common Ground Co., Women Working Remotely, Building a Christian Conscience with AI, CBUS Maker Meetup list board games, blacksmithing, CNC vendor training, succulent planting, Bible study, crafts; one record has city 'United States'. | fixed (2026-10-11) | 7 organisers retired in sources-oct11-audit.json; 0 events left. |
| B3 | blocking | Charleston Digital Connect (Charleston) | Fourth consecutive blocked pass; organiser calendar Oct 13-Dec 3 has 14 events and no such series; no web trace beyond one passA sighting. | fixed (2026-10-11) | Removed via data/review/oct11-audit-fixes.json. |
| B4 | blocking | Tampa AI Week (West Chester Township, 2026-10-15) | Eventbrite page says Postponed / Coming in 2027, venue 'TBDB' at the organiser's Ohio address; not an Oct 15 event and not in West Chester. | fixed (2026-10-11) | Dropped via data/feeds/place-overrides.json, which now supports drop: true for reviewed listings. |
| W1 | warning | MADE Makerspace (Sacramento), MakerSpace Charlotte | Mostly craft classes (jewellery, stained glass, woodshop) alongside a few CAD/3D-printing sessions. | fixed (2026-10-11) | Both makerspaces set to judge_each (sources-oct11-audit.json); existing organisers can now be switched. |
| W2 | warning | Claude SMB Workshop - Virtual (Boston; San Francisco) | Two online workshops from the Claude Workshops Luma calendar (luma.com/4s64itov, luma.com/fo8eqnar) listed as in-person. | fixed (2026-10-11) | Both dropped via place-overrides.json. |
| W3 | warning | Tech organisers rejected in new cities | TechSTL, Indy Hackers, ISSA Kentuckiana, New Media Manitoba, RockIT Women got 'no tech signal'; GDG Kansas City, 16 Tech, TAB rejected for 1 upcoming event. | fixed (2026-10-31) | Superseded by 2026-10-11-i2-W3, fixed 2026-10-31 (sources-oct31-audit.json). |
| W4 | warning | Offensive AI Con (Oceanside) | City correction is sound but source still cites dev.events/NA/US/CA/San_Diego. | fixed (2026-10-11) | Source set to https://www.offensiveaicon.com/ (oct11-audit-fixes.json). |
| W5 | warning | Jersey City Entrepreneurs: The Venture Garden (Jersey City) | next_date 2026-10-10 has passed; oct05-r1 and oct07-s1 patches flip-flop next_date (cancelled 10-06 vs 10-10), correct only by sort order. | deferred (2026-10-11) | Carried over as 2026-10-11-i2-W4. |
| W6 | warning | City spelling splits (Québec City, United States, trailing commas) | Run added 'Québec City' beside 'Quebec City' and a city 'United States'; 9 older feed records have trailing commas (Boston, Seattle, Toronto, Washington, Montréal). | deferred (2026-10-11) | Carried over as 2026-10-11-i2-W5. |
| W7 | warning | Tech Week non-tech socials | Still applies, smaller: NTW Closing Party, Hard Tech Week Opening Party, SF Funds Week party, Young Founders Hike. | deferred (2026-10-11) | Carried over as 2026-10-11-i2-W6. |

Checked and sound: Mechanical audit 0 blocking (60/60 ledger, 3/3 links); AONW->Seattle, BSides Seattle->Redmond, Offensive AI Con->Oceanside, CalgaryHacks, LWT 2027, DevFestMN venue, BSidesStPete move, 3 random confirms and 15 retirements all verified; LF Legal/PyTorch not a duplicate

### 2026-10-07-i3 — 1 blocking, 2 warning(s)

Scope: Oct 7 refresh, final re-audit (logged after the fact from AUDIT-REPORT.md; earlier runs predate the log)

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| B1 | blocking | Hack Club Capitol (Washington, DC) | Feed listed the Hack Club directory window (Sep 1 - Oct 9) instead of the event dates. | fixed (2026-10-11) | Curated record added (Oct 16-18); confirmed in events.json on Oct 9. |
| W1 | warning | Tech Week non-tech socials | Wine tasting, speed dating, run club and a party from Tech Week calendars are listed. | deferred (2026-10-11) | Left for the user to decide. |
| W2 | warning | Hardware + AI Boston (Boston, 2026-10-20) | Taken down as cancelled because the Tough Tech Week calendar unlisted it, but the event page is live. | fixed (2026-10-11) | Back in the directory on Oct 11 via its Eventbrite listing (same event, Oct 20). Underlying rule unchanged: an event unlisted from a fully-read calendar is still treated as taken down without re-checking its own page. |

Checked and sound: Mechanical audit 0 blocking; 43/43 dispatched rows have a ledger entry; 3/3 changed links resolve.
