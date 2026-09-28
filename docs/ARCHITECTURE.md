# How connectWithTechies stays up to date

A one-page map of where the events come from, how they are kept current, and who is
allowed to change what. For the detail behind any box, follow the file links.

## The big picture

```
                 ┌──────────── CURATED (hand-verified) ────────────┐
                 │  data/raw/{canada,us-*,categories,...}.json      │
 agents ────────▶│  annual fixtures: conferences, tech weeks,       │
 (patches only)  │  hackathons, meetup series — 903 events          │──┐
                 └──────────────────────────────────────────────────┘  │
                                                                       │   npm run build
                 ┌──────────── FEED (script-maintained) ───────────┐  ├──────────────▶ data/events.json ──▶ the app
 Luma, Meetup,   │  data/raw/feed.json                              │  │   (merge, dedupe,     (one file)       (static site,
 Eventbrite, ───▶│  one-off events + weekly/monthly series          │──┘    rollover dates;                    GitHub Pages)
 MLH, Devpost,   │  ~1,550 events, rewritten every feed run         │       curated always wins)
 confs.tech      └──────────────────────────────────────────────────┘
```

Two halves, one output. The app does not know or care which half an event came from.

| | Curated | Feed |
|---|---|---|
| What | recurring fixtures worth researching once | everything in between: tonight's mixer, next month's hackathon |
| Written by | `scripts/apply-patches.mjs`, from agent patch files | `scripts/feeds/run.mjs`, never by hand |
| Verified by | the ledger: an agent or script read the organiser's page | re-reading the source on every run |
| Stays current via | the refresh loop (below) | the feed loop (below) |

**The one rule behind both:** agents are for *discovery and judgement*; scripts are for
*maintenance*. Anything found once is kept current by a script, not by searching again.

## Where the feed's events come from

| Source | How it is read | Role |
|---|---|---|
| **Luma** | endpoints Luma's own city and calendar pages use | find events per city → follow the organiser's calendar |
| **Meetup** | structured data embedded in search and group pages | find events per city (Technology + startup/dev searches) → follow the group |
| **Eventbrite** | schema.org data on "Science & Tech" city listings | discovery only (organisers publish no feed) |
| **MLH** | season pages | every in-person student hackathon |
| **Devpost** | public hackathon listing | in-person hackathons |
| **confs.tech** | open conference dataset on GitHub | US/Canada tech conferences |

No API keys. The official APIs are closed to this use (Luma: own calendars only;
Eventbrite: search retired; Meetup: OAuth + paid plan). The Luma and Meetup endpoints used
instead are **undocumented and can break**. They are read politely: one request per host at a
time, with pauses and a 6-hour cache (`scripts/feeds/lib/http.mjs`).

## The feed loop

```
  discover (weekly)                          maintain (every run)
  ─────────────────                          ────────────────────
  search 30 cities on                        re-read every registered organiser
  Luma / Meetup / Eventbrite                 + MLH, Devpost, confs.tech
        │                                              │
        ▼                                              │
  judge each organiser ── tech? ──▶ data/feeds/registry.json ◀── agents add organisers via
        (description or track record)     (340 organisers)       data/review/sources-*.json
        │                                              │
        └──────────────────────┬───────────────────────┘
                               ▼
                         THE GATE  (every event)
            in person · US/Canada · upcoming · has a link
            · "could you meet tech people here?"  (lib/relevance.mjs)
                               ▼
                         DEDUPE
            same event on two platforms → keep one
            a weekly group's 50 sessions → one series row
            already in curated data → dropped (curated wins)
                               ▼
                     data/raw/feed.json  +  data/feeds/last-run.json (report)
```

- **New events appear on their own**: once an organiser is registered, everything it
  announces is picked up on the next run.
- **Cancelled events disappear**: an event missing from a feed that was read successfully
  is taken down. If the read failed, the event is kept, because a flaky request doesn't
  prove a cancellation.
- **Held events** stay under *Past* for 60 days, then drop off.
- **Every kept event records why** in `feed_relevance`. The run report samples what was
  dropped and why, and is what to read when the gate looks wrong.

## The curated refresh loop

```
npm run refresh
   1. feed maintain (above)
   2. build: rollover — a held edition moves to last_date, the event waits for its next date
   3. verify-dates: script reads each organiser page, confirms ~86% of dated events itself
   4. ledger: records what is confirmed, builds the re-check queue (TO-VERIFY.tsv)
        │
        ▼  only what the script could not settle
   orchestrator (.claude/skills/refresh-events)
        ├─▶ curator agents  work the queue → write patches + confirmations
        ├─▶ apply patches, rebuild
        ├─▶ auditor agent   checks the curators' work → counts discrepancies
        └─▶ decide: clean → done · issues → back to curators (max 3 rounds)
```

An event re-enters the queue only when there is a reason: never checked, previously
blocked, date is close and the check is stale, an edition just ran, its usual month is
approaching, or the check has aged (90 days; 180 for recurring groups).

## Who may write what

| File | Written by | Never by |
|---|---|---|
| `data/raw/*.json` (curated) | `apply-patches.mjs` | agents directly |
| `data/raw/feed.json` | `feeds/run.mjs` | anyone by hand, any patch |
| `data/feeds/registry.json` | `feeds/run.mjs` (from discovery + `sources-*.json`) | agents directly |
| `data/review/*-fixes.json`, `confirm-*.json`, `sources-*.json` | curator agents | — |
| `data/review/verified.json`, `VERIFIED.md`, `TO-VERIFY.tsv` | `ledger.mjs` | agents |
| `data/events.json` | `build-data.mjs` | anyone else |

## Cheat sheet

| When | Run |
|---|---|
| Routine refresh | `npm run refresh`, then `npm run stale` to see what needs an agent |
| Weekly, find new events and organisers | `npm run feeds:discover` → skim `data/feeds/last-run.json` |
| Retire a noisy organiser | add `{ "url": "...", "tech": false, "reason": "..." }` to `data/review/sources-<name>.json` |
| Follow a new organiser | add `{ "url": "https://luma.com/<cal>", "reason": "..." }` to the same kind of file |
| Full agent cycle | ask Claude to "refresh the events" (runs the `refresh-events` skill) |
| Check before shipping | `npm test` · `npm run audit` · `npm run check:data` |
| Publish | commit and push `main`; GitHub Pages serves the repo root |

## Code map

```
index.html, assets/          the app (static HTML/CSS/JS)
scripts/build-data.mjs       raw files → events.json
scripts/feeds/run.mjs        the feed runner
scripts/feeds/adapters/      one file per source (luma, meetup, eventbrite, datasets, ical)
scripts/feeds/lib/           http (polite + cached), geo (place + time zone), relevance, ical
scripts/ledger.mjs           verification ledger + re-check queue
scripts/apply-patches.mjs    applies agent patches to curated files
agent/tools/                 what agents call: verify-dates, fetch-page, check-links, audit-run…
.claude/agents/              curator and auditor definitions
.claude/skills/refresh-events/  the orchestrator's procedure
```
