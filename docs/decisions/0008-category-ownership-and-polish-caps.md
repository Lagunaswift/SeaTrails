# 0008 — Lenses own categories; polish axes cap at medium, by consequence

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

Two hiding channels needed closing. First, **mis-binning**: a security IDOR filed under category `analytics` drops out of the security section and out of the reader's attention — the category field becomes a place to bury findings. Second, **dilution**: "your gradient is generic" sitting in the same tier as "users can exfiltrate health data" makes the report read as alarmist and buries the real gate under taste.

## Decision

Every lens owns an explicit set of categories it may file under (`LENS_CATEGORIES` in the harness); a finding whose category falls outside its lens's set is a hard failure. Prefixes are owned the same way (`LENS_PREFIXES`), so ids trace to lenses mechanically.

Two categories are **polish axes**: `design-aesthetic` (purely visual — from frontend-design via code-audit's UI/UX pass) and `content` (user-facing copy quality — from anti-slop-writing). Both are hard-capped at medium and render in their own "Design & copy quality" section, never in the readiness tiers.

The cap is deliberately **narrow — by consequence, not by lens**. An interaction failure that arrives through the UX lens (missing error state → blank screen, no-confirm destructive delete, double-submit, keyboard trap) is categorised `frontend` or `accessibility` and keeps its real severity. Copy that causes a real failure (misleading legal disclaimer, instructions that lose data) is categorised `compliance`/`correctness` and keeps its severity. Only "worst case: it looks or reads bad" is a polish finding. The regression suite locks both directions: polish-at-high fails, AND a high-severity interaction failure via the UX lens is *not* capped.

## Consequences

- Hiding a finding by re-categorising it now requires choosing between two hard failures (wrong category for the lens, or wrong severity for the category).
- The readiness tiers count things that break, lose, or expose; taste lives in its own section with its own ceiling. Both still get reported — the cap is a placement rule, not a deletion.
- Adding a lens means declaring its category ownership in the harness, not just in prose — see `.claude/skills/add-lens/`.
- The boundary ("is this cosmetic or consequential?") demands judgement; the docs repeat the test — *when in doubt, it is not design-aesthetic* — because the failure mode of over-capping is worse than the failure mode of under-capping.

## Enforced by

- `skills/production-audit/scripts/audit-check.mjs` — `LENS_CATEGORIES`, `LENS_PREFIXES`, `checkSchema` (ownership), `checkSeverityVerification` (polish caps).
- `skills/production-audit/references/finding-schema.md` — the narrow-cap contract for both axes.
- `skills/production-audit/scripts/render-report.mjs` — the `POLISH` set routes polish findings to their own section.
- `skills/production-audit/scripts/run-tests.mjs` — wrong-category, polish-at-high, and the not-capped interaction-failure boundary cases.
