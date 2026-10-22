# Audit log

Every auditor run, what it flagged, and what was done about it. Generated from
`data/review/audit-log.json` by `node agent/tools/audit-log.mjs render`; do not edit by hand.

## Runs

| run | days since previous run | blocking | warnings | fixed | still open | scope |
|---|---|---|---|---|---|---|
| 2026-10-07-i3 | — | 1 | 2 | 2 | 1 | Oct 7 refresh, final re-audit (logged after the fact from AUDIT-REPORT.md; earlier runs predate the log) |
| 2026-10-11-i1 | 4 | 4 | 7 | 7 | 4 | Oct 11 refresh: curator passes oct11-t1/t2/t3 (60 rows, 13 real updates), BSidesStPete script move, 17 new discovery cities with 121 auto-registered organisers (15 retired) |
| 2026-10-11-i2 | re-audit | 0 | 6 | 3 | 3 | Re-audit of iteration-1 fixes: 21 retirements (sources-oct11-audit.json) and new retire/drop gate logic in run.mjs, Charleston Digital Connect removal, place-override drops, judge_each, Offensive AI Con source, ledger last_attempt / audit-run / snapshot-dispatch tooling |
| 2026-10-22-i1 | 11 | 0 | 3 | 0 | 3 | Uncommitted run vs HEAD: first 'add' patch (oct21-coverage-fixes.json -> Hack Canada, Toronto, in data/raw/discovered.json), Venture Garden patches re-applied, build:data + ledger; no queue dispatched (stale Oct 11 DISPATCHED.tsv: 60/60 covered, 0 row-skipped). |

**3 audit cycle(s); 2 found something blocking on its first audit.** 23 findings in total, 12 fixed, 11 open or deferred, 7 repeat(s) of an earlier finding.

## Open

- **2026-10-07-i3-W1** · warning · deferred · **Tech Week non-tech socials** — Wine tasting, speed dating, run club and a party from Tech Week calendars are listed.
  - recommended: User decision: filter non-tech socials from tech-week calendars or keep them.
  - note: Left for the user to decide.
- **2026-10-11-i1-W3** · warning · deferred · **Tech organisers rejected in new cities** — TechSTL, Indy Hackers, ISSA Kentuckiana, New Media Manitoba, RockIT Women got 'no tech signal'; GDG Kansas City, 16 Tech, TAB rejected for 1 upcoming event.
  - recommended: Propose them in a sources-*.json.
  - note: Carried over as 2026-10-11-i2-W3.
- **2026-10-11-i1-W5** · warning · deferred · **Jersey City Entrepreneurs: The Venture Garden (Jersey City)** — next_date 2026-10-10 has passed; oct05-r1 and oct07-s1 patches flip-flop next_date (cancelled 10-06 vs 10-10), correct only by sort order.
  - recommended: Re-check the Meetup group for the next active session; delete the superseded op from oct05-r1-fixes.json.
  - note: Carried over as 2026-10-11-i2-W4.
- **2026-10-11-i1-W6** · warning · deferred · **City spelling splits (Québec City, United States, trailing commas)** — Run added 'Québec City' beside 'Quebec City' and a city 'United States'; 9 older feed records have trailing commas (Boston, Seattle, Toronto, Washington, Montréal).
  - recommended: Strip trailing punctuation, add a québec city alias in scripts/lib/places.mjs, reject a country as a city.
  - note: Carried over as 2026-10-11-i2-W5.
- **2026-10-11-i1-W7** · warning · deferred · **Tech Week non-tech socials** — Still applies, smaller: NTW Closing Party, Hard Tech Week Opening Party, SF Funds Week party, Young Founders Hike.
  - recommended: User decision (deferred).
  - note: Carried over as 2026-10-11-i2-W6.
- **2026-10-11-i2-W3** · warning · **Tech organisers rejected in new cities** — Unchanged: TechSTL, Indy Hackers, ISSA Kentuckiana, New Media Manitoba, RockIT Women, GDG Kansas City, 16 Tech, TAB still tech:false.
  - recommended: Propose them in a sources-*.json.
- **2026-10-11-i2-W4** · warning · **Jersey City Entrepreneurs: The Venture Garden (Jersey City)** — Unchanged: next_date 2026-10-10 passed, still upcoming; oct05-r1-fixes.json still carries the superseded 10-06 operation.
  - recommended: Re-check meetup.com/jersey-city-entrepreneurs for the next session; delete the Jersey City op from oct05-r1-fixes.json.
