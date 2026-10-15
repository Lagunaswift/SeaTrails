# 0016 — Capture evidence and measure detection separately

**Status:** Accepted
**Date:** 2026-10-16
**Supersedes:** 0013's sequencing-only gate and renderer-only-input restriction; extends 0002's single-file implementation.

## Decision

New delivery requires a Git tracked-file inventory, controller-owned source-delivery receipts, and separate review records bound to exact finding and source hashes. The deterministic gate checks quotes and provenance consistency. Reviewers decide semantic support, explicitly recording preconditions, data flow and counterevidence. This division avoids labelling mere citation existence as semantic verification.

The renderer snapshots report and ledger, runs the gate on those bytes, and renders only on success. Existing structural checks remain available. Historical rendering requires explicit `--legacy` and exposes its limits. Assurance-versioned reports cannot fall back silently.

Detection quality has a separate labelled corpus, executable behaviour probes, label-free audit packets and a scorer reporting precision, recall and false-positive rate. Integrity regression results never stand in for detection results.

## Limits

A read receipt proves delivery, not comprehension. Hashes do not authenticate a controller or prevent a worker with arbitrary evidence-directory write access from forging records. The executor must isolate capture storage and independently assign identities. Semantic review remains fallible. The initial synthetic corpus is a calibration set, not a production accuracy claim.

## Verification

The original regression cases are retained. Added attacks cover bypassing validation during rendering and versioned evidence without records. Integration tests exercise capture, stale and forged quotes, false coverage counts, reviewer identity and source changes. Benchmark tests execute positive/negative boundaries and attack the scorer's matching and denominator rules.
