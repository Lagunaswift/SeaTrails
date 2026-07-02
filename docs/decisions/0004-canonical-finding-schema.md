# 0004 — One canonical finding schema with stable, prefix-scoped ids

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

Nineteen lenses run by different subagents will, left alone, emit nineteen dialects of "finding". Loose formats make merging guesswork, make severity comparisons meaningless, and make machine-checking impossible. And "standard format" instructions inside individual skills drift over time.

## Decision

One schema, defined once in `references/finding-schema.md`, is the single source of truth. Every finding — ledger line or reported — is the same JSON object: `id`, `lens`, `pass`, `title`, `category`, `location{file,line,others}`, `issue`, `consequence`, `severity`, `confidence_type`, `verification{status,evidence,verifier_disagreed,note}`, `fix`, `dedup{merged_from,also_seen_by_lenses}`, `added_post_verification`, plus an optional `chain` block for attack-path findings. A non-conforming record is not a valid finding; the harness rejects it.

Ids are `<PREFIX>-<3+ digits>`, unique for the run, and **stable**: once assigned, never reused or renumbered — merge records the loser in the survivor's `merged_from` rather than deleting the id. Each lens owns its prefixes (SEC/COR/… for code-audit, A11Y for accessibility, CHAIN for adversary-emulation, …), so any id can be traced to its source lens mechanically.

The schema **overrides** any output-format instruction in a backing skill. Craft skills say things like "produce a prioritised report"; when run as a lens under the orchestrator, the canonical schema wins (`running-the-lenses.md` is explicit about this override).

## Consequences

- Merge, verification, reconciliation, gating, and rendering all read one shape; new pipeline machinery needs no per-lens adapters.
- Adding a lens means registering it everywhere the shape is enforced: the schema's enums and prefix table, and the harness's `LENSES`, `CATEGORIES`, `LENS_CATEGORIES`, `LENS_PREFIXES`. Miss one and valid findings hard-fail — see `.claude/skills/add-lens/`.
- Stable ids give chains, remediation orders, and prose something durable to reference; the harness can then check those references (0009).

## Enforced by

- `skills/production-audit/references/finding-schema.md` — the contract.
- `skills/production-audit/scripts/audit-check.mjs` — `checkSchema` (field presence, enums, `ID_RE`, prefix ownership, category plausibility), run over every ledger line and every reported finding.
