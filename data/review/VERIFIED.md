# Verification ledger

**Read this before verifying anything.** It records which events have already been
checked against the organiser's own page, so a pass can spend its budget on what is
still unknown rather than re-confirming what is settled.

Updated 2026-09-01 · dataset holds 883 events.

| status | count | share | meaning |
|---|---:|---:|---|
| `confirmed` | 737 | 83.5% | checked against the organiser's page, correct as recorded — **skip these** |
| `corrected` | 146 | 16.5% | checked, found wrong, patched — **skip these** |
| `blocked` | 0 | 0.0% | attempted, page unreadable by fetch — **needs a web search or a human with a browser** |
| _unchecked_ | 0 | 0.0% | never attempted — **verify these first** |

## Re-check queue

A verification is a snapshot, not a subscription. `data/review/TO-VERIFY.tsv` is
regenerated on every run from the rules below, so it refills itself rather than
sitting empty and reading as "done" when it means "no longer watching".

**13 of 883 events are due for a re-check.**

| reason | count | why it fires |
|---|---:|---|
| `rolled` | 13 | the edition ran since it was last checked; next date unknown |

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

## Ledger rows with no matching event (36)

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
- **Wisconsin Biohealth Summit** — Milwaukee (confirmed, 3r2b): verified against organiser page (autumn date sweep)
- **Atlantic Technology Summit** — Halifax (corrected, orchestrator): cips.ca names no such event; record removed as unverifiable and mis-linked.
- **InnovateNB Awards** — Fredericton (corrected, orchestrator): nbif.ca names only Breakthru and the Innovation Voucher Fund; record removed as a phantom.
- **AGNTCon + MCPCon North America** — San Francisco (confirmed, passB): dev.events San Francisco listing shows 'AGNTCon + MCPCon North America 2027', 'Apr 28-29 27', San Francisco CA
- **Oracle CloudWorld** — Las Vegas (corrected, passA): oracle.com/cloudworld/ now titled 'Oracle AI World 2026'; JSON-LD startDate 2026-10-25 endDate 2026-10-28, hero 'October 25-28 | Las Vegas'. Record had Sep 15-18 — wrong by six weeks
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
- **AGNTCon + MCPCon North America** — San Jose (corrected, staleness): LF Events: 2026 edition Oct 22-23 San Jose, 2027 edition Apr 28-29 San Francisco. Record had the 2027 date as next, the 2026 date as last, and the wrong city.

## blocked (0)

Attempted and unreadable by fetch. These are where a web search actually earns its cost.

_none_

## corrected (146)

Checked and patched.

| event | city | next date | checked | cycle | evidence |
|---|---|---|---|---|---|
| AI Engineer World's Fair | San Francisco | 2027-06-29 | 2026-08-26 | passC | ai.engineer announces 'JUN 29-JUL 2 2027' at Moscone West, San Francisco - date now published |
| AI Infra Summit | Santa Clara | 2026-09-15 | 2026-08-26 | cycle4-links | aiinfrasummit.com redirects to the new domain ai-infra-summit.com, verified as AI Infra Summit 2026, Santa Clara Convention Center, September 15-17 2026 - matches the record's next |
| Alaska Digital Government Summit | Anchorage | 2026-10-08 | 2026-08-26 | passC | events.govtech.com page announces October 8 2026 at Marriott Anchorage Downtown - date now published |
| Arkansas Digital Government Summit | Little Rock | 2026-10-13 | 2026-08-26 | passC | events.govtech.com page announces Tuesday October 13 2026 at Little Rock Marriott - date now published, registration open |
| Arkansas IT Symposium | Little Rock | — | 2026-08-26 | search-unblock | May 6 2026, Statehouse Convention Center Little Rock - matches stored last_date. URL moved off the Cloudflare-walled 10times listing. |
| Atlantic Venture Forum | Halifax | — | 2026-08-26 | search-unblock | June 17-18 2026, Halifax Convention Centre - matches stored last_date. URL moved to atlanticventureforum.ca, already advertising AVF2027. |
| BayPIGgies (Bay Area Python Interest Group) | San Jose | — | 2026-08-26 | passA | meetup.com/baypiggies shows next meeting Thu, Aug 27 6:30 PM PDT at West Valley Branch Library, 1243 San Tomas Aquino Rd, San Jose, CA. Date correct, city was wrong (Mountain View -> San Jose) |
| Berkeley SkyDeck Demo Day | Berkeley | — | 2026-08-26 | r2-redirects | skydeck.berkeley.edu/demo-day/ redirects to demo-day-fall-2020, an article dated 04 February 2020 |
| BeyondConf | Detroit | 2026-09-10 | 2026-09-01 | staleness | dev.events conference page JSON-LD: single day 2026-09-10. Moved off the shared Michigan listing. |
| Big Data & Analytics Summit Canada | Toronto | 2027-06-08 | 2026-08-26 | passC | bigdatasummitcanada.com announces 12th Annual summit June 8-9 2027 in Toronto - date now published |
| Black Hat USA | Las Vegas | 2027-07-31 | 2026-08-26 | cycle3-accuracy | blackhat.com/us-27 (read through a text-extraction proxy; blackhat.com 403s bots) publishes Black Hat USA 2027 as 'July 31-August 5, 2027'. The blackhat.com event list carries the  |
| Boston TechJam | Boston | — | 2026-08-26 | search-unblock | MassTLC Boston TechJam ran June 13 2026 at City Hall Plaza. Record had no date. |
| BSides Bloomington | Bloomington | 2026-10-02 | 2026-08-26 | cycle1-links | Own site bsidesbloomington.org verified live, 2026 edition at the Bloomington Convention Center; replaces the generic allbsides.com directory link. |
| BSides Calgary | Calgary | — | 2026-08-26 | cycle1-links | Bare bsidescalgary.org does not resolve; www host loads and shows BSides Calgary 2026 at Contemporary Calgary, May 25-26 2026. |
| BSides CMH | Columbus | 2026-11-04 | 2026-08-26 | cycle1-links | Own site bsidescolumbus.com verified live: Nov 4-6 2026 with sessions Nov 5-6, presented by GuidePoint Security; replaces the generic allbsides.com link. |
| BSides Dayton | Dayton | 2027-05-15 | 2026-08-26 | passC | bsidesdayton.com announces Saturday May 15 2027, 9:30am-5pm (Dayton area, Fairborn OH venue) - date now published |
| BSides Fort Wayne | Fort Wayne | 2026-11-11 | 2026-08-26 | unblockB | bsidesfortwayne.org loads (HTTP 200). Banner text: 'We are excited to announce a Fall Event on November 11th 2026 @ Brotherhood Mutual! Get Tickets here!'. The main June 6th 2026 conference is past; the newly published next in-person date is 2026-11-11 in Fort Wayne. Patch emitted. |
| BSides Harrisburg | Harrisburg | 2027-05-21 | 2026-08-26 | cycle1-links | Bare bsideshbg.com dead; www host live and announces BSidesHBG 2027 on May 21 2027 at the PA Farm Show Complex. |
| BSides ICS/OT | Tampa | — | 2026-08-26 | passC | bsidesics.org: event runs the day before S4; 2026 edition was Miami but the site now advertises 'BSidesICS/OT 2027 Tampa, FL' (details TBA) - next edition city is Tampa, not Miami |
| BSides Nashville | Nashville | 2027-04-23 | 2026-08-26 | passC | bsidesnash.org announces April 23 2027, doors 8:30am, Nashville TN - date now published |
| BSides NOLA | New Orleans | 2027-05-11 | 2026-08-26 | unblockB | nolabsides.com redirects to bsidesnola.notion.site, which renders JS-only to curl. Read the page content through Notion's public loadPageChunk endpoint for page 315249e7-315f-8022-98e5-c97d61538355: 'BSidesNOLA May 11, 2027 tickets ON SALE NOW!' with a ticketleap link to bsidesnola-2027-may-pre-release, alongside 'BSidesNOLA 2026 may be over, but the knowledge sharing continues.' Newly published date 2027-05-11, New Orleans. Patch emitted. |
| BSides Ottawa | Ottawa | 2026-11-19 | 2026-08-26 | passB | bsidesottawa.ca (via www redirect): 'Join us November 19-20 for two days of talks, villages...' at Ottawa Conference and Event Centre, 200 Coventry Road, Ottawa ON. Record had a single-day 11-19 event; end date patched to 2026-11-20 |
| BSides PDX | Portland | 2026-10-23 | 2026-08-26 | cycle3r2-b | bsidespdx.org states verbatim 'BSidesPDX 2026 will be on Fri Oct 23rd & Sat Oct 24th, 2026' - a two-day event. Start date 2026-10-23 is correct but the record ends it the same day. |
| BSides Peoria | Peoria | 2026-10-24 | 2026-08-26 | cycle1-links | Own site bsidespeoria.com verified live: Oct 24 2026 at Bradley University, Peoria IL; replaces the generic allbsides.com link. |
| BSides San Diego | San Diego | — | 2026-08-26 | cycle1-links | Bare bsidessd.org does not resolve; www host loads and is the official BSides San Diego site with 2026 event details. |
| BSides Vancouver | Vancouver | — | 2026-08-26 | cycle1-links | Bare bsidesvancouver.com does not resolve; www host loads, run by Mainland Advanced Research Society, 2026 edition held at SFU Harbour Centre. |
| BSidesOK | Glenpool | — | 2026-08-26 | cycle1-links | bsidesok.com content confirms the 2026 event ran Apr 8-10 2026 at the Glenpool Conference Center; corrected the start date from 2026-04-06. |
| BSidesROC | Rochester | 2027-03-20 | 2026-08-26 | passC | bsidesroc.com announces Saturday March 20 2027 for the next Security B-Sides Rochester - date now published |
| C2 Montreal | Montreal | — | 2026-08-26 | cycle3-accuracy | c2montreal.com states 'In 2026, C2 Montreal will be taking a pause from its annual May gathering' while a new format is explored, and lists no future dates. Not discontinued, so ke |
| Cambridge Science Festival | Cambridge | 2026-09-23 | 2026-08-26 | search-unblock | MIT Museum: re-imagined 2026 festival Sept 23-29 2026. Record had no next edition. |
| Central Iowa Software Symposium | Des Moines | 2026-09-17 | 2026-08-26 | cycle1-links | NFJS tour listing gives the stop path as /desmoines (not /des-moines); page confirms Sept 17-18 2026 at the West Des Moines Marriott. |
| CISO Fireside | Sundance | 2026-11-05 | 2026-08-26 | passA | Organiser site cisofireside.org: 'One track, one room, Thursday, November 5, 2026' at 'Sundance Resort, Utah' - date and city correct, but the stored url was a dev.events regional listing; replaced with the organiser's |
| Columbus Startup Week | Columbus | — | 2026-08-26 | cycle4-links | sprkwrks.com redirects to sparkworksinnovation.com (org homepage, not the event). SparkWorks Innovation runs the event; its current event page verified by WebFetch as 'Columbus Sta |
| Cybersecurity Summit Chicago | Chicago | 2026-09-15 | 2026-08-26 | passC | cybersecuritysummit.com upcoming-summits list shows 'Sep 15 Chicago' under September 15, 2026 - date now published |
| Data in the D | Detroit | 2026-10-16 | 2026-09-01 | staleness | datainthed.org: October 16-17 2026, Detroit, two-day data conference. |
| Data Streaming Summit | San Francisco | 2026-10-07 | 2026-08-26 | cycle1-links | datastreamingsummit.io has no DNS record and no archive history; the real official site is datastreaming-summit.org. 2026 edition Oct 7-8 at Hotel Nikko SF; the 2025 edition was Se |
| Day of Data Detroit | Ann Arbor | 2026-09-12 | 2026-08-26 | cycle3r2-a | sqlsaturday.com/2026-09-12-sqlsaturday1164/ redirects to dayofdata.org/2026-09-12-dayofdata1164/, which gives the venue as Ann Arbor District Library - Downtown, 343 South Fifth Av |
| Day of Data St Louis | St. Louis | 2026-10-24 | 2026-09-01 | staleness | dayofdata.org: October 24 2026, Microsoft Innovation Hub, free. |
| DEF CON | Las Vegas | 2027-08-05 | 2026-08-26 | cycle3-accuracy | defcon.org states DEF CON 34 concluded Aug 6-9 2026 at LVCC West Hall and that DEF CON 35 is scheduled for August 5-8, 2027 in Las Vegas at LVCC West Hall. Dataset had next_date em |
| DevOps Midwest | St. Louis | 2026-09-16 | 2026-09-01 | staleness | sketchdev.io/devopsmidwest: September 16 2026, Webster University St. Louis. |
| DevOpsDays Boston | Boston | 2026-10-19 | 2026-08-26 | cycle1-links | Confirmed on devopsdays.org/events/2026-boston/welcome/: Oct 19-20 2026 at the Microsoft NERD Center in Cambridge MA. Merged the last_date carried by the removed Cambridge duplicat |
| Diamondhacks | La Jolla | 2027-04-03 | 2026-08-26 | passB | diamondhacks.acmucsd.com: 'April 3-4, 2027 Hosted by ACM at UC San Diego' (CSE Buildings and Jacobs Hall). The record had 2027-04-04..04-05, so both dates are patched one day earlier |
| Digital Offshore Conference | St. John's | 2027-04-27 | 2026-08-26 | passC | digitaloffshore.ca/overview announces DO27 for April 27-28 2027 in St. John's (DO26 March 10-11 2026 closed) - date now published |
| Digital Okanagan | Vernon | 2026-09-24 | 2026-08-26 | cycle3r2-a | meetup.com/digitalokanagan/ shows the 2026-09-24 'Geek Beers hangout at the Kal' at The Kal, 3004 30th Ave, Vernon, BC (as is the preceding 2026-08-27 meetup). Date confirmed; venu |
| DrupalCamp Colorado | Denver | — | 2026-08-26 | cycle1-links | drupalcampcolorado.org is unreachable; drupal.org's event listing gives the camp's official site as drupal-colorado.org, confirming Aug 27-28 2026 at the Lowry Conference Center, D |
| DVCon U.S. | Santa Clara | 2027-03-01 | 2026-08-26 | passB | dvcon.org: 'March 1 - 4, 2027 / Santa Clara, CA, United States' at the Hyatt Regency Santa Clara. Dates match; the city was recorded as San Jose and is patched to Santa Clara |
| EWF Annual Conference | Aurora | 2026-11-04 | 2026-08-26 | cycle4-links | ewf-usa.com redirects to ewfglobal.com. WebFetch confirms the Executive Women's Forum rebranded its domain to ewfglobal.com and still runs the EWF Annual Conference (~700 attendees |
| FIRST Championship | Houston | — | 2026-08-26 | cycle3-accuracy | firstinspires.org/programs/first-championship gives the most recent FIRST Championship as April 29 - May 2, 2026 in Houston, Texas; no later edition is published yet. Dataset corre |
| Florida Technology & Innovation Solution Summit | Tampa | 2027-08-25 | 2026-08-26 | cycle1-links | The /fltechinnovationsummit26/ vanity path 404s. Florida Chamber's event index now lists the 2027 summit page: Aug 25 2027 at the Grand Hyatt Tampa Bay. |
| FTW:SF | San Francisco | 2026-09-29 | 2026-09-01 | staleness | dev.events conference page JSON-LD: 2026-09-29 to 2026-10-01. Moved off the shared city listing. |
| Fully Connected | San Francisco | 2026-09-29 | 2026-08-26 | cycle1-links | wandb.ai/site/fully-connected/ 404s; fullyconnected.com and the W&B events page both now redirect to CoreWeave. Confirmed Sept 29 - Oct 1 2026 at Moscone South, San Francisco. |
| GameCon Canada | Edmonton | 2027-06-25 | 2026-08-26 | passC | gameconcanada.com headlines 'JUNE 25th - 27th 2027' for the Edmonton expo - date now published |
| GeekWire Seattle AI Summit | Seattle | 2026-10-27 | 2026-08-26 | unblockB | geekwire.com/calendar-event/seattleaiweek-ai-summit-2026/ loads (HTTP 200), title '#SeattleAIWeek AI Summit 2026'. JSON-LD startDate 2026-10-27T09:00-07:00 / endDate 2026-10-27T18:00-07:00, venue 'Conference Center, 2211 Alaskan Way, Seattle, WA 98121'. That is a future date not currently stored. Patch emitted. |
| GOVIT Leadership Summit & Symposium | Bloomington | 2026-11-08 | 2026-08-26 | passA | Organiser page fusionlp.org/govit-2026: 'November 8-10, 2026 DoubleTree by Hilton, Bloomington, MN' - dates and city correct, but the stored url was a dev.events regional listing; replaced with the organiser's |
| GTM Hackathon | Lehi | — | 2026-08-26 | cycle1-links | getmobly.com/gtm-hackathon was taken down after the Feb 2 2026 edition (404) and no successor page is published; pointed at the organiser's live site pending a 2027 edition page. |
| HackUSU | Logan | 2027-02-19 | 2026-08-26 | passC | huntsman.usu.edu/hackusu announces February 19-20 2027 at 3500 Old Main Hill, Logan UT, registration open - date now published |
| Hawaii International Conference on System Sciences | Waikoloa | 2027-01-05 | 2026-08-26 | passC | hicss.hawaii.edu announces HICSS January 5-8 2027 at the Hilton Waikoloa Village on the Big Island - date now published and venue is Waikoloa, not Honolulu |
| Hoya Hacks | Washington | — | 2026-08-26 | cycle4-links | hoyahacks.com redirects to hoyahacks.georgetown.domains, verified live: HoyaHacks 2027, Georgetown University, Washington DC, January 22-24 2027, registration open. |
| Humanoid Robots Summit North America | Chicago | 2026-11-03 | 2026-09-01 | staleness | November 3-4 2026, Chicago debut. Moved off the shared dev.events city listing. |
| Idaho Digital Government Summit | Boise | 2026-09-01 | 2026-08-26 | passC | events.govtech.com Idaho summit page announces Tuesday September 1 2026 at Boise Centre, 850 W Front St, registration open - date now published |
| Innovation Expo Sioux Falls | Sioux Falls | 2026-09-17 | 2026-08-26 | r2-siouxfalls | Flagged as suspicious because startupsiouxfalls.com/events/ showed nothing on 2026-09-17. The calendar is simply windowed to the current month |
| Innovation Week Saskatchewan | Saskatoon | — | 2026-08-26 | unblockB | innovationsask.ca loads (HTTP 200) but neither the homepage nor /events/ mentions Innovation Week anywhere - the stored link never names the event. The organiser does run it and has a dedicated page: innovationsask.ca/events/innovation-week/ ('Innovation Week in Saskatchewan - Innovation Saskatchewan', 'May 11-15, 2026', province-wide with sessions in Saskatoon and Regina). That edition is past, so only the URL is patched. |
| Iowa Code Camp | Des Moines | 2026-11-07 | 2026-08-26 | passA | iowacodecamp.com header: 'Iowa Code Camp November 7, 2026, Ankeny, IA'. Date correct; city was wrong (Des Moines -> Ankeny, a separate suburb) |
| Iowa Technology Summit | Des Moines | — | 2026-08-26 | r2-newly-exposed | technologyiowa.org/events/list/ 404s. The Technology Association of Iowa publishes a dedicated page for this event at /iowa-technology-summit-2026/, which is a better link than the |
| JSConf North America | Cambridge | — | 2026-08-26 | passC | jsconf.com is an unmaintained federation homepage (2019/2017 links) that points to events.linuxfoundation.org/jsconf-north-america; that page shows JSConf North America Oct 14-16 2025 at the Hyatt Regency Chesapeake Bay, Cambridge MD - not Baltimore |
| KCD SF Bay Area | Mountain View | 2026-09-01 | 2026-08-26 | cycle3r2-a | CNCF's own KCD calendar (cncf.io/kcds/) lists 'KCD San Francisco Bay Area 2026 - September 1, 2026, Mountain View, United States'. Record had both the date (2026-09-02) and the cit |
| Kentucky Digital Government Summit | Lexington | — | 2026-08-26 | passC | events.govtech.com Kentucky summit page places the event at the Marriott Griffin Gate Golf Resort, 1800 Newtown Pike, LEXINGTON KY (June 10 2026, now complete) - the recorded city Louisville is wrong |
| Lesbians Who Tech + Allies Summit | New York | 2026-10-05 | 2026-08-26 | search-unblock | lwtsquad.com/lwt-summit-2026/: Oct 5-7 2026 New York. Record ended Oct 8; end date corrected. |
| Maker Faire Brownsville | Brownsville | 2026-09-24 | 2026-08-26 | cycle1-links | Runs inside BTX Space Fest; its own page verified: Sept 24-26 2026 at the George Ramirez Performing Arts Academy, Brownsville. |
| Maker Faire Happy Valley | State College | 2026-10-03 | 2026-08-26 | cycle1-links | Own site happyvalley.makerfaire.com verified: Oct 3-4 2026 at Axemann Brewery, Bellefonte, in the Happy Valley / Central PA region. |
| Maker Faire Louisville | Louisville | 2026-10-17 | 2026-08-26 | cycle1-links | Own site louisville.makerfaire.com verified: Oct 17 2026 at the UofL Engineering Student Success and Research Building. |
| Maker Faire NW Arkansas | Fayetteville | 2026-09-12 | 2026-08-26 | cycle1-links | Own site nwa.makerfaire.com verified: Sept 12 2026 at the Fayetteville Public Library, so the host city is Fayetteville, not Bentonville. |
| Maker Faire Orange County | Costa Mesa | 2026-09-12 | 2026-08-26 | cycle1-links | Own site oc.makerfaire.com verified: Sept 12-13 2026 at the OC Fair & Event Center, Costa Mesa. |
| Maker Faire Orlando | Orlando | 2026-11-07 | 2026-08-26 | cycle1-links | Own site makerfaireorlando.com verified: Nov 7-8 2026 at the Central Florida Fairgrounds & Expo Halls. |
| Maker Faire Rochester | Rochester | 2026-11-21 | 2026-08-26 | cycle1-links | Own site rochester.makerfaire.com verified: Nov 21 2026 at the RIT Gordon Field House. |
| Maker Faire Waterloo | Waterloo | 2026-09-13 | 2026-08-26 | cycle1-links | Own site waterloomakerfaire.org verified: Sept 13 2026 at Waterloo Public Square, Uptown Waterloo. |
| MCP Community Connect | San Francisco | 2026-09-14 | 2026-09-01 | staleness | Global AI Community + Microsoft Community Hub: MCP Community Connect San Francisco, Monday September 14 2026, full-day MCP conference. Date was already correct; name and URL fixed. |
| Michigan Technology Conference | Rochester | 2026-10-28 | 2026-08-26 | passA | Organiser site mitechcon.org shows 'October 28-30, 2026 - Workshops Wednesday - Conference Thursday and Friday' at 'Oakland University, Rochester, Michigan' - dates and city correct, but the stored url was a dev.events regional listing; replaced with the organiser's |
| Microsoft Build | San Francisco | — | 2026-08-26 | cycle1-links | Verified: Build 2026 was moved from Seattle to San Francisco and held June 2-3 2026 at Fort Mason Center, shortened to two days and application-only in person. The dataset's city a |
| Mile High Dreamin' | Denver | — | 2026-08-26 | cycle3r2-a | Organiser domain milehighdreamin.com 302-redirects to www and now serves only a bare 'LWC Communities' welcome page with no event content; /events, /2026, /about and /index.html al |
| Milwaukee Tech Hub Code & Coffee | Milwaukee | 2026-09-05 | 2026-09-01 | staleness | mketech.org calendar lists September 5 2026 as upcoming; the date was filed in last_date. |
| Minneapolis Technology Summit | Minneapolis | 2026-10-22 | 2026-08-26 | cycle4-followups | Verified on eitevents.com/event_pages/minneapolis-technology-summit-2026/ |
| Mississippi Digital Government Summit | Jackson | 2026-09-09 | 2026-08-26 | passC | events.govtech.com Mississippi summit page announces September 9 2026 at Sheraton Flowood The Refuge (Jackson metro), registration open - date now published |
| MnTech Connect | St. Paul | 2027-04-01 | 2026-08-26 | unblockB | mntech.org/tech-connect/ loads (HTTP 200) and leads with 'Save the Date for 2027! Thursday, April 1, 2027 8-5pm / Saint Paul RiverCentre'. The 2026 edition (April 9, Saint Paul RiverCentre) is recapped in the past tense. Newly published date 2027-04-01, city St. Paul confirmed by the venue. Patch emitted. |
| Montreal Games Week | Montreal | 2026-11-10 | 2026-08-26 | cycle1-links | The /en path 404s; the root domain loads and confirms the 2026 edition runs Nov 10-16 2026. |
| Nashville Microsoft Community Day | Nashville | 2026-09-11 | 2026-08-26 | r2-redirects | Verified via communitydays.org/event/2026-09-11/nashville-microsoft-community-day |
| Nerd Nite Austin | Austin | — | 2026-08-26 | cycle1-links | Nerd Nite chapters live at <city>.nerdnite.com; austin.nerdnite.com verified live with current event listings. |
| Nerd Nite Chicago | Chicago | — | 2026-08-26 | cycle1-links | chicago.nerdnite.com verified live with its own event listings. |
| Nerd Nite Denver | Denver | — | 2026-08-26 | cycle1-links | denver.nerdnite.com verified live with its own ticket links. |
| Nerd Nite Seattle | Seattle | — | 2026-08-26 | cycle1-links | seattle.nerdnite.com verified live with its own event schedule. |
| Nerd Nite Toronto | Toronto | — | 2026-08-26 | cycle1-links | toronto.nerdnite.com verified live with its own event listings. |
| Nerd Nite Vancouver | Vancouver | — | 2026-08-26 | cycle1-links | vancouver.nerdnite.com verified live with its own event listings at The Fox Cabaret. |
| New Mexico Tech Summit | Albuquerque | 2026-09-24 | 2026-08-26 | search-unblock | NMTC Tech Summit Sept 24 2026, Sandia Resort & Casino, 700+ attendees. Record had no date. |
| New Orleans Entrepreneur Week | New Orleans | 2027-03-08 | 2026-08-26 | passC | noew.org carries a 'SAVE THE DATE' for NOEW 2027 on March 8-13 2027 in New Orleans (2026 ran March 9-14) - date now published |
| New Tech Seattle | Seattle | — | 2026-08-26 | unblockB | The stored link geekwire.com/calendar/ loads (HTTP 200) but is GeekWire's generic community calendar - the string 'New Tech' appears zero times on it, so the link never names the event. The organiser's own site newtechnorthwest.com is live and lists 'New Tech Seattle September 2026 Meetup - September 15, 2026' plus 'Join us at the next monthly New Tech Seattle event'. URL patched to the organiser; left undated because it is a monthly series. |
| NVIDIA GTC | San Jose | 2027-03-15 | 2026-08-26 | cycle3-accuracy | nvidia.com/gtc shows GTC 2027 as 'March 15-18' in San Jose ('The GTC AI conference returns to San Jose in March'). Confirmed verbatim on a second read of the same page. Dataset end |
| NVTC Tech100 Celebration | McLean | 2026-12-15 | 2026-08-26 | orchestrator | nvtc.org JSON-LD: Tech100 Celebration, 2026-12-15 18:00-20:00, Hilton McLean Tysons Corner, McLean VA. Date correct, city was Reston. |
| ODSC East | Boston | 2027-05-10 | 2026-08-26 | unblockB | odsc.com/ is a generic landing page shared with the ODSC West record. odsc.com/boston/ redirects to odsc.ai/east/ (HTTP 200), which states 'Center, Boston, MA / May 10-12th, 2027'. Newly published dates 2027-05-10 to 2027-05-12 in Boston, plus an event-specific URL. Patch emitted. |
| ODSC West | San Francisco | 2026-10-27 | 2026-08-26 | unblockB | odsc.com/california/ redirects to odsc.ai/west/ (HTTP 200), title 'ODSC AI West 2026 - California', hero reads 'Oct 27 - Oct 29 / SAN FRANCISCO / 3 days - 7 tracks - 250+ speakers / Register Now'. Newly published dates 2026-10-27 to 2026-10-29 in San Francisco, plus an event-specific URL replacing the shared odsc.com root. Patch emitted. |
| Oracle AI World | Las Vegas | 2026-10-25 | 2026-08-26 | orchestrator | oracle.com/ai-world/ states 'October 25-28 / Las Vegas'. CloudWorld renamed to AI World; /cloudworld/ 301s here. |
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
| PlatformCon Live Day San Francisco | San Francisco | 2027-02-24 | 2026-08-26 | passB | platformcon.com world tour lists 'PC Live Day San Francisco 24 February 2027' as a single day; the record had a two-day span ending 2027-02-25, so the end date is patched to 2027-02-24 |
| PNW Day of Data | Vancouver | 2026-11-06 | 2026-08-26 | passA | Organiser page dayofdata.org/2026-11-07-dayofdata1149/ shows the main event 07 November 2026 at Washington State University Vancouver, Vancouver, Washington, with an optional all-day Friday pre-conference (Nov 6), so the Nov 6-7 span is right; the stored url was a dev.events regional listing and was replaced with the organiser's |
| Polyglot Unconference | Vancouver | — | 2026-08-26 | cycle3r2-b | polyglotconf.com (organiser site) still advertises 'May 25th 2019, Vancouver' as its event; /2026 and /about return 404. No 2026 edition is published anywhere on the organiser's si |
| Propelify Innovation Festival | Hoboken | — | 2026-08-26 | search-unblock | hobokennj.gov: ninth annual Propelify, June 27 2026, Maxwell Place Park. Record's month said October - it is a June festival. |
| PyTorch Conference | San Jose | 2026-10-20 | 2026-08-26 | cycle4-links | The Linux Foundation URL redirects to the renamed pytorch-conference-north-america page, verified as 'PyTorch Conference North America', San Jose CA, October 20-21 2026 - matches t |
| QA or the Highway | Columbus | 2027-06-11 | 2026-08-26 | passC | qaorthehwy.com announces June 11 2027 for the Columbus OH conference - date now published |
| Reality Hack at MIT | Cambridge | — | 2026-08-26 | cycle4-links | mitrealityhack.com redirects to realityhackatmit.com, verified as the live official site: Reality Hack at MIT, MIT campus Cambridge MA, next edition January 2027. |
| Rocky Mountain Technology Summit | Denver | 2027-05-25 | 2026-08-26 | passC | technologysummit.net/rocky.html announces the 9th annual summit for May 25 2027, 9am-4pm at Embassy Suites Denver Downtown - date now published |
| SANS DC Metro | Bethesda | 2026-09-28 | 2026-08-26 | cycle1-links | Per-event SANS page verified: SANS DC Metro September 2026, Sept 28 - Oct 3 2026 at The Bethesdan Hotel, Bethesda MD. |
| SANS DFIR Summit & Training | Arlington | 2026-10-15 | 2026-08-26 | cycle1-links | Per-event SANS page verified: Oct 15-22 2026 (summit 15-16, training 17-22) at the Hilton Arlington Rosslyn. |
| SANS Miami | Coral Gables | 2026-10-26 | 2026-08-26 | cycle1-links | Per-event SANS page verified: Oct 26-31 2026 at the Hyatt Regency Coral Gables. |
| SANS Network Security | Las Vegas | 2026-09-21 | 2026-08-26 | cycle1-links | Per-event SANS page verified: Sept 21-26 2026 at Caesars Palace, Las Vegas. |
| SANS Raleigh | Raleigh | 2026-11-02 | 2026-08-26 | cycle1-links | Per-event SANS page verified: Nov 2-7 2026 at the Embassy Suites Raleigh-Durham Research Triangle in Cary NC. |
| SANS San Francisco | San Francisco | 2026-11-02 | 2026-08-26 | cycle1-links | Per-event SANS page verified: Nov 2-7 2026 at the Hilton Financial District San Francisco. |
| Seattle Day of Data | Seattle | 2026-11-12 | 2026-08-26 | passA | Organiser page dayofdata.org/2026-11-12-dayofdata1155 shows '12 November 2026', Seattle - date and city correct, but the stored url was a dev.events city listing; replaced with the organiser's |
| SecTor | Toronto | 2026-10-06 | 2026-08-26 | cycle3-accuracy | TASK B RESOLVED. blackhat.com/sector (read through a text-extraction proxy, the site 403s bots directly) states SecTor 2026 runs 'October 6-8, 2026' at the Metro Toronto Convention |
| SecureWorld St. Louis | St. Louis | 2026-09-02 | 2026-08-26 | passC | secureworld.io/events/st-louis-mo-2026 gives event date 2026-09-02 (distinct from the 2026-07-08 call-for-speakers deadline) - upcoming date now published |
| ServiceNow Knowledge | Las Vegas | 2027-05-04 | 2026-08-26 | cycle3-accuracy | servicenow.com/events/knowledge.html (read through a text-extraction proxy; the page 403s bots directly) states 'Knowledge 2027 is May 4-6 in Las Vegas', marking the 20th anniversa |
| Showerhacks | San Francisco | 2026-09-26 | 2026-08-26 | passA | Organiser site showerhacks.org (found via the dev.events listing stored as the url) shows 'September 26th 2026, 10AM - 10PM, San Francisco'. Record had Oct 3 - a week late. Aggregator url also replaced with the organiser's |
| Small Satellite Conference | Salt Lake City | 2027-08-15 | 2026-08-26 | passC | smallsat.org lists save-the-dates after the 40th annual (Aug 23-26 2026, Salt Palace Convention Center): August 15-18 2027, then 2028 and 2029 - next date now published |
| South Dallas Maker Faire | Dallas | 2026-11-07 | 2026-08-26 | cycle1-links | fortworth.makerfaire.com 301-redirects to southdallas.makerfaire.com; the faire has been rebranded South Dallas Maker Faire and its own site makes no mention of Fort Worth. Date un |
| Space Symposium | Colorado Springs | 2027-04-12 | 2026-08-26 | cycle3-accuracy | spacesymposium.org (read through a text-extraction proxy; the site 403s bots directly) publishes the next Space Symposium as April 12-15, 2027 at The Broadmoor, Colorado Springs, C |
| TartanHacks | Pittsburgh | — | 2026-08-26 | unblockB | www.tartanhacks.com is dead: HTTP 402 'Payment required / DEPLOYMENT_DISABLED' from Vercel (78-byte body); tartanhacks.org answers HTTP 522. The event itself is not dead - organiser ScottyLabs (scottylabs.org) is live, footer '(c) 2026' with 2026 recruitment open, and its homepage headline is 'We host Pittsburgh's largest annual hackathon,' rendered next to /assets/tartanhacks-logo-gWC8J4Rv.svg. URL patched to the live organiser page; no date is published there. |
| Tech Tomorrow | Columbus | 2026-09-09 | 2026-08-26 | cycle4-links | cio-tomorrow.com redirects to techtomorrow.events, which states 'Tech Tomorrow 2026 debuts as the reimagined CIO Tomorrow', building on a 24-year legacy. Columbus OH, September 9 2 |
| TECHSPO Chicago | Chicago | — | 2026-08-26 | cycle4-final | techspochicago.com is flaky |
| TennoCon | London | 2027-07-16 | 2026-08-26 | passC | tennocon.com recaps the concluded 2026 event and announces 'July 16-17 2027' with a countdown - date now published |
| TokioConf | Portland | — | 2026-08-26 | orchestrator | tokioconf.com publishes no 2027 dates - 'towards the end of April', 'sign up when dates are finalized'. Stored dates came from dev.events; cleared. |
| Umbraco US Festival | Chicago | 2026-09-30 | 2026-09-01 | staleness | umbracofestival.us: September 30 - October 1 2026, 800 Fulton Market Chicago. |
| VIATEC AI Meetup | Victoria | 2026-09-10 | 2026-08-26 | r2-newly-exposed | members.viatec.ca/tech-events 404s. The live calendar is members.viatec.ca/event-calendar, which confirms the stored 2026-09-10 date: 'VIATEC AI Meetup |
| Vibe Coding Con | Las Vegas | 2026-10-27 | 2026-08-26 | passA | Organiser site vibecodingcon.ai shows 'October 27-28, 2026' at 'Red Rock Resort, Las Vegas' - dates and city correct, but the stored url was a dev.events regional listing page, not the event; replaced with the organiser's |
| VSLive! @ Microsoft HQ | Redmond | 2027-08-02 | 2026-08-26 | unblockB | The stored microsofthq-2026 page shows July 27-31, 2026, now past. vslive.com/events/microsofthq-2027/home.aspx exists and loads (HTTP 200), titled 'Microsoft HQ 2027 -- Visual Studio Live!', advertising 'AUG 2-6, 2027' with 'campus experiences waiting for you in Redmond, WA' and the Hyatt Regency Bellevue as conference hotel. URL and newly published dates 2027-08-02 to 2027-08-06 patched. |
| Yukon Innovation Week | Whitehorse | — | 2026-08-26 | search-unblock | July 6-10 2026 at Yukonstruct. Record's last_date was a year stale and its month was May. |
| Yukonstruct Maker Academy | Whitehorse | — | 2026-08-26 | search-unblock | A rolling series of Maker Academy bootcamps plus Maker Madness camps and Repair Cafes, not one annual event. Cadence corrected to rolling. |

