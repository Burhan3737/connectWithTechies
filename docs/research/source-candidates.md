# Source candidates for the feed

Researched 2026-10-03. I fetched each source with `curl` (Chrome user-agent, no cookies, no keys) or, in a few cases, found it through web search and then fetched it. Counts are what the fetch returned on that day. **Overlap** was measured against `data/events.json` (2,453 rows) and `data/raw/feed.json` by URL and name. Anything I inferred without fetching is marked *(inferred)*.

The sources we already read (Luma, Meetup, Eventbrite, MLH, Devpost, confs.tech) are not re-proposed. Notes on them are at the end.

## Summary

- **The biggest gap is Partiful, and Cerebral Valley fills it.** The dataset has 1 Partiful URL in total. Cerebral Valley's public event API lists 967 upcoming AI events, about 551 of them in the US or Canada. 240 of those link to Partiful and 148 to Luma, and only 53 are already in our data. SF Tech Week (Oct 5–11) appears to run mostly on Partiful *(inferred from the link mix)*.
- **confs.tech supplies only 24 rows.** The developers.events dataset (MIT licence, pushed to today) has **149 upcoming US/Canada conferences**. 39 of them are on hosts we have never seen, and the rest would be re-confirmed by a second source.
- **Bevy is a platform family, so one adapter covers many communities.** It runs Google Developer Groups (176 US + 28 CA live events), Salesforce Trailblazer groups (110 US), Startup Grind (39 US), Atlassian ACE (27 US + 6 CA), Tableau user groups (27 + 5), Snowflake, Figma Friends, UiPath and CNCF/KCD. Our data has 10 GDG rows and 0 Trailblazer rows. Bevy's JSON API exists, but `robots.txt` disallows `/api/`. A robots-clean route works: monthly event sitemaps, then each event page's JSON-LD (venue, address, in-person/online).
- **"The Events Calendar" WordPress plugin is a second platform family.** It exposes a REST API (`/wp-json/tribe/events/v1/events`) and an iCal export (`?ical=1`). BSides (94 upcoming, 44 in North America) and GeekWire's Seattle calendar (67) both use it. Our existing `ical` adapter can already read the iCal form.
- **Hack Club** has a public JSON API of high-school hackathons with lat/long (13 NA in-person upcoming, 11 not in our data).
- **Some promising sources are off-limits or not worth reading.** AI Tinkerers (264 cities) says in its `agents.md` that the site "is not a general public data feed" and must not be bulk-scraped. 10times and Splash return 403. Noisebridge sits behind an anti-scraper proof-of-work wall. Facebook, LinkedIn, X, Reddit and Discord cannot be read by script.

### ADD NOW, in priority order

| # | Source | Access | Adds (US/CA, upcoming) |
|---|---|---|---|
| 1 | Cerebral Valley | public JSON API `api.cerebralvalley.ai/v1/public/event/pull` | ~550 AI events, ~500 new, mostly Partiful/Luma |
| 2 | Bevy family (GDG, Trailblazer, Startup Grind, ACE, Tableau, Snowflake, Figma, UiPath, CNCF) | sitemap → event-page JSON-LD (robots-clean); JSON API exists but disallowed | ~450 live events across hosts (incl. virtual) |
| 3 | developers.events | single static JSON file | 149 conferences (39 new hosts) |
| 4 | BSides (bsides.org) | Tribe REST API / iCal | 44 security conferences (maintains 72 hand-curated rows) |
| 5 | GeekWire calendar | Tribe iCal export (REST disallowed) | ~60 Seattle-area events |
| 6 | Hack Club hackathons | public JSON API | 13 high-school hackathons |
| 7 | ETHGlobal (via existing Luma adapter) | add `cal-4BIGfE8WhTFQj9H` to registry | crypto hackathons, happy hours and coworks in NYC/SF/Toronto/Vancouver/Waterloo |
| 8 | Guild.host | public JSON endpoint | ~28 in-person (Toronto/Montréal civic tech, crafters, GraphQL) |

## Ranked table of all candidates

Ranking is value × scriptability. **Vol** is upcoming US/CA events seen on 2026-10-03.

