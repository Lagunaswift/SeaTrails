# Contributing to seatrial

A lens reads code for one concern. A check is one concrete pattern a lens looks for.
Both follow a fixed shape so the output stays consistent and the findings stay
trustworthy.

## Adding a check

1. Copy an existing check as a starting point.
2. Fill in the sections below. The detection section is the one that matters — be
   precise enough that two people would flag the same lines.
3. Open a PR. One check per PR.

A check must have:

- **id** — short, stable, kebab-case.
- **severity** — critical | high | medium.
- **What it is** — one paragraph. Why it bites, why fast-built apps miss it.
- **How to detect** — concrete. Patterns, file types, framework tells. Say what counts
  as a hit and what doesn't. A check that fires on everything teaches people to ignore
  the report.
- **Evidence to record** — the exact thing to quote so the finding is checkable. For
  credential checks, the *type*, never the value.
- **The fix** — one line of direction.

## Adding a lens

A lens is a larger unit — a concern with its own set of checks and its own pass logic.
Open an issue first so we can agree the scope before you build it.

## Severity, honestly

- **critical** — exploitable now, loses data, or burns money with no ceiling.
- **high** — exploitable with mild effort, or a control that should exist and doesn't.
- **medium** — weakens a defence; not directly exploitable alone.

Rank by likely damage, not category alarm.

## What gets merged

Precise, common, damaging checks. If the detection is vague, I'll ask you to tighten it
first — false positives are what kill a tool like this.
