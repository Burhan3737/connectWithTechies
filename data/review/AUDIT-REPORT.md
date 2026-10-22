# Audit report — 2026-10-22

**Verdict: 3 DISCREPANCIES** (0 blocking, 3 warnings)

Scope: uncommitted run vs HEAD. No curator queue was dispatched. This was the first use of the
`add` patch action: `oct21-coverage-fixes.json` adds Hack Canada (Toronto) to the new raw file
`data/raw/discovered.json`. `npm run apply` re-applied the two older Venture Garden patches, then
`build:data` and `ledger` ran.

Mechanical audit (`audit-run.mjs`): 0 blocking, 0 warnings. 904 -> 905 curated events (+1 added,
0 gone), 1/1 new link resolves. Queue coverage: 60/60 rows of the stale Oct 11 `DISPATCHED.tsv`
have ledger entries, so **0 row-skipped findings** came out of it. It would not have applied to
this run anyway.

## Blocking

None.

## Warnings

- **W1. Hack Canada (Toronto): `last_date` 2026-03-06 is a Waterloo edition.** The Devpost page
  for the 2026 edition (hack-canada-2026.devpost.com) says "Mar 6 – 8, 2026, SPUR Innovation
  Centre ... Join over 800 students ... at Waterloo's SPUR Innovation Centre". hackcanada.org
  only says "Last year: March 6–8". So the Toronto record says an edition was held in Toronto
  that was really held in Waterloo, and the `rolled` re-check rule will reason from that date.
  **Do:** either clear `last_date`, or keep it and add one clause to the description such as
  "moved to Toronto for 2027; the 2026 edition was at SPUR Innovation Centre, Waterloo". Edit
  through a patch so `data/raw/discovered.json` stays owned by `apply`.
- **W2. Hack Canada (Toronto) has no ledger entry.** The curator verified it against
  hackcanada.org when adding it, but no confirmation was recorded. VERIFIED.md now shows 2
  unchecked records, and `TO-VERIFY.tsv` line 10 queues it as `never`, so the next pass will
  spend budget re-verifying a record checked today. **Do:** record a `confirmed` ledger entry with
  the hackcanada.org evidence ("January 8-10, 2027 | Myhal Centre @Uoft | In-person event";
  "How much does it cost? Nothing"). It is also worth deciding whether the `add` action should
  write that entry itself.
- **W3. Jersey City Entrepreneurs: The Venture Garden (Jersey City): the patch flip-flop was
  applied again** (repeat of 2026-10-11-i2-W4). APPLIED.md logs `oct05-r1-fixes.json` setting
  next_date 10-10 -> 10-06 and then `oct07-s1-fixes.json` setting it back to 10-10. The net
  effect is zero: the record in `data/events.json` is byte-identical to HEAD (next_date "",
  last_date 2026-10-10, recurring-tbd, source_file review-additions), and no raw file changed.
  But the superseded 10-06 operation, which was a cancelled session, still lives in
  `oct05-r1-fixes.json`. The record is right only because of the order the patches apply in, and
  the operation is logged again on every apply. **Do:** delete or neutralise the Venture Garden
  op in `oct05-r1-fixes.json`. The record itself is also in the `regroup` queue (weekly group,
  no next date).

## Checked and sound

- **Hack Canada matches the organiser's page.** Checked against hackcanada.org (fetched, 200,
  title "Hack Canada 2027"): dates January 8-10, 2027 (Jan 8 2027 is a Friday, which fits "Doors
  open Friday evening"), venue Myhal Centre @UofT, city "University of Toronto in Toronto,
  Ontario", "In-person event", cost "Nothing ... free", audience "Any student in high school or
  university", over $10K in prizes, and travel reimbursement (the page says *partial*). Type
  `hackathon`, `url` and `source` are the organiser's own site, not an aggregator. The status is
  `upcoming`.
- **No duplicate.** In `data/events.json`, no other record matches hack canada or hackcanada in
  name, URL or description, and no other record has Myhal in its venue. The other Toronto
  January hackathons, UofTHacks (Jan 15) and ElleHacks (Jan 29), are separate events.
- **The new raw file was picked up correctly.** `discovered.json` holds exactly the patch record.
  `events.json` has it once, with id `hack-canada-toronto` and `source_file: "discovered"`.
  `check-data` reports 905 curated records and all fields filled.
- **Venture Garden** is byte-identical to HEAD (see W3 for the patch hygiene issue).
- **Most of the `events.json` diff comes from the date rebuild.** HEAD has 9429 records and this
  run has 9431. Apart from the Hack Canada add, the only changes are in feed records, plus
  date-driven status and next/last rollovers on curated records (`generated_on` moved from 10-15
  to 10-22). About 1,700 records changed only their status, and about 1,900 had changes limited
  to status, dates and sort_date. Three feed ids changed how many records they hold (bitplebs
  ATL 2->3, Miami training grants 2->1, SF startup pitch 2->3), and one feed series (BASICS:
  Spindle Turning, Lacey) was collapsed into its one-off Eventbrite listing. Those changes come
  from the date rebuild over raw feed files, which are unmodified.

Sources: https://hackcanada.org/ , https://hack-canada-2026.devpost.com/
