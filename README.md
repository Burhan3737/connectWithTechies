# connectWithTechies

A departures board for tech events across the **United States** and **Canada** — hackathons,
conferences, tech weeks, CTFs, game jams, unconferences, demo days, awards nights,
recurring meetup series, and tonight's founders' mixer or AI builders' night: anywhere you
might meet tech people. Pick your city, see what is on, click straight through to the
organiser's own page.

Every listing links to the organiser, not to a ticket reseller, and no date in the dataset
was written down without someone fetching the page it came from.

**4,225 events · 559 cities · 63 states, provinces and territories** — 903 curated and
hand-verified, 3,322 from the live feed

**Live:** https://burhan3737.github.io/connectWithTechies/ · **How it stays current:**
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

**Live:** https://burhan3737.github.io/connectWithTechies/ · **How it stays current:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

Coverage is complete for every US state and every Canadian province. Two jurisdictions are
genuinely empty — the **Northwest Territories** and **Nunavut**. That is not an oversight:
Pinnguaq, the Yellowknife Chamber and Eventbrite listings for both territories were all
checked, and what is there is national certification training resold into meeting rooms,
not local community events. Nothing was invented to fill the gap.

## Run it

Plain HTML/CSS/JS, no build step and no framework. It fetches `data/events.json`, so it has
to be served over HTTP rather than opened as a `file://` URL.

```bash
npm start          # http://localhost:5173
# or
python -m http.server 5173
```

Deploying: the app lives at the repo root, so GitHub Pages can serve it straight from the
`main` branch with no workflow — *Settings → Pages → Source: Deploy from a branch → main / (root)*.

## The data pipeline

```
data/raw/*.json     one file per research pass, hand-verified records
data/raw/feed.json  the live feed — written by scripts/feeds/run.mjs, never by hand
      |
      |  npm run build      merge, validate, normalise, de-duplicate, recompute status
      v
data/events.json    the single file the app reads
```

`scripts/build-data.mjs`:

- **validates** every record against `data/SCHEMA.md`, dropping any with no name, city,
  country or working link — a listing with a hole in it is worse than no listing
- **normalises** city names through `scripts/lib/places.mjs`, so "New York City" and
  "New York" do not become two entries in the picker
- **de-duplicates** on `(name, city)` *and* `(page, city)`, which catches the same event
  filed under two different titles by two different researchers. The URL half matches on
  host **and path** — matching on host alone folded every event a single organisation ran
  in its home city into one record, and was silently eating 40 real events
- **recomputes** each event's `upcoming` / `past` / `recurring-tbd` status from today's
  date rather than trusting whatever the researcher wrote

| command | what it does |
|---|---|
| `npm run refresh` | **the maintenance loop** — re-read the feed, rollover, script-confirm what it can, regenerate the queue |
| `npm run feeds` | re-read every registered organiser and the tech datasets, then rebuild |
| `npm run feeds:discover` | also search all 30 discovery cities for new events and new organisers (weekly) |
| `npm run stale` | print the re-check queue |
| `npm run build` | rebuild `data/events.json` and print a validation report |
| `npm run apply` | apply reviewer patches from `data/review/` |
| `npm run ledger` | merge confirmations, regenerate the ledger and queue |
| `npm run verify:dates` | script-side date confirmation (dry run) |
| `npm run check:data` | data audit: coverage, near-duplicates, field gaps, date sanity |
| `npm run check:links` | probe every event URL, report dead links and redirects |
| `npm test` | jsdom UI smoke test — 30 checks over rendering, filters, sorting, escaping |
| `npm start` | serve the site locally |

### Layout

```
scripts/        the deterministic pipeline. Owns data/. Maintainer-run.
scripts/feeds/  the live feed: source adapters, relevance gate, runner.
agent/tools/    what agents call — and what replaces agents where possible.
agent/README.md the division of labour, in full.
data/review/    the contract surface: queue in, patches and confirmations out.
```

Agents are for **discovery and judgement**; scripts are for **maintenance**. An event is
researched by an agent once and maintained by script thereafter — it should only reach an
agent again if the script genuinely cannot settle it. Measured on this dataset,
**86% of dated events confirm by script alone**, so routine upkeep costs roughly a sixth
of what an all-agent pass would.

## The live feed

The curated data is annual fixtures; the feed is everything in between — the hackathon a
startup announced last week, the AI Collective's city launch, the Tuesday founders' run.
It is built and maintained by script from several sources, none of which needs an API key:

