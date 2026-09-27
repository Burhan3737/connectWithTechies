# Audit report — 2026-09-27 (cycle 3, iteration 1)

Baseline `3d55e76` (907 events) -> working tree (905 events). `audit-run.mjs --since 3d55e76`: 0 blocking, 1 warning (the LF Legal Summit / PyTorch same-day warning, a false positive, see below). 122/122 dispatched rows have a ledger entry, and 50/50 new or changed links resolve.

**Verdict: 2 BLOCKING, 6 WARNINGS**

## Blocking

- **The held 2026 edition was dropped from `last_date` on 5 records: CppCon (Aurora), ALL IN (Montreal), DDX Innovation & UX Conference San Diego, AI Infra Summit (San Jose), Cybersecurity Summit Chicago.**
  These patches moved `next_date` to the 2027 (or spring 2027) edition but never set `last_date`. In the raw files, the 2026 edition was only in `next_date`. The 2026 `last_date` shown in the baseline `events.json` came from the build rolling a past `next_date` forward. It did not exist in raw. So the curators' note "last_date already records the held edition" was wrong, and the 2026 edition is now lost:

  | Event | last_date now | should be | evidence |
  |---|---|---|---|
  | CppCon | 2025-09-13 | 2026-09-12 | cppcon.org post "CppCon 2026 Wrap-up and CppCon 2027 Dates!" (2026-09-24). Baseline raw next_date 2026-09-12..18 |
  | ALL IN | (empty) | 2026-09-16 | allinevent.ai press release 2026-09-18: "ALL IN wrapped up its fourth edition yesterday". Baseline raw next_date 2026-09-16..17 |
  | DDX San Diego | (empty) | 2026-09-17 | baseline raw next_date 2026-09-17 |
  | AI Infra Summit | 2025-09-09 | 2026-09-15 | curator e2's own evidence: 2026 edition Sep 15-17, Santa Clara |
  | Cybersecurity Summit Chicago | 2026-03-03 | 2026-09-15 | curator e2's own evidence: the Sep 15, 2026 edition was at Chicago Marriott Downtown Magnificent Mile |

  Action: patch `last_date` to the values above. Going forward, any patch that advances `next_date` past an edition that has already run must also set `last_date`, whatever `events.json` shows. The raw record is what gets patched. (The Dreamforce, Oktane, UNBOUND, Splunk, XDS, Georgia Tech, YC and Cultivator Startup Summit patches did this correctly.)

- **Product Operations Summit San Francisco (San Francisco): new listing, unverified, wrong city.**
  This is the Kentucky Hall of Fame split again. In the baseline it was merged into Product-Led Summit SF because the two shared the PLA homepage. When e4 gave PLS its own URL, it surfaced as a separate event. The audit counts it as one of the "2 added", and no curator ever looked at it. It still has url `https://world.productledalliance.com/`, source `dev.events/NA/US/CA/San_Francisco/tech`, city San Francisco and no venue.
  world.productledalliance.com/location/sanfrancisco says: "Your pass gives you access to Product-Led Summit, Product Operations Summit, and ... AI Product Labs", with "Product Operations Summit - Co-located track", September 22-23, 2026, Hyatt Regency San Francisco Airport, Burlingame. It is a track inside Product-Led Summit SF, with the same pass, venue and dates. Its city also contradicts the sibling record, which was just moved to Burlingame.
  Action: remove it as a co-located track of Product-Led Summit San Francisco (Burlingame). The near-name check cannot catch this one because the names do not nest. If you keep it instead, set city Burlingame, the venue above, and its own PLA location URL, and drop the dev.events source.

## Warnings

1. **The MLH rule in `.claude/agents/curator.md` now contradicts itself.** Lines 79-83 read: "...do not count - mark those `blocked`. Two curators have read a season as satisfying this rule; it does not. Do not mark it `blocked` - that parks it at the top of the queue..." The new sentence was spliced in ahead of the old "Do not mark it blocked", which originally referred to the MLH-confirmed case. The overrides are consistent with the rule as intended:
   - Blocked, correctly: HackUMass (stale 2024 dates), Hackville (nothing), ElleHacks (TBA), UGAHacks (under construction), MakeUofT (TBD), RevolutionUC and WEHack ("Spring 2027").
   - Confirmed, correctly: MariHacks (the organiser's own text says "April 2027") and HackKU (the organiser's repo gives the days).

   But the next curator will read two opposite instructions. Action: rewrite the paragraph so it says one thing. Also decide whether blocked hackathons should keep publishing MLH-only days as `upcoming`. All 7 currently show exact dates, for example HackUMass 2026-11-13.

