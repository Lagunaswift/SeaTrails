# Decision log

Architecture decision records for seatrial. Each records one load-bearing decision: the problem it answers, the decision, what it costs, and where the code enforces it.

These were written as a retrospective record of decisions already present in the code, so future changes are made knowing *why* the current shape exists. If you change a decision, do not edit the old record — mark it superseded and add a new one.

## Reading order

The first four are the spine; the rest hang off them.

| # | Decision | One line |
|---|---|---|
| [0001](0001-skills-run-the-audit-scripts-gate-it.md) | Skills run the audit; scripts gate it | The audit is prose executed by an agent; determinism lives at the exit gate, not in the audit itself |
| [0002](0002-zero-dependency-integrity-harness.md) | Zero-dependency integrity harness | A pure-Node script stands between the audit and the delivered report, and assumes the auditor will cheat |
| [0003](0003-append-only-ledger-and-reconciliation.md) | Append-only ledger + reconciliation identity | Every raw finding ends in exactly one state: raw = reported + merged + dropped |
| [0004](0004-canonical-finding-schema.md) | One canonical finding schema | Every lens emits the same machine-checkable record with a stable, prefix-scoped id |
| [0005](0005-evidence-standard-for-verified.md) | Evidence standard for "verified" | Verified means quoted code — a file:line or backtick span, never "checked it" |
| [0006](0006-severity-movement-rules.md) | Severity movement rules | Severity can only move with a recorded reason; unverified critical/high cannot ship |
| [0007](0007-factual-vs-reasoning-confidence.md) | Factual vs reasoning confidence | Grep-level claims and inference chains are typed differently and trusted differently |
| [0008](0008-category-ownership-and-polish-caps.md) | Category ownership + polish caps | Lenses own categories; cosmetic and copy findings cap at medium — by consequence, not by lens |
| [0009](0009-synthesis-after-reconciliation.md) | Synthesis consumes the reconciled set | Attack chains build only on findings the audit still stands behind; re-narrated chains fold into their root cause |
| [0010](0010-data-class-triggered-compliance-duty.md) | Data-class-triggered compliance duty | Regulated data makes the compliance pass mandatory by data class, not by stated goal |
| [0011](0011-coverage-as-a-hard-gate.md) | Coverage as a hard gate | "All issues" gets a denominator; a partial audit must say so or it does not ship |
| [0012](0012-adversarial-regression-suite.md) | Adversarial regression suite | Every test case is a closed bypass; weakening the harness flips a test |
| [0013](0013-report-rendered-from-gated-data.md) | Report rendered from gated data | Counts the reader trusts are computed from report.json, and the headline is the gating set |
| [0014](0014-ai-slop-prose-gate.md) | AI-slop prose gate | Deterministic regexes hard-fail slop phrases in the deliverable |

## Format

Each record: **Status · Date · Context · Decision · Consequences · Enforced by.** Keep them short. Cite enforcement as file + symbol (function or constant name) rather than line numbers, which drift.
