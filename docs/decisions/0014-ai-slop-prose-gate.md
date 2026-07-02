# 0014 — Deterministic slop regexes gate the report's own prose

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

The audit sells judgement, and judgement is read through prose. A report that says an app "delves into a rich tapestry of game-changing security posture" has told the client, before any finding is weighed, that a model wrote it on autopilot — and the findings inherit that discount. The suite even ships a lens (`anti-slop-writing`) that flags this in *other people's* copy; shipping it in our own deliverable would be the joke writing itself.

## Decision

The harness scans the report's prose surfaces — `summary`, every finding's title/issue/consequence/fix, every dropped reason — against two fixed lists: **50 hard-fail patterns** for unambiguous AI writing ("delve", "game-changer", "in conclusion", "studies show", "a testament to", "rich tapestry", …) and **10 warn patterns** for borderline terms ("leverage", "seamless", "robust", "holistic", …). Hard matches fail the build. Plain deterministic regexes, no model in the loop — the same reasoning as 0002: a model judging slop can be argued with; a regex cannot.

`anti-slop-writing` plays both roles by design: as a lens it audits the target app's copy (`category: content`, capped — 0008); as a standard it governs the audit's own report, with the regex lists as its mechanical floor.

## Consequences

- The worst tells are structurally impossible in a delivered report; the warn list nudges without blocking legitimate technical uses ("robust" is sometimes just the word).
- A fixed list catches only what it lists — it is a floor, not a writing standard; the full standard lives in `anti-slop-writing/SKILL.md` and still depends on the writing agent. New tells get added as they are noticed, with regression cases.
- False positives are possible (a finding quoting the *target's* sloppy copy could trip the gate); accepted — the evidence field can paraphrase, and the trade is worth it.
- Repo prose (docs like this one) is held to the same standard socially, though only report artifacts are machine-gated.

## Enforced by

- `skills/production-audit/scripts/audit-check.mjs` — `SLOP_HARD` (50), `SLOP_WARN` (10), `checkProse`.
- `skills/anti-slop-writing/SKILL.md` — the full writing standard the lists are distilled from.
- `skills/production-audit/scripts/run-tests.mjs` — the four prose cases ("delve", "game-changer", "in conclusion" fail; clean technical language passes).
