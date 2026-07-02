# 0009 — Chain synthesis consumes the reconciled set; re-narrated chains fold into their root cause

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

`adversary-emulation` builds attack chains out of atomic findings. Run it too early and its chains reference findings that verification later refutes or the merge stage absorbs — a chain built on a claim the audit no longer stands behind. Count its chains naively and the same defect appears twice: once as the atomic finding, once re-told as an attack path — "3 criticals" that a client discovers were really 2 defects, which dents the audit's honesty more than a missed finding would.

## Decision

Ordering: `adversary-emulation` runs **after Stage 4** — after merge and verification dispositions balance and the finding set is frozen — consuming only the reconciled, verified set, never the raw ledger. (`soc2-compliance`, the other synthesis lens, runs within Stage 2 off the ledger; only chain synthesis needs the frozen set.)

Reference integrity is machine-checked: every `chain.component_findings` id, every id named in chain prose (steps, issue, detection gap), and every `severity_basis` id must resolve to a *reported* finding. A reference to a dropped finding is a **refute-orphan** (re-synthesise the chain); to a merged-away finding, a **merge-orphan** (rewrite to the surviving id). Both hard-fail with a diagnostic saying which.

Counting: a chain whose weight rests entirely on one already-reported defect sets `chain.root_cause_finding` to that id. The renderer folds it into the root-cause finding's entry as supporting narrative and excludes it from the tier counts — the headline counts **distinct defects**, not findings. Only emergent chains (several distinct defects composing into an impact none has alone — `root_cause_finding: null`) stand as their own findings, and a chain's severity is its realised impact, not the max of its parts: three mediums that compose into full exfiltration is a critical. `severity_basis` records which constituent ids the severity rests on, so recomputation after a constituent changes is mechanical.

## Consequences

- Chains are always internally consistent with the report they ship in; the ledger keeps every record (no loss), while the counts stay honest.
- The pipeline gains a hard ordering constraint — chain synthesis cannot be parallelised with verification. Accepted: chains are cheap relative to the lens sweep.
- The emergent/re-narrated judgement call is the auditor's, but both wrong answers are visible: a fake "emergent" chain double-counts (caught by the reader), a wrong `root_cause_finding` reference hard-fails (caught by the harness).

## Enforced by

- `skills/production-audit/scripts/audit-check.mjs` — `checkChains` (component/prose/severity_basis/root-cause resolution, orphan diagnostics).
- `skills/production-audit/scripts/render-report.mjs` — chain collapse (`collapsedChainIds`, `attachmentsByRoot`), gating-set exclusion.
- `skills/production-audit/references/finding-schema.md` — the `chain` block and the emergent/re-narrated rule; `ledger-and-reconciliation.md` — the freeze.
- `skills/production-audit/scripts/run-tests.mjs` — dropped/merged/dangling-reference and root-cause cases.
