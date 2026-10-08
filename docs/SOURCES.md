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
| **The Events Calendar** (WordPress) | `adapters/tribe.mjs` | `<site>/wp-json/tribe/events/v1/events` | — | yes — per site | One adapter for every site on the plugin. Following: **bsides.org** (all BSides security cons) |
| **Any public `.ics`** | `adapters/ical.mjs` | the calendar file | — | yes — when proposed | Following: **GeekWire** Seattle tech calendar (events judged one by one) |

Also followed through the Luma adapter, added from the source research: **ETHGlobal** and
**AGI House** calendars.

**Discovery cities (30):** listed in `data/feeds/registry.json` → `discovery`, each with its
Luma place id, Eventbrite path and Meetup location. Ottawa and Nashville have no Luma city page.

**Followed organisers:** `data/feeds/registry.json` → `sources`. Added automatically by
discovery, or by an agent through `data/review/sources-<pass>.json` (Luma, Meetup, Eventbrite
organiser or `.ics` URLs). `"tech": false` retires one.

## Candidates (researched 2026-10-03; full notes in research/source-candidates.md)

56 platforms were checked by fetching them without a key. The ones worth acting on:

| Source | Value | Access | Status |
|---|---|---|---|
| **Cerebral Valley** | ~550 upcoming US/Canada AI events, ~240 of them on Partiful (our blind spot) | public JSON API on `api.cerebralvalley.ai` | **needs a decision**: main site's robots.txt disallows `/api/`; ask them first |
| **Bevy** (Google Developer Groups, Salesforce Trailblazer, Startup Grind, CNCF/KCD, Atlassian, Snowflake, Figma…) | hundreds of vendor user-group events | monthly event sitemaps → JSON-LD per event page | later — many requests per run; many events are virtual |
| **Guild.host** | ~28 in-person events (civic tech, Toronto/Montréal) | keyless JSON, 5 per page | later — small |
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