| Rank | Source | Kinds | Vol (US/CA) | Overlap with ours | Access method | Verdict |
|---|---|---|---|---|---|---|
| 1 | [Cerebral Valley](https://cerebralvalley.ai/events) | AI hackathons, demo nights, founder mixers, tech-week parties | ~551 | 53 of 551 | Public JSON API (no key); also 20-item JSON-LD ItemList on /events | **ADD NOW**: biggest single gain, unlocks Partiful |
| 2 | [Bevy: Google Developer Groups](https://gdg.community.dev) | GDG meetups, DevFests, Build with AI, Women Techmakers, study jams | 176 US + 28 CA (incl. virtual) | 10 rows | Sitemaps + event JSON-LD; JSON API (robots-disallowed) | **ADD NOW** |
| 3 | [Bevy: Salesforce Trailblazer groups](https://trailblazercommunitygroups.com) | Salesforce admin/dev user groups | 110 US + 5 CA | 0 | same as GDG | **ADD NOW** (same adapter) |
| 4 | [developers.events](https://developers.events) | dev conferences, community days, with CFP data | 149 | ~110 by host; 39 new | `https://developers.events/all-events.json` (3.3 MB, MIT) | **ADD NOW** |
| 5 | [Bevy: Startup Grind](https://www.startupgrind.com) | founder fireside chats, pitch nights | 39 US | 4 | same as GDG | **ADD NOW** (same adapter) |
| 6 | [Bevy: Atlassian ACE](https://ace.atlassian.com) | Atlassian community events, lean coffee | 27 US + 6 CA | ~0 (34 name hits on "ace", mostly unrelated) | same | **ADD NOW** (same adapter) |
| 7 | [BSides](https://bsides.org/events/) | security community conferences | 44 | 72 BSides rows hand-curated | Tribe REST API + iCal | **ADD NOW**: replaces hand maintenance |
| 8 | [GeekWire calendar](https://www.geekwire.com/calendar/) | Seattle tech meetups, conferences, startup events | 67 (60+ in WA) | 5 | Tribe iCal (`/calendar/?ical=1`); REST disallowed in robots | **ADD NOW** |
| 9 | [Bevy: Tableau user groups](https://usergroups.tableau.com) | data viz user groups | 27 US + 5 CA | not measured | same | **ADD NOW** (same adapter) |
| 10 | [Bevy: Snowflake / Figma Friends / UiPath / CNCF (community2.cncf.io)](https://usergroups.snowflake.com) | data, design, automation, KCDs | 10+1 / 7+5 / 11 / 5 | not measured | same | **ADD NOW** (same adapter, low volume) |
| 11 | [Hack Club hackathons](https://hackathons.hackclub.com) | high-school hackathons | 13 | 2 of 13 | `https://hackathons.hackclub.com/api/events/upcoming` | **ADD NOW** |
| 12 | [ETHGlobal](https://ethglobal.com/events) | crypto hackathons, happy hours, coworking days | ~10/quarter NA *(from page data)* | 1 URL | Their Luma calendar via existing adapter | **ADD NOW** (registry entry only) |
| 13 | [Guild.host](https://guild.host/events) | dev meetups (Toronto, Montréal, Madison...) | ~28 in-person | not measured | `https://guild.host/api/next/events/upcoming` (cursor pagination) | **ADD NOW** (cheap) / LATER |
| 14 | [Gary's Guide](https://www.garysguide.com/events) | NYC + SF startup/VC mixers, talks, breakfasts | ~200 NYC, ~477 SF | not measured | HTML only (no JSON-LD, no feed); Google Calendar template link has dates | **LATER**: high value, brittle HTML scrape |
| 15 | [Techmeme events](https://www.techmeme.com/events) | major industry conferences | ~87 | likely high with confs | Simple HTML rows (date/name/city); outbound links via `/r2/`, which robots disallows | **LATER**: low marginal gain |
| 16 | [dev.events](https://dev.events/NA/US) | conferences + meetups, regional pages | ~30 per region page | high with developers.events | JSON-LD per page (no venue object, city only in description) | **LATER**: developers.events is cleaner |
| 17 | [CTFtime](https://ctftime.org/api/v1/events/) | CTF competitions (`onsite` flag) | 1 of 11 onsite (CyberSci Canada) | 0 | Public JSON API | **LATER**: real but tiny NA onsite volume |
| 18 | [Localist university calendars](https://events.stanford.edu/api/2/events) | university talks, hackathons, entrepreneurship | Stanford 28 "entrepreneurship" / 18 "hackathon" in 90 days; MIT, UT, Cornell ~0 for those keywords | not measured | Public JSON `/api/2/events?days=90&keyword=` on Stanford, MIT, Harvard SEAS, UT Austin, Cornell | **LATER**: noisy, mostly campus-only |
| 19 | [Campus Labs Engage](https://gatech.campuslabs.com/engage/) | student-org events (hack clubs, entrepreneurship clubs) | Georgia Tech 5 for "hackathon"; others 0 | — | Public JSON `/engage/api/discovery/event/search` | **LATER**: student-facing, low yield |
| 20 | [allevents.in](https://allevents.in/san-francisco/technology) | aggregated city "technology" listings | ~12+ per city page | high (re-aggregates Eventbrite/Meetup) | JSON-LD on city/category pages; Crawl-delay 10–30 | **LATER**: discovery only, mixed quality (kids' robotics, outdoor films) |
| 21 | [ProductTank (Mind the Product)](https://www.mindtheproduct.com/producttank/) | product-manager meetups | 208 Meetup groups listed | partly | `__NEXT_DATA__` list of chapters → Meetup URLs | **LATER**: seed for existing Meetup registry, not an adapter |
| 22 | [Meetup Pro network pages](https://www.meetup.com/pro/pydata/) (PyData, etc.) | network-wide meetups | 5 events in JSON-LD per page | Meetup | JSON-LD (5 events); group list client-rendered | **LATER**: better done as registry seeding |
| 23 | [Global Game Jam sites](https://globalgamejam.org/jam-sites/2026) | in-person game jams (one weekend in January) | 836 sites globally in 2026; 2027 page 404 today | 0 | HTML site list per year (Drupal) | **LATER**: revisit in December for 25–31 Jan 2027 |
| 24 | [Techqueria](https://techqueria.org/events/) | Latinx-in-tech events | 0 in Tribe API today | — | Tribe REST API exists (total 0) | **LATER**: watch |
| 25 | [What in the Tech](https://www.whatinthetech.co/events) | city tech events | 0 upcoming today | — | Squarespace `?format=json` works | **LATER**: generic Squarespace pattern |
| 26 | [BC Tech events calendar](https://www.bctechnology.com/events/calendar.cfm) | Vancouver/BC tech events | not counted | — | ColdFusion HTML; Tribe API 403 | **LATER** |
| 27 | [Vancouver Tech Journal](https://vantechjournal.com/t/events) | Vancouver event round-ups | not counted | — | Ghost blog posts (HTML/RSS) *(RSS not tested)* | **LATER**: newsletter prose, hard to parse |
| 28 | [Toronto Tech Week](https://www.torontotechweek.com/) | 150+ partner events (annual) | — | — | 403 to scripts | **LATER**: follow its Luma/partner calendars instead *(inferred)* |
| 29 | [SF/NYC/LA Tech Week (tech-week.com)](https://www.tech-week.com/calendar) | a16z tech weeks | hundreds per week | via Cerebral Valley | 429 (rate-limited) on every try | **NO** direct; covered via Cerebral Valley + Partiful |
| 30 | [Partiful](https://partiful.com/explore) | everything, incl. tech-week parties | — | 1 URL | `__NEXT_DATA__` on `/e/<id>` pages (title, startDate, timezone, locationInfo, status); explore page is general "trending" (dog parades) | **LATER**: use only to re-confirm Partiful URLs found via Cerebral Valley |
| 31 | [AI Tinkerers](https://aitinkerers.org/events) | AI builder meetups, demo nights, 264 cities | ~8 NA in the 20-item global page | 1 | JSON-LD on `/events` and city subdomains; member API needs key | **NO** for bulk; their `agents.md` forbids it. Ask them. |
| 32 | [lablab.ai](https://lablab.ai/ai-hackathons) | AI hackathons, mostly online | few in-person SF | — | ItemList JSON-LD (no Event objects) | **NO**: online-heavy |
| 33 | [Unstop](https://unstop.com) | hackathons/competitions | ~0 (India) | — | Public JSON search API | **NO**: India-focused |
| 34 | [HackerEarth](https://www.hackerearth.com/chrome-extension/events/) | online hackathons | 0 in-person | — | Public JSON | **NO**: online only |
| 35 | [Devfolio](https://devfolio.co/hackathons) | hackathons | ~0 NA seen | — | `__NEXT_DATA__`; API path guessed wrong (404) | **NO**: India-focused |
| 36 | [DoraHacks](https://dorahacks.io/hackathon) | Web3 hackathons, mostly online | — | — | Client-rendered; API guesses 404 | **NO** |
| 37 | [Hackathon.com](https://www.hackathon.com/country/united-states) | hackathon listings | 1 (a happy hour) | — | HTML | **NO**: effectively dead |
| 38 | [itch.io jams](https://itch.io/jams/upcoming) | game jams | online only | — | HTML | **NO**: not in-person |
| 39 | [Microsoft Reactor](https://developer.microsoft.com/en-us/reactor/) | workshops, mostly virtual now *(inferred)* | — | — | Client-rendered; no data endpoint found | **NO** |
| 40 | [Techstars Startup Weekend](https://www.techstars.com/communities/startup-weekend) | 54-hour startup weekends | — | — | Marketing page only; events page 404; Bevy API not present on communities.techstars.com | **NO** direct; individual weekends appear on Eventbrite/Luma |
| 41 | [1 Million Cups](https://www.1millioncups.com/s/communities) | weekly founder pitch coffees | ~100+ communities *(inferred)* | — | Salesforce Experience Cloud, client-rendered ("Loading…") | **NO**: not scriptable |
| 42 | [CreativeMornings](https://creativemornings.com/cities/sf) | monthly creative breakfast talks | — | — | HTML; `window.__DATA__` empty | **NO**: creative rather than tech |
| 43 | [OWASP](https://owasp.org/events/) | AppSec conferences; chapters use Meetup | — | Meetup | Global events page is HTML; chapter list has no Meetup links in static HTML | **NO**: chapters already reachable via Meetup |
| 44 | [Linux Foundation events](https://events.linuxfoundation.org/) | KubeCon, OSS Summit, MCP Dev Summit | ~10 NA | covered by developers.events | WordPress HTML; Tribe API absent | **NO**: use developers.events |
| 45 | [Product School events](https://productschool.com/product-management-events) | PM talks, ProductCon | — | — | Non-Event JSON-LD only | **NO** |
| 46 | [Blacks In Technology](https://www.blacksintechnology.net/events/) | community events, BITCON | — | — | Events page renders nothing | **NO**: chapters on Meetup |
| 47 | [Posh](https://posh.vip/explore) | nightlife ticketing | — | — | Client-rendered | **NO**: not tech |
| 48 | [Splash](https://splashthat.com) | corporate event pages | — | — | 403 | **NO** |
| 49 | [10times](https://10times.com/usa/technology) | trade shows | — | — | 403 | **NO** |
| 50 | [Universe / Heylo / Commudle / Zeffy / Tito / Ticket Tailor / Humanitix](https://www.universe.com/explore) | ticketing/community | — | — | Client-rendered shells, 404 search pages, or no public discovery at all (Tito, Ticket Tailor are organiser-only) | **NO**: no discovery surface |
| 51 | [PaperCall](https://www.papercall.io/events?open=true) | open CFPs | — | — | **Fetch failed** (connection error, twice) | **NO** (unverified) |
| 52 | [Sessionize open CFPs](https://sessionize.com/api/universal/open-cfps) | open CFPs | — | — | 401: key required | **NO** (CFP data is already inside developers.events) |
| 53 | [conferenceindex.org](https://conferenceindex.org) | academic conferences | — | — | 404 on guessed URL; academic focus | **NO** |
| 54 | [techmeetups.io](https://techmeetups.io/seattle) | city meetup lists | 20 per city | 100% Meetup | JSON-LD, but every event is a meetup.com link | **NO**: pure Meetup re-aggregation |
| 55 | [Noisebridge / hackerspaces](https://www.noisebridge.net/wiki/Events) | hack nights, build nights | — | — | Anubis proof-of-work anti-scraper wall | **NO** (individual hackerspaces with public Google Calendar ICS can go in the iCal registry) |
| 56 | YC events, Facebook Events, LinkedIn Events, X, Reddit, Discord, Slack | — | — | — | Login walls / client-rendered / no public API | **NO**: not scriptable |

## Per-source notes for ADD NOW

### 1. Cerebral Valley

- **Endpoint:** `GET https://api.cerebralvalley.ai/v1/public/event/pull?approved=true&limit=100&offset=N`
- **Response:** `{ events: [...], totalCount, limit, offset }`. `totalCount` was 7,767 and includes past events back to 2023. Results are sorted ascending by start, so upcoming events sit at the **end**. Start at `offset = totalCount - 1000` and page forward. I tested `startDate`, `from`, `upcoming` and `sort` parameters and none of them had any effect. The `type=hackathon` filter is also ignored.
- **Fields:** `id`, `name`, `description`, `descriptionSummary`, `startDateTime` (`"2026-10-09 00:30:00"`, no zone, and `timeZone` was null on the sample, so it is probably UTC; check against the JSON-LD on /events, which gives `2026-10-06T02:00:00.000Z` for the same kind of row), `endDateTime`, `url` (organiser page: Partiful/Luma/Meetup/Eventbrite), `location` (free text: `"San Francisco, CA"`, `"New York City, NY"`, `"Other"`, `"Remote"`), `venue` (`"The TINT Gallery"`), `type` (`"HACKATHON"`, `"Conference"`, or empty), `status` (`approved`).
- **Mapping:** `title←name`, `start_date←startDateTime` (date part after tz conversion), `url←url`, `city←location` via `geo.fromText`. Drop `Remote`/`Other` rows, or keep `Other` only when `venue` geocodes. Set `feed_id = cerebralvalley:<id>`.
- **Dedupe:** the `url` points at Luma/Meetup/Eventbrite pages we may already have, so dedupe on normalised URL (`lu.ma` → `luma.com`).
- **robots/ToS:** `cerebralvalley.ai/robots.txt` disallows `/api/` on the main domain. The API is on a separate host, `api.cerebralvalley.ai`, which has no robots.txt (it returns an error page), and the path is literally `/public/`. The site's `llms.txt` describes the platform as "a global, continuously updated inventory of AI events". Use a 6-hour cache and fetch about 10 pages per run. A courtesy email to them would be prudent. If we want zero ambiguity, the fallback is the 20-event JSON-LD ItemList on `https://cerebralvalley.ai/events`, which is allowed. It has `name`, `url`, `startDate` (ISO Z) and `location.address.addressLocality/Region/Country`, but only 20 items, and `?page=2` returns the same page.
- **Relevance:** everything is AI-related by construction, and the 2,000-character description is available for the relevance judge.

### 2. Bevy family (GDG, Trailblazer, Startup Grind, ACE, Tableau, Snowflake, Figma Friends, UiPath, CNCF)

All of these run on Bevy (images on `res.cloudinary.com/startup-grind`), so one adapter with a host list covers them.

| Host | Live events | US | CA |
|---|---|---|---|
| gdg.community.dev | 914 | 176 | 28 |
| trailblazercommunitygroups.com | 265 | 110 | 5 |
| ace.atlassian.com | 87 | 27 | 6 |
| www.startupgrind.com | 74 | 39 | 0 |
| usergroups.tableau.com | 56 | 27 | 5 |
| friends.figma.com | 55 | 7 | 5 |
| community.uipath.com | 41 | 11 | 0 |
| usergroups.snowflake.com | 26 | 10 | 1 |
| community2.cncf.io (community.cncf.io redirects via `cncf.redirects.ocgroups.dev`) | 13 | 5 | 0 |

These counts include virtual events. In a sample of 6 US GDG events, 1 was `IN_PERSON`.

**Robots-clean route (recommended).** Bevy's `robots.txt` disallows `/api/` and `/gql/` on every host I checked (GDG, Startup Grind, Trailblazer). These paths are allowed:

1. `https://<host>/sitemap.xml` → `sitemap-events-YYYY-MM.xml`, one per month. GDG's October 2026 file had 557 event URLs and November had 271. All are global.
2. The event URL encodes the chapter: `/events/details/google-<chapter-slug>-presents-<event-slug>/`. Keep a cached chapter→country map built from `sitemap-chapters.xml` (4 pages). Each chapter page has `__NEXT_DATA__.props.pageProps.chapterData` with `country` and `city`, plus `prerenderData.upcomingEvents.results[]` with `title`, `start_date`, `url` and `event_type_title`. Refresh the map monthly.
3. For US/CA events, fetch the event page. It has one JSON-LD `Event`: `name`, `startDate`/`endDate` (ISO with offset), `eventAttendanceMode` (Offline/Online/Mixed), `location.name`, `location.address.{streetAddress,addressLocality,addressRegion,postalCode,addressCountry}`, `eventStatus`, `organizer`, `offers.url`. Drop Online.

**API route (works, but robots-disallowed).** `GET https://<host>/api/event/?status=Live&page_size=500` returns `{links:{next}, count, results:[{id,title,chapter:{city,country,state,timezone,url,...},start_date,end_date,url}]}`, paginated through `links.next`. Per event, `GET /api/event/<id>/` adds `audience_type` (`IN_PERSON`/`VIRTUAL`), `venue_name`, `venue_address`, `venue_city`, `venue_state`, `venue_country`, `venue_zip_code`, `venue_latitude/longitude`, `tags` and `event_type_title`. Some hosts return 403 for `/api/chapter/`. I only mention this route for completeness. Use the sitemap route.

**Mapping:** `title←name`, `start_date←startDate` (local date from the offset), `city/region/country←location.address`, `venue←location.name`, `url←page URL`, `organiser←chapter title`. Recurring socials (for example "GDG Virginia Beach Social @ Smartmouth, every 1st Fri") appear as separate monthly events, so the existing series logic should collapse them.

**Discovering more Bevy hosts:** probe `https://<host>/api/event/?status=Live&page_size=1` once, by hand (a JSON `count` means Bevy), or look for the `startup-grind` Cloudinary path in page HTML. Hosts that did not respond as Bevy: community.databricks.com and events.mongodb.com (403), community.docker.com (redirect), community.hashicorp.com and notion.com (redirect), communities.techstars.com.

### 3. developers.events

- **URL:** `https://developers.events/all-events.json`. This is a 3.3 MB array of 6,223 events, generated from GitHub `scraly/developers-conferences-agenda` (MIT, 2,004 stars, pushed 2026-10-03). robots.txt allows all agents except Meta's.
- **Row shape:** `{name, date:[startMs, endMs?], hyperlink, location:"Toronto (Canada)", city:"Oceanside, CA", country:"USA"|"Canada"|..., misc (HTML CFP badge), cfp:{link, until, untilDate}, status:"open", tags:[{key:"tech"|"topic"|"language", value}]}`
- **Filter:** `country in {"USA","Canada"}` and `date[0] >= today`. That gave 149 rows on 2026-10-03, versus 24 confs.tech rows in our data.
- **Mapping:** `title←name`, `start_date←date[0]` (epoch ms at UTC midnight, so take the UTC date), `end_date←date[1]`, `url←hyperlink`, `city←city` (already "City, ST" for the US), `country←country`, `topics←tags[].value`. `feed_id = devevents:<hyperlink>|<date[0]>`.
- **Online events** appear with `location` of "Online", so the country filter excludes them.
- **Cost:** one request per run, with a conditional GET (ETag) if the server supports it *(not tested)*.

### 4. BSides (bsides.org)

- **REST:** `GET https://bsides.org/wp-json/tribe/events/v1/events?per_page=50&start_date=YYYY-MM-DD`. Follow `next_rest_url`. It returned 94 upcoming events, 44 of them US/Canada.
- **iCal:** `https://bsides.org/events/?ical=1` (text/calendar, 30 VEVENTs per page). Our existing `ical` adapter could read it as a registry entry, but REST gives structured venues.
- **Fields:** `id`, `title` (HTML entities such as `&#8211;`), `start_date`/`end_date` (local, `"2026-10-17 09:00:00"`), `timezone`, `all_day`, `url` (bsides.org page), `website` (often empty), `venue:{venue, address, city, state, province, zip, country}`, `organizer[]`, `categories`, `cost`.
- **Country values are inconsistent** (`USA`, `United States`, `Canada`). Normalise them.
- **Watch for status in titles.** One title read "BSides COS 2026 POSTPONED TO 2027", so treat `/postponed|cancel/i` in the title as not-scheduled.
- **robots:** only `/wp-admin/` is disallowed.
- **Value:** our data already has 72 hand-curated BSides rows. This adapter would keep their dates current without curator effort.

### 5. GeekWire calendar

- **Use iCal, not REST.** GeekWire's robots.txt disallows `/wp-json/`, but the REST endpoint does work (67 upcoming: Seattle 46, Bellevue 5). Read `https://www.geekwire.com/calendar/?ical=1` instead. It is `text/calendar` with 30 VEVENTs.
- **Paging is unverified.** The Tribe iCal export usually pages with `&tribe-bar-date=YYYY-MM-DD` or `/calendar/list/page/2/?ical=1`, but I did not test either.
- **VEVENT fields:** `DTSTART;TZID=America/Los_Angeles` or `VALUE=DATE`, `SUMMARY`, `DESCRIPTION`, `URL` (GeekWire event page), `LOCATION` ("Hyatt Regency Bellevue, 900 Bellevue Way NE, Bellevue, WA, 98004, United States"), `CATEGORIES` ("Artificial Intelligence,Conferences").
- **Adapter work:** this should work as a registry entry with the existing `ical.mjs`, setting `platform: 'ical'` and a home of Seattle. The organiser's own link is in the description ("More info and registration") and in REST `website`, not in iCal `URL`.
- **Relevance:** some entries are life-science or board-leadership events, so use the `CATEGORIES` field to filter.

### 6. Hack Club hackathons

- **Endpoint:** `GET https://hackathons.hackclub.com/api/events/upcoming`. The repo is `hackclub/hackathons` (MIT) and the site has no robots.txt.
- **Fields:** `id`, `name`, `website`, `start`, `end` (ISO Z), `city`, `state`, `country`, `countryCode`, `latitude`, `longitude`, `virtual`, `hybrid`, `mlhAssociated`, `logo`, `banner`.
- **Filter:** `countryCode in {US,CA}` and `!virtual`. That gave 13 events, 11 of them not in our data.
- **Dedupe:** use `mlhAssociated: true` to dedupe against the MLH adapter.
- **Audience:** these are high-school hackathons, so set `audience` accordingly.

### 7. ETHGlobal

- **Use the existing Luma adapter.** ETHGlobal's page payload (Next.js RSC) shows NA happy hours, coworks and hackathons (NYC, SF, Toronto, Vancouver, Waterloo, Philadelphia, Detroit, Denver, Atlanta) carrying `lumaEventId`. Its Luma calendar is `https://luma.com/ethglobal` (calendar `cal-4BIGfE8WhTFQj9H`).
- **Not in the registry yet.** Add `{ "url": "https://luma.com/ethglobal", "reason": "ETHGlobal hackathons and city happy hours" }` to a `data/review/sources-*.json` file. A dedicated adapter isn't needed.
- **Also missing from the registry** *(checked by string search of `data/feeds/registry.json`)*: `luma.com/agihouse` (AGI House) and Cerebral Valley's Luma.

### 8. Guild.host

- **Endpoint:** `GET https://guild.host/api/next/events/upcoming`, a Relay-style connection `{edges:[{cursor,node}], pageInfo:{hasNextPage,endCursor}}`. Page with `?after=<endCursor>`. It returns 5 per page and `first=50` is ignored, so all 67 events took 14 requests.
- **Per-group endpoint:** `https://guild.host/api/next/<group-slug>/events/upcoming`.
- **Node fields:** `id`, `slug`, `fullUrl`, `name`, `description` (markdown), `startAt`, `endAt` (ISO), `timeZone`, `visibility`, `hasVenue`, `venue.address.location.geojson.coordinates [lon,lat]`, `owner.name` (the group), `presentations`.
- **Filter:** keep events with coordinates and drop the rest as online. 28 of 67 were in North America.
- **robots:** allows `/` and disallows only admin/auth/settings paths.

## Event categories we may be missing

These kinds of event came up during the research and fit the "meet tech people in person" bar. Several are not obvious from our current category list.

- **Model-launch and lab-sponsored hackathons** (Cerebral Valley, AGI House): one-day build events tied to a new model release.
- **Tech-week satellite events** (SF/NYC/LA/Boston/Austin/Toronto Tech Week, Seattle's many themed weeks, AI Week NYC): hundreds of small parties, panels and dinners in one week, mostly on Partiful.
- **Vendor user groups** (Salesforce Trailblazer, Atlassian ACE, Tableau, Snowflake, UiPath, Figma Friends): large, steady, in-person, and absent from our data.
- **Kubernetes Community Days (KCD), AWS Community Days, DevFests, PyData conferences, Data & AI Saturdays:** volunteer-run one-day regional conferences.
- **BSides and other community security cons; CTF finals held onsite** (for example CyberSci Canada regional qualifiers at 6 Canadian sites).
- **Civic-tech hack nights** (Civic Tech Toronto's weekly meetup is at #563; Code for America-style brigades).
- **Demo nights / "show and tell"** (AI Tinkerers, open-source demo nights): demo-first meetups with no talks.
- **Cofounder speed-dating and founder matching nights.**
- **Lean Coffee and breakfast formats** (Atlassian ACE lean coffee, Gary's Guide founder breakfasts, 1 Million Cups weekly pitches).
- **Pitch clinics, investor office hours, and "F\*\*kUp Nights"** (founder failure-story nights).
- **Coworking days** run by communities (ETHGlobal "Cowork with ETHGlobal", hackerspace open nights).
- **Global distributed jam weekends** (Global Game Jam, ~836 sites in January; Global Pizza Party for crypto devs in ~10 NA cities on one night).
- **Student career conventions with hackathons attached** (SASE STEM Connect with SASEhack, NSBE, SHPE, Grace Hopper).
- **University public lecture series with founders** (Stanford Entrepreneurial Thought Leaders, open to the public).
- **Tech comedy and roast shows** during tech weeks (for example "Tech Roast Show #SFTechWeek").
- **Robotics and physical-AI workshops/meetups** (a growing category on dev.events and Cerebral Valley).

## Notes on sources we already read

- **MLH** now lives at `mlh.com`. The adapter already uses `https://mlh.com/seasons/${season}/events`, and `mlh.io` redirects there, so nothing to change.
- **Devpost:** the adapter already uses `status[]=upcoming&challenge_type[]=in-person`. The API reported `total_count: 91` for that query today, but `feed.json` holds only 6 Devpost rows. Many `displayed_location.location` values are venue names without a city ("Queens College - Dining Hall", "Milgard Hall", "Princeton High School"), so `geo.fromText` probably drops them. This deserves a look: a venue-to-city fallback could recover a sizable share of those 91 *(inferred, not measured)*.
- **confs.tech** is read through the GitHub contents API (`api.github.com/repos/.../contents/...`), which allows 60 unauthenticated requests per hour. `raw.githubusercontent.com/tech-conferences/conference-data/main/conferences/<year>/<topic>.json` avoids that limit. With only 24 rows contributed, developers.events may make it largely redundant. Keep it as a second confirmation source.
- **Meetup:** ProductTank's chapter list (`__NEXT_DATA__` on mindtheproduct.com/producttank, 208 meetup.com group slugs) and Meetup Pro networks (`/pro/<network>/`) are cheap seed lists for the Meetup registry. Pro pages expose only 5 events in JSON-LD; the group list there is client-rendered.

## Generic patterns worth one adapter each

Each of these platforms serves many communities, so one adapter per platform covers all of them.

1. **Bevy:** sitemap → event JSON-LD (see above).
2. **The Events Calendar (WordPress):** `/wp-json/tribe/events/v1/events` (REST) or `?ical=1` (iCal). Check robots per site, since GeekWire disallows `/wp-json/`. Confirmed on bsides.org, geekwire.com, techqueria.org (0 events) and startupnv.org (4).
3. **Localist (universities):** `/api/2/events?days=90&keyword=...`. Confirmed on events.stanford.edu, calendar.mit.edu, events.seas.harvard.edu, calendar.utexas.edu and events.cornell.edu.
4. **Squarespace event collections:** `<page>?format=json` returns `upcoming[]`. Confirmed on whatinthetech.co, which had 0 events.
5. **Public Google Calendar ICS:** `https://calendar.google.com/calendar/ical/<id>/public/basic.ics`. Verified that the URL form works. Useful for hackerspaces and small groups, and handled by the existing `ical.mjs`.