| source | how it is read | what it gives |
|---|---|---|
| **Luma** | the endpoints Luma's own city and calendar pages call | city discovery, then each organiser's calendar, with places and time zones |
| **Meetup** | the structured data embedded in search and group pages | city discovery (Technology category + startup/developer searches), then each group |
| **Eventbrite** | server data on city listings and organiser pages | city discovery (Science & Tech + hackathon/startup/networking searches), then tech organisers with 2+ events |
| **MLH** | the season pages | every in-person student hackathon |
| **Devpost** | its public hackathon listing | in-person hackathons |
| **confs.tech** | the open conference dataset on GitHub | US and Canadian tech conferences |
| **developers.events** | one open JSON file (MIT) | developer conferences |
| **Hack Club** | public hackathon directory API | high-school hackathons |
| **BSides & other WordPress event sites** | The Events Calendar REST API | security cons, community calendars |
| **GeekWire and any public .ics** | the calendar file | city tech calendars, small groups |

The official APIs were checked first and are closed to this use: Luma's public API only
lists calendars you manage, Eventbrite retired event search, and Meetup's GraphQL API needs
OAuth and a paid Pro plan. The Luma and Meetup endpoints used instead are undocumented, so
they are read gently — one request per host at a time, with pauses, and a six-hour cache —
and can change without notice.

**Discover once, maintain by script.** A discovery run searches each city and judges the
organisers behind what it finds. The ones that prove to be tech communities go into
`data/feeds/registry.json` (476 followed today: 123 Luma calendars, 328 Meetup groups, 23 Eventbrite organisers, BSides and GeekWire), and every
later run re-reads each of them in full — so a new event from a registered organiser appears
without anyone searching for it, and one they cancel disappears. An agent that finds an
organiser worth following lists its URL in `data/review/sources-<pass>.json`; the next run
registers it.

**The gate.** Every event must be in person, in the US or Canada, upcoming, and linked — and
must pass a relevance judgement (`scripts/feeds/lib/relevance.mjs`) whose bar is
deliberately low: *could you meet tech people here?* A registered tech organiser gets the
benefit of the doubt; a general platform's listing needs a tech signal in its title or
description, and off-topic titles (prayer evenings, book clubs, real-estate investing,
forex "signals") are dropped even from tech organisers. Every kept event records why in
`feed_relevance`, and `data/feeds/last-run.json` samples what was dropped and why.

**De-duplication.** One event on several platforms is kept once (MLH and confs.tech first,
then Luma, Meetup, Devpost, Eventbrite). A weekly group's fifty upcoming sessions become one
series record carrying the next date. And the curated data always wins: an event already
curated is never repeated by the feed, and a feed record can never replace a curated one.

Feed rows are re-read from their sources on every run, which is their verification — so
they never enter the ledger, the re-check queue, or an agent's workload.

## Review cycles

Research was done by five parallel agents (Canada, US West, US East, US Central, and a
sweep by event *category* rather than geography), then put through four review cycles:

1. **Link repair and duplicate resolution** — dead URLs, chapter networks sharing one
   landing page, events recorded twice under different city names
2. **Coverage gap filling** — cities with no events, events the first pass dropped for
   want of a verifiable URL
3. **Date and location accuracy** — events re-verified against their own sites
4. **Final link sweep and completeness critique** — what formats and jurisdictions are
   still missing

Cycles 3 and 4 then ran a second round. Round one of the accuracy cycle had only covered
the 78 largest events by attendance, which left 401 dated upcoming events unverified —
including the ones happening soonest, where a wrong date costs someone a trip. Round two
verified 194 of those: **187 were already correct**, and the seven corrections included two
events dated *that same day*, one of which had the wrong start date and one of which had
quietly ceased to exist.

Round two of the completeness cycle went after the thinnest jurisdictions and event types,
and added the TransportationCamp unconference series the first round had missed entirely.

Reviewers never edit `data/raw/` directly. They write patch files to `data/review/`, which
`scripts/apply-patches.mjs` applies — so cycles can run in parallel without clobbering each
other, and `data/review/APPLIED.md` records every correction with the reason it was made.

### The verification ledger

**Every one of the 880 events has been checked against a source.** The ledger below is how
that was reached without re-verifying the same events each round.

Early rounds kept re-deciding what to check, which wasted effort on settled events and left
others untouched for rounds on end. `data/review/VERIFIED.md` fixes that: it records which
events have actually been checked against the organiser's own page, and for the ones that
could not be, exactly what blocked them.

| status | meaning |
|---|---|
| `confirmed` | read the page, record correct as stored — skip |
| `corrected` | read the page, record was wrong, patched — skip |
| `blocked` | attempted, page unreadable by fetch — needs a web search or a human with a browser |
| _absent_ | never checked — verify first |

A reviewer writes `data/review/confirm-<pass>.json` for **every** row it attempts, whatever
the outcome, and `node scripts/ledger.mjs` merges those in and regenerates both the ledger
and `data/review/TO-VERIFY.tsv` — the working list of everything unchecked or blocked,
dated events first and soonest first. A stronger outcome or a newer check date always wins,
so a re-check refreshes a stale entry rather than being discarded.

