# Audit report - 2026-10-11 (iteration 2)

Scope: a re-audit of the orchestrator's fixes for iteration 1 (B1-B4, W1, W2 and W4) and of three tooling changes (ledger last_attempt, audit-run queue coverage, snapshot-dispatch SHARED-PAGES). I also checked for regressions from the new retire and drop logic. Baselines: HEAD (8a7c95c, Oct 8) data/raw/feed.json and data/events.json.

**Verdict: 6 DISCREPANCIES (0 blocking, 6 warnings: 2 new, 4 carried over)**

Mechanical audit (agent/tools/audit-run.mjs): 0 blocking, 1 warning. The warning is the LF Legal Summit / PyTorch shared host. It was cleared in iteration 1 and is not counted. Curated records went 905 -> 904. The only removal is Charleston Digital Connect, and it has a recorded reason. Dispatched rows: 60/60. Changed links: 3/3. scripts/feeds/selftest.mjs: 44/44 pass.

## Blocking

None. All four blocking findings from iteration 1 are resolved (see "Checked and sound").

## Warnings

1. **Remnants of the aiventurelab network from groups that were not named in B1 (repeat of 2026-10-11-i1-B1).** Three past listings remain. Their descriptions link to aiventurelab.org/product/...?groupurlname=..., which is the same funnel as the repurposed groups:
   - salt-lake-city-claude-ai-workshop-real-skills-real-work-salt-lake-city. Venue "R24Q+28 Salt Lake City" (a plus-code), dated 2026-09-30, with the same "Master Claude in One Evening - The Vibe Coding Workshop" template. It comes from meetup.com/lace-up-for-casual-hockey-nights. **That group is registered tech: true** ("track record: 2/2 events clearly tech", added 2026-09-27), so any new templated listing from it passes the gate unjudged.
   - nashville-start-and-automate-your-ai-store-nashville, venue "48J8+V7 Nashville", 2026-10-05. Source: meetup.com/crafting-better-blogs-together-social-club, which is unregistered.
   - calgary-launch-your-ai-ecommerce-business-calgary, 2026-10-07. Source: meetup.com/friendly-german-chats-for-absolute-beginners, which is unregistered.

   All three are past, so they appear only under Past. That is why this is a warning rather than blocking. **Do:** add these three registry URLs to a sources-*.json with tech: false. The new path creates retired entries for unregistered groups, and carry-forward then drops the records by Meetup group:
   - https://www.meetup.com/lace-up-for-casual-hockey-nights/events/ical/
   - https://www.meetup.com/crafting-better-blogs-together-social-club/events/ical/
   - https://www.meetup.com/friendly-german-chats-for-absolute-beginners/events/ical/

   Also consider gating on an aiventurelab.org link in the description, which every listing in this network carries.

2. **The Longevity Social Club (Austin and Miami) is registered as "track record: 10/10 events clearly tech", but its 10 feed events are founder socials.** These include Founder Coffee Hour, Founder Dinner, "Revamp Your Social - Headshots and Bios", Anti-Networking Night and Quarterly Goal Setting. Only "AI Workshop - Claude and ChatGPT Training for Female Founders" (Austin Oct 23 at Gevity; Miami Oct 16 at Mindspace) is tech. Several venues read "address sent 48 hrs before". The organiser was registered on 2026-10-07 (it is in HEAD), so this predates this run. I found it while sweeping for leftover Claude listings. **Do:** set judge_each on https://www.meetup.com/the-longevity-social-club/events/ical/ so that only the AI workshops pass. This is the same class of question as the deferred Tech Week socials (W7) if the user prefers to decide it there.

### Carried over (state unchanged unless noted)

