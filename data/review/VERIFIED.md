# Verification ledger

**Read this before verifying anything.** It records which events have already been
checked against the organiser's own page, so a pass can spend its budget on what is
still unknown rather than re-confirming what is settled.

Updated 2026-09-15 · dataset holds 883 events.

| status | count | share | meaning |
|---|---:|---:|---|
| `confirmed` | 680 | 77.0% | checked against the organiser's page, correct as recorded — **skip these** |
| `corrected` | 55 | 6.2% | checked, found wrong, patched — **skip these** |
| `blocked` | 147 | 16.6% | attempted, page unreadable by fetch — **needs a web search or a human with a browser** |
| _unchecked_ | 1 | 0.1% | never attempted — **verify these first** |

## Re-check queue

A verification is a snapshot, not a subscription. `data/review/TO-VERIFY.tsv` is
regenerated on every run from the rules below, so it refills itself rather than
sitting empty and reading as "done" when it means "no longer watching".

**176 of 883 events are due for a re-check.**

| reason | count | why it fires |
|---|---:|---|
| `never` | 1 | never checked |
| `blocked` | 147 | previous check could not read the page |
| `regroup` | 2 | a group that meets weekly or monthly, showing no next date — wrong on the page today |
| `rolled` | 26 | an annual edition ran since it was checked; next one is far off |

Recurring groups (`weekly`, `monthly`, `rolling`, `quarterly`) are re-checked on a
180-day clock rather than 90, because for them the useful question is whether the
group still meets, not what its next date is.

## How to add to this ledger

Write a JSON array to `data/review/confirm-<yourcycle>.json`:

```json
[
  { "name": "DEF CON", "city": "Las Vegas", "status": "confirmed",
    "cycle": "5a", "evidence": "defcon.org shows Aug 5-8 2027, matches record" },
  { "name": "HackMIT", "city": "Cambridge", "status": "blocked",
    "cycle": "5a", "evidence": "JS-only site, date only in hero image" }
]
```

Then run `node scripts/ledger.mjs`. Use `corrected` when you also emitted a patch.
A stronger outcome or a newer date always wins, so re-checks refresh a stale entry.

## Ledger rows with no matching event (39)

These were checked, then the event was removed from the dataset by a later patch.
Kept so the same dead lead is not researched again.

- **NY Tech Meetup** — New York City (corrected, cycle3-retry): Implausible attendance for the event type. meetup.com/ny-tech shows '52,297 members' - the dataset's 52000 is the group's cumulative membership count, not the turnout at any single
- **BITCON** — Atlanta (corrected, cycle4-links): blacksintechnology.net now responds (transient failure), but the org homepage is not the conference. WebFetch confirmed the dedicated BITCON conference site at bitcon.blacksintechn
- **HackNYU** — New York City (corrected, cycle4-links): hacknyu.org refuses connections (ECONNREFUSED 167.71.252.160:443) and hacknyu.com is a parked HugeDomains sale page. The official HackNYU club site at hacknyu.github.io loads and s
- **Startup Week Columbus** — Columbus (corrected, cycle4-links): startupcolumbus.com redirects to a stale SparkWorks page for the 2022 edition (columbus-startup-week-22). Repointed to the verified current SparkWorks event page for Columbus Start
- **Ocean Exchange** — Savannah (confirmed, 4a): spot-check: URL loaded, page described the right event, city matched
- **5 Across Pitch Competition** — Lexington (confirmed, 4a): spot-check: URL loaded, page described the right event, city matched
- **MIT $100K** — Cambridge (confirmed, 4a): spot-check: URL loaded, page described the right event, city matched
- **CyberBay** — Tampa (confirmed, 2): spot-check by the researcher after merge
- **InsurTech America** — Hartford (confirmed, 2): spot-check by the researcher after merge
- **GDG Brooklyn** — Brooklyn (confirmed, 2): spot-check by the researcher after merge
- **CO.LAB** — Chattanooga (confirmed, 2): spot-check by the researcher after merge
- **IdeaFunding** — Lincoln (confirmed, 2): spot-check by the researcher after merge
- **tech SAVannah** — Savannah (confirmed, 2): spot-check by the researcher after merge
- **TechMentor** — Redmond (confirmed, 2): spot-check by the researcher after merge
- **Jersey City Entrepreneurs** — Jersey City (confirmed, 2): spot-check by the researcher after merge
- **KCD SF Bay Area** — San Francisco (confirmed, 3r2a): verified against organiser page (near-term date sweep)
- **RustConf** — Montreal (confirmed, 3r2a): verified against organiser page (near-term date sweep)
- **Day of Data Detroit** — Detroit (confirmed, 3r2a): verified against organiser page (near-term date sweep)
- **Digital Okanagan** — Kelowna (confirmed, 3r2a): verified against organiser page (near-term date sweep)
- **Atlantic Technology Summit** — Halifax (corrected, orchestrator): cips.ca names no such event; record removed as unverifiable and mis-linked.
- **InnovateNB Awards** — Fredericton (corrected, orchestrator): nbif.ca names only Breakthru and the Innovation Voucher Fund; record removed as a phantom.
- **AGNTCon + MCPCon North America** — San Francisco (confirmed, passB): dev.events San Francisco listing shows 'AGNTCon + MCPCon North America 2027', 'Apr 28-29 27', San Francisco CA
- **Oracle CloudWorld** — Las Vegas (corrected, passA): oracle.com/cloudworld/ now titled 'Oracle AI World 2026'; JSON-LD startDate 2026-10-25 endDate 2026-10-28, hero 'October 25-28 | Las Vegas'. Record had Sep 15-18 — wrong by six weeks
- **Tech Week Los Angeles** — Los Angeles (confirmed, c3): tech-week.com sits behind a Vercel Security Checkpoint that returns 429 to every fetcher and to WebFetch, so the organiser's official LA Tech Week calendar on Luma was read instead: luma.com/latw, calendar name 'LA Tech Week', blurb 'Welcome to ... Tech Week from October 12-18, 2026'. Cross-checked against the sibling a16z calendars to rule out a copy-paste of another city's window: luma.com/sftw gives 'San Francisco Tech Week from October 5-11, 2026' and luma.com/nytw gives 'New York Tech Week from June 1-7, 2026', so Oct 12-18 is LA's own dates. Matches the stored 2026-10-12..2026-10-18. NOTE: this record and the 'LA Tech Week' record are the same a16z event - same city, same dates, same organiser - flagged to the orchestrator rather than removed unilaterally.
- **Open Source in Finance Forum** — New York (confirmed, script): automated: page still shows "nov 4"
- **Abstractions** — Pittsburgh (corrected, passC): abstractions.io still advertises 'August 21-23, 2019 in Pittsburgh' as the upcoming edition; site frozen 7 years with no forward activity - no further edition ever held
- **Global Game Jam - AAPI in Gaming** — Vancouver (corrected, passC): globalgamejam.org 2026 jam-site page states 'This site is Online/Virtual only' - there is no in-person Vancouver venue behind this listing
- **Global Game Jam - Gay Gaming Professionals** — Northridge (corrected, passC): globalgamejam.org 2026 jam-site page is titled '(Online/Virtual Only)' and runs on Discord; Northridge CA is the organiser's base, not a venue
- **HackTheU** — Salt Lake City (corrected, passC): hacktheu.org is frozen on the 2020/2021 edition - MLH 2021 trust badge, FAQ referencing 'fall hackathon 2020', dates 'October 16-18' with no current year; no forward activity in ~5 years
- **Houston Tech Rodeo** — Houston (corrected, unblockB): SQUATTED. houstonexponential.org returns HTTP 200 but the page is titled 'houstonexponential -' and its only content is Indonesian online-slot spam ('SCATTER911 | Link RTP Situs Slot Gacor 777 Hari Ini Depo Receh', posted October 5, 2025) promoting Pragmatic Play / PG Soft casino games. The event's own domain houstontechrodeo.com is gone too - it now serves 'The Original Ice Ball Maker Australia | Say No To Ice Cubes!'. No surviving organiser page names the event. Removal patch emitted.
- **Innovate QA** — Bellevue (corrected, passC): dev.events/NA/US/WA/Bellevue/tech is a generic Bellevue conference directory and does not list 'Innovate QA' anywhere; a dev.events site search for the name also returns nothing - the link does not describe the event
- **Metabridge Live** — Kelowna (corrected, unblockB): SQUATTED. www.metabridge.ca redirects to metabridge.ca and returns HTTP 200 with the title 'Magpie Bridge Slot Review | Game by Aspect Gaming'; the entire page is online-casino slot review content (reels, rows, paylines, volatility, RTP, betting range). Nothing on the domain refers to Metabridge Live, Kelowna, or a tech conference. Removal patch emitted.
- **Music City Tech** — Nashville (corrected, passC): musiccitytech.com is frozen on the September 15-17 2021 edition (Music City Code/Agile/Data tracks) with no forward activity in five years
- **RailsConf** — Philadelphia (corrected, passC): rubycentral.org/conferences states 'After nearly 20 years, RailsConf 2025 was the final gathering of its kind' - the conference is discontinued
- **THAT Conference Texas** — Round Rock (corrected, unblockB): DEFUNCT. thatconference.com loads (HTTP 200) and the entire homepage is a wind-down notice: 'After 15 incredible years of bringing together thousands of geeks... we're taking a pause to reimagine THAT Conference... While we won't be hosting THAT Conference, this isn't goodbye', linking to /blog/its-time-we-took-a-pause. No Texas edition is scheduled and /tx/2026 returns 404. Removal patch emitted.
- **THAT Conference Wisconsin** — Wisconsin Dells (corrected, unblockB): DEFUNCT. Same source as the Texas record - thatconference.com's homepage is now only the pause notice ('While we won't be hosting THAT Conference, this isn't goodbye'), with no Wisconsin edition scheduled and /wi/2026 returning 404. Removal patch emitted.
- **NVTC Cyber Summit & Cyber50 Awards** — McLean (corrected, passA): nvtc.org/events/ lists 'NVTC Cyber Summit & Cyber50 Awards, Oct 28, 2026 | McLean, VA'. Date correct; city was wrong (Reston -> McLean)
- **Milwaukee Tech Hub Code & Coffee** — Milwaukee (corrected, staleness): mketech.org calendar lists September 5 2026 as upcoming; the date was filed in last_date.
- **AGNTCon + MCPCon North America** — San Jose (corrected, staleness): LF Events: 2026 edition Oct 22-23 San Jose, 2027 edition Apr 28-29 San Francisco. Record had the 2027 date as next, the 2026 date as last, and the wrong city.

## blocked (147)

Attempted and unreadable by fetch. These are where a web search actually earns its cost.

| event | city | next date | checked | cycle | evidence |
|---|---|---|---|---|---|
| a2Tech360 | Ann Arbor | 2026-09-22 | 2026-09-15 | script | automated: "september 22" appears, but so do 1 date(s) this event does not have (e.g. 2026-09-29) — the page lists too many dates for a match to mean anything |
| AAAI Conference on Artificial Intelligence | Montreal | 2027-02-16 | 2026-09-15 | script | automated: "february 16" appears, but so do 1 date(s) this event does not have (e.g. 2027-02-23) — the page lists too many dates for a match to mean anything |
| Accelerate Conference | Flowood | 2026-11-10 | 2026-09-15 | script | automated: "november 10" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-19) — the page lists too many dates for a match to mean anything |
| AI & Big Data Expo North America | San Jose | 2027-06-16 | 2026-09-15 | script | automated: no response |
| AI Builder Lab Meetup | Sioux Falls | 2026-09-17 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| AI Product Summit Silicon Valley | San Jose | 2027-04-15 | 2026-09-15 | script | automated: no response |
| BigRed//Hacks | Ithaca | 2026-10-02 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Black Hat USA | Las Vegas | 2027-07-31 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Boise Entrepreneur Week | Boise | 2026-09-28 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Boston Data and AI Saturday | Boston | 2026-10-03 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| BSides Bloomington | Bloomington | 2026-10-02 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| BSides Edmonton | Edmonton | 2026-09-24 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| BSides Nashville | Nashville | 2027-04-23 | 2026-09-15 | script | automated: "april 23" appears, but so do 1 date(s) this event does not have (e.g. 2027-04-02) — the page lists too many dates for a match to mean anything |
| BSides NOLA | New Orleans | 2027-05-11 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| BSides PDX | Portland | 2026-10-23 | 2026-09-15 | script | automated: "oct 23" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-02) — the page lists too many dates for a match to mean anything |
| BSides Philly | Philadelphia | 2026-12-11 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| BSides TC | Minneapolis | 2026-10-23 | 2026-09-15 | script | automated: "october 23" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-02) — the page lists too many dates for a match to mean anything |
| BSidesCache | Logan | 2026-09-18 | 2026-09-15 | script | automated: "sep 18" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-02) — the page lists too many dates for a match to mean anything |
| BSidesCharm | Baltimore | 2027-04-24 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Buffalo Game Space Game Development Meeting | Buffalo | 2026-09-24 | 2026-09-15 | script | automated: "sep 24" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-08) — the page lists too many dates for a match to mean anything |
| Cambridge Science Festival | Cambridge | 2026-09-23 | 2026-09-15 | script | automated: "september 23" appears, but so do 1 date(s) this event does not have (e.g. 2026-09-02) — the page lists too many dates for a match to mean anything |
| Charleston Digital Connect | Charleston | 2026-09-17 | 2026-09-15 | script | automated: "sep 17" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-01) — the page lists too many dates for a match to mean anything |
| CHM Live | Mountain View | 2026-09-23 | 2026-09-15 | script | automated: "september 23, 2026" appears, but so do 1 date(s) this event does not have (e.g. 2026-09-02) — the page lists too many dates for a match to mean anything |
| Clojure/conj | Charlotte | 2026-09-30 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Cloud Nirvana Columbus | Columbus | 2026-09-16 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| CodeRED | Houston | 2026-10-10 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| CONNECT: Networking for Entrepreneurs | Jackson | 2026-10-01 | 2026-09-15 | script | automated: "october 1" appears, but so do 2 date(s) this event does not have (e.g. 2026-11-05) — the page lists too many dates for a match to mean anything |
| CT Tech Week | Multiple cities | 2027-06-07 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| CUhackit | Clemson | 2027-02-20 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| CyberBay Summit | Tampa | 2027-03-22 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| CyberForce Competition | Tinley Park | 2026-11-13 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Data in the D | Detroit | 2026-10-16 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Data Streaming Summit | San Francisco | 2026-10-07 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Day of Data Orlando | Orlando | 2026-10-17 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Day of Data Pittsburgh | Pittsburgh | 2026-10-10 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Day of Data Toronto | Toronto | 2026-09-26 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Day of Data Winnipeg | Winnipeg | 2026-09-19 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| DEF CON | Las Vegas | 2027-08-05 | 2026-09-15 | script | automated: "august 5" appears, but so do 1 date(s) this event does not have (e.g. 2027-07-15) — the page lists too many dates for a match to mean anything |
| dev2next | Lone Tree | 2026-10-12 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| DeveloperWeek | Santa Clara | 2027-02-09 | 2026-09-15 | script | automated: no response |
| DevFest KC | Kansas City | 2026-11-07 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| DevFest Salt Lake City | Salt Lake City | 2026-09-19 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Digital Summit Philadelphia | Philadelphia | 2026-09-23 | 2026-09-15 | script | automated: "september 23" appears, but so do 1 date(s) this event does not have (e.g. 2026-09-02) — the page lists too many dates for a match to mean anything |
| DrupalCon North America | Orlando | 2027-03-22 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| ElleHacks | Toronto | 2027-01-29 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| ETHConf | New York | 2027-06-14 | 2026-09-15 | script | automated: no response |
| Founders Meetup Sioux Falls | Sioux Falls | 2026-09-16 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Founders Retreat | Fort Ransom | 2026-11-18 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| FTW:SF | San Francisco | 2026-09-29 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Game Discovery Exhibition (GDX) | Edmonton | 2026-10-23 | 2026-09-15 | script | automated: "october 23" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-02) — the page lists too many dates for a match to mean anything |
| Gartner IT Symposium/Xpo | Orlando | 2026-10-19 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| GDEX | Newark | 2026-10-15 | 2026-09-15 | script | automated: no response |
| Global Game Jam | Multiple cities | 2027-01-25 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| GoSec | Montreal | 2026-09-23 | 2026-09-15 | script | automated: "september 23" appears, but so do 1 date(s) this event does not have (e.g. 2026-09-02) — the page lists too many dates for a match to mean anything |
| Hack Knight | Flushing | 2026-10-09 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Hack the North | Waterloo | 2026-09-18 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| HackGT | Atlanta | 2026-09-25 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| HackHarvard | Cambridge | 2026-10-16 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| HackIllinois | Urbana-Champaign | 2027-02-26 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| HackKU | Lawrence | 2027-04-09 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Hacklytics | Atlanta | 2027-02-26 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| HackMIT | Cambridge | 2026-09-19 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| HackOHI/O | Columbus | 2026-10-24 | 2026-09-15 | script | automated: "october 24, 2026" appears, but so do 2 date(s) this event does not have (e.g. 2026-10-03) — the page lists too many dates for a match to mean anything |
| HackTX | Austin | 2026-10-24 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| HackUMass | Amherst | 2026-11-13 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Hackville | Mississauga | 2027-01-22 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| HashiConf | Atlanta | 2026-10-26 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Houston Day of Data | Houston | 2026-12-05 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| HPSF Conference | Montreal | 2027-04-12 | 2026-09-15 | script | automated: "apr 12" appears, but so do 1 date(s) this event does not have (e.g. 2027-05-17) — the page lists too many dates for a match to mean anything |
| Humanoid Robots Summit North America | Chicago | 2026-11-03 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| IBM TechXchange Conference | Atlanta | 2026-10-26 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| iFiveK | Charleston | 2027-04-22 | 2026-09-15 | script | automated: "april 22, 2027" appears, but so do 1 date(s) this event does not have (e.g. 2027-04-01) — the page lists too many dates for a match to mean anything |
| Ignite Summit | Fredericton | 2026-10-20 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Innovation Depot Founders Round Table | Birmingham | 2026-10-22 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| InsurTech Hartford Innovation Challenge Awards | Hartford | 2026-10-27 | 2026-09-15 | script | automated: "oct 27, 2026" appears, but so do 2 date(s) this event does not have (e.g. 2026-12-01) — the page lists too many dates for a match to mean anything |
| Interface | Quebec City | 2027-06-01 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Jersey City Entrepreneurs: The Venture Garden | Jersey City | 2026-09-19 | 2026-09-15 | script | automated: "sep 19" appears, but so do 2 date(s) this event does not have (e.g. 2026-09-26) — the page lists too many dates for a match to mean anything |
| LA Hacks | Los Angeles | 2027-04-16 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| LA Hacks AI Hackathon | Los Angeles | 2026-10-17 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| LA Tech Week | Los Angeles | 2026-10-12 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Launch Wisconsin | Milwaukee | 2026-10-06 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Legalweek New York | New York | 2027-03-01 | 2026-09-15 | script | automated: no response |
| Lesbians Who Tech + Allies Summit | New York | 2026-10-05 | 2026-09-15 | script | automated: no response |
| Linux Foundation Member Summit | Half Moon Bay | 2027-02-22 | 2026-09-15 | script | automated: "feb 22" appears, but so do 1 date(s) this event does not have (e.g. 2027-03-01) — the page lists too many dates for a match to mean anything |
| MakeUofT | Toronto | 2027-02-13 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Manufacturing Day at WSU Tech | Wichita | 2026-10-02 | 2026-09-15 | script | automated: "october 2, 2026" appears, but so do 2 date(s) this event does not have (e.g. 2026-10-09) — the page lists too many dates for a match to mean anything |
| MariHacks | Montreal | 2027-04-09 | 2026-09-15 | script | automated: 476-byte stub, likely a captcha |
| MDEV | Madison | 2026-11-06 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Meta Connect | Menlo Park | 2026-09-23 | 2026-09-15 | script | automated: "september 23" appears, but so do 1 date(s) this event does not have (e.g. 2026-09-02) — the page lists too many dates for a match to mean anything |
| MHacks | Ann Arbor | 2026-10-03 | 2026-09-15 | script | automated: "october 3" appears, but so do 1 date(s) this event does not have (e.g. 2026-09-12) — the page lists too many dates for a match to mean anything |
| Microsoft Ignite | San Francisco | 2026-11-17 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| MidCamp | Chicago | 2027-04-28 | 2026-09-15 | script | automated: "april 28" appears, but so do 1 date(s) this event does not have (e.g. 2027-05-12) — the page lists too many dates for a match to mean anything |
| Midwest Gaming Classic | Milwaukee | 2027-04-23 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Minneapolis Technology Summit | Minneapolis | 2026-10-22 | 2026-09-15 | script | automated: no response |
| Mira Awards | Indianapolis | 2027-04-23 | 2026-09-15 | script | automated: "april 23" appears, but so do 1 date(s) this event does not have (e.g. 2027-04-02) — the page lists too many dates for a match to mean anything |
| National Cyber Summit | Huntsville | 2026-09-22 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| OWASP Global AppSec USA | San Francisco | 2026-11-02 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Partner Vibe | Salt Lake City | 2026-09-21 | 2026-09-15 | script | automated: "sep 21" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-26) — the page lists too many dates for a match to mean anything |
| Pittsburgh TechFest | Pittsburgh | 2026-10-30 | 2026-09-15 | script | automated: "oct 30" appears, but so do 1 date(s) this event does not have (e.g. 2026-11-13) — the page lists too many dates for a match to mean anything |
| Product-Led Summit Denver | Denver | 2027-04-07 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Product-Led Summit San Francisco | San Francisco | 2026-09-22 | 2026-09-15 | script | automated: no response |
| Product-Led Summit Seattle | Seattle | 2027-06-16 | 2026-09-15 | script | automated: "jun 16" appears, but so do 1 date(s) this event does not have (e.g. 2027-05-26) — the page lists too many dates for a match to mean anything |
| Product-Led Summit Toronto | Toronto | 2026-11-12 | 2026-09-15 | script | automated: "nov 12" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-21) — the page lists too many dates for a match to mean anything |
| PTC Annual Conference | Honolulu | 2027-01-17 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Rails World | Austin | 2026-09-23 | 2026-09-15 | script | automated: "september 23" appears, but so do 1 date(s) this event does not have (e.g. 2026-09-02) — the page lists too many dates for a match to mean anything |
| RevolutionUC | Cincinnati | 2027-02-27 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Rowdy Hacks | San Antonio | 2026-10-03 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| RSAC Conference | San Francisco | 2027-04-05 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| SAAS NORTH | Ottawa | 2026-11-04 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Salt Lake City Day of Data | Salt Lake City | 2026-09-19 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| San Diego CyberCon | San Diego | 2026-11-13 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| SANS AI Cybersecurity Summit | Arlington | 2026-11-02 | 2026-09-15 | script | automated: "nov 2" appears, but so do 1 date(s) this event does not have (e.g. 2026-12-07) — the page lists too many dates for a match to mean anything |
| SANS DFIR Summit & Training | Arlington | 2026-10-15 | 2026-09-15 | script | automated: "october 15" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-22) — the page lists too many dates for a match to mean anything |
| SAP Connect | Las Vegas | 2026-10-05 | 2026-09-15 | script | automated: 380-byte stub, likely a captcha |
| SBUHacks | Stony Brook | 2026-10-23 | 2026-09-15 | script | automated: "october 23, 2026" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-02) — the page lists too many dates for a match to mean anything |
| SC Conference (Supercomputing) | Chicago | 2026-11-15 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Scrum Day Houston | Houston | 2026-10-06 | 2026-09-15 | script | automated: "oct 6" appears, but so do 1 date(s) this event does not have (e.g. 2026-09-15) — the page lists too many dates for a match to mean anything |
| SeaGL | Seattle | 2026-10-23 | 2026-09-15 | script | automated: "october 23" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-02) — the page lists too many dates for a match to mean anything |
| SecKC | Kansas City | 2026-10-13 | 2026-09-15 | script | automated: "october 13, 2026" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-20) — the page lists too many dates for a match to mean anything |
| Security BSides Albuquerque | Albuquerque | 2026-09-25 | 2026-09-15 | script | automated: no response |
| ServiceNow Knowledge | Las Vegas | 2027-05-04 | 2026-09-15 | script | automated: no response |
| SF Tech Week | San Francisco | 2026-10-05 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| ShellHacks | Miami | 2026-09-25 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| SLOSS.tech | Birmingham | 2027-06-23 | 2026-09-15 | script | automated: "june 23" appears, but so do 1 date(s) this event does not have (e.g. 2027-06-02) — the page lists too many dates for a match to mean anything |
| Southwestern Ontario Drupal Camp | Waterloo | 2026-10-23 | 2026-09-15 | script | automated: "october 23" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-02) — the page lists too many dates for a match to mean anything |
| SpiceWorld | Austin | 2026-11-12 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| SQLSaturday Minnesota | St. Paul | 2026-10-24 | 2026-09-15 | script | automated: "24 october 2026" appears, but so do 2 date(s) this event does not have (e.g. 2026-10-03) — the page lists too many dates for a match to mean anything |
| STARWEST | Anaheim | 2026-09-20 | 2026-09-15 | script | automated: no response |
| SteelHacks | Pittsburgh | 2026-09-19 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| SwampHacks | Gainesville | 2026-10-16 | 2026-09-15 | script | automated: 467-byte stub, likely a captcha |
| TechCrunch Disrupt | San Francisco | 2026-10-13 | 2026-09-15 | script | automated: "october 13" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-20) — the page lists too many dates for a match to mean anything |
| TechExit.io Calgary | Calgary | 2026-10-01 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Tennessee Quantum Hackathon | Chattanooga | 2026-11-13 | 2026-09-15 | script | automated: "november 13" appears, but so do 1 date(s) this event does not have (e.g. 2026-11-20) — the page lists too many dates for a match to mean anything |
| The AI Conference | San Francisco | 2026-09-29 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| The AI Pivot Conference | Anaheim | 2026-09-25 | 2026-09-15 | script | automated: no response |
| UGAHacks | Athens | 2027-02-05 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Umbraco US Festival | Chicago | 2026-09-30 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| UofTHacks | Toronto | 2027-01-15 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| uOttaHack | Ottawa | 2027-01-15 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Victoria Tech Week | Victoria | 2026-09-21 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| Vintage Computer Festival Montreal | Montreal | 2026-11-07 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| ViVE | Nashville | 2027-03-14 | 2026-09-15 | script | automated: "march 14" appears, but so do 1 date(s) this event does not have (e.g. 2027-03-20) — the page lists too many dates for a match to mean anything |
| WeAreDevelopers World Congress | San Jose | 2026-09-23 | 2026-09-15 | script | automated: "september 23" appears, but so do 1 date(s) this event does not have (e.g. 2026-09-02) — the page lists too many dates for a match to mean anything |
| WEHack | Richardson | 2027-04-10 | 2026-09-15 | script | automated: page loads but the stored date is not on it and it publishes no structured date |
| West Slope Startup Week | Durango | 2026-10-05 | 2026-09-15 | script | automated: "oct 5" appears, but so do 1 date(s) this event does not have (e.g. 2026-10-12) — the page lists too many dates for a match to mean anything |
| WiCHacks | Rochester | 2027-02-27 | 2026-09-15 | script | automated: 469-byte stub, likely a captcha |
| Wisconsin Biohealth Summit | Milwaukee | 2026-10-21 | 2026-09-15 | script | automated: "oct 21 2026" appears, but so do 1 date(s) this event does not have (e.g. 2026-09-30) — the page lists too many dates for a match to mean anything |

