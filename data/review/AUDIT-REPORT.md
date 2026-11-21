# Audit report — 2026-11-21

**Verdict: 2 DISCREPANCIES** (0 blocking, 2 warnings)

Scope: nov21 cycle. Recheck passes nov21-c1/c2/c3 (60 dispatched rows plus the two Techstars
Demo Day rows), discovery passes nov21-t1/t2/t3 (RETURNING) and nov21-d1/d2 (city search),
which made 22 adds and 1 removal, 15 organiser retirements (sources-nov21-review.json) and the
new follows in sources-nov21-d1/d2.json.

Mechanical audit (agent/tools/audit-run.mjs): 0 blocking, 0 warnings. 1147 -> 1168 curated
events; the one removal carries a reason; 60/60 dispatched rows have a ledger entry; 22/22 new
or changed links resolve; no duplicates, malformed dates or feed-delisting spikes.

## Blocking

None.

## Warnings

- **Hack the Change (Calgary), HackED Beta (Edmonton), Immerse the Bay (Stanford), Opportunity
  Hack ASU Fall Hackathon (Tempe)**: these are RETURNING adds made as recurring-tbd when no next
  edition is announced. This goes against the curator brief and the oct31 TigerHacks ruling.
  The brief's RETURNING table (.claude/agents/curator.md) adds a row only when the "next
  edition [is] announced", with or without dates. On oct31 the orchestrator applied that rule to
  TigerHacks 2025: "described as annual but no 2026 edition announced (curator brief: add only
  when announced)" (discover-oct31-r1.json). Each of these four rows *is* the 2026 edition, and
  that edition has just run. Its page announces nothing after it:
  - hack-the-change-2026.devpost.com: "November 7-8th", University of Calgary.
  - hacked-beta-2026.devpost.com: "Friday, November 13 to Sunday, November 15, 2026".
  - immerse-the-bay-2026.devpost.com: "November 13-15, 2026".
  - ohack.dev/hack/fall-2026: "Nov 14-15".

  t1's declines were in exactly this position, and t1 applied the rule correctly: HackCamp
  ("November 7-8, 2026", no 2027), BADCamp ("November 12-13, 2026", nothing on 2027), MakeUC,
  sunhacks and Simply Cyber Con. **Ruling: t1 is right and the four t2/t3 adds are wrong.**

  This is a warning, not blocking. The four records are accurate: real annual events with a
  true last_date and no invented next_date. The problem is that one rule was applied two ways in
  the same cycle.

  The other contested adds are sound because the row's following edition was announced and
  has since been held. That is a stronger signal than an announcement:
  - MakeCU: the row is 2025; makecu.dev shows 2026, Nov 7-8.
  - Dream Team Engineering Designathon: the row is 2025; the 2026 edition ran Oct 3-4.
  - Swan Hacks: the row is Fall 2025; Spring 2026 ran May 2-3.
  - Hacktually: the row is 2025; the 2026 edition ran Oct 24.
  - DevFest Montreal: announces a 2027 edition for early November.
  - Cutie Hack: dated Nov 21, 2026.

  **Action:** revert the four add patches (nov21-t2: Hack the Change; nov21-t3: HackED Beta,
  Immerse the Bay, Opportunity Hack ASU Fall Hackathon). Record them as "unresolved" with a
  retry date, as t1 did.

  Note for the orchestrator: the DISCOVER section of the brief has no announcement gate. This
  cycle d1/d2 legitimately added 8 records of the same kind (beCamp, SCGMIS, HogHacks,
  Razorhack, Startup Crawl, ProfHacks, Florida Startup Summit, AI Tinkerers Fort Wayne), and
  TigerHacks itself reached the data through nov17-d2. If the gate is not wanted, amend the
  RETURNING table in curator.md instead. In that case keep the four adds and add t1's five.
  Either way, the rule should be applied the same way in both sections.

