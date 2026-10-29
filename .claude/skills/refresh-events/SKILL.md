---
name: refresh-events
description: Run the event-data refresh cycle as orchestrator — script-confirm what can be confirmed, dispatch curator agents for the rest, have an auditor check their work, and loop until the audit is clean or three iterations are spent. Use when the user asks to refresh, re-verify, update or audit the event data, or when `npm run stale` shows a queue worth working.
---

# Refreshing the event data

You are the **orchestrator**. You dispatch, you read reports, you decide whether to go
again. You do **not** do the research yourself and you do **not** form your own opinion
about whether the data is right — that is what the auditor is for, and duplicating it
just gives you a second opinion you have no way to adjudicate.

Three roles:

| role | what it does | where it lives |
|---|---|---|
| **orchestrator** (you) | runs the cycle, decides whether to loop | this skill |
| **curator** | researches and updates: dates, links, new events, retirements | `.claude/agents/curator.md` |
| **auditor** | independently checks the curator's output, reports discrepancies | `.claude/agents/auditor.md` |

## The cycle

```
npm run refresh                script settles ~86% of dated events, no agent
  ↓                            (+ feeds:discover when its health says it is due)
read the run's health          failures, drops, organisers it let in
  ↓
snapshot the queue             so the auditor knows what was dispatched
  ↓
dispatch curator(s)            in parallel, one per chunk
  ↓
apply their patches, rebuild
  ↓
dispatch auditor               reads AUDIT.json + spot-checks judgement
  ↓
YOU decide  ─── blocking findings? ──> hand the report back to a curator, go again
            └── none? ──────────────> done: report; publish only when asked
```

**Stop after three iterations regardless.** If it is not clean by then, report what
remains rather than burning another cycle — a third failure usually means the problem
needs a person, not another pass.

---

## Step 1 — let the script do what it can

**Do not dispatch anyone before this.** Around 86% of dated events confirm without an
agent, and paying one to read a page and conclude "nothing changed" is the most expensive
way to learn nothing.

```bash
npm run refresh
```

That first re-reads the feed (`scripts/feeds/run.mjs`: every registered organiser plus
MLH, Devpost, confs.tech, developers.events, Hack Club, Guild.host and Localist — one-off
events, script-maintained, never dispatched), then
runs the build (rollover), then `agent/tools/verify-dates.mjs --write`, then the ledger.
Every run reads Luma's full listing around every discovery city in
`data/feeds/registry.json`.

**Discovery is weekly, and the run tells you when it is due.** `npm run feeds:discover`
does the feed step plus Meetup and Eventbrite city searches (the only way their new
organisers are found) and the Bevy chapter sites (GDG, Startup Grind, CNCF…): ~45
minutes, mostly Eventbrite's enforced pace, plus ~10–15 minutes for Bevy, whose
robots.txt asks for 2 s between pages. Run it after `npm run refresh` when the run's
health section says discovery is overdue; the Luma pages refresh just fetched are
cached for 6 hours, so it does not read them again. Then run
`node agent/tools/verify-dates.mjs --write && node scripts/ledger.mjs` once more, so the
ledger reflects the final data.

**Read the run's health before using its output.** The feed ends with a `Health`
section, judged against `data/feeds/run-history.json` (tracked; every full run appends
to it): discovery overdue, a source down more than 30% on the last comparable run, and
how many sources failed. A drop with failures behind it is a partial read — re-run those
cities with `--city=` before publishing, never publish over it. A drop with nothing failed
is usually real (fewer events listed); say so in the report. `data/feeds/last-run.json`
lists the failures.

**Then review what the gate let in and kept out**, from `data/feeds/last-run.json`:

- `newOrganisers` — on a discovery run, often hundreds. Most are plainly ours. Retire
  the rest with a `data/review/sources-<pass>.json` entry carrying `"tech": false` and a
  reason, after looking at the events each brought in. Watch for the two ways
  non-tech organisers get in: a one-word description match ("investor",
  "engineering", "code") and a two-event track record that happened to read as tech.
  And watch for **templated networks** — the same rotating titles hosted by unrelated
  clubs across cities ("AI Store on Autopilot" at a bowling league, a curling crew, a
  latte-art class). Search `data/raw/feed.json` for the titles to find every host, not
  just the new ones, and retire them all; the network moves to fresh hosts, so check
  for it on every discovery run.
