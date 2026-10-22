# Sources

Every place connectWithTechies gets events from, how each one is read, and what it costs to
keep. For how they fit together, see [ARCHITECTURE.md](ARCHITECTURE.md). For sources we
looked at but do not use (yet), see [research/source-candidates.md](research/source-candidates.md).

## In use

### Curated (researched by agents, verified by hand)

| Source | What | How it is kept current |
|---|---|---|
| Organisers' own websites | annual conferences, tech weeks, hackathons, meetup series — 903 events | `verify-dates` reads each page; agents handle what the script can't settle |

Curated research also drew on community lists and search, but every record links to and was
checked against the organiser's own page.

### Feed (read by script on every run; `scripts/feeds/`)

| Source | Adapter | Read via | Discovery | Organisers followed | Notes |
|---|---|---|---|---|---|
| **Luma** | `adapters/luma.mjs` | `api.lu.ma/discover/get-paginated-events?latitude=…&longitude=…` (every public event around a point, all pages) · `api.lu.ma/calendar/get-items` (calendar) · `api.lu.ma/url` (slug → calendar) | **every run**, all 30 cities, read to the end | the 125 already followed; new ones are judged, not followed — the full listing covers them | Undocumented endpoints. The city listing (`discover_place_api_id`) is only Luma's featured picks (23 events for Toronto vs 378 by coordinates) and is no longer used. iCal feeds are *not* used: they hide the address until you register |
| **Meetup** | `adapters/meetup.mjs` | Apollo state embedded in `meetup.com/find/` and `meetup.com/<group>/events/` | weekly; Technology category + 14 topic searches per city (each returns only its first ~15 events, so breadth comes from many topics) | yes — groups, whose own pages list all their events | Official GraphQL API needs OAuth + paid Pro |
| **Eventbrite** | `adapters/eventbrite.mjs` | `window.__SERVER_DATA__` on `/d/<city>/…` listings · Next.js data on `/o/<organiser-id>` | weekly; Science & Tech, every page (up to 15) + "hackathon", "startup", "tech-networking" searches per city | yes — organisers with a "High Tech" event and ≥2 upcoming | Search API retired. Throttles hard: 6 s between requests, backs off on 429 |
| **MLH** | `adapters/datasets.mjs` | Inertia page data on `mlh.com/seasons/<year>/events` | whole season | — | Student hackathons; tech by construction |
| **Devpost** | `adapters/datasets.mjs` | `devpost.com/api/hackathons?status[]=upcoming&challenge_type[]=in-person` | all pages | — | Public JSON. Location is free text, so many don't resolve to a city |
| **confs.tech** | `adapters/datasets.mjs` | GitHub contents API + raw JSON of `tech-conferences/conference-data` | this year + next | — | Open, community-reviewed dataset |
| **developers.events** | `adapters/datasets.mjs` | one JSON file, `developers.events/all-events.json` | all upcoming | — | MIT-licensed developer-conference agenda; ~146 US/Canada conferences |
| **Hack Club** | `adapters/datasets.mjs` | `hackathons.hackclub.com/api/events/upcoming` | all upcoming | — | High-school hackathons (MIT); MLH-associated ones skipped, MLH has them |
| **Guild.host** | `adapters/guild.mjs` | `guild.host/api/next/events/upcoming?first=5&after=<cursor>` (Relay connection, 5 a page, every page) | all upcoming | — | Community groups (civic tech, maker nights, dev meetups). Venue is coordinates only, so the place is the nearest registry city within 40 km. Not tech by construction: goes through the relevance gate |
| **Localist** (university calendars) | `adapters/localist.mjs` | `<host>/api/2/events?days=90&pp=100&keyword=<k>` on Stanford, MIT, Harvard SEAS, UT Austin, Cornell; 5 keywords each (hackathon, startup, entrepreneurship, demo day, tech talk), every page | all upcoming within 90 days | — | One row per recurrence is collapsed to one event per id. In person and hybrid (`experience`; online dropped). Place from the venue's own address. Stanford yields nearly all of it (11 events in a live check, hybrid included); MIT 2; Harvard SEAS, UT Austin and Cornell none. Not tech by construction: goes through the relevance gate. Any host or keyword unreadable fails the whole source, so its events are kept, not taken down |
| **Bevy** (Google Developer Groups, Salesforce Trailblazer, Atlassian community, Startup Grind, CNCF) | `adapters/bevy.mjs` | `<site>/sitemap.xml` → `sitemap-events-YYYY-MM.xml` (this month on) → the JSON-LD Event on each event page; `<site>/chapters/` (inline `localChapters`) gives each chapter's country. `/api/` and `/gql/` are robots-disallowed and not used | **weekly, with `--discover` only**; all upcoming | — | Sitemaps are global, so only pages of US/Canadian chapters are read (CNCF has no chapter page: all its few upcoming ones), and none whose slug date is past: 671 pages on oct22, 2 s apart (robots Crawl-delay), sites side by side, ~10–15 min; capped at 1000, over which it throws before reading. In person and hybrid (online dropped). `addressCountry` says "US" for venues anywhere, so the place comes from the address with the chapter's country as hint, checked against the start time's UTC offset. GDG, Trailblazer, Atlassian and CNCF are tech by construction; Startup Grind goes through the relevance gate. Ranked last in de-duplication so a daily source's copy wins. Pages are cached trimmed to their JSON-LD. On a daily run it is not read, so its events are carried forward, neither taken down nor counted as failed. Any site unreadable fails the whole source |
| **The Events Calendar** (WordPress) | `adapters/tribe.mjs` | `<site>/wp-json/tribe/events/v1/events` | — | yes — per site | One adapter for every site on the plugin. Following: **bsides.org** (all BSides security cons) |
| **Any public `.ics`** | `adapters/ical.mjs` | the calendar file | — | yes — when proposed | Following: **GeekWire** Seattle tech calendar (events judged one by one) |

