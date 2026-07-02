# 0005 — "Verified" requires quoted code, and citations are checkable

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

The cheapest way for an audit to look rigorous is to mark findings `verified` without reading anything. "Checked the code" costs one token and proves nothing. Hollow verification is worse than none, because the label buys unearned trust.

## Decision

`verification.status: "verified"` is only valid with evidence that references actual code: the string must be at least **12 characters** after trimming AND contain a `file:line` reference or a backtick-quoted code span. This applies at **every severity** — a verified medium with empty evidence fails just like a critical. Evidence of `"x"` or `"checked"` is a build break.

Citations are further checkable against reality: with `--repo <path>`, the harness verifies every `location.file` and every `file:line` inside verified evidence — a cited file that doesn't exist, or a cited line past the end of the file, hard-fails. Fabricating `route.ts:142` in an 80-line file is caught mechanically.

For credential findings the evidence records the *type* of secret, never the value (`CONTRIBUTING.md`); the `.gitignore` blocks real audit output from ever being committed to this repo.

## Consequences

- Verification cannot be pencil-whipped. The 12-char + shape rule is a floor, not proof of understanding — but combined with `--repo` citation checks, inventing evidence is strictly harder than reading the code.
- Lenses must record evidence worth quoting at discovery time; that habit is what makes Stage 4 verification cheap.
- The rule is deliberately shape-based (regexes), so it can be gamed by a determined liar with plausible fake quotes — accepted, because `--repo` closes most of that and the alternative (a model judging evidence quality) reopens the argument problem (0002).

## Enforced by

- `skills/production-audit/scripts/audit-check.mjs` — `hasRealEvidence` (`EVIDENCE_LOC`, `EVIDENCE_CODE`, ≥12 chars), used by `checkSeverityVerification`; `checkEvidenceFiles` (`--repo` citation validation).
- `skills/production-audit/references/verification-and-severity.md` — the verification method the evidence records.
- `skills/production-audit/scripts/run-tests.mjs` — junk-evidence and empty-evidence cases.