## corrected (55)

Checked and patched.

| event | city | next date | checked | cycle | evidence |
|---|---|---|---|---|---|
| Arkansas IT Symposium | Little Rock | — | 2026-08-26 | search-unblock | May 6 2026, Statehouse Convention Center Little Rock - matches stored last_date. URL moved off the Cloudflare-walled 10times listing. |
| Atlantic Venture Forum | Halifax | — | 2026-08-26 | search-unblock | June 17-18 2026, Halifax Convention Centre - matches stored last_date. URL moved to atlanticventureforum.ca, already advertising AVF2027. |
| Berkeley SkyDeck Demo Day | Berkeley | — | 2026-08-26 | r2-redirects | skydeck.berkeley.edu/demo-day/ redirects to demo-day-fall-2020, an article dated 04 February 2020 |
| Boston TechJam | Boston | — | 2026-08-26 | search-unblock | MassTLC Boston TechJam ran June 13 2026 at City Hall Plaza. Record had no date. |
| BSides Calgary | Calgary | — | 2026-08-26 | cycle1-links | Bare bsidescalgary.org does not resolve; www host loads and shows BSides Calgary 2026 at Contemporary Calgary, May 25-26 2026. |
| BSides ICS/OT | Tampa | — | 2026-08-26 | passC | bsidesics.org: event runs the day before S4; 2026 edition was Miami but the site now advertises 'BSidesICS/OT 2027 Tampa, FL' (details TBA) - next edition city is Tampa, not Miami |
| BSides San Diego | San Diego | — | 2026-08-26 | cycle1-links | Bare bsidessd.org does not resolve; www host loads and is the official BSides San Diego site with 2026 event details. |
| BSides Vancouver | Vancouver | — | 2026-08-26 | cycle1-links | Bare bsidesvancouver.com does not resolve; www host loads, run by Mainland Advanced Research Society, 2026 edition held at SFU Harbour Centre. |
| BSidesOK | Glenpool | — | 2026-08-26 | cycle1-links | bsidesok.com content confirms the 2026 event ran Apr 8-10 2026 at the Glenpool Conference Center; corrected the start date from 2026-04-06. |
| C2 Montreal | Montreal | — | 2026-08-26 | cycle3-accuracy | c2montreal.com states 'In 2026, C2 Montreal will be taking a pause from its annual May gathering' while a new format is explored, and lists no future dates. Not discontinued, so ke |
| Columbus Startup Week | Columbus | — | 2026-08-26 | cycle4-links | sprkwrks.com redirects to sparkworksinnovation.com (org homepage, not the event). SparkWorks Innovation runs the event; its current event page verified by WebFetch as 'Columbus Sta |
| FIRST Championship | Houston | — | 2026-08-26 | cycle3-accuracy | firstinspires.org/programs/first-championship gives the most recent FIRST Championship as April 29 - May 2, 2026 in Houston, Texas; no later edition is published yet. Dataset corre |
| GDG Brooklyn AI Fashion Hackathon | New York | — | 2026-09-10 | pass2 | Chapter page gdg.community.dev/gdg-brooklyn lists the event on 2026-09-12; the event detail page carries JSON-LD startDate 2026-09-12T09:30:00-04:00 / endDate 2026-09-12T16:00:00-04:00, so the dates are right. Venue is LUMA Studios, 307 West 38th Street, New York, NY 10018 - that is Manhattan, not Brooklyn. City taken from the GDG chapter name rather than the venue. Patch sets city to New York and fills venue. |
| gRPConf North America | Mountain View | — | 2026-09-10 | c1 | The stored url (the generic Linux Foundation calendar) no longer lists this event - only 'gRPConf India' appears on it now. The dedicated page events.linuxfoundation.org/grpconf/ (title 'gRPConf North America') carries JSON-LD startDate 2026-09-03, endDate 2026-09-03, addressLocality 'Mountain View', CA, and body text 'September 3, 2026 / Mountain View, CA'. Date and city in the record are correct and the edition has run; no 2027 date published. Url patched to the dedicated event page. |
| GTM Hackathon | Lehi | — | 2026-08-26 | cycle1-links | getmobly.com/gtm-hackathon was taken down after the Feb 2 2026 edition (404) and no successor page is published; pointed at the organiser's live site pending a 2027 edition page. |
| Hoya Hacks | Washington | — | 2026-08-26 | cycle4-links | hoyahacks.com redirects to hoyahacks.georgetown.domains, verified live: HoyaHacks 2027, Georgetown University, Washington DC, January 22-24 2027, registration open. |
| Innovation Week Saskatchewan | Saskatoon | — | 2026-08-26 | unblockB | innovationsask.ca loads (HTTP 200) but neither the homepage nor /events/ mentions Innovation Week anywhere - the stored link never names the event. The organiser does run it and has a dedicated page: innovationsask.ca/events/innovation-week/ ('Innovation Week in Saskatchewan - Innovation Saskatchewan', 'May 11-15, 2026', province-wide with sessions in Saskatoon and Regina). That edition is past, so only the URL is patched. |
| Iowa Technology Summit | Des Moines | — | 2026-08-26 | r2-newly-exposed | technologyiowa.org/events/list/ 404s. The Technology Association of Iowa publishes a dedicated page for this event at /iowa-technology-summit-2026/, which is a better link than the |
| JSConf North America | Cambridge | — | 2026-08-26 | passC | jsconf.com is an unmaintained federation homepage (2019/2017 links) that points to events.linuxfoundation.org/jsconf-north-america; that page shows JSConf North America Oct 14-16 2025 at the Hyatt Regency Chesapeake Bay, Cambridge MD - not Baltimore |
| Kansas City Developer Conference | Kansas City | 2027-08-04 | 2026-09-15 | audit2 | kcdc.info: KCDC 2027 workshops Aug 4, conference Aug 5-6, Kids Tech Day Aug 7. |
| Kentucky Digital Government Summit | Lexington | — | 2026-08-26 | passC | events.govtech.com Kentucky summit page places the event at the Marriott Griffin Gate Golf Resort, 1800 Newtown Pike, LEXINGTON KY (June 10 2026, now complete) - the recorded city Louisville is wrong |
| Microsoft Build | San Francisco | — | 2026-08-26 | cycle1-links | Verified: Build 2026 was moved from Seattle to San Francisco and held June 2-3 2026 at Fort Mason Center, shortened to two days and application-only in person. The dataset's city a |
| Mississippi Digital Government Summit | Flowood | — | 2026-09-10 | c1 | events.govtech.com/Mississippi-Digital-Government-Summit (title 'Mississippi Digital Government Summit 2026') JSON-LD startDate 2026-09-09T08:00, matching stored last_date 2026-09-09 - but location 'Sheraton Flowood The Refuge Hotel & Conference Center', streetAddress '2200 Refuge Boulevard', addressLocality 'Flowood', not Jackson. Flowood is a separate municipality east of Jackson. It is the same venue as the Mississippi Aerospace & Defense Symposium in this chunk, which the dataset already records as Flowood. City corrected to Flowood (region unchanged, Mississippi) and venue set. No 2027 date on the page, so next_date remains empty. |
| Nerd Nite Austin | Austin | — | 2026-08-26 | cycle1-links | Nerd Nite chapters live at <city>.nerdnite.com; austin.nerdnite.com verified live with current event listings. |
| Nerd Nite Chicago | Chicago | — | 2026-08-26 | cycle1-links | chicago.nerdnite.com verified live with its own event listings. |
| Nerd Nite Denver | Denver | — | 2026-08-26 | cycle1-links | denver.nerdnite.com verified live with its own ticket links. |
| Nerd Nite Seattle | Seattle | — | 2026-08-26 | cycle1-links | seattle.nerdnite.com verified live with its own event schedule. |
| Nerd Nite Toronto | Toronto | — | 2026-08-26 | cycle1-links | toronto.nerdnite.com verified live with its own event listings. |
| Nerd Nite Vancouver | Vancouver | — | 2026-08-26 | cycle1-links | vancouver.nerdnite.com verified live with its own event listings at The Fox Cabaret. |
| New Tech Seattle | Seattle | — | 2026-08-26 | unblockB | The stored link geekwire.com/calendar/ loads (HTTP 200) but is GeekWire's generic community calendar - the string 'New Tech' appears zero times on it, so the link never names the event. The organiser's own site newtechnorthwest.com is live and lists 'New Tech Seattle September 2026 Meetup - September 15, 2026' plus 'Join us at the next monthly New Tech Seattle event'. URL patched to the organiser; left undated because it is a monthly series. |
| OpenSearchCon North America | San Jose | 2026-09-22 | 2026-09-15 | audit2 | events.linuxfoundation.org/opensearchcon-north-america JSON-LD: 2026-09-22 to 2026-09-24, San Jose. |
| Papers We Love Boston | Boston | — | 2026-08-26 | cycle1-links | Papers We Love publishes per-chapter pages at /chapter/<slug>/; Boston page fetched and verified. |
| Papers We Love Chicago | Chicago | — | 2026-08-26 | cycle1-links | Chapter listed in the paperswelove.org/chapter/ index with its own page. |
| Papers We Love Denver | Denver | — | 2026-08-26 | cycle1-links | Chapter listed in the paperswelove.org/chapter/ index with its own page. |
| Papers We Love Montreal | Montreal | — | 2026-08-26 | cycle1-links | Chapter listed in the paperswelove.org/chapter/ index; page loads but carries little chapter-specific content, so the chapter may be dormant. |
| Papers We Love New York | New York | — | 2026-08-26 | cycle1-links | New York chapter page fetched and verified - the original Papers We Love chapter, meets monthly. |
| Papers We Love Portland | Portland | — | 2026-08-26 | cycle1-links | Chapter listed in the paperswelove.org/chapter/ index with its own page. |
| Papers We Love San Francisco | San Francisco | — | 2026-08-26 | cycle1-links | San Francisco chapter page fetched and verified - meets monthly at Antithesis's downtown office, RSVPs via Luma. |
| Papers We Love Seattle | Seattle | — | 2026-08-26 | cycle1-links | Chapter listed in the paperswelove.org/chapter/ index with its own page. |
| Papers We Love Toronto | Toronto | — | 2026-08-26 | cycle1-links | Chapter listed in the paperswelove.org/chapter/ index with its own page. |
| Papers We Love Washington DC | Washington | — | 2026-08-26 | cycle1-links | Washington DC / Northern Virginia chapter page fetched and verified. |
| PegJam | Winnipeg | — | 2026-08-26 | unblockB | newmediamanitoba.com loads (HTTP 200) but neither the homepage nor /events/ mentions PegJam - the stored link never names the event. The event is alive: the site's own search returns newmediamanitoba.com/event/pegjam-2026/ ('PegJam 2026', JSON-LD startDate 2026-02-19T15:30-06:00), described as 'the 9th annual Winnipeg Game Jam, aka PegJam' run with the Winnipeg Game Collective. That edition is past, so only the URL is patched. |
| Phoenix Technology Summit | Phoenix | — | 2026-08-26 | search-unblock | ElevateIT Phoenix Technology Summit March 19 2026, Phoenix Convention Center South Ballroom. Record had no date. |
| Platform Calgary Community Connect | Calgary | — | 2026-08-26 | passC | platformcalgary.com homepage never mentions Community Connect; the events page (platformcalgary.com/events/) lists it as a flagship event on the third Thursday of every month |
| Polyglot Unconference | Vancouver | — | 2026-08-26 | cycle3r2-b | polyglotconf.com (organiser site) still advertises 'May 25th 2019, Vancouver' as its event; /2026 and /about return 404. No 2026 edition is published anywhere on the organiser's si |
| Propelify Innovation Festival | Hoboken | — | 2026-08-26 | search-unblock | hobokennj.gov: ninth annual Propelify, June 27 2026, Maxwell Place Park. Record's month said October - it is a June festival. |
| Reality Hack at MIT | Cambridge | — | 2026-08-26 | cycle4-links | mitrealityhack.com redirects to realityhackatmit.com, verified as the live official site: Reality Hack at MIT, MIT campus Cambridge MA, next edition January 2027. |
| RustConf | Vancouver | 2027-09-07 | 2026-09-15 | audit2 | rustconf.com body: 'September 7-10, 2027 / Vancouver, Canada + Online', stated twice. Title and JSON-LD on that page are both stale. |
| Santa Monica New Tech | Santa Monica | — | 2026-09-10 | pass1 | meetup.com/santa-monica-new-tech lists 52 upcoming events on a weekly Sunday cadence; next is 'Tech Meetup: Virtual Open Coffee Club' Sun Sep 13 2026 10:00 AM PDT (JSON-LD startDate 2026-09-13T17:00:00Z), then Sep 20, Sep 27, Oct 4. Past events include Sep 6 and Aug 30 2026, so the record's Aug 30 next_date was two meetings stale. |
| seL4 Summit | Vancouver | — | 2026-09-10 | c2 | Stored URL events.linuxfoundation.org/about/calendar/ loads but lists only the 82 upcoming LF events and never names seL4 Summit - it cannot settle this record. events.linuxfoundation.org/sel4-summit/ 200 with JSON-LD startDate 2026-09-01, endDate 2026-09-03; sel4.systems documents Vancouver, Hyatt Regency, 1-3 September 2026. Stored last_date 2026-09-01 is correct and no 2027 edition is announced; the patch repoints the URL only. |
| TartanHacks | Pittsburgh | — | 2026-08-26 | unblockB | www.tartanhacks.com is dead: HTTP 402 'Payment required / DEPLOYMENT_DISABLED' from Vercel (78-byte body); tartanhacks.org answers HTTP 522. The event itself is not dead - organiser ScottyLabs (scottylabs.org) is live, footer '(c) 2026' with 2026 recruitment open, and its homepage headline is 'We host Pittsburgh's largest annual hackathon,' rendered next to /assets/tartanhacks-logo-gWC8J4Rv.svg. URL patched to the live organiser page; no date is published there. |
| TECHSPO Chicago | Chicago | — | 2026-08-26 | cycle4-final | techspochicago.com is flaky |
| TokioConf | Portland | — | 2026-08-26 | orchestrator | tokioconf.com publishes no 2027 dates - 'towards the end of April', 'sign up when dates are finalized'. Stored dates came from dev.events; cleared. |
| Yukon Innovation Week | Whitehorse | — | 2026-08-26 | search-unblock | July 6-10 2026 at Yukonstruct. Record's last_date was a year stale and its month was May. |
| Yukonstruct Maker Academy | Whitehorse | — | 2026-08-26 | search-unblock | A rolling series of Maker Academy bootcamps plus Maker Madness camps and Repair Cafes, not one annual event. Cadence corrected to rolling. |

## confirmed (680)

Checked and correct as recorded.

