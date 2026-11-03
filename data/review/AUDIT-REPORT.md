# Audit report — 2026-11-03 (cycle nov02, iteration 2)

**Verdict: CLEAN**

Re-audit after the orchestrator applied `data/review/nov02-audit-fixes.json`, the
relevance.mjs Massachusetts change (W3) and two place-override drops (W4), then rebuilt.
Mechanical audit: 0 blocking, 0 warnings. 961 -> 998 curated events (38 added, 1 gone:
Salt Lake City Day of Data, which has a recorded reason). 60/60 dispatched rows have a
ledger entry. 39/39 new or changed links resolve.

## Blocking

None.

## Warnings

None.

## Checked and sound

- **2026-11-03-i1-B1 fixed.** The review-additions-2 "Salt Lake City Day of Data" is gone
  from `data/events.json`. One Salt Lake City record is left: "Day of Data" (discovered),
  Neumont University, last 2026-09-19, source utahgeekevents.com. The other Day of Data
  cities are unchanged.
- **2026-11-03-i1-B2 fixed.** us-west "SF Tech Week" now has next 2027-10-04..10, last
  2026-10-05, status upcoming. The build has merged it again: there is one curated
  tech-week.com record for San Francisco ("Tech Week San Francisco", 2027-10-04, upcoming),
  and no recurring-tbd duplicate.
- **2026-11-03-i1-W1 fixed.** Pacific Northwest Software Symposium (Redmond): source and url
  are https://nofluffjuststuff.com/seattle, month March, 2027-03-18..19.
- **2026-11-03-i1-W2 fixed.** VCF Montreal: the description now says Saint-Lambert, on
  Montreal's South Shore. This matches the city and the venue (Champlain College
  Saint-Lambert).
- **2026-11-03-i1-W3 fixed.** "AI Brain Fry ... BOSTON/MASS" (eventbrite:1991736086250)
  is admitted again ("title: ai"). The selftest has Boston/Mass, "Boston, Mass." and a
  church-Mass negative case, and 224/224 feed checks pass. Side note settled: the
  Eventbrite page itself gives the venue as 1650 Market St, Philadelphia, PA. City
  Philadelphia is what the page says, and the title's BOSTON/MASS is the organiser's own
  label. Its audience is HR and talent acquisition, so it is borderline tech. The gate
  admits an "ai" title by design, so this is not raised as a finding.
- **2026-11-03-i1-W4 fixed.** meetup:317200430 (Oak Park FIX IT CAFE) and
  luma:evt-e4CiRHKg22Jg0BI (Founder-led Branding) are dropped in place-overrides.json and
  are absent from the build.
- **The W3 change admitted nothing non-tech:**
  - Of the built feed records, only the Brain Fry record contains the
    `<place>/mass` or `<place>, mass` pattern.
  - Across all 5,693 cached feed responses, 25 contain it. Apart from Brain Fry, the hits
    are MassTLC's LinkedIn handle, "Mass College of Art" in a speaker bio, "mass
    spectrometry" and a Mass General history URL. None of these became a newly admitted
    record. The six MassTLC/"Mass" organiser events in the feed were admitted earlier as
    a registered tech organiser and were first seen on 2026-10-07 or 2026-10-28.
  - Probes: "Healing Service/Mass", "Latin Mass, Boston", "Vigil, Mass and Reception",
    "Easter Sunday, Mass & Brunch" and "Prayer/Mass for Tech Workers" are all still
    rejected.
- **Re-judged the keyword-admitted feed records against the current gate.** All 4,022
  records were run through the current judge and the HEAD (oct31) judge:
  - 13 are admitted now but would not be at HEAD. All 13 come from the earlier
    hyphen/slash split or the new 'data center' term. None comes from W3.
  - All 13 are tech or tech-community events: Claude AI intro, Per Scholas IT Data Center
    Technician graduation, /dev/color LA and NYC year-end socials, dev/ai/nyc
    (Automattic), Ex-Google Security & IT Leaders, the Stanford data-center air-defence
    talk, and AI-themed leadership, revenue, film and career sessions. The latter are
    borderline but have a real AI subject.
  - 0 records kept by HEAD are dropped by the current gate.
- Still-open deferred items from earlier cycles (Tech Week non-tech socials, Venture
  Garden, city spelling splits) were not touched by this run and are not re-raised.
