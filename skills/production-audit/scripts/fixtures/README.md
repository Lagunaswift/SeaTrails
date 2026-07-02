# Fixtures — the worked examples

Two complete audit directories, each a `raw-findings.jsonl` ledger paired with its `report.json`. They are run through the real harness by `run-tests.mjs` (the last two cases), so they cannot rot: change the harness or a fixture and the suite tells you.

Run them yourself from the repo the suite is installed in:

```bash
node .claude/skills/production-audit/scripts/audit-check.mjs .claude/skills/production-audit/scripts/fixtures/pass   # exit 0
node .claude/skills/production-audit/scripts/audit-check.mjs .claude/skills/production-audit/scripts/fixtures/fail   # exit 1
```

## `pass/` — a valid audit to imitate

A small health-tracking app, six raw findings, everything reconciled. It demonstrates, in one place:

- **merge** — SEC-002 (the privacy lens's sighting of the same IDOR) absorbed into SEC-001, recorded in `dedup.merged_from`; `raw 6 = reported 5 + merged 1 + dropped 0`.
- **verification** — both highs verified with quoted code; the low and the copy finding honestly `unverified` (allowed below high).
- **a re-narrated chain** — CHAIN-001 carries `root_cause_finding: "SEC-001"`: same defect told as an attack path, folded into SEC-001 by the renderer, not a second high. The reasoning-typed high draws the harness's confirm-before-acting warning — expected, not a failure.
- **the compliance duty** — `data_classes` includes special-category health data, so soc2-compliance runs and SOC2-001 records the DPIA/Article 9 gap.
- **the polish cap** — COPY-001 (`category: content`) at medium, no higher.
- **coverage** — full file denominator, `areas_total`, and a matrix row per run lens.
- **remediation order** — both gating findings sequenced by damage-rate-per-effort, with reasons.

## `fail/` — a broken audit and exactly why it breaks

The classic dressed-up-but-hollow report. The harness rejects it with four failures:

1. **SEC-001 shipped at high while `unverified`** — the "keeping as high pending verification" tell. Verify it or cap it; there is no pending.
2. **Coverage shortfall unacknowledged** — 12/14 files examined without `scope.partial: true`.
3. **No coverage matrix** — lenses ran but per-lens coverage is implied, not stated.
4. **No remediation order** — a gating finding with no fix position.

Fix all four (verify-or-cap, acknowledge or finish, add the matrix, add the order) and it gates clean — a useful exercise.

Both apps are invented. Never put real audit output in this directory: `.gitignore` blocks `report.json`/`report.md` everywhere except these two fixture files, deliberately.
