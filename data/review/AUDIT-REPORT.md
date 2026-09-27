# Audit report — 2026-09-26

Iteration 1. Baseline `a13a490` (883 events), working tree 908 events / 239 cities. 147 dispatched rows (d1–d5), plus the `mlh-policy` and `moves` cycles and the dedup-rule change.

**Verdict: 2 DISCREPANCIES (blocking), 4 warnings**

The mechanical audit (`node agent/tools/audit-run.mjs --since a13a490`) reports 0 blocking and 22 warnings. All 22 are the build's "kept apart, shares a page" pairs. They are rolled into warning W4 below, not counted one by one.

## Blocking

- **Minnedemo (Minneapolis): a real duplicate the looser merge let through.**
  The dataset now has two Minnedemo records. The first is `Minnedemo | St. Paul`: 2026-10-01, The Ordway, url `minnestar.org/minnedemo/`, from `data/raw/review-additions.json`. The second is `Minnedemo | Minneapolis`: undated, no venue, url `minnestar.org`, from `data/raw/us-central.json` around line 744. At baseline the Minneapolis copy was hidden because it was merged into Minnebar through the shared `minnestar.org` URL. The new rule separated it from Minnebar, correctly, but nothing merges it with its real twin, because the two records have different cities. Neither the audit's same-name+city check nor the build's same-page check can see this. minnestar.org/minnedemo/ reads "Minnedemo42 is Oct 1, 2026", and the previous edition was "at the Ordway in St. Paul". So there is one event, and it is in St. Paul.
  **Fix:** REMOVE `Minnedemo` / `Minneapolis` (us-central.json). Keep the St. Paul record. The "Minnedemo and Minnebar share minnestar.org" warning goes away with it.

- **MLH-policy reclassification: 7 of 12 hackathons were confirmed without meeting the policy's own condition.**
  The policy says MLH counts as confirmation "when the organiser agrees on month/city/in-person". Every `mlh-policy` evidence string starts with the same boilerplate, "Organiser publishes month/venue only". For 7 records the curator's own note, appended to that same string, says the organiser has published no month:
  - **HackUMass (Amherst)**: the only date on the organiser site is the stale "November 8 - 10, 2024". No 2026 date exists anywhere on the organiser side.
  - **Hackville (Mississauga)**: the site still shows the 2026 edition, with "Share your interest ... Hackville 2027". No 2027 date.
  - **ElleHacks (Toronto)**: "To Be Announced · In-person event". No month.
  - **UGAHacks (Athens)**: "Register for UGAHacks 12" and a subdomain reading "Under Construction". No date.
  - **MakeUofT (Toronto)**: "University of Toronto TBD, 2027". No month.
  - **HackKU (Lawrence)**: the organiser page was never read (HTTP 429). The only source is the MLH listing.
  - **MariHacks (Montreal)**: in person at Marianopolis, but no date or month.

  These 7 are confirmed on MLH alone, and each evidence string contradicts itself. This matters because `confirmed` means "skip these", so these records drop out of every future queue.
  The ledger also truncates each evidence string at about 500 characters. The first ~330 characters are boilerplate, so the cut lands exactly on the text saying what MLH listed (for HackUMass it ends at "MLH 2027 sea"). As stored, none of the 12 records says which days came from MLH. The full text only survives in `.confirm-d3.merged` and `.confirm-d4.merged`.
  **Fix:** set those 7 back to `blocked`, keeping the original d3/d4 evidence. If the orchestrator actually means MLH alone is enough, it should change the written policy first. For all 12, rewrite the evidence so it states the facts directly and fits the cap, for example: "organiser: <what it says>; MLH: <days, city, In-Person>". Drop the boilerplate.
  Borderline cases, for the orchestrator to decide: **RevolutionUC** and **WEHack** publish only "Spring 2027", which is a season, not a month. **UofTHacks**, **uOttaHack** and **LA Hacks** meet the policy as written (January, January, and "Mid-April 2027 at UCLA Pauley Pavilion") and can stay confirmed.

## Warnings

- **W1. Partner Vibe (Provo): the description now contradicts the city.** d5 correctly moved the city to Provo (partnerin.io/vibe/logistics: "All activities ... at the Provo Marriott Hotel & Conference Center in Provo, UT"). The description still says "A partner and channel conference in Salt Lake City". The organiser does market it as "Salt Lake City Area", so this is a mismatch, not a fabrication. **Fix:** change the description to "...in Provo, Utah (Salt Lake City area)...". While there, replace `source` (still `dev.events/NA/US/UT`) with `https://partnerin.io/vibe/logistics`.

- **W2. Cambridge Science Festival (Cambridge): `month` is still "September".** The d5 correction to 2026-10-04 is right. The "September 23 - 29" line is inside an HTML comment, and cambridgesciencecarnival.org shows "Sunday October 4 ... 12-4pm, Kendall/MIT Open Space". But the record's `month` still says September. **Fix:** set `month` to "October", or "Varies" if the curator expects the format to move again.

- **W3. Two date changes kept an aggregator in `source`.** Michigan Technology Conference (Rochester) moved to 2026-10-29 from organiser JSON-LD (verified: mitechcon.org JSON-LD 2026-10-29..30), but `source` is still `dev.events/NA/US/MI/tech`. Seattle Day of Data (Seattle) moved to 2026-11-13 from dayofdata.org, but `source` is still `dev.events/NA/US/WA/Seattle`. The dates are right; the provenance field is wrong. **Fix:** set `source` to `https://www.mitechcon.org/` and `https://dayofdata.org/2026-11-12-dayofdata1155/` respectively.