- `samples.dropped` — a sample of what the gate rejected. Mostly right (yoga,
  potlucks), but look for real tech events in it ("Concord Ruby Early Birds", a build
  competition with cash prizes) and follow their organisers with a `sources-*.json`
  entry carrying `"tech": true`. It is a sample of a few hundred, so this is a spot
  check, not a sweep.

Retirements and follows take effect on the next feed run. Re-run the feed (from cache,
minutes) before publishing so they are in the output.

The curated half leaves:

- ledger confirmations for everything it settled — those events are done
- `data/review/PROPOSED-moves.json` — dates the page has changed. **Review these
  yourself**; the script proposes, it never applies
- `data/review/NEEDS-AGENT.tsv` — only what it could not settle

## Step 2 — snapshot, then dispatch curators

```bash
node scripts/ledger.mjs --limit 60          # trim the queue to the most urgent slice
node agent/tools/snapshot-dispatch.mjs      # record what is about to be handed over
```

The snapshot matters: the queue regenerates after every run, so without it the auditor
cannot tell "the curator skipped this row" from "the curator was never given it", and
will report the former.

Split the working file into chunks of ~25 rows and dispatch one `curator` per chunk in
parallel. Tell each its chunk path and a distinct pass name. The curator definition
carries everything else — do not rewrite its brief from memory, that is how hard-won
detail gets lost.

Queue reasons, in the order they are worked:

| reason | meaning |
|---|---|
| `never` | a new record nobody has checked |
| `blocked` | a previous pass could not read the page |
| `regroup` | a weekly or monthly group showing no next date — **wrong on the page today** |
| `imminent` | coming up, and the check is stale relative to how close it is |
| `rolled` | an annual edition ran; the next one is far off |
| `window` | undated, and its usual month is close enough that dates get announced |
| `aged` | 90 days for a dated event, 180 for a recurring group |

## Step 2b — look for what we don't have

Steps 1 and 2 only ever re-check what is already held. Nothing in them finds an event we
have never heard of — Hack Canada 2027 was on no feed and in no record. This step sends
curators looking, with a **discovery brief** instead of a queue chunk.

```bash
npm run returning        # weekly: last year's events not yet back -> data/review/RETURNING.tsv
npm run discover:plan    # every cycle: the cities to search -> data/review/DISCOVER.tsv
```

