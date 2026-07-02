# 0006 — Severity can only move with a recorded reason

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

Severity is where an audit lies most profitably. A critical relabelled "low" in the final report looks like diligence, reads like calibration, and hides the one thing the client needed to know. The same laundering happens through merging (absorb the critical into a benign survivor) and through stalling ("keeping as high pending verification" — shipped unverified).

## Decision

Severity movement is legal only along recorded paths:

- **Downgrade** — a reported severity below the ledger severity for the same id requires `verification.verifier_disagreed: true` plus a written `note` explaining the calibration. Silent relabelling fails.
- **Merge inheritance** — a survivor's severity may not be lower than any finding merged into it; a critical absorbed into a low survivor either lifts the survivor or breaks the build.
- **The unverified cap** — no finding ships at critical/high unless `verification.status` is `verified` (with real evidence) or the finding is explicitly `capped` — and a capped finding may not *remain* at critical/high; capping means capping. "High, pending verification" is not a state the report can express.
- **Late arrivals** — a finding `added_post_verification` cannot sit at critical/high without being verified; surfacing something after Stage 4 doesn't skip the bar.

Severity itself is ranked by likely damage, not category alarm (`CONTRIBUTING.md`), and Stage 4 re-examines every critical/high adversarially — trying to disprove it — before it can carry those labels.

## Consequences

- The audit can still be *wrong* about severity, but it cannot be *quiet* about changing it; every movement leaves a diff between ledger and report that carries its own justification.
- Honest downgrades are cheap (one flag, one sentence), so the rule doesn't push toward inflated severities.
- Verification pressure concentrates exactly where it pays: the critical/high set, which is also the report's headline (0013).

## Enforced by

- `skills/production-audit/scripts/audit-check.mjs` — `checkSeverityLaundering` (downgrades, merge inheritance), `checkSeverityVerification` (unverified/capped rules), `checkPostVerification`.
- `skills/production-audit/references/verification-and-severity.md` — the verification method and severity scale.
- `skills/production-audit/scripts/run-tests.mjs` — laundering, merged-critical, capped-at-critical, legit-downgrade cases.
