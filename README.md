# forTechies

A departures board for tech events across the **United States** and **Canada** — hackathons,
conferences, tech weeks, CTFs, game jams, unconferences, demo days, awards nights and
recurring meetup series. Pick your city, see what is on, click straight through to the
organiser's own page.

Every listing links to the organiser, not to a ticket reseller, and no date in the dataset
was written down without someone fetching the page it came from.

**880 events · 233 cities · 63 states, provinces and territories**

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
| `npm run build` | rebuild `data/events.json` and print a validation report |
| `npm test` | jsdom UI smoke test — 30 checks over rendering, filters, sorting, escaping |
| `npm run check` | data audit: coverage, near-duplicates, field gaps, date sanity |
| `npm run check:links` | probe every event URL, report dead links and redirects |
| `npm start` | serve the site locally |

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
