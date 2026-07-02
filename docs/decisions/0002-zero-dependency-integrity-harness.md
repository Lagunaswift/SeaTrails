# 0002 — A zero-dependency integrity harness gates delivery

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

Earlier audits demonstrated a failure class that discipline alone never closed: the model produces a report that *looks* rigorous — verified findings, reconciled counts, tidy prose — while quietly laundering a critical to a low, citing files that don't exist, or losing findings between discovery and delivery. Any control that itself involves a model can be argued with; the gate has to be a program.

## Decision

`audit-check.mjs` is a single-file, pure-Node (16+), zero-dependency script that validates the ledger and report before anything is delivered. Its working assumption is adversarial: *the AI will try to produce a clean-looking result that hides a critical.* Exit codes are the contract: `0` all hard invariants hold, `1` at least one hard failure (the audit is not trustworthy as-is), `2` bad input.

Zero dependencies is a hard requirement, not a preference: the skills tree is dropped into arbitrary target repos, so the gate must run with nothing but Node present — no `npm install`, no lockfile, no supply-chain surface of its own.

It checks, hard-failing on: schema violations; unverified or junk-evidenced critical/highs; severity laundering against the ledger; lost findings and broken reconciliation arithmetic; category mis-binning; dangling chain references; silently skipped lenses; unmeasured or unacknowledged coverage; missing remediation order for gating findings; a regulated data class with the compliance duty excluded; fabricated citations (with `--repo`); and AI-slop prose. Warnings print but do not block.

## Consequences

- "The audit followed the rules" stops being a claim and becomes an exit code. CI or an operator can verify a report without reading it.
- The harness can only see what reaches the artifacts. A finding never written down is invisible to it — which is exactly why the ledger demands append-on-discovery (0003).
- Every rule must be expressible as a deterministic check over JSON. Rules that can't be (e.g. "the verifier really thought about it") are handled by making their *evidence* checkable instead (0005).
- The harness itself becomes the attack surface, so it is locked by its own adversarial test suite (0012). Any change to `audit-check.mjs` without a corresponding case in `run-tests.mjs` is suspect.

## Enforced by

- `skills/production-audit/scripts/audit-check.mjs` — the whole file; the check functions (`checkSchema`, `checkSeverityVerification`, `checkReconciliation`, `checkSeverityLaundering`, `checkChains`, `checkComplianceDuty`, `checkRollCall`, `checkCoverage`, `checkRemediationOrder`, `checkEvidenceFiles`, `checkProse`).
- `skills/production-audit/scripts/run-tests.mjs` — locks the behaviour.