The `blocked` list is the useful by-product: it is precisely the set where a web search
would earn its cost, rather than being spent re-reading pages that already answered.

## Keeping it true

A verification is a snapshot, not a subscription. Left alone this dataset rots fast —
in the ten days after one build, **42 events passed their date**. So the refresh loop
runs on its own schedule of decay rather than on someone remembering:

```
npm run refresh    rollover: a held edition moves into last_date and the record
                   returns as recurring-tbd, instead of vanishing from Upcoming
                   then the script confirms every date it can read
                   then the re-check queue is regenerated
      ↓ agents     work only what the script could not settle
npm run apply      apply their patches
npm run build
npm run ledger     merge confirmations; the queue shrinks
```

On a real run of that loop: 883 events in, **429 of 498 dated events confirmed by script**,
the queue down from 152 to 40, and 69 rows handed to agents. The script half costs nothing
but wall-clock.

`npm run stale` prints the queue any time. The full procedure — including everything
learned the hard way about reading these sites — lives in the `refresh-events` skill at
`.claude/skills/refresh-events/SKILL.md`, so a pass does not depend on anyone
reconstructing it from memory.

### What puts an event back in the queue

| reason | fires when |
|---|---|
| `never` | a new record nobody has checked |
| `blocked` | a previous pass could not read the page |
| `regroup` | a weekly or monthly group is showing no next date — **wrong on the page today** |
| `imminent` | the check is stale *relative to how close the event is* |
| `rolled` | an annual edition ran since it was checked; the next one is far off |
| `window` | undated, and its usual month is close enough that dates get announced |
| `aged` | 90 days for a dated event, 180 for a recurring group |

`imminent` scales freshness to proximity rather than using a fixed window: an event
three weeks out checked last week is fine, the same check on an event two days out is
not. Recurring groups get the longer clock because the useful question for them is
whether the group still meets, not what its next date is.

Because all 883 records were verified in one batch they also expire in one batch, so the
queue is lumpy by nature. `node scripts/ledger.mjs --limit 60` trims the working file to
the most urgent slice and reports how many remain — bounding a pass by effort rather than
by fiddling with thresholds until the number looks comfortable.

## What counts as an event here

Anything you physically go to, where you meet people and the subject is technology.

| | |
|---|---|
| `conference` | multi-day talks and hallway track |
| `hackathon` | build something in 24–48h |
| `tech-week` | a city-wide week of distributed community events |
| `startup-week` | founder and investor oriented city weeks |
| `summit` / `expo` | industry gatherings and trade shows |
| `meetup-series` | recurring local groups worth showing up to |
| `meetup` | a single gathering — a mixer, a builders' night, a talk (from the feed) |
| `ctf` | capture-the-flag security competitions |
| `game-jam` | time-boxed game building |
| `workshop` / `bootcamp` | hands-on teaching formats |
| `demo-day` | startups pitching, usually accelerator cohorts |
| `unconference` | attendee-built agendas — BarCamp, Open Space |
| `career-fair` | recruiting-oriented tech events |
| `festival` / `awards` | culture-and-tech crossovers, ceremonies |

## Filters

- **Search** — name, description, city, venue, topics and audience
- **Cities** — multi-select typeahead; add as many as you like, chips show what is active,
  Backspace on an empty box removes the last one
- **When** — `Upcoming`, `Past`, or `All`
- **Kind** and **Country** — narrow by event type or by US/Canada
- **Province / state** — every province and state with events, grouped by country and
  narrowed to the chosen one; picking a province sets its country
- **Sort** — by date, city, or name

Every filter is mirrored into the URL, so any view can be bookmarked or shared.

### How "Upcoming" and "Past" are decided

Roughly 40% of these events are annual fixtures whose next edition has not been announced
yet. Dropping them from *Upcoming* would hide most of the calendar, so:

- **Upcoming** = a confirmed future date, **plus** annual events awaiting a date. The
  undated ones sort after the dated ones, in calendar order, grouped as
  *"Usually June — date not yet announced"*, and each row shows its usual month rather
  than a bare "TBA".
- **Past** = any edition that has actually been held. An annual event with a future date
  still appears here for the edition that already ran, showing the date it ran on.

## Caveats

- **Dates move.** Every listing carries the organiser's own link and that link is the
  source of truth. Confirm there before booking travel.
- **873 of 880 links resolve.** The seven that do not are captcha and rate-limit walls
  (Cloudflare, SiteGround proof-of-work, 10times) that a browser passes and a script
  cannot.
- Where a chapter network genuinely has no per-city page (some DevOpsDays and Nerd Nite
  chapters), the listing points at the network's main site.
- Attendance figures are approximate and only present where an organiser published one.
