# Verification ledger

**Read this before verifying anything.** It records which events have already been
checked against the organiser's own page, so a pass can spend its budget on what is
still unknown rather than re-confirming what is settled.

Updated 2026-08-26 · dataset holds 894 events.

| status | count | share | meaning |
|---|---:|---:|---|
| `confirmed` | 359 | 40.2% | checked against the organiser's page, correct as recorded — **skip these** |
| `corrected` | 82 | 9.2% | checked, found wrong, patched — **skip these** |
| `blocked` | 32 | 3.6% | attempted, page unreadable by fetch — **needs a web search or a human with a browser** |
| _unchecked_ | 421 | 47.1% | never attempted — **verify these first** |

`data/review/TO-VERIFY.tsv` is the working list: everything unchecked or blocked,
dated events first and soonest first, because a wrong date on an imminent event is
the costliest error the dataset can carry.

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

## Ledger rows with no matching event (19)

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
- **Day of Data Detroit** — Detroit (confirmed, 3r2a): verified against organiser page (near-term date sweep)
- **Digital Okanagan** — Kelowna (confirmed, 3r2a): verified against organiser page (near-term date sweep)
- **DVCon U.S.** — San Jose (corrected, passB): dvcon.org: 'March 1 - 4, 2027 | Santa Clara, CA, United States' at the Hyatt Regency Santa Clara. Dates match; the city was recorded as San Jose and is patched to Santa Clara

## blocked (32)

Attempted and unreadable by fetch. These are where a web search actually earns its cost.

| event | city | next date | checked | cycle | evidence |
|---|---|---|---|---|---|
| AI Con USA | Seattle | 2027-06-06 | 2026-08-26 | passB | aiconusa.techwell.com returns HTTP 403 to fetch; techwell.com and techwell.com/conferences also 403. No readable page settles 2027-06-06..11 |
| AI Product Summit Silicon Valley | San Jose | 2027-04-15 | 2026-08-26 | passB | world.productledalliance.com main calendar lists no 'AI Product Summit' in San Jose; the nearest entry is a 'Chief Product Officer Summit' San Jose on 'Apr 14, 2027' while the record says 2027-04-15. /location/san-jose and /events both return 404. Cannot settle whether the recorded event exists under this name |
| Best of Tech Awards | Cleveland | 2026-09-14 | 2026-08-26 | 3r2a | 403 or JS-only; no organiser path worked |
| BigRed//Hacks | Ithaca | 2026-10-02 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| CodeRED | Houston | 2026-10-10 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| CypherCon | Milwaukee | 2027-03-24 | 2026-08-26 | passB | cyphercon.com returns an empty body via fetch on /, /schedule/ and /2027/ (JS-only site); no readable page states 2027 dates |
| dev2next | Lone Tree | 2026-10-12 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| Elevate Festival | Toronto | 2026-09-22 | 2026-08-26 | 3r2a | 403 or JS-only; no organiser path worked |
| Gartner Identity & Access Management Summit | Las Vegas | 2026-12-07 | 2026-08-26 | passB | gartner.com returns HTTP 403 to fetch on the summit landing page, /agenda, /why-attend, /register and on the conference calendar. No readable page |
| Google I/O | Mountain View | — | 2026-08-26 | 3r1 | no reachable page publishing future dates |
| Hack Knight | Flushing | 2026-10-09 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| HackHarvard | Cambridge | 2026-10-16 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| HackMIT | Cambridge | 2026-09-19 | 2026-08-26 | 3r2a | 403 or JS-only; no organiser path worked |
| HackNC | Chapel Hill | 2026-10-09 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| HackTX | Austin | 2026-10-24 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| Knight Hacks | Orlando | 2026-10-09 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| LA Hacks AI Hackathon | Los Angeles | 2026-10-17 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| Lesbians Who Tech + Allies Summit | New York | 2026-10-05 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| Manufacturing Day at WSU Tech | Wichita | 2026-10-02 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| MHacks | Ann Arbor | 2026-10-03 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| Microsoft Ignite | San Francisco | 2026-11-17 | 2026-08-26 | passB | ignite.microsoft.com renders an empty body via fetch (JS-only shell); /en-US/home, /en-US/, /en-US/sessions and news.microsoft.com/ignite-2026 are empty or 404. No readable page states dates or city |
| Midwest Gaming Classic | Milwaukee | 2027-04-23 | 2026-08-26 | passB | midwestgamingclassic.com returns HTTP 403 to fetch on both / and /info/; the Wisconsin State Fair expo-center calendar returned an empty body. No readable page settles 2027-04-23..25 |
| NetSuite SuiteWorld | Las Vegas | 2026-10-25 | 2026-08-26 | 3r1 | no reachable page publishing future dates |
| Propelify Innovation Festival | Hoboken | — | 2026-08-26 | 3r1 | no reachable page publishing future dates |
| Rowdy Hacks | San Antonio | 2026-10-03 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| SAP Connect | Las Vegas | 2026-10-05 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| SBUHacks | Stony Brook | 2026-10-09 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| Silicon Slopes Summit | Salt Lake City | — | 2026-08-26 | 3r1 | no reachable page publishing future dates |
| STAREAST | Orlando | 2027-04-25 | 2026-08-26 | passB | stareast.techwell.com returns HTTP 403 to fetch on / and /program/schedule; techwell.com and techwell.com/conferences also 403. No readable page |
| StartupCincy Week | Cincinnati | 2026-10-05 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| SwampHacks | Gainesville | 2026-10-16 | 2026-08-26 | 3r2b | 403 or JS-only; date rendered only in a hero graphic |
| Zeek Workshop Berkeley | Berkeley | 2026-09-10 | 2026-08-26 | 3r2a | 403 or JS-only; no organiser path worked |

## corrected (82)

Checked and patched.

