# Stage 5: the report — structure, honesty rules, and the two closing scripts

This file is the contract for the final deliverable. Stage 5 produces `report.json`; the harness gates it; `render-report.mjs` turns it into `report.md`. The renderer is the authoritative implementation of the structure below — if this file and `scripts/render-report.mjs` ever disagree, the renderer governs, and this file needs fixing.

## The two closing scripts, in order

1. **Gate.** `node .claude/skills/production-audit/scripts/audit-check.mjs <audit-dir> [--repo <path>]` must exit zero. Pass `--repo` whenever the target repo is on disk — it validates every cited file and line against reality.
2. **Render.** `node .claude/skills/production-audit/scripts/render-report.mjs <audit-dir> > report.md` generates the human-readable report *from* the validated `report.json`. Never hand-write `report.md`, and never edit the rendered file — every count a reader trusts is computed from the gated data so the prose cannot diverge. To change the report, change `report.json` (then re-gate) or the renderer (then see `run-tests.mjs`).

The report is not delivered until the harness exits zero. There is no "mostly passed".

## What `report.json` must contain

One JSON object with these top-level keys (the harness and renderer read exactly these):

| Key | Required | Content |
|---|---|---|
| `scope` | yes | `app` (name), `lenses_selected[]`, `lenses_run[]`, `lenses_deferred[]`, `partial` (bool), `excluded_not_applicable` (`{lens: reason}`), `compliance_duty_in_scope` (bool, when relevant). Every selected lens must end in run or deferred — a lens in neither fails the roll-call. |
| `stack_profile` | yes (Stage 0) | `language`, `framework`, `datastore`, plus `data_classes[]` — the field the compliance-duty gate keys off. |
| `coverage` | yes | `files_total`, `files_examined` (both numbers — the denominator), optional lens×area `matrix[]` (see `coverage-matrix.md`). Any shortfall requires `scope.partial: true`. |
| `reconciliation` | yes | `{raw, reported, merged, dropped}` — must match the actual counts and satisfy `raw = reported + merged + dropped`. |
| `findings` | yes | The reported set: full canonical-schema records (`finding-schema.md`) with `verification` filled. |
| `dropped` | yes | `[{id, reason}]` — reasons ≥ 8 characters; dropping a ledger critical/high additionally requires a `refuted` verification with real evidence. |
| `remediation_order` | when gating findings exist | `[{id, reason}]` covering **every** gating finding (critical/high, excluding polish categories and re-narrated chains). Sequenced by damage-rate-per-effort: `live blast-radius × likelihood ÷ fix cost` — not by severity label, not by data-sensitivity. Each entry's `reason` says why it sits where it does. |
| `summary` | optional | Free-text executive summary. The one hand-written prose slot — it passes through the slop gate like everything else. Omit it and the renderer generates a summary from the counts. |

## The rendered structure (what the reader sees, in order)

1. **Title + method line.** Stack, lenses run, the reconciliation arithmetic, verification counts, "integrity harness passed", "report mode (no code changed)". A partial run gets "**This is a PARTIAL audit**" stamped here with the deferred lenses named — never buried below.
2. **By the numbers.** Leads with the **gating set**: the count of verified-or-capped critical/high *distinct defects*. The raw reported total is stated with its disclaimer — it is the ledger count, not a count of confirmed defects. Reasoning-typed counts are broken out in both the gating set and the backlog.
3. **Scope.** Lenses run and deferred; regulated data classes detected, with example frameworks and the explicit "confirm which applies by jurisdiction"; files examined over files total.
4. **Executive summary.** `summary`, or the generated fallback.
5. **The few to fix first.** Up to six gating findings, severity-ordered.
6. **Remediation order.** The sequenced list with per-entry reasons.
7. **Findings by severity.** Tiers count distinct defects: re-narrated attack chains (chains whose `chain.root_cause_finding` points at a reported finding) fold into that finding's entry as "also surfaced as an attack path", and are excluded from tier counts. Each finding: id, title, location, issue, consequence, lens(es), confidence type, fix. Reasoning-typed critical/highs carry the "confirm the inference against the code before acting" warning.
8. **Design & copy quality.** The polish axes — `design-aesthetic` and `content` — in their own capped section, never in the readiness tiers. Credibility and conversion risks, addressed after the readiness findings.
9. **Coverage matrix.** When provided.
10. **Reconciliation.** The identity spelled out, plus every dropped finding with its reason.
11. **What could not be assessed.** Deferred lenses, unexamined files, and always: live/runtime state is not determinable from a repository.

## The honesty rules this format encodes

- **Lead with the gating set, never the raw total.** Leading with "142 findings" is the inflated-count failure; six verified criticals gate readiness, the mediums are a backlog with a stated confidence composition.
- **Count distinct defects.** A re-narrated chain and its root cause are one defect, not two. Double-counting is the kind of thing a client discovers, and then discounts the whole report.
- **A partial audit says so, loudly, in the method line** — and names what did not run. A partial audit that says so is useful; one that looks complete is dangerous.
- **Nothing ships around the gate.** No appendix of "additional unverified findings", no severity in prose that differs from the data, no findings mentioned in the summary that aren't in `findings`.

## Related references

`finding-schema.md` (the record shape) · `ledger-and-reconciliation.md` (the ledger and the identity) · `verification-and-severity.md` (what verified means) · `coverage-matrix.md` (the denominator) · `merge-and-deduplicate.md` (survivors and `merged_from`).