`npm run returning` reads four history datasets over the network (about 5 minutes — a
live run took 4m42s, most of it Devpost's ended listing paged politely); run it once a
week, not every cycle. `discover:plan` is local and instant: it picks ~10 cities
(never-searched feed-registry cities first, then other never-searched ones, then those searched
longest ago) and lists the event types we hold none of there.

**Events and organisers people report** go in `data/review/REPORTED.tsv` (reported_on,
what, url, note, status, outcome) — whenever someone says "you missed this", add a row
then, not at the next cycle. Every cycle, hand the `open` rows to one curator as a
discovery brief. When its `discover-<pass>.json` comes back, set each row's `status` to
its verdict and `outcome` to the reason. A reason that names a gap in a feed (a platform
we do not read, titles the gate rejects) is worth fixing in the feed, not just the row.

Chunk `RETURNING.tsv` at ~25 rows and `DISCOVER.tsv` at ~5 cities, and dispatch one
`curator` per chunk in parallel with the recheck curators, each with its own distinct pass
name. Say plainly that it is a **discovery brief** and give the chunk path; the curator
definition says what to do with one. Every row must come back in
`data/review/discover-<pass>.json`.

**Never give any pass a name starting with `confirm-`, `sources-` or `discover-`.** Those
prefixes already mean something in `data/review/`: the patcher skips `confirm-*.json` and
`sources-*.json` by name, so a pass called `sources-x` would have its `sources-x-fixes.json`
silently never applied; and `returning.mjs` and `discovery-plan.mjs` read every
`discover-*.json` as a discovery log, so a pass called `discover-x` would have its
`discover-x-fixes.json` read as one.

New events come back as `add` patches, which `npm run apply` writes to
`data/raw/discovered.json`. Nothing is added unverified: the ledger queues each new record
as `never`, so the next cycle's curators re-check it against the organiser's page.

After applying (Step 3), stamp the cities as searched so they are not offered again
next cycle:

```bash
node agent/tools/discovery-plan.mjs --record    # updates data/review/discovery-log.json (tracked)
```

## Step 3 — apply

```bash
npm run apply -- --dry-run   # read the reasons before trusting them
npm run apply
npm run build:data           # rebuild data/events.json
npm run ledger               # merges the confirm-*.json files
npm test                     # feed parsers + app unit tests
```

Read removals yourself before applying. Curators have been right about squatted domains
and dead conferences, but a removal is the one operation that loses data.

## Step 4 — dispatch the auditor

One `auditor`, after the rebuild. It runs `agent/tools/audit-run.mjs` for everything
countable, then spot-checks the judgement calls, and writes
`data/review/AUDIT-REPORT.md` plus `data/review/AUDIT-FINDINGS.json`.

**Log every audit run**, clean ones included — a clean run is the data point that says
audits could be less frequent:

```bash
node agent/tools/audit-log.mjs add      # records the run and its findings in the audit log
```

## Keeping the audit log

`data/review/audit-log.json` is the permanent record of what auditors found and what was
done about it; `docs/AUDIT-LOG.md` is generated from it. When you fix, decline or postpone
a finding — in this cycle or a later one — record it:

```bash
node agent/tools/audit-log.mjs resolve <finding-id> fixed "<what changed, which file/patch>"
node agent/tools/audit-log.mjs resolve <finding-id> wont-fix "<why>"
node agent/tools/audit-log.mjs resolve <finding-id> deferred "<waiting on what>"
node agent/tools/audit-log.mjs open     # what is still outstanding
```

A finding fixed by a re-audit's clean result is still resolved explicitly — the log should
never need to be inferred. Open findings from earlier cycles are part of each new cycle:
work them before the queue.

## Step 5 — decide

Read only the auditor's counts. Do not re-litigate its findings.

| auditor says | you do |
|---|---|
| 0 blocking | **done.** Report and stop, even with warnings outstanding |
| 1–3 blocking | usually **apply them yourself** — see below — then re-audit |
| 4+ blocking, or findings needing research | hand the report to curators, then re-audit |
| iteration 3 reached | **stop.** Report what is still open and why |

**A finding that arrives with its fix does not need a curator.** The auditor has already
read the page and verified the correction; dispatching an agent to transcribe an audit
report into a patch file is exactly the waste this whole design exists to avoid. Write
the patch yourself, cite the audit as the reason, and re-audit.

Send it back to a curator when the fix genuinely needs work the auditor did not do —
a date nobody has found yet, a replacement URL, a judgement about whether an event is
dead. Then the curator's input is the audit report itself, not the queue: it is fixing
named problems, not re-verifying. Give it the report path and say so explicitly.

**Fix the cause, not just the instance.** If a finding reveals a gap in the curator brief
or a bug in the tooling, change that too — otherwise the next run reproduces it. Iteration
1 of the first real cycle produced two: a curator overwriting an elapsed `next_date` and
destroying the rollover's input, and this audit script reporting every city correction as
a removal plus a skipped row.

Between iterations, re-run `node agent/tools/snapshot-dispatch.mjs` only if you are
dispatching from the queue again — a fix-up pass is scoped by the report instead.

## Step 6 — report

Say plainly: how many iterations it took, what the curator changed, what the auditor
caught, and what is still open (`audit-log.mjs open`; every finding should be logged and
either resolved or visibly open in `docs/AUDIT-LOG.md`). If you stopped at three iterations with findings
outstanding, lead with that — it is the most important thing in the report.

Include the feed's health warnings and what you did about each, the organisers you
retired or followed, and the before/after event counts — take those from the table at
the top of `data/review/CHANGES.md` (added, removed by reason, re-dated, curated and
feed apart), which every build rewrites against the last publish.

`data/review/refresh-history.json` keeps the same counts, one row per publish, so the
trend over many refreshes is readable. Nothing to do: every build replaces the row for
the commit it compares against, and the publish commit fixes it.

## Step 7 — publish, when asked

**A push to `main` is a deploy.** `.github/workflows/deploy.yml` runs the tests and
publishes `data/events.json` to GitHub Pages on every push, so committing the data and
pushing it is the whole release — there is no separate step, and no undo short of
another push. So:

- Do not commit or push as the end of a cycle. Report, and wait for the person to ask.
- Before committing, check what is staged — `git status --short` — and that nothing
  secret or local is in it (`.env`, tokens, `data/.cache/`, logs). `data/feeds/last-run.json`
  is local and ignored; `data/feeds/run-history.json`, `data/review/CHANGES.md` and
  `data/review/refresh-history.json` are tracked and belong in the commit. Run
  `npm run build:data` last before committing, so both describe the data being published.
- Commit as the configured git user, with no assistant attribution, then push and follow
  the run to the end: it is not published until both jobs (tests, publish) have passed.
