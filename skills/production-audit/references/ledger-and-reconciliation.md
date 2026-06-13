# The raw-findings ledger and reconciliation

This is the structural fix for the single worst failure this audit has had in practice: **raw findings getting summarised away between discovery and the report, so that real criticals silently vanished.** In a past run the merge/verify step compressed ~60 raw findings to ~45 and lost several criticals; the count only got corrected when someone re-read the raw subagent output by hand. Prose telling the agent "don't lose findings" did not prevent it. A ledger plus a reconciliation check does, because the count becomes arithmetic a script verifies.

## The principle: every finding has exactly one fate, recorded

From the moment a lens emits a finding, that finding's id exists for the rest of the run. It can only end in one of three states, and which one must be explicit:

- **reported** — it survived to the final report (possibly with its severity recalibrated).
- **merged** — it was a duplicate of another finding; the survivor records it in `dedup.merged_from`. The id is not deleted, it is absorbed.
- **dropped** — verification refuted it (false positive, unreachable, wrong). It appears in `report.dropped` with a reason.

A finding that is in none of these three is a **lost finding** — the failure mode this whole mechanism exists to make impossible. The harness flags any raw id with no disposition and any id with more than one.

## The ledger file: `raw-findings.jsonl`

As each lens runs (Stage 2), append every finding it produces to `raw-findings.jsonl`, one JSON object per line, conforming to `finding-schema.md`. Append-only: never edit or delete a line once written. This file is the ground truth of what was discovered, before any consolidation. It is written *as the lenses run*, not reconstructed afterward from memory or from a summarised hand-off — that reconstruction step is exactly where findings were lost before.

When subagents run the lenses, each subagent returns its findings as structured data (the schema), and the orchestrator appends them verbatim to the ledger. The orchestrator must not summarise, paraphrase, or "consolidate for brevity" on the way into the ledger. Consolidation is Stage 3's job and it operates *on* the ledger, recording its decisions as dispositions — it never silently shrinks the set.

## The report file: `report.json`

The final consolidated output (Stage 5) is written as `report.json` alongside the human-readable report, with:

```jsonc
{
  "scope": {
    "app": "...",
    "lenses_selected": ["code-audit", "scaling-audit", "data-privacy", ...],  // chosen in Stage 1
    "lenses_run": ["code-audit", "scaling-audit", ...],                        // actually executed
    "lenses_deferred": [],          // selected-but-not-yet-run (partial runs); every selected lens must be in run OR deferred
    "partial": false                // true if this is a partial/staged run
  },
  "stack_profile": { ... },         // from Stage 0, see stack-adaptation.md
  "coverage": { "files_total": N, "files_examined": M, "areas_total": A, "matrix": [ ... ] },  // see coverage-matrix.md
  "reconciliation": { "raw": N, "reported": R, "merged": G, "dropped": D },  // must satisfy R + G + D == N
  "dropped": [
    // a plain false positive needs only a substantive reason:
    { "id": "PERF-007", "reason": "the <img> is below the fold and lazy-loaded; not an LCP issue" },
    // dropping something that was critical/high in the ledger needs a refutation with real evidence:
    { "id": "SEC-007", "reason": "guard exists; false positive",
      "verification": { "status": "refuted", "evidence": "route.ts:22 — `if (uid !== session.uid) return 403`", "verifier_disagreed": true, "note": "ownership IS checked" } }
  ],
  "findings": [ /* the reported set, each a full schema record with verification filled in */ ],

  // required when any critical/high gating finding exists — sequenced fix plan
  "remediation_order": [
    { "id": "SEC-001", "reason": "fail-open cost control, currently bleeding; one-line fix" },
    { "id": "SEC-002", "reason": "deletion gap; needs test net first — after the one-liners" }
  ]
}
```

The harness reads `scope.lenses_selected`/`lenses_run`/`lenses_deferred` for the roll-call (a selected lens that is neither run nor deferred is a hard failure — a silently-skipped lens), and requires a refutation block to drop a finding that was critical/high in the ledger (you must *prove* a false positive, not just assert one).

The human-readable Markdown report is generated *from* this JSON, so the prose and the machine-checked data cannot diverge.

## Reconciliation: the arithmetic that must balance

Before the report is considered done, the identity must hold:

```
raw  ==  reported  +  merged  +  dropped
```

where:
- `raw` = number of lines in `raw-findings.jsonl`
- `reported` = number of objects in `report.findings`
- `merged` = number of distinct ids appearing across all `findings[].dedup.merged_from`
- `dropped` = number of objects in `report.dropped`

## Reconciliation freezes the ledger for chain synthesis

The reconciled finding set is the only valid input to chain construction. A finding that has been dropped (refuted by the verifier) or merged (absorbed into a survivor) is not a live finding — a chain built on it is built on a claim the audit no longer stands behind. The pipeline ordering enforces this:

1. Atomic lenses run (Stage 2) → `raw-findings.jsonl`
2. Merge cross-lens duplicates (Stage 3) → merged findings record `merged_from`
3. Adversarial verification (Stage 4) → false positives dropped, severities calibrated
4. **Freeze** — the reconciled set (reported + merged + dropped dispositions balanced) is now final
5. Synthesis chain construction (`adversary-emulation`) consumes **only** the reconciled, reported findings

A chain whose component references a dropped finding (a **refute-orphan**) must be re-synthesised without it — the underlying claim is gone, and the chain's severity may change. A chain whose component references a merged finding (a **merge-orphan**) must have that reference rewritten to the surviving parent id — the claim survives, but under a new id. The harness enforces both: any dangling chain reference (a `component_findings` id not in the reconciled reported set) blocks report finalisation, with a diagnostic naming whether the reference was dropped (re-synthesise) or merged (rewrite to survivor).

This is the internal twin of the public-artifact staleness principle: a downstream structure (a chain) that depends on an upstream fact (a finding) must be invalidated when that fact changes. The fix is the same shape in both directions — make the dependency explicit and re-validate on change.

Run the harness to check it:

```
node .claude/skills/production-audit/scripts/audit-check.mjs <audit-dir>
```

If it exits non-zero, the audit is **not done** — a finding was lost, a critical/high is unverified, or the counts do not add up. Fix the cause (find the missing disposition, verify or cap the finding) and re-run until it exits zero. The report is not delivered until the harness passes. This is non-negotiable: it is the entire reason the mechanism exists.

## Why this beats "be careful"

The old instruction was "merge and verify without losing findings." That is a request for vigilance, and vigilance fails — especially across a summarising hand-off between a subagent and the orchestrator, or across a context boundary. The ledger turns vigilance into bookkeeping, and the harness turns bookkeeping into a gate. You cannot accidentally lose a finding, because the finding's id is on disk and the script will name it.