- **Single-institution "invite-only" hackathons (ruling) / Analytics for Good Hackathon
  (Minneapolis)**: t2 and t3 rejected hackathons that only one school's enrolled students may
  enter. **Ruling: the rejections are right.** The directory is for events a reader can
  physically attend, and an event closed to everyone outside one school's enrolment is not one
  of them.

  The claims hold. Devpost shows "Invite only" next to institution-only eligibility:
  - KTPHacks 2: "Must be a student at Virginia Tech".
  - Grizzly Hacks VII: "GGC Students (Or those who have been approved)".

  Earlier passes rejected events on this ground at least 8 times: UD Honors CISC106,
  HackASU 2025, KU WiC Hack Days, VizQuest (UTD), Figma Make-a-thon Waterloo, KU IPC and the
  Fitch codeathons.

  Two gaps remain:
  1. The brief does not state the rule. Devpost's "Invite only" label is not the test by itself.
     Dream Team Engineering Designathon is "Invite only" for "Designathon attendees, college
     students only, US only", which means accepted applicants from any college. That is open,
     and t3 rightly kept it.
  2. One curated record breaks the rule. **Analytics for Good Hackathon (Minneapolis)** was
     added in oct31-d2. carlsonschool.umn.edu/conferences/agihackathon says "This event is open
     to undergraduate and graduate students from the University of Minnesota's Twin Cities and
     Duluth campuses". The same page also announces "January 29-30, 2027", while the record
     still shows recurring-tbd with next_date blank.

  **Action:**
  - Add a line to curator.md: an event open only to one institution's students or members is
    "rejected" as not publicly attendable; Devpost "Invite only" alone is not the test.
  - Remove Analytics for Good Hackathon under that rule. If the orchestrator decides to keep it
    instead, set next_date 2027-01-29 and next_date_end 2027-01-30, status upcoming.

## Checked and sound

- **Removal: Vibe Coding Con (Las Vegas).** vibecodingcon.ai 301s to ai-devcraft.com, which reads
  "the difficult decision has been made to cancel the 2026 Ai Dev Craft conference" for
  Oct 27-28, 2026, Red Rock Resort. The removal reason holds.
- **Large date moves, re-read on organiser pages:**
  - HLTH USA: "October 17 - 20, 2027 | The Venetian Expo Center"; the month change to October is right.
  - Florida Technology Summit: "November 18th, 2027 at the Hilton St. Petersburg Carillon Park".
  - Vermont Tech Jam: "October 23, 2027".
  - VGLX: "October 16 - 17, 2027 ... Hall 4, The International Centre, Mississauga".
  - Taste of IT: "Save the date for next year - November 10, 2027".
- **Confirmed rows sampled:**
  - MSPGeekCon: JSON-LD 2027-05-23/25.
  - Hacktech: JSON-LD 2027-02-26/28.
  - KCD Toronto: page still shows May 13, 2026, so it stays recurring-tbd.
  - Pittsburgh Tech 50 Awards: Tech50_2026_1 gives November 19, 2026, and no 2027 is listed.
  - Techstars Boston Demo Day: the timeline reads "Jun 03 2027 Demo Day". The proposed move to
    2027-03-08, which is the accelerator start, was rightly rejected.
- **New adds re-read:**
  - Oregon Cyber Resilience Summit: "October 6th, 2027", EMU, Eugene.
  - SCITDA Fall Conference: "September 27 - 28, 2027 - Columbia Marriott".
  - Tom Tom Innovation Summit: "April 22-23, 2027".
  - The four contested t2/t3 Devpost pages, for dates, venues and public eligibility.
  - t1's HackCamp and BADCamp pages: nothing about 2027.
- **No aggregator-sourced next dates** among the 22 adds. Oregon Cyber Resilience Summit took
  its last_date from infosec-conferences.com, but the organiser's page backs that edition and
  its next_date comes from the organiser.
- **No city changes** this cycle. Curated coverage only grew (+21 net).
- **Retirements:** all 15 organisers in sources-nov21-review.json are clearly non-tech by their
  own descriptions (walking club, indie-rock group, matchmaking, philosophy reading group, chess
  hall arts programming, PEO civil and structural talks, and so on). Only 3 feed events left
  with them.
- **Follows** in sources-nov21-d1/d2.json are in-person tech groups in the cities that lacked
  them (Charlottesville, Columbia SC, Eugene, NWA, Fort Wayne, Gainesville).
