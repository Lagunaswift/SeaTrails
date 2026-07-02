# 0010 — The compliance duty triggers on data class, not stated goal

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

Compliance passes are usually keyed off what the client asks for ("we want SOC 2"). But a legal data-protection duty — an impact assessment, a heightened lawful basis, children's-data duties — attaches to the *data* the moment it is processed, whether or not anyone asked about compliance. An audit that skips the compliance pass because "it wasn't a goal" ships a report that looks complete while missing an obligation the operator is already under.

## Decision

Stage 0's stack profile records `data_classes`. When a regulated class is present (matched by `REGULATED_CLASS_RE`: special-category, biometric, genetic, health, financial, children/minor, government-id, location), the compliance pass is **mandatory** — in scope by data class, not by stated goal — and `data-privacy` elevates to priority 1. SOC 2 *certification readiness* remains deferrable; the *duty* pass is not.

The harness enforces it: a regulated data class with `soc2-compliance` excluded as not-applicable, and no compliance coverage (the lens run, a `category: compliance` finding, or `scope.compliance_duty_in_scope: true`), is a hard failure.

The rule is framework-agnostic by design — it keys off the data class and leaves *which* statute applies (GDPR Art. 9, HIPAA, PCI-DSS, COPPA, CCPA/CPRA…) as a jurisdiction question; the renderer prints example frameworks with an explicit "confirm which applies by jurisdiction".

## Consequences

- "The client didn't ask" stops being a path to skipping a legal duty. Deferral of certification work stays cheap and honest.
- Severity calibration inherits the same signal: an auth gap on health data is not the same finding as the same gap on ordinary data.
- The audit stays out of the business of naming the governing statute definitively — it flags the duty and the candidate frameworks, which is what a code audit can honestly claim.
- Detection quality matters: a run that never populates `data_classes` never triggers the gate. That honesty rests on Stage 0 discipline (0001's boundary), not on the harness.

## Enforced by

- `skills/production-audit/scripts/audit-check.mjs` — `REGULATED_CLASS_RE`, `checkComplianceDuty`.
- `skills/production-audit/references/stack-adaptation.md` — the data-class table and detection signals.
- `skills/production-audit/scripts/render-report.mjs` — the regulated-class scope line and framework hints.
- `skills/production-audit/scripts/run-tests.mjs` — the three compliance-duty cases (excluded+uncovered fails; covered passes; ordinary data doesn't trigger).
