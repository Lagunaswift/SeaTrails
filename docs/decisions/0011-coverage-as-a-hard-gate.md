# 0011 — Coverage has a denominator, and partial runs must say so

**Status:** Accepted (retrospective record)
**Date:** 2026-07-01

## Context

"We audited everything" is unfalsifiable without a denominator. The dangerous version isn't malice — it's a session limit cutting a sweep off after the security lenses, leaving a report that covers a third of the ground and looks finished. The reader trusts coverage that never happened.

## Decision

Coverage is measured and gated. The report must carry `coverage.files_examined` / `coverage.files_total`; a missing coverage block is a hard failure (this was once a warning; it was promoted deliberately). Any shortfall — examined < total — hard-fails unless the audit declares itself partial (`scope.partial: true`); declared, it still warns, and the gaps must be named in "what could not be assessed".

The same honesty applies at lens granularity: every selected lens must end as run or deferred (a silently skipped lens fails — the roll-call check), deferred lenses put the report into partial mode, and the renderer stamps "**This is a PARTIAL audit**" into the method line with the deferred lens names.

Staging is the *recommended* pattern, not a failure mode: a full sweep rarely fits one session, so the orchestrator plans priority-ordered stages up front, delivers explicit partial reports, and resumes by re-stating what already ran.

## Consequences

- A partial audit that says so plainly is useful; the one that looks complete can no longer ship. Interruption becomes a labelled state instead of a silent corruption.
- File-count coverage is a crude metric — examined ≠ understood — but it is honest about the one thing it measures, and it gives "what could not be assessed" a number.
- The lens×area coverage matrix (`coverage-matrix.md`) is specified but not yet machine-enforced beyond presence of the file counts; that looseness is a known gap (see the handover backlog).

## Enforced by

- `skills/production-audit/scripts/audit-check.mjs` — `checkCoverage`, `checkRollCall`.
- `skills/production-audit/references/coverage-matrix.md` — the matrix contract; `SKILL.md` — the budgeting/staging discipline.
- `skills/production-audit/scripts/render-report.mjs` — the PARTIAL stamp, deferred-lens lines, "what could not be assessed".
- `skills/production-audit/scripts/run-tests.mjs` — the three coverage cases and the silently-skipped-lens case.
