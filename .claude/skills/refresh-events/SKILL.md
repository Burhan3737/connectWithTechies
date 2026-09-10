---
name: refresh-events
description: Run the event-data refresh loop - rebuild, read the staleness queue, send agents to re-verify the most urgent events, apply their patches, and record what was checked. Use when the user asks to refresh, re-verify, update or check the event data, or when `npm run stale` shows a queue worth working.
---

# Refreshing the event data

The dataset decays: dates move, editions pass, organisers announce next year. This is
the loop that keeps it true. It is bounded by effort, not by ambition — one pass works
the most urgent slice and leaves the rest for the next one.

## The loop

```
npm run build     rollover: held editions move to last_date, records return as recurring-tbd
npm run ledger    regenerate the queue into data/review/TO-VERIFY.tsv
   -> agents      work the queue, write patches + confirmations
npm run build     apply, rebuild
npm run ledger    merge confirmations, queue shrinks
```

## Step 1 — refresh the queue

```bash
node scripts/build-data.mjs          # note what rolled over
node scripts/ledger.mjs --limit 60   # trim the working file to the 60 most urgent
```

Read the reason counts it prints. `data/review/TO-VERIFY.tsv` is the working list,
already ordered: wrong-today first, then soonest-first.

| reason | what it means |
|---|---|
| `never` | new record, no one has checked it |
| `blocked` | a previous pass could not read the page |
| `regroup` | a weekly/monthly group showing no next date — **wrong on the page right now** |
| `imminent` | coming up, and the check is stale relative to how close it is |
| `rolled` | an annual edition ran; next one is far off |
| `window` | undated, and its usual month is close enough that dates get announced |
| `aged` | not looked at in a long time |

Pick a budget that matches the appetite. 40–60 rows is a comfortable single pass.

## Step 2 — split and dispatch

Split the working file into chunks of ~30 rows and dispatch one agent per chunk in
parallel. Give each agent the section below verbatim, plus its chunk path.

Do not hand-write a new prompt each time. Everything hard-won about this task is in
that section, and rewriting it from memory loses it.

## Step 3 — apply

```bash
node scripts/apply-patches.mjs --dry-run   # read the reasons before trusting them
node scripts/apply-patches.mjs
node scripts/build-data.mjs
node scripts/ledger.mjs                     # merges the confirm-*.json files
npm test
```

Review removals yourself before applying. Agents have been right about squatted domains
and dead conferences, but a removal is the one operation that loses data.

---

# The agent brief (give this verbatim)

You are re-verifying entries in a tech-event directory at `C:\personalProjects\forTechies`.
A wrong date sends someone to a venue on the wrong day; that is the failure that matters.

## Do not use WebFetch as your first tool

A large set of event hosts — Gartner, TechWell, SAP, NetSuite, Microsoft, Oracle, ODSC,
Code for America — return 403 to WebFetch while serving curl a 200 for the same URL.
Use the helper:

```bash
node scripts/fetch-page.mjs <url>            # status, title, extracted date evidence
node scripts/fetch-page.mjs <url> --text     # plus readable page text
node scripts/fetch-page.mjs <url> --bundle   # chase JS bundles for React/Next shells
```

It pulls JSON-LD `startDate`/`endDate`, ISO dates, month ranges, venue hints, and the
copy Next.js hides inside script flight data. Raw curl if you need it:

```bash
curl -sL --max-time 25 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36" "<url>"
```

**Send only the User-Agent.** Adding explicit lowercase `accept` / `accept-language`
headers flips a 200 into a 403 on WAF-protected hosts — they fingerprint header casing.
This was measured on rsaconference.com, not guessed.

WebSearch is the right tool when the page is behind a captcha, or when the event has no
findable site. Use it freely; it is no longer the constraint it once was.

## What to establish for each row

1. **The dates** — does the organiser's own page show this exact start and end?
2. **The city** — several records have been found pointing at an organiser's head
   office rather than the venue.
3. **That it still exists** — a page advertising an older year, or a parked domain,
   means the record is stale.
4. For a `regroup` row — a weekly or monthly group — find its **next meeting date**.
   These are wrong on the page today, so they matter most.

## Things this dataset has taught us

- **Aggregator-sourced dates are where the fabrications live.** dev.events, 10times and
  Eventbrite *search* URLs have all produced dates the organiser never published. The
  organiser's own page has been right the overwhelming majority of the time.
- **Sometimes the organiser's page is the stale one.** HackUMass advertised "November
  8-10, 2024" while the record was right. launchwisconsin.biz/about/ contradicted its
  own events page. Cross-check before "correcting" a record to match a stale page.
- **Watch for squatted domains.** Four have been found: `pytennessee.org` and
  `houstonexponential.org` now serve online-casino spam, `startupzone.ca` serves
  Indonesian content, `metabridge.ca` a slot review. Check that the page actually names
  the event.
- **Student hackathon sites are usually client-rendered**, with the date only in a hero
  image. MLH's season listing (`mlh.io/seasons/2027/events`) is the corroborating
  source — say so in your evidence when a date comes from there rather than the organiser.
- **Never guess a date.** An unresolved row is a legitimate outcome. Say what you tried.

## Two output files

**1. A ledger entry for EVERY row you attempt**, whatever the outcome —
`data/review/confirm-<yourpass>.json`:

```json
[
  { "name": "EXACT name from the TSV", "city": "EXACT city from the TSV",
    "status": "confirmed", "cycle": "<yourpass>",
    "evidence": "gartner.com JSON-LD startDate 2026-12-07, matches record" }
]
```

`status` is `confirmed` (read it, record correct), `corrected` (read it, was wrong,
patch emitted) or `blocked` (could not read any page that settles it — say what you tried).

This file is what stops the next pass repeating your work. Every row you touch must
appear in it.

**2. A patch, only for rows that were wrong** — `data/review/<yourpass>-fixes.json`:

```json
{ "match": { "name": "EXACT name", "city": "EXACT city" },
  "action": "update",
  "reason": "what the page said and which page",
  "set": { "next_date": "2026-12-07", "next_date_end": "2026-12-09" } }
```

- Already happened, no new edition published: clear `next_date`/`next_date_end` to `""`,
  put the old start in `last_date`, set `status` to `"recurring-tbd"`. (The build does
  this automatically too — you only need it when correcting a wrong date.)
- Wrong city: set `city` **and** `region`. Wrong link: set `url`.
- Confirmed defunct or squatted: `"action": "remove"` with a reason.
- Only include fields you are actually changing. Write `[]` if nothing was wrong.

Names and cities in **both** files must be copied character-for-character from the TSV,
or the patch will silently fail to apply.

Do not edit anything in `data/raw/`. Write only those two files.

Reply with: rows attempted, confirmed, corrected, blocked, and the most significant
corrections. Do not paste the JSON.
