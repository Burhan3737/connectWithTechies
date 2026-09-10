# Audit report — 2026-09-10

**Verdict: 7 DISCREPANCIES (2 blocking, 5 warnings)**

Baseline 1d38833 (883 events / 233 cities) -> working tree (884 / 233).
Mechanical pass: node agent/tools/audit-run.mjs --since 1d38833. Judgement pass: 12 records
verified against live pages.

**The mechanical audit's 3 blocking findings are all false positives.** See warning 5 - they are
an artefact of audit-run.mjs keying on name+city, and both flagged rows have ledger entries under
their corrected city keys. Do not re-dispatch on account of them.

## Blocking

- **PAX West (Seattle)** - last_date regressed from 2026-09-04 to 2025-08-29, losing the fact that
  the 2026 edition happened.
  west.paxsite.com reads "LEVEL 2026 COMPLETE. SEE YOU NEXT YEAR: SEPTEMBER 3-6, 2027". The new
  next_date 2027-09-03..2027-09-06 is right and well sourced (page JSON-LD startDate 2027-09-03),
  so that half of the change is sound. The problem is the mechanism: build-data.mjs synthesises
  last_date at build time by rolling an elapsed next_date, and the baseline events.json got
  last_date 2026-09-04 that way from raw's next_date "2026-09-04". Overwriting that raw next_date
  with the 2027 window removed the roll's input, so events.json fell back to raw's stale last_date
  of 2025-08-29. The record now claims PAX West was last held in August 2025.
  **Set last_date "2026-09-04" in the PAX West records in data/raw/us-west.json and
  data/raw/categories.json, then rebuild.** Every other date move this run (Buffalo Game Space,
  CHM Live, CONNECT, Jersey City, Santa Monica New Tech, SecKC, tech SAVannah) set last_date
  explicitly; PAX West is the only one that did not.

- **Tech Week Los Angeles / LA Tech Week (Los Angeles)** - curator 3's duplicate call is
  **confirmed**. Both records are the same a16z event: city Los Angeles, next_date 2026-10-12,
  next_date_end 2026-10-18, type tech-week, source https://www.tech-week.com/, same
  freemium/founders framing. They differ only in url (/calendar vs /), which is why the duplicate
  check did not catch them - it looks for identical URLs in one city. They come from two raw
  files, categories.json and us-west.json.
  **Merge into one record.** Keep "LA Tech Week" (the organiser's own name on the a16z calendar
  luma.com/latw) from us-west.json, which also carries the real last_date 2025-10-13; delete
  "Tech Week Los Angeles" from data/raw/categories.json and retire its ledger key
  techweeklosangeles|losangeles.

## Warnings

1. **Seven URL repoints left source pointing at the superseded page.** url moved but source did
   not, on WeAreDevelopers World Congress, gRPConf North America, seL4 Summit, OPI Summit on
   DPU/IPUs, OIN Connect, EWF Annual Conference and Django Girls New York City. The
   aggregator-collisions pass set both fields together, so this breaks an established convention.
   Two cases are more than cosmetic:
   - **Django Girls New York City** - next_date is now 2026-11-27, but source remains
     https://djangogirls.org/en/events/, the index tile the curator's own evidence says shows only
     "28th November 2026". The record's provenance now contradicts the record.
   - **gRPConf North America** and **seL4 Summit** - source is still
     https://events.linuxfoundation.org/about/calendar/, the page the same curator established
     "no longer lists this event at all".
   **Set source to the page the evidence was actually read from** (the new url in each case, and
   https://djangogirls.org/en/nyc/ for Django Girls).

2. **Open Source AI Week (San Jose) entered the published directory unverified.** This is the
   entire +1 in the event count, and it is not a discovery: the record was already in
   data/raw/categories.json at 1d38833 but absent from the baseline data/events.json, so
   rebuilding resynced it in. It has no ledger entry and sits in TO-VERIFY.tsv as never/unchecked.
   Its dates do hold up - events.linuxfoundation.org/about/calendar/ lists "Open Source AI Week,
   Oct 16-25, 2026, Bay Area, United States", matching the stored 2026-10-16..2026-10-25 - but the
   calendar says **Bay Area**, not San Jose, and the week's constituent events span venues in San
   Jose (PyTorch Conference NA, Oct 20-21) and San Francisco. **Either give it a proper check next
   pass or reclassify the city.** The orchestrator should not credit this run with finding a new
   event.

3. **LA Tech Week evidence quotes around a contradiction.** The ledger for
   techweeklosangeles|losangeles quotes the calendar blurb as "Welcome to ... Tech Week from
   October 12-18, 2026". The page actually reads "Welcome to **San Francisco** Tech Week from
   October 12-18, 2026" - a16z's own copy-paste error on luma.com/latw. The conclusion survives:
   luma.com/sftw independently gives "San Francisco Tech Week from October 5-11, 2026" and
   luma.com/nytw gives June 1-7, so Oct 12-18 is LA's own window, exactly as the curator argued.
   But the ellipsis hides the one thing on the page that argues against the verdict. **Restore the
   elided words in the evidence string** so the next reader sees the conflict and the resolution.

4. **Southwestern Ontario Drupal Camp publishes as Waterloo while its own venue says Kitchener.**
   The patch and data/raw/review-additions-2.json both set city "Kitchener", and APPLIED.md records
   the change as "Various" -> "Kitchener", but data/events.json shows city "Waterloo" and id
   southwestern-ontario-drupal-camp-waterloo. Cause is scripts/lib/places.mjs, which maps
   'kitchener' to ['Waterloo', 'Ontario']. Not a curator error, and the underlying facts are right
   - swo.drupalcanada.org confirms "Oct 23-24, 2026 / Kitchener-Waterloo" with Friday at the
   Kitchener Public Library - but the published row reads "Waterloo, Ontario" next to venue
   "Kitchener Public Library (Fri)". **Decide whether the Kitchener->Waterloo alias is intended
   here**, and if it is, note it in APPLIED.md so the ledger and the raw file stop disagreeing
   with the output.

5. **audit-run.mjs reports every city correction as a removal plus a skipped queue row.** All
   three of its blocking findings this run are spurious:
   - Mississippi Digital Government Summit (Jackson) - has a ledger entry at
     mississippidigitalgovernmentsummit|flowood, status corrected, cycle c1.
   - Southwestern Ontario Drupal Camp (Multiple cities) - has one at
     southwesternontariodrupalcamp|waterloo, status corrected, cycle c3.
   The "2 gone" in coverage are the same two records under their old keys; per-city counts move
   only Jackson 6->5, Flowood 2->3, Multiple cities 12->11, Waterloo 4->5, San Jose 9->10, which
   accounts for every one of them. No city lost its last event. **Match queue coverage on the
   dispatched row's identity rather than name+city** (fall back to name-only, or follow the city
   field of the applied patch), otherwise any correct city fix will keep triggering re-runs.