3. **Tech organisers rejected in new cities (repeat of 2026-10-11-i1-W3).** No change. All 8 are still tech: false in the registry with "no tech signal in organiser" or "only 1 upcoming event(s)": eventbrite.com/o/ 39058487853, 1710302898, 17965555697, 16074906148, 15960676096, 4534282341, 30700092802 and 15454944584. **Do:** propose them in a sources-*.json.
4. **Jersey City Entrepreneurs: The Venture Garden (repeat of 2026-10-11-i1-W5).** No change. next_date is still 2026-10-10 with status upcoming. oct05-r1-fixes.json line 10 still carries the superseded 10-06 operation.
5. **City spelling splits (repeat of 2026-10-11-i1-W6). This one is partly resolved.** The city "United States" is gone, because the Women Working Remotely record left with the retirement. Still present: 1 "Québec City" record next to 16 "Quebec City", and 9 feed records with a trailing comma (4 "Boston,", "Seattle,", 2 "Toronto,", "Washington,", "Montréal,"). **Do:** strip trailing punctuation and add a québec city alias in scripts/lib/places.mjs.
6. **Tech Week non-tech socials (repeat of 2026-10-11-i1-W7 / 2026-10-07-i3-W1, deferred to the user).** No change. The NTW Closing Party (Newark 10-16), Hard Tech Week Opening Party (Salt Lake City 10-26), Big Cayman Bash (SF 10-12) and Young Founders Hike (SF 10-11) are still listed.

## Checked and sound

- **B1/B2 retirements:** all 21 organisers in sources-oct11-audit.json are now registry entries with a reason starting "retired by". There are 0 events from them in data/raw/feed.json and data/events.json, matched by Meetup group slug in the URL, by Eventbrite organiser ID and by organiser name (Charlotte Mecklenburg Library, Hammerspace, Hartwig, Common Ground Co, Women Working Remotely, Christian Conscience, CBUS Maker). The 3 previously unregistered repurposed groups were created as retired entries. The no-op is fixed.
- **No over-reach by the retire logic:** 36 organisers are retired by a person. No retired display name collides with a non-retired registry source, so the name match cannot catch a bystander. Of the 180 feed IDs present at HEAD and gone now, the 68 that match a retired organiser are all from the 11 Claude Code groups and the-neighborhood-compost-and-social-club. Of the other 107 future-dated ones, 45 survive under a same-name, same-date copy on another platform. I fetched 4 that looked like losses, and each is deduplicated to a Luma copy: the Stripe NYC developer meetup, Elastic Seattle, AI DevFest Vancouver, and the Santa Monica New Tech "AI Agents Panel" (now "More Done, Same Team ... #LA Tech Week"). The same holds for VanLUG Linux Link and Vancouver Developers. The rest are luma-area re-judgements from the iteration 1 run, none caused by the retire or drop code. The last run reports vanished: 3.
- **City coverage:** the only cities with fewer upcoming events than at HEAD are Englewood (-7), Fullerton (-7), Chandler (-6), Garden Grove (-6), Oakland (-4) and Waterloo (-4). Every one of them is the retired network. New Jersey (68 -> 62) and Arizona (124 -> 123) are the only regions down, for the same reason.
- **Genuine Claude calendars untouched:** Claude Workshops (luma cal-8ACK0vjqOfKpHXl) has 16 records at HEAD and 29 now. Claude Community Events (cal-TOpA5LAFfuDeFpu) has 28 at HEAD and 28 now. Claude Startups, Claude Code Users Group (USD), Twin Cities Claude, Claude Developers Glendale, Cracked Claude Cowork, Claude Builders Bellevue and Tampa Bay Claude AI Workshops are all still present.
- **B3:** Charleston Digital Connect is removed with a recorded reason. Curated count 905 -> 904, and nothing else was removed.
- **B4/W2:** place-overrides.json has drop: true for eventbrite:1993029466786 (Tampa AI Week) and luma:evt-4GgZXWYCR5pM7fy / evt-EH4gqNrZc4JCzC3 (the two Virtual Claude SMB workshops). The gate reports "dropped on review: 3", and none of the three is in the feed or in events.json.
- **W1:** meetup:hackerlab (MADE Makerspace) and eventbrite.com/o/29737939547 (MakerSpace Charlotte) both carry judgeEvents: true.
- **W4:** Offensive AI Con (Oceanside) source and url are now https://www.offensiveaicon.com/.
- **Tooling:** ledger last_attempt is written only when a blocked attempt meets an existing sure entry. 11 entries carry one, all dated 2026-10-10, and all have substantive evidence. I re-fetched two of them: bsidessf.org still reads "BSidesSF 2026 is happening -- March 21-22", and brickhack.io still shows "February 22-23, 2025". They are genuinely worked rows, not hidden skips. The window rule now treats a blocked look as "looked at", which delays re-dispatch by 45 days rather than suppressing it. snapshot-dispatch now only dispatches SHARED-PAGES rows for curated events. Feed events sharing a page stay visible through audit-run's duplicate check.
