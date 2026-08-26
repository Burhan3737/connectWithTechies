# forTechies

A departures board for tech events across the **United States** and **Canada** — hackathons,
conferences, tech weeks, CTFs, workshops, demo nights, unconferences and recurring meetup
series. Pick your city, see what is on, click straight through to the organiser's own page.

## Run it

The app is plain HTML/CSS/JS with no build step, but it fetches `data/events.json`, so it
needs to be served over HTTP rather than opened as a `file://` URL.

```bash
npm start          # serves the folder at http://localhost:5173
# or
python -m http.server 5173
```

## Rebuild the dataset

Research lives in `data/raw/*.json`, one file per research pass. The build script merges
them into the single `data/events.json` the app reads — validating the schema, normalising
fields, de-duplicating events that more than one researcher found, and recomputing each
event's `upcoming` / `past` / `recurring-tbd` status from today's date.

```bash
npm run build      # writes data/events.json, prints a validation report
npm run check      # data-quality audit (duplicates, dead fields, coverage gaps)
```

`data/SCHEMA.md` is the contract every record in `data/raw/` must follow.

## What counts as an event here

Anything you physically go to, where you meet people and the subject is technology:

| | |
|---|---|
| `conference` | multi-day talks-and-hallway-track events |
| `hackathon` | build something in 24–48h, usually with prizes |
| `tech-week` | a city-wide week of distributed community events |
| `startup-week` | founder/investor-oriented city weeks |
| `summit` / `expo` | industry gatherings and trade shows |
| `meetup-series` | recurring local groups worth showing up to |
| `ctf` | capture-the-flag security competitions |
| `game-jam` | time-boxed game building |
| `workshop` / `bootcamp` | hands-on teaching formats |
| `demo-day` | startups pitching, usually accelerator cohorts |
| `unconference` | attendee-built agendas (BarCamp, Open Space) |
| `career-fair` | recruiting-oriented tech events |
| `festival` / `awards` | culture-and-tech crossovers, ceremonies |

## Filters

- **Search** — matches name, description, city, venue, topics and audience.
- **Cities** — a multi-select typeahead; add as many as you like, chips show what is active.
- **When** — `Upcoming` (confirmed future dates plus annual events awaiting a date), `Past`, or `All`.
- **Kind** and **Country** — narrow by event type or by US/Canada.

Every filter is mirrored into the URL, so any view can be bookmarked or shared.

## Caveats

Dates move. Every listing carries the organiser's own link and that link is the source of
truth — always confirm there before booking travel. Events with no announced next edition
are shown as `TBA` rather than being dropped, because they still tell you what happens in
a city each year.