## Checked and sound

Verified against the live page; do not re-check these.

- **SBUHacks (Stony Brook), Oct 9-11 -> Oct 23-25** - defensible, and the reasoning is honest.
  hack.sbcs.io says only "SBUHACKS October 2026 @ Stony Brook University", "This website is
  currently under construction", and lists "the exact date and location of the event" as still to
  be announced. mlh.io/seasons/2027/events carries "SBUHacks OCT 23 - 25, Stony Brook, New York,
  US, In-Person". The stored Oct 9-11 had no source; Hack Knight and Knight Hacks both sit on Oct
  9-11 in the same chunk, so the carry-over theory is plausible. MLH is already this record's
  source field, so this is not new aggregator dependence. Accept.
- **NorthSec (Montreal), 2027-05-17..23 -> 2027-05-10..16** - correct, and the leftover-JSON-LD
  diagnosis is exactly right. nsec.io reads "NorthSec Conference 2027 / May 10-16, 2027 /
  Montreal, Canada", Training May 10-11-12, Conference May 13-14, CTF May 14-15-16, Bonsecours
  Market 350 St-Paul East. The page does carry dead startDate 2020-05-10T08:00 / endDate
  2012-05-17T16:00, and 05-17 is the stored wrong start.
- **The MLH-sourced hackathon days do distinguish their provenance.** Spot-read uOttaHack,
  Hackville, ElleHacks, MakeUofT, SF Hacks, MariHacks, WEHack, LA Hacks, UofTHacks and HackKU:
  each evidence string states which facts came from the organiser (edition, month, city, venue,
  in-person format) and says explicitly that the day-level dates came from MLH's 2027 season
  registry. HackKU additionally flags that its organiser page is behind a Vercel 429 and could not
  be read. The distinction the curator claims is genuinely in the evidence.
- **Mississippi Digital Government Summit, Jackson -> Flowood** - correct. The organiser page's
  JSON-LD gives streetAddress "2200 Refuge Boulevard" and addressLocality "Flowood", and the venue
  link is the Sheraton Flowood The Refuge Hotel & Conference Center. last_date 2026-09-09 matches
  startDate 2026-09-09T08:00; the page reads "This Event is now Complete." Jackson still holds 5
  events, so nothing was orphaned.
- **WeAreDevelopers World Congress (San Jose) URL change** - correct. The old /world-congress
  returns title "WeAreDevelopers World Congress - 14-16 July - Berlin - Europe"; the new
  /world-congress-north-america returns "September 23-25, 2026 - San Jose, CA" with agenda entries
  dated "Thu, Sep 24". Dates and city in the record were already right.
- **Random confirmed spot-checks all held**: IBM TechXchange (Atlanta) - ibm.com/events/techxchange
  shows Monday 26 through Thursday 29 October, Atlanta GA, matching 2026-10-26..29. CyberBay
  Summit (Tampa) - cyberbay.org/summit/ states "CyberBay Summit 2027 will take place March 22-24,
  2027, in Tampa, Florida" and "JW Marriott Tampa Water Street", matching 2027-03-22..24. Hawaii
  Tech Week (Honolulu) - JSON-LD startDate 2026-08-31 / endDate 2026-09-06, on-page "Aug 31 - Sep
  6, 2026", matching the stored elapsed edition.
- **No aggregator-sourced date was introduced.** Every date changed this run traces to the
  organiser (nsec.io, west.paxsite.com, djangogirls.org/en/nyc/, dayofdata.org) or to MLH's season
  registry with that stated. No dev.events, 10times or Eventbrite search URL became a date source.
- **Link health**: 11/11 new or changed URLs resolve. tech-week.com returns a Vercel 429 bot wall
  to every fetcher - not a regression.
- **Build is idempotent**: re-running scripts/build-data.mjs reproduces the working tree exactly,
  so events.json is not hand-edited.