- **2026-10-11-i2-W6** · warning · deferred · **Tech Week non-tech socials** — Unchanged, deferred to user: NTW Closing Party, Hard Tech Week Opening Party, Big Cayman Bash, Young Founders Hike still listed.
  - recommended: No action until the user decides.
  - note: Waiting on the user's decision (same as 2026-10-07-i3-W1).
- **2026-10-22-i1-W1** · warning · **Hack Canada (Toronto)** — last_date 2026-03-06 is the 2026 edition held at SPUR Innovation Centre, Waterloo (Devpost), not a Toronto edition.
  - recommended: Clear last_date, or keep it and note in the description that the 2026 edition was in Waterloo; do it via patch.
- **2026-10-22-i1-W2** · warning · **Hack Canada (Toronto)** — Record was verified at add time but has no ledger entry; shows as unchecked and queued 'never' in TO-VERIFY.tsv.
  - recommended: Record a confirmed ledger entry citing hackcanada.org; consider having the add action write it.
- **2026-10-22-i1-W3** · warning · **Jersey City Entrepreneurs: The Venture Garden (Jersey City)** — oct05-r1 / oct07-s1 flip-flop applied again this run; net record unchanged, but the superseded cancelled-10-06 op still lives in oct05-r1-fixes.json and is correct only by apply order.
  - recommended: Remove or neutralise the Venture Garden op in oct05-r1-fixes.json.

## History

### 2026-10-22-i1 — 0 blocking, 3 warning(s)

Scope: Uncommitted run vs HEAD: first 'add' patch (oct21-coverage-fixes.json -> Hack Canada, Toronto, in data/raw/discovered.json), Venture Garden patches re-applied, build:data + ledger; no queue dispatched (stale Oct 11 DISPATCHED.tsv: 60/60 covered, 0 row-skipped).

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| W1 | warning | Hack Canada (Toronto) | last_date 2026-03-06 is the 2026 edition held at SPUR Innovation Centre, Waterloo (Devpost), not a Toronto edition. | open |  |
| W2 | warning | Hack Canada (Toronto) | Record was verified at add time but has no ledger entry; shows as unchecked and queued 'never' in TO-VERIFY.tsv. | open |  |
| W3 | warning | Jersey City Entrepreneurs: The Venture Garden (Jersey City) | oct05-r1 / oct07-s1 flip-flop applied again this run; net record unchanged, but the superseded cancelled-10-06 op still lives in oct05-r1-fixes.json and is correct only by apply order. | open |  |

Checked and sound: Hack Canada dates/venue/city/cost/type/in-person/audience against hackcanada.org; no duplicate in events.json; discovered.json picked up once with source_file 'discovered'; Venture Garden byte-identical to HEAD; non-curated events.json churn traced to the date rebuild over unchanged feed files.

### 2026-10-11-i2 — 0 blocking, 6 warning(s)

Scope: Re-audit of iteration-1 fixes: 21 retirements (sources-oct11-audit.json) and new retire/drop gate logic in run.mjs, Charleston Digital Connect removal, place-override drops, judge_each, Offensive AI Con source, ledger last_attempt / audit-run / snapshot-dispatch tooling

| id | severity | event | finding | status | resolution |
|---|---|---|---|---|---|
| W1 | warning | aiventurelab network remnants (Salt Lake City, Nashville, Calgary) | 3 past listings from groups not named in B1 link to aiventurelab.org (plus-code venues, same Claude Vibe Coding template); lace-up-for-casual-hockey-nights is registered tech:true so new templated listings pass unjudged. | fixed (2026-10-11) | 3 groups retired (sources-oct11-audit.json). |
| W2 | warning | The Longevity Social Club (Austin, Miami) | Registered as 'track record 10/10 clearly tech' but lists founder coffee hours, dinners, headshots, goal setting; only the two AI workshops are tech. Predates this run (added 2026-10-07). | fixed (2026-10-11) | Set to judge_each (sources-oct11-audit.json). |
| W3 | warning | Tech organisers rejected in new cities | Unchanged: TechSTL, Indy Hackers, ISSA Kentuckiana, New Media Manitoba, RockIT Women, GDG Kansas City, 16 Tech, TAB still tech:false. | open |  |
| W4 | warning | Jersey City Entrepreneurs: The Venture Garden (Jersey City) | Unchanged: next_date 2026-10-10 passed, still upcoming; oct05-r1-fixes.json still carries the superseded 10-06 operation. | open |  |
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
| W3 | warning | Tech organisers rejected in new cities | TechSTL, Indy Hackers, ISSA Kentuckiana, New Media Manitoba, RockIT Women got 'no tech signal'; GDG Kansas City, 16 Tech, TAB rejected for 1 upcoming event. | deferred (2026-10-11) | Carried over as 2026-10-11-i2-W3. |
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