| event | city | next date | checked | cycle | evidence |
|---|---|---|---|---|---|
| AI Infra Summit | Santa Clara | 2026-09-15 | 2026-08-26 | cycle4-links | aiinfrasummit.com redirects to the new domain ai-infra-summit.com, verified as AI Infra Summit 2026, Santa Clara Convention Center, September 15-17 2026 - matches the record's next |
| Atlantic Technology Summit | Halifax | 2026-11-18 | 2026-08-26 | orchestrator | cips.ca names no such event; record removed as unverifiable and mis-linked. |
| Berkeley SkyDeck Demo Day | Berkeley | — | 2026-08-26 | r2-redirects | skydeck.berkeley.edu/demo-day/ redirects to demo-day-fall-2020, an article dated 04 February 2020 |
| Black Hat USA | Las Vegas | 2027-07-31 | 2026-08-26 | cycle3-accuracy | blackhat.com/us-27 (read through a text-extraction proxy; blackhat.com 403s bots) publishes Black Hat USA 2027 as 'July 31-August 5, 2027'. The blackhat.com event list carries the  |
| BSides Bloomington | Bloomington | 2026-10-02 | 2026-08-26 | cycle1-links | Own site bsidesbloomington.org verified live, 2026 edition at the Bloomington Convention Center; replaces the generic allbsides.com directory link. |
| BSides Calgary | Calgary | — | 2026-08-26 | cycle1-links | Bare bsidescalgary.org does not resolve; www host loads and shows BSides Calgary 2026 at Contemporary Calgary, May 25-26 2026. |
| BSides CMH | Columbus | 2026-11-04 | 2026-08-26 | cycle1-links | Own site bsidescolumbus.com verified live: Nov 4-6 2026 with sessions Nov 5-6, presented by GuidePoint Security; replaces the generic allbsides.com link. |
| BSides Harrisburg | Harrisburg | 2027-05-21 | 2026-08-26 | cycle1-links | Bare bsideshbg.com dead; www host live and announces BSidesHBG 2027 on May 21 2027 at the PA Farm Show Complex. |
| BSides Ottawa | Ottawa | 2026-11-19 | 2026-08-26 | passB | bsidesottawa.ca (via www redirect): 'Join us November 19-20 for two days of talks, villages...' at Ottawa Conference and Event Centre, 200 Coventry Road, Ottawa ON. Record had a single-day 11-19 event; end date patched to 2026-11-20 |
| BSides PDX | Portland | 2026-10-23 | 2026-08-26 | cycle3r2-b | bsidespdx.org states verbatim 'BSidesPDX 2026 will be on Fri Oct 23rd & Sat Oct 24th, 2026' - a two-day event. Start date 2026-10-23 is correct but the record ends it the same day. |
| BSides Peoria | Peoria | 2026-10-24 | 2026-08-26 | cycle1-links | Own site bsidespeoria.com verified live: Oct 24 2026 at Bradley University, Peoria IL; replaces the generic allbsides.com link. |
| BSides San Diego | San Diego | — | 2026-08-26 | cycle1-links | Bare bsidessd.org does not resolve; www host loads and is the official BSides San Diego site with 2026 event details. |
| BSides Vancouver | Vancouver | — | 2026-08-26 | cycle1-links | Bare bsidesvancouver.com does not resolve; www host loads, run by Mainland Advanced Research Society, 2026 edition held at SFU Harbour Centre. |
| BSidesOK | Glenpool | — | 2026-08-26 | cycle1-links | bsidesok.com content confirms the 2026 event ran Apr 8-10 2026 at the Glenpool Conference Center; corrected the start date from 2026-04-06. |
| C2 Montreal | Montreal | — | 2026-08-26 | cycle3-accuracy | c2montreal.com states 'In 2026, C2 Montreal will be taking a pause from its annual May gathering' while a new format is explored, and lists no future dates. Not discontinued, so ke |
| Central Iowa Software Symposium | Des Moines | 2026-09-17 | 2026-08-26 | cycle1-links | NFJS tour listing gives the stop path as /desmoines (not /des-moines); page confirms Sept 17-18 2026 at the West Des Moines Marriott. |
| Columbus Startup Week | Columbus | — | 2026-08-26 | cycle4-links | sprkwrks.com redirects to sparkworksinnovation.com (org homepage, not the event). SparkWorks Innovation runs the event; its current event page verified by WebFetch as 'Columbus Sta |
| Data Streaming Summit | San Francisco | 2026-10-07 | 2026-08-26 | cycle1-links | datastreamingsummit.io has no DNS record and no archive history; the real official site is datastreaming-summit.org. 2026 edition Oct 7-8 at Hotel Nikko SF; the 2025 edition was Se |
| Day of Data Detroit | Ann Arbor | 2026-09-12 | 2026-08-26 | cycle3r2-a | sqlsaturday.com/2026-09-12-sqlsaturday1164/ redirects to dayofdata.org/2026-09-12-dayofdata1164/, which gives the venue as Ann Arbor District Library - Downtown, 343 South Fifth Av |
| DEF CON | Las Vegas | 2027-08-05 | 2026-08-26 | cycle3-accuracy | defcon.org states DEF CON 34 concluded Aug 6-9 2026 at LVCC West Hall and that DEF CON 35 is scheduled for August 5-8, 2027 in Las Vegas at LVCC West Hall. Dataset had next_date em |
| DevOpsDays Boston | Boston | 2026-10-19 | 2026-08-26 | cycle1-links | Confirmed on devopsdays.org/events/2026-boston/welcome/: Oct 19-20 2026 at the Microsoft NERD Center in Cambridge MA. Merged the last_date carried by the removed Cambridge duplicat |
| Diamondhacks | La Jolla | 2027-04-03 | 2026-08-26 | passB | diamondhacks.acmucsd.com: 'April 3-4, 2027 Hosted by ACM at UC San Diego' (CSE Buildings and Jacobs Hall). The record had 2027-04-04..04-05, so both dates are patched one day earlier |
| Digital Okanagan | Vernon | 2026-09-24 | 2026-08-26 | cycle3r2-a | meetup.com/digitalokanagan/ shows the 2026-09-24 'Geek Beers hangout at the Kal' at The Kal, 3004 30th Ave, Vernon, BC (as is the preceding 2026-08-27 meetup). Date confirmed; venu |
| DrupalCamp Colorado | Denver | 2026-08-26 | 2026-08-26 | cycle1-links | drupalcampcolorado.org is unreachable; drupal.org's event listing gives the camp's official site as drupal-colorado.org, confirming Aug 27-28 2026 at the Lowry Conference Center, D |
| EWF Annual Conference | Aurora | 2026-11-04 | 2026-08-26 | cycle4-links | ewf-usa.com redirects to ewfglobal.com. WebFetch confirms the Executive Women's Forum rebranded its domain to ewfglobal.com and still runs the EWF Annual Conference (~700 attendees |
| FIRST Championship | Houston | — | 2026-08-26 | cycle3-accuracy | firstinspires.org/programs/first-championship gives the most recent FIRST Championship as April 29 - May 2, 2026 in Houston, Texas; no later edition is published yet. Dataset corre |
| Florida Technology & Innovation Solution Summit | Tampa | 2027-08-25 | 2026-08-26 | cycle1-links | The /fltechinnovationsummit26/ vanity path 404s. Florida Chamber's event index now lists the 2027 summit page: Aug 25 2027 at the Grand Hyatt Tampa Bay. |
| Fully Connected | San Francisco | 2026-09-29 | 2026-08-26 | cycle1-links | wandb.ai/site/fully-connected/ 404s; fullyconnected.com and the W&B events page both now redirect to CoreWeave. Confirmed Sept 29 - Oct 1 2026 at Moscone South, San Francisco. |
| GTM Hackathon | Lehi | — | 2026-08-26 | cycle1-links | getmobly.com/gtm-hackathon was taken down after the Feb 2 2026 edition (404) and no successor page is published; pointed at the organiser's live site pending a 2027 edition page. |
| Hoya Hacks | Washington | — | 2026-08-26 | cycle4-links | hoyahacks.com redirects to hoyahacks.georgetown.domains, verified live: HoyaHacks 2027, Georgetown University, Washington DC, January 22-24 2027, registration open. |
| InnovateNB Awards | Fredericton | 2026-11-26 | 2026-08-26 | orchestrator | nbif.ca names only Breakthru and the Innovation Voucher Fund; record removed as a phantom. |
| Innovation Expo Sioux Falls | Sioux Falls | 2026-09-17 | 2026-08-26 | r2-siouxfalls | Flagged as suspicious because startupsiouxfalls.com/events/ showed nothing on 2026-09-17. The calendar is simply windowed to the current month |
| Iowa Technology Summit | Des Moines | — | 2026-08-26 | r2-newly-exposed | technologyiowa.org/events/list/ 404s. The Technology Association of Iowa publishes a dedicated page for this event at /iowa-technology-summit-2026/, which is a better link than the |
| KCD SF Bay Area | Mountain View | 2026-09-01 | 2026-08-26 | cycle3r2-a | CNCF's own KCD calendar (cncf.io/kcds/) lists 'KCD San Francisco Bay Area 2026 - September 1, 2026, Mountain View, United States'. Record had both the date (2026-09-02) and the cit |
| Maker Faire Brownsville | Brownsville | 2026-09-24 | 2026-08-26 | cycle1-links | Runs inside BTX Space Fest; its own page verified: Sept 24-26 2026 at the George Ramirez Performing Arts Academy, Brownsville. |
| Maker Faire Happy Valley | State College | 2026-10-03 | 2026-08-26 | cycle1-links | Own site happyvalley.makerfaire.com verified: Oct 3-4 2026 at Axemann Brewery, Bellefonte, in the Happy Valley / Central PA region. |
| Maker Faire Louisville | Louisville | 2026-10-17 | 2026-08-26 | cycle1-links | Own site louisville.makerfaire.com verified: Oct 17 2026 at the UofL Engineering Student Success and Research Building. |
| Maker Faire NW Arkansas | Fayetteville | 2026-09-12 | 2026-08-26 | cycle1-links | Own site nwa.makerfaire.com verified: Sept 12 2026 at the Fayetteville Public Library, so the host city is Fayetteville, not Bentonville. |
| Maker Faire Orange County | Costa Mesa | 2026-09-12 | 2026-08-26 | cycle1-links | Own site oc.makerfaire.com verified: Sept 12-13 2026 at the OC Fair & Event Center, Costa Mesa. |
| Maker Faire Orlando | Orlando | 2026-11-07 | 2026-08-26 | cycle1-links | Own site makerfaireorlando.com verified: Nov 7-8 2026 at the Central Florida Fairgrounds & Expo Halls. |
| Maker Faire Rochester | Rochester | 2026-11-21 | 2026-08-26 | cycle1-links | Own site rochester.makerfaire.com verified: Nov 21 2026 at the RIT Gordon Field House. |
| Maker Faire Waterloo | Waterloo | 2026-09-13 | 2026-08-26 | cycle1-links | Own site waterloomakerfaire.org verified: Sept 13 2026 at Waterloo Public Square, Uptown Waterloo. |
| Microsoft Build | San Francisco | — | 2026-08-26 | cycle1-links | Verified: Build 2026 was moved from Seattle to San Francisco and held June 2-3 2026 at Fort Mason Center, shortened to two days and application-only in person. The dataset's city a |
| Mile High Dreamin' | Denver | — | 2026-08-26 | cycle3r2-a | Organiser domain milehighdreamin.com 302-redirects to www and now serves only a bare 'LWC Communities' welcome page with no event content; /events, /2026, /about and /index.html al |
| Minneapolis Technology Summit | Minneapolis | 2026-10-22 | 2026-08-26 | cycle4-followups | Verified on eitevents.com/event_pages/minneapolis-technology-summit-2026/ |
| Montreal Games Week | Montreal | 2026-11-10 | 2026-08-26 | cycle1-links | The /en path 404s; the root domain loads and confirms the 2026 edition runs Nov 10-16 2026. |
| Nashville Microsoft Community Day | Nashville | 2026-09-11 | 2026-08-26 | r2-redirects | Verified via communitydays.org/event/2026-09-11/nashville-microsoft-community-day |
| Nerd Nite Austin | Austin | — | 2026-08-26 | cycle1-links | Nerd Nite chapters live at <city>.nerdnite.com; austin.nerdnite.com verified live with current event listings. |
| Nerd Nite Chicago | Chicago | — | 2026-08-26 | cycle1-links | chicago.nerdnite.com verified live with its own event listings. |
| Nerd Nite Denver | Denver | — | 2026-08-26 | cycle1-links | denver.nerdnite.com verified live with its own ticket links. |
| Nerd Nite Seattle | Seattle | — | 2026-08-26 | cycle1-links | seattle.nerdnite.com verified live with its own event schedule. |
| Nerd Nite Toronto | Toronto | — | 2026-08-26 | cycle1-links | toronto.nerdnite.com verified live with its own event listings. |
| Nerd Nite Vancouver | Vancouver | — | 2026-08-26 | cycle1-links | vancouver.nerdnite.com verified live with its own event listings at The Fox Cabaret. |
| NVIDIA GTC | San Jose | 2027-03-15 | 2026-08-26 | cycle3-accuracy | nvidia.com/gtc shows GTC 2027 as 'March 15-18' in San Jose ('The GTC AI conference returns to San Jose in March'). Confirmed verbatim on a second read of the same page. Dataset end |
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
| PlatformCon Live Day San Francisco | San Francisco | 2027-02-24 | 2026-08-26 | passB | platformcon.com world tour lists 'PC Live Day San Francisco 24 February 2027' as a single day; the record had a two-day span ending 2027-02-25, so the end date is patched to 2027-02-24 |
| Polyglot Unconference | Vancouver | — | 2026-08-26 | cycle3r2-b | polyglotconf.com (organiser site) still advertises 'May 25th 2019, Vancouver' as its event; /2026 and /about return 404. No 2026 edition is published anywhere on the organiser's si |
| PyTorch Conference | San Jose | 2026-10-20 | 2026-08-26 | cycle4-links | The Linux Foundation URL redirects to the renamed pytorch-conference-north-america page, verified as 'PyTorch Conference North America', San Jose CA, October 20-21 2026 - matches t |
| Reality Hack at MIT | Cambridge | — | 2026-08-26 | cycle4-links | mitrealityhack.com redirects to realityhackatmit.com, verified as the live official site: Reality Hack at MIT, MIT campus Cambridge MA, next edition January 2027. |
| SANS DC Metro | Bethesda | 2026-09-28 | 2026-08-26 | cycle1-links | Per-event SANS page verified: SANS DC Metro September 2026, Sept 28 - Oct 3 2026 at The Bethesdan Hotel, Bethesda MD. |
| SANS DFIR Summit & Training | Arlington | 2026-10-15 | 2026-08-26 | cycle1-links | Per-event SANS page verified: Oct 15-22 2026 (summit 15-16, training 17-22) at the Hilton Arlington Rosslyn. |
| SANS Miami | Coral Gables | 2026-10-26 | 2026-08-26 | cycle1-links | Per-event SANS page verified: Oct 26-31 2026 at the Hyatt Regency Coral Gables. |
| SANS Network Security | Las Vegas | 2026-09-21 | 2026-08-26 | cycle1-links | Per-event SANS page verified: Sept 21-26 2026 at Caesars Palace, Las Vegas. |
| SANS Raleigh | Raleigh | 2026-11-02 | 2026-08-26 | cycle1-links | Per-event SANS page verified: Nov 2-7 2026 at the Embassy Suites Raleigh-Durham Research Triangle in Cary NC. |
| SANS San Francisco | San Francisco | 2026-11-02 | 2026-08-26 | cycle1-links | Per-event SANS page verified: Nov 2-7 2026 at the Hilton Financial District San Francisco. |
| SecTor | Toronto | 2026-10-06 | 2026-08-26 | cycle3-accuracy | TASK B RESOLVED. blackhat.com/sector (read through a text-extraction proxy, the site 403s bots directly) states SecTor 2026 runs 'October 6-8, 2026' at the Metro Toronto Convention |
| ServiceNow Knowledge | Las Vegas | 2027-05-04 | 2026-08-26 | cycle3-accuracy | servicenow.com/events/knowledge.html (read through a text-extraction proxy; the page 403s bots directly) states 'Knowledge 2027 is May 4-6 in Las Vegas', marking the 20th anniversa |
| South Dallas Maker Faire | Dallas | 2026-11-07 | 2026-08-26 | cycle1-links | fortworth.makerfaire.com 301-redirects to southdallas.makerfaire.com; the faire has been rebranded South Dallas Maker Faire and its own site makes no mention of Fort Worth. Date un |
| Space Symposium | Colorado Springs | 2027-04-12 | 2026-08-26 | cycle3-accuracy | spacesymposium.org (read through a text-extraction proxy; the site 403s bots directly) publishes the next Space Symposium as April 12-15, 2027 at The Broadmoor, Colorado Springs, C |
| Tech Tomorrow | Columbus | 2026-09-09 | 2026-08-26 | cycle4-links | cio-tomorrow.com redirects to techtomorrow.events, which states 'Tech Tomorrow 2026 debuts as the reimagined CIO Tomorrow', building on a 24-year legacy. Columbus OH, September 9 2 |
| TECHSPO Chicago | Chicago | — | 2026-08-26 | cycle4-final | techspochicago.com is flaky |
| TokioConf | Portland | 2027-04-26 | 2026-08-26 | orchestrator | tokioconf.com publishes no 2027 dates - 'towards the end of April', 'sign up when dates are finalized'. Stored dates came from dev.events; cleared. |
| VIATEC AI Meetup | Victoria | 2026-09-10 | 2026-08-26 | r2-newly-exposed | members.viatec.ca/tech-events 404s. The live calendar is members.viatec.ca/event-calendar, which confirms the stored 2026-09-10 date: 'VIATEC AI Meetup |

