# Audit report — 2026-09-15

**Verdict: 3 BLOCKING, 6 WARNINGS**

Standing audit of current state (no curator run since 2026-09-10). The mechanical audit
against `acb6e0f` returned 0 blocking / 2 warnings; both standing warnings are resolved
below as false positives. The findings here come from Task 1 (auditing
`verify-dates.mjs`) and Task 3 (the rollover).

**Headline on Task 1:** every stored date I checked by hand was correct — I found no
event whose date is wrong. But the *evidence* behind a large minority of the 410
confirmations does not support the verdict, and on one it provably points at a different
event on a different continent. The check is a good stale-date detector and a poor
confirmation of correctness.

---

## Blocking

### 1. RustConf (Montreal) — rollover hid an announced next edition, and a city move

Rolled to `recurring-tbd` with `last_date: 2026-09-08`. The 2026 edition did happen
(rustconf.com: "from September 8-11, 2026, the Rust community gathered in Montreal"), so
`last_date` is right. But the same page already announces the next one:

> **SAVE THE DATE: September 7-10, 2027 | Vancouver, Canada + Online**

rendered on the page as "see you next year! september 7-10 | vancouver + online". The
rollover published "we do not know when the next one is" on a page that says exactly when
it is, and in a different city.

**Set:** `next_date: 2027-09-07`, `next_date_end: 2027-09-10`, `status: upcoming`,
`city: Montreal -> Vancouver`.

**Caution:** rustconf.com's TITLE tag still reads "RustConf 2027 - September 8-11 |
Montreal + Online". That is a stale title the organiser forgot to update — the body copy
is the authority. Do not take the title.

### 2. Kansas City Developer Conference (Kansas City) — rollover hid published 2027 dates

Rolled to `recurring-tbd` with `last_date: 2026-09-09`. kcdc.info's front page currently
leads with:

> Join us for **KCDC 2027!** Workshops: Wed, Aug 4 · Conference: Thurs, Aug 5 - Fri, Aug 6
> · Kids Tech Day: Sat, Aug 7

**Set:** `next_date: 2027-08-04`, `next_date_end: 2027-08-07`, `status: upcoming`.
If the directory records only the conference proper rather than the workshop day, use
`2027-08-05` to `2027-08-06` — but the page sells all four days as KCDC 2027.

### 3. OpenSearchCon North America (San Jose) — false confirmation

Ledger entry: `automated: page still shows "sep 22, 2026"`, against
`url: https://events.linuxfoundation.org/` — the Linux Foundation *root events index*.

The string it matched is not this event's date. On that page "sep 22, 2026" occurs as:

> stuttgart physical ai workshop and meetup **sep 22, 2026** | stuttgart, germany

A different event, in Germany. The stored date happens to be right — the same page
elsewhere says "opensearchcon north america **sep 22-24, 2026** san jose, united states"
— but the ledger's evidence is for another event entirely, and the record's `url` is an
index page rather than the event's own page.

**Set:** `url: https://events.linuxfoundation.org/opensearchcon-north-america/`, and
re-record the ledger evidence against the OpenSearchCon listing itself. `next_date` and
`next_date_end` (2026-09-22 to 2026-09-24) are correct as stored.

---

## Warnings

### W1. The confirmation check has no discriminating power on multi-event pages

This is the systemic finding behind blocking item 3, and it is the answer to "is the
automated confirmation trustworthy?".

I ran a decoy test: for 44 of the 410 confirmations whose URL is a listing or calendar
page, I re-ran the script's own `renderings()` matcher against dates the event *does not
have* (+7, +14, -21, +35 days). **14 of 44 pages (32%) also "confirmed" a date the event
does not have.** On those pages a `confirmed` verdict is a coincidence, not evidence:

Tennessee Quantum Hackathon, Jersey City Entrepreneurs, Buffalo Game Space, CHM Live,
TechCrunch Disrupt, BSidesCache, CONNECT: Networking for Entrepreneurs, Partner Vibe,
The AI Pivot Conference, West Slope Startup Week, Digital Summit Philadelphia,
Scrum Day Houston, Product-Led Summit San Francisco, Wisconsin Biohealth Summit.

Four specific mechanics cause it:

1. **It searches the raw HTML, not just the rendered text** (`raw.includes(r)` in
   `check()`). Confirmed matches landed in: another event's JSON-LD block —
   dev.events/NA/US/UT matched UtahJS Conf's `startDate` before reaching BSidesCache's;
   an `.ics` download href query string (innovationdepot.org); and The Events Calendar's
   `"selected_end_datetime"`, which is the calendar's own view window, so an ISO match on
   any WordPress/Tribe events page is close to self-fulfilling (thecompanylab.org).
2. **Year-less renderings** (`October 14`, `Oct 14`, `10/14`) account for **191 of the
   410** confirmations. On a page listing a year of events these are near-worthless.
