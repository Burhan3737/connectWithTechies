# agent/

Everything the agent side of the project touches. Kept apart from `scripts/` because
the two have different owners and different rights.

```
scripts/          the deterministic pipeline. Owns data/. Only the maintainer runs it.
agent/tools/      what agents call, and what replaces agents where possible.
data/review/      the contract surface: queue in, patches and confirmations out.
```

## The division of labour

**Agents are for discovery and judgement.** Finding events nobody has listed, working out
where an event actually lives on the web, deciding whether a page that disagrees with a
record is right or stale.

**Scripts are for maintenance.** Once an event is tagged with a URL, keeping its date
honest is a scrape, not a reasoning task. Paying an agent to read a page and conclude
"nothing changed" is the most expensive possible way to learn nothing — in one 22-row
agent pass, 21 rows came back confirmed-unchanged.

So the rule is: **an event gets researched by an agent once, and maintained by script
thereafter.** An agent should only see it again if the script cannot settle it.

Measured on this dataset: **83% of dated events confirm by script alone.** Agent work for
routine maintenance drops by roughly six times.

## Tools

| tool | what it does |
|---|---|
| `tools/verify-dates.mjs` | the workhorse. Confirms stored dates against the live page; hands over only what it cannot settle |
| `tools/fetch-page.mjs` | read a page as a browser would, and pull the date evidence out of it |
| `tools/check-links.mjs` | probe every event URL, report dead links and redirects |
| `tools/check-data.mjs` | dataset audit: coverage, near-duplicates, field gaps, date sanity |
| `tools/probe-extractors.mjs` | diagnostic: how much of the dataset is machine-readable |

### verify-dates

```bash
node agent/tools/verify-dates.mjs            # dry run over every dated event
node agent/tools/verify-dates.mjs --queue    # only what the ledger says is due
node agent/tools/verify-dates.mjs --write    # record confirmations and proposals
```

Four verdicts, and only one of them costs an agent:

| verdict | meaning | outcome |
|---|---|---|
| `confirmed` | the stored date is still on the page | ledger entry written, **no agent** |
| `moved` | the page publishes a different date | proposal written to `PROPOSED-moves.json` |
| `ambiguous` | page loads but says nothing readable | listed in `NEEDS-AGENT.tsv` |
| `unreadable` | captcha, 403, empty | listed in `NEEDS-AGENT.tsv` |

It **confirms** rather than **extracts**, which is why it works without structured data:
it only has to find a date it already knows, rendered any of the ways a site might print
it. Extraction is attempted only to explain a failure — and only JSON-LD is trusted
enough to propose a replacement.

**Moves are never applied automatically.** A script that rewrote dates on the strength of
one regex would be a worse failure than a stale date. `PROPOSED-moves.json` is reviewed,
then renamed into place.

### Why the judgement calls still need an agent

Buffalo Game Space runs two things: an in-person "Game Development Meeting" and an
online-only "Virtual game developer hangout". On one particular day only the virtual one
was on. A script taking the earliest date on the page would have sent someone across town
for a Zoom call. That distinction needs reading comprehension, which is exactly what the
17% is for.

## Running a pass

The full procedure lives in the `refresh-events` skill
(`.claude/skills/refresh-events/SKILL.md`). Short version:

```bash
npm run refresh     # build -> script-confirm what it can -> regenerate the queue
npm run stale       # see what is left for agents
```

Then dispatch agents against `data/review/NEEDS-AGENT.tsv` and the remaining queue, and
apply what comes back:

```bash
npm run apply       # dry-run first; read the reasons before trusting them
npm run build
npm run ledger      # merges the confirm-*.json files
npm test
```

## What an agent may write

Only two files per pass, both in `data/review/`:

- `confirm-<pass>.json` — one entry for **every** row attempted, whatever the outcome.
  This is what stops the next pass repeating the work.
- `<pass>-fixes.json` — patch operations, only for rows that were wrong.

Agents never edit `data/raw/`. `scripts/apply-patches.mjs` is the only thing that does,
and it records every change with its reason in `data/review/APPLIED.md`.
