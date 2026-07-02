# 0012 — The regression suite is a catalogue of attacks, and it locks the harness

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

The harness is the audit's trust anchor, which makes the harness itself the most valuable thing to weaken. A well-meaning refactor that relaxes one check — or an agent "fixing" a hard failure by loosening the rule that fired — silently reopens a bypass that a past audit actually used. Happy-path tests don't defend against that; they check that good inputs pass, not that bad ones still fail.

## Decision

`run-tests.mjs` is an adversarial suite: every case is a way a past audit tried to look clean while hiding something — severity laundering, a critical merged into a benign survivor, junk evidence, a mis-binned IDOR, a chain built on a refuted finding, a skipped compliance duty, slop prose. Each case asserts the harness's exit code against a *bad* input (plus paired good inputs asserting the legitimate path still passes — the boundary cases matter as much: a high-severity interaction failure arriving via the UX lens must NOT be capped).

The consequence is structural: **weakening the harness flips a test.** Each case builds its inputs inline with `finding()`/`report()` helpers, writes them to a temp dir, spawns the real harness, and compares exit codes — no mocks, no internal imports.

The working discipline (see `.claude/skills/harness-dev/`): change the harness only attack-first. Write the bypass as a case, watch the current harness wrongly pass it, close the gap, watch the suite go green. Deleting or loosening an existing case is a red flag reviewers treat as an attempted bypass unless the PR argues otherwise explicitly.

## Consequences

- The harness can be refactored freely — behaviour is pinned by 42+ locked bypasses, not by its implementation.
- New checks arrive with their attack attached, so the suite grows monotonically with the threat catalogue; the test names double as a history of real failure modes.
- Suites like this only defend what someone thought to attack. Gaps live where no case exists (e.g. the chain-prose id regex missing digit-bearing prefixes — found and closed during the documentation pass that produced this record).

## Enforced by

- `skills/production-audit/scripts/run-tests.mjs` — the suite; exit 1 on any flip.
- `.claude/skills/harness-dev/SKILL.md` — the attack-first change discipline.
- `README.md` — "Weakening the harness flips a test" is a public claim about this repo.