3. **No proximity constraint.** Nothing requires the matched date to be anywhere near the
   event's name.
4. **Text flattening manufactures strings that are not on the page.** Wisconsin Biohealth
   Summit "confirmed" on `oct 21 2026` — a string that exists only because the flattener
   joined the date label "Wed Oct 21" to the next event's title "2026 Wisconsin Biohealth
   Summit".

**Suggested fix for the tool owner:** require the match to fall within roughly 300
characters of the event name; drop year-less renderings when the page contains more than
one `startDate`; search the stripped text only, and strip `href` and `datetime`
attributes and Tribe `selected_*` JSON before matching. Failing all that, downgrade
listing-page matches from `confirmed` to `ambiguous` and hand them to an agent.

**What this implies for the other ~395:** I verified 26 records by hand and found zero
wrong dates, so this is not a live data-corruption problem — the dataset is in better
shape than its evidence trail. But roughly a third of the listing-page confirmations rest
on evidence that cannot distinguish the right date from a wrong one, and the ledger now
marks them settled so nothing will look again. Treat `cycle: "script"` confirmations on
`/events/`, `/calendar/` and aggregator URLs as *unchecked* rather than checked until the
matcher is tightened. Confirmations on a dedicated event domain that matched a
year-bearing rendering held up every time I looked and can be trusted.

### W2. Thirteen records point at an aggregator, and were confirmed against it

`url` is a dev.events page for 13 events, and for 10 of those it is a **state index**
(`dev.events/NA/US/UT`, `/CO`, `/AZ`, `/WI/tech`, and so on), not an event page:

The AI Pivot Conference (Anaheim), Tech Fuse Des Moines, West Slope Startup Week
(Durango), RedacteCON (Grand Junction), Scrum Day Houston, BSidesCache (Logan),
Scrum Day Madison, Rails Camp West (Otis), Partner Vibe (Salt Lake City),
DDX Innovation & UX Conference (San Diego), Workplace Ninjas US (Scottsdale), plus
Humanoid Robots Summit NA and FTW:SF on dev.events per-event pages.

For these, `source` is also dev.events, so the script re-confirmed the aggregator against
itself. No organiser page has ever been consulted. The dates all match what dev.events
publishes, and the one I checked independently is right (RedacteCON: Sep 19 2026,
Colorado Mesa University Ballroom, Grand Junction), but that is luck rather than process.

**Action:** repoint these at the organiser. RedacteCON's own site is `redactecon.org`;
most of the others will have one too. Where no organiser page exists, at least use the
per-event dev.events URL (`dev.events/conferences/...`) rather than the state index, so a
future confirmation cannot match a neighbouring event.

### W3. SAP Connect (Las Vegas) — confirmation is unreproducible and non-probative

Ledger: `page still shows "october 5"` against `https://www.sap.com/events.html`. That is
SAP's global event index; a bare "october 5" on it says nothing about a Las Vegas
conference. It now returns **HTTP 403 with a 380-byte body**, so under the script's own
`body.length < 500` rule it would be `unreadable` today and the entry cannot be
reproduced. (403 is a bot wall, not a broken link — not reported as one.) The only
corroboration for 2026-10-05 to 2026-10-07 is dev.events/NA/US/NV, which is also the
record's `source`.

**Action:** find SAP Connect's own event page, repoint `url`, and re-verify against it.

### W4. Wisconsin Biohealth Summit (Milwaukee) — `next_date_end` unsupported

Stored `2026-10-21` to `2026-10-22`. mketech.org/events lists it once, as
"wed oct 21 2026 wisconsin biohealth summit **all day** · baird center", with no Oct 22
entry. The record's description calls it "a two-day Wisconsin summit". One of the two is
wrong. **Action:** check the summit's own site; if it is a single day, clear
`next_date_end` and fix the description.

### W5. Open Source AI Week (San Jose) — city may be wrong

Confirmed on the LF calendar, which lists it as "open source ai week **oct 16-25, 2026
bay area, united states**". The dataset pins it to San Jose; the 2025 edition was
San Francisco-centred. The dates are right, the city is a guess dressed as a fact.
**Action:** confirm the host city from the Open Source AI Week site.

### W6. Tech Homecoming (Ann Arbor) — URL slug is a year behind its content

`url: https://a2tech360.com/events/tech-homecoming-2025/` currently serves
"Tech Homecoming 2026". It works today, but the moment SPARK publishes a current-year
slug this record will point at a frozen old page while still reporting `confirmed`.
**Action:** repoint when a current-year slug appears.

---

## Checked and sound

### The two standing duplicate warnings — both legitimate

**Resolved. The duplicate check should be taught to stop flagging this shape.**

