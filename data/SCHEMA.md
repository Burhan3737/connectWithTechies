# Event record schema

Every event object in `data/raw/*.json` MUST use exactly these fields.

```jsonc
{
  "name": "Collision Conference",            // official event name, no year suffix unless part of brand
  "type": "conference",                      // one of: conference | hackathon | workshop | tech-week | meetup-series | summit | expo | festival | ctf | game-jam | startup-week | demo-day | unconference | career-fair | bootcamp | awards
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