| event | city | next date | checked | cycle | evidence |
|---|---|---|---|---|---|
| 3686 | Nashville | 2026-09-14 | 2026-09-10 | pass2 | attend3686.com hero repeats 'September 14-16' / 'Nashville, Tennessee', campus headquartered at Brooklyn Bowl. Matches record. |
| 3rd Coast Venture Summit | New Orleans | 2027-03-09 | 2026-09-15 | script | automated: page shows "march 9" and no decoy date |
| 43North Finals | Buffalo | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| 43North Speaker Series | Buffalo | — | 2026-08-26 | passC | luma.com/43north loads, lists 43North speaker-series/fireside events in Buffalo; no dated next edition published |
| AccelerateOTT | Ottawa | — | 2026-08-26 | passC | accelerateott.ca live, 'Ottawa's Premier Entrepreneurship Event', references AccelerateOTT 2026 waitlist but publishes no calendar dates |
| Adobe MAX | Miami Beach | 2026-11-10 | 2026-09-15 | script | automated: page shows "november 10" and no decoy date |
| Advertising Week New York | New York | 2026-10-05 | 2026-09-15 | script | automated: page shows "october 5" and no decoy date |
| AFROTECH Conference | Houston | 2026-11-02 | 2026-09-15 | script | automated: page shows "november 2" and no decoy date |
| Agile Open Northwest | Portland | — | 2026-08-26 | passC | agileopennorthwest.org live, AONW 2026 was March 6-7 in Portland (already past); no next edition date published yet |
| AgTech Week | Fargo | — | 2026-08-26 | passC | agtechweekfargo.com live, Fargo ND, says only 'Coming June 2027' with no specific days |
| AI Con USA | Seattle | 2027-06-06 | 2026-09-15 | script | automated: page shows "june 6" and no decoy date |
| AI Engineer World's Fair | San Francisco | 2027-06-29 | 2026-09-15 | script | automated: page shows "june 29" and no decoy date |
| AI in Education Summit | Mountain View | 2026-10-24 | 2026-09-15 | script | automated: page shows "october 24" and no decoy date |
| AI Infra Summit | Santa Clara | 2026-09-15 | 2026-09-15 | script | automated: page shows "september 15" and no decoy date |
| AI Rising Conference | Columbus | 2026-10-19 | 2026-09-15 | script | automated: page shows "october 19" and no decoy date |
| Ai4 | Las Vegas | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Airflow Summit | Austin | — | 2026-09-10 | c1 | airflowsummit.org JSON-LD: startDate 2026-08-31T09:00-05:00, endDate 2026-09-02T17:00-05:00, location 'Hyatt Regency Austin', 208 Barton Springs Rd, Austin TX, OfflineEventAttendanceMode; page title 'Airflow Summit 2026 / Aug. 31 - Sep 2 in Austin, TX'. The edition has run and matches stored last_date 2026-08-31, city and venue. No occurrence of '2027' anywhere on the site, so next_date correctly remains empty. |
| Alabama Public Sector Cybersecurity Summit | Montgomery | — | 2026-08-26 | passC | events.govtech.com page live for Montgomery (Embassy Suites, 300 Tallapoosa St); 2026 edition marked complete, 'Join us next year' - no 2027 date yet |
| Alaska Digital Government Summit | Anchorage | 2026-10-08 | 2026-09-15 | script | automated: page shows "october 8, 2026" and no decoy date |
| Alaska Entrepreneurship Week | Anchorage | 2026-09-14 | 2026-09-10 | pass2 | alaskastartups.com Upcoming Events: 'Alaska Entrepreneurship Week (September 14th-18th, 2026) - an annual celebration of all things entrepreneurship'. Matches record. Programme is statewide with no single venue published; Anchorage left as recorded. |
| Alaska SBDC Summit | Anchorage | — | 2026-08-26 | passC | summit.aksbdc.org live, Alaska SBDC summit at The Wildbirch Hotel (Anchorage); last edition March 6 2026 already past, no next date |
| ALL IN | Montreal | 2026-09-16 | 2026-09-15 | script | automated: page shows "september 16" and no decoy date |
| All Things Open | Raleigh | 2026-10-19 | 2026-09-15 | script | automated: page shows "october 19" and no decoy date |
| AlphaLab Demo Day | Pittsburgh | — | 2026-08-26 | search-unblock | Real and active: AlphaLab's 2026 cohort of 20 startups presented to 300+ founders, investors and mentors. No date published for the next demo day, so it correctly stays undated. |
| API World | Santa Clara | — | 2026-09-10 | c1 | apiworld.co JSON-LD: name 'API World 2026', startDate 2026-09-01T08:00-08:00, endDate 2026-09-03T17:00-08:00, location 'Santa Clara Convention Center', 5001 Great America Pkwy, Santa Clara CA, OfflineEventAttendanceMode. Ran; matches stored last_date 2026-09-01, city and venue. No occurrence of '2027' on the site, so next_date correctly remains empty. |
| apidays Toronto | Toronto | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Apple Worldwide Developers Conference | Cupertino | — | 2026-08-26 | passC | developer.apple.com/wwdc26/ live and describes WWDC26 (keynote, sessions, group labs); no dates for the next edition published yet |
| Arizona Tech Week | Phoenix | — | 2026-08-26 | passC | arizonaascent.com page describes Arizona Tech Week 2026 across Phoenix/Scottsdale/Tempe/Tucson, anchor events April 7-9 2026 (past); no next edition dated |
| Arizona Technology Summit | Scottsdale | — | 2026-08-26 | passC | technologysummit.net/arizona.html live, 17th Annual summit at Grand Hyatt Scottsdale Resort, Scottsdale AZ; Aug 25 2026 edition just past, no next date |
| Arkansas Digital Government Summit | Little Rock | 2026-10-13 | 2026-09-15 | script | automated: page shows "october 13, 2026" and no decoy date |
| ASU+GSV Summit | San Diego | 2027-04-04 | 2026-09-15 | script | automated: page shows "april 4" and no decoy date |
| Atlanta Tech Week | Atlanta | 2027-08-15 | 2026-09-15 | script | automated: page shows "august 15" and no decoy date |
| Atlassian Team | Anaheim | — | 2026-08-26 | passC | events.atlassian.com/team live: Team '26 at Anaheim Convention Center, May 5-7 2026 (past); no next edition date yet |
| Augmented Enterprise Summit | Atlanta | 2026-10-13 | 2026-09-15 | script | automated: page shows "october 13" and no decoy date |
| Austin Tech Week | Austin | 2026-10-26 | 2026-09-15 | script | automated: page shows "october 26" and no decoy date |
| Autonomous Nation | Wheatland | 2026-09-17 | 2026-09-15 | script | automated: page shows "september 17" and no decoy date |
| AWE USA | Long Beach | 2027-06-14 | 2026-09-15 | script | automated: page shows "june 14" and no decoy date |
| AWS re:Invent | Las Vegas | 2026-11-30 | 2026-09-15 | script | automated: page shows "nov 30" and no decoy date |
| AWS Summit Toronto | Toronto | — | 2026-08-26 | passC | aws.amazon.com summit page for Toronto, Metro Toronto Convention Centre; June 2-3 2026 edition marked concluded, no next date |
| Baltimore Health Tech Startup Symposium | Baltimore | — | 2026-08-26 | unblockB | ventures.jhu.edu event page loads (HTTP 200), titled 'Baltimore Health Tech Startup Symposium - Johns Hopkins Technology Ventures'. JSON-LD gives startDate 2026-05-01T09:30-04:00 / endDate 2026-05-01T11:30-04:00; that edition is already past and no next edition is published. Right event, right city (Johns Hopkins, Baltimore). No date to patch in. |
| Bank Technology & Operations Conference & Showcase | Wichita | — | 2026-08-26 | passC | ksbankers.com page live, KBA conference at Hyatt Regency Wichita; Feb 9-10 2026 edition past, no next date published |
| BarCamp Philly | Philadelphia | 2026-10-17 | 2026-09-15 | script | automated: page shows "october 17, 2026" and no decoy date |
| BayPIGgies (Bay Area Python Interest Group) | San Jose | — | 2026-09-10 | pass1 | meetup.com/baypiggies and its /events/ tab show 102 past events and NO upcoming-events section; most recent was 'BayPiggies August 2026' Thu Aug 27 2026 at West Valley Branch Library, San Jose CA. Group states it meets the fourth Thursday of every other month, with special arrangements Oct-Dec around PyBay. The 'Oct 3, 2026' string on the page is a PyBay 2026 announcement inside the August agenda, not a BayPIGgies meeting. baypiggies.net redirects to a static baypiggies-01-23-2025.html stub with no calendar. No next meeting has been announced, so the record's empty next_date is correct. |
| BC Technology Impact Awards | Vancouver | 2026-10-29 | 2026-09-15 | script | automated: page shows "october 29, 2026" and no decoy date |
| BearHacks | Mississauga | — | 2026-08-26 | unblockB | bearhacks.com loads (HTTP 200), title 'BearHacks 2026'. It is a React shell, so I read the app bundle /assets/index-CkbZRNgR.js: it carries the hero copy 'April 24th - 26th - Sheridan HMC Campus' and the FAQ line 'Sheridan College's Hazel McCallion Campus in Mississauga, Ontario, Canada', confirming the Mississauga venue. The April 2026 edition is past and no forward date is published, so nothing to patch. |
| Best of Tech Awards | Cleveland | — | 2026-09-10 | pass2 | greatercle.com/tech says 'Best of Tech Day & Awards ... Date: September 14, 2026'. Two nav links exist (events/2026/09/14/... and events/2026/09/15/...) but both serve the identical event page reading 'Date: September 14, 2026, Time: 1:30 pm - 8:00 pm, Cleveland Museum of Natural History, 1 Wade Oval Dr, Cleveland OH'. The 09/15 slug is a stale permalink, not a date change. Matches record. |
| BeyondConf | Detroit | 2026-11-05 | 2026-09-15 | script | automated: page shows "november 5, 2026" and no decoy date |
| Big Data & Analytics Summit Canada | Toronto | 2027-06-08 | 2026-09-15 | script | automated: page shows "june 8" and no decoy date |
| Big Sky Dev Con | Bozeman | — | 2026-08-26 | passC | bigskydevconf.com live, Montana Programmers conference in Bozeman; July 24-25 2026 edition past, no next date |
| Billington CyberSecurity Summit | Washington | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Bio-IT World Conference & Expo | Boston | 2027-05-18 | 2026-09-15 | script | automated: page shows "may 18" and no decoy date |
| Birmingham Women in Technology | Birmingham | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Bitcoin Conference | Nashville | 2027-07-15 | 2026-09-15 | script | automated: page shows "july 15" and no decoy date |
| Black Tech Week | Cincinnati | — | 2026-08-26 | passC | blacktechweek.com live, Cincinnati (Queen City); July 14-16 2026 edition past, no next date published |
| Blockchain Futurist Conference | Toronto | — | 2026-08-26 | passC | futuristconference.com live, Toronto edition promoted for 2026 with early-bird tickets but no calendar dates given |
| Boise Code Camp | Boise | — | 2026-08-26 | passC | boisecodecamp.com resolves and serves the Boise Code Camp page (minimal/JS-rendered body); no date published |
| Boston Festival of Indie Games | Boston | 2026-10-03 | 2026-09-15 | script | automated: page shows "october 3" and no decoy date |
| Boston Python User Group | Cambridge | — | 2026-08-26 | passC | meetup.com/bostonpython loads, Cambridge MA, 10,176 members with regular Python Over Coffee / office hours - active recurring series |
| Boulder Startup Week | Boulder | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| BrickHack | Rochester | — | 2026-08-26 | passC | brickhack.io live, RIT hackathon in Rochester NY; latest listed edition Feb 22-23 2025 at RIT SHED, no next date yet |
| BSides 312 | Chicago | — | 2026-08-26 | passC | bsides312.org live, Chicago (Irish American Heritage Center); explicitly 'Date: TBD, 2027', check back in November |
| BSides Atlanta | Atlanta | 2026-10-03 | 2026-09-15 | script | automated: page shows "october 3" and no decoy date |
| BSides Boulder | Boulder | — | 2026-08-26 | passC | bsidesboulder.org live, Boulder CO; June 13 2026 edition wrapped ('see you next year'), no next date |
| BSides Bozeman | Bozeman | 2026-10-03 | 2026-09-15 | script | automated: page shows "october 3, 2026" and no decoy date |
| BSides Buffalo | Buffalo | — | 2026-08-26 | passC | bsidesbuffalo.org live, 'held annually in Buffalo, NY'; June 6 2026 edition past, no next date |
| BSides Charleston | Charleston | 2026-11-07 | 2026-09-15 | script | automated: page shows "november 7, 2026" and no decoy date |
| BSides Charlotte | Charlotte | — | 2026-08-26 | passC | bsidesclt.org live, Charlotte NC 501(c)3; March 28-29 2026 edition past, no next date |
| BSides Chicago | Chicago | — | 2026-08-26 | passC | bsideschicago.org live, Chicago; site says the con is taking 2026 off and returns in 2027, no dates given |
| BSides Cleveland | Cleveland | 2026-09-26 | 2026-09-15 | script | automated: page shows "september 26" and no decoy date |
| BSides CMH | Columbus | 2026-11-04 | 2026-09-15 | script | automated: page shows "november 4" and no decoy date |
| BSides COS | Colorado Springs | 2026-10-24 | 2026-09-15 | script | automated: page shows "october 24" and no decoy date |
| BSides Dayton | Dayton | 2027-05-15 | 2026-09-15 | script | automated: page shows "2027-05-15" and no decoy date |
| BSides Denver | Denver | — | 2026-09-10 | pass1 | bsidesden.org front page: 'BSides Denver 2026 Conference - Fri, Sep 11 / Void Studios', tickets on sale, CFP closed June 30, copyright 2026. Single-day 2026-09-11 in Denver CO as recorded. |
| BSides Des Moines | Des Moines | — | 2026-08-26 | passC | bsidesdsm.org live, Des Moines area (Ankeny venue); June 13 2026 edition past, no next date |
| BSides Detroit | Detroit | — | 2026-08-26 | passC | bsidesdetroit.org live, Detroit; May 30 2026 edition past (sold out), no next date |
| BSides Flood City | Johnstown | 2026-11-12 | 2026-09-15 | script | automated: page shows "november 12" and no decoy date |
| BSides Fort Wayne | Fort Wayne | 2026-11-11 | 2026-09-15 | script | automated: page shows "november 11" and no decoy date |
| BSides Fredericton | Fredericton | 2026-10-27 | 2026-09-15 | script | automated: page shows "october 27" and no decoy date |
| BSides Halifax | Halifax | — | 2026-08-26 | passC | halifaxbsides.ca live, Halifax NS; Nov 13 2025 edition sold out, organisers collecting feedback to plan 2026 - no date yet |
| BSides Harrisburg | Harrisburg | 2027-05-21 | 2026-09-15 | script | automated: page shows "may 21, 2027" and no decoy date |
| BSides Idaho Falls | Idaho Falls | 2027-04-16 | 2026-09-15 | script | automated: page shows "april 16" and no decoy date |
| BSides Knoxville | Knoxville | — | 2026-08-26 | passC | 10-sec.org/bsides-knoxville live, Knoxville TN; May 22 2026 edition past, no next date |
| BSides Las Vegas | Las Vegas | — | 2026-08-26 | passC | bsideslv.org live, Las Vegas at The Tuscany; Aug 3-5 2026 edition just past, no next date |
| BSides London Canada | London | — | 2026-08-26 | passC | bsideslondon.ca live, explicitly London Ontario Canada; May 23 2026 edition past, no next date |
| BSides Memphis | Memphis | 2026-10-03 | 2026-09-15 | script | automated: page shows "october 3" and no decoy date |
| BSides MKE | Milwaukee | — | 2026-08-26 | passC | bsidesmke.org live, Milwaukee WI; April 3 2026 edition past, no next date |
| BSides Montreal | Montreal | 2026-09-19 | 2026-09-15 | script | automated: page shows "september 19 2026" and no decoy date |
| BSides NoVA | Arlington | 2026-10-30 | 2026-09-15 | script | automated: page shows "october 30" and no decoy date |
| BSides Orlando | Orlando | 2026-09-25 | 2026-09-15 | script | automated: page shows "september 25" and no decoy date |
| BSides Ottawa | Ottawa | 2026-11-19 | 2026-09-15 | script | automated: page shows "november 19" and no decoy date |
| BSides Peoria | Peoria | 2026-10-24 | 2026-09-15 | script | automated: page shows "october 24" and no decoy date |
| BSides Pittsburgh | Pittsburgh | 2027-07-09 | 2026-09-15 | script | automated: page shows "july 9, 2027" and no decoy date |
| BSides RDU | Raleigh | 2026-12-18 | 2026-09-15 | script | automated: page shows "december 18" and no decoy date |
| BSides Regina | Regina | — | 2026-08-26 | passC | bsidesregina.ca live, Regina SK; March 18-19 2026 edition past, no next date |
| BSides Roanoke | Roanoke | — | 2026-08-26 | passC | bsidesroa.org live, Roanoke VA; June 5 2026 edition past, no next date |
| BSides Saskatoon | Saskatoon | 2026-09-28 | 2026-09-15 | script | automated: page shows "2026-09-28" and no decoy date |
| BSides SATX | San Antonio | — | 2026-08-26 | passC | bsidessatx.com live, San Antonio TX at St. Mary's University; says 'Returning in 2027' with no dates set |
| BSides Seattle | Seattle | — | 2026-08-26 | passC | bsidesseattle.com live, Seattle-area con (Feb 27-28 2026 at Building 92, Redmond WA - metro naming as with other BSides rows); edition past, no next date |
| BSides SLC | Salt Lake City | — | 2026-08-26 | passC | bsidesslc.org live, Salt Lake City area (Sandy UT venue); April 9-10 2026 edition past, no next date |
| BSides South Florida | Fort Lauderdale | — | 2026-08-26 | passC | bsidessouthflorida.org live, Marriott Harbor Beach Resort (Fort Lauderdale); next edition announced only as 'May 2027' with no exact dates |
| BSides South Jersey | Glassboro | — | 2026-08-26 | passC | bsidessouthjersey.org live, Rowan University, Glassboro NJ; April 18 2026 edition past, 2027 section says details coming soon |
| BSides St. John's | St. John's | 2026-09-17 | 2026-09-15 | script | automated: page shows "september 17" and no decoy date |
| BSides Tampa | Tampa | — | 2026-08-26 | passC | bsidestampa.net live, USF Marshall Student Center Tampa FL; May 15-16 2026 edition past, no next date |
| BSides Toronto | Toronto | 2026-10-03 | 2026-09-15 | script | automated: page shows "october 3, 2026" and no decoy date |
| BSides Vancouver Island | Victoria | 2026-09-25 | 2026-09-15 | script | automated: page shows "september 25" and no decoy date |
| BSidesAugusta | Augusta | 2026-10-24 | 2026-09-15 | script | automated: page shows "october 24" and no decoy date |
| BSidesCT | Fairfield | 2026-09-26 | 2026-09-15 | script | automated: page shows "september 26" and no decoy date |
| BSidesDFW | Dallas | 2026-11-07 | 2026-09-15 | script | automated: page shows "november 7" and no decoy date |
| BSidesGreenville | Greenville | — | 2026-09-10 | c1 | bsides.org/event/bsidesgreenville-2/ JSON-LD startDate 2026-08-29, endDate 2026-08-29, addressLocality 'Greenville', SC. The organiser's own site bsidesgreenville.org (title 'BSides Greenville') independently states 'August 29th, 2026' and describes itself as 'a community-driven cybersecurity conference in Greenville'. Ran; matches stored last_date 2026-08-29. Neither page announces a 2027 date, so next_date correctly remains empty. |
| BSidesKC | Kansas City | — | 2026-08-26 | passC | bsideskc.org live, Kansas City Kansas Community College, Kansas City KS; main event 4/25/2026 past, no next date |
| BSidesNEPA | Wilkes Barre | — | 2026-09-10 | pass1 | bsides.org/event/bsidesnepa-northeast-pennsylvania carries JSON-LD startDate 2026-09-12T00:00:00+00:00 / endDate 2026-09-12T23:59:59+00:00 and a venue block 'BSidesNEPA, Wilkes Barre, PA, United States'. Single-day 2026-09-12 as recorded. |
| BSidesROC | Rochester | 2027-03-20 | 2026-09-15 | script | automated: page shows "march 20" and no decoy date |
| BSidesSF | San Francisco | — | 2026-08-26 | passC | bsidessf.org live, San Francisco; 'BSidesSF 2026 is happening -- March 21-22' already past, no next date |
| BSidesSGF | Springfield | 2027-03-30 | 2026-09-15 | script | automated: page shows "march 30, 2027" and no decoy date |
| BSidesSTL | St. Louis | — | 2026-08-26 | passC | bsidesstl.org live, Saint Louis MO; organisers state no 2026 conference (blockers) and aim to resume in 2027 - no dates |
| BSidesStPete | St. Petersburg | 2027-01-29 | 2026-09-15 | script | automated: page shows "january 29, 2027" and no decoy date |
| Build48 | St. John's | 2027-03-20 | 2026-09-15 | script | automated: page shows "march 20" and no decoy date |
| Business Value Builder Summit | Huntington | 2026-09-17 | 2026-09-15 | script | automated: page shows "september 17, 2026" and no decoy date |
| Cactusforce | Scottsdale | 2027-01-21 | 2026-09-15 | script | automated: page shows "january 21" and no decoy date |
| Cal Hacks | San Francisco | — | 2026-08-26 | passC | calhacks.io live, Cal Hacks 12.0 at Palace of Fine Arts, San Francisco, Oct 24-26 2025 (past); no next edition dated |
| Calagator Portland Tech Calendar | Portland | — | 2026-08-26 | passC | calagator.org live, 'unified calendar for the technology community of Portland, Oregon', actively listing events into Sept 2026 |
| CalgaryHacks | Calgary | — | 2026-08-26 | passC | calgaryhacks2026.devpost.com describes the University of Calgary ICT Building hackathon, Feb 14-15 2026, now marked 'This hackathon has ended'; no next edition page yet |
| Canadian Game Awards | Toronto | — | 2026-08-26 | passC | canadiangameawards.ca live, 6th edition at John Bassett Theatre Toronto, May 21 2026 (past); no next date |
| CanSecWest | Vancouver | 2026-09-26 | 2026-09-15 | script | automated: page shows "september 26, 2026" and no decoy date |
| CascadiaJS | Seattle | — | 2026-08-26 | passC | cascadiajs.com live, Seattle; June 2026 edition sold out and past, 'See you in 2027' with no dates |
| CDL Super Session | Toronto | — | 2026-08-26 | passC | creativedestructionlab.com/super-session live, annual Toronto showcase of graduating CDL companies; page still on June 24 2025 edition, no next date |
| CED Venture Connect | Durham | — | 2026-08-26 | passC | cednc.org/venture-connect live, Durham NC; VC26 was March 24-25 2026 (past), no next date |
| Central Iowa Software Symposium | Des Moines | 2026-09-17 | 2026-09-15 | script | automated: page shows "september 17" and no decoy date |
| Central Ohio InfoSec Summit | Columbus | — | 2026-08-26 | passC | infosecsummit.com live, Hilton Columbus Downtown, Columbus OH; June 8-10 2026 edition past, no next date |
| Central Ohio Software Symposium | Columbus | — | 2026-08-26 | passC | nofluffjuststuff.com/columbus live and describes the Columbus OH NFJS symposium; latest listed edition Sep 29-Oct 1 2023, 2026 NFJS tour partners shown, no new Columbus date |
| CES | Las Vegas | 2027-01-06 | 2026-09-15 | script | automated: page shows "january 6" and no decoy date |
| ChaTech Tech Tuesdays | Chattanooga | — | 2026-08-26 | passC | chatech.org live, Chattanooga tech council, lists 'Tech Tuesdays' under Communities; recent 2026 content, no fixed dates published |
| Chattanooga Entrepreneur Week | Chattanooga | — | 2026-08-26 | passC | chabusiness.org (Small Business Resource Center, Chattanooga) live and carries a Chattanooga Entrepreneur Week section; no dates published |
| Chi Hack Night | Chicago | — | 2026-08-26 | passC | chihacknight.org live, Chicago weekly civic-tech event, sessions listed through Aug 2026 |
| CHROMA | Tulsa | 2026-09-24 | 2026-09-15 | script | automated: page shows "september 24, 2026" and no decoy date |
| Cincy AI Week | Cincinnati | — | 2026-08-26 | passC | joinaiweek.com/cincy live, Cincinnati OH; June 9-11 2026 sold out and past, 'Returning June 2027' with no exact dates |
| CIPS Ontario Women in Technology Conference | Toronto | 2026-09-18 | 2026-09-15 | script | automated: page shows "september 18" and no decoy date |
| Circuit Hacking Monday at Noisebridge | San Francisco | — | 2026-08-26 | passC | noisebridge.net wiki live (last edited June 7 2026), San Francisco hackerspace, Circuit Hacking Monday listed as weekly Mondays 7pm |
| Cisco Live US | Las Vegas | 2027-06-06 | 2026-09-15 | script | automated: page shows "june 6" and no decoy date |
| CISO Fireside | Sundance | 2026-11-05 | 2026-09-15 | script | automated: page shows "november 5, 2026" and no decoy date |
| Coastal Innovation Challenge | New Orleans | — | 2026-08-26 | passC | ideavillage.org/coastal-innovation-challenge live, Idea Village New Orleans (900 Camp St); 'Applications open soon', no dates |
| Code & Supply | Pittsburgh | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Code for America Summit | Washington | — | 2026-08-26 | unblockB | summit.codeforamerica.org loads (HTTP 200). Hero reads 'Marriott Marquis / Chicago / May 7-8, 2026' and the post-event note says 'We're so glad you joined us at our first Summit in Chicago! ... See you in 2027 in Washington, D.C.!' - so the stored city Washington DC matches the next edition. No 2027 dates published yet, nothing to patch. |
| Code for Boston Hack Night | Cambridge | — | 2026-08-26 | passC | codeforboston.org live, weekly Tuesday 7pm hack nights, in-person first and third Tuesdays at the CIC; recurring, no fixed dates |
| Code Platoon | Chicago | — | 2026-08-26 | passC | codeplatoon.org live, veteran/military-spouse coding bootcamp, One South Dearborn Chicago IL; rolling cohorts, no dates published |
| Code4Lib | Philadelphia | — | 2026-08-26 | passC | 2026.code4lib.org live, Philadelphia PA, March 2-5 2026 edition past; no 2027 site/date yet |
| CodeCrush | Omaha | — | 2026-08-26 | passC | aiminstitute.org/codecrush live, AIM Institute Omaha NE iSTEM immersion; two cohorts a year, no calendar dates published |
| CodeMash | Sandusky | 2027-01-12 | 2026-09-15 | script | automated: page shows "january 12" and no decoy date |
| CodeMash East | Spotsylvania | 2027-06-17 | 2026-09-15 | script | automated: page shows "june 17" and no decoy date |
| CodeStock | Knoxville | 2027-04-08 | 2026-09-15 | script | automated: page shows "april 8" and no decoy date |
| Colorado Startup Week | Denver | 2026-09-14 | 2026-09-10 | pass2 | costartupweek.com shows 'September 14-18 / Free' and 'HQ: The Link, 930 15th St, Denver, CO'. Matches record. |
| Colorado Technology Association APEX Awards | Denver | — | 2026-08-26 | passC | coloradotechnology.org/apex-awards live, Denver CO; Feb 18 2026 Colorado Tech Summit + APEX Awards past (sold out), no next date |
| Computing Foundations Workshop Series | Cookeville | 2026-08-27 | 2026-08-26 | passA | rcd.tntech.edu/2026-08-27-tntech shows select Thursdays Aug 27 - Nov 19 2026, Bruner Hall, Cookeville TN — matches record |
| ConFoo Montreal | Montreal | 2027-02-24 | 2026-09-15 | script | automated: page shows "february 24" and no decoy date |
| ConHacks | Waterloo | — | 2026-08-26 | passC | conhacks.io live, Conestoga College Waterloo Campus; April 28-30 2026 edition past, ConHacks 2027 referenced without dates |
| Connecticut Digital Government Summit | Hartford | — | 2026-09-10 | c1 | events.govtech.com/Connecticut-Digital-Government-Summit (title 'Connecticut Digital Government Summit 2026') JSON-LD startDate 2026-09-02T08:00, location 'Connecticut Convention Center', streetAddress '100 Columbus Blvd', addressLocality 'Hartford'. Ran; matches stored last_date 2026-09-02, city and venue exactly. No 2027 date on the page, so next_date correctly remains empty. |
| ConUHacks | Montreal | — | 2026-08-26 | passC | conuhacks.io live, Concordia University downtown Montreal; ConUHacks X Jan 24-25 2026 past, no next date |
| CppCon | Aurora | 2026-09-12 | 2026-09-10 | pass1 | cppcon.org front page banner reads 'September 12-18. Register today!' for CppCon 2026, and cppcon.org/venue states 'The conference will be held at the Gaylord Rockies in Aurora, Colorado, just outside Denver.' The registration page corroborates with 'CppCon's Community Social ... will be held at lunch on Wednesday, September 16th', which falls inside a Sat Sep 12 - Fri Sep 18 2026 week. Note cppcon.org/schedule still redirects to the stale cppcon2024.sched.com (Sep 14-24 2024); that stale page was not used. Dates 2026-09-12 to 2026-09-18 and city Aurora both correct. |
| Critical Effect | Washington | — | 2026-08-26 | passC | securityandtechnology.org event page live, Akin DC 2001 K Street NW Washington DC; June 17-18 2026 edition past, no next date |
| CSAW Cybersecurity Games and Conference | Brooklyn | 2026-11-12 | 2026-09-15 | script | automated: page shows "november 12" and no decoy date |
| CTA Tech Week | Washington | — | 2026-08-26 | passC | cta.tech/events/tech-week live, Washington DC; April 21-22 2026 edition past, no next date |
| CTO Craft Con Toronto | Toronto | — | 2026-08-26 | passC | conference.ctocraft.com/toronto live, Toronto; after two years the site says 'Returning in 2027' with no dates |
| Cultivate Conference | Fargo | — | 2026-08-26 | passC | grandfarm.com/cultivate live, Grand Farm flagship ag-tech conference (Fargo ND); page marks the June 11 2026 edition as past, no next date |
| Cultivator Community Night | Regina | — | 2026-08-26 | passC | cultivator.ca/events live, Regina SK incubator; 'Community Night 2026' held Feb 4 2026, no next Community Night dated |
| CVPR | Seattle | 2027-06-20 | 2026-09-15 | script | automated: page shows "june 20" and no decoy date |
| CyberConVA | Richmond | — | 2026-08-26 | passC | rvatech.com CyberConVA page live, Richmond VA; Feb 12 2026 edition past, no next date |
| CyberSci National Finals | Ottawa | — | 2026-08-26 | passC | cybersecuritychallenge.ca live; 2026 National Finals hosted in Ottawa June 12-15 2026 (past), no next date |
| Cybersecurity Summit Chicago | Chicago | 2026-09-15 | 2026-09-15 | script | automated: page shows "september 15, 2026" and no decoy date |
| Cybersecurity, Stronger Together Conference | Washington | — | 2026-08-26 | unblockB | cyberconference.cps.gwu.edu loads (HTTP 200) and names the event: 'Cybersecurity, Stronger Together Conference 2026: Converging Threats and Shared Defenses', run by GW's College of Professional Studies at 805 21st Street NW, Washington DC 20052. The 2026 edition is written up in the past tense ('brought together top experts') and no 2027 date is posted. Right event, right city, no date available. |
| CypherCon | Milwaukee | 2027-03-24 | 2026-09-15 | script | automated: page shows "march 24" and no decoy date |
| DakotaCon | Madison | — | 2026-08-26 | passC | dakotacon.org live, DakotaCon 13 in Madison SD (DSU); March 27-28 2026 edition past, no next date |
| Data + AI Summit | San Francisco | 2027-06-21 | 2026-09-15 | script | automated: page shows "june 21" and no decoy date |
| Data Science DC | Washington | — | 2026-08-26 | passC | meetup.com/data-science-dc loads, Washington DC group with 17k members; NO upcoming events and latest listed meetup is Aug 2024 - group appears dormant, flagged for a later pass |
| DataConnect Conference | Columbus | 2026-10-29 | 2026-09-15 | script | automated: page shows "october 29" and no decoy date |
| DataTune | Nashville | — | 2026-08-26 | passC | datatuneconf.com live, Nashville TN; '2026 by the numbers' recap and 'Returning March 2027' with no exact dates |
| Day of Data Detroit | Ann Arbor | — | 2026-09-10 | pass2 | sqlsaturday.com/2026-09-12-sqlsaturday1164/ meta-refreshes to dayofdata.org/2026-09-12-dayofdata1164/, which reads 'Event Date: 12 September 2026', hours 10:30 AM-4:45 PM EDT, at Ann Arbor District Library - Downtown, 343 South Fifth Avenue, Ann Arbor MI. Single day, matches record. Canonical URL is now dayofdata.org; the sqlsaturday.com stub still forwards correctly. |
| Day of Data St Louis | St. Louis | 2026-10-24 | 2026-09-15 | script | automated: page shows "october 24" and no decoy date |
| Dayton Hamvention | Xenia | 2027-05-21 | 2026-09-15 | script | automated: page shows "may 21" and no decoy date |
| DC Startup & Tech Week | Washington | 2026-10-19 | 2026-09-15 | script | automated: page shows "october 19" and no decoy date |
| DDX Innovation & UX Conference San Diego | San Diego | 2026-09-17 | 2026-09-15 | script | automated: page shows "sep 17" and no decoy date |
| DeltaHacks | Hamilton | 2027-01-09 | 2026-09-15 | script | automated: page shows "january 9" and no decoy date |
| DelTech Conference | Memphis | 2026-10-14 | 2026-09-15 | script | automated: page shows "october 14" and no decoy date |
| Desert Dev Lab Hackathon | Albuquerque | — | 2026-08-26 | passC | nmtechtalks.com live (c 2026), New Mexico tech network naming 'Desert Dev Lab software hackathon' as one of two annual events; no dates published |
| DeveloperWeek New York | New York | — | 2026-08-26 | unblockB | developerweek.com/newyork loads (HTTP 200) and describes DeveloperWeek New York in New York City, NY. JSON-LD startDate 2026-06-09 / endDate 2026-06-10; that edition is past as of 2026-08-26 and the site has not rolled over to a 2027 edition, so there is no forward date to store. Link and city are correct. |
| DevFest Charlotte | Charlotte | — | 2026-08-26 | passC | gdg.community.dev/gdg-charlotte live, 1133 members, ran GDG Charlotte DevFest 2025; currently 'no upcoming events' |
| DevFestMN | Minneapolis | — | 2026-08-26 | passC | devfest.mn live, U of Minnesota Health Sciences Education Center, Minneapolis; page still on the Dec 6 2025 edition, no next date |
| DevLearn Conference & Expo | Las Vegas | 2026-11-04 | 2026-09-15 | script | automated: page shows "november 4" and no decoy date |
| Devnexus | Atlanta | 2027-04-05 | 2026-09-15 | script | automated: page shows "april 5" and no decoy date |
| DevOps Midwest | St. Louis | 2026-09-16 | 2026-09-15 | script | automated: page shows "september 16, 2026" and no decoy date |
| DevOpsCon New York | New York | 2026-09-28 | 2026-09-15 | script | automated: page shows "september 28" and no decoy date |
| DevOpsDays Boston | Boston | 2026-10-19 | 2026-09-15 | script | automated: page shows "october 19" and no decoy date |
| DevOpsDays Chicago | Chicago | — | 2026-08-26 | passC | devopsdays.org/events lists Chicago under 'TBD' pointing at /events/2027-chicago with no date assigned |
| DevOpsDays Dallas | Dallas | 2026-09-28 | 2026-09-15 | script | automated: page shows "september 28" and no decoy date |
| devopsdays Denver | Denver | 2026-09-22 | 2026-09-15 | script | automated: page shows "september 22" and no decoy date |
| DevOpsDays Detroit | Detroit | — | 2026-08-26 | passC | devopsdays.org/events lists Detroit only under 'TBD' (slug /events/2025-detroit) with no date assigned |
| DevOpsDays Halifax | Halifax | 2026-09-29 | 2026-09-15 | script | automated: page shows "september 29, 2026" and no decoy date |
| DevOpsDays Kansas City | Overland Park | — | 2026-08-26 | passC | devopsdays.org/events/2026-kansas-city live, Lifted Logic, 5600 W 95th St, Overland Park KS; May 28-29 2026 edition past, no next date |
| devopsdays Los Angeles | Los Angeles | 2027-04-02 | 2026-09-15 | script | automated: page shows "april 2, 2027" and no decoy date |
| devopsdays Philadelphia | Philadelphia | 2026-10-01 | 2026-09-15 | script | automated: page shows "october 1" and no decoy date |
| devopsdays Portland | Portland | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| devopsdays Raleigh | Raleigh | — | 2026-08-26 | passC | devopsdays.org/events/2026-raleigh live, McKimmon Center Raleigh NC; April 30-May 1 2026 edition past, no next date |
| DevSpace Conference | Huntsville | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| DFW Startup Week | Dallas | — | 2026-08-26 | passC | dfwstartupweek.com live, Dallas-Fort Worth; Aug 2-6 2026 edition just past, no next date |
| Diamond Challenge | Newark | — | 2026-08-26 | passC | diamondchallenge.org live, Horn Entrepreneurship, 132 E. Delaware Ave Newark DE; 2025 finalists shown, no dates published |
| Diamondhacks | La Jolla | 2027-04-03 | 2026-09-15 | script | automated: page shows "april 3" and no decoy date |
| Difinity Conference Toronto | Toronto | — | 2026-09-10 | pass1 | difinityconf.com and the organiser's analyticsconf.com are both empty React/Vite shells (486 and 467 bytes; the chased JS bundle carried no dates) but both serve the event's own title, so neither is squatted. The organiser-run Sessionize listing sessionize.com/difinity-conference-toronto-2026 states 'event starts 10 Sep 2026, event ends 11 Sep 2026', location 'Microsoft Toronto, Suite 4400, 81 Bay St., Toronto, ON M5J 0E7', and in the body 'The event is on two dates. 10th of Sep; Pre-conference. 11th of Sep; Main conference.' Dates and Toronto city both confirmed. |
| DIG SOUTH Tech, Venture & AI Summit | Charleston | 2027-05-20 | 2026-09-15 | script | automated: page shows "may 20" and no decoy date |
| Digital Offshore Conference | St. John's | 2027-04-27 | 2026-09-15 | script | automated: page shows "april 27" and no decoy date |
| Digital Okanagan | Vernon | 2026-09-24 | 2026-09-15 | script | automated: page shows "sep 24" and no decoy date |
| Digital Summit Atlanta | Atlanta | 2026-10-06 | 2026-09-15 | script | automated: page shows "october 6" and no decoy date |
| Digital Summit Raleigh | Raleigh | 2026-11-02 | 2026-09-15 | script | automated: page shows "november 2" and no decoy date |
| Digital Summit Tampa | Tampa | — | 2026-08-26 | passC | digitalsummit.com live, series page lists 'Tampa / March 23-24' 2026 (past); no next Tampa date |
| DistrictCon | Washington | 2027-02-06 | 2026-09-15 | script | automated: page shows "february 6" and no decoy date |
| DivHacks | New York | 2026-09-26 | 2026-09-15 | script | automated: page shows "september 26" and no decoy date |
| Django Girls New York City | New York | 2026-11-27 | 2026-09-15 | script | automated: page shows "november 27" and no decoy date |
| DjangoCon US | Chicago | — | 2026-08-26 | passC | djangocon.us live (DEFNA), promoting tickets for 2026 and events through 2028; 2025 edition was Chicago, no 2026 city or dates posted yet |
| Dreamforce | San Francisco | 2026-09-15 | 2026-09-15 | script | automated: page shows "september 15" and no decoy date |
| DrupalCamp Colorado | Denver | — | 2026-09-10 | c1 | drupal-colorado.org lists 'August 26 - 28, 2026 ... DrupalCamp Colorado 2026'. Ran; matches stored last_date 2026-08-26. The same page also lists a 'Denver Drupal Meetup: Vector Search Hands-on' on September 9, 2026 - a different named event, deliberately not taken. No DrupalCamp Colorado 2027 date announced, so next_date correctly remains empty. |
| DVCon U.S. | Santa Clara | 2027-03-01 | 2026-09-15 | script | automated: page shows "march 1" and no decoy date |
| Eahou Fest | Honolulu | — | 2026-08-26 | passC | eahoufest.com live, conference-meets-festival in Moiliili, Oahu (Honolulu); May 1-3 2026 edition past, no next date |
| East Meets West | Honolulu | — | 2026-08-26 | passC | emwhawaii.com live, East Meets West conference in Hawaii; April 8-9 2026 edition past, no next date |
| eBrew | Portsmouth | 2026-10-20 | 2026-09-15 | script | automated: page shows "october 20" and no decoy date |
| ElasticON New York | New York | 2026-10-08 | 2026-09-15 | script | automated: page shows "october 8, 2026" and no decoy date |
| ElasticON San Francisco | San Francisco | 2026-11-04 | 2026-09-15 | script | automated: page shows "november 4, 2026" and no decoy date |
| Elevate Conference | Wheatland | — | 2026-08-26 | passC | grandfarm.com/elevate live, Grand Farm Innovation Campus 3717 153rd Ave SE Wheatland ND; July 28 2026 edition marked as taken place, no next date |
| Elevate Festival | Toronto | 2026-09-22 | 2026-09-15 | script | automated: page shows "september 22" and no decoy date |
| ElixirConf US | Chicago | — | 2026-09-10 | pass1 | elixirconf.com title and hero: 'America's Premier Elixir & Phoenix Conference takes place on Sept 10-11, 2026, Chicago & online'; banner 'Sept 4 & 9 - Training / Sept 10-11 - Conference / Chicago & Virtual'. Dates and city correct. |
| eMerge Americas | Miami | 2027-03-02 | 2026-09-15 | script | automated: page shows "march 2" and no decoy date |
| Emergence Office Hours | Charlottetown | — | 2026-08-26 | passC | peibioalliance.com event page loads and describes an Emergence Office Hours session (PEI BioAlliance, Charlottetown); the instance shown (Nov 27 2025) is marked passed, no next date |
| Emerging Technologies Summit | Bozeman | — | 2026-08-26 | unblockB | mthightech.org event page loads (HTTP 200), titled 'Emerging Technologies Summit - MT High Tech Business Alliance'. JSON-LD startDate 2026-05-28T09:00-0600; venue text references MSU / QCORE / Bozeman. That date is past and no next edition is announced. Right event, right city. |
| Empowering Innovation Spirit Conference | Whitehorse | — | 2026-08-26 | passC | entreprenorth.ca page live, 2026 Empowering Innovation Spirit Conference in Whitehorse YT, August 24-26 2026 - that edition concludes today, no later date published |
| ETHGlobal New York | New York | — | 2026-08-26 | passC | ethglobal.com/events/newyork2026 live, New York City; June 12-14 2026 edition past, no next date |
| EWF Annual Conference | Aurora | 2026-11-04 | 2026-09-15 | script | automated: page shows "november 4" and no decoy date |
| Explore DDD | Denver | 2026-09-21 | 2026-09-15 | script | automated: page shows "september 21" and no decoy date |
| External Development Summit (XDS) | Vancouver | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Figma Config | San Francisco | — | 2026-08-26 | passC | config.figma.com live; SF edition June 23-25 2026 already wrapped (Config India Oct 15 2026 is a separate city), no next SF date |
| FinovateSpring | San Diego | 2027-05-03 | 2026-09-15 | script | automated: page shows "may 3" and no decoy date |
| First Look Forum | Milwaukee | — | 2026-08-26 | passC | mcservices.com page loads and does describe First Look Forum (April 16 2026, Quarles & Brady, 411 E Wisconsin Ave Milwaukee) but it is an IT vendor's blog listicle, not the organiser's site - link quality flagged |
| FITC Toronto | Toronto | — | 2026-08-26 | passC | fitc.ca/event/to26_ip live, FITC Toronto 25th anniversary, April 27-28 2026 (past); no next date |
| Florida DrupalCamp | Orlando | 2027-01-29 | 2026-09-15 | script | automated: page shows "january 29" and no decoy date |
| Florida Technology & Innovation Solution Summit | Tampa | 2027-08-25 | 2026-09-15 | script | automated: page shows "august 25, 2027" and no decoy date |
| Florida Technology Summit | St. Petersburg | 2026-11-19 | 2026-09-15 | script | automated: page shows "november 19, 2026" and no decoy date |
| Forcelandia | Portland | — | 2026-08-26 | passC | forcelandia.com live, Salesforce developer community event Portland OR; July 29-30 2026 edition past, no next date |
| Forge Summit | North Little Rock | 2026-10-13 | 2026-09-15 | script | automated: page shows "october 13" and no decoy date |
| Forward Fest | Madison | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Full Indie Summit | Vancouver | 2026-09-20 | 2026-09-15 | script | automated: page shows "september 20 2026" and no decoy date |
| Fully Connected | San Francisco | 2026-09-29 | 2026-09-15 | script | automated: page shows "september 29" and no decoy date |
| Game Developers Conference | San Francisco | 2027-03-01 | 2026-09-15 | script | automated: page shows "march 1" and no decoy date |
| GameCon Canada | Edmonton | 2027-06-25 | 2026-09-15 | script | automated: page shows "june 25" and no decoy date |
| Gamerella | Montreal | — | 2026-08-26 | passC | gamerella.ca live, inclusive game jam in Montreal; announces 'November 14th & 15th' with no year stated, so no date recorded |
| Gartner Identity & Access Management Summit | Las Vegas | 2026-12-07 | 2026-09-15 | script | automated: page shows "december 7" and no decoy date |
| GDG Ann Arbor | Ann Arbor | — | 2026-08-26 | passC | gdg.community.dev/gdg-ann-arbor live, 615 members, Ann Arbor MI; active (last meetup Apr 28 2026, next listed item is Michigan DevFest Nov 13 2026 - a separate event, so no series date set) |
| GDG Providence | Providence | — | 2026-08-26 | passC | gdg.community.dev/gdg-providence live, 606 members, Providence RI; last event June 25 2026, currently 'no upcoming events' |
| GeekWire Seattle AI Summit | Seattle | 2026-10-27 | 2026-09-15 | script | automated: page shows "october 27" and no decoy date |
| Generator Makerspace Workshops | Burlington | — | 2026-08-26 | passC | generatorvt.com live, Generator makerspace in Burlington VT with a workshops programme; no fixed dates published on the landing page |
| Genspace Community Biology Programs | Brooklyn | — | 2026-08-26 | passC | genspace.org live, community biology lab at 132 32nd Street Suite 108, Brooklyn NY, lists classes/public programs/residencies; no dates published |
| Georgia Tech All-Majors Career Fair | Atlanta | 2026-09-14 | 2026-09-10 | pass2 | career.gatech.edu/career-fair, Fall 2026 All-Majors Career Fair: 'Days: September 14 - September 15, 2026, Time: 10 A.M. - 4 P.M., Location: Campus Recreation Center'. Matches record. |
| GirlHacks | Newark | 2026-10-03 | 2026-09-15 | script | automated: page shows "october 3" and no decoy date |
| GitHub Universe | San Francisco | 2026-10-28 | 2026-09-15 | script | automated: page shows "october 28" and no decoy date |
| Global Day of Coderetreat | Multiple cities | 2026-11-13 | 2026-09-15 | script | automated: page shows "nov 13, 2026" and no decoy date |
| Global Game Jam - Abilene Christian University | Abilene | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at 1601 College, Abilene TX; Jan 26-Feb 1 2026 (past) |
| Global Game Jam - College of Charleston | Charleston | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at Harbor Walk East Innovation Center, 360 Concord St, Charleston SC; Jan 30-Feb 1 2026 (past) |
| Global Game Jam - NYU Game Center | New York | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live for NYU Game Center, Brooklyn NYC, Jan 30-Feb 1 2026 (past, registration closed) |
| Global Game Jam - Parsons School of Design | New York | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at Vera List Center, The New School, 6 E 16th St, New York NY; Jan 30-Feb 1 2026 (past) |
| Global Game Jam - RPI Game Development Club | Troy | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at Sage Labs, 1800 6th Avenue, Troy NY; GGJ26 weekend (past) |
| Global Game Jam - The Sheep's Meow at Bloomfield College | Bloomfield | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid with in-person venue Center for Technology + Creativity, 198 Liberty St, Bloomfield NJ; Jan 26-Feb 1 2026 (past) |
| Global Game Jam - University of Montana | Missoula | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at McGill Hall Room 223, 32 Campus Drive, Missoula MT; Jan 30-Feb 1 2026 (past) |
| Global Game Jam Albuquerque | Albuquerque | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at Mesa Del Sol, 5700 University Blvd SE, Albuquerque NM; Jan 30-Feb 1 2026 (past) |
| Global Game Jam San Antonio | San Antonio | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at Shenanigans Gaming, 5251 Timberhill Dr, San Antonio TX; Jan 26-Feb 1 2026 (past) |
| Global Summit AI Vancouver | Vancouver | 2026-11-02 | 2026-09-15 | script | automated: page shows "november 2" and no decoy date |
| GNTC Summit | Nashville | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Google Cloud Next | Las Vegas | — | 2026-08-26 | orchestrator | cloud.google.com/next 301s to the stored URL; it is the canonical entry point |
| Google I/O | Mountain View | — | 2026-08-26 | passC | io.google/2026 live with keynotes and session library; no venue or dates for the next edition published |
| GopherCon | Seattle | — | 2026-08-26 | passC | gophercon.com live, Seattle Convention Center Summit; Aug 3-6 2026 edition just past, 2027 CFS not yet open |
| GOVIT Leadership Summit & Symposium | Bloomington | 2026-11-08 | 2026-09-15 | script | automated: page shows "november 8" and no decoy date |
| Grace Hopper Celebration | Anaheim | 2026-10-27 | 2026-09-15 | script | automated: page shows "october 27" and no decoy date |
| Great Lakes Software Symposium | Chicago | 2026-10-22 | 2026-09-15 | script | automated: page shows "october 22" and no decoy date |
| H2O Conference | Halifax | — | 2026-08-26 | passC | h2oconference.ca live, Canada's ocean-technology conference in Halifax NS; June 8-11 2026 edition past, no next date |
| Hack Arizona | Tucson | — | 2026-08-26 | passC | hack.arizona.edu live, University of Arizona student hackathon in Tucson; 'Hack Arizona 2026 has successfully concluded', no next date |
| Hack Dearborn | Dearborn | 2026-10-03 | 2026-09-15 | script | automated: page shows "october 3" and no decoy date |
| Hack Midwest | Kansas City | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Hack the 6ix | Toronto | — | 2026-08-26 | passC | hackthe6ix.com live, 12th edition, Toronto; July 17-19 2026 edition past, no next date |
| Hack the Valley | Toronto | 2026-10-16 | 2026-09-15 | script | automated: page shows "october 16" and no decoy date |
| Hack Western | London | 2026-11-20 | 2026-09-15 | script | automated: page shows "november 20" and no decoy date |
| Hack_NCState | Raleigh | 2027-02-06 | 2026-09-15 | script | automated: page shows "february 6" and no decoy date |
| Hack@Brown | Providence | 2027-02-06 | 2026-09-15 | script | automated: page shows "february 6" and no decoy date |
| Hackabull | Tampa | — | 2026-08-26 | passC | hackabull.com live, USF's 36-hour hackathon (Tampa); Hackabull 2026 was April 25-26 (past), no next date |
| Hackaday Superconference | Pasadena | 2026-11-06 | 2026-09-15 | script | automated: page shows "november 6" and no decoy date |
| HackDuke: Code for Good | Durham | — | 2026-08-26 | passC | hackduke.org live, Duke University (Durham NC) org whose flagship hackathon is Code for Good; no dates published, newest assets dated 2023 |
| HackED | Edmonton | — | 2026-08-26 | passC | hacked-2026.devpost.com live, U of Alberta Computer Engineering Club, Donadeo Innovation Centre Edmonton; Feb 20-22 2026 marked ended, no next date |
| Hacker Dojo | Mountain View | — | 2026-08-26 | passC | hackerdojo.org live (c 2009-2026), hackerspace at 855 Maude Ave, Mountain View CA, open 10am-9pm; no fixed workshop dates on site |
| Hacker Dojo Events | Mountain View | — | 2026-08-26 | passC | meetup.com/hackerdojo loads, Mountain View CA, 20,317 members with 135 upcoming events listed - active recurring series, no single next date |
| Hackers Teaching Hackers | Canal Winchester | — | 2026-08-26 | passC | hthackers.com live, annual infosec con at BrewDog DogTap, Canal Winchester OH; 2026.hthackers.com exists ('HTH 2026: Spaceballs') but publishes no dates yet |
| HackHCC | Houston | — | 2026-08-26 | passC | mlh.com 2026 season list shows HackHCC as in-person in Houston TX on May 22-23 (past); no next date |
| HackHERS | New Brunswick | 2027-02-27 | 2026-09-15 | script | automated: page shows "february 27" and no decoy date |
| HackHers @GSU | Atlanta | 2026-09-18 | 2026-09-15 | script | automated: page shows "september 18" and no decoy date |
| HackNC | Chapel Hill | 2026-10-09 | 2026-09-15 | script | automated: page shows "october 9" and no decoy date |
| HackNYU | New York | — | 2026-08-26 | passC | hacknyu.github.io live, official NYU student org running the 48-hour hackathon in New York; no dates published |
| HackPrinceton | Princeton | — | 2026-08-26 | passC | hackprinceton.com live with MLH 2026 season badge and Apr 18 deadline (past); no next edition dated |
| HackRice | Houston | — | 2026-09-10 | pass1 | hackrice.com: 'HACKRICE 16 SEPT 11-13 2026', 'Rice University's 16th Annual Hackathon September 11-13, 2026', venue 'Rice Student Center @ Rice University', 'Houston, Texas'; schedule opens 'Friday September 11, 2026 - Off at 4:00 PM'. Dates and city correct. |
| HackRPI | Troy | 2026-11-07 | 2026-09-15 | script | automated: page shows "november 7" and no decoy date |
| HackRU | New Brunswick | — | 2026-08-26 | passC | hackru.org resolves and serves the HackRU site (JS-rendered, title 'HackRU F25'); Rutgers New Brunswick hackathon, no date readable |
| hackUMBC | Baltimore | 2026-09-26 | 2026-09-15 | script | automated: page shows "september 26" and no decoy date |
| HackUSU | Logan | 2027-02-19 | 2026-09-15 | script | automated: page shows "february 19" and no decoy date |
| HackUTD | Richardson | 2026-11-07 | 2026-09-15 | script | automated: page shows "november 7" and no decoy date |
| HackWesTX | Lubbock | — | 2026-09-10 | pass2 | hackwestx.gdgttu.com titled 'HackWesTX 2026' and shows 'September 12-13, 2026' with venue Texas Tech University, Lubbock, TX. Matches record. |
| Halifax Indie Devs Play and Tell | Halifax | — | 2026-08-26 | passC | meetup.com/halifax-indie-devs-play-and-tell loads, Halifax NS, 487 members, monthly Play & Tell at Halifax Central Library - active recurring series |
| Hawaii International Conference on System Sciences | Waikoloa | 2027-01-05 | 2026-09-15 | script | automated: page shows "january 5" and no decoy date |
| Hawaii Tech Week | Honolulu | — | 2026-09-10 | c1 | hawaiitechweek.com (title 'Hawaii Tech Week 2026') JSON-LD startDate 2026-08-31, endDate 2026-09-06, addressLocality 'Honolulu', HI, location name 'Various Venues', OfflineEventAttendanceMode; on-page range 'AUG 31 - SEP 6, 2026'. Ran; matches stored last_date 2026-08-31 and city. No occurrence of '2027' on the site, so next_date correctly remains empty. |
| HenHacks | Newark | 2027-03-06 | 2026-09-15 | script | automated: page shows "march 6" and no decoy date |
| HLTH USA | Las Vegas | 2026-11-15 | 2026-09-15 | script | automated: page shows "november 15" and no decoy date |
| HopHacks | Baltimore | 2026-09-18 | 2026-09-15 | script | automated: page shows "september 18" and no decoy date |
| HR Tech Las Vegas | Las Vegas | 2026-10-20 | 2026-09-15 | script | automated: page shows "october 20" and no decoy date |
| HTDC Events | Honolulu | — | 2026-08-26 | passC | htdc.org/events live, HTDC Honolulu (521 Ala Moana Blvd), actively listing events through September 2026 |
| HudsonAlpha Tech Challenge | Huntsville | — | 2026-08-26 | passC | hudsonalpha.org/techchallenge live, 800 Hudson Way NW Huntsville AL; March 6-8 2026 edition past, no next date |
| ICS Cybersecurity Conference Nashville | Nashville | 2026-10-06 | 2026-09-15 | script | automated: page shows "october 6" and no decoy date |
| Idaho Digital Government Summit | Boise | — | 2026-09-10 | c1 | events.govtech.com/Idaho-Digital-Government-Summit (title 'Idaho Digital Government Summit 2026') JSON-LD startDate 2026-09-01T08:00, location 'Boise Centre', streetAddress '850 W Front Street', addressLocality 'Boise'. Ran; matches stored last_date 2026-09-01, city and venue. The only '2027' on the page is inside a speaker bio about the ADA Title II mandate, not an event date, so next_date correctly remains empty. |
| Idaho Technology Council Trade Show & Conference | Boise | — | 2026-08-26 | passC | idahotechcouncil.org page live for the Explore Idaho Tech Trade Show & Conference at Boise Centre, but banner reads 'This event has been postponed' - no date |
| Idea Village Pitch Night | New Orleans | — | 2026-08-26 | passC | ideavillage.org pitch-night page live, New Orleans; June 18 2026 edition recapped and 'Pitch Night returns in November 2026' with no exact date |
| IdeaFunding | Tucson | — | 2026-08-26 | passC | startuptucson.com/ideafunding live, Arizona's longest-running pitch competition in Tucson; 2026 cycle closed (main stage March 26 2026), no next date |
| Ignite Seattle | Seattle | 2026-10-01 | 2026-09-15 | script | automated: page shows "oct 1" and no decoy date |
| IgniteND | Valley City | — | 2026-08-26 | passC | edutech.nd.gov/ignitend live, two-day conference at Valley City State University; June 2-3 2026 edition past, no next date |
| Imagine RIT: Creativity and Innovation Festival | Rochester | 2027-04-24 | 2026-09-15 | script | automated: page shows "april 24, 2027" and no decoy date |
| ImmerseGT | Atlanta | — | 2026-08-26 | passC | immersegt.org live, XR hackathon at Georgia Tech, Atlanta; April 10-12 2026 edition past, no next date |
| IND(Venture) Indiana Venture Summit | Indianapolis | — | 2026-08-26 | passC | techpoint.org event page live and describes the Indiana Venture Summit in Indianapolis; page body still carries the July 12-13 2023 edition, no new date |
| IndieCade | Los Angeles | — | 2026-08-26 | search-unblock | Checked; no in-person Los Angeles date is published. The 2025 festival ran Jan 16-30 2026 with a streamed awards ceremony, and only a Playable Theatre Symposium (Mar 23-24) and Game Educators Symposium (May 1) are dated for 2026. Left undated rather than adopting the conflicting Oct 10-12 / Oct 15 dates that only aggregators carry. |
| Innovate 901 | Memphis | — | 2026-08-26 | passC | innovate901.com live, high-school startup pitch at Crosstown Concourse, 1350 Concourse Ave, Memphis TN; Jan 17 2026 pitch event past, no next date |
| Innovate New Mexico Technology Showcase | Albuquerque | — | 2026-08-26 | passC | innovatenewmexico.com/2026showcase live, Lobo Rainforest Building, downtown Albuquerque; no dates published for the 2026 showcase |
| InnovateHer | West Lafayette | 2027-02-06 | 2026-09-15 | script | automated: page shows "february 6" and no decoy date |
| Innovation Expo Sioux Falls | Sioux Falls | 2026-09-17 | 2026-09-15 | script | automated: page shows "september 17" and no decoy date |
| InsurTech America Symposium | Hartford | — | 2026-08-26 | passC | insurtechamericasymposium.com live, Connecticut Convention Center Hartford; April 13-14 2026 edition past, 2027 early registration open without dates |
| InsurTech Hartford Connect & Protect | Hartford | 2026-10-27 | 2026-09-15 | script | automated: page shows "october 27 2026" and no decoy date |
| INTERFACE Anchorage | Anchorage | — | 2026-08-26 | passC | f2fevents.com/event/anc26 live, Dena'ina Convention Center Anchorage; April 22 2026 edition past, 'will return in 2027' with no date |
| INTERFACE Honolulu | Honolulu | — | 2026-08-26 | passC | f2fevents.com/event/hnl26 live, Sheraton Waikiki Honolulu; May 21 2026 edition past, 'will return in 2027' with no date |
| INTERFACE Montana | Bozeman | — | 2026-08-26 | passC | f2fevents.com/event/mnt26 live, MSU Strand Union Building Bozeman MT; July 29 2026 edition past, 'will return in 2027' with no date |
| INTERFACE Omaha | Omaha | 2026-11-05 | 2026-09-15 | script | automated: page shows "november 5" and no decoy date |
| INTERFACE Wyoming | Cheyenne | — | 2026-08-26 | passC | f2fevents.com/event/wyo26 live, Little America Hotel & Resort Cheyenne WY; July 9 2026 edition past, 'will return in 2027' with no date |
| Investing in Montana Summit | Bozeman | — | 2026-08-26 | unblockB | mthightech.org/events/2026-investing-in-montana-summit loads (HTTP 200), title '2026 Investing in Montana Summit'. JSON-LD startDate 2026-06-25T10:00-0600, venue 'AC Hotel by Marriott Bozeman Downtown, 110 North Tracy Avenue' - confirms Bozeman. Date is past and no next edition is announced. |
| Iowa Code Camp | Des Moines | 2026-11-07 | 2026-09-15 | script | automated: page shows "november 7, 2026" and no decoy date |
| Iowa Startup Week | Des Moines | 2026-09-28 | 2026-09-15 | script | automated: page shows "september 28" and no decoy date |
| Iowa Tech Week | Des Moines | — | 2026-08-26 | passC | technologyiowa.org/techweek live, Des Moines IA; April 6-9 2026 edition past, no next date |
| IS: Life Sciences | Wilmington | 2026-12-10 | 2026-09-15 | script | automated: page shows "december 10" and no decoy date |
| ISTE+ASCD Conference | Boston | 2027-06-27 | 2026-09-15 | script | automated: page shows "june 27" and no decoy date |
| ITEXPO | Fort Lauderdale | 2027-02-09 | 2026-09-15 | script | automated: page shows "february 9" and no decoy date |
| ITS Northern Lights Conference | Sioux Falls | — | 2026-08-26 | passC | itsmn.starchapter.com page live, Holiday Inn Sioux Falls City Centre, 100 W 8th Street, Sioux Falls SD; May 12-14 2026 edition past (sold out), no next date |
| JAMHacks | Waterloo | — | 2026-08-26 | passC | jamhacks.ca live, JAMHacks 10 at University of Waterloo; June 12-14 2026 edition past, no next date |
| John P. Ellbogen $50K Entrepreneurship Competition | Laramie | — | 2026-08-26 | passC | ellbogen50k.org live, University of Wyoming competition (Laramie); 2026 finalists posted and 2026/27 application open, no dates |
| JSNation US | New York | 2026-11-16 | 2026-09-15 | script | automated: page shows "november 16" and no decoy date |
| JumpStart Expo & Pitch Night | Burlington | — | 2026-08-26 | passC | generatorvt.com/jumpstart-expo live, 40 Sears Ln Burlington VT; Wednesday April 8 2026 edition past, no next date |
| JumpStart VC Fest | Cleveland | 2026-09-29 | 2026-09-15 | script | automated: page shows "september 29" and no decoy date |
| KCD SF Bay Area | Mountain View | — | 2026-09-10 | c1 | cncf.io/kcds/ no longer lists this KCD among upcoming events. The chapter page community.cncf.io/kcd-sf-bay-area/ has upcomingEvents count 0 and pastEvents containing 'KCD San Francisco Bay Area 2026', start_date 2026-09-01T16:00Z. The event page community2.cncf.io/events/details/cncf-kcd-sf-bay-area-presents-kcd-san-francisco-bay-area-2026/ reads 'In-person Event - KCD San Francisco Bay Area is back for 2026! Tuesday, September 1, 2026 at the Computer History Museum in Mountain View' with JSON-LD location 'Computer History Museum', 1401 North Shoreline Boulevard, Mountain View CA, OfflineEventAttendanceMode. Confirms the stored city Mountain View (rather than the chapter's own 'San Francisco' label) and last_date 2026-09-01; no next edition published, so next_date correctly remains empty. |
| Kent Hack Enough | Kent | 2027-03-06 | 2026-09-15 | script | automated: page shows "march 6" and no decoy date |
| Kentucky Entrepreneur Hall of Fame Induction Celebration | Lexington | 2026-11-04 | 2026-09-15 | script | automated: page shows "november 4, 2026" and no decoy date |
| Knight Hacks | Orlando | 2026-10-09 | 2026-09-15 | script | automated: page shows "october 9" and no decoy date |
| Knox Game Jam | Knoxville | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| KubeCon + CloudNativeCon North America | Salt Lake City | 2026-11-09 | 2026-09-15 | script | automated: page shows "november 9" and no decoy date |
| LASCON | Austin | 2026-10-29 | 2026-09-15 | script | automated: page shows "october 29" and no decoy date |
| Latinas in Tech | Multiple cities | — | 2026-08-26 | passC | latinasintech.org live ('Connecting, supporting and empowering Latina women working in tech'); JS-rendered chapter/event lists not readable, no dates published in the served HTML |
| LaunchVT Demo Night | Burlington | — | 2026-08-26 | passC | lccvermont.org/launchvt live, 110 Main Street Burlington VT, describes Demo Night as Vermont's largest pitch competition; 'Demo Night 2026' referenced with no date |
| Lincoln AI | Lincoln | — | 2026-08-26 | passC | meetup.com/lincoln-ai loads, Lincoln NE, 417 members; last meeting Aug 18 2026 at Don't Panic Labs, no upcoming event scheduled |
| Live! 360 Tech Con | Orlando | 2026-11-15 | 2026-09-15 | script | automated: page shows "november 15, 2026" and no decoy date |
| Lone Star Cyber Summit | Austin | 2026-10-20 | 2026-09-15 | script | automated: page shows "october 20" and no decoy date |
| Maine Blue Economy Week | Portland | 2026-09-30 | 2026-09-15 | script | automated: page shows "september 30" and no decoy date |
| Maine Entrepreneurs Summit | Portland | — | 2026-08-26 | passC | mced.biz/events live (Maine Center for Entrepreneurs, Portland ME); Maine Entrepreneurs Summit listed for May 12 2026 (past), no next date |
| Maine Tech Week | Portland | 2026-10-19 | 2026-09-15 | script | automated: page shows "october 19" and no decoy date |
| Maker Faire Baton Rouge | Baton Rouge | 2026-10-17 | 2026-09-15 | script | automated: page shows "october 17" and no decoy date |
| Maker Faire Bay Area | Vallejo | 2026-09-25 | 2026-09-15 | script | automated: page shows "september 25" and no decoy date |
| Maker Faire Brownsville | Brownsville | 2026-09-24 | 2026-09-15 | script | automated: page shows "september 24" and no decoy date |
| Maker Faire Happy Valley | State College | 2026-10-03 | 2026-09-15 | script | automated: page shows "october 3" and no decoy date |
| Maker Faire Louisville | Louisville | 2026-10-17 | 2026-09-15 | script | automated: page shows "october 17, 2026" and no decoy date |
| Maker Faire NW Arkansas | Fayetteville | — | 2026-09-10 | pass2 | nwa.makerfaire.com: 'The NWA Maker Faire will be held on September 12th, 2026 from 9:00 am - 4:00 pm. It will be hosted at the Fayetteville Public Library and held in the Event Center.' Single day, matches record. |
| Maker Faire Orange County | Costa Mesa | — | 2026-09-10 | pass2 | oc.makerfaire.com hero reads 'Sept 12 & 13, 2026' with the venue line 'Center - Costa Mesa, CA'. Two days, matches record. |
| Maker Faire Orlando | Orlando | 2026-11-07 | 2026-09-15 | script | automated: page shows "november 7" and no decoy date |
| Maker Faire Rochester | Rochester | 2026-11-21 | 2026-09-15 | script | automated: page shows "november 21" and no decoy date |
| Maker Faire Waterloo | Waterloo | — | 2026-09-10 | pass2 | waterloomakerfaire.org carries JSON-LD startDate 2026-09-13T10:00:00-04:00 and endDate 2026-09-13T17:00:00-04:00, plus prose 'September 13, 2026'. Single day, matches record. |
| Maker Faire Yukon | Whitehorse | — | 2026-09-10 | c1 | makerfaire.com/upcoming-faires/ does not list Yukon anywhere (nearest Canadian listing is Waterloo, Sep 13), consistent with the edition having already run. The organiser Yukonstruct's own event page yukonstruct.com/event/maker-faire-yukon-3/ reads 'Yukonstruct's Maker Faire North of 60 is back right here in Whitehorse on Saturday & Sunday, August 29th and 30th at Kwanlin Dun Cultural Centre', and yukonstruct.com/calendar/ carries a 'Maker Faire Yukon 2026 Appreciation Social' describing the wrap-up of 'an incredible Maker Faire Yukon 2026'. Matches stored last_date 2026-08-29 and city Whitehorse. No 2027 date announced, so next_date correctly remains empty. Url left as the Maker Faire directory, which is where a licensed 2027 faire would reappear. |
| MakeShift Maker Meetup | Lincoln | — | 2026-08-26 | passC | makeshiftlincoln.org live, makerspace at 1135 N. 22nd St Lincoln NE, weekly Monday Meetups 5:30-7pm; recurring, no fixed dates |
| Manitoba Tech Week | Winnipeg | 2027-02-21 | 2026-09-15 | script | automated: page shows "february 21" and no decoy date |
| MasseyHacks | Windsor | — | 2026-08-26 | passC | masseyhacks.ca resolves and serves the MasseyHacks XII page (JS-rendered, no readable body); no date available |
| McHacks | Montreal | — | 2026-08-26 | passC | mchacks.ca live, McHacks 13 at McGill downtown campus Montreal; Jan 17-18 2026 edition past, no next date |
| MCP Community Connect | San Francisco | — | 2026-09-10 | pass2 | globalai.community/e/bay9vh24 reads 'Mon, 14 September 2026 - 14:00-20:30 Pacific, GitHub HQ, San Francisco, United States'. Single day, matches record. |
| MCP Dev Summit Toronto | Toronto | 2026-10-05 | 2026-09-15 | script | automated: page shows "oct 5, 2026" and no decoy date |
| MEET Show | Moncton | 2028-05-03 | 2026-09-15 | script | automated: page shows "may 3" and no decoy date |
| Meeting in the Millyard | Nashua | 2027-05-18 | 2026-09-15 | script | automated: page shows "may 18" and no decoy date |
| Michigan DevFest | Detroit | — | 2026-08-26 | passC | midevfest.com resolves and serves 'Michigan DevFest 2026' (JS-rendered, no readable body); GDG Ann Arbor lists a 'Michigan DevFest + AI Hackathon 2026' on Nov 13 2026 but the host city is unconfirmed, so no date recorded |
| Michigan Tech Career Fair | Houghton | — | 2026-08-26 | passC | mtu.edu/career live (c 2026), Michigan Technological University career services, Houghton MI; references the Fall Career Fair but publishes no dates on this page |
| Michigan Tech Week | Detroit | — | 2026-08-26 | passC | michigantechweek.com live, MTW26 at Michigan Central, Detroit, May 19-21 2026 (past); no next date |
| Michigan Technology Conference | Rochester | 2026-10-28 | 2026-09-15 | script | automated: page shows "october 28" and no decoy date |
| Microsoft Power Platform Community Conference | Las Vegas | 2026-10-27 | 2026-09-15 | script | automated: page shows "october 27" and no decoy date |
| Microsoft Reactor Redmond | Redmond | — | 2026-08-26 | passC | meetup.com/microsoft-reactor-redmond loads, Redmond WA, 24,168 members with 37 upcoming events - active recurring series, no single next date |
| Midwest Entrepreneurship Conference | Omaha | — | 2026-08-26 | passC | unomaha.edu CIEF page live, Omaha NE; April 17 2026 edition past, no next date |
| Mile High Dreamin' | Denver | — | 2026-09-10 | c1 | milehighdreamin.com now runs on Salesforce Experience Cloud and renders nothing to curl (title 'Welcome to LWC Communities!'). Its LWR view payload /webruntime/view/.../home_view contains 'August 26-27 - Mile High Dreamin' 2026', 'Denver, Colorado', 'Thanks to everyone who helped make the 2026 conference an amazing success!' and a still-to-come list ending with '2027 dates!'. So the 2026 edition ran Aug 26-27 (matching stored last_date 2026-08-26) and no 2027 date is published - next_date correctly remains empty. Domain is genuine, not squatted: assets and auth are served from milehighdreamin.my.salesforce.com. |
| Mind the Product Chicago | Chicago | 2026-10-06 | 2026-09-15 | script | automated: page shows "october 6" and no decoy date |
| Minnebar | Minneapolis | — | 2026-08-26 | passC | minnestar.org live and active (Minnedemo42 scheduled Oct 1 2026); no Minnebar date announced |
| Minnedemo | St. Paul | 2026-10-01 | 2026-09-15 | script | automated: page shows "oct 1, 2026" and no decoy date |
| Mississippi Aerospace & Defense Symposium | Flowood | — | 2026-09-10 | c1 | The stored url innovate.ms/events/ lists five other events (Launch Tennessee 3686, Pitch at Venture Atlanta, DelTech, Accelerate, Ignite) and not this one, so I used the named event page innovate.ms/event/mississippi-aerospace-defense-symposium-2/: JSON-LD startDate 2026-09-02, endDate 2026-09-04, location 'Sheraton Refuge Conference Center', 2200 Refuge Blvd, Flowood MS 39232; body reads 'September 2 - September 4'. Ran; matches stored last_date 2026-09-02, city Flowood and venue. Note the venue is distinct from Innovate Mississippi's own office at 121 N State St, Jackson - the record correctly points at the venue city. No 2027 date published. |
| Mississippi AI Collaborative Annual Conference | Jackson | — | 2026-08-26 | passC | integrate.io blog listicle loads and describes the conference at the Mississippi E-Center, Jackson State University, June 16-17 2026 (past); third-party vendor blog rather than the organiser's site - link quality flagged |
| Mississippi Technology Expo | Jackson | — | 2026-08-26 | passC | eventbrite listing live for the 2026 Mississippi Technology Expo at Mississippi Trade Mart, Jackson MS, April 9 2026 - marked 'Event ended', no next date |
| MIT $100K Entrepreneurship Competition | Cambridge | — | 2026-08-26 | passC | mit100k.org live, describes the MIT $100K (Pitch/Accelerate/Launch) at MIT, Cambridge MA; only 'usually September, March, May', no dates |
| MIT Bitcoin Expo | Cambridge | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| MITRE Embedded Capture the Flag | Multiple cities, US & Canada | — | 2026-08-26 | passC | ectf.mitre.org live; 2026 cycle ran Jan 14 kickoff to Apr 24 award ceremony (past) and the competition 'can be done 100% remotely', so no city-bound next date |
| MLconf | New York | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| MnTech Connect | St. Paul | 2027-04-01 | 2026-09-15 | script | automated: page shows "april 1, 2027" and no decoy date |
| MnTech Twin Cities Startup Community Events | Minneapolis | — | 2026-08-26 | unblockB | mntech.org loads (HTTP 200), title 'MnTech / Fueling the Success of Minnesota's Tech Ecosystem'. It is the correct organiser hub for the recurring Minnesota tech community series (Coffee Connect, Tech On Tap, WLiT) and carries a run of 2026 in-person event dates. Correct link for a meetup-series record; no single next date applies. |
| Momentum Developer Conference | Cincinnati | 2026-10-15 | 2026-09-15 | script | automated: page shows "october 15, 2026" and no decoy date |
| Money20/20 USA | Las Vegas | 2026-10-18 | 2026-09-15 | script | automated: page shows "october 18" and no decoy date |
| MongoDB.local Dallas | Irving | 2026-10-14 | 2026-09-15 | script | automated: page shows "october 14, 2026" and no decoy date |
| MongoDB.local NYC | New York | 2026-09-30 | 2026-09-15 | script | automated: page shows "september 30, 2026" and no decoy date |
| MongoDB.local Toronto | Toronto | 2026-11-19 | 2026-09-15 | script | automated: page shows "november 19, 2026" and no decoy date |
| Montreal Games Week | Montreal | 2026-11-10 | 2026-09-15 | script | automated: page shows "nov 10" and no decoy date |
| Montreal International Game Summit (MIGS) | Montreal | 2026-11-10 | 2026-09-15 | script | automated: page shows "november 10" and no decoy date |
| MPC Hacks | Montreal | — | 2026-08-26 | passC | mpchacks.com resolves and serves 'MPC Hacks: Inter-University Hackathon' (JS-rendered, no readable body); no date available |
| Nashville Microsoft Community Day | Nashville | — | 2026-09-10 | pass1 | m365nashville.org redirects to communitydays.org/event/2026-09-11/nashville-microsoft-community-day: 'Nashville Microsoft Community Day, September 11, 2026, Nelson Andrews Leadership Center, 3088 Smith Springs Rd, Nashville, TN 37013'. Registration open, 11th annual event. Date and city correct; the short domain still resolves so the url needs no change. |
| NBIF Breakthru | Fredericton | — | 2026-08-26 | passC | nbif.ca/breakthru live, NBIF Fredericton NB; programme 'returns in 2026, with a live finale in March 2027' - no exact date |
| NC TECH Awards Celebration | Raleigh | 2026-11-16 | 2026-09-15 | script | automated: page shows "november 16" and no decoy date |
| NC TECH Outlook for Tech | Charlotte | — | 2026-08-26 | passC | nctech.org signature-events page lists Outlook for Tech on February 12 (2026) at The Revelry, North End Charlotte - past, no next date |
| NC TECH Summit for Women in Tech | Asheville | 2026-09-28 | 2026-09-15 | script | automated: page shows "september 28" and no decoy date |
| NC TECH TECHFEST | Durham | — | 2026-08-26 | passC | nctech.org signature-events page lists TECHFEST May 13-14 (2026) at Durham Convention Center/Durham Armory - past, no next date |
| Nebraska.Code() | Lincoln | — | 2026-08-26 | passC | nebraska-code.com live, Lincoln NE; July 22-24 2026 edition past, no next date |
| Nerd Nite New York | New York | — | 2026-08-26 | passC | nerdnite.com live global directory listing a New York chapter; link is the global site rather than the city page and no New York date is published |
| Nerd Nite San Francisco | San Francisco | — | 2026-08-26 | passC | nerdnite.com live global directory listing a San Francisco chapter; link is the global site rather than the city page and no San Francisco date is published |
| Nerd Nite Washington DC | Washington | — | 2026-08-26 | passC | nerdnite.com live global directory listing a Washington DC chapter; link is the global site rather than the city page and no DC date is published |
| NetSuite SuiteWorld | Las Vegas | 2026-10-25 | 2026-09-15 | script | automated: page shows "october 25" and no decoy date |
| New England Drupal Camp | Providence | 2026-11-13 | 2026-09-15 | script | automated: page shows "november 13" and no decoy date |
| New Mexico Tech Summit | Albuquerque | 2026-09-24 | 2026-09-15 | script | automated: page shows "september 24, 2026" and no decoy date |
| New Mexico Tech Week | Albuquerque | 2026-10-26 | 2026-09-15 | script | automated: page shows "october 26" and no decoy date |
| New Orleans Entrepreneur Week | New Orleans | 2027-03-08 | 2026-09-15 | script | automated: page shows "march 8" and no decoy date |
| New Ventures BC Demo Day | Vancouver | — | 2026-09-10 | pass2 | newventuresbc.com/demo-day: 'Demo Day 2026 - Monday, September 14, 2026', featured companies listed for this edition. Matches record. No public venue address on the page; organiser is at 1055 Dunsmuir Street, Vancouver BC, so the city stands. |
| New York State Innovation Summit | Buffalo | 2026-10-27 | 2026-09-15 | script | automated: page shows "october 27" and no decoy date |
| New York Tech Week | New York | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| NH Tech Alliance Cybersecurity Summit | Manchester | — | 2026-09-10 | pass1 | nhtechalliance.org/cybersecurity-summit shows '2026 Agenda / Register / September 10th, 2026 / Manchester Community College'. Single-day event on 2026-09-10 in Manchester NH; matches the record. |
| NH Tech Alliance Innovation Summit | Nashua | 2026-10-06 | 2026-09-15 | script | automated: page shows "october 6" and no decoy date |
| NH Tech Alliance Product of the Year | Concord | 2026-11-19 | 2026-09-15 | script | automated: page shows "november 19" and no decoy date |
| NICAR Conference | Indianapolis | — | 2026-08-26 | passC | ire.org NICAR 2026 page live, JW Marriott, 10 S. West St, Indianapolis; March 5-8 2026 edition past, no 2027 date announced |
| NM TechFest | Albuquerque | 2026-10-29 | 2026-09-15 | script | automated: page shows "october 29" and no decoy date |
| Nolacon | New Orleans | — | 2026-08-26 | passC | nolacon.com live, New Orleans infosec con with archives back to 2014; May 15-17 2026 edition past, no next date |
| North American Games Industry Summit (NAGIS) | Edmonton | — | 2026-08-26 | passC | nagis.ca live, B2B games summit in Edmonton AB; June 2026 edition past (2026 event report posted), no next date |
| North Bay Python | Petaluma | — | 2026-08-26 | passC | northbaypython.org live, Reis River Ranch, Petaluma CA; April 25-26 2026 edition past, no next date |
| North Forge FabLab Open House | Winnipeg | — | 2026-08-26 | passC | northforge.ca live, 'FabLab Open House (Public Tours) every Tuesday night 6 PM, 312 William Ave' Winnipeg, with Sept/Oct 2026 tour dates listed - recurring, no single next date |
| Northeast Dreamin' | Concord | 2026-10-29 | 2026-09-15 | script | automated: page shows "october 29" and no decoy date |
| NorthSec | Montreal | 2027-05-10 | 2026-09-15 | script | automated: page shows "may 10" and no decoy date |
| NSBE Annual Convention | Baltimore | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| NVIDIA GTC | San Jose | 2027-03-15 | 2026-09-15 | script | automated: page shows "march 15" and no decoy date |
| NVTC Tech100 Celebration | McLean | 2026-12-15 | 2026-09-15 | script | automated: page shows "dec 15, 2026" and no decoy date |
| NWA Tech Summit | Bentonville | — | 2026-09-10 | c1 | bentonvillearea.com/nwa-tech-summit/ body text and JSON-LD description both read 'The 2026 NWA Tech Summit takes place September 1, 2026, at The Ledger in Bentonville, Arkansas'. Ran; matches stored last_date 2026-09-01, city Bentonville and venue The Ledger. The 'October 28-29, 2024' string on the page is leftover banner copy from an earlier edition, not a current date. No 2027 date published, so next_date correctly remains empty. |
| nwHacks | Vancouver | 2027-01-16 | 2026-09-15 | script | automated: page shows "january 16" and no decoy date |
| NY SMART I-Corridor Semiconductor Summit | Rochester | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| NY Tech Meetup | New York | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| NYC Resistor Craft Night | Brooklyn | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Ocean Exchange | Fort Lauderdale | 2026-10-25 | 2026-09-15 | script | automated: page shows "october 25" and no decoy date |
| ODSC East | Boston | 2027-05-10 | 2026-09-15 | script | automated: page shows "may 10" and no decoy date |
| ODSC West | San Francisco | 2026-10-27 | 2026-09-15 | script | automated: page shows "october 27" and no decoy date |
| Offensive AI Con | San Diego | 2026-10-04 | 2026-09-15 | script | automated: page shows "october 4" and no decoy date |
| Ohio Tech Summit | Columbus | — | 2026-08-26 | passC | ohiotechsummit.org live, Columbus OH; May 14 2026 edition sold out and past, no next date |
| OIN Connect | San Jose | 2026-10-19 | 2026-09-15 | script | automated: page shows "october 19, 2026" and no decoy date |
| Oklahoma Innovation Day | Oklahoma City | — | 2026-08-26 | passC | oklahoma.gov OCAST page live; OKC edition April 22-23 2026 (past), no next OKC date |
| Oktane | Las Vegas | 2026-09-22 | 2026-09-15 | script | automated: page shows "september 22" and no decoy date |
| Open Door Leadership Series | Portland | 2026-09-30 | 2026-09-15 | script | automated: page shows "september 30, 2026" and no decoy date |
| Open Sauce | San Mateo | 2027-07-17 | 2026-09-15 | script | automated: page shows "july 17" and no decoy date |
| Open Source 101 Charlotte | Charlotte | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Open Source AI Week | San Jose | 2026-10-16 | 2026-09-15 | script | automated: page shows "oct 16" and no decoy date |
| Open Source in Finance Forum New York | New York | 2026-11-04 | 2026-09-15 | script | automated: page shows "november 4" and no decoy date |
| Open Source Summit North America | Vancouver | 2027-05-17 | 2026-09-15 | script | automated: page shows "may 17" and no decoy date |
| OPI Summit on DPU/IPUs | San Jose | 2026-10-15 | 2026-09-15 | script | automated: page shows "october 15, 2026" and no decoy date |
| Oracle AI World | Las Vegas | 2026-10-25 | 2026-09-15 | script | automated: page shows "october 25" and no decoy date |
| Orlando Code Camp | Orlando | — | 2026-08-26 | passC | orlandocodecamp.com live, 18th annual, Seminole State College (Orlando metro); April 11 2026 edition past, no next date |
| Ottawa Innovation Week | Ottawa | — | 2026-08-26 | passC | investottawa.ca/innovation-week live, Ottawa; June 8-12 2026 edition past, no next date |
| Out in Tech | Multiple cities | — | 2026-08-26 | unblockB | outintech.com loads (HTTP 200), title 'Out In Tech'. It is the correct organiser for the LGBTQ+ tech chapter meetup series, advertising the 2026 Out in Tech Leadership Institute as an in-person 'two and a half immersive days in New York City' plus chapter counts and an events index. Correct link for a multi-city meetup-series record; no single date applies. |
| OwlHacks | Philadelphia | 2026-09-26 | 2026-09-15 | script | automated: page shows "september 26" and no decoy date |
| Pacific Northwest Software Symposium | Seattle | 2026-11-12 | 2026-09-15 | script | automated: page shows "november 12" and no decoy date |
| Pacific NW Software Quality Conference | Portland | 2026-10-12 | 2026-09-15 | script | automated: page shows "october 12" and no decoy date |
| PASS Data Community Summit West | Seattle | 2026-11-09 | 2026-09-15 | script | automated: page shows "november 9" and no decoy date |
| Pathways to Progress | Charleston | 2027-04-29 | 2026-09-15 | script | automated: page shows "april 29, 2027" and no decoy date |
| PAX East | Boston | 2027-04-22 | 2026-09-15 | script | automated: page shows "april 22" and no decoy date |
| PAX Unplugged | Philadelphia | 2026-12-04 | 2026-09-15 | script | automated: page shows "december 4" and no decoy date |
| PAX West | Seattle | 2027-09-03 | 2026-09-15 | script | automated: page shows "september 3" and no decoy date |
| PEI BioAlliance Summer Social | Charlottetown | — | 2026-08-26 | passC | peibioalliance.com/events live, Charlottetown PEI; 'Summer Social 2026' listed for July 14 2026 (past), nothing upcoming |
| PennApps | Philadelphia | — | 2026-08-26 | passC | pennapps.com live (UPenn, Philadelphia), says the hackathon runs in the spring semester with applications in October; no dates published |
| PGConf.dev | Montreal | 2027-05-11 | 2026-09-15 | script | automated: page shows "may 11" and no decoy date |
| Philly Tech Week | Philadelphia | — | 2026-08-26 | passC | phillytechweek.com live, Philadelphia; May 4-8 2026 edition past, no next date |
| PlatformCon Live Day San Francisco | San Francisco | 2027-02-24 | 2026-09-15 | script | automated: page shows "feb 24, 2027" and no decoy date |
| PNW Day of Data | Vancouver | 2026-11-07 | 2026-09-15 | script | automated: page shows "november 7" and no decoy date |
| PodCamp Toronto | Toronto | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Portland Retro Gaming Expo | Portland | — | 2026-08-26 | passC | retrogamingexpo.com live, Portland OR, posting PRGE 2026 guest announcements through July 2026; countdown only, no readable dates |
| posit::conf | Houston | 2026-09-14 | 2026-09-10 | pass2 | conf.posit.co redirects to /2026/ titled posit::conf(2026), hero 'Sept. 14-16, Houston, TX', day-by-day schedule Monday September 14 through Wednesday September 16, venue Hilton Americas-Houston. Matches record. |
| Prairie Capital Summit | Fargo | 2026-10-07 | 2026-09-15 | script | automated: page shows "october 7" and no decoy date |
| Prairie Dev Con | Winnipeg | 2026-09-21 | 2026-09-15 | script | automated: page shows "september 21" and no decoy date |
| Prompt Victoria AI Conference | Victoria | 2026-11-05 | 2026-09-15 | script | automated: page shows "november 5, 2026" and no decoy date |
| Puget Sound Programming Python (PuPPy) | Seattle | — | 2026-08-26 | passC | meetup.com/psppython loads, Seattle WA, 10,912 members with regular hack nights - active recurring series, no single next date |
| PyBay | San Francisco | 2026-10-03 | 2026-09-15 | script | automated: page shows "3 october 2026" and no decoy date |
| PyCascades | Vancouver | — | 2026-08-26 | passC | pycascades.com live, next edition stated as Vancouver BC; 'occurs each year around early spring' with no dates announced |
| PyCon US | Long Beach | — | 2026-08-26 | passC | pycon.org live, 'PyCon US 2026 and 2027 will be held in Long Beach, California'; no exact dates on the page |
| PyLadies | Multiple cities | — | 2026-08-26 | passC | pyladies.com/locations live, ~220 chapter locations listed, footer 2007-2026; no dates published |
| PyOhio | Cleveland | — | 2026-08-26 | passC | pyohio.org live, Cleveland State University Student Center; July 25-26 2026 edition past, no next date |
| PyTorch Conference | San Jose | 2026-10-20 | 2026-09-15 | script | automated: page shows "october 20" and no decoy date |
| QA or the Highway | Columbus | 2027-06-11 | 2026-09-15 | script | automated: page shows "june 11, 2027" and no decoy date |
| QCon San Francisco | San Francisco | 2026-11-16 | 2026-09-15 | script | automated: page shows "november 16" and no decoy date |
| Quantum.Tech USA | Boston | 2027-05-25 | 2026-09-15 | script | automated: page shows "may 25" and no decoy date |
| Rails Camp West | Otis | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Rally Innovation Conference | Indianapolis | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Recurse Center | Brooklyn | — | 2026-08-26 | passC | recurse.com live, Brooklyn NY (with remote option); 'new batches start every six weeks', no fixed dates |
| Red Hat Summit | Boston | 2027-05-25 | 2026-09-15 | script | automated: page shows "may 25" and no decoy date |
| RedacteCON | Grand Junction | 2026-09-19 | 2026-09-15 | script | automated: page shows "sep 19" and no decoy date |
| Refresh Miami | Miami | — | 2026-08-26 | passC | refreshmiami.com live and active (events listed through Aug-Nov 2026), Miami/South Florida tech community |
| RenderATL | Atlanta | 2027-08-18 | 2026-09-15 | script | automated: page shows "august 18" and no decoy date |
| Reno Startup Week | Reno | 2026-09-28 | 2026-09-15 | script | automated: page shows "september 28" and no decoy date |
| Rhode Island Startup Week | Providence | 2026-09-18 | 2026-09-15 | script | automated: page shows "september 18" and no decoy date |
| RIHub Pizza & Pitches | Providence | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| RIT University-Wide Career Fair | Rochester | — | 2026-08-26 | passC | rit.edu/careerservices live, Rochester NY, lists the University-Wide Career Fair under Events with 2026 news; no dated next fair published |
| Rochester Security Summit | Rochester | 2026-10-14 | 2026-09-15 | script | automated: page shows "october 14" and no decoy date |
| Rocky Mountain Ruby | Boulder | 2026-09-28 | 2026-09-15 | script | automated: page shows "september 28" and no decoy date |
| Rocky Mountain Technology Summit | Denver | 2027-05-25 | 2026-09-15 | script | automated: page shows "may 25" and no decoy date |
| ROS By-The-Bay | Sunnyvale | — | 2026-09-10 | pass1 | meetup.com/ros-by-the-bay shows 26 past events and no upcoming-events section. Most recent: 'ROS By-The-Bay September Meetup at Bosch' Thu Sep 3 2026 6:00 PM PDT at Bosch USA, 384 Santa Trinita Avenue, Sunnyvale CA - which confirms both the Sep 3 last_date and the Sunnyvale city (the Meetup group header says Mountain View, but that is the group's default locale; venues rotate and the latest was Sunnyvale). No next meeting announced, so the record's empty next_date is correct. |
| RubyConf | Las Vegas | — | 2026-08-26 | passC | rubycentral.org/conferences lists RubyConf 2026 in Las Vegas July 14-16 2026 (past); no next date |
| RVAsec | Richmond | — | 2026-08-26 | passC | rvasec.com live, Richmond VA; June 9-10 2026 edition past, no next date |
| rvatech/Women in Technology Conference | Richmond | 2026-11-17 | 2026-09-15 | script | automated: page shows "november 17, 2026" and no decoy date |
| SaaStr Annual | San Mateo | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Sacramento Summer Startup Party | Sacramento | — | 2026-08-26 | passC | startupsac.com live and active in Sacramento (weekly startup-events roundups through Aug 2026), but the Summer Startup Party is not named anywhere on the page - link quality flagged |
| Sacramento Tech Week | Sacramento | 2026-10-19 | 2026-09-15 | script | automated: page shows "october 19" and no decoy date |
| SAINTCON | Provo | 2026-10-27 | 2026-09-15 | script | automated: page shows "october 27" and no decoy date |
| San Francisco Python Meetup Group | San Francisco | — | 2026-08-26 | passC | meetup.com/sfpython loads, San Francisco CA, 13,241 members, '20+ developer focused live events' a year - active recurring series |
| SANS DC Metro | Bethesda | 2026-09-28 | 2026-09-15 | script | automated: page shows "september 28" and no decoy date |
| SANS Miami | Coral Gables | 2026-10-26 | 2026-09-15 | script | automated: page shows "october 26" and no decoy date |
| SANS NetWars Tournament | Multiple cities | — | 2026-08-26 | passC | sans.org/cyber-ranges live and describes the NetWars tournament suite; schedule sits behind a separate page, no dates or cities published here |
| SANS Network Security | Las Vegas | 2026-09-21 | 2026-09-15 | script | automated: page shows "september 21" and no decoy date |
| SANS Raleigh | Raleigh | 2026-11-02 | 2026-09-15 | script | automated: page shows "november 2" and no decoy date |
| SANS San Francisco | San Francisco | 2026-11-02 | 2026-09-15 | script | automated: page shows "november 2" and no decoy date |
| SANS Virginia Beach | Virginia Beach | — | 2026-08-26 | passA | sans.org/cyber-security-training-events/virginia-beach-2026/ shows 'Mon, Aug 24 - Fri, Sep 4, 2026', Virginia Beach, Virginia — matches record |
| SCaLE | Pasadena | 2027-04-01 | 2026-09-15 | script | automated: page shows "april 1" and no decoy date |
| Scenic City Summit | Chattanooga | — | 2026-08-26 | 2 | spot-check by the researcher after merge |
| Scrum Day Madison | Madison | 2026-10-15 | 2026-09-15 | script | automated: page shows "oct 15" and no decoy date |
| Seattle Day of Data | Seattle | 2026-11-12 | 2026-09-15 | script | automated: page shows "12 november 2026" and no decoy date |
| Seattle Tech Week | Seattle | — | 2026-08-26 | passC | seattletechweek.com 301s to the organiser's Luma page, which says 'Dates for Seattle Tech Week 2027 are TBD - Subscribe to be the first to know' |
| SeattleJS | Seattle | — | 2026-08-26 | passC | meetup.com/seattlejs loads, Seattle WA, 7,259 members with 45 upcoming events - active recurring series |
| SecTor | Toronto | 2026-10-06 | 2026-09-15 | script | automated: page shows "october 6" and no decoy date |
| SecureWorld St. Louis | St. Louis | — | 2026-09-10 | c2 | secureworld.io/events/st-louis-mo-2026 200, title 'SecureWorld St. Louis 2026 Cybersecurity Conference', in-script date 'September 2, 2026' - matches stored last_date 2026-09-02. The organiser's secureworld.io/events 'All In-Person Conferences' list (Detroit 9/17, Atlanta 9/24, Denver 10/1, Dallas 10/8, NYC 10/29, Seattle 11/4-5, Twin Cities 11/19) carries no St. Louis entry, so no 2027 edition is published yet; next_date correctly left empty. |
| SecureWV | Charleston | 2026-10-22 | 2026-09-15 | script | automated: page shows "october 22" and no decoy date |
| Security BSides Delaware | Newark | 2026-11-13 | 2026-09-15 | script | automated: page shows "november 13, 2026" and no decoy date |
| SF Climate Week | San Francisco | — | 2026-08-26 | passC | sfclimateweek.org live, San Francisco Bay Area; April 18-26 2026 edition past, no next date |
| SF Hacks | San Francisco | 2027-02-19 | 2026-09-15 | script | automated: page shows "february 19" and no decoy date |
| SheHacks+ | London | — | 2026-08-26 | passC | shehacks.ca live, Western University London ON; Jan 9-11 2026 edition past, no next date |
| Showerhacks | San Francisco | 2026-09-26 | 2026-09-15 | script | automated: page shows "september 26" and no decoy date |
| SHPE National Convention | Indianapolis | 2026-10-28 | 2026-09-15 | script | automated: page shows "october 28" and no decoy date |
| SIGGRAPH | Los Angeles | — | 2026-08-26 | orchestrator | s2026.siggraph.org confirms 19-23 July 2026 at LA Convention Center; 2027 city unpublished |
| Silicon Couloir Chance Meetings | Jackson | — | 2026-08-26 | passC | siliconcouloir.com/chance-meetings live, Teton/Jackson WY networking event on 'the first Monday of most months, 5-7pm' - recurring, no dates on the page |
| Silicon Couloir Pitch Day | Jackson | 2026-09-24 | 2026-09-15 | script | automated: page shows "september 24" and no decoy date |
| Silicon Prairie Startup Week | Omaha | — | 2026-08-26 | passC | siliconprairienews.com event page live, Nebraska (Lincoln and Omaha); the URL is the 2025 edition, Oct 6-11 2025, past - no 2026 page or date |
| Silicon Slopes Summit | Salt Lake City | — | 2026-08-26 | passC | siliconslopes.com resolves and serves the Silicon Slopes page (JS-only body, 'For Utahns, By Utahns'); no summit date readable |
| Slate Summit | Nashville | — | 2026-08-26 | passC | technolutions.com/slatesummit2026 live, Music City Center Nashville TN; June 24-26 2026 edition past, no next date |
| Small Satellite Conference | Salt Lake City | 2027-08-15 | 2026-09-15 | script | automated: page shows "august 15" and no decoy date |
| Snowflake Summit | San Francisco | 2027-06-07 | 2026-09-15 | script | automated: page shows "june 7" and no decoy date |
| South Dallas Maker Faire | Dallas | 2026-11-07 | 2026-09-15 | script | automated: page shows "november 7, 2026" and no decoy date |
| Southeast Cybersecurity Summit | Birmingham | — | 2026-08-26 | passC | secybersecurity.com live, Birmingham Jefferson Convention Complex; April 15-16 2026 edition past, no next date |
| SouthEast LinuxFest | Charlotte | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Space and Missile Defense Symposium | Huntsville | 2027-08-10 | 2026-09-15 | script | automated: page shows "august 10" and no decoy date |
| Space Symposium | Colorado Springs | 2027-04-12 | 2026-09-15 | script | automated: page shows "april 12" and no decoy date |
| SpartaHack | East Lansing | 2027-02-06 | 2026-09-15 | script | automated: page shows "feb 6" and no decoy date |
| Speed Venture Summit | Concord | 2026-10-13 | 2026-09-15 | script | automated: page shows "october 13" and no decoy date |
| Splunk .conf | Denver | 2026-09-14 | 2026-09-10 | pass2 | conf.splunk.com (.conf26) shows 'September 14-17, 2026, Colorado Convention Center, Denver, CO'. Matches record. |
| STAREAST | Orlando | 2027-04-25 | 2026-09-15 | script | automated: page shows "april 25" and no decoy date |
| Startup Grind Global Conference | Redwood City | 2027-04-27 | 2026-09-15 | script | automated: page shows "april 27" and no decoy date |
| Startup Sioux Falls Founders Meetup | Sioux Falls | — | 2026-08-26 | passC | startupsiouxfalls.com/events live with 42 events listed, Founders Meetup held Aug 19 2026, Sioux Falls SD - recurring, no single next date |
| Startup Weekend Omaha | Omaha | — | 2026-08-26 | passC | techstars.com/communities/startup-weekend live and describes the three-day format, but lists no Omaha event or date - generic programme page, link quality flagged |
| Startup302 | Wilmington | — | 2026-08-26 | passC | startup302.org live, Delaware funding competition; 'Stay Tuned for 2026 Info' with no dates, latest winners listed 2024 |
| StartupBREW Fargo | Fargo | — | 2026-08-26 | passC | emergingprairie.com/startupbrew-fargo live, weekly Wednesday 8:00-9:30am networking at 118 Broadway N, Fargo ND - recurring, no fixed dates |
| StartupCincy Week | Cincinnati | 2026-10-05 | 2026-09-15 | script | automated: page shows "october 5" and no decoy date |
| Startupfest | Montreal | 2027-07-07 | 2026-09-15 | script | automated: page shows "july 7" and no decoy date |
| Step San Francisco | San Francisco | — | 2026-09-10 | c2 | stepsf.com 200, title 'Step San Francisco 2026 / Startup & Tech Conference', Event JSON-LD startDate 2026-08-26T09:00:00-07:00 / endDate 2026-08-27T18:00:00-07:00 - matches stored last_date 2026-08-26. No 2027 edition advertised on the page; next_date correctly empty. |
| Stir Trek | Columbus | — | 2026-08-26 | passC | stirtrek.com live, AMC Easton 30 Columbus OH; May 1 2026 edition past, no next date |
| STL TechWeek | St. Louis | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Stripe Sessions | San Francisco | 2027-04-28 | 2026-09-15 | script | automated: page still shows "april 28" |
| Summerfest Tech | Milwaukee | — | 2026-08-26 | passC | summerfest-tech.com live, 639 E. Summerfest Place Milwaukee WI, 2026 agenda/speakers pages present but no dates published |
| SXSW | Austin | 2027-03-15 | 2026-09-15 | script | automated: page shows "march 15" and no decoy date |
| SXSW EDU | Austin | 2027-03-13 | 2026-09-15 | script | automated: page shows "march 13" and no decoy date |
| TAG Chairs' Gala | Atlanta | 2026-11-19 | 2026-09-15 | script | automated: page shows "november 19" and no decoy date |
| TailscaleUp | San Francisco | — | 2026-09-10 | c2 | tailscale.com/events 200: 'Special Event Conference SFJazz, San Francisco, CA / August 26, 2026 / 8:00 AM PDT - TailscaleUp'; a separate Aug 25 'Day 0 Community Day' precedes it. tailscale.com/tailscaleup is titled 'TailscaleUp 2026 / The Tailscale User Conference' with date August 26, 2026. Matches stored last_date 2026-08-26; the SFJazz venue confirms San Francisco. No 2027 edition posted. |
| Tampa Bay Tech Community Events | Tampa | — | 2026-08-26 | passC | tampa.dev live, Tampa Bay tech events aggregator, actively listing events through early September 2026 |
| Tampa Bay Wave BlueTech|X Pitch Night | Tampa | 2026-09-17 | 2026-09-15 | script | automated: page shows "september 17, 2026" and no decoy date |
| Tech For Good Conference | Chicago | — | 2026-08-26 | passC | techforgoodconference.org live, University of Chicago; Feb 27-28 2026 edition past, no next date |
| Tech Fuse Des Moines | Des Moines | 2026-10-15 | 2026-09-15 | script | automated: page shows "oct 15" and no decoy date |
| Tech Homecoming | Ann Arbor | 2026-09-22 | 2026-09-15 | script | automated: page shows "september 22, 2026" and no decoy date |
| tech SAVannah Tech Tuesday | Savannah | 2026-10-13 | 2026-09-15 | script | automated: page shows "oct 13" and no decoy date |
| Tech Thursday Winnipeg | Winnipeg | — | 2026-08-26 | passC | eventbrite collection live and active for Winnipeg Tech Thursday (events listed through Aug 2026) - recurring, no single next date |
| Tech Titans Awards Gala | Plano | — | 2026-09-10 | c2 | techtitans.org/awards/ 200, title 'Tech Titans Awards', headline 'Tech Titans Awards Friday, August 28, 2026'; the homepage adds 'Fourteen individuals and companies were honored with Tech Titans Awards on August 28 in front of more than 500 guests.' Matches stored last_date 2026-08-28. No 2027 gala date published. City Plano retained, and it is not an HQ artifact: Tech Titans' own listed address is Richardson, TX (2100 N. Greenville Ave), a different city from the record. |
| Tech Tomorrow | Columbus | — | 2026-09-10 | c2 | techtomorrow.events 200; the page title carries the date itself: 'HOME - Tech Tomorrow 2026 / Wednesday, September 9 / Columbus OH', and the body repeats 'September 9, 2026'. Matches stored last_date 2026-09-09 (ran the day before this check). No 2027 date announced; next_date correctly empty. |
| Tech Week Boston | Boston | — | 2026-08-26 | passC | tech-week.com/calendar/boston live, Boston; May 26-31 2026 edition past, no next date |
| Tech Week New York | New York | — | 2026-08-26 | passC | tech-week.com/calendar loads (Tech Week 2026) but currently lists only SF Oct 5-11 and LA Oct 12-18, no New York edition, and tech-week.com/calendar/new-york 404s - link quality flagged, no date |
| TechChicago Week | Chicago | 2027-07-19 | 2026-09-15 | script | automated: page shows "july 19" and no decoy date |
| TechCon 365 / DataCon / PWRCon Seattle | Seattle | — | 2026-08-26 | passA | techcon365.com home page: 'Seattle, Washington ... August 24-28, 2026, Seattle Convention Center' — matches record (fetched via curl; WebFetch got 403) |
| TechCon 365 Dallas | Dallas | 2026-11-02 | 2026-09-15 | script | automated: page shows "november 2" and no decoy date |
| TechCon SoCal | San Diego | — | 2026-08-26 | passC | startupsd.org TechCon SoCal 2026 page live, San Diego, May 21-22 2026 marked 'This event has passed'; no next date |
| TechConnect WV Women in Tech Conference | South Charleston | — | 2026-08-26 | passC | techconnectwv.org/programs live, 1740 Union Carbide Drive, South Charleston WV; lists 'Women and Tech Conference (coming spring 2026)' with no exact date |
| TechFest Louisville | Louisville | — | 2026-08-26 | passC | techfestlou.com live, Louisville KY; Aug 20-21 2026 edition just past (sold out), no next date |
| Techlahoma Community Meetups | Oklahoma City | — | 2026-08-26 | passC | meetup.com/oklahoma-city-techlahoma loads, Oklahoma City OK, 1,363 members, upcoming events incl. ThunderPlains Oct 21 2026 - active recurring series |
| TechMentor & Cybersecurity Live! @ Microsoft HQ | Redmond | 2027-08-09 | 2026-09-15 | script | automated: page shows "august 9, 2027" and no decoy date |
| techNL Industry Awards | St. John's | — | 2026-08-26 | passC | technl.ca/news-events live, St. John's NL; techNL Industry Awards 2026 held April 17 2026 (past), no next date |
| techNL Innovation Week | St. John's | — | 2026-08-26 | passC | technl.ca live and current (2026 news), carries an 'Innovation Week 2026' section in navigation; no dates published |
| Techqueria | Multiple cities | — | 2026-08-26 | unblockB | techqueria.org loads (HTTP 200), title 'Hola! - Techqueria'. Correct organiser for the Latine-in-tech community, with a chapters index and an 'Events / Techqueria Summit 2026' nav entry covering in-person events across the US. Correct link for a multi-city meetup-series record; no single date applies. |
| TECHSPO Boston | Boston | — | 2026-08-26 | passC | techspoboston.com live, Hyatt Regency Boston; May 12-13 2026 edition past, no next date. Note: injected casino-spam links in the page footer |
| TECHSPO New York | New York | 2027-04-22 | 2026-09-15 | script | automated: page shows "april 22" and no decoy date |
| TECHSPO Phoenix | Phoenix | — | 2026-08-26 | passC | techspophoenix.com live, Hyatt Regency Phoenix, 122 N 2nd St; June 11-12 2026 edition past, no next date |
| TECHSPO Toronto | Toronto | — | 2026-08-26 | passC | techspotoronto.ca live, Marriott Downtown at CF Toronto Eaton Centre; April 15-16 2026 edition past, no next date. Note: heavy injected casino/pharma spam in the page footer |
| TECHSPO Vancouver | Vancouver | — | 2026-08-26 | passC | techspovancouver.ca live, Paradox Hotel Vancouver BC; April 20-21 2026 edition past, no next date. Note: injected casino spam (Hungarian-language links) in the footer |
| Techstars Startup Weekend | Multiple cities | — | 2026-08-26 | passC | techstars.com/communities/startup-weekend live, describes the three-day format and 'hundreds of events all over the world' with 2026 blog posts; no dates or city list on the page |
| Techstars Startup Weekend Anchorage | Anchorage | — | 2026-08-26 | passC | techstars.com/communities/startup-weekend live but is the generic global programme page - no Anchorage event or date listed; link quality flagged |
| Techstars Startup Weekend London Ontario | London | — | 2026-08-26 | unblockB | techalliance.ca page loads (HTTP 200), titled 'Techstars Startup Weekend London Ontario / TechAlliance of Southwestern Ontario'; its meta description reads 'TechAlliance is bringing Techstars Startup Weekend to London, Ontario for the first time. Build, pitch and launch your startup idea in 54 hours.' The 2026 edition already ran - TechAlliance's news post dated June 3, 2026 is titled 'London's Techstars Startup Weekend 2026 fuels next wave of founders in a 54-hour sprint'. No next date published. Right event, right city. |
| Techstars Startup Weekend Reno | Reno | — | 2026-08-26 | passC | techstars.com/communities/startup-weekend live but is the generic global programme page - no Reno event or date listed; link quality flagged |
| TennoCon | London | 2027-07-16 | 2026-09-15 | script | automated: page shows "july 16" and no decoy date |
| TENWEST Festival | Tucson | 2027-03-30 | 2026-09-15 | script | automated: page shows "march 30" and no decoy date |
| Texas Dreamin' | Austin | — | 2026-08-26 | passC | texasdreamin.org live, AT&T Executive Conference Center Austin TX; July 9-10 2026 edition past, no next date |
| Texas Linux Fest | Austin | 2026-11-06 | 2026-09-15 | script | automated: page shows "nov 6" and no decoy date |
| The AI Summit New York | New York | 2026-12-09 | 2026-09-15 | script | automated: page shows "december 9" and no decoy date |
| The Big DiF | Hamilton | — | 2026-08-26 | passC | innovationfactory.ca live, Hamilton ON; 'The Big DiF' 16th annual open house held May 14 2026 (past), no next date |
| The Carpentries Workshops | Multiple cities | — | 2026-08-26 | passC | carpentries.org/workshops live (c 2026) and describes the workshop programme; individual workshop listings sit behind a further link, no dates on this page |
| The Idea Village Demo Day | New Orleans | — | 2026-08-26 | passC | ideavillage.org live, New Orleans LA, carries a 'Demo Day 2026' section; no dates published |
| The Montgomery Summit | Santa Monica | 2027-03-09 | 2026-09-15 | script | automated: page shows "march 9" and no decoy date |
| The Newark Summit | Newark | — | 2026-08-26 | unblockB | thenewarksummit.com redirects to /2026/ and loads (HTTP 200), titled 'The Newark Summit'. Copy reads 'See Who Attended Our 3rd Annual Gathering on Feb 9, 2026' and invites people to 'Join Our 4th' annual gathering; the site is actively maintained (news items dated Aug 25, 2026) and the contact block gives a Newark NJ 07102 address. Right event, right city. No 4th-edition date published yet. |
| ThunderPlains | Oklahoma City | 2026-10-21 | 2026-09-15 | script | automated: page shows "october 21, 2026" and no decoy date |
| TOJam | Toronto | — | 2026-08-26 | passC | tojam.ca live, free 3-day game jam in Toronto; May 8-10 2026 edition past and the jam-dates block gives only 'May 2027' with no exact days |
| Toronto Game Expo | Toronto | 2026-11-07 | 2026-09-15 | script | automated: page shows "november 7" and no decoy date |
| Toronto Games Week | Toronto | — | 2026-08-26 | passC | torontogamesweek.com live, Toronto; 4th edition concluded ('Thanks for another incredible Toronto Games Week! Stay tuned for next year'), no dates |
| Toronto JavaScript | Toronto | — | 2026-08-26 | passC | meetup.com/torontojs loads, Toronto ON, 13,001 members with recurring monthly TechTalks - active series, no single next date |
| Toronto Tech Week | Toronto | — | 2026-08-26 | passC | torontotechweek.com live, Toronto; TTW 2026 concluded (post-event recap, 'See you in 2027'), no dates for 2027 |
| TransportationCamp DC | Washington | 2027-01-09 | 2026-09-15 | script | automated: page shows "january 9, 2027" and no decoy date |
| TransportationCamp New England | Cambridge | 2026-10-17 | 2026-09-15 | script | automated: page shows "october 17, 2026" and no decoy date |
| TransportationCamp PHL | Philadelphia | — | 2026-08-26 | passC | transportationcamp.org/events/phl2026 live, Philadelphia unconference; March 21 2026 edition past, no next date |
| TreeHacks | Stanford | — | 2026-08-26 | passC | treehacks.com live, Stanford University; Feb 13-15 2026 edition past, no next date |
| Triangle InfoSeCon | Raleigh | 2026-10-30 | 2026-09-15 | script | automated: page shows "october 30, 2026" and no decoy date |
| Tulsa Tech Week | Tulsa | 2026-09-21 | 2026-09-15 | script | automated: page shows "september 21" and no decoy date |
| Twilio SIGNAL | San Francisco | 2027-04-13 | 2026-09-15 | script | automated: page shows "april 13" and no decoy date |
| Twin Cities Software Symposium | Minneapolis | — | 2026-08-26 | passC | nofluffjuststuff.com/minneapolis live, Minneapolis MN; June 4-5 2026 edition past, no next date |
| UC Berkeley AI Hackathon | Berkeley | — | 2026-08-26 | passC | live.hackberkeley.org live, MLK Student Union, Berkeley CA; June 20-21 2026 edition past, no next date |
| UIUCTF | Urbana-Champaign | — | 2026-08-26 | passC | uiuc.tf live, run by SIGPwny at University of Illinois Urbana-Champaign; 2026 quest began 2026-08-08 for 48h (past), no next date |
| UNBOUND (formerly INBOUND) | Boston | 2026-09-16 | 2026-09-15 | script | automated: page shows "september 16" and no decoy date |
| Uniting the Prairies | Saskatoon | 2027-04-28 | 2026-09-15 | script | automated: page shows "april 28" and no decoy date |
| University of Idaho Engineering Design EXPO | Moscow | 2027-04-29 | 2026-09-15 | script | automated: page shows "april 29" and no decoy date |
| Upper Bound | Edmonton | 2027-05-18 | 2026-09-15 | script | automated: page shows "may 18" and no decoy date |
| Urban Futures: Co-Creating Climate Resilience in NYC Hackathon | New York | — | 2026-08-26 | unblockB | amnh.org page loads (HTTP 200), title 'Hackathon 2026 NYC - Urban Futures: Climate Resilience / AMNH'. The January 15-17, 2026 edition is past and the page now states '2027 hackathon dates, and the link to apply will be posted later this year. Dates: To be announced.' Location given as 'American Museum of Natural History, New York'. Right event, right city, no date yet. |
| Utah Tech Calendar Community Meetups | Salt Lake City | — | 2026-08-26 | passC | utahtechcalendar.com live, 'updated nightly' calendar of in-person Utah tech events across Salt Lake City/Provo/Lehi/Ogden, listings into 2027 |
| UtahJS Conference | Sandy | 2026-09-18 | 2026-09-15 | script | automated: page shows "sep. 18, 2026" and no decoy date |
| Vancouver Game Garden | Vancouver | — | 2026-08-26 | passC | vangamegarden.com live, free indie games showcase in Vancouver BC; June 13-14 2026 edition past, no next date |
| Vancouver Microsoft 365 Summit | Vancouver | — | 2026-09-10 | c2 | vancouver365summit.com 200, title 'Vancouver Microsoft 365 Summit 2026', Event JSON-LD startDate 2026-09-03T08:00:00-07:00 / endDate 2026-09-03T17:00:00-07:00 for the main conference day; in-script 'Sept 2-4, 2026' covers the workshop bookends. Stored last_date 2026-09-03 matches the conference day. No 2027 edition posted. |
| Vancouver Startup Week | Vancouver | — | 2026-08-26 | passC | vanstartupweek.ca live, Vancouver BC; VSW 2026 ran May 20-23 2026 (thank-you page up), no next date |
| VCF Swap Meet | Wall | 2026-10-17 | 2026-09-15 | script | automated: page shows "oct. 17, 2026" and no decoy date |
| Venture Atlanta | Atlanta | 2026-10-14 | 2026-09-15 | script | automated: page shows "october 14" and no decoy date |
| Venture Dallas | Dallas | 2026-10-22 | 2026-09-15 | script | automated: page shows "october 22, 2026" and no decoy date |
| Vermont Tech Jam | Burlington | 2026-10-24 | 2026-09-15 | script | automated: page shows "october 24, 2026" and no decoy date |
| Veteran Innovation Hackathon | Mountain View | — | 2026-09-10 | c2 | meetup.com/hackerdojo/events/316024672 200, title 'Veteran Innovation Hackathon, Fri, Aug 28, 2026, 6:30 PM', Event JSON-LD startDate 2026-08-28T18:30:00-07:00 / endDate 2026-08-30T13:00:00-07:00, hosted by Hacker Dojo in Mountain View. Matches stored last_date 2026-08-28. This is a single dated Meetup listing with no successor event posted, so next_date is correctly empty. |
| VIATEC AI Meetup | Victoria | — | 2026-09-10 | pass1 | members.viatec.ca/event-calendar (window 9/10/2026-9/10/2027) lists 'THU September 10 - VIATEC AI Meetup: Business Track, 11:30 AM - 1:30 PM - Leading AI from the Front, with Rachel Krayenhoff of Ingenuity Labs'. Confirms 2026-09-10 and Victoria BC. |
| VIATEC Awards | Victoria | — | 2026-08-26 | passC | members.viatec.ca event page live, Victoria BC; the 2026 VIATEC Awards were April 1 2026 (past), no next date |
| Vibe Coding Con | Las Vegas | 2026-10-27 | 2026-09-15 | script | automated: page shows "october 27" and no decoy date |
| Video Game Live Expo (VGLX) | Mississauga | 2026-10-24 | 2026-09-15 | script | automated: page shows "october 24" and no decoy date |
| Vintage Computer Festival East | Wall | — | 2026-08-26 | passC | vcfed.org VCF East page live, InfoAge Science and History Museums, 2201 Marconi Road, Wall NJ; April 17-19 2026 edition past, no next date |
| Vintage Computer Festival Midwest | Schaumburg | — | 2026-09-10 | pass2 | vcfmw.org shows 'September 12-13, 2026' at the Convention Center in Schaumburg, IL. Matches record. |
| Vintage Computer Festival Southeast | Atlanta | — | 2026-08-26 | passC | vcfed.org VCF Southeast page live, Marriott Renaissance Waverly, 2450 Galleria Pkwy, Atlanta GA; July 31-Aug 2 2026 edition past, no next date |
| Vintage Computer Festival Southwest | Irving | 2027-06-25 | 2026-09-15 | script | automated: page shows "june 25" and no decoy date |
| Vintage Computer Festival West | Mountain View | — | 2026-08-26 | passC | vcfed.org VCF West page live, Computer History Museum, Mountain View CA; Aug 1-2 2026 edition just past, no next date |
| VMware Explore | Las Vegas | — | 2026-08-26 | passC | vmware.com/explore resolves and serves the VMware Explore page (JS-only body); no date readable |
| VSLive! @ Microsoft HQ | Redmond | 2027-08-02 | 2026-09-15 | script | automated: page shows "august 2, 2027" and no decoy date |
| VSLive! San Diego | San Diego | 2026-09-14 | 2026-09-10 | pass2 | vslive.com upcoming conferences: 'VSLive! San Diego, September 14-18, 2026, Bahia Resort Hotel, San Diego, CA'. Matches record. |
| VTHacks | Blacksburg | 2026-09-18 | 2026-09-15 | script | automated: page shows "sep 18" and no decoy date |
| Web Summit Vancouver | Vancouver | 2027-05-25 | 2026-09-15 | script | automated: page shows "may 25" and no decoy date |
| WEtech Alliance Community Events | Windsor | — | 2026-08-26 | passC | wetech-alliance.com/events live, Windsor ON (and Chatham-Kent), 12 upcoming events listed through September 2026 - active recurring series |
| WiCyS Conference | National Harbor | — | 2026-08-26 | passC | wicys.org live and current (Virtual 2026, RSAC 2026, Career Fair 2026); WiCyS 2027 referenced with neither city nor dates announced |
| WildHacks | Evanston | — | 2026-08-26 | passC | wildhacks.net resolves and serves 'WildHacks 2026' with an MLH 2026 season badge (JS-rendered body); no date readable |
| Women in Tech WNY | Buffalo | — | 2026-08-26 | passC | info.techbuffalo.org/witwny live, Buffalo/Western New York; Thursday March 26 2026 edition past, no next date |
| WomenHack | Multiple cities | — | 2026-08-26 | passC | womenhack.com live (c 2026), lists recruiting events across San Francisco, New York, Toronto, Edmonton and other cities; event dates shown without years |
| WordCamp Canada | Vancouver | 2026-11-05 | 2026-09-15 | script | automated: page shows "november 5" and no decoy date |
| WordCamp New York City | New York | — | 2026-08-26 | passC | nyc.wordcamp.org/2026 live, says 'WordCamp New York City 2026 is in the early planning stages' - no venue or dates yet |
| WordCamp Santa Clarita | Santa Clarita | — | 2026-08-26 | passC | santaclarita.wordcamp.org/2027 live, Santa Clarita CA; notice says the event has been postponed to Spring 2027 with no dates set |
| Workplace Ninjas US | Scottsdale | 2027-01-11 | 2026-09-15 | script | automated: page shows "jan 11" and no decoy date |
| WTM Montreal | Montreal | — | 2026-08-26 | passC | wtmmontreal.com live, Women Techmakers Montreal (non-profit since 2015); WTM Day April 18 2026 past, no next date |
| XP Game Connect Atlantic | Halifax | — | 2026-08-26 | passC | xpgaming.biz page live, one-day B2B games event for Atlantic Canada, Halifax venues (Old Triangle, Pacifico); June 4-5 2026 edition past, no next date |
| XP Game Summit | Toronto | 2027-06-10 | 2026-09-15 | script | automated: page shows "june 10" and no decoy date |
| Y Combinator Demo Day | San Francisco | — | 2026-09-10 | pass1 | ycombinator.com/demoday states 'The S26 Demo Day will be held on Thursday, September 10th.' Sep 10 2026 is a Thursday. Confirms the record's 2026-09-10. |
| Yale Healthcare Hackathon | New Haven | — | 2026-08-26 | passC | ventures.yale.edu page live, Yale Ventures, 101 College Street, New Haven CT; '2026 Healthcare Hackathon' registration link but no dates |
| YHack | New Haven | — | 2026-08-26 | unblockB | yhack.org loads (HTTP 200), title 'YHack - Spring 2026', describing 'Yale's flagship hackathon, bringing together 600+ college builders for 24 hours of weekend hacking'. The March 28-29, 2026 edition is past and the page now says 'View projects and subscribe for YHack 2027 updates!' - alive, but no 2027 date published. Right event, right city (Yale, New Haven). |
| YQuantum | New Haven | — | 2026-08-26 | passC | yquantum.dev live, Yale Undergraduate Quantum Computing / Yale Quantum Institute, New Haven CT; April 4-5 2026 edition past, no next date |
| YYC DataCon | Calgary | — | 2026-09-10 | pass1 | yycdata.ca/datacon redirects to /datacon/datacon-2026, titled 'DataCon 2026', repeating 'BMO CENTRE, CALGARY SEPTEMBER 11, 2026' across the hero and ticket callouts. Single-day 2026-09-11 in Calgary AB as recorded. |
| Zeek Workshop Berkeley | Berkeley | — | 2026-09-10 | pass1 | zeek.org site-wide banner reads 'Zeek Workshop - Berkeley - September 10-11, 2026 - Register', and the Events nav carries an 'Upcoming Berkeley Workshop' entry. Dates and city correct. |
