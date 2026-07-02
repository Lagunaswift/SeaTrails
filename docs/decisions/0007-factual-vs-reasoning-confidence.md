# 0007 — Findings are typed factual or reasoning, and trusted differently

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

"There is no auth check on this route" and "an attacker can therefore exhaust your read quota and run up the bill" are different kinds of claim. The first is locational and grep-checkable; the second is an inference stacked on it, and inferences are where confident-sounding audits are most often wrong. A report that presents both with the same authority teaches the reader to discount all of it.

## Decision

Every finding carries `confidence_type: "factual" | "reasoning"`. Factual findings are claims about what the code contains; if the citation is right, the finding is right. Reasoning findings are consequence chains; the verifier's job on them is to attack the *inference*, not just the citation.

The harness does not auto-cap reasoning findings. Instead: a reasoning-typed critical/high **must** carry a verification note (hard fail without one), the harness warns on every one, and the rendered report labels them visibly — in the gating count ("N of these are reasoning-typed inferences to confirm against the code") and per-finding ("⚠ reasoning finding — confirm the inference against the code before acting").

## Consequences

- The reader can tell at a glance which criticals are observations and which are arguments, and budget their scepticism accordingly.
- Reasoning findings stay in the report at full severity when they survive adversarial verification — the type is a trust label, not a demotion. Auto-capping them would have hidden real attack chains behind a formality.
- Lenses must decide the type at discovery time, which forces the useful habit of separating "what I saw" from "what I concluded".

## Enforced by

- `skills/production-audit/references/finding-schema.md` — the `confidence_type` contract.
- `skills/production-audit/scripts/audit-check.mjs` — `checkSeverityVerification` (note required on reasoning crit/high; warning emitted).
- `skills/production-audit/scripts/render-report.mjs` — reasoning counts in "By the numbers"; the per-finding confirmation warning.
