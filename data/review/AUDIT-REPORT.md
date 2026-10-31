# Audit report — 2026-10-31 (cycle oct31, iteration 3, final re-audit)

**Verdict: 1 DISCREPANCY** (0 blocking, 1 warning)

Scope: the orchestrator's fixes for 2026-10-31-i2-B1, -W1 and -W2, the feed re-run from cache,
and the events.json rebuild. No curator pass ran and no new dispatch snapshot was taken.

Mechanical audit (`agent/tools/audit-run.mjs`): 0 blocking, 0 warnings. Curated events went
937 -> 961 with none gone. Queue coverage is 61/61. 25/25 new or changed links resolve. No
duplicates and no consistency errors. Feed selftest: 212/212 pass.

## Blocking

None.

## Warnings

- **Sac Made Market First Fridays (Sacramento)**: a leftover of the i2-W1 bug on another
  judge_each organiser. Feed record `series:5fcdc0004983786c` (meetup.com/hackerlab/events/315494187,
  next 2026-11-06, also 2026-12-04) is from MADE Makerspace (`meetup:hackerlab`). That source
  has been judge_each since 2026-10-11 (sources-oct11-audit.json, "mostly craft classes").
  Even so, the record carries feed_relevance "registered tech organiser" and was first and last
  seen 2026-10-25. It was admitted through the same techOrg re-add that run.mjs now blocks. It
  was not re-read in this run, so history carried it forward unjudged. Its description is "Come
  celebrate the artists, makers, creatives ... local shopping ... pop-up market featuring local
  vendors, handmade goods, art". That is an arts market, not a tech event. It is the only
  *upcoming* record from any of the 7 judgeEvents sources that still carries "registered tech
  organiser".
  **Action:** add a drop for `series:5fcdc0004983786c` in data/feeds/place-overrides.json. If
  hackerlab is read in full next time, the gate should reject it there as well.

## Checked and sound

- **i2-B1 (BSides Halifax) is fixed.** Curated `bsides-halifax-halifax` now has next_date and
  next_date_end 2026-11-12, status upcoming, last_date 2025-11-13 and url halifaxbsides.ca. I
  re-read halifaxbsides.ca today: "This year's conference will be November 12, 2026 ... Dalhousie
  University Faculty of Computer Science", with a published schedule for Thursday, November 12.
  The ledger has `bsideshalifax|halifax` corrected 2026-10-31, cycle oct31-audit. The ShiftKey
  duplicate `ical:104889-...@shiftkeylabs.ca` is dropped in place-overrides, and only one BSides
  Halifax record remains in events.json.
- **i2-W2 (AWS Prep Course) is fixed.** Four drops in place-overrides (ical 104892, 104896,
  104899, 104902). There are no "AWS Prep" records left in events.json. The remaining ShiftKey
  records are the two past hackathons, both sound last iteration.
- **i2-W1 (Red Fridge) code fix holds.** run.mjs lines 182 and 208 now skip `techOrg.add` for
  judgeEvents organisers. Every upcoming Red Fridge event is now judged by title. Santa Happy
  Hour, Foundation Wine Course - South America, Red Fridge POKER Society and Tea Society are gone.
  What remains upcoming is the talks (Fridgeside! x3, Agentic AI Show-and-Tell, Lunch Society: Is
  AI Recommending You) plus Founder Coffee Tasting and Torque and Tacos, which pass on "founders".
  The orchestrator accepted those two, and I am not re-raising them.
  Residue, not a finding: 12 *past* Red Fridge records from before the fix (Cellar Society wine,
  Fridge Football, Sauna Happy Hour, Wine Course - Spain, poker and others) are still
  "registered tech organiser" in the Past view. History carries held events without judging them
  again. They expire after KEEP_PAST_DAYS (60), by about late December. Drop them in
  place-overrides only if the Past view matters before then.
- **No regressions.** No curated event was lost and no source tripped the delisting threshold.
  The Great Lakes Software Symposium last_date correction is still applied from its patch.
  Duplicate ids in events.json (820) are the existing pattern of feed series sessions sharing a
  slug, not something this run introduced.