- **a2Tech360 (tech-week) vs Tech Homecoming (career-fair), Ann Arbor, both 2026-09-22.**
  Legitimate. a2tech360.com: "Registration is open for a2tech360 2026! **September 22 -
  October 2, 2026**" — an eleven-day Ann Arbor SPARK series whose own lineup lists eight
  signature events plus partner events across those dates. Tech Homecoming is one of
  them: its page reads "Career Fair **September 22, 2026** | 4 p.m. - 7 p.m. | free for
  job seekers | **Venue by 4M**", and it appears under a2tech360's "Signature Events"
  navigation. Container and contained, both separately attendable, both correctly
  recorded (a2Tech360 09-22 to 10-02 at "Multiple venues across Ann Arbor";
  Tech Homecoming 09-22, single day, Venue by 4M).

- **Maine Blue Economy Week (conference) vs Open Door Leadership Series (meetup-series),
  Portland, both 2026-09-30.** Legitimate, and not even a container/contained pair — two
  unrelated Roux Institute events that happen to share a morning. From the Roux events
  JSON-LD: Maine Blue Economy Week, `2026-09-30` to `2026-10-02`, at "Holiday Inn,
  Portland, ME"; and "Open Door with Glenn Prickett, Gulf of Maine Research Institute
  President & CEO", `2026-09-30T08:00` to `09:00`, at "Northeastern University's Roux
  Institute, 100 Fore Street, Portland". The series continues with Mary Allen Lindemann
  on 2026-10-28. Both records match their pages, venues included.

**Rule suggestion:** the duplicate check fires on name + city + start date + domain. Add
a suppression when the two rows have a different `type` **and** a different `venue`, or
when one row's date range strictly contains the other's. Both cases above satisfy both
tests.

### Rollovers verified as truthful

- **ElixirConf US (Chicago)**, `last_date: 2026-09-10`. elixirconf.com: "takes place on
  Sept 10-11, 2026, Chicago & online". Happened; no 2027 edition announced on the page.
  Rollover correct.
- **Billington CyberSecurity Summit (Washington)**, `last_date: 2026-09-08`.
  billingtoncybersummit.com: "September 8-10, 2026 | Walter E. Washington Convention
  Center | Washington, DC ... thank you to all our speakers, sponsors...". Happened; no
  2027 date published. Rollover correct.

### Script confirmations verified correct by hand

Date checked against the organiser and found right: Linux Foundation Member Summit
(Half Moon Bay, Feb 22-23 2027) · HPSF Conference (Montreal, Apr 12-16 2027) · MCP Dev
Summit Toronto (Oct 5-6 2026) · PyTorch Conference (San Jose, Oct 20-21 2026) ·
KubeCon + CloudNativeCon NA (Salt Lake City, Nov 9-12 2026) · Open Source Summit NA
(Vancouver, May 17-19 2027) · Meeting in the Millyard (Nashua — schema
`startdate 5/18/2027`, `enddate 5/20/2027`) · NC TECH Summit for Women in Tech
(Asheville, Sep 28-29, Renaissance Asheville Downtown) · NC TECH Awards Celebration
(Raleigh, Nov 16) · Forge Summit (North Little Rock, Oct 13-14 2026) · TAG Chairs Gala
(Atlanta, Thu Nov 19) · EWF Annual Conference (Nov 4-6 2026, Gaylord Rockies — the
organiser writes "Denver", the venue is physically in Aurora, so the stored city stands) ·
CHM Live (Mountain View, Wed Sep 23 2026, "In Conversation with Boris Cherny") ·
Tennessee Quantum Hackathon (Chattanooga, Nov 13 2026, Max Fuller Center) · Innovation
Depot Founders Round Table (Birmingham, Oct 22 2026) · CONNECT: Networking for
Entrepreneurs (Jackson, Oct 1 2026, Fertile Ground Beer Co.) · Product-Led Summit Toronto
(Nov 12-13 2026) · Product-Led Summit San Francisco (Sep 22-23 2026) · Digital Summit
Philadelphia (Sep 23-24), Atlanta (Oct 6-7), Raleigh (Nov 2-3) · Digital Okanagan
(Vernon, Sep 24 2026) · tech SAVannah Tech Tuesday (Oct 13 2026) · Buffalo Game Space
(Sep 24 2026, Tri-Main Center) · Victoria Tech Week (Sep 21 2026) · RedacteCON (Grand
Junction, Sep 19 2026) · Workplace Ninjas US (Scottsdale, Jan 11-13 2027).

Several of these were right for the wrong reason — the matched string belonged to a
neighbouring event or to markup. They do not need re-checking; the matcher does.

### Not reported as findings

- Gartner IT Symposium/Xpo, Gartner IAM Summit and the SAP pages serve 403 to scripts.
  Bot walls, not regressions.
- Event count is unchanged at 882 since `acb6e0f`; nothing added, nothing removed, so
  there is no coverage loss and no removal to justify.