## confirmed (737)

Checked and correct as recorded.

| event | city | next date | checked | cycle | evidence |
|---|---|---|---|---|---|
| 3686 | Nashville | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| 3rd Coast Venture Summit | New Orleans | 2027-03-09 | 2026-08-26 | passB | 3rdcoastventuresummit.com: 'MARCH 9-10, 2027' in New Orleans |
| 43North Finals | Buffalo | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| 43North Speaker Series | Buffalo | — | 2026-08-26 | passC | luma.com/43north loads, lists 43North speaker-series/fireside events in Buffalo; no dated next edition published |
| a2Tech360 | Ann Arbor | 2026-09-22 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| AAAI Conference on Artificial Intelligence | Montreal | 2027-02-16 | 2026-08-26 | passB | aaai.org/conference/aaai/aaai-27/: 'February 16 - February 23, 2027', Montreal, Canada (Palais des Congres de Montreal) |
| Accelerate Conference | Flowood | 2026-11-10 | 2026-08-26 | passA | accelerate.innovate.ms: 'Save the Date: November 10-11, 2026' at 'The Refuge Hotel and Conference Center at Sheraton Flowood, 2200 Refuge Blvd, Flowood, MS 39232' - matches record |
| AccelerateOTT | Ottawa | — | 2026-08-26 | passC | accelerateott.ca live, 'Ottawa's Premier Entrepreneurship Event', references AccelerateOTT 2026 waitlist but publishes no calendar dates |
| Adobe MAX | Miami Beach | 2026-11-10 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Advertising Week New York | New York | 2026-10-05 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| AFROTECH Conference | Houston | 2026-11-02 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Agile Open Northwest | Portland | — | 2026-08-26 | passC | agileopennorthwest.org live, AONW 2026 was March 6-7 in Portland (already past); no next edition date published yet |
| AgTech Week | Fargo | — | 2026-08-26 | passC | agtechweekfargo.com live, Fargo ND, says only 'Coming June 2027' with no specific days |
| AI & Big Data Expo North America | San Jose | 2027-06-16 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| AI Builder Lab Meetup | Sioux Falls | 2026-09-17 | 2026-08-26 | passA | startupsiouxfalls.com series calendar JSON lists next occurrence 2026-09-17 (then 10-15, 11-19) — matches record |
| AI Con USA | Seattle | 2027-06-06 | 2026-08-26 | unblockA | aiconusa.techwell.com returns 200 via curl with page title 'AI Con USA / June 6-11, 2027 / Seattle, WA and Online' and body copy 'June 6-11, 2027'; the venue is described as a Seattle hotel close to Lake Union and Elliott Bay. Matches stored 2027-06-06 / 2027-06-11 and city Seattle. |
| AI in Education Summit | Mountain View | 2026-10-24 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| AI Product Summit Silicon Valley | San Jose | 2027-04-15 | 2026-08-26 | unblockA | The stored URL world.productledalliance.com is the portfolio index; the event's own page is https://world.productledalliance.com/location/ai, title 'AI Product Summit / Silicon Valley', which returns 200 with JSON-LD "startDate":"2027-04-15T07:00:00.000Z" and "endDate":"2027-04-15T07:00:00.000Z" (07:00Z is midnight America/Los_Angeles, so a single day, April 15 2027) and body copy 'April 15, 2027'. Its page data carries "city":"San Jose", and the index page's event record agrees (dateFrom/dateTo 1807772400000, timezone America/Los_Angeles). Matches stored 2027-04-15 / 2027-04-15 and city San Jose. Note the sibling Chief Product Officer Summit Silicon Valley runs the day before, April 14 2027 - a different event. |
| AI Rising Conference | Columbus | 2026-10-19 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Ai4 | Las Vegas | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Airflow Summit | Austin | 2026-08-31 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Alabama Public Sector Cybersecurity Summit | Montgomery | — | 2026-08-26 | passC | events.govtech.com page live for Montgomery (Embassy Suites, 300 Tallapoosa St); 2026 edition marked complete, 'Join us next year' - no 2027 date yet |
| Alaska Entrepreneurship Week | Anchorage | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Alaska SBDC Summit | Anchorage | — | 2026-08-26 | passC | summit.aksbdc.org live, Alaska SBDC summit at The Wildbirch Hotel (Anchorage); last edition March 6 2026 already past, no next date |
| ALL IN | Montreal | 2026-09-16 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| All Things Open | Raleigh | 2026-10-19 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| AlphaLab Demo Day | Pittsburgh | — | 2026-08-26 | search-unblock | Real and active: AlphaLab's 2026 cohort of 20 startups presented to 300+ founders, investors and mentors. No date published for the next demo day, so it correctly stays undated. |
| API World | Santa Clara | 2026-09-01 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| apidays Toronto | Toronto | 2026-09-09 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Apple Worldwide Developers Conference | Cupertino | — | 2026-08-26 | passC | developer.apple.com/wwdc26/ live and describes WWDC26 (keynote, sessions, group labs); no dates for the next edition published yet |
| Arizona Tech Week | Phoenix | — | 2026-08-26 | passC | arizonaascent.com page describes Arizona Tech Week 2026 across Phoenix/Scottsdale/Tempe/Tucson, anchor events April 7-9 2026 (past); no next edition dated |
| Arizona Technology Summit | Scottsdale | — | 2026-08-26 | passC | technologysummit.net/arizona.html live, 17th Annual summit at Grand Hyatt Scottsdale Resort, Scottsdale AZ; Aug 25 2026 edition just past, no next date |
| ASU+GSV Summit | San Diego | 2027-04-04 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Atlanta Tech Week | Atlanta | 2027-08-15 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Atlassian Team | Anaheim | — | 2026-08-26 | passC | events.atlassian.com/team live: Team '26 at Anaheim Convention Center, May 5-7 2026 (past); no next edition date yet |
| Augmented Enterprise Summit | Atlanta | 2026-10-13 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Austin Tech Week | Austin | 2026-10-26 | 2026-08-26 | passA | austintech.com: 'Austin Tech Week October 26 - 30, 2026' — matches record |
| Autonomous Nation | Wheatland | 2026-09-17 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| AWE USA | Long Beach | 2027-06-14 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| AWS re:Invent | Las Vegas | 2026-11-30 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| AWS Summit Toronto | Toronto | — | 2026-08-26 | passC | aws.amazon.com summit page for Toronto, Metro Toronto Convention Centre; June 2-3 2026 edition marked concluded, no next date |
| Baltimore Health Tech Startup Symposium | Baltimore | — | 2026-08-26 | unblockB | ventures.jhu.edu event page loads (HTTP 200), titled 'Baltimore Health Tech Startup Symposium - Johns Hopkins Technology Ventures'. JSON-LD gives startDate 2026-05-01T09:30-04:00 / endDate 2026-05-01T11:30-04:00; that edition is already past and no next edition is published. Right event, right city (Johns Hopkins, Baltimore). No date to patch in. |
| Bank Technology & Operations Conference & Showcase | Wichita | — | 2026-08-26 | passC | ksbankers.com page live, KBA conference at Hyatt Regency Wichita; Feb 9-10 2026 edition past, no next date published |
| BarCamp Philly | Philadelphia | 2026-10-17 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| BC Technology Impact Awards | Vancouver | 2026-10-29 | 2026-08-26 | passA | wearebctech.com/technology-impact-awards-tias/: 'October 29, 2026 / Parq Vancouver' — matches record |
| BearHacks | Mississauga | — | 2026-08-26 | unblockB | bearhacks.com loads (HTTP 200), title 'BearHacks 2026'. It is a React shell, so I read the app bundle /assets/index-CkbZRNgR.js: it carries the hero copy 'April 24th - 26th - Sheridan HMC Campus' and the FAQ line 'Sheridan College's Hazel McCallion Campus in Mississauga, Ontario, Canada', confirming the Mississauga venue. The April 2026 edition is past and no forward date is published, so nothing to patch. |
| Best of Tech Awards | Cleveland | 2026-09-14 | 2026-08-26 | passA | greatercle.com/tech/ 'Best of Tech Day & Awards ... Date: September 14, 2026' — matches record (curl bypassed the 403) |
| Big Sky Dev Con | Bozeman | — | 2026-08-26 | passC | bigskydevconf.com live, Montana Programmers conference in Bozeman; July 24-25 2026 edition past, no next date |
| BigRed//Hacks | Ithaca | 2026-10-02 | 2026-08-26 | passA | bigredhacks.com is an SPA; its JS bundle FAQ states 'BigRed//Hacks 2026 will take place October 2nd - 4th on Cornell University's Ithaca Campus' — matches record |
| Billington CyberSecurity Summit | Washington | 2026-09-08 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Bio-IT World Conference & Expo | Boston | 2027-05-18 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Birmingham Women in Technology | Birmingham | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Bitcoin Conference | Nashville | 2027-07-15 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Black Tech Week | Cincinnati | — | 2026-08-26 | passC | blacktechweek.com live, Cincinnati (Queen City); July 14-16 2026 edition past, no next date published |
| Blockchain Futurist Conference | Toronto | — | 2026-08-26 | passC | futuristconference.com live, Toronto edition promoted for 2026 with early-bird tickets but no calendar dates given |
| Boise Code Camp | Boise | — | 2026-08-26 | passC | boisecodecamp.com resolves and serves the Boise Code Camp page (minimal/JS-rendered body); no date published |
| Boise Entrepreneur Week | Boise | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Boston Data and AI Saturday | Boston | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Boston Festival of Indie Games | Boston | 2026-10-03 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Boston Python User Group | Cambridge | — | 2026-08-26 | passC | meetup.com/bostonpython loads, Cambridge MA, 10,176 members with regular Python Over Coffee / office hours - active recurring series |
| Boulder Startup Week | Boulder | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| BrickHack | Rochester | — | 2026-08-26 | passC | brickhack.io live, RIT hackathon in Rochester NY; latest listed edition Feb 22-23 2025 at RIT SHED, no next date yet |
| BSides 312 | Chicago | — | 2026-08-26 | passC | bsides312.org live, Chicago (Irish American Heritage Center); explicitly 'Date: TBD, 2027', check back in November |
| BSides Atlanta | Atlanta | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| BSides Boulder | Boulder | — | 2026-08-26 | passC | bsidesboulder.org live, Boulder CO; June 13 2026 edition wrapped ('see you next year'), no next date |
| BSides Bozeman | Bozeman | 2026-10-03 | 2026-08-26 | passA | bsidesbozeman.com: 'Saturday, October 3, 2026 9:00 AM - 5:00 PM, Bozeman, Montana' — matches record |
| BSides Buffalo | Buffalo | — | 2026-08-26 | passC | bsidesbuffalo.org live, 'held annually in Buffalo, NY'; June 6 2026 edition past, no next date |
| BSides Charleston | Charleston | 2026-11-07 | 2026-08-26 | passA | bsidescharleston.org: 'November 7, 2026, Beatty Center / College of Charleston' — matches record |
| BSides Charlotte | Charlotte | — | 2026-08-26 | passC | bsidesclt.org live, Charlotte NC 501(c)3; March 28-29 2026 edition past, no next date |
| BSides Chicago | Chicago | — | 2026-08-26 | passC | bsideschicago.org live, Chicago; site says the con is taking 2026 off and returns in 2027, no dates given |
| BSides Cleveland | Cleveland | 2026-09-26 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSides COS | Colorado Springs | 2026-10-24 | 2026-08-26 | passA | bsides.org/event/bsides-cos-2026/ shows Date: October 24 — matches record |
| BSides Denver | Denver | 2026-09-11 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSides Des Moines | Des Moines | — | 2026-08-26 | passC | bsidesdsm.org live, Des Moines area (Ankeny venue); June 13 2026 edition past, no next date |
| BSides Detroit | Detroit | — | 2026-08-26 | passC | bsidesdetroit.org live, Detroit; May 30 2026 edition past (sold out), no next date |
| BSides Edmonton | Edmonton | 2026-09-24 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSides Flood City | Johnstown | 2026-11-12 | 2026-08-26 | passA | bsides.org/event/bsides-flood-city/ shows Date: November 12 - matches record |
| BSides Fredericton | Fredericton | 2026-10-27 | 2026-08-26 | passA | bsidesfredericton.ca: 'Conference is October 27-28 2026!' — matches record |
| BSides Halifax | Halifax | — | 2026-08-26 | passC | halifaxbsides.ca live, Halifax NS; Nov 13 2025 edition sold out, organisers collecting feedback to plan 2026 - no date yet |
| BSides Idaho Falls | Idaho Falls | 2027-04-16 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| BSides Knoxville | Knoxville | — | 2026-08-26 | passC | 10-sec.org/bsides-knoxville live, Knoxville TN; May 22 2026 edition past, no next date |
| BSides Las Vegas | Las Vegas | — | 2026-08-26 | passC | bsideslv.org live, Las Vegas at The Tuscany; Aug 3-5 2026 edition just past, no next date |
| BSides London Canada | London | — | 2026-08-26 | passC | bsideslondon.ca live, explicitly London Ontario Canada; May 23 2026 edition past, no next date |
| BSides Memphis | Memphis | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| BSides MKE | Milwaukee | — | 2026-08-26 | passC | bsidesmke.org live, Milwaukee WI; April 3 2026 edition past, no next date |
| BSides Montreal | Montreal | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSides NoVA | Arlington | 2026-10-30 | 2026-08-26 | passA | bsidesnova.org: 'SAVE THE DATE. OCTOBER 30 - 31, 2026 ... back for our 10th year! Join us October 30-31' — dates match record |
| BSides Orlando | Orlando | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSides Philly | Philadelphia | 2026-12-11 | 2026-08-26 | passB | bsidesphilly.org renders only its title via fetch; the bsides.org global event listing shows BSides Philly 'December 11 @ 08:00 - 18:00' 2026 at Live! Casino & Hotel Philadelphia, 900 Packer Ave, Philadelphia PA - matches 2026-12-11 |
| BSides Pittsburgh | Pittsburgh | 2027-07-09 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| BSides RDU | Raleigh | 2026-12-18 | 2026-08-26 | passB | bsidesrdu.org returns 403 to fetch; the bsides.org event listing shows BSides RDU 'December 18' 2026, Raleigh/Durham NC - matches 2026-12-18. Note bsides.org flags the entry as 'Unconfirmed' |
| BSides Regina | Regina | — | 2026-08-26 | passC | bsidesregina.ca live, Regina SK; March 18-19 2026 edition past, no next date |
| BSides Roanoke | Roanoke | — | 2026-08-26 | passC | bsidesroa.org live, Roanoke VA; June 5 2026 edition past, no next date |
| BSides Saskatoon | Saskatoon | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| BSides SATX | San Antonio | — | 2026-08-26 | passC | bsidessatx.com live, San Antonio TX at St. Mary's University; says 'Returning in 2027' with no dates set |
| BSides Seattle | Seattle | — | 2026-08-26 | passC | bsidesseattle.com live, Seattle-area con (Feb 27-28 2026 at Building 92, Redmond WA - metro naming as with other BSides rows); edition past, no next date |
| BSides SLC | Salt Lake City | — | 2026-08-26 | passC | bsidesslc.org live, Salt Lake City area (Sandy UT venue); April 9-10 2026 edition past, no next date |
| BSides South Florida | Fort Lauderdale | — | 2026-08-26 | passC | bsidessouthflorida.org live, Marriott Harbor Beach Resort (Fort Lauderdale); next edition announced only as 'May 2027' with no exact dates |
| BSides South Jersey | Glassboro | — | 2026-08-26 | passC | bsidessouthjersey.org live, Rowan University, Glassboro NJ; April 18 2026 edition past, 2027 section says details coming soon |
| BSides St. John's | St. John's | 2026-09-17 | 2026-08-26 | passA | bsides.org event page shows Date: September 17, venue in Canada — matches record |
| BSides Tampa | Tampa | — | 2026-08-26 | passC | bsidestampa.net live, USF Marshall Student Center Tampa FL; May 15-16 2026 edition past, no next date |
| BSides TC | Minneapolis | 2026-10-23 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| BSides Toronto | Toronto | 2026-10-03 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| BSides Vancouver Island | Victoria | 2026-09-25 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| BSidesAugusta | Augusta | 2026-10-24 | 2026-08-26 | passA | bsides.org page titled 'BSidesAugusta - Augusta, GA, USA' shows Date: October 24 — matches record |
| BSidesCache | Logan | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| BSidesCharm | Baltimore | 2027-04-24 | 2026-08-26 | passB | bsidescharm.org: '24-25 April 2027', Sheraton Baltimore North, 903 Dulaney Valley Rd, Towson MD (Baltimore area) |
| BSidesCT | Fairfield | 2026-09-26 | 2026-08-26 | passA | bsides.org event page shows Date: September 26, Fairfield, CT, USA — matches record |
| BSidesDFW | Dallas | 2026-11-07 | 2026-08-26 | passA | bsides.org/event/bsidesdfw-5/ shows Date: November 7 — matches record |
| BSidesGreenville | Greenville | — | 2026-08-26 | passA | bsides.org event page shows Date: August 29, Greenville, SC USA — matches record |
| BSidesKC | Kansas City | — | 2026-08-26 | passC | bsideskc.org live, Kansas City Kansas Community College, Kansas City KS; main event 4/25/2026 past, no next date |
| BSidesNEPA | Wilkes Barre | 2026-09-12 | 2026-08-26 | passA | bsides.org event page shows Date: September 12, Wilkes Barre, PA United States — matches record |
| BSidesSF | San Francisco | — | 2026-08-26 | passC | bsidessf.org live, San Francisco; 'BSidesSF 2026 is happening -- March 21-22' already past, no next date |
| BSidesSGF | Springfield | 2027-03-30 | 2026-08-26 | passB | bsides.org event page: 'March 30, 2027', Springfield, MO, USA - single day, matches the record |
| BSidesSTL | St. Louis | — | 2026-08-26 | passC | bsidesstl.org live, Saint Louis MO; organisers state no 2026 conference (blockers) and aim to resume in 2027 - no dates |
| BSidesStPete | St. Petersburg | 2027-01-29 | 2026-08-26 | passB | bsides.org event page: 'Start: January 29, 2027', 'End: January 30, 2027', St. Petersburg, FL USA |
| Buffalo Game Space Game Development Meeting | Buffalo | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Build48 | St. John's | 2027-03-20 | 2026-08-26 | passB | genesiscentre.ca/build48: 'March 20 + 21, 2027', venue 'To be announced', St. John's NL. Caveat: a schedule block lower on the same page still shows Saturday March 28 / Sunday March 29 from a prior edition, so worth a re-check nearer the date |
| Business Value Builder Summit | Huntington | 2026-09-17 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Cactusforce | Scottsdale | 2027-01-21 | 2026-08-26 | passB | cactusforce.com: 'Thursday, January 21st and Friday, January 22nd, 2027' at SkySong Innovation Center, Scottsdale Arizona |
| Cal Hacks | San Francisco | — | 2026-08-26 | passC | calhacks.io live, Cal Hacks 12.0 at Palace of Fine Arts, San Francisco, Oct 24-26 2025 (past); no next edition dated |
| Calagator Portland Tech Calendar | Portland | — | 2026-08-26 | passC | calagator.org live, 'unified calendar for the technology community of Portland, Oregon', actively listing events into Sept 2026 |
| CalgaryHacks | Calgary | — | 2026-08-26 | passC | calgaryhacks2026.devpost.com describes the University of Calgary ICT Building hackathon, Feb 14-15 2026, now marked 'This hackathon has ended'; no next edition page yet |
| Canadian Game Awards | Toronto | — | 2026-08-26 | passC | canadiangameawards.ca live, 6th edition at John Bassett Theatre Toronto, May 21 2026 (past); no next date |
| CanSecWest | Vancouver | 2026-09-26 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| CascadiaJS | Seattle | — | 2026-08-26 | passC | cascadiajs.com live, Seattle; June 2026 edition sold out and past, 'See you in 2027' with no dates |
| CDL Super Session | Toronto | — | 2026-08-26 | passC | creativedestructionlab.com/super-session live, annual Toronto showcase of graduating CDL companies; page still on June 24 2025 edition, no next date |
| CED Venture Connect | Durham | — | 2026-08-26 | passC | cednc.org/venture-connect live, Durham NC; VC26 was March 24-25 2026 (past), no next date |
| Central Ohio InfoSec Summit | Columbus | — | 2026-08-26 | passC | infosecsummit.com live, Hilton Columbus Downtown, Columbus OH; June 8-10 2026 edition past, no next date |
| Central Ohio Software Symposium | Columbus | — | 2026-08-26 | passC | nofluffjuststuff.com/columbus live and describes the Columbus OH NFJS symposium; latest listed edition Sep 29-Oct 1 2023, 2026 NFJS tour partners shown, no new Columbus date |
| CES | Las Vegas | 2027-01-06 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Charleston Digital Connect | Charleston | 2026-09-17 | 2026-08-26 | passA | charlestondigital.com upcoming events lists 'Charleston Digital Connect Sep 17, 8:30AM' — matches record |
| ChaTech Tech Tuesdays | Chattanooga | — | 2026-08-26 | passC | chatech.org live, Chattanooga tech council, lists 'Tech Tuesdays' under Communities; recent 2026 content, no fixed dates published |
| Chattanooga Entrepreneur Week | Chattanooga | — | 2026-08-26 | passC | chabusiness.org (Small Business Resource Center, Chattanooga) live and carries a Chattanooga Entrepreneur Week section; no dates published |
| Chi Hack Night | Chicago | — | 2026-08-26 | passC | chihacknight.org live, Chicago weekly civic-tech event, sessions listed through Aug 2026 |
| CHM Live | Mountain View | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| CHROMA | Tulsa | 2026-09-24 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Cincy AI Week | Cincinnati | — | 2026-08-26 | passC | joinaiweek.com/cincy live, Cincinnati OH; June 9-11 2026 sold out and past, 'Returning June 2027' with no exact dates |
| CIPS Ontario Women in Technology Conference | Toronto | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Circuit Hacking Monday at Noisebridge | San Francisco | — | 2026-08-26 | passC | noisebridge.net wiki live (last edited June 7 2026), San Francisco hackerspace, Circuit Hacking Monday listed as weekly Mondays 7pm |
| Cisco Live US | Las Vegas | 2027-06-06 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Clojure/conj | Charlotte | 2026-09-30 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Cloud Nirvana Columbus | Columbus | 2026-09-16 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Coastal Innovation Challenge | New Orleans | — | 2026-08-26 | passC | ideavillage.org/coastal-innovation-challenge live, Idea Village New Orleans (900 Camp St); 'Applications open soon', no dates |
| Code & Supply | Pittsburgh | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Code for America Summit | Washington | — | 2026-08-26 | unblockB | summit.codeforamerica.org loads (HTTP 200). Hero reads 'Marriott Marquis / Chicago / May 7-8, 2026' and the post-event note says 'We're so glad you joined us at our first Summit in Chicago! ... See you in 2027 in Washington, D.C.!' - so the stored city Washington DC matches the next edition. No 2027 dates published yet, nothing to patch. |
| Code for Boston Hack Night | Cambridge | — | 2026-08-26 | passC | codeforboston.org live, weekly Tuesday 7pm hack nights, in-person first and third Tuesdays at the CIC; recurring, no fixed dates |
| Code Platoon | Chicago | — | 2026-08-26 | passC | codeplatoon.org live, veteran/military-spouse coding bootcamp, One South Dearborn Chicago IL; rolling cohorts, no dates published |
| Code4Lib | Philadelphia | — | 2026-08-26 | passC | 2026.code4lib.org live, Philadelphia PA, March 2-5 2026 edition past; no 2027 site/date yet |
| CodeCrush | Omaha | — | 2026-08-26 | passC | aiminstitute.org/codecrush live, AIM Institute Omaha NE iSTEM immersion; two cohorts a year, no calendar dates published |
| CodeMash | Sandusky | 2027-01-12 | 2026-08-26 | passB | codemash.org shows CodeMash Great Lakes January 12-15, 2027 at Kalahari Resort, Sandusky, Ohio |
| CodeMash East | Spotsylvania | 2027-06-17 | 2026-08-26 | passB | codemash.org: 'CodeMash East, June 17-18, 2027', Kalahari Resort, Spotsylvania, Virginia |
| CodeRED | Houston | 2026-10-10 | 2026-08-26 | unblockA | uhcode.red returns 200 (title 'CodeRED / University of Houston Hackathon') but is a client-rendered shell with no date. Corroborated by MLH: mlh.io/seasons/2027/events event record slug 'codered-orion', name 'CodeRED Orion', startsAt 2026-10-10T13:00:00Z, endsAt 2026-10-11T20:00:00Z, dateRange 'OCT 10 - 11', venue Houston, Texas, US, linking out to https://uhcode.red/ (same URL as the record). Matches stored 2026-10-10 / 2026-10-11 and city Houston. Date sourced from MLH, not the organiser. |
| CodeStock | Knoxville | 2027-04-08 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| Colorado Startup Week | Denver | 2026-09-14 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Colorado Technology Association APEX Awards | Denver | — | 2026-08-26 | passC | coloradotechnology.org/apex-awards live, Denver CO; Feb 18 2026 Colorado Tech Summit + APEX Awards past (sold out), no next date |
| Computing Foundations Workshop Series | Cookeville | 2026-08-27 | 2026-08-26 | passA | rcd.tntech.edu/2026-08-27-tntech shows select Thursdays Aug 27 - Nov 19 2026, Bruner Hall, Cookeville TN — matches record |
| ConFoo Montreal | Montreal | 2027-02-24 | 2026-08-26 | passB | confoo.ca/en/2027: 'February 24-26, 2027', Montreal, Canada, Hotel Bonaventure |
| ConHacks | Waterloo | — | 2026-08-26 | passC | conhacks.io live, Conestoga College Waterloo Campus; April 28-30 2026 edition past, ConHacks 2027 referenced without dates |
| CONNECT: Networking for Entrepreneurs | Jackson | 2026-09-03 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Connecticut Digital Government Summit | Hartford | 2026-09-02 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| ConUHacks | Montreal | — | 2026-08-26 | passC | conuhacks.io live, Concordia University downtown Montreal; ConUHacks X Jan 24-25 2026 past, no next date |
| CppCon | Aurora | 2026-09-12 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Critical Effect | Washington | — | 2026-08-26 | passC | securityandtechnology.org event page live, Akin DC 2001 K Street NW Washington DC; June 17-18 2026 edition past, no next date |
| CSAW Cybersecurity Games and Conference | Brooklyn | 2026-11-12 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| CT Tech Week | Multiple cities | 2027-06-07 | 2026-08-26 | passB | cttechweek.com: 'CT Tech Week returns June 7-11, 2027. Connecticut's biggest week in tech and innovation ... across the state' |
| CTA Tech Week | Washington | — | 2026-08-26 | passC | cta.tech/events/tech-week live, Washington DC; April 21-22 2026 edition past, no next date |
| CTO Craft Con Toronto | Toronto | — | 2026-08-26 | passC | conference.ctocraft.com/toronto live, Toronto; after two years the site says 'Returning in 2027' with no dates |
| CUhackit | Clemson | 2027-02-20 | 2026-08-26 | passB | cuhack.it renders only 'CUhackit 2027'; the MLH 2027 season listing shows 'FEB 20 - 21', Clemson, SC - matches the record |
| Cultivate Conference | Fargo | — | 2026-08-26 | passC | grandfarm.com/cultivate live, Grand Farm flagship ag-tech conference (Fargo ND); page marks the June 11 2026 edition as past, no next date |
| Cultivator Community Night | Regina | — | 2026-08-26 | passC | cultivator.ca/events live, Regina SK incubator; 'Community Night 2026' held Feb 4 2026, no next Community Night dated |
| CVPR | Seattle | 2027-06-20 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| CyberBay Summit | Tampa | 2027-03-22 | 2026-08-26 | passB | cyberbay.org/summit/: 'March 22-24, 2027', JW Marriott Tampa Water Street, Tampa FL (the site root gives no dates) |
| CyberConVA | Richmond | — | 2026-08-26 | passC | rvatech.com CyberConVA page live, Richmond VA; Feb 12 2026 edition past, no next date |
| CyberForce Competition | Tinley Park | 2026-11-13 | 2026-08-26 | passA | cyberforce.energy.gov 2026 Competition page: 'competition in 2026 for competing Blue team participants on November 13-14, 2026 at the Tinley Park Convention Center' - matches record |
| CyberSci National Finals | Ottawa | — | 2026-08-26 | passC | cybersecuritychallenge.ca live; 2026 National Finals hosted in Ottawa June 12-15 2026 (past), no next date |
| Cybersecurity, Stronger Together Conference | Washington | — | 2026-08-26 | unblockB | cyberconference.cps.gwu.edu loads (HTTP 200) and names the event: 'Cybersecurity, Stronger Together Conference 2026: Converging Threats and Shared Defenses', run by GW's College of Professional Studies at 805 21st Street NW, Washington DC 20052. The 2026 edition is written up in the past tense ('brought together top experts') and no 2027 date is posted. Right event, right city, no date available. |
| CypherCon | Milwaukee | 2027-03-24 | 2026-08-26 | search-unblock | CypherCon 10: March 24-25 2027, Baird Center Milwaukee. Stored dates exact; venue added. |
| DakotaCon | Madison | — | 2026-08-26 | passC | dakotacon.org live, DakotaCon 13 in Madison SD (DSU); March 27-28 2026 edition past, no next date |
| Data + AI Summit | San Francisco | 2027-06-21 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Data Science DC | Washington | — | 2026-08-26 | passC | meetup.com/data-science-dc loads, Washington DC group with 17k members; NO upcoming events and latest listed meetup is Aug 2024 - group appears dormant, flagged for a later pass |
| DataConnect Conference | Columbus | 2026-10-29 | 2026-08-26 | passA | dataconnectconf.com: 'Columbus, Ohio / October 29-30, 2026' — matches record |
| DataTune | Nashville | — | 2026-08-26 | passC | datatuneconf.com live, Nashville TN; '2026 by the numbers' recap and 'Returning March 2027' with no exact dates |
| Day of Data Orlando | Orlando | 2026-10-17 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Day of Data Pittsburgh | Pittsburgh | 2026-10-10 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Day of Data Toronto | Toronto | 2026-09-26 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Day of Data Winnipeg | Winnipeg | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Dayton Hamvention | Xenia | 2027-05-21 | 2026-08-26 | passB | hamvention.org: 'May 21-23, 2027' at the Greene County Fair and Expo Center, Xenia OH 45385 |
| DC Startup & Tech Week | Washington | 2026-10-19 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| DDX Innovation & UX Conference San Diego | San Diego | 2026-09-17 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| DeltaHacks | Hamilton | 2027-01-09 | 2026-08-26 | passB | deltahacks.com shows 'Jan 9 - 10, 2027', 'Official Event @ McMaster University' (Hamilton ON); corroborated by the MLH 2027 season listing 'JAN 09 - 10, Hamilton, Ontario' |
| DelTech Conference | Memphis | 2026-10-14 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Desert Dev Lab Hackathon | Albuquerque | — | 2026-08-26 | passC | nmtechtalks.com live (c 2026), New Mexico tech network naming 'Desert Dev Lab software hackathon' as one of two annual events; no dates published |
| dev2next | Lone Tree | 2026-10-12 | 2026-08-26 | unblockA | dev2next.com serves an empty Rails/JS shell (2799 bytes, <div id="contents"></div>, no server-rendered copy). Chased its JS asset https://www.dev2next.com/main.js, which contains the literal string 'Lone Tree, CO - October 12 - 15, 2026' along with the venue 'Denver Marriott South at Park Meadows, Lone Tree, CO 80124'. Matches stored 2026-10-12 / 2026-10-15 and city Lone Tree exactly. |
| DeveloperWeek | Santa Clara | 2027-02-09 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| DeveloperWeek New York | New York | — | 2026-08-26 | unblockB | developerweek.com/newyork loads (HTTP 200) and describes DeveloperWeek New York in New York City, NY. JSON-LD startDate 2026-06-09 / endDate 2026-06-10; that edition is past as of 2026-08-26 and the site has not rolled over to a 2027 edition, so there is no forward date to store. Link and city are correct. |
| DevFest Charlotte | Charlotte | — | 2026-08-26 | passC | gdg.community.dev/gdg-charlotte live, 1133 members, ran GDG Charlotte DevFest 2025; currently 'no upcoming events' |
| DevFest KC | Kansas City | 2026-11-07 | 2026-08-26 | passA | gdg.community.dev/gdg-kansas-city/ lists 'DevFest KC 2026' on November 7, 2026, Kansas City - matches record |
| DevFest Salt Lake City | Salt Lake City | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| DevFestMN | Minneapolis | — | 2026-08-26 | passC | devfest.mn live, U of Minnesota Health Sciences Education Center, Minneapolis; page still on the Dec 6 2025 edition, no next date |
| DevLearn Conference & Expo | Las Vegas | 2026-11-04 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Devnexus | Atlanta | 2027-04-05 | 2026-08-26 | passB | devnexus.com: 'April 5-7, 2027', Georgia World Congress Center, Atlanta GA |
| DevOpsCon New York | New York | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| DevOpsDays Chicago | Chicago | — | 2026-08-26 | passC | devopsdays.org/events lists Chicago under 'TBD' pointing at /events/2027-chicago with no date assigned |
| DevOpsDays Dallas | Dallas | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| devopsdays Denver | Denver | 2026-09-22 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| DevOpsDays Detroit | Detroit | — | 2026-08-26 | passC | devopsdays.org/events lists Detroit only under 'TBD' (slug /events/2025-detroit) with no date assigned |
| DevOpsDays Halifax | Halifax | 2026-09-29 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| DevOpsDays Kansas City | Overland Park | — | 2026-08-26 | passC | devopsdays.org/events/2026-kansas-city live, Lifted Logic, 5600 W 95th St, Overland Park KS; May 28-29 2026 edition past, no next date |
| devopsdays Los Angeles | Los Angeles | 2027-04-02 | 2026-08-26 | passB | devopsdays.org 2027-los-angeles: 'Friday, Apr 2, 2027 - Friday, Apr 2, 2027' at Pasadena Convention Center, 300 E Green St, Pasadena CA. Dates match; the venue is in Pasadena while the event is branded Los Angeles |
| devopsdays Philadelphia | Philadelphia | 2026-10-01 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| devopsdays Portland | Portland | 2026-09-08 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| devopsdays Raleigh | Raleigh | — | 2026-08-26 | passC | devopsdays.org/events/2026-raleigh live, McKimmon Center Raleigh NC; April 30-May 1 2026 edition past, no next date |
| DevSpace Conference | Huntsville | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| DFW Startup Week | Dallas | — | 2026-08-26 | passC | dfwstartupweek.com live, Dallas-Fort Worth; Aug 2-6 2026 edition just past, no next date |
| Diamond Challenge | Newark | — | 2026-08-26 | passC | diamondchallenge.org live, Horn Entrepreneurship, 132 E. Delaware Ave Newark DE; 2025 finalists shown, no dates published |
| Difinity Conference Toronto | Toronto | 2026-09-10 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| DIG SOUTH Tech, Venture & AI Summit | Charleston | 2027-05-20 | 2026-08-26 | passB | digsouth.com/techsummit/: 'May 20-21, 2027 Charleston', Simons Center for the Arts, College of Charleston, 54 St. Philip Street |
| Digital Summit Atlanta | Atlanta | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Digital Summit Philadelphia | Philadelphia | 2026-09-23 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Digital Summit Raleigh | Raleigh | 2026-11-02 | 2026-08-26 | passA | digitalsummit.com locations list: 'Raleigh, NC / November 2-3, 2026' — matches record |
| Digital Summit Tampa | Tampa | — | 2026-08-26 | passC | digitalsummit.com live, series page lists 'Tampa / March 23-24' 2026 (past); no next Tampa date |
| DistrictCon | Washington | 2027-02-06 | 2026-08-26 | passB | districtcon.org: 'February 6-7, 2027 @ the Capital Hilton in Washington, D.C.' |
| DivHacks | New York | 2026-09-26 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Django Girls New York City | New York | 2026-11-28 | 2026-08-26 | passB | djangogirls.org/en/events/ upcoming list shows New York City on 28th November 2026, the only upcoming US 2026 workshop |
| DjangoCon US | Chicago | — | 2026-08-26 | passC | djangocon.us live (DEFNA), promoting tickets for 2026 and events through 2028; 2025 edition was Chicago, no 2026 city or dates posted yet |
| Dreamforce | San Francisco | 2026-09-15 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| DrupalCon North America | Orlando | 2027-03-22 | 2026-08-26 | passB | events.drupal.org lists 'DrupalCon Orlando, 22-25 March 2027' as the North American edition |
| Eahou Fest | Honolulu | — | 2026-08-26 | passC | eahoufest.com live, conference-meets-festival in Moiliili, Oahu (Honolulu); May 1-3 2026 edition past, no next date |
| East Meets West | Honolulu | — | 2026-08-26 | passC | emwhawaii.com live, East Meets West conference in Hawaii; April 8-9 2026 edition past, no next date |
| eBrew | Portsmouth | 2026-10-20 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| ElasticON New York | New York | 2026-10-08 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| ElasticON San Francisco | San Francisco | 2026-11-04 | 2026-08-26 | passA | elastic.co/elasticon city list: 'San Francisco AI focused November 4, 2026' — matches record |
| Elevate Conference | Wheatland | — | 2026-08-26 | passC | grandfarm.com/elevate live, Grand Farm Innovation Campus 3717 153rd Ave SE Wheatland ND; July 28 2026 edition marked as taken place, no next date |
| Elevate Festival | Toronto | 2026-09-22 | 2026-08-26 | passA | elevatefestival.ca: 'Elevate Festival returns to Toronto from September 22-24, 2026' — matches record (curl bypassed the block) |
| ElixirConf US | Chicago | 2026-09-10 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| ElleHacks | Toronto | 2027-01-29 | 2026-08-26 | passB | ellehacks.com is a JS shell showing only the title; the MLH 2027 season listing shows ElleHacks 'JAN 29 - 31', Toronto, Ontario - matches the record |
| eMerge Americas | Miami | 2027-03-02 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Emergence Office Hours | Charlottetown | — | 2026-08-26 | passC | peibioalliance.com event page loads and describes an Emergence Office Hours session (PEI BioAlliance, Charlottetown); the instance shown (Nov 27 2025) is marked passed, no next date |
| Emerging Technologies Summit | Bozeman | — | 2026-08-26 | unblockB | mthightech.org event page loads (HTTP 200), titled 'Emerging Technologies Summit - MT High Tech Business Alliance'. JSON-LD startDate 2026-05-28T09:00-0600; venue text references MSU / QCORE / Bozeman. That date is past and no next edition is announced. Right event, right city. |
| Empowering Innovation Spirit Conference | Whitehorse | — | 2026-08-26 | passC | entreprenorth.ca page live, 2026 Empowering Innovation Spirit Conference in Whitehorse YT, August 24-26 2026 - that edition concludes today, no later date published |
| ETHConf | New York | 2027-06-14 | 2026-08-26 | passB | ethglobal.com/events lists 'June 14-16, Mon-Wed, ETHConf 2027, New York City, United States, Conference' |
| ETHGlobal New York | New York | — | 2026-08-26 | passC | ethglobal.com/events/newyork2026 live, New York City; June 12-14 2026 edition past, no next date |
| Explore DDD | Denver | 2026-09-21 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| External Development Summit (XDS) | Vancouver | 2026-09-08 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Figma Config | San Francisco | — | 2026-08-26 | passC | config.figma.com live; SF edition June 23-25 2026 already wrapped (Config India Oct 15 2026 is a separate city), no next SF date |
| FinovateSpring | San Diego | 2027-05-03 | 2026-08-26 | passB | informaconnect.com/finovatespring/: 'May 3-5, 2027' at Gaylord Pacific Resort & Convention Center, San Diego CA |
| First Look Forum | Milwaukee | — | 2026-08-26 | passC | mcservices.com page loads and does describe First Look Forum (April 16 2026, Quarles & Brady, 411 E Wisconsin Ave Milwaukee) but it is an IT vendor's blog listicle, not the organiser's site - link quality flagged |
| FITC Toronto | Toronto | — | 2026-08-26 | passC | fitc.ca/event/to26_ip live, FITC Toronto 25th anniversary, April 27-28 2026 (past); no next date |
| Florida DrupalCamp | Orlando | 2027-01-29 | 2026-08-26 | passB | fldrupal.camp: 'January 29-30, 2027 in Orlando at Northbridge University (formerly Florida Technical College)' |
| Florida Technology Summit | St. Petersburg | 2026-11-19 | 2026-08-26 | passB | technologysummit.net/florida.html: 'The 7th Annual Florida Technology Summit will be held on November 19th, 2026 at the Hilton St. Petersburg Carillon Park' |
| Forcelandia | Portland | — | 2026-08-26 | passC | forcelandia.com live, Salesforce developer community event Portland OR; July 29-30 2026 edition past, no next date |
| Forge Summit | North Little Rock | 2026-10-13 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Forward Fest | Madison | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Founders Meetup Sioux Falls | Sioux Falls | 2026-09-16 | 2026-08-26 | passA | startupsiouxfalls.com series calendar JSON lists next occurrence 2026-09-16 (then 10-21, 11-18) — matches record |
| Founders Retreat | Fort Ransom | 2026-11-18 | 2026-08-26 | passB | emergingprairie.com homepage: 'Founders: join us November 18-20' for the Founders Retreat; matches 2026-11-18..20. City not printed; the /founders-retreat/ subpage is stale and still shows the Oct 2-4 2024 edition |
| Full Indie Summit | Vancouver | 2026-09-20 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Game Developers Conference | San Francisco | 2027-03-01 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Game Discovery Exhibition (GDX) | Edmonton | 2026-10-23 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Gamerella | Montreal | — | 2026-08-26 | passC | gamerella.ca live, inclusive game jam in Montreal; announces 'November 14th & 15th' with no year stated, so no date recorded |
| Gartner Identity & Access Management Summit | Las Vegas | 2026-12-07 | 2026-08-26 | unblockA | gartner.com/en/conferences/na/identity-access-management-us returns 200 via curl with JSON-LD "startDate":"2026-12-07" and "endDate":"2026-12-09", page title 'Gartner Identity & Access Management Summit 2026 in Las Vegas, NV', and body copy 'December 7 - 9, 2026'. Matches stored 2026-12-07 / 2026-12-09 and city Las Vegas. |
| Gartner IT Symposium/Xpo | Orlando | 2026-10-19 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| GDEX | Newark | 2026-10-15 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| GDG Ann Arbor | Ann Arbor | — | 2026-08-26 | passC | gdg.community.dev/gdg-ann-arbor live, 615 members, Ann Arbor MI; active (last meetup Apr 28 2026, next listed item is Michigan DevFest Nov 13 2026 - a separate event, so no series date set) |
| GDG Brooklyn AI Fashion Hackathon | Brooklyn | 2026-09-12 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| GDG Providence | Providence | — | 2026-08-26 | passC | gdg.community.dev/gdg-providence live, 606 members, Providence RI; last event June 25 2026, currently 'no upcoming events' |
| Generator Makerspace Workshops | Burlington | — | 2026-08-26 | passC | generatorvt.com live, Generator makerspace in Burlington VT with a workshops programme; no fixed dates published on the landing page |
| Genspace Community Biology Programs | Brooklyn | — | 2026-08-26 | passC | genspace.org live, community biology lab at 132 32nd Street Suite 108, Brooklyn NY, lists classes/public programs/residencies; no dates published |
| Georgia Tech All-Majors Career Fair | Atlanta | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| GirlHacks | Newark | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| GitHub Universe | San Francisco | 2026-10-28 | 2026-08-26 | passA | githubuniverse.com: 'GitHub Universe 2026 ... october 28-29 / fort mason center, san francisco, CA' — matches record |
| Global Day of Coderetreat | Multiple cities | 2026-11-13 | 2026-08-26 | passA | coderetreat.org: 'Join us on the Global Day of Coderetreat on Nov 13, 2026 - Nov 14, 2026' - matches record |
| Global Game Jam | Multiple cities | 2027-01-25 | 2026-08-26 | passB | globalgamejam.org shows '25 - 31 January 2027' |
| Global Game Jam - Abilene Christian University | Abilene | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at 1601 College, Abilene TX; Jan 26-Feb 1 2026 (past) |
| Global Game Jam - College of Charleston | Charleston | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at Harbor Walk East Innovation Center, 360 Concord St, Charleston SC; Jan 30-Feb 1 2026 (past) |
| Global Game Jam - NYU Game Center | New York | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live for NYU Game Center, Brooklyn NYC, Jan 30-Feb 1 2026 (past, registration closed) |
| Global Game Jam - Parsons School of Design | New York | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at Vera List Center, The New School, 6 E 16th St, New York NY; Jan 30-Feb 1 2026 (past) |
| Global Game Jam - RPI Game Development Club | Troy | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at Sage Labs, 1800 6th Avenue, Troy NY; GGJ26 weekend (past) |
| Global Game Jam - The Sheep's Meow at Bloomfield College | Bloomfield | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid with in-person venue Center for Technology + Creativity, 198 Liberty St, Bloomfield NJ; Jan 26-Feb 1 2026 (past) |
| Global Game Jam - University of Montana | Missoula | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at McGill Hall Room 223, 32 Campus Drive, Missoula MT; Jan 30-Feb 1 2026 (past) |
| Global Game Jam Albuquerque | Albuquerque | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at Mesa Del Sol, 5700 University Blvd SE, Albuquerque NM; Jan 30-Feb 1 2026 (past) |
| Global Game Jam San Antonio | San Antonio | — | 2026-08-26 | passC | globalgamejam.org 2026 jam-site page live, hybrid at Shenanigans Gaming, 5251 Timberhill Dr, San Antonio TX; Jan 26-Feb 1 2026 (past) |
| Global Summit AI Vancouver | Vancouver | 2026-11-02 | 2026-08-26 | passA | globalsummit.ca: 'AI Summit / Vancouver / November 2-3, 2026' — matches record |
| GNTC Summit | Nashville | 2026-09-09 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Google Cloud Next | Las Vegas | — | 2026-08-26 | orchestrator | cloud.google.com/next 301s to the stored URL; it is the canonical entry point |
| Google I/O | Mountain View | — | 2026-08-26 | passC | io.google/2026 live with keynotes and session library; no venue or dates for the next edition published |
| GopherCon | Seattle | — | 2026-08-26 | passC | gophercon.com live, Seattle Convention Center Summit; Aug 3-6 2026 edition just past, 2027 CFS not yet open |
| GoSec | Montreal | 2026-09-23 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Grace Hopper Celebration | Anaheim | 2026-10-27 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Great Lakes Software Symposium | Chicago | 2026-10-22 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| gRPConf North America | Mountain View | 2026-09-03 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| H2O Conference | Halifax | — | 2026-08-26 | passC | h2oconference.ca live, Canada's ocean-technology conference in Halifax NS; June 8-11 2026 edition past, no next date |
| Hack Arizona | Tucson | — | 2026-08-26 | passC | hack.arizona.edu live, University of Arizona student hackathon in Tucson; 'Hack Arizona 2026 has successfully concluded', no next date |
| Hack Dearborn | Dearborn | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Hack Knight | Flushing | 2026-10-09 | 2026-08-26 | passA | hackknight.org is a React SPA; its JS bundle renders 'October 9th - 11th, 2026' — dates match record. Venue city not stated on the page |
| Hack Midwest | Kansas City | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Hack the 6ix | Toronto | — | 2026-08-26 | passC | hackthe6ix.com live, 12th edition, Toronto; July 17-19 2026 edition past, no next date |
| Hack the North | Waterloo | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Hack the Valley | Toronto | 2026-10-16 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Hack Western | London | 2026-11-20 | 2026-08-26 | passB | hackwestern.com shows 'November 20-22, 2026'; Hack Western is hosted at Western University, London ON |
| Hack_NCState | Raleigh | 2027-02-06 | 2026-08-26 | passB | hackncstate.org shows 'Feb 6th and 7th' 2027 at Talley Student Union on NC State main campus, Raleigh |
| Hack@Brown | Providence | 2027-02-06 | 2026-08-26 | passB | hackatbrown.org shows 'FEBRUARY 6-7, 2027'; MLH lists Feb 5-7 (including the Friday kickoff), Providence RI. The organiser page matches the recorded 02-06..02-07 |
| Hackabull | Tampa | — | 2026-08-26 | passC | hackabull.com live, USF's 36-hour hackathon (Tampa); Hackabull 2026 was April 25-26 (past), no next date |
| Hackaday Superconference | Pasadena | 2026-11-06 | 2026-08-26 | passA | Eventbrite listing: 'Friday, November 6-Sunday, November 8' and 'Hackaday Superconference November 6th, November 7th, and 8th in Pasadena, California', ArtCenter South Campus - matches record |
| HackDuke: Code for Good | Durham | — | 2026-08-26 | passC | hackduke.org live, Duke University (Durham NC) org whose flagship hackathon is Code for Good; no dates published, newest assets dated 2023 |
| HackED | Edmonton | — | 2026-08-26 | passC | hacked-2026.devpost.com live, U of Alberta Computer Engineering Club, Donadeo Innovation Centre Edmonton; Feb 20-22 2026 marked ended, no next date |
| Hacker Dojo | Mountain View | — | 2026-08-26 | passC | hackerdojo.org live (c 2009-2026), hackerspace at 855 Maude Ave, Mountain View CA, open 10am-9pm; no fixed workshop dates on site |
| Hacker Dojo Events | Mountain View | — | 2026-08-26 | passC | meetup.com/hackerdojo loads, Mountain View CA, 20,317 members with 135 upcoming events listed - active recurring series, no single next date |
| Hackers Teaching Hackers | Canal Winchester | — | 2026-08-26 | passC | hthackers.com live, annual infosec con at BrewDog DogTap, Canal Winchester OH; 2026.hthackers.com exists ('HTH 2026: Spaceballs') but publishes no dates yet |
| HackGT | Atlanta | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| HackHarvard | Cambridge | 2026-10-16 | 2026-08-26 | unblockA | hhuh.io returns 200 with title 'HackHarvard 2026' and live 2026 application copy (portal.hhuh.io sign-in says accounts from previous years are archived), but no date in the HTML text - the date is baked into an image. Downloaded and read https://hhuh.io/newsite/assets/logo-stuff-with-date.png, which reads 'October 16-18 2026 - Cambridge, MA'. Matches stored 2026-10-16 / 2026-10-18 and city Cambridge exactly. Not an MLH member event (absent from mlh.io/seasons/2027/events) and no 2026 Devpost listing yet (devpost.com/api/hackathons?search=hackharvard lists editions through 2024 only), so the organiser's own logo asset is the source. |
| HackHCC | Houston | — | 2026-08-26 | passC | mlh.com 2026 season list shows HackHCC as in-person in Houston TX on May 22-23 (past); no next date |
| HackHERS | New Brunswick | 2027-02-27 | 2026-08-26 | passB | ruhackhers.org (HackHERS 2027): 'February 27-28th', College Avenue Student Center, Rutgers, New Brunswick NJ |
| HackHers @GSU | Atlanta | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| HackIllinois | Urbana-Champaign | 2027-02-26 | 2026-08-26 | passB | hackillinois.org only says 'Stay tuned for Hack 2027'; the MLH 2027 season listing shows HackIllinois 'FEB 26 - 28', Urbana, Illinois - matches the record |
| HackKU | Lawrence | 2027-04-09 | 2026-08-26 | passB | hackku.org returned HTTP 429 on repeated fetches; the MLH 2027 season listing shows HackKU27 'APR 09 - 11', Lawrence, Kansas - matches the record |
| Hacklytics | Atlanta | 2027-02-26 | 2026-08-26 | passB | hacklytics.io: 'Feb. 26 - 28, 2027', Klaus Advanced Computing Building, Georgia Tech Campus, Atlanta |
| HackMIT | Cambridge | 2026-09-19 | 2026-08-26 | passA | hackmit.org is a React SPA; its JS bundle FAQ says 'HackMIT will take place over the weekend of Saturday, September 19th and Sunday, September 20th', meta description 'at MIT in Cambridge, Massachusetts' — matches record |
| HackNC | Chapel Hill | 2026-10-09 | 2026-08-26 | passA | hacknc.com titled 'HackNC 2026'; countdown aria-label reads 'Countdown to October 9, 2026 Eastern Time'. Start date matches record; end date (Oct 11) not separately stated on the page |
| HackNYU | New York | — | 2026-08-26 | passC | hacknyu.github.io live, official NYU student org running the 48-hour hackathon in New York; no dates published |
| HackOHI/O | Columbus | 2026-10-24 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| HackPrinceton | Princeton | — | 2026-08-26 | passC | hackprinceton.com live with MLH 2026 season badge and Apr 18 deadline (past); no next edition dated |
| HackRice | Houston | 2026-09-11 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| HackRPI | Troy | 2026-11-07 | 2026-08-26 | passA | hackrpi.com: 'HackRPI 2026 will take place on Sat. November 7th and Sun. November 8th' and 'November 7, 8th - Troy, NY' — matches record |
| HackRU | New Brunswick | — | 2026-08-26 | passC | hackru.org resolves and serves the HackRU site (JS-rendered, title 'HackRU F25'); Rutgers New Brunswick hackathon, no date readable |
| HackTX | Austin | 2026-10-24 | 2026-08-26 | passA | hacktx.com SPA bundle countdown targets '2026-10-24T00:00:00' and the FAQ says walk-in registration 'Saturday, October 24th' (Oct 24 2026 is a Saturday); the FAQ's '2025' year is stale copy. Dates match record |
| HackUMass | Amherst | 2026-11-13 | 2026-08-26 | unblockA | hackumass.com returns 200 but its only date string is a stale 'November 8 - 10, 2024' left over in the page, so the organiser site is not yet updated for this edition. Corroborated by MLH: mlh.io/seasons/2027/events event record slug 'hackumass-19', startsAt 2026-11-13, endsAt 2026-11-15, dateRange 'NOV 13 - 15', venue Amherst, MA, US, linking out to https://www.hackumass.com/ (same URL as the record). Matches stored 2026-11-13 / 2026-11-15 and city Amherst. Date sourced from MLH, not the organiser. |
| hackUMBC | Baltimore | 2026-09-26 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| HackUTD | Richardson | 2026-11-07 | 2026-08-26 | unblockA | zeroday.hackutd.co returns 200 with title 'HackUTD 2026 - Zero Day' but no date in the HTML. Corroborated by MLH: mlh.io/seasons/2027/events event record slug 'hackutd-06', startsAt 2026-11-07, endsAt 2026-11-08, dateRange 'NOV 07 - 08', venue Richardson, Texas, US, linking out to https://zeroday.hackutd.co (same URL as the record). Matches stored 2026-11-07 / 2026-11-08 and city Richardson. Date sourced from MLH, not the organiser. |
| Hackville | Mississauga | 2027-01-22 | 2026-08-26 | passB | hackville.io still shows the Jan 17-18 2026 edition with a 2027 interest form; the MLH 2027 season listing shows 'Hackville 2027, JAN 22 - 24, Missisauga, Ontario' - matches the record |
| HackWesTX | Lubbock | 2026-09-12 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Halifax Indie Devs Play and Tell | Halifax | — | 2026-08-26 | passC | meetup.com/halifax-indie-devs-play-and-tell loads, Halifax NS, 487 members, monthly Play & Tell at Halifax Central Library - active recurring series |
| HashiConf | Atlanta | 2026-10-26 | 2026-08-26 | passA | hashicorp.com/en/conferences/hashiconf: 'Atlanta / October 26-29, 2026' - matches record |
| Hawaii Tech Week | Honolulu | 2026-08-31 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| HenHacks | Newark | 2027-03-06 | 2026-08-26 | passB | henhackshackathon.com: 'March 6-7, 2027', University of Delaware Newark campus, in-person only |
| HLTH USA | Las Vegas | 2026-11-15 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| HopHacks | Baltimore | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Houston Day of Data | Houston | 2026-12-05 | 2026-08-26 | passB | stored sqlsaturday.com url forwards to dayofdata.org/2026-12-05-dayofdata1162/ which shows 'Houston Day of Data 2026 (#1162)', 05 December 2026, Microsoft, 750 Town And Country Blvd, Houston TX |
| HPSF Conference | Montreal | 2027-04-12 | 2026-08-26 | passB | events.linuxfoundation.org calendar: 'HPSF Conference, Apr 12-16, 2027 Montreal, Canada' |
| HR Tech Las Vegas | Las Vegas | 2026-10-20 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| HTDC Events | Honolulu | — | 2026-08-26 | passC | htdc.org/events live, HTDC Honolulu (521 Ala Moana Blvd), actively listing events through September 2026 |
| HudsonAlpha Tech Challenge | Huntsville | — | 2026-08-26 | passC | hudsonalpha.org/techchallenge live, 800 Hudson Way NW Huntsville AL; March 6-8 2026 edition past, no next date |
| IBM TechXchange Conference | Atlanta | 2026-10-26 | 2026-08-26 | passA | ibm.com/community/ibm-techxchange-conference/ shows '26-29 October' and 'Atlanta, GA' — matches record |
| ICS Cybersecurity Conference Nashville | Nashville | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Idaho Technology Council Trade Show & Conference | Boise | — | 2026-08-26 | passC | idahotechcouncil.org page live for the Explore Idaho Tech Trade Show & Conference at Boise Centre, but banner reads 'This event has been postponed' - no date |
| Idea Village Pitch Night | New Orleans | — | 2026-08-26 | passC | ideavillage.org pitch-night page live, New Orleans; June 18 2026 edition recapped and 'Pitch Night returns in November 2026' with no exact date |
| IdeaFunding | Tucson | — | 2026-08-26 | passC | startuptucson.com/ideafunding live, Arizona's longest-running pitch competition in Tucson; 2026 cycle closed (main stage March 26 2026), no next date |
| iFiveK | Charleston | 2027-04-22 | 2026-08-26 | passB | charlestondigital.com/community/ifivek: 'SEE YOU AT THE START LINE APRIL 22, 2027', Charleston Tech Center, downtown Charleston SC |
| Ignite Seattle | Seattle | 2026-10-01 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Ignite Summit | Fredericton | 2026-10-20 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| IgniteND | Valley City | — | 2026-08-26 | passC | edutech.nd.gov/ignitend live, two-day conference at Valley City State University; June 2-3 2026 edition past, no next date |
| Imagine RIT: Creativity and Innovation Festival | Rochester | 2027-04-24 | 2026-08-26 | passB | rit.edu/imagine/: 'April 24, 2027, 10 a.m. - 5 p.m.', 30 Lomb Memorial Drive, Rochester NY |
| ImmerseGT | Atlanta | — | 2026-08-26 | passC | immersegt.org live, XR hackathon at Georgia Tech, Atlanta; April 10-12 2026 edition past, no next date |
| IND(Venture) Indiana Venture Summit | Indianapolis | — | 2026-08-26 | passC | techpoint.org event page live and describes the Indiana Venture Summit in Indianapolis; page body still carries the July 12-13 2023 edition, no new date |
| IndieCade | Los Angeles | — | 2026-08-26 | search-unblock | Checked; no in-person Los Angeles date is published. The 2025 festival ran Jan 16-30 2026 with a streamed awards ceremony, and only a Playable Theatre Symposium (Mar 23-24) and Game Educators Symposium (May 1) are dated for 2026. Left undated rather than adopting the conflicting Oct 10-12 / Oct 15 dates that only aggregators carry. |
| Innovate 901 | Memphis | — | 2026-08-26 | passC | innovate901.com live, high-school startup pitch at Crosstown Concourse, 1350 Concourse Ave, Memphis TN; Jan 17 2026 pitch event past, no next date |
| Innovate New Mexico Technology Showcase | Albuquerque | — | 2026-08-26 | passC | innovatenewmexico.com/2026showcase live, Lobo Rainforest Building, downtown Albuquerque; no dates published for the 2026 showcase |
| InnovateHer | West Lafayette | 2027-02-06 | 2026-08-26 | passB | innovateherhacks.org: 'Date: February 6-7, 2027', 'Location: TBD' - dates match; venue not yet published (the event is at Purdue, West Lafayette) |
| Innovation Depot Founders Round Table | Birmingham | 2026-10-22 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| InsurTech America Symposium | Hartford | — | 2026-08-26 | passC | insurtechamericasymposium.com live, Connecticut Convention Center Hartford; April 13-14 2026 edition past, 2027 early registration open without dates |
| InsurTech Hartford Connect & Protect | Hartford | 2026-10-27 | 2026-08-26 | passA | insurtechhartford.com upcoming events lists 'Insurtech Hartford: Connect & Protect, Oct 27, 2026, Hartford, CT' — matches record |
| InsurTech Hartford Innovation Challenge Awards | Hartford | 2026-10-27 | 2026-08-26 | passA | insurtechhartford.com lists 'Innovation Challenge Awards Ceremony, Oct 27, 2026, Nassau Office, Hartford' — matches record |
| Interface | Quebec City | 2027-06-01 | 2026-08-26 | passB | interfaceqc.com header: 'Interface / 1-3 juin 2027' (June 1-3, 2027), Quebec City |
| INTERFACE Anchorage | Anchorage | — | 2026-08-26 | passC | f2fevents.com/event/anc26 live, Dena'ina Convention Center Anchorage; April 22 2026 edition past, 'will return in 2027' with no date |
| INTERFACE Honolulu | Honolulu | — | 2026-08-26 | passC | f2fevents.com/event/hnl26 live, Sheraton Waikiki Honolulu; May 21 2026 edition past, 'will return in 2027' with no date |
| INTERFACE Montana | Bozeman | — | 2026-08-26 | passC | f2fevents.com/event/mnt26 live, MSU Strand Union Building Bozeman MT; July 29 2026 edition past, 'will return in 2027' with no date |
| INTERFACE Omaha | Omaha | 2026-11-05 | 2026-08-26 | passA | f2fevents.com/event/neb26/: 'INTERFACE Omaha / November 5th, 2026' — matches record |
| INTERFACE Wyoming | Cheyenne | — | 2026-08-26 | passC | f2fevents.com/event/wyo26 live, Little America Hotel & Resort Cheyenne WY; July 9 2026 edition past, 'will return in 2027' with no date |
| Investing in Montana Summit | Bozeman | — | 2026-08-26 | unblockB | mthightech.org/events/2026-investing-in-montana-summit loads (HTTP 200), title '2026 Investing in Montana Summit'. JSON-LD startDate 2026-06-25T10:00-0600, venue 'AC Hotel by Marriott Bozeman Downtown, 110 North Tracy Avenue' - confirms Bozeman. Date is past and no next edition is announced. |
| Iowa Startup Week | Des Moines | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Iowa Tech Week | Des Moines | — | 2026-08-26 | passC | technologyiowa.org/techweek live, Des Moines IA; April 6-9 2026 edition past, no next date |
| IS: Life Sciences | Wilmington | 2026-12-10 | 2026-08-26 | passB | innovationspace.org event page shows 'December 10 @ 8:30 am - 6:00 pm' for 2026, matching the recorded date. Venue/city not printed on the page; InnovationSpace is at the Wilmington DE Experimental Station |
| ISTE+ASCD Conference | Boston | 2027-06-27 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| ITEXPO | Fort Lauderdale | 2027-02-09 | 2026-08-26 | passB | itexpo.com/east: 'February 9-11, 2027 / Fort Lauderdale, Florida', Broward County Convention Center |
| ITS Northern Lights Conference | Sioux Falls | — | 2026-08-26 | passC | itsmn.starchapter.com page live, Holiday Inn Sioux Falls City Centre, 100 W 8th Street, Sioux Falls SD; May 12-14 2026 edition past (sold out), no next date |
| JAMHacks | Waterloo | — | 2026-08-26 | passC | jamhacks.ca live, JAMHacks 10 at University of Waterloo; June 12-14 2026 edition past, no next date |
| Jersey City Entrepreneurs: The Venture Garden | Jersey City | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| John P. Ellbogen $50K Entrepreneurship Competition | Laramie | — | 2026-08-26 | passC | ellbogen50k.org live, University of Wyoming competition (Laramie); 2026 finalists posted and 2026/27 application open, no dates |
| JSNation US | New York | 2026-11-16 | 2026-08-26 | passA | jsnation.us: 'November 16 (hybrid in New York) and November 19 (remote), 2026', with in-person days Nov 17-18 in NYC - span matches record |
| JumpStart Expo & Pitch Night | Burlington | — | 2026-08-26 | passC | generatorvt.com/jumpstart-expo live, 40 Sears Ln Burlington VT; Wednesday April 8 2026 edition past, no next date |
| JumpStart VC Fest | Cleveland | 2026-09-29 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Kansas City Developer Conference | Kansas City | 2026-09-09 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Kent Hack Enough | Kent | 2027-03-06 | 2026-08-26 | passB | khe.io (Kent Hack Enough 2027): 'March 6-7, 2027', Design Innovation Hub, Kent, OH 44243 |
| Kentucky Entrepreneur Hall of Fame Induction Celebration | Lexington | 2026-11-04 | 2026-08-26 | passA | awesomeinc.org/events lists 'Kentucky Entrepreneur Hall of Fame 2026 Induction Celebration Dinner, November 4, 2026, Central Bank Center, 430 W Vine St, Lexington, KY' - matches record |
| Knight Hacks | Orlando | 2026-10-09 | 2026-08-26 | passA | knighthacks.org (2026.knighthacks.org): 'Knight Hacks IX, October 9 - 11, 2026, University of Central Florida' — matches record |
| Knox Game Jam | Knoxville | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| KubeCon + CloudNativeCon North America | Salt Lake City | 2026-11-09 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| LA Hacks | Los Angeles | 2027-04-16 | 2026-08-26 | passB | lahacks.com says only 'Mid-April 2027' at UCLA Pauley Pavilion; the MLH 2027 season listing shows LA Hacks 27 'APR 16 - 18', Los Angeles, California - matches the record |
| LA Hacks AI Hackathon | Los Angeles | 2026-10-17 | 2026-08-26 | passA | ai.lahacks.com SPA bundle: 'October 17-18, 2026 / James West Alumni Center (JWAC), UCLA' — matches record |
| LA Tech Week | Los Angeles | 2026-10-12 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| LASCON | Austin | 2026-10-29 | 2026-08-26 | passA | lascon.org: '2026 Conference dates will be Thursday and Friday, October 29-30, 2026', Norris Conference Centers - Austin — matches record |
| Latinas in Tech | Multiple cities | — | 2026-08-26 | passC | latinasintech.org live ('Connecting, supporting and empowering Latina women working in tech'); JS-rendered chapter/event lists not readable, no dates published in the served HTML |
| Launch Wisconsin | Milwaukee | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| LaunchVT Demo Night | Burlington | — | 2026-08-26 | passC | lccvermont.org/launchvt live, 110 Main Street Burlington VT, describes Demo Night as Vermont's largest pitch competition; 'Demo Night 2026' referenced with no date |
| Legalweek New York | New York | 2027-03-01 | 2026-08-26 | passB | event.law.com/legalweek: 'March 1 - 3, 2027 / North Javits Center / New York, NY' |
| Lincoln AI | Lincoln | — | 2026-08-26 | passC | meetup.com/lincoln-ai loads, Lincoln NE, 417 members; last meeting Aug 18 2026 at Don't Panic Labs, no upcoming event scheduled |
| Linux Foundation Member Summit | Half Moon Bay | 2027-02-22 | 2026-08-26 | passB | events.linuxfoundation.org calendar: 'Feb 22-23, 2027 Half Moon Bay, United States' |
| Live! 360 Tech Con | Orlando | 2026-11-15 | 2026-08-26 | passA | live360events.com/events/orlando-2026/: 'November 15-20, 2026 / ROYAL PACIFIC RESORT AT UNIVERSAL ORLANDO' - matches record |
| Lone Star Cyber Summit | Austin | 2026-10-20 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Maine Blue Economy Week | Portland | 2026-09-30 | 2026-08-26 | passA | roux.northeastern.edu event page shows September 30 - October 2, Holiday Inn, 100 Fore Street, Portland, ME — matches record |
| Maine Entrepreneurs Summit | Portland | — | 2026-08-26 | passC | mced.biz/events live (Maine Center for Entrepreneurs, Portland ME); Maine Entrepreneurs Summit listed for May 12 2026 (past), no next date |
| Maine Tech Week | Portland | 2026-10-19 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Maker Faire Baton Rouge | Baton Rouge | 2026-10-17 | 2026-08-26 | passA | batonrouge.makerfaire.com: 'Main Library at Goodwood, October 17th, 2026' — matches record |
| Maker Faire Bay Area | Vallejo | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Maker Faire Yukon | Whitehorse | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| MakeShift Maker Meetup | Lincoln | — | 2026-08-26 | passC | makeshiftlincoln.org live, makerspace at 1135 N. 22nd St Lincoln NE, weekly Monday Meetups 5:30-7pm; recurring, no fixed dates |
| MakeUofT | Toronto | 2027-02-13 | 2026-08-26 | passB | makeuoft.ca itself still says 'TBD, 2027' at the Myhal Centre, U of T St. George; the MLH 2027 season listing gives MakeUofT 'FEB 13 - 14', Toronto, Ontario - matches the record |
| Manitoba Tech Week | Winnipeg | 2027-02-21 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Manufacturing Day at WSU Tech | Wichita | 2026-10-02 | 2026-08-26 | passA | wsutech.edu/wsutechevents/ shows 'Manufacturing Day 2026, Friday, October 2, 2026, 9 AM - 2 PM, WSU Tech NCAT, 4004 N. Webb Road, Wichita, KS' — matches record |
| MariHacks | Montreal | 2027-04-09 | 2026-08-26 | passB | marihacks.com renders only its heading; the MLH 2027 season listing shows MariHacks 'APR 09 - 10', Montreal, Quebec - matches the record |
| MasseyHacks | Windsor | — | 2026-08-26 | passC | masseyhacks.ca resolves and serves the MasseyHacks XII page (JS-rendered, no readable body); no date available |
| McHacks | Montreal | — | 2026-08-26 | passC | mchacks.ca live, McHacks 13 at McGill downtown campus Montreal; Jan 17-18 2026 edition past, no next date |
| MCP Dev Summit Toronto | Toronto | 2026-10-05 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| MDEV | Madison | 2026-11-06 | 2026-08-26 | passA | mdevconf.com JSON-LD: startDate 2026-11-06T09:00:00-0600, endDate 2026-11-07T17:00:00-0600, Alliant Energy Center, addressLocality Madison - matches record |
| MEET Show | Moncton | 2028-05-03 | 2026-08-26 | passB | meetshow.ca: 'The MEET Show will return May 3-4, 2028' at the Moncton Coliseum |
| Meeting in the Millyard | Nashua | 2027-05-18 | 2026-08-26 | orchestrator | NH Tech Alliance calendar lists MITM27 May 18-20 2027, matches record |
| Meta Connect | Menlo Park | 2026-09-23 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| MHacks | Ann Arbor | 2026-10-03 | 2026-08-26 | passA | mhacks.org: 'MHACKS 2026 ... October 3-4, 2026 - Ann Arbor, Michigan' — matches record (curl bypassed the earlier block) |
| Michigan DevFest | Detroit | — | 2026-08-26 | passC | midevfest.com resolves and serves 'Michigan DevFest 2026' (JS-rendered, no readable body); GDG Ann Arbor lists a 'Michigan DevFest + AI Hackathon 2026' on Nov 13 2026 but the host city is unconfirmed, so no date recorded |
| Michigan Tech Career Fair | Houghton | — | 2026-08-26 | passC | mtu.edu/career live (c 2026), Michigan Technological University career services, Houghton MI; references the Fall Career Fair but publishes no dates on this page |
| Michigan Tech Week | Detroit | — | 2026-08-26 | passC | michigantechweek.com live, MTW26 at Michigan Central, Detroit, May 19-21 2026 (past); no next date |
| Microsoft Ignite | San Francisco | 2026-11-17 | 2026-08-26 | unblockA | ignite.microsoft.com returns 200; the dates live in the Next.js flight data. Page metadata reads 'Join Microsoft Ignite, November 17-20, 2026. Register now.', the hero tag is 'Nov 17-20, 2026' with eyebrow 'San Francisco, Moscone Center', and the FAQ drawer states 'Microsoft Ignite is at the Moscone Center in San Francisco, November 17-20, 2026, with an optional pre-day on November 16. The online event is November 17-19, 2026.' The 17-19 string refers only to the online / Hub-only track, not the in-person conference. Matches stored 2026-11-17 / 2026-11-20 and city San Francisco. |
| Microsoft Power Platform Community Conference | Las Vegas | 2026-10-27 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Microsoft Reactor Redmond | Redmond | — | 2026-08-26 | passC | meetup.com/microsoft-reactor-redmond loads, Redmond WA, 24,168 members with 37 upcoming events - active recurring series, no single next date |
| MidCamp | Chicago | 2027-04-28 | 2026-08-26 | passB | midcamp.org news: 'Mark your calendars. MidCamp is returning April 28-30, 2027!'. The 2027 venue is not yet named; the 2026 edition is at DePaul University, Chicago |
| Midwest Entrepreneurship Conference | Omaha | — | 2026-08-26 | passC | unomaha.edu CIEF page live, Omaha NE; April 17 2026 edition past, no next date |
| Midwest Gaming Classic | Milwaukee | 2027-04-23 | 2026-08-26 | search-unblock | April 23-25 2027, Baird Center. Preview Night 23rd, Full Show 24th, Family Day 25th. Stored dates exact. |
| Mind the Product Chicago | Chicago | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Minnebar | Minneapolis | — | 2026-08-26 | passC | minnestar.org live and active (Minnedemo42 scheduled Oct 1 2026); no Minnebar date announced |
| Minnedemo | St. Paul | 2026-10-01 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Mira Awards | Indianapolis | 2027-04-23 | 2026-08-26 | passB | techpoint.org/mira-awards/: 'The 2027 Mira Awards will take place Friday, April 23 at the brand-new Signia by Hilton Indianapolis' |
| Mississippi Aerospace & Defense Symposium | Flowood | 2026-09-02 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Mississippi AI Collaborative Annual Conference | Jackson | — | 2026-08-26 | passC | integrate.io blog listicle loads and describes the conference at the Mississippi E-Center, Jackson State University, June 16-17 2026 (past); third-party vendor blog rather than the organiser's site - link quality flagged |
| Mississippi Technology Expo | Jackson | — | 2026-08-26 | passC | eventbrite listing live for the 2026 Mississippi Technology Expo at Mississippi Trade Mart, Jackson MS, April 9 2026 - marked 'Event ended', no next date |
| MIT $100K Entrepreneurship Competition | Cambridge | — | 2026-08-26 | passC | mit100k.org live, describes the MIT $100K (Pitch/Accelerate/Launch) at MIT, Cambridge MA; only 'usually September, March, May', no dates |
| MIT Bitcoin Expo | Cambridge | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| MITRE Embedded Capture the Flag | Multiple cities, US & Canada | — | 2026-08-26 | passC | ectf.mitre.org live; 2026 cycle ran Jan 14 kickoff to Apr 24 award ceremony (past) and the competition 'can be done 100% remotely', so no city-bound next date |
| MLconf | New York | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| MnTech Twin Cities Startup Community Events | Minneapolis | — | 2026-08-26 | unblockB | mntech.org loads (HTTP 200), title 'MnTech / Fueling the Success of Minnesota's Tech Ecosystem'. It is the correct organiser hub for the recurring Minnesota tech community series (Coffee Connect, Tech On Tap, WLiT) and carries a run of 2026 in-person event dates. Correct link for a meetup-series record; no single next date applies. |
| Momentum Developer Conference | Cincinnati | 2026-10-15 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Money20/20 USA | Las Vegas | 2026-10-18 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| MongoDB.local Dallas | Irving | 2026-10-14 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| MongoDB.local NYC | New York | 2026-09-30 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| MongoDB.local Toronto | Toronto | 2026-11-19 | 2026-08-26 | passB | mongodb.com event page: When 'November 19, 2026', Location 'Toronto, ON' |
| Montreal International Game Summit (MIGS) | Montreal | 2026-11-10 | 2026-08-26 | passA | migs.biz/en/: 'MONTREAL, canada nov 10 - 11, 2026' and 'Join us at Grand Quay, November 10 - 11, 9AM - 5PM, for the 2026 Montreal International Game Summit' - matches record |
| MPC Hacks | Montreal | — | 2026-08-26 | passC | mpchacks.com resolves and serves 'MPC Hacks: Inter-University Hackathon' (JS-rendered, no readable body); no date available |
| National Cyber Summit | Huntsville | 2026-09-22 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| NBIF Breakthru | Fredericton | — | 2026-08-26 | passC | nbif.ca/breakthru live, NBIF Fredericton NB; programme 'returns in 2026, with a live finale in March 2027' - no exact date |
| NC TECH Awards Celebration | Raleigh | 2026-11-16 | 2026-08-26 | passB | nctech.org signature-events page lists 'NC TECH Awards Celebration - November 16 - Sheraton Imperial Hotel Raleigh-Durham Airport at Research Triangle Park'; matches 2026-11-16 |
| NC TECH Outlook for Tech | Charlotte | — | 2026-08-26 | passC | nctech.org signature-events page lists Outlook for Tech on February 12 (2026) at The Revelry, North End Charlotte - past, no next date |
| NC TECH Summit for Women in Tech | Asheville | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| NC TECH TECHFEST | Durham | — | 2026-08-26 | passC | nctech.org signature-events page lists TECHFEST May 13-14 (2026) at Durham Convention Center/Durham Armory - past, no next date |
| Nebraska.Code() | Lincoln | — | 2026-08-26 | passC | nebraska-code.com live, Lincoln NE; July 22-24 2026 edition past, no next date |
| Nerd Nite New York | New York | — | 2026-08-26 | passC | nerdnite.com live global directory listing a New York chapter; link is the global site rather than the city page and no New York date is published |
| Nerd Nite San Francisco | San Francisco | — | 2026-08-26 | passC | nerdnite.com live global directory listing a San Francisco chapter; link is the global site rather than the city page and no San Francisco date is published |
| Nerd Nite Washington DC | Washington | — | 2026-08-26 | passC | nerdnite.com live global directory listing a Washington DC chapter; link is the global site rather than the city page and no DC date is published |
| NetSuite SuiteWorld | Las Vegas | 2026-10-25 | 2026-08-26 | unblockA | The stored URL netsuite.com/portal/events/suiteworld/main.shtml is 403 to curl - as is every netsuite.com path including the homepage - so this is host-wide WAF behaviour rather than a dead page. Oracle's newsroom (www.oracle.com/news/, HTTP 200) links the event to https://www.netsuitesuiteworld.com/home.shtml and states 'Oracle's annual conference for the NetSuite community is heading to Vegas October 25-28.' That canonical event site returns 200 with JSON-LD "startDate": "2026-10-25T09:00:00+0000" and "endDate": "2026-10-28T09:00:00+0000", page title 'SuiteWorld / Las Vegas / NetSuite', and body copy 'October 25-28, 2026'. Matches stored 2026-10-25 / 2026-10-28 and city Las Vegas. No patch emitted for the URL because a 403 to curl does not establish the stored link is dead for browsers. |
| New England Drupal Camp | Providence | 2026-11-13 | 2026-08-26 | passA | nedcamp.org: 'November 13-14, 2026', held 'in Providence on the lovely RIC campus' (Rhode Island College) - matches record |
| New Mexico Tech Week | Albuquerque | 2026-10-26 | 2026-08-26 | passA | newmexicotechweek.com: 'October 26-31, 2026 - New Mexico' — matches record |
| New Ventures BC Demo Day | Vancouver | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| New York State Innovation Summit | Buffalo | 2026-10-27 | 2026-08-26 | passA | nysinnovationsummit.com: 'October 27 & 28, 2026', Buffalo Convention Center, Buffalo, New York — matches record |
| New York Tech Week | New York | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| NH Tech Alliance Cybersecurity Summit | Manchester | 2026-09-10 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| NH Tech Alliance Innovation Summit | Nashua | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| NH Tech Alliance Product of the Year | Concord | 2026-11-19 | 2026-08-26 | passB | nhtechalliance.org: 'Thursday, November 19th, 2026' at Bank of New Hampshire Stage, 16 S Main St., Concord, NH |
| NICAR Conference | Indianapolis | — | 2026-08-26 | passC | ire.org NICAR 2026 page live, JW Marriott, 10 S. West St, Indianapolis; March 5-8 2026 edition past, no 2027 date announced |
| NM TechFest | Albuquerque | 2026-10-29 | 2026-08-26 | passA | nmtechfest.com: 'TechFest 2026 ... October 29-30, 2026 / Innovation District / Downtown Albuquerque' — matches record |
| Nolacon | New Orleans | — | 2026-08-26 | passC | nolacon.com live, New Orleans infosec con with archives back to 2014; May 15-17 2026 edition past, no next date |
| North American Games Industry Summit (NAGIS) | Edmonton | — | 2026-08-26 | passC | nagis.ca live, B2B games summit in Edmonton AB; June 2026 edition past (2026 event report posted), no next date |
| North Bay Python | Petaluma | — | 2026-08-26 | passC | northbaypython.org live, Reis River Ranch, Petaluma CA; April 25-26 2026 edition past, no next date |
| North Forge FabLab Open House | Winnipeg | — | 2026-08-26 | passC | northforge.ca live, 'FabLab Open House (Public Tours) every Tuesday night 6 PM, 312 William Ave' Winnipeg, with Sept/Oct 2026 tour dates listed - recurring, no single next date |
| Northeast Dreamin' | Concord | 2026-10-29 | 2026-08-26 | passA | northeastdreamin.com shows 'October 29-30, 2026' and 'Concord, NH' — matches record |
| NorthSec | Montreal | 2027-05-17 | 2026-08-26 | passB | nsec.io: 'May 17-23, 2027', Montreal, Bonsecours Market, 350 St-Paul East (training May 17-19, conference May 20-21, CTF May 21-23) |
| NSBE Annual Convention | Baltimore | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| NWA Tech Summit | Bentonville | 2026-09-01 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| nwHacks | Vancouver | 2027-01-16 | 2026-08-26 | passB | nwhacks.io shows 'January 16-17, 2027' at UBC Life Sciences Institute, Vancouver BC |
| NY SMART I-Corridor Semiconductor Summit | Rochester | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| NY Tech Meetup | New York | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| NYC Resistor Craft Night | Brooklyn | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Ocean Exchange | Fort Lauderdale | 2026-10-25 | 2026-08-26 | passA | oceanexchange.org: 'October 25-27, 2026 Ocean Exchange Event in Fort Lauderdale' — matches record |
| Offensive AI Con | San Diego | 2026-10-04 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Ohio Tech Summit | Columbus | — | 2026-08-26 | passC | ohiotechsummit.org live, Columbus OH; May 14 2026 edition sold out and past, no next date |
| OIN Connect | San Jose | 2026-10-19 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Oklahoma Innovation Day | Oklahoma City | — | 2026-08-26 | passC | oklahoma.gov OCAST page live; OKC edition April 22-23 2026 (past), no next OKC date |
| Oktane | Las Vegas | 2026-09-22 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Open Door Leadership Series | Portland | 2026-09-30 | 2026-08-26 | passA | roux.northeastern.edu/events/ lists 'Open Door with Glenn Prickett' September 30, 2026 @ 7:00 pm, 100 Fore Street, Portland — matches record |
| Open Sauce | San Mateo | 2027-07-17 | 2026-08-26 | passB | opensauce.com: 'July 17-18, 2027', 'San Mateo County Event Center - CA' |
| Open Source 101 Charlotte | Charlotte | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Open Source in Finance Forum | New York | 2026-11-04 | 2026-08-26 | passA | events.linuxfoundation.org/about/calendar/ lists 'Open Source in Finance Forum New York, Nov 4-5, 2026, New York, United States' — matches record |
| Open Source in Finance Forum New York | New York | 2026-11-04 | 2026-08-26 | passA | events.linuxfoundation.org/about/calendar/ lists 'Open Source in Finance Forum New York, Nov 4-5, 2026, New York, United States' — matches record |
| Open Source Summit North America | Vancouver | 2027-05-17 | 2026-08-26 | passB | events.linuxfoundation.org calendar: 'Open Source Summit North America, May 17-19, 2027 Vancouver, Canada' |
| OpenSearchCon North America | San Jose | 2026-09-22 | 2026-08-26 | passA | events.linuxfoundation.org/about/calendar/ lists 'OpenSearchCon North America, Sep 22-24, 2026, San Jose, United States' — matches record |
| OPI Summit on DPU/IPUs | San Jose | 2026-10-15 | 2026-08-26 | passA | opiproject.org events: 'October 15, 2026 * San Jose, CA ... October 15 @ 8:00 am - 2:00 pm' — matches record |
| Orlando Code Camp | Orlando | — | 2026-08-26 | passC | orlandocodecamp.com live, 18th annual, Seminole State College (Orlando metro); April 11 2026 edition past, no next date |
| Ottawa Innovation Week | Ottawa | — | 2026-08-26 | passC | investottawa.ca/innovation-week live, Ottawa; June 8-12 2026 edition past, no next date |
| Out in Tech | Multiple cities | — | 2026-08-26 | unblockB | outintech.com loads (HTTP 200), title 'Out In Tech'. It is the correct organiser for the LGBTQ+ tech chapter meetup series, advertising the 2026 Out in Tech Leadership Institute as an in-person 'two and a half immersive days in New York City' plus chapter counts and an events index. Correct link for a multi-city meetup-series record; no single date applies. |
| OWASP Global AppSec USA | San Francisco | 2026-11-02 | 2026-08-26 | passA | owasp.org/events/: 'OWASP Global AppSec USA 2026 - San Francisco, CA, November 2-6, 2026' — matches record |
| OwlHacks | Philadelphia | 2026-09-26 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Pacific Northwest Software Symposium | Seattle | 2026-11-12 | 2026-08-26 | passA | nofluffjuststuff.com tour list: 'Pacific Northwest Software Symposium, November 12 - 13, 2026' (Seattle) - matches record |
| Pacific NW Software Quality Conference | Portland | 2026-10-12 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Partner Vibe | Salt Lake City | 2026-09-21 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| PASS Data Community Summit West | Seattle | 2026-11-09 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Pathways to Progress | Charleston | 2027-04-29 | 2026-08-26 | passB | generationwv.org: 'Pathways to Progress will return on April 29, 2027, in Charleston, WV' |
| PAX East | Boston | 2027-04-22 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| PAX Unplugged | Philadelphia | 2026-12-04 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| PAX West | Seattle | 2026-09-04 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| PEI BioAlliance Summer Social | Charlottetown | — | 2026-08-26 | passC | peibioalliance.com/events live, Charlottetown PEI; 'Summer Social 2026' listed for July 14 2026 (past), nothing upcoming |
| PennApps | Philadelphia | — | 2026-08-26 | passC | pennapps.com live (UPenn, Philadelphia), says the hackathon runs in the spring semester with applications in October; no dates published |
| PGConf.dev | Montreal | 2027-05-11 | 2026-08-26 | passB | 2027.pgconf.dev: 'May 11th - 14th, 2027' in 'Montreal, QC, Canada' at Plaza Centre-Ville |
| Philly Tech Week | Philadelphia | — | 2026-08-26 | passC | phillytechweek.com live, Philadelphia; May 4-8 2026 edition past, no next date |
| Pittsburgh TechFest | Pittsburgh | 2026-10-30 | 2026-08-26 | passA | pghtech.org/events calendar lists 'Pittsburgh TechFest 2026' on 30 Oct — matches record |
| PodCamp Toronto | Toronto | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Portland Retro Gaming Expo | Portland | — | 2026-08-26 | passC | retrogamingexpo.com live, Portland OR, posting PRGE 2026 guest announcements through July 2026; countdown only, no readable dates |
| posit::conf | Houston | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Prairie Capital Summit | Fargo | 2026-10-07 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Prairie Dev Con | Winnipeg | 2026-09-21 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Product-Led Summit Denver | Denver | 2027-04-07 | 2026-08-26 | passB | world.productledalliance.com calendar: 'Apr 07 & 08, 2027' in Denver |
| Product-Led Summit San Francisco | San Francisco | 2026-09-22 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Product-Led Summit Seattle | Seattle | 2027-06-16 | 2026-08-26 | passB | world.productledalliance.com calendar: 'Jun 16 & 17, 2027' in Seattle |
| Product-Led Summit Toronto | Toronto | 2026-11-12 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Prompt Victoria AI Conference | Victoria | 2026-11-05 | 2026-08-26 | passA | members.viatec.ca event detail page: 'Thursday, November 5, 2026 (8:00 AM - 5:30 PM)' — matches record |
| PTC Annual Conference | Honolulu | 2027-01-17 | 2026-08-26 | passB | ptc.org header shows PTC 27 on 17-20 January 2027 in Honolulu, Hawaii |
| Puget Sound Programming Python (PuPPy) | Seattle | — | 2026-08-26 | passC | meetup.com/psppython loads, Seattle WA, 10,912 members with regular hack nights - active recurring series, no single next date |
| PyBay | San Francisco | 2026-10-03 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| PyCascades | Vancouver | — | 2026-08-26 | passC | pycascades.com live, next edition stated as Vancouver BC; 'occurs each year around early spring' with no dates announced |
| PyCon US | Long Beach | — | 2026-08-26 | passC | pycon.org live, 'PyCon US 2026 and 2027 will be held in Long Beach, California'; no exact dates on the page |
| PyLadies | Multiple cities | — | 2026-08-26 | passC | pyladies.com/locations live, ~220 chapter locations listed, footer 2007-2026; no dates published |
| PyOhio | Cleveland | — | 2026-08-26 | passC | pyohio.org live, Cleveland State University Student Center; July 25-26 2026 edition past, no next date |
| QCon San Francisco | San Francisco | 2026-11-16 | 2026-08-26 | passB | qconsf.com shows 'Nov 16-18, 2026' conference plus 'Nov 19-20, 2026' training at Hyatt Regency SF; record span 11-16..11-20 covers conference plus training days |
| Quantum.Tech USA | Boston | 2027-05-25 | 2026-08-26 | passB | alphaevents.com/events-quantumtechus: 'May 25 - 26, 2027 / Encore Boston Harbor / Boston, United States' (branded Quantum.Tech World 2027, co-located with Compute.Tech) |
| Rails Camp West | Otis | 2026-09-07 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Rails World | Austin | 2026-09-23 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Rally Innovation Conference | Indianapolis | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Recurse Center | Brooklyn | — | 2026-08-26 | passC | recurse.com live, Brooklyn NY (with remote option); 'new batches start every six weeks', no fixed dates |
| Red Hat Summit | Boston | 2027-05-25 | 2026-08-26 | passB | redhat.com/en/summit: 'Red Hat Summit, happening May 25-27, 2027' at the Boston Convention and Exhibition Center |
| RedacteCON | Grand Junction | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Refresh Miami | Miami | — | 2026-08-26 | passC | refreshmiami.com live and active (events listed through Aug-Nov 2026), Miami/South Florida tech community |
| RenderATL | Atlanta | 2027-08-18 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Reno Startup Week | Reno | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| RevolutionUC | Cincinnati | 2027-02-27 | 2026-08-26 | passB | revolutionuc.com only says 'Spring 2027'; the MLH 2027 season listing shows RevolutionUC 'FEB 27 - 28', Cincinnati, Ohio - matches the record |
| Rhode Island Startup Week | Providence | 2026-09-18 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| RIHub Pizza & Pitches | Providence | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| RIT University-Wide Career Fair | Rochester | — | 2026-08-26 | passC | rit.edu/careerservices live, Rochester NY, lists the University-Wide Career Fair under Events with 2026 news; no dated next fair published |
| Rochester Security Summit | Rochester | 2026-10-14 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Rocky Mountain Ruby | Boulder | 2026-09-28 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| ROS By-The-Bay | Sunnyvale | 2026-09-03 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Rowdy Hacks | San Antonio | 2026-10-03 | 2026-08-26 | unblockA | rowdyhacks.org returns 200 via curl but is client-rendered with no date in the HTML. Corroborated by MLH: mlh.io/seasons/2027/events event record slug 'rowdy-hacks', startsAt 2026-10-03, endsAt 2026-10-04, dateRange 'OCT 03 - 04', venue city San Antonio, Texas, US; MLH links out to https://rowdyhacks.org/ (same URL as the record). Matches stored 2026-10-03 / 2026-10-04 and city San Antonio. Date sourced from MLH, not the organiser. |
| RSAC Conference | San Francisco | 2027-04-05 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| RubyConf | Las Vegas | — | 2026-08-26 | passC | rubycentral.org/conferences lists RubyConf 2026 in Las Vegas July 14-16 2026 (past); no next date |
| RustConf | Montreal | 2026-09-08 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| RVAsec | Richmond | — | 2026-08-26 | passC | rvasec.com live, Richmond VA; June 9-10 2026 edition past, no next date |
| rvatech/Women in Technology Conference | Richmond | 2026-11-17 | 2026-08-26 | passB | rvatech.com premier-conferences page lists the Women in Technology Conference for 'November 17, 2026'; city not printed on the page but rvatech events are Richmond |
| SAAS NORTH | Ottawa | 2026-11-04 | 2026-08-26 | passA | saasnorth.com: 'November 4-5, 2026 at the Shaw Centre in Ottawa, Canada' - matches record |
| SaaStr Annual | San Mateo | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Sacramento Summer Startup Party | Sacramento | — | 2026-08-26 | passC | startupsac.com live and active in Sacramento (weekly startup-events roundups through Aug 2026), but the Summer Startup Party is not named anywhere on the page - link quality flagged |
| Sacramento Tech Week | Sacramento | 2026-10-19 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| SAINTCON | Provo | 2026-10-27 | 2026-08-26 | passA | saintcon.org: 'October 27 to 30, 2026 - UVCC - Provo, UT' — matches record |
| Salt Lake City Day of Data | Salt Lake City | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| San Diego CyberCon | San Diego | 2026-11-13 | 2026-08-26 | passA | sdcybercon.org: 'When: CONFERENCE, Fri Nov 13, 2026' - matches record |
| San Francisco Python Meetup Group | San Francisco | — | 2026-08-26 | passC | meetup.com/sfpython loads, San Francisco CA, 13,241 members, '20+ developer focused live events' a year - active recurring series |
| SANS AI Cybersecurity Summit | Arlington | 2026-11-02 | 2026-08-26 | passA | sans.org training-events list shows 'SANS AI Cybersecurity Summit Fall 2026, Mon, Nov 2 - Tue, Nov 3, 2026, Arlington, VA, US and Virtual' - matches record |
| SANS NetWars Tournament | Multiple cities | — | 2026-08-26 | passC | sans.org/cyber-ranges live and describes the NetWars tournament suite; schedule sits behind a separate page, no dates or cities published here |
| SANS Virginia Beach | Virginia Beach | 2026-08-24 | 2026-08-26 | passA | sans.org/cyber-security-training-events/virginia-beach-2026/ shows 'Mon, Aug 24 - Fri, Sep 4, 2026', Virginia Beach, Virginia — matches record |
| Santa Monica New Tech | Santa Monica | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| SAP Connect | Las Vegas | 2026-10-05 | 2026-08-26 | unblockA | www.sap.com is 403 to curl on every path and UA tried (/events.html, /events/sap-connect.html, /about/events/sap-connect.html, events.sap.com; plain, --compressed, --http1.1 and a Firefox UA all 403). Confirmed instead from SAP's own readable properties: community.sap.com search for 'SAP Connect 2026' returns an SAP post stating 'registration is officially live for Success Connect at SAP Connect! The event will take place October 5-7, 2026 in Las Vegas. In its second year...'. news.sap.com corroborates the series and the city - its SAP Connect tag page carries six October 2025 articles describing 'the inaugural SAP Connect event in Las Vegas, Nevada', so 2026 is the second edition. Matches stored 2026-10-05 / 2026-10-07 and city Las Vegas. |
| SBUHacks | Stony Brook | 2026-10-09 | 2026-08-26 | unblockA | hack.sbcs.io returns 200 (title 'SBUHacks 2026') but carries no date - the page still shows 'This website is currently under construction' copy. Corroborated by MLH: mlh.io/seasons/2027/events event record slug 'sbuhacks-5f', startsAt 2026-10-09, endsAt 2026-10-11, dateRange 'OCT 09 - 11', venue Stony Brook, New York, US, linking out to https://hack.sbcs.io/ (same URL as the record). Matches stored 2026-10-09 / 2026-10-11 and city Stony Brook. Date sourced from MLH, not the organiser. |
| SC Conference (Supercomputing) | Chicago | 2026-11-15 | 2026-08-26 | passA | sc26.supercomputing.org meta description: 'The International Conference for High Performance Computing, Networking, Storage, and Analysis - 15-20 Nov 2026 - Chicago, IL' - matches record |
| SCaLE | Pasadena | 2027-04-01 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Scenic City Summit | Chattanooga | — | 2026-08-26 | 2 | spot-check by the researcher after merge |
| Scrum Day Houston | Houston | 2026-10-06 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Scrum Day Madison | Madison | 2026-10-15 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| SeaGL | Seattle | 2026-10-23 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Seattle Tech Week | Seattle | — | 2026-08-26 | passC | seattletechweek.com 301s to the organiser's Luma page, which says 'Dates for Seattle Tech Week 2027 are TBD - Subscribe to be the first to know' |
| SeattleJS | Seattle | — | 2026-08-26 | passC | meetup.com/seattlejs loads, Seattle WA, 7,259 members with 45 upcoming events - active recurring series |
| SecKC | Kansas City | 2026-09-08 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| SecureWV | Charleston | 2026-10-22 | 2026-08-26 | passA | securewv.org: 'October 22-23, 2026, Charleston Coliseum & Convention Center' — matches record |
| Security BSides Albuquerque | Albuquerque | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Security BSides Delaware | Newark | 2026-11-13 | 2026-08-26 | passA | bsidesdelaware.com: 'Security BSides Delaware is November 13 - 14, 2026 @ The University of Delaware' (Newark, DE) - matches record |
| seL4 Summit | Vancouver | 2026-09-01 | 2026-08-26 | passA | sel4.systems/Summit/2026/ shows 'Vancouver, Canada, 1 - 3 September 2026' — matches record |
| SF Climate Week | San Francisco | — | 2026-08-26 | passC | sfclimateweek.org live, San Francisco Bay Area; April 18-26 2026 edition past, no next date |
| SF Hacks | San Francisco | 2027-02-19 | 2026-08-26 | passB | sfhacks.io returns 403 to fetch; the MLH 2027 season listing shows SF Hacks 'FEB 19 - 21', San Francisco, CA - matches the record |
| SF Tech Week | San Francisco | 2026-10-05 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| SheHacks+ | London | — | 2026-08-26 | passC | shehacks.ca live, Western University London ON; Jan 9-11 2026 edition past, no next date |
| ShellHacks | Miami | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| SHPE National Convention | Indianapolis | 2026-10-28 | 2026-08-26 | passA | shpe.org Future Conventions table: 'October 28-31, 2026 / Indianapolis, IN' — matches record |
| SIGGRAPH | Los Angeles | — | 2026-08-26 | orchestrator | s2026.siggraph.org confirms 19-23 July 2026 at LA Convention Center; 2027 city unpublished |
| Silicon Couloir Chance Meetings | Jackson | — | 2026-08-26 | passC | siliconcouloir.com/chance-meetings live, Teton/Jackson WY networking event on 'the first Monday of most months, 5-7pm' - recurring, no dates on the page |
| Silicon Couloir Pitch Day | Jackson | 2026-09-24 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Silicon Prairie Startup Week | Omaha | — | 2026-08-26 | passC | siliconprairienews.com event page live, Nebraska (Lincoln and Omaha); the URL is the 2025 edition, Oct 6-11 2025, past - no 2026 page or date |
| Silicon Slopes Summit | Salt Lake City | — | 2026-08-26 | passC | siliconslopes.com resolves and serves the Silicon Slopes page (JS-only body, 'For Utahns, By Utahns'); no summit date readable |
| Slate Summit | Nashville | — | 2026-08-26 | passC | technolutions.com/slatesummit2026 live, Music City Center Nashville TN; June 24-26 2026 edition past, no next date |
| SLOSS.tech | Birmingham | 2027-06-23 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| Snowflake Summit | San Francisco | 2027-06-07 | 2026-08-26 | passB | snowflake.com/summit/: 'JUNE 7 - 10, 2027' at MOSCONE CENTER, San Francisco |
| Southeast Cybersecurity Summit | Birmingham | — | 2026-08-26 | passC | secybersecurity.com live, Birmingham Jefferson Convention Complex; April 15-16 2026 edition past, no next date |
| SouthEast LinuxFest | Charlotte | — | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Southwestern Ontario Drupal Camp | Multiple cities | 2026-10-23 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Space and Missile Defense Symposium | Huntsville | 2027-08-10 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| SpartaHack | East Lansing | 2027-02-06 | 2026-08-26 | passB | spartahack.com: 'Feb 6-7, 2027', 'East Lansing, Michigan', MSU STEM Building |
| Speed Venture Summit | Concord | 2026-10-13 | 2026-08-26 | passA | nhtechalliance.org/speed-venture-summit: 'October 13th, 2026, 3:00 - 5:00 PM, The Hotel Concord' — matches record |
| SpiceWorld | Austin | 2026-11-12 | 2026-08-26 | passA | spiceworks.com/spiceworld/: 'SpiceWorld 2026 returns to Austin on Nov. 12-13!' - matches record |
| Splunk .conf | Denver | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| SQLSaturday Minnesota | St. Paul | 2026-10-24 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| STAREAST | Orlando | 2027-04-25 | 2026-08-26 | unblockA | stareast.techwell.com returns 200 via curl with page title 'STAREAST Software Testing Conference / April 25-30, 2027 / Orlando, FL & Online' and body copy 'April 25 - 30, 2027' plus 'STAREAST 2027 will be held at the Rosen Centre Hotel in Orlando, Florida for in-person attendees'. Matches stored 2027-04-25 / 2027-04-30 and city Orlando. |
| Startup Grind Global Conference | Redwood City | 2027-04-27 | 2026-08-26 | passB | startupgrind.tech/conference/: 'Startup Grind Conference / Apr. 27-28, 2027 / Silicon Valley', venue Fox Theatre, 2215 Broadway, Redwood City CA |
| Startup Sioux Falls Founders Meetup | Sioux Falls | — | 2026-08-26 | passC | startupsiouxfalls.com/events live with 42 events listed, Founders Meetup held Aug 19 2026, Sioux Falls SD - recurring, no single next date |
| Startup Weekend Omaha | Omaha | — | 2026-08-26 | passC | techstars.com/communities/startup-weekend live and describes the three-day format, but lists no Omaha event or date - generic programme page, link quality flagged |
| Startup302 | Wilmington | — | 2026-08-26 | passC | startup302.org live, Delaware funding competition; 'Stay Tuned for 2026 Info' with no dates, latest winners listed 2024 |
| StartupBREW Fargo | Fargo | — | 2026-08-26 | passC | emergingprairie.com/startupbrew-fargo live, weekly Wednesday 8:00-9:30am networking at 118 Broadway N, Fargo ND - recurring, no fixed dates |
| StartupCincy Week | Cincinnati | 2026-10-05 | 2026-08-26 | passA | startupcincyweek.com hero: 'OCTOBER 5 - 8, 2026 / CINCINNATI, OHIO' — matches record (curl bypassed the earlier block) |
| Startupfest | Montreal | 2027-07-07 | 2026-08-26 | passB | startupfest.com: 'July 7-9, 2027 / Montreal', venue Grand Quay in the Old Port |
| STARWEST | Anaheim | 2026-09-20 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| SteelHacks | Pittsburgh | 2026-09-19 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Step San Francisco | San Francisco | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Stir Trek | Columbus | — | 2026-08-26 | passC | stirtrek.com live, AMC Easton 30 Columbus OH; May 1 2026 edition past, no next date |
| STL TechWeek | St. Louis | — | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Stripe Sessions | San Francisco | 2027-04-28 | 2026-08-26 | passB | stripe.com/sessions: 'Join us 28-30 April in San Francisco' for Sessions 2027 |
| Summerfest Tech | Milwaukee | — | 2026-08-26 | passC | summerfest-tech.com live, 639 E. Summerfest Place Milwaukee WI, 2026 agenda/speakers pages present but no dates published |
| SwampHacks | Gainesville | 2026-10-16 | 2026-08-26 | passA | swamphacks.com SPA bundle FAQ: 'SwampHacks will be 36-hours beginning October 16 evening and going until October 18 afternoon' — matches record |
| SXSW | Austin | 2027-03-15 | 2026-08-26 | passB | sxsw.com: 'March 15-21, 2027 / Austin, TX' |
| SXSW EDU | Austin | 2027-03-13 | 2026-08-26 | passB | sxswedu.com: 'March 13-16, 2027 / Austin, TX' |
| TAG Chairs' Gala | Atlanta | 2026-11-19 | 2026-08-26 | passB | members.tagonline.org calendar lists TAG Chairs Gala 2026 on Thursday, November 19, 2026, 6:00-11:00 PM; TAG is Atlanta-based |
| TailscaleUp | San Francisco | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Tampa Bay Tech Community Events | Tampa | — | 2026-08-26 | passC | tampa.dev live, Tampa Bay tech events aggregator, actively listing events through early September 2026 |
| Tampa Bay Wave BlueTech|X Pitch Night | Tampa | 2026-09-17 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Tech For Good Conference | Chicago | — | 2026-08-26 | passC | techforgoodconference.org live, University of Chicago; Feb 27-28 2026 edition past, no next date |
| Tech Fuse Des Moines | Des Moines | 2026-10-15 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Tech Homecoming | Ann Arbor | 2026-09-22 | 2026-08-26 | passA | a2tech360.com page (still at the /tech-homecoming-2025/ slug) is headed 'Tech Homecoming 2026' and shows 'September 22, 2026 / 4 p.m. - 7 p.m.', presented by Ann Arbor SPARK — matches record |
| tech SAVannah Tech Tuesday | Savannah | 2026-09-08 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Tech Thursday Winnipeg | Winnipeg | — | 2026-08-26 | passC | eventbrite collection live and active for Winnipeg Tech Thursday (events listed through Aug 2026) - recurring, no single next date |
| Tech Titans Awards Gala | Plano | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Tech Week Boston | Boston | — | 2026-08-26 | passC | tech-week.com/calendar/boston live, Boston; May 26-31 2026 edition past, no next date |
| Tech Week Los Angeles | Los Angeles | 2026-10-12 | 2026-08-26 | passA | tech-week.com/calendar: 'SF October 5-11, LA October 12-18' — matches record |
| Tech Week New York | New York | — | 2026-08-26 | passC | tech-week.com/calendar loads (Tech Week 2026) but currently lists only SF Oct 5-11 and LA Oct 12-18, no New York edition, and tech-week.com/calendar/new-york 404s - link quality flagged, no date |
| TechChicago Week | Chicago | 2027-07-19 | 2026-08-26 | passB | gotechchicago.com/week/: 'July 19-25, 2027' in Chicago |
| TechCon 365 / DataCon / PWRCon Seattle | Seattle | — | 2026-08-26 | passA | techcon365.com home page: 'Seattle, Washington ... August 24-28, 2026, Seattle Convention Center' — matches record (fetched via curl; WebFetch got 403) |
| TechCon 365 Dallas | Dallas | 2026-11-02 | 2026-08-26 | passA | techcon365.com home page: 'Dallas, Texas TechCon 365 November 2-6, 2026, Irving Convention Center' — dates match record |
| TechCon SoCal | San Diego | — | 2026-08-26 | passC | startupsd.org TechCon SoCal 2026 page live, San Diego, May 21-22 2026 marked 'This event has passed'; no next date |
| TechConnect WV Women in Tech Conference | South Charleston | — | 2026-08-26 | passC | techconnectwv.org/programs live, 1740 Union Carbide Drive, South Charleston WV; lists 'Women and Tech Conference (coming spring 2026)' with no exact date |
| TechCrunch Disrupt | San Francisco | 2026-10-13 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| TechExit.io Calgary | Calgary | 2026-10-01 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| TechFest Louisville | Louisville | — | 2026-08-26 | passC | techfestlou.com live, Louisville KY; Aug 20-21 2026 edition just past (sold out), no next date |
| Techlahoma Community Meetups | Oklahoma City | — | 2026-08-26 | passC | meetup.com/oklahoma-city-techlahoma loads, Oklahoma City OK, 1,363 members, upcoming events incl. ThunderPlains Oct 21 2026 - active recurring series |
| TechMentor & Cybersecurity Live! @ Microsoft HQ | Redmond | 2027-08-09 | 2026-08-26 | passB | techmentorevents.com microsofthq-2027: 'TechMentor & CyberSecurity Live! @Microsoft HQ / August 9-13, 2027 / Microsoft Headquarters, Redmond, WA' |
| techNL Industry Awards | St. John's | — | 2026-08-26 | passC | technl.ca/news-events live, St. John's NL; techNL Industry Awards 2026 held April 17 2026 (past), no next date |
| techNL Innovation Week | St. John's | — | 2026-08-26 | passC | technl.ca live and current (2026 news), carries an 'Innovation Week 2026' section in navigation; no dates published |
| Techqueria | Multiple cities | — | 2026-08-26 | unblockB | techqueria.org loads (HTTP 200), title 'Hola! - Techqueria'. Correct organiser for the Latine-in-tech community, with a chapters index and an 'Events / Techqueria Summit 2026' nav entry covering in-person events across the US. Correct link for a multi-city meetup-series record; no single date applies. |
| TECHSPO Boston | Boston | — | 2026-08-26 | passC | techspoboston.com live, Hyatt Regency Boston; May 12-13 2026 edition past, no next date. Note: injected casino-spam links in the page footer |
| TECHSPO New York | New York | 2027-04-22 | 2026-08-26 | passB | techsponyc.com: 'April 22-23, 2027' at the New York Marriott at the Brooklyn Bridge Hotel, New York City NY |
| TECHSPO Phoenix | Phoenix | — | 2026-08-26 | passC | techspophoenix.com live, Hyatt Regency Phoenix, 122 N 2nd St; June 11-12 2026 edition past, no next date |
| TECHSPO Toronto | Toronto | — | 2026-08-26 | passC | techspotoronto.ca live, Marriott Downtown at CF Toronto Eaton Centre; April 15-16 2026 edition past, no next date. Note: heavy injected casino/pharma spam in the page footer |
| TECHSPO Vancouver | Vancouver | — | 2026-08-26 | passC | techspovancouver.ca live, Paradox Hotel Vancouver BC; April 20-21 2026 edition past, no next date. Note: injected casino spam (Hungarian-language links) in the footer |
| Techstars Startup Weekend | Multiple cities | — | 2026-08-26 | passC | techstars.com/communities/startup-weekend live, describes the three-day format and 'hundreds of events all over the world' with 2026 blog posts; no dates or city list on the page |
| Techstars Startup Weekend Anchorage | Anchorage | — | 2026-08-26 | passC | techstars.com/communities/startup-weekend live but is the generic global programme page - no Anchorage event or date listed; link quality flagged |
| Techstars Startup Weekend London Ontario | London | — | 2026-08-26 | unblockB | techalliance.ca page loads (HTTP 200), titled 'Techstars Startup Weekend London Ontario / TechAlliance of Southwestern Ontario'; its meta description reads 'TechAlliance is bringing Techstars Startup Weekend to London, Ontario for the first time. Build, pitch and launch your startup idea in 54 hours.' The 2026 edition already ran - TechAlliance's news post dated June 3, 2026 is titled 'London's Techstars Startup Weekend 2026 fuels next wave of founders in a 54-hour sprint'. No next date published. Right event, right city. |
| Techstars Startup Weekend Reno | Reno | — | 2026-08-26 | passC | techstars.com/communities/startup-weekend live but is the generic global programme page - no Reno event or date listed; link quality flagged |
| Tennessee Quantum Hackathon | Chattanooga | 2026-11-13 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| TENWEST Festival | Tucson | 2027-03-30 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| Texas Dreamin' | Austin | — | 2026-08-26 | passC | texasdreamin.org live, AT&T Executive Conference Center Austin TX; July 9-10 2026 edition past, no next date |
| Texas Linux Fest | Austin | 2026-11-06 | 2026-08-26 | passA | texaslinuxfest.org: 'Join us at our upcoming 2026 Texas Linux Fest Nov 6-7, 2026' — dates match record (2026 venue not yet named) |
| The AI Conference | San Francisco | 2026-09-29 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| The AI Pivot Conference | Anaheim | 2026-09-25 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| The AI Summit New York | New York | 2026-12-09 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| The Big DiF | Hamilton | — | 2026-08-26 | passC | innovationfactory.ca live, Hamilton ON; 'The Big DiF' 16th annual open house held May 14 2026 (past), no next date |
| The Carpentries Workshops | Multiple cities | — | 2026-08-26 | passC | carpentries.org/workshops live (c 2026) and describes the workshop programme; individual workshop listings sit behind a further link, no dates on this page |
| The Idea Village Demo Day | New Orleans | — | 2026-08-26 | passC | ideavillage.org live, New Orleans LA, carries a 'Demo Day 2026' section; no dates published |
| The Montgomery Summit | Santa Monica | 2027-03-09 | 2026-08-26 | 4a | spot-check: URL loaded, page described the right event, city matched |
| The Newark Summit | Newark | — | 2026-08-26 | unblockB | thenewarksummit.com redirects to /2026/ and loads (HTTP 200), titled 'The Newark Summit'. Copy reads 'See Who Attended Our 3rd Annual Gathering on Feb 9, 2026' and invites people to 'Join Our 4th' annual gathering; the site is actively maintained (news items dated Aug 25, 2026) and the contact block gives a Newark NJ 07102 address. Right event, right city. No 4th-edition date published yet. |
| ThunderPlains | Oklahoma City | 2026-10-21 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| TOJam | Toronto | — | 2026-08-26 | passC | tojam.ca live, free 3-day game jam in Toronto; May 8-10 2026 edition past and the jam-dates block gives only 'May 2027' with no exact days |
| Toronto Game Expo | Toronto | 2026-11-07 | 2026-08-26 | passA | torontogameexpo.ca: 'GAME EXPO NOVEMBER 7 and 8, 2026, Exhibition Place' / 'Better Living Centre, Exhibition Place', Toronto - matches record |
| Toronto Games Week | Toronto | — | 2026-08-26 | passC | torontogamesweek.com live, Toronto; 4th edition concluded ('Thanks for another incredible Toronto Games Week! Stay tuned for next year'), no dates |
| Toronto JavaScript | Toronto | — | 2026-08-26 | passC | meetup.com/torontojs loads, Toronto ON, 13,001 members with recurring monthly TechTalks - active series, no single next date |
| Toronto Tech Week | Toronto | — | 2026-08-26 | passC | torontotechweek.com live, Toronto; TTW 2026 concluded (post-event recap, 'See you in 2027'), no dates for 2027 |
| TransportationCamp DC | Washington | 2027-01-09 | 2026-08-26 | passB | t4america.org/transportation-camp/: 'Mark your calendar for Saturday, January 9, 2027' in Washington, DC |
| TransportationCamp New England | Cambridge | 2026-10-17 | 2026-08-26 | passA | transportationcamp.org/events/new-england-2026: 'Saturday, October 17, 2026 ... at MIT's Stata Center' — matches record |
| TransportationCamp PHL | Philadelphia | — | 2026-08-26 | passC | transportationcamp.org/events/phl2026 live, Philadelphia unconference; March 21 2026 edition past, no next date |
| TreeHacks | Stanford | — | 2026-08-26 | passC | treehacks.com live, Stanford University; Feb 13-15 2026 edition past, no next date |
| Triangle InfoSeCon | Raleigh | 2026-10-30 | 2026-08-26 | passA | triangleinfosecon.com: 'Triangle InfoSeCon, Friday, October 30, 2026, Raleigh Convention Center' — matches record |
| Tulsa Tech Week | Tulsa | 2026-09-21 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Twilio SIGNAL | San Francisco | 2027-04-13 | 2026-08-26 | passB | signal.twilio.com: 'Save the date / San Francisco SIGNAL 2027 ... Join us on April 13-14, 2027'. Flagged as a save-the-date page, so worth re-checking once the agenda opens |
| Twin Cities Software Symposium | Minneapolis | — | 2026-08-26 | passC | nofluffjuststuff.com/minneapolis live, Minneapolis MN; June 4-5 2026 edition past, no next date |
| UC Berkeley AI Hackathon | Berkeley | — | 2026-08-26 | passC | live.hackberkeley.org live, MLK Student Union, Berkeley CA; June 20-21 2026 edition past, no next date |
| UGAHacks | Athens | 2027-02-05 | 2026-08-26 | passB | ugahacks.com shows only 'UGAHacks 12 Pre-registration Now Open!' with no dates; the MLH 2027 season listing gives 'FEB 05 - 07', Athens, Georgia - matches the record |
| UIUCTF | Urbana-Champaign | — | 2026-08-26 | passC | uiuc.tf live, run by SIGPwny at University of Illinois Urbana-Champaign; 2026 quest began 2026-08-08 for 48h (past), no next date |
| UNBOUND (formerly INBOUND) | Boston | 2026-09-16 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Uniting the Prairies | Saskatoon | 2027-04-28 | 2026-08-26 | passB | unitingtheprairies.com: 'April 28-29, 2027 / Remai Modern, Saskatoon' |
| University of Idaho Engineering Design EXPO | Moscow | 2027-04-29 | 2026-08-26 | passB | uidaho.edu/engr/expo: 'April 29 and 30, 2027' on the University of Idaho campus, Moscow ID |
| UofTHacks | Toronto | 2027-01-15 | 2026-08-26 | passB | uofthacks.com hero shows 'January 2027 / In-person event' (its FAQ text is stale from UofTHacks 13); the MLH 2027 season listing gives 'JAN 15 - 17', Toronto, Ontario - matches the record |
| uOttaHack | Ottawa | 2027-01-15 | 2026-08-26 | passB | 2027.uottahack.ca renders only 'uOttaHack 9' with no dates; the MLH 2027 season listing shows uOttaHack 9 'JAN 15 - 17', Ottawa, Ontario - matches the record |
| Upper Bound | Edmonton | 2027-05-18 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Urban Futures: Co-Creating Climate Resilience in NYC Hackathon | New York | — | 2026-08-26 | unblockB | amnh.org page loads (HTTP 200), title 'Hackathon 2026 NYC - Urban Futures: Climate Resilience / AMNH'. The January 15-17, 2026 edition is past and the page now states '2027 hackathon dates, and the link to apply will be posted later this year. Dates: To be announced.' Location given as 'American Museum of Natural History, New York'. Right event, right city, no date yet. |
| Utah Tech Calendar Community Meetups | Salt Lake City | — | 2026-08-26 | passC | utahtechcalendar.com live, 'updated nightly' calendar of in-person Utah tech events across Salt Lake City/Provo/Lehi/Ogden, listings into 2027 |
| UtahJS Conference | Sandy | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Vancouver Game Garden | Vancouver | — | 2026-08-26 | passC | vangamegarden.com live, free indie games showcase in Vancouver BC; June 13-14 2026 edition past, no next date |
| Vancouver Microsoft 365 Summit | Vancouver | 2026-09-03 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Vancouver Startup Week | Vancouver | — | 2026-08-26 | passC | vanstartupweek.ca live, Vancouver BC; VSW 2026 ran May 20-23 2026 (thank-you page up), no next date |
| VCF Swap Meet | Wall | 2026-10-17 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Venture Atlanta | Atlanta | 2026-10-14 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Venture Dallas | Dallas | 2026-10-22 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Vermont Tech Jam | Burlington | 2026-10-24 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Veteran Innovation Hackathon | Mountain View | — | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| VIATEC Awards | Victoria | — | 2026-08-26 | passC | members.viatec.ca event page live, Victoria BC; the 2026 VIATEC Awards were April 1 2026 (past), no next date |
| Victoria Tech Week | Victoria | 2026-09-21 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Video Game Live Expo (VGLX) | Mississauga | 2026-10-24 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| Vintage Computer Festival East | Wall | — | 2026-08-26 | passC | vcfed.org VCF East page live, InfoAge Science and History Museums, 2201 Marconi Road, Wall NJ; April 17-19 2026 edition past, no next date |
| Vintage Computer Festival Midwest | Schaumburg | 2026-09-12 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Vintage Computer Festival Montreal | Montreal | 2026-11-07 | 2026-08-26 | passA | vcfed.org/events/vcf-montreal/: 'VCF Montreal 2026 Version 2.0 - WHEN: Nov. 7-8, 2026', repeated in the site-wide Upcoming Events box - matches record |
| Vintage Computer Festival Southeast | Atlanta | — | 2026-08-26 | passC | vcfed.org VCF Southeast page live, Marriott Renaissance Waverly, 2450 Galleria Pkwy, Atlanta GA; July 31-Aug 2 2026 edition past, no next date |
| Vintage Computer Festival Southwest | Irving | 2027-06-25 | 2026-08-26 | passB | vcfsw.org: 'June 25-27, 2027, The Westin Dallas Fort Worth Airport, 4545 W John Carpenter Fwy, Irving, TX 75063' |
| Vintage Computer Festival West | Mountain View | — | 2026-08-26 | passC | vcfed.org VCF West page live, Computer History Museum, Mountain View CA; Aug 1-2 2026 edition just past, no next date |
| ViVE | Nashville | 2027-03-14 | 2026-08-26 | passB | hlth.com/events/vive/: March 14-17 2027 at Music City Center, 201 Rep. John Lewis Way S, Nashville TN |
| VMware Explore | Las Vegas | — | 2026-08-26 | passC | vmware.com/explore resolves and serves the VMware Explore page (JS-only body); no date readable |
| VSLive! San Diego | San Diego | 2026-09-14 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| VTHacks | Blacksburg | 2026-09-18 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| WeAreDevelopers World Congress | San Jose | 2026-09-23 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| Web Summit Vancouver | Vancouver | 2027-05-25 | 2026-08-26 | 3r1 | verified against organiser page (top-78 by attendance) |
| WEHack | Richardson | 2027-04-10 | 2026-08-26 | passB | wehackutd.com says 'WEHack 2027 Coming Soon / Spring 2027' with no dates; the MLH 2027 season listing shows WEHack 'APR 10 - 11', Richardson, TX - matches the record |
| West Slope Startup Week | Durango | 2026-10-05 | 2026-08-26 | 3r2b | verified against organiser page (autumn date sweep) |
| WEtech Alliance Community Events | Windsor | — | 2026-08-26 | passC | wetech-alliance.com/events live, Windsor ON (and Chatham-Kent), 12 upcoming events listed through September 2026 - active recurring series |
| WiCHacks | Rochester | 2027-02-27 | 2026-08-26 | passB | wichacks.io is a JS shell with no dates; the MLH 2027 season listing shows WiCHacks 'FEB 27 - 28', Rochester, New York - matches the record |
| WiCyS Conference | National Harbor | — | 2026-08-26 | passC | wicys.org live and current (Virtual 2026, RSAC 2026, Career Fair 2026); WiCyS 2027 referenced with neither city nor dates announced |
| WildHacks | Evanston | — | 2026-08-26 | passC | wildhacks.net resolves and serves 'WildHacks 2026' with an MLH 2026 season badge (JS-rendered body); no date readable |
| Women in Tech WNY | Buffalo | — | 2026-08-26 | passC | info.techbuffalo.org/witwny live, Buffalo/Western New York; Thursday March 26 2026 edition past, no next date |
| WomenHack | Multiple cities | — | 2026-08-26 | passC | womenhack.com live (c 2026), lists recruiting events across San Francisco, New York, Toronto, Edmonton and other cities; event dates shown without years |
| WordCamp Canada | Vancouver | 2026-11-05 | 2026-08-26 | passA | canada.wordcamp.org/2026/: 'November 5-6, 2026 - Vancouver, BC' — matches record |
| WordCamp New York City | New York | — | 2026-08-26 | passC | nyc.wordcamp.org/2026 live, says 'WordCamp New York City 2026 is in the early planning stages' - no venue or dates yet |
| WordCamp Santa Clarita | Santa Clarita | — | 2026-08-26 | passC | santaclarita.wordcamp.org/2027 live, Santa Clarita CA; notice says the event has been postponed to Spring 2027 with no dates set |
| Workplace Ninjas US | Scottsdale | 2027-01-11 | 2026-08-26 | passB | dev.events Arizona listing shows 'Workplace Ninjas 2027 US', 'Jan 11-13 27', Scottsdale AZ |
| WTM Montreal | Montreal | — | 2026-08-26 | passC | wtmmontreal.com live, Women Techmakers Montreal (non-profit since 2015); WTM Day April 18 2026 past, no next date |
| XP Game Connect Atlantic | Halifax | — | 2026-08-26 | passC | xpgaming.biz page live, one-day B2B games event for Atlantic Canada, Halifax venues (Old Triangle, Pacifico); June 4-5 2026 edition past, no next date |
| XP Game Summit | Toronto | 2027-06-10 | 2026-08-26 | passB | xpgamesummit.com: 'XP Game Summit returns June 10-11, 2027', 'toronto, canada' |
| Y Combinator Demo Day | San Francisco | 2026-09-10 | 2026-08-26 | 3r2a | verified against organiser page (near-term date sweep) |
| Yale Healthcare Hackathon | New Haven | — | 2026-08-26 | passC | ventures.yale.edu page live, Yale Ventures, 101 College Street, New Haven CT; '2026 Healthcare Hackathon' registration link but no dates |
| YHack | New Haven | — | 2026-08-26 | unblockB | yhack.org loads (HTTP 200), title 'YHack - Spring 2026', describing 'Yale's flagship hackathon, bringing together 600+ college builders for 24 hours of weekend hacking'. The March 28-29, 2026 edition is past and the page now says 'View projects and subscribe for YHack 2027 updates!' - alive, but no 2027 date published. Right event, right city (Yale, New Haven). |
| YQuantum | New Haven | — | 2026-08-26 | passC | yquantum.dev live, Yale Undergraduate Quantum Computing / Yale Quantum Institute, New Haven CT; April 4-5 2026 edition past, no next date |
| YYC DataCon | Calgary | 2026-09-11 | 2026-08-26 | 2 | spot-check by the researcher after merge |
| Zeek Workshop Berkeley | Berkeley | 2026-09-10 | 2026-08-26 | passA | zeek.org promo banner: 'Zeek Workshop - Berkeley, September 10-11, 2026' — matches record (curl bypassed the 403 that blocked earlier passes) |
