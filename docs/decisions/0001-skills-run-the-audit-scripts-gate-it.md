# 0001 — Skills run the audit; scripts gate it

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

Static analysers catch known patterns but cannot read a codebase the way a reviewer does: adapting to the stack, following a consequence chain, judging whether an auth check on nine routes and not the tenth is a bug or a design. An LLM can do that reading — but an LLM auditor can also drift, skip lenses, summarise findings away, and produce a clean-looking report that hides a critical. The suite needs the judgement of a model and the trustworthiness of a program, and those pull in opposite directions.

## Decision

Split the two. The audit itself is **prose**: each lens is a Claude skill (a `SKILL.md` plus references) that an agent reads and executes over the target codebase. There is deliberately no end-to-end command that "runs the audit". Determinism is applied only where it can be absolute — at the exit: `audit-check.mjs` validates the artifacts the agent wrote (`raw-findings.jsonl`, `report.json`) against machine-checkable invariants, and the report is not delivered until it exits zero.

The boundary is stated honestly everywhere it matters: the *process* (detect stack, select lenses, run each, append findings) rests on agent discipline; what is *machine-enforced* is the output's integrity. The claim is not "the agent can't make a mistake" but "a mistake that corrupts the report's integrity cannot ship past the harness."

## Consequences

- Lenses are plain Markdown: reviewable in a diff, forkable, stack-agnostic, and cheap to extend (adding a check is adding prose, not writing a parser).
- Audit quality still varies with the agent and model running it; the harness bounds *integrity*, not *insight*. A lazy run passes the harness if it is honest about its coverage.
- Everything the suite wants to guarantee must be pushed into artifact shape — which is why the ledger, schema, and report are JSON/JSONL rather than free text (see 0003, 0004).
- The scripts must run anywhere the skills are dropped, hence zero dependencies (see 0002).

## Enforced by

- `skills/production-audit/SKILL.md` — "There is no single command that runs the whole audit"; the honest-boundary paragraph.
- `skills/production-audit/scripts/audit-check.mjs` — the exit gate.
- `skills/production-audit/ARCHITECTURE.md` — the pipeline diagram's GATE/RENDER split.