Also followed through the Luma adapter, added from the source research: **ETHGlobal** and
**AGI House** calendars.

**Discovery cities (30):** listed in `data/feeds/registry.json` → `discovery`, each with its
Luma place id, Eventbrite path and Meetup location. Ottawa and Nashville have no Luma city page.

**Followed organisers:** `data/feeds/registry.json` → `sources`. Added automatically by
discovery, or by an agent through `data/review/sources-<pass>.json` (Luma, Meetup, Eventbrite
organiser or `.ics` URLs). `"tech": false` retires one.

### Past editions (read weekly; `scripts/feeds/returning.mjs`)

The feed reads only what is upcoming, so an annual event that announces its next edition only
on its own site is never found by it (Hack Canada 2027: on no feed; its Devpost page was the
ended 2026 edition, in Waterloo). `npm run returning` reads the same datasets' **history** —
MLH's last two seasons, Devpost's ended listing (`status[]=ended&order_by=deadline`, paged
until a whole page is older than the window, at most 300 pages), developers.events and
confs.tech for last year and this one — and keeps US/Canada editions that started in the last
18 months. An edition with no resolvable city is kept only if its title or location names the
US, Canada, a state or province, or a city the curated data knows.

It drops every one we already have: a record in any `data/raw/*.json` with the same core name
(years, edition numbers and season words removed: "Cal Hacks 13.0" → "cal hacks"), in any
city — events move — or the same own website (platform hosts like devpost.com, mlh.com, Luma,
Eventbrite, Meetup and GitHub never count). A feed record counts only while it is upcoming:
the feed keeps last year's edition for 60 days under the very same name and link. It also
drops what a curator has settled in a discovery log, `data/review/discover-<pass>.json`
(`returning[]` entries with verdict `added`, `exists` or `rejected`; `unresolved` keeps
the candidate, sorted after the untried ones).

What is left goes to `data/review/RETURNING.tsv` (regenerated, git-ignored), placed events
first, ordered by when their month comes round again (a year after the last edition, so an
overdue one comes first and one held last week comes last). It is a to-look-up list for
curators; nothing in it is published, and no date read from it is ever used. Known gaps: MLH
editions the adapter cannot place are skipped, and a Devpost page that fails mid-crawl ends
the crawl early — the per-source edition counts in the summary show a short read.

## Candidates (researched 2026-10-03; full notes in research/source-candidates.md)

56 platforms were checked by fetching them without a key. The ones worth acting on:

| Source | Value | Access | Status |
|---|---|---|---|
| **Cerebral Valley** | ~550 upcoming US/Canada AI events, ~240 of them on Partiful (our blind spot) | public JSON API on `api.cerebralvalley.ai` | **needs a decision**: main site's robots.txt disallows `/api/`; ask them first |
| **More Bevy sites** (Tableau, Snowflake, UiPath, Figma Friends user groups) | dozens of vendor user-group events | same adapter: one line in `SITES` once their `/chapters/` page is confirmed | add case by case (Figma is design: `tech: false`) |
| **Localist** (university calendars: Stanford, MIT, Harvard SEAS, UT, Cornell) | public lectures, student hackathons | `/api/2/events` keyless | later — needs keyword filtering |
| **Public Google Calendars** (hackerspaces, small groups) | long tail | `.ics` — works today via a `sources-*.json` entry | add case by case |
| **AI Tinkerers** | 264 city chapters | — | no — its `agents.md` forbids bulk scraping |
| **10times, Splash, tech-week.com, 1 Million Cups, Noisebridge** | — | 403 / 429 / client-rendered / anti-bot | no |
| **Partiful, Facebook, LinkedIn, X, Reddit, Discord** | large | login or client-rendered | no — not scriptable |

Event kinds the research surfaced that fit "meet tech people" and are thin in our data:
vendor user groups, Kubernetes/AWS Community Days and DevFests, tech-week satellite events,
model-launch hackathons, civic-tech hack nights, demo nights, cofounder-matching nights,
founder breakfasts and pitch mornings, Global Game Jam sites, and student career
conventions with attached hackathons (SASE, NSBE, SHPE).

## Official APIs, and why we don't use them

| Platform | Official API | Why not |
|---|---|---|
| Luma | `public-api.luma.com` | needs an API key and only lists calendars *you* manage |
| Eventbrite | `eventbriteapi.com/v3` | event search was removed in 2020; only your own org's events remain |
| Meetup | GraphQL (`api.meetup.com/gql`) | OAuth plus a paid Meetup Pro plan |

## Ground rules for any source

- **No keys, no logins.** If a source needs either, it is a "later" with a note on cost.
- **Polite.** One request per host at a time, pauses between, 6-hour cache, back off on 429/503
  (`lib/http.mjs`).
- **Fail loudly.** A failed read is reported, never taken as "no events", and never used to
  take an event down.
- **Undocumented means fragile.** Luma, Meetup and Eventbrite pages can change without notice;
  `data/feeds/last-run.json` shows per-source counts, and a source falling to zero is the signal.
