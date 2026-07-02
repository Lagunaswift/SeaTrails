# 0003 — Append-only ledger + the reconciliation identity

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

The worst failure this audit has had was not a wrong finding — it was a *lost* one: findings discovered mid-run, then summarised away between discovery and report, taking real criticals with them. Loss happens silently in any pipeline where the working set is whatever the model is currently holding in its head.

## Decision

Every raw finding is appended to `raw-findings.jsonl` **as it is discovered** — one canonical-schema object per line, never summarised on the way in. The ledger is append-only: merge records the absorbed id in the survivor's `dedup.merged_from`, refutation records a drop with a reason; nothing is deleted or renumbered.

Every raw finding must end the run in exactly one recorded state — **reported, merged, or dropped** — and the report carries the arithmetic in `reconciliation`: `raw = reported + merged + dropped`. A finding with no disposition is a lost finding, and the harness fails the build.

## Consequences

- "What happened to SEC-014?" always has a checkable answer. Auditing the audit is a grep, not an interrogation.
- The ledger doubles as the input for the synthesis lenses (soc2-compliance reads it; adversary-emulation reads the reconciled set — see 0009).
- Dropping a false positive is legitimate and cheap — it just has to be *recorded* with a reason, which is the difference between verification and laundering (0006).
- The discipline cost is real: lenses must write findings out as they go rather than batching at the end. The orchestrator's Stage 2 instructions repeat this deliberately.

## Enforced by

- `skills/production-audit/references/ledger-and-reconciliation.md` — the contract.
- `skills/production-audit/scripts/audit-check.mjs` — `checkReconciliation` (identity arithmetic, per-id disposition, ids present in ledger).
- `skills/production-audit/scripts/run-tests.mjs` — the lost-finding and reconciliation cases.
