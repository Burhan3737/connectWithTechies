# Event record schema

Every event object in `data/raw/*.json` MUST use exactly these fields.

```jsonc
{
  "name": "Collision Conference",            // official event name, no year suffix unless part of brand
  "type": "conference",                      // one of: conference | hackathon | workshop | tech-week | meetup-series | meetup (feed only) | summit | expo | festival | ctf | game-jam | startup-week | demo-day | unconference | career-fair | bootcamp | awards
  "topics": ["startups", "ai", "web3"],      // lowercase tags
  "city": "Toronto",                         // primary host city; "Various" only if truly multi-city
  "region": "Ontario",                       // state or province full name
  "country": "Canada",                       // "Canada" | "United States"
  "venue": "Enercare Centre",                // "" if unknown
  "cadence": "annual",                       // annual | biannual | quarterly | monthly | weekly | one-off | rolling
  "month": "June",                           // typical month(s), e.g. "June" or "May-June"; "Varies" if rolling
  "next_date": "2026-06-17",                 // ISO date of next confirmed edition, or "" if unconfirmed
  "next_date_end": "2026-06-19",             // ISO end date, or "" 
  "last_date": "2025-06-17",                 // ISO start date of most recent past edition, or ""
  "status": "upcoming",                      // upcoming | past | recurring-tbd | discontinued
  "attendance": "35000",                     // approximate, string; "" if unknown
  "cost": "paid",                            // free | paid | freemium | invite-only | varies
  "audience": "developers, founders, investors",
  "url": "https://collisionconf.com",        // ORIGINAL official event link (required, must be real)
  "description": "One or two sentences on what happens there and who it is for.",
  "source": "https://where.you.verified.it"  // page you confirmed details on
}
```

Rules:
- `url` must be the official event site, never a ticket aggregator, unless the event only exists on Meetup/Eventbrite/Luma.
- Do not invent dates. If a 2026 date is not published, set `next_date: ""` and `status: "recurring-tbd"`, and fill `last_date` from the most recent edition.
- Prefer breadth: many cities, many event types. Include small/local recurring series, not just megaconferences.
- No duplicates within your own file.

## Feed records

`data/raw/feed.json` is written by `scripts/feeds/run.mjs`, never by hand or by an agent.
Its records use the same fields, `cadence: "one-off"`, plus:

```jsonc
{
  "type": "meetup",                    // also allowed for feed records: a single gathering
  "feed_source": "luma",               // luma | meetup | eventbrite | mlh | devpost | confstech | ical
  "feed_id": "luma:evt-abc123",        // the source's own id — stable across runs
  "feed_via": "luma-cal:cal-xyz",      // registry source or dataset that maintains it; "" if found by discovery only
  "feed_organiser": "The AI Collective",
  "feed_relevance": "registered tech organiser",   // why the relevance gate kept it
  "feed_first_seen": "2026-09-27",
  "feed_last_seen": "2026-09-27"
}
```

A curated record always wins: an event already in a curated file is not repeated by the
feed. Tools that verify by hand (ledger, verify-dates, check-links, audit-run) skip any
record with `feed_source` — re-reading its source on every feed run is its verification.