- **W4. Newly visible events: all real, but two need attention on their first verification.** Of the 25 surfaced events, only Minnedemo (Minneapolis) should not exist (see Blocking). The other 21 kept-apart pairs are distinct events: different formats, different months, or an umbrella week alongside its anchor event, the same pattern already used for Open Source AI Week and PyTorch Conference. All of them share a listing URL, and each needs its own page (this is what the mechanical audit's 22 warnings are about). Specific items for the `never` pass:
  - **Chief Product Officer Summit San Francisco**: `last_date` is 2026-09-17, which came from dev.events. The organiser's world.productledalliance.com lists "Sep 24, 2026 Chief Product Officer Summit San Francisco". Set `last_date` to 2026-09-24. Its `url` and `source` are also the generic PLA home page and dev.events.
  - **AI Week Milwaukee** and **First Look Forum**: the only source is a vendor blog listicle (mcservices.com/top-tech-conferences-milwaukee). Neither has an organiser page yet.
  - Checked against the organiser and correct: **Chief Product Officer Summit Silicon Valley** (2027-04-14, dev.events-sourced, matches PLA "Apr 14, 2027 ... San Jose"), **Pittsburgh Tech 50 Awards** (pghtech.org "2026 Tech 50 Awards 19 Nov"), **NVTC Cyber Summit & Cyber50** (nvtc.org JSON-LD 2026-10-28), **Charleston Tech Week** (digsouth.com "Dig South Anchors Charleston Tech Week - May 17-21, 2027"; the summit is May 20-21, so the week contains it and is not a copy of it), **AGNTCon + MCPCon NA** (LF calendar "Oct 22-23, 2026, San Jose").
  - All five Cultivator events are distinct programmes on cultivator.ca/events (Community Night, Founders Retreat, Startup Summit, AGTECH, START). STARTup Showcase (last_date 2024-10-11) is stale and may be a lapsed programme. Check that when it comes up.

## Checked and sound

- **Santa Monica New Tech removal holds.** The Meetup events page embeds 40 events, all `"eventType":"ONLINE"` and all titled "Tech Meetup: Virtual Open Coffee Club". The removal is justified.
- **BSides Columbus and Jupyter Day removals.** Both are genuine duplicates of surviving records (BSides CMH, Jupyter Day San Jose), as the dedup patches state.
- **Date moves verified on organiser pages:** Michigan Technology Conference, 2026-10-29..30 (JSON-LD). Stripe Sessions, 2027-05-04..06 (stripe.com/sessions redirects to stripesessions.com; JSON-LD, and the 2026-04-28 JSON-LD is the old edition). Devnexus, 2027-03-29..31 (hero reads "MArch 29-31, 2027 Georgia World Congress Center"). Small Satellite Conference, 2027-08-01..04: in the HTML each year is an h2 with its own card ("2027" then "August 1-4"), so the reading is right, even though the fetch tool's flattened "ranges" line misleadingly pairs "August 23-26 2027". Cambridge Science Festival, 2026-10-04 (see W2 for the month field). CHM Live, 2026-11-05 ("Data Are Made, Not Found Thursday, November 5, 2026").
- **City changes verified:** Day of Data Orlando to Sanford (Seminole State College, 100 Weldon Blvd, Sanford). Pittsburgh TechFest to Moon Township (RMU UPMC Event Center, Oct 30). Pacific Northwest Software Symposium to Redmond (Aloft Redmond). Partner Vibe to Provo (see W1). The ledger keys moved with the cities (sanford, moontownship, provo, redmond, burlington, homestead), so none of these records falls back into the never-verified queue.
- **Random confirmed rows:** SpiceWorld Austin ("returns to Austin on Nov. 12-13!") and PTC'27 Honolulu ("17-20 January 2027") both match their evidence. The MHacks and SANS evidence strings explain their decoy dates specifically.
- **Build fixes:** CT Tech Week region is now Connecticut. Southwestern Ontario Drupal Camp is in Kitchener (Kitchener Public Library on Friday; Waterloo campus on Saturday). The 10 remaining "US & Canada" records are genuinely multi-country series.
- **Coverage:** every city or region that lost an event is explained by a verified city move (Boston, Orlando, Seattle, Salt Lake City, Pittsburgh, Waterloo) or the Santa Monica removal. No silent loss.
- **Mechanical warning "LF Legal Summit and PyTorch Conference start 2026-10-20":** false positive. They share a host, not a page (/lf-legal-summit/ and /pytorch-conference-north-america/), and they are separate co-located events.
- **RSAC Conference is patched twice in APPLIED.md.** This is correct: two raw records (categories.json and us-west.json) merge into one event.
- **Clock note, not a finding:** ledger `checked_on`, `generated_on` and the APPLIED headings say 2026-09-27 because the scripts use a UTC date and the machine is in EDT (22:26 on 09-26). Events dated 09-26 rolled over a few hours early. That is harmless tonight, but worth knowing.
- **Side effect:** following the brief, the auditor ran `node scripts/build-data.mjs`. It regenerates `data/events.json` from the raw files: same 908 events, only `generated_on` changes. No raw data was edited.
