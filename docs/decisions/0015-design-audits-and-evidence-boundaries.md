# 0015: Design audit integrations and stricter evidence boundaries

**Status:** Accepted
**Date:** Recorded in Git history

## Context

The suite had design craft guidance inside code-audit, but no explicit Impeccable or Taste lens. Copying whole upstream workflows would introduce setup writes, redesign instructions and defaults that conflict with a read-only audit. The gate also accepted several malformed or misleading artifacts despite the existing integrity intent.

## Decision

Add two independently written audit-native integrations. Impeccable owns interface coherence with consequence routing to frontend/accessibility. Taste owns contextual visual direction on marketing, portfolio and editorial surfaces only. Both use shared context, canonical findings and existing cosmetic caps. Their intake notes identify reviewed upstream revisions. No upstream runtime is bundled.

Source, rendered and interactive evidence remain distinct. User tasks, existing brand rules and accessibility constraints outrank external aesthetic defaults. Neither review installs tools, edits the product or invents visual tests.

Tighten the existing gate rather than replace its architecture: realpath-contained evidence, checks on secondary and refutation citations, unique disposition identities, required reconciliation counts, integer coverage and exact lens rows. Invalid repository paths fail closed. Add machine-readable results while preserving exit-code meaning and text output. Carry explicit assessment limitations through the gate into the rendered report.

## Consequences

Some artifacts previously accepted by accident now fail with an explanation. Legitimate existing string matrix rows remain supported as `lens-name: detail`. Reviewers gain two lenses without changing the schema's category vocabulary. These checks establish artifact integrity, not objective taste or proof that all bugs were found.

The original 52 regression cases remain unchanged in substance. New attack cases were run before the gate changes to reproduce the bypasses; nearest legitimate cases guard the boundary. The combined suite contains 94 cases.

## Enforced by

`audit-check.mjs`: lens maps, checkSchema, checkReconciliation, checkRollCall, checkCoverage, checkEvidenceFiles, parseArgs and JSON result output. `run-tests.mjs`: design ownership, severity boundaries, evidence, identity, coverage and JSON regressions. `check-consistency.mjs`: registration agreement. The new skill and context documents govern the judgement that deterministic code cannot certify.