2. **Cultivator Community Night vs Cultivator Startup Summit apply different standards to the same evidence.** Both 2027 dates come only from event-card images on the same organiser page (cultivator.ca/events, "2027 Events"). I viewed both images:
   - `www.cultivator.ca/assets/startup-summit-2.png` reads "SEPT 15+16 2027 / Startup Summit / Cultivator HQ". This matches the applied 2027-09-15..16.
   - `www.cultivator.ca/assets/community-night-1-3.png` reads "JAN 28 2027 / Community Night / Cultivator HQ". It is just as legible.

   Leaving Community Night empty is defensible under "never guess a date". Taking the Startup Summit date from the same kind of source is then inconsistent. (A possible reason for the curators' disagreement: Jan 28 is also the 2026 date, so the card could be a template. The 2027 year on it is clear, though.) Action: pick one standard for organiser-published image cards. Then either set Community Night `next_date` 2027-01-28 or clear Startup Summit's, and record the image URL in the evidence either way.

3. **Aggregator or blog `source` left on records whose dates moved.** The dates themselves are organiser-verified, but the `source` field was not updated:
   - DDX San Diego: `dev.events/NA/US/CA/San_Diego`. Set to `https://www.ddxconference.com/sandiego`.
   - AI Infra Summit: `dev.events/NA/US/CA/Santa_Clara`. Set to `https://www.ai-infra-summit.com/`.
   - Cybersecurity Summit Chicago: `xl.net/blog/top-tech-conferences-chicago/`. Set to `https://cyberriskalliance.swoogo.com/Chicago2027`.

4. **Cybersecurity Summit Chicago's description contradicts the curator's finding.** e2 found the Hyatt Regency venue was wrong and blanked `venue`, but the description still says "A one-day executive cybersecurity summit at the Hyatt Regency Chicago...". Action: remove the venue from the description, since 2027 is "venue TBA".

5. **Gaps in the audit tooling.**
   - `audit-run.mjs` has no check for `last_date` regressions (moving backwards or emptied). That is why blocking #1 passed the mechanical audit. Suggest flagging any record whose `last_date` got older or empty relative to the baseline.
   - The new near-name check uses raw substring matching. "ces" matches inside "Gartner Identity & Access Management Summit" (Las Vegas). It is harmless only because their dates differ. Match whole words.
   - The near-name check skips records with no `next_date`, so undated duplicates are never compared (see 6).

6. **Hacker Dojo (Mountain View) and Hacker Dojo Events (Mountain View) look like one organisation listed twice.** Both are undated recurring listings at 855 Maude Ave with the same audience and the same description of the programme. One points at hackerdojo.org, the other at meetup.com/hackerdojo. This predates this run. Action: merge them, keeping the hackerdojo.org record and the Maude Ave venue.

## Checked and sound

- **Mechanical warning "LF Legal Summit and PyTorch Conference start 2026-10-20 in San Jose":** false positive, as the previous audit judged. They are separate pages (/lf-legal-summit/ and /pytorch-conference-north-america/) for separate co-located events.
- **DDX San Diego "dead link":** it was transient. ddxconference.com/sandiego loads, is titled "DDX Innovation & UX Conference San Diego | September 16, 2027", and gives UC San Diego Park & Market, 1100 Market St. The 2027-09-16 date and venue are correct.
- **Removals:** all four hold.
  - Indy Women in Tech Summit: the IBJ article "Nonprofit group Indy Women in Tech disbands after 9-year run" is live, with Dec. 31, 2025 in the article.
  - 9D Jam: itch.io/jam/9d-jam-iii and 9d-jam-ii both say "This jam will be 100% virtual and will have kickoff and closeout in the Buffalo Game Space discord".
  - Knox Game Design: the /about/ page says "The group typically meets in the Spring for a game jam kickoff", and the in-person paragraph is commented out. The monthly items are podcast episodes.
  - Kentucky Entrepreneur Hall of Fame Induction: a duplicate. entrepreneurhof.com/induction-dinner/ gives November 4, 2026, Central Bank Center, the same as the surviving "Induction Celebration" record.
- **Rename Elevate -> Nrth Festival:** nrth.ca is titled "Home - Nrth Festival" ("Elevate is Becoming Nrth"), and its footer gives 14-16 September 2027. The record matches, and its description notes "formerly Elevate".
- **Next editions, all verified verbatim on organiser pages:**
  - Dreamforce: "September 21-23, 2027 | San Francisco"
  - Oktane: "SEPTEMBER 28-30, 2027 CAESARS FORUM | LAS VEGAS"
  - Splunk .conf27: "going to Chicago ... McCormick Place ... October 4-7, 2027". The city move to Chicago is correct, and last_date 2026-09-14 keeps the Denver edition.
  - AI Infra Summit: "Aug 31 - Sept 2, 2027 San Jose McEnery Convention Center". The city move is correct.
  - CppCon: "September 18-24, 2027"
  - UNBOUND: "September 8 - 10, 2027 in Boston"
  - ALL IN: "September 22-23 at the Palais des congres de Montreal"
  - Cultivator Startup Summit: the image card reads SEPT 15+16 2027.
- **City moves Product-Led Summit SF and CPO Summit SF -> Burlingame:** correct. The PLA page gives Hyatt Regency San Francisco Airport, 1333 Old Bayshore Highway, Burlingame.
- **The new near-name duplicate check:** it produces zero hits on current data, so no false positives. The only same-city name-nesting pairs (SXSW / SXSW EDU, LA Hacks / LA Hacks AI Hackathon, CES / Gartner IAM, Hacker Dojo / Hacker Dojo Events) all have different or empty `next_date`.
- **Random confirmed rows, each matching its page:**
  - Maker Faire Orange County: "Costa Mesa, CA Sept 12 & 13, 2026"
  - YYC DATACON: "BMO CENTRE, CALGARY SEPTEMBER 11, 2026"
  - NH Tech Alliance Cybersecurity Summit: "September 10th, 2026 Manchester Community College"
  - Tulsa Tech Week: "Sept 21 - 26, 2026 Tulsa"
- **Coverage:** no city or state lost all its events. Net changes are Buffalo, Indianapolis and Knoxville -1 (the removals), Denver and Santa Clara -1 with Chicago and San Jose +1 (city moves), and Burlingame +2. Knoxville keeps Knox Game Jam.