## confirmed (359)

Checked and correct as recorded.

| event | city | next date | checked | cycle | evidence |
|---|---|---|---|---|---|
| 3686 | Nashville | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| 3rd Coast Venture Summit | New Orleans | 2027-03-09 | 2026-08-26 | passB | 3rdcoastventuresummit.com: 'MARCH 9-10, 2027' in New Orleans |
| 43North Finals | Buffalo | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| a2Tech360 | Ann Arbor | 2026-09-22 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| AAAI Conference on Artificial Intelligence | Montreal | 2027-02-16 | 2026-08-26 | passB | aaai.org/conference/aaai/aaai-27/: 'February 16 - February 23, 2027', Montreal, Canada (Palais des Congres de Montreal) |
| Adobe MAX | Miami Beach | 2026-11-10 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Advertising Week New York | New York | 2026-10-05 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| AFROTECH Conference | Houston | 2026-11-02 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| AGNTCon + MCPCon North America | San Francisco | 2027-04-28 | 2026-08-26 | passB | dev.events San Francisco listing shows 'AGNTCon + MCPCon North America 2027', 'Apr 28-29 27', San Francisco CA |
| AI & Big Data Expo North America | San Jose | 2027-06-16 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| AI in Education Summit | Mountain View | 2026-10-24 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| AI Rising Conference | Columbus | 2026-10-19 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Ai4 | Las Vegas | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Airflow Summit | Austin | 2026-08-31 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Alaska Entrepreneurship Week | Anchorage | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| ALL IN | Montreal | 2026-09-16 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| All Things Open | Raleigh | 2026-10-19 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| API World | Santa Clara | 2026-09-01 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| apidays Toronto | Toronto | 2026-09-09 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| ASU+GSV Summit | San Diego | 2027-04-04 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Atlanta Tech Week | Atlanta | 2027-08-15 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Augmented Enterprise Summit | Atlanta | 2026-10-13 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Autonomous Nation | Wheatland | 2026-09-17 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| AWE USA | Long Beach | 2027-06-14 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| AWS re:Invent | Las Vegas | 2026-11-30 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| BarCamp Philly | Philadelphia | 2026-10-17 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Billington CyberSecurity Summit | Washington | 2026-09-08 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Bio-IT World Conference & Expo | Boston | 2027-05-18 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Birmingham Women in Technology | Birmingham | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Bitcoin Conference | Nashville | 2027-07-15 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Boise Entrepreneur Week | Boise | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Boston Data and AI Saturday | Boston | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Boston Festival of Indie Games | Boston | 2026-10-03 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Boulder Startup Week | Boulder | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| BSides Atlanta | Atlanta | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| BSides Cleveland | Cleveland | 2026-09-26 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSides Denver | Denver | 2026-09-11 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSides Edmonton | Edmonton | 2026-09-24 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSides Idaho Falls | Idaho Falls | 2027-04-16 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| BSides Memphis | Memphis | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| BSides Montreal | Montreal | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSides Orlando | Orlando | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSides Philly | Philadelphia | 2026-12-11 | 2026-08-26 | passB | bsidesphilly.org renders only its title via fetch; the bsides.org global event listing shows BSides Philly 'December 11 @ 08:00 - 18:00' 2026 at Live! Casino & Hotel Philadelphia, 900 Packer Ave, Philadelphia PA - matches 2026-12-11 |
| BSides Pittsburgh | Pittsburgh | 2027-07-09 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| BSides RDU | Raleigh | 2026-12-18 | 2026-08-26 | passB | bsidesrdu.org returns 403 to fetch; the bsides.org event listing shows BSides RDU 'December 18' 2026, Raleigh/Durham NC - matches 2026-12-18. Note bsides.org flags the entry as 'Unconfirmed' |
| BSides Saskatoon | Saskatoon | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| BSides TC | Minneapolis | 2026-10-23 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| BSides Toronto | Toronto | 2026-10-03 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| BSides Vancouver Island | Victoria | 2026-09-25 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| BSidesCache | Logan | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSidesCharm | Baltimore | 2027-04-24 | 2026-08-26 | passB | bsidescharm.org: '24-25 April 2027', Sheraton Baltimore North, 903 Dulaney Valley Rd, Towson MD (Baltimore area) |
| BSidesSGF | Springfield | 2027-03-30 | 2026-08-26 | passB | bsides.org event page: 'March 30, 2027', Springfield, MO, USA - single day, matches the record |
| BSidesStPete | St. Petersburg | 2027-01-29 | 2026-08-26 | passB | bsides.org event page: 'Start: January 29, 2027', 'End: January 30, 2027', St. Petersburg, FL USA |
| Buffalo Game Space Game Development Meeting | Buffalo | 2026-08-27 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Build48 | St. John's | 2027-03-20 | 2026-08-26 | passB | genesiscentre.ca/build48: 'March 20 + 21, 2027', venue 'To be announced', St. John's NL. Caveat: a schedule block lower on the same page still shows Saturday March 28 / Sunday March 29 from a prior edition, so worth a re-check nearer the date |
| Business Value Builder Summit | Huntington | 2026-09-17 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Cactusforce | Scottsdale | 2027-01-21 | 2026-08-26 | passB | cactusforce.com: 'Thursday, January 21st and Friday, January 22nd, 2027' at SkySong Innovation Center, Scottsdale Arizona |
| CanSecWest | Vancouver | 2026-09-26 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| CES | Las Vegas | 2027-01-06 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| CHM Live | Mountain View | 2026-08-27 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| CHROMA | Tulsa | 2026-09-24 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| CIPS Ontario Women in Technology Conference | Toronto | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Cisco Live US | Las Vegas | 2027-06-06 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Clojure/conj | Charlotte | 2026-09-30 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Cloud Nirvana Columbus | Columbus | 2026-09-16 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Code & Supply | Pittsburgh | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| CodeMash | Sandusky | 2027-01-12 | 2026-08-26 | passB | codemash.org shows CodeMash Great Lakes January 12-15, 2027 at Kalahari Resort, Sandusky, Ohio |
| CodeMash East | Spotsylvania | 2027-06-17 | 2026-08-26 | passB | codemash.org: 'CodeMash East, June 17-18, 2027', Kalahari Resort, Spotsylvania, Virginia |
| CodeStock | Knoxville | 2027-04-08 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| Colorado Startup Week | Denver | 2026-09-14 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| ConFoo Montreal | Montreal | 2027-02-24 | 2026-08-26 | passB | confoo.ca/en/2027: 'February 24-26, 2027', Montreal, Canada, Hotel Bonaventure |
| CONNECT: Networking for Entrepreneurs | Jackson | 2026-09-03 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Connecticut Digital Government Summit | Hartford | 2026-09-02 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| CppCon | Aurora | 2026-09-12 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| CSAW Cybersecurity Games and Conference | Brooklyn | 2026-11-12 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| CT Tech Week | Multiple cities | 2027-06-07 | 2026-08-26 | passB | cttechweek.com: 'CT Tech Week returns June 7-11, 2027. Connecticut's biggest week in tech and innovation ... across the state' |
| CUhackit | Clemson | 2027-02-20 | 2026-08-26 | passB | cuhack.it renders only 'CUhackit 2027'; the MLH 2027 season listing shows 'FEB 20 - 21', Clemson, SC - matches the record |
| CVPR | Seattle | 2027-06-20 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| CyberBay Summit | Tampa | 2027-03-22 | 2026-08-26 | passB | cyberbay.org/summit/: 'March 22-24, 2027', JW Marriott Tampa Water Street, Tampa FL (the site root gives no dates) |
| Data + AI Summit | San Francisco | 2027-06-21 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Data in the D | Detroit | 2026-10-16 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Day of Data Orlando | Orlando | 2026-10-17 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Day of Data Pittsburgh | Pittsburgh | 2026-10-10 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Day of Data St. Louis | St. Louis | 2026-10-24 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Day of Data Toronto | Toronto | 2026-09-26 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Day of Data Winnipeg | Winnipeg | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Dayton Hamvention | Xenia | 2027-05-21 | 2026-08-26 | passB | hamvention.org: 'May 21-23, 2027' at the Greene County Fair and Expo Center, Xenia OH 45385 |
| DC Startup & Tech Week | Washington | 2026-10-19 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| DDX Innovation & UX Conference San Diego | San Diego | 2026-09-17 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| DeltaHacks | Hamilton | 2027-01-09 | 2026-08-26 | passB | deltahacks.com shows 'Jan 9 - 10, 2027', 'Official Event @ McMaster University' (Hamilton ON); corroborated by the MLH 2027 season listing 'JAN 09 - 10, Hamilton, Ontario' |
| DelTech Conference | Memphis | 2026-10-14 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| DeveloperWeek | Santa Clara | 2027-02-09 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| DevFest Salt Lake City | Salt Lake City | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| DevLearn Conference & Expo | Las Vegas | 2026-11-04 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Devnexus | Atlanta | 2027-04-05 | 2026-08-26 | passB | devnexus.com: 'April 5-7, 2027', Georgia World Congress Center, Atlanta GA |
| DevOps Midwest | St. Louis | 2026-09-16 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| DevOpsCon New York | New York | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| DevOpsDays Dallas | Dallas | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| devopsdays Denver | Denver | 2026-09-22 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| DevOpsDays Halifax | Halifax | 2026-09-29 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| devopsdays Los Angeles | Los Angeles | 2027-04-02 | 2026-08-26 | passB | devopsdays.org 2027-los-angeles: 'Friday, Apr 2, 2027 - Friday, Apr 2, 2027' at Pasadena Convention Center, 300 E Green St, Pasadena CA. Dates match; the venue is in Pasadena while the event is branded Los Angeles |
| devopsdays Philadelphia | Philadelphia | 2026-10-01 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| devopsdays Portland | Portland | 2026-09-08 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| DevSpace Conference | Huntsville | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Difinity Conference Toronto | Toronto | 2026-09-10 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| DIG SOUTH Tech, Venture & AI Summit | Charleston | 2027-05-20 | 2026-08-26 | passB | digsouth.com/techsummit/: 'May 20-21, 2027 Charleston', Simons Center for the Arts, College of Charleston, 54 St. Philip Street |
| Digital Summit Atlanta | Atlanta | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Digital Summit Philadelphia | Philadelphia | 2026-09-23 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| DistrictCon | Washington | 2027-02-06 | 2026-08-26 | passB | districtcon.org: 'February 6-7, 2027 @ the Capital Hilton in Washington, D.C.' |
| DivHacks | New York | 2026-09-26 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Django Girls New York City | New York | 2026-11-28 | 2026-08-26 | passB | djangogirls.org/en/events/ upcoming list shows New York City on 28th November 2026, the only upcoming US 2026 workshop |
| Dreamforce | San Francisco | 2026-09-15 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| DrupalCon North America | Orlando | 2027-03-22 | 2026-08-26 | passB | events.drupal.org lists 'DrupalCon Orlando, 22-25 March 2027' as the North American edition |
| eBrew | Portsmouth | 2026-10-20 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| ElasticON New York | New York | 2026-10-08 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| ElixirConf US | Chicago | 2026-09-10 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| ElleHacks | Toronto | 2027-01-29 | 2026-08-26 | passB | ellehacks.com is a JS shell showing only the title; the MLH 2027 season listing shows ElleHacks 'JAN 29 - 31', Toronto, Ontario - matches the record |
| eMerge Americas | Miami | 2027-03-02 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| ETHConf | New York | 2027-06-14 | 2026-08-26 | passB | ethglobal.com/events lists 'June 14-16, Mon-Wed, ETHConf 2027, New York City, United States, Conference' |
| Explore DDD | Denver | 2026-09-21 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| External Development Summit (XDS) | Vancouver | 2026-09-08 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| FinovateSpring | San Diego | 2027-05-03 | 2026-08-26 | passB | informaconnect.com/finovatespring/: 'May 3-5, 2027' at Gaylord Pacific Resort & Convention Center, San Diego CA |
| Florida DrupalCamp | Orlando | 2027-01-29 | 2026-08-26 | passB | fldrupal.camp: 'January 29-30, 2027 in Orlando at Northbridge University (formerly Florida Technical College)' |
| Florida Technology Summit | St. Petersburg | 2026-11-19 | 2026-08-26 | passB | technologysummit.net/florida.html: 'The 7th Annual Florida Technology Summit will be held on November 19th, 2026 at the Hilton St. Petersburg Carillon Park' |
| Forge Summit | North Little Rock | 2026-10-13 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Forward Fest | Madison | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Founders Retreat | Fort Ransom | 2026-11-18 | 2026-08-26 | passB | emergingprairie.com homepage: 'Founders: join us November 18-20' for the Founders Retreat; matches 2026-11-18..20. City not printed; the /founders-retreat/ subpage is stale and still shows the Oct 2-4 2024 edition |
| Full Indie Summit | Vancouver | 2026-09-20 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Game Developers Conference | San Francisco | 2027-03-01 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Game Discovery Exhibition (GDX) | Edmonton | 2026-10-23 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Gartner IT Symposium/Xpo | Orlando | 2026-10-19 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| GDEX | Newark | 2026-10-15 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| GDG Brooklyn AI Fashion Hackathon | Brooklyn | 2026-09-12 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Georgia Tech All-Majors Career Fair | Atlanta | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| GirlHacks | Newark | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Global Game Jam | Multiple cities | 2027-01-25 | 2026-08-26 | passB | globalgamejam.org shows '25 - 31 January 2027' |
| GNTC Summit | Nashville | 2026-09-09 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Google Cloud Next | Las Vegas | — | 2026-08-26 | orchestrator | cloud.google.com/next 301s to the stored URL; it is the canonical entry point |
| GoSec | Montreal | 2026-09-23 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Grace Hopper Celebration | Anaheim | 2026-10-27 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Great Lakes Software Symposium | Chicago | 2026-10-22 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| gRPConf North America | Mountain View | 2026-09-03 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Hack Dearborn | Dearborn | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Hack Midwest | Kansas City | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Hack the North | Waterloo | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Hack the Valley | Toronto | 2026-10-16 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Hack Western | London | 2026-11-20 | 2026-08-26 | passB | hackwestern.com shows 'November 20-22, 2026'; Hack Western is hosted at Western University, London ON |
| Hack_NCState | Raleigh | 2027-02-06 | 2026-08-26 | passB | hackncstate.org shows 'Feb 6th and 7th' 2027 at Talley Student Union on NC State main campus, Raleigh |
| Hack@Brown | Providence | 2027-02-06 | 2026-08-26 | passB | hackatbrown.org shows 'FEBRUARY 6-7, 2027'; MLH lists Feb 5-7 (including the Friday kickoff), Providence RI. The organiser page matches the recorded 02-06..02-07 |
| HackGT | Atlanta | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| HackHERS | New Brunswick | 2027-02-27 | 2026-08-26 | passB | ruhackhers.org (HackHERS 2027): 'February 27-28th', College Avenue Student Center, Rutgers, New Brunswick NJ |
| HackHers @GSU | Atlanta | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| HackIllinois | Urbana-Champaign | 2027-02-26 | 2026-08-26 | passB | hackillinois.org only says 'Stay tuned for Hack 2027'; the MLH 2027 season listing shows HackIllinois 'FEB 26 - 28', Urbana, Illinois - matches the record |
| HackKU | Lawrence | 2027-04-09 | 2026-08-26 | passB | hackku.org returned HTTP 429 on repeated fetches; the MLH 2027 season listing shows HackKU27 'APR 09 - 11', Lawrence, Kansas - matches the record |
| Hacklytics | Atlanta | 2027-02-26 | 2026-08-26 | passB | hacklytics.io: 'Feb. 26 - 28, 2027', Klaus Advanced Computing Building, Georgia Tech Campus, Atlanta |
| HackOHI/O | Columbus | 2026-10-24 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| HackRice | Houston | 2026-09-11 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| hackUMBC | Baltimore | 2026-09-26 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Hackville | Mississauga | 2027-01-22 | 2026-08-26 | passB | hackville.io still shows the Jan 17-18 2026 edition with a 2027 interest form; the MLH 2027 season listing shows 'Hackville 2027, JAN 22 - 24, Missisauga, Ontario' - matches the record |
| HackWesTX | Lubbock | 2026-09-12 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Hawaii Tech Week | Honolulu | 2026-08-31 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| HenHacks | Newark | 2027-03-06 | 2026-08-26 | passB | henhackshackathon.com: 'March 6-7, 2027', University of Delaware Newark campus, in-person only |
| HLTH USA | Las Vegas | 2026-11-15 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| HopHacks | Baltimore | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Houston Day of Data | Houston | 2026-12-05 | 2026-08-26 | passB | stored sqlsaturday.com url forwards to dayofdata.org/2026-12-05-dayofdata1162/ which shows 'Houston Day of Data 2026 (#1162)', 05 December 2026, Microsoft, 750 Town And Country Blvd, Houston TX |
| HPSF Conference | Montreal | 2027-04-12 | 2026-08-26 | passB | events.linuxfoundation.org calendar: 'HPSF Conference, Apr 12-16, 2027 Montreal, Canada' |
| HR Tech Las Vegas | Las Vegas | 2026-10-20 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| ICS Cybersecurity Conference Nashville | Nashville | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| iFiveK | Charleston | 2027-04-22 | 2026-08-26 | passB | charlestondigital.com/community/ifivek: 'SEE YOU AT THE START LINE APRIL 22, 2027', Charleston Tech Center, downtown Charleston SC |
| Ignite Seattle | Seattle | 2026-10-01 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Ignite Summit | Fredericton | 2026-10-20 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Imagine RIT: Creativity and Innovation Festival | Rochester | 2027-04-24 | 2026-08-26 | passB | rit.edu/imagine/: 'April 24, 2027, 10 a.m. - 5 p.m.', 30 Lomb Memorial Drive, Rochester NY |
| InnovateHer | West Lafayette | 2027-02-06 | 2026-08-26 | passB | innovateherhacks.org: 'Date: February 6-7, 2027', 'Location: TBD' - dates match; venue not yet published (the event is at Purdue, West Lafayette) |
| Innovation Depot Founders Round Table | Birmingham | 2026-10-22 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| Interface | Quebec City | 2027-06-01 | 2026-08-26 | passB | interfaceqc.com header: 'Interface / 1-3 juin 2027' (June 1-3, 2027), Quebec City |
| Iowa Startup Week | Des Moines | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| IS: Life Sciences | Wilmington | 2026-12-10 | 2026-08-26 | passB | innovationspace.org event page shows 'December 10 @ 8:30 am - 6:00 pm' for 2026, matching the recorded date. Venue/city not printed on the page; InnovationSpace is at the Wilmington DE Experimental Station |
| ISTE+ASCD Conference | Boston | 2027-06-27 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| ITEXPO | Fort Lauderdale | 2027-02-09 | 2026-08-26 | passB | itexpo.com/east: 'February 9-11, 2027 / Fort Lauderdale, Florida', Broward County Convention Center |
| Jersey City Entrepreneurs: The Venture Garden | Jersey City | 2026-08-26 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| JumpStart VC Fest | Cleveland | 2026-09-29 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Kansas City Developer Conference | Kansas City | 2026-09-09 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Kent Hack Enough | Kent | 2027-03-06 | 2026-08-26 | passB | khe.io (Kent Hack Enough 2027): 'March 6-7, 2027', Design Innovation Hub, Kent, OH 44243 |
| Knox Game Jam | Knoxville | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| KubeCon + CloudNativeCon North America | Salt Lake City | 2026-11-09 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| LA Hacks | Los Angeles | 2027-04-16 | 2026-08-26 | passB | lahacks.com says only 'Mid-April 2027' at UCLA Pauley Pavilion; the MLH 2027 season listing shows LA Hacks 27 'APR 16 - 18', Los Angeles, California - matches the record |
| LA Tech Week | Los Angeles | 2026-10-12 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Launch Wisconsin | Milwaukee | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Legalweek New York | New York | 2027-03-01 | 2026-08-26 | passB | event.law.com/legalweek: 'March 1 - 3, 2027 / North Javits Center / New York, NY' |
| Linux Foundation Member Summit | Half Moon Bay | 2027-02-22 | 2026-08-26 | passB | events.linuxfoundation.org calendar: 'Feb 22-23, 2027 Half Moon Bay, United States' |
| Lone Star Cyber Summit | Austin | 2026-10-20 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Maine Tech Week | Portland | 2026-10-19 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Maker Faire Bay Area | Vallejo | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Maker Faire Yukon | Whitehorse | 2026-08-29 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| MakeUofT | Toronto | 2027-02-13 | 2026-08-26 | passB | makeuoft.ca itself still says 'TBD, 2027' at the Myhal Centre, U of T St. George; the MLH 2027 season listing gives MakeUofT 'FEB 13 - 14', Toronto, Ontario - matches the record |
| Manitoba Tech Week | Winnipeg | 2027-02-21 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| MariHacks | Montreal | 2027-04-09 | 2026-08-26 | passB | marihacks.com renders only its heading; the MLH 2027 season listing shows MariHacks 'APR 09 - 10', Montreal, Quebec - matches the record |
| MCP Dev Summit Toronto | Toronto | 2026-10-05 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| MEET Show | Moncton | 2028-05-03 | 2026-08-26 | passB | meetshow.ca: 'The MEET Show will return May 3-4, 2028' at the Moncton Coliseum |
| Meeting in the Millyard | Nashua | 2027-05-18 | 2026-08-26 | orchestrator | NH Tech Alliance calendar lists MITM27 May 18-20 2027, matches record |
| Meta Connect | Menlo Park | 2026-09-23 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Microsoft Power Platform Community Conference | Las Vegas | 2026-10-27 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| MidCamp | Chicago | 2027-04-28 | 2026-08-26 | passB | midcamp.org news: 'Mark your calendars. MidCamp is returning April 28-30, 2027!'. The 2027 venue is not yet named; the 2026 edition is at DePaul University, Chicago |
| Mind the Product Chicago | Chicago | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Minnedemo | St. Paul | 2026-10-01 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Mira Awards | Indianapolis | 2027-04-23 | 2026-08-26 | passB | techpoint.org/mira-awards/: 'The 2027 Mira Awards will take place Friday, April 23 at the brand-new Signia by Hilton Indianapolis' |
| Mississippi Aerospace & Defense Symposium | Flowood | 2026-09-02 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| MIT Bitcoin Expo | Cambridge | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| MLconf | New York | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Momentum Developer Conference | Cincinnati | 2026-10-15 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Money20/20 USA | Las Vegas | 2026-10-18 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| MongoDB.local Dallas | Irving | 2026-10-14 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| MongoDB.local NYC | New York | 2026-09-30 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| MongoDB.local Toronto | Toronto | 2026-11-19 | 2026-08-26 | passB | mongodb.com event page: When 'November 19, 2026', Location 'Toronto, ON' |
| National Cyber Summit | Huntsville | 2026-09-22 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| NC TECH Awards Celebration | Raleigh | 2026-11-16 | 2026-08-26 | passB | nctech.org signature-events page lists 'NC TECH Awards Celebration - November 16 - Sheraton Imperial Hotel Raleigh-Durham Airport at Research Triangle Park'; matches 2026-11-16 |
| NC TECH Summit for Women in Tech | Asheville | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| New Ventures BC Demo Day | Vancouver | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| New York Tech Week | New York | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| NH Tech Alliance Cybersecurity Summit | Manchester | 2026-09-10 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| NH Tech Alliance Innovation Summit | Nashua | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| NH Tech Alliance Product of the Year | Concord | 2026-11-19 | 2026-08-26 | passB | nhtechalliance.org: 'Thursday, November 19th, 2026' at Bank of New Hampshire Stage, 16 S Main St., Concord, NH |
| NorthSec | Montreal | 2027-05-17 | 2026-08-26 | passB | nsec.io: 'May 17-23, 2027', Montreal, Bonsecours Market, 350 St-Paul East (training May 17-19, conference May 20-21, CTF May 21-23) |
| NSBE Annual Convention | Baltimore | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| NWA Tech Summit | Bentonville | 2026-09-01 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| nwHacks | Vancouver | 2027-01-16 | 2026-08-26 | passB | nwhacks.io shows 'January 16-17, 2027' at UBC Life Sciences Institute, Vancouver BC |
| NY SMART I-Corridor Semiconductor Summit | Rochester | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| NY Tech Meetup | New York | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| NYC Resistor Craft Night | Brooklyn | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Offensive AI Con | San Diego | 2026-10-04 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| OIN Connect | San Jose | 2026-10-19 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Oktane | Las Vegas | 2026-09-22 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Open Sauce | San Mateo | 2027-07-17 | 2026-08-26 | passB | opensauce.com: 'July 17-18, 2027', 'San Mateo County Event Center - CA' |
| Open Source 101 Charlotte | Charlotte | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Open Source Summit North America | Vancouver | 2027-05-17 | 2026-08-26 | passB | events.linuxfoundation.org calendar: 'Open Source Summit North America, May 17-19, 2027 Vancouver, Canada' |
| Oracle AI World | Las Vegas | 2026-10-25 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| OwlHacks | Philadelphia | 2026-09-26 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Pacific NW Software Quality Conference | Portland | 2026-10-12 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Partner Vibe | Salt Lake City | 2026-09-21 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| PASS Data Community Summit West | Seattle | 2026-11-09 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Pathways to Progress | Charleston | 2027-04-29 | 2026-08-26 | passB | generationwv.org: 'Pathways to Progress will return on April 29, 2027, in Charleston, WV' |
| PAX East | Boston | 2027-04-22 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| PAX Unplugged | Philadelphia | 2026-12-04 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| PAX West | Seattle | 2026-09-04 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| PGConf.dev | Montreal | 2027-05-11 | 2026-08-26 | passB | 2027.pgconf.dev: 'May 11th - 14th, 2027' in 'Montreal, QC, Canada' at Plaza Centre-Ville |
| PodCamp Toronto | Toronto | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| posit::conf | Houston | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Prairie Capital Summit | Fargo | 2026-10-07 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Prairie Dev Con | Winnipeg | 2026-09-21 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Product-Led Summit Denver | Denver | 2027-04-07 | 2026-08-26 | passB | world.productledalliance.com calendar: 'Apr 07 & 08, 2027' in Denver |
| Product-Led Summit San Francisco | San Francisco | 2026-09-22 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Product-Led Summit Seattle | Seattle | 2027-06-16 | 2026-08-26 | passB | world.productledalliance.com calendar: 'Jun 16 & 17, 2027' in Seattle |
| Product-Led Summit Toronto | Toronto | 2026-11-12 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| PTC Annual Conference | Honolulu | 2027-01-17 | 2026-08-26 | passB | ptc.org header shows PTC 27 on 17-20 January 2027 in Honolulu, Hawaii |
| PyBay | San Francisco | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| QCon San Francisco | San Francisco | 2026-11-16 | 2026-08-26 | passB | qconsf.com shows 'Nov 16-18, 2026' conference plus 'Nov 19-20, 2026' training at Hyatt Regency SF; record span 11-16..11-20 covers conference plus training days |
| Quantum.Tech USA | Boston | 2027-05-25 | 2026-08-26 | passB | alphaevents.com/events-quantumtechus: 'May 25 - 26, 2027 / Encore Boston Harbor / Boston, United States' (branded Quantum.Tech World 2027, co-located with Compute.Tech) |
| Rails Camp West | Otis | 2026-09-07 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Rails World | Austin | 2026-09-23 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Rally Innovation Conference | Indianapolis | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Red Hat Summit | Boston | 2027-05-25 | 2026-08-26 | passB | redhat.com/en/summit: 'Red Hat Summit, happening May 25-27, 2027' at the Boston Convention and Exhibition Center |
| RedacteCON | Grand Junction | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| RenderATL | Atlanta | 2027-08-18 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Reno Startup Week | Reno | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| RevolutionUC | Cincinnati | 2027-02-27 | 2026-08-26 | passB | revolutionuc.com only says 'Spring 2027'; the MLH 2027 season listing shows RevolutionUC 'FEB 27 - 28', Cincinnati, Ohio - matches the record |
| Rhode Island Startup Week | Providence | 2026-09-18 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| RIHub Pizza & Pitches | Providence | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Rochester Security Summit | Rochester | 2026-10-14 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Rocky Mountain Ruby | Boulder | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| ROS By-The-Bay | Sunnyvale | 2026-09-03 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| RSAC Conference | San Francisco | 2027-04-05 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| RustConf | Montreal | 2026-09-08 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| rvatech/Women in Technology Conference | Richmond | 2026-11-17 | 2026-08-26 | passB | rvatech.com premier-conferences page lists the Women in Technology Conference for 'November 17, 2026'; city not printed on the page but rvatech events are Richmond |
| SaaStr Annual | San Mateo | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Sacramento Tech Week | Sacramento | 2026-10-19 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Salt Lake City Day of Data | Salt Lake City | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Santa Monica New Tech | Santa Monica | 2026-08-30 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| SCaLE | Pasadena | 2027-04-01 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Scenic City Summit | Chattanooga | — | 2026-08-26 | 2 | spot-check by the researcher after merge |
| Scrum Day Houston | Houston | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Scrum Day Madison | Madison | 2026-10-15 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| SeaGL | Seattle | 2026-10-23 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| SecKC | Kansas City | 2026-09-08 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| Security BSides Albuquerque | Albuquerque | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| SF Hacks | San Francisco | 2027-02-19 | 2026-08-26 | passB | sfhacks.io returns 403 to fetch; the MLH 2027 season listing shows SF Hacks 'FEB 19 - 21', San Francisco, CA - matches the record |
| SF Tech Week | San Francisco | 2026-10-05 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| ShellHacks | Miami | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| SIGGRAPH | Los Angeles | — | 2026-08-26 | orchestrator | s2026.siggraph.org confirms 19-23 July 2026 at LA Convention Center; 2027 city unpublished |
| Silicon Couloir Pitch Day | Jackson | 2026-09-24 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| SLOSS.tech | Birmingham | 2027-06-23 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| Snowflake Summit | San Francisco | 2027-06-07 | 2026-08-26 | passB | snowflake.com/summit/: 'JUNE 7 - 10, 2027' at MOSCONE CENTER, San Francisco |
| SouthEast LinuxFest | Charlotte | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Southwestern Ontario Drupal Camp | Multiple cities | 2026-10-23 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Space and Missile Defense Symposium | Huntsville | 2027-08-10 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| SpartaHack | East Lansing | 2027-02-06 | 2026-08-26 | passB | spartahack.com: 'Feb 6-7, 2027', 'East Lansing, Michigan', MSU STEM Building |
| Splunk .conf | Denver | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| SQLSaturday Minnesota | St. Paul | 2026-10-24 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Startup Grind Global Conference | Redwood City | 2027-04-27 | 2026-08-26 | passB | startupgrind.tech/conference/: 'Startup Grind Conference / Apr. 27-28, 2027 / Silicon Valley', venue Fox Theatre, 2215 Broadway, Redwood City CA |
| Startupfest | Montreal | 2027-07-07 | 2026-08-26 | passB | startupfest.com: 'July 7-9, 2027 / Montreal', venue Grand Quay in the Old Port |
| STARWEST | Anaheim | 2026-09-20 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| SteelHacks | Pittsburgh | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Step San Francisco | San Francisco | 2026-08-26 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| STL TechWeek | St. Louis | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Stripe Sessions | San Francisco | 2027-04-28 | 2026-08-26 | passB | stripe.com/sessions: 'Join us 28-30 April in San Francisco' for Sessions 2027 |
| SXSW | Austin | 2027-03-15 | 2026-08-26 | passB | sxsw.com: 'March 15-21, 2027 / Austin, TX' |
| SXSW EDU | Austin | 2027-03-13 | 2026-08-26 | passB | sxswedu.com: 'March 13-16, 2027 / Austin, TX' |
| TAG Chairs' Gala | Atlanta | 2026-11-19 | 2026-08-26 | passB | members.tagonline.org calendar lists TAG Chairs Gala 2026 on Thursday, November 19, 2026, 6:00-11:00 PM; TAG is Atlanta-based |
| TailscaleUp | San Francisco | 2026-08-26 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Tampa Bay Wave BlueTech|X Pitch Night | Tampa | 2026-09-17 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Tech Fuse Des Moines | Des Moines | 2026-10-15 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| tech SAVannah Tech Tuesday | Savannah | 2026-09-08 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Tech Titans Awards Gala | Plano | 2026-08-28 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| TechChicago Week | Chicago | 2027-07-19 | 2026-08-26 | passB | gotechchicago.com/week/: 'July 19-25, 2027' in Chicago |
| TechCrunch Disrupt | San Francisco | 2026-10-13 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| TechExit.io Calgary | Calgary | 2026-10-01 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| TechMentor & Cybersecurity Live! @ Microsoft HQ | Redmond | 2027-08-09 | 2026-08-26 | passB | techmentorevents.com microsofthq-2027: 'TechMentor & CyberSecurity Live! @Microsoft HQ / August 9-13, 2027 / Microsoft Headquarters, Redmond, WA' |
| TECHSPO New York | New York | 2027-04-22 | 2026-08-26 | passB | techsponyc.com: 'April 22-23, 2027' at the New York Marriott at the Brooklyn Bridge Hotel, New York City NY |
| Tennessee Quantum Hackathon | Chattanooga | 2026-11-13 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| TENWEST Festival | Tucson | 2027-03-30 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| The AI Conference | San Francisco | 2026-09-29 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| The AI Pivot Conference | Anaheim | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| The AI Summit New York | New York | 2026-12-09 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| The Montgomery Summit | Santa Monica | 2027-03-09 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| ThunderPlains | Oklahoma City | 2026-10-21 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| TransportationCamp DC | Washington | 2027-01-09 | 2026-08-26 | passB | t4america.org/transportation-camp/: 'Mark your calendar for Saturday, January 9, 2027' in Washington, DC |
| Tulsa Tech Week | Tulsa | 2026-09-21 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Twilio SIGNAL | San Francisco | 2027-04-13 | 2026-08-26 | passB | signal.twilio.com: 'Save the date / San Francisco SIGNAL 2027 ... Join us on April 13-14, 2027'. Flagged as a save-the-date page, so worth re-checking once the agenda opens |
| UGAHacks | Athens | 2027-02-05 | 2026-08-26 | passB | ugahacks.com shows only 'UGAHacks 12 Pre-registration Now Open!' with no dates; the MLH 2027 season listing gives 'FEB 05 - 07', Athens, Georgia - matches the record |
| Umbraco US Festival | Chicago | 2026-09-30 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| UNBOUND (formerly INBOUND) | Boston | 2026-09-16 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Uniting the Prairies | Saskatoon | 2027-04-28 | 2026-08-26 | passB | unitingtheprairies.com: 'April 28-29, 2027 / Remai Modern, Saskatoon' |
| University of Idaho Engineering Design EXPO | Moscow | 2027-04-29 | 2026-08-26 | passB | uidaho.edu/engr/expo: 'April 29 and 30, 2027' on the University of Idaho campus, Moscow ID |
| UofTHacks | Toronto | 2027-01-15 | 2026-08-26 | passB | uofthacks.com hero shows 'January 2027 / In-person event' (its FAQ text is stale from UofTHacks 13); the MLH 2027 season listing gives 'JAN 15 - 17', Toronto, Ontario - matches the record |
| uOttaHack | Ottawa | 2027-01-15 | 2026-08-26 | passB | 2027.uottahack.ca renders only 'uOttaHack 9' with no dates; the MLH 2027 season listing shows uOttaHack 9 'JAN 15 - 17', Ottawa, Ontario - matches the record |
| Upper Bound | Edmonton | 2027-05-18 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| UtahJS Conference | Sandy | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Vancouver Microsoft 365 Summit | Vancouver | 2026-09-03 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| VCF Swap Meet | Wall | 2026-10-17 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Venture Atlanta | Atlanta | 2026-10-14 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Venture Dallas | Dallas | 2026-10-22 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Vermont Tech Jam | Burlington | 2026-10-24 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Veteran Innovation Hackathon | Mountain View | 2026-08-28 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Victoria Tech Week | Victoria | 2026-09-21 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Video Game Live Expo (VGLX) | Mississauga | 2026-10-24 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Vintage Computer Festival Midwest | Schaumburg | 2026-09-12 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Vintage Computer Festival Southwest | Irving | 2027-06-25 | 2026-08-26 | passB | vcfsw.org: 'June 25-27, 2027, The Westin Dallas Fort Worth Airport, 4545 W John Carpenter Fwy, Irving, TX 75063' |
| ViVE | Nashville | 2027-03-14 | 2026-08-26 | passB | hlth.com/events/vive/: March 14-17 2027 at Music City Center, 201 Rep. John Lewis Way S, Nashville TN |
| VSLive! San Diego | San Diego | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| VTHacks | Blacksburg | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| WeAreDevelopers World Congress | San Jose | 2026-09-23 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Web Summit Vancouver | Vancouver | 2027-05-25 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| WEHack | Richardson | 2027-04-10 | 2026-08-26 | passB | wehackutd.com says 'WEHack 2027 Coming Soon / Spring 2027' with no dates; the MLH 2027 season listing shows WEHack 'APR 10 - 11', Richardson, TX - matches the record |
| West Slope Startup Week | Durango | 2026-10-05 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| WiCHacks | Rochester | 2027-02-27 | 2026-08-26 | passB | wichacks.io is a JS shell with no dates; the MLH 2027 season listing shows WiCHacks 'FEB 27 - 28', Rochester, New York - matches the record |
| Wisconsin Biohealth Summit | Milwaukee | 2026-10-21 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Workplace Ninjas US | Scottsdale | 2027-01-11 | 2026-08-26 | passB | dev.events Arizona listing shows 'Workplace Ninjas 2027 US', 'Jan 11-13 27', Scottsdale AZ |
| XP Game Summit | Toronto | 2027-06-10 | 2026-08-26 | passB | xpgamesummit.com: 'XP Game Summit returns June 10-11, 2027', 'toronto, canada' |
| Y Combinator Demo Day | San Francisco | 2026-09-10 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| YYC DataCon | Calgary | 2026-09-11 | 2026-08-26 | 2 | spot-check by the researcher after merge |
