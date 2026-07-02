# 0013 — The human report is rendered from gated data and leads with the gating set

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

Even with a gated `report.json`, a hand-written report.md can lie: a method line claiming counts the data doesn't support, an executive summary leading with "142 findings" when 6 gate readiness, prose drifting from the numbers as edits accumulate. The last artifact the client reads was the one artifact nothing checked.

## Decision

`report.md` is **generated**, not written: `render-report.mjs` computes every count, tier, matrix and reconciliation line *from* the validated `report.json`, after `audit-check.mjs` has exited zero. The prose a reader trusts cannot diverge from the data the harness gated.

The renderer also encodes the presentation ethics:

- **Lead with the gating set** — the verified critical/high count of *distinct defects* — never the raw total. The raw reported total is printed with an explicit disclaimer: it is the ledger count, "**not** a count of confirmed defects".
- Re-narrated chains fold into their root-cause finding (0009); polish findings render in their own capped section (0008); reasoning findings carry their confirm-before-acting warning (0007); partial runs are stamped PARTIAL in the method line (0011).
- Remediation order is sequenced by damage-rate-per-effort (blast-radius × likelihood ÷ fix cost), each entry with its reason — and the harness requires the order to exist and cover every gating finding.
- "What could not be assessed" always renders, and always includes the standing limit: live/runtime state is not determinable from a repository.

## Consequences

- A reader can trust the method line without auditing the auditor; the numbers are arithmetic over a file they could open.
- Report style changes are code changes to the renderer, reviewable in one place — at the cost of prose flexibility per-run (`report.json`'s `summary` field is the sanctioned free-text slot, and even it passes the slop gate).
- The renderer is deliberately dumb: it reads `report.json` only — never the ledger, never the repo — so it cannot re-litigate what the gate already decided.

## Enforced by

- `skills/production-audit/scripts/render-report.mjs` — the whole file.
- `skills/production-audit/scripts/audit-check.mjs` — `checkRemediationOrder`; gating precedes rendering by contract.
- `skills/production-audit/references/report-format.md` — the report structure contract (reconstructed from the renderer in this documentation pass).
