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
            └── none? ──────────────> done
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
Every run reads Luma's full listing around all 30 cities. Once a week, run
`npm run feeds:discover` instead of the feed step alone: it also searches Meetup and
Eventbrite in every city for new events and organisers to follow, and reads the Bevy
chapter sites (GDG, Startup Grind, CNCF…): ~45 minutes, mostly Eventbrite's enforced
pace, plus ~10–15 minutes for Bevy, whose robots.txt asks for 2 s between pages.
Read `data/feeds/last-run.json` afterwards — the organisers it registered and a sample of
what the relevance gate dropped — and retire any organiser that is not ours with a
`data/review/sources-<pass>.json` entry carrying `"tech": false`.

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
