# 0018 — Observation records and named evidence kinds

**Status:** Accepted
**Date:** 2026-11-10
**Extends:** 0005 (evidence standard for "verified"), 0016 (evidence assurance and detection).

## Context

"Verified" meant a second model read the same lines and quoted them. That standard cannot support an absence claim, cannot show behaviour, and its errors are the same kind as the auditor's. The website profile already accepted `rendered` and `interactive` evidence as a mode label with free text behind it. The evidence protocol asked reviewers to reproduce runtime claims "where practical" and keep the output in prose, which nothing checked. A report could say a journey was reproduced and the gate had no way to disagree.

The detection benchmark could not measure a change either. Its eight one-line cases were solved 4/4, and it showed a worker both members of every pair in a fixed order.

## Candidates

| Candidate | Benefit across audits | Why it was or was not built |
|---|---|---|
| Observation records: replayed searches and executed probes bound to the snapshot, checked by the gate | Closes evidence-kind laundering in every audit; adds evidence that does not depend on a model's reading | **Built.** The gap was demonstrable: six bypass cases passed the unchanged gate. |
| Replayable static search for absence claims (found during this work) | Applies to every audit, needs no runnable target | **Built as a second observation kind**: the marginal cost was small once the record existed. |
| A benchmark that can separate two protocols (found during this work) | Makes any later claim about detection falsifiable | **Built.** Without it the first candidate's detection benefit could not be tested. |
| Entry-point inventory with a disposition per route, handler and form (found during this work) | Aims at recall, the largest unmeasured failure | **Not built: strongest rejected alternative.** A script-derived inventory needs per-stack heuristics the manifest design avoids; a model-authored one is a self-reported denominator. Search observations are the primitive that would make its completeness checkable. |
| Finding fingerprints across runs, for re-audit deltas | Shows resolved, persisting and new findings after a fix | **Not built.** Routine once anchors exist; packaged as follow-up work. |
| Union of independent detection passes (suggested by the benchmark results) | Recall rose from 13–14.5 of 16 per run to 16 of 16 across runs | **Not built.** Seen only after the runs, on small counts. It needs a pre-registered experiment before it earns a protocol change. |

## Decision

A verified finding names its evidence basis: `source-quote`, `static-search`, `runtime-observation`, `runtime-reproduction` or `simulated-test`. Any basis but the first needs observation records under `assurance_version: 2`.

An observation is recorded by the controller with `observe.mjs`, chained from the manifest hash, and stored with its specification, probe, outputs, steps and artefacts. A probe runs in a temporary copy of the tracked files with a scrubbed environment and reports steps; the tool, not the probe, decides whether expected and observed differ. A control replaces the cited file in a second copy and reruns the same probe. A deviation that disappears under the control ties the behaviour to that file.

The gate replays searches, re-derives probe results from stored bytes and never executes a probe. Every recorded observation must be accounted for on the disposition of its subject. A verified finding whose only real probe conformed fails without a stated reason; a dropped finding that was reproduced fails. Under version 2, `rendered` and `interactive` website evidence must name a completed web observation. Version 1 stays valid for audits that record none.

Adapters for web and game evidence are probe conventions over the same record. `export-findings.mjs` gives another tool a sealed bundle of gated findings with their basis.

The benchmark gains a second corpus with a shared executable oracle per pair, split packets with opaque ids, a verification task, two arms, a comparison command and an adjudication file whose rulings are executable.

## What would falsify the benefit

If, on labelled cases, a protocol with observations detected or verified no better than reading, the detection benefit would be unsupported. **It was not supported.** In twenty blinded runs over two model tiers, the read-only and observe arms had identical recall and false-positive rates, and every arm verified 24 of 24 concrete claims. The measured benefit is narrower: evidence claims the gate can check (six bypasses closed, seventy-two integration checks), and disputes that execution settles. The corpus is short single-module code; multi-file, stateful and browser-dependent defects are untested.

## Consequences

- A report can no longer claim a kind of evidence it does not hold. An audit that cannot run its target says so in an `unavailable` record.
- Running probes executes target code. The tool isolates files and environment, and does not sandbox the network. The controller decides where that is acceptable.
- A probe that pattern-matches source text passes a control without executing anything. The reviewer's `observation_review` is the check; the gate cannot make it.
- Corpus labels are provisional until adjudicated: four members labelled sound held real violations. Benchmark false-positive figures need the adjudication step.
- More to maintain: one module, two commands, one test suite and two reference documents.

## Enforced by

`observation.mjs` (`observe`, `checkObservations`, `claimsObservations`, `armResult`, `controlStatus`, `BASES`, `SURFACES`); `audit-check.mjs` (`checkSchema` basis and id checks, INVARIANT 13); `render-report.mjs` (`describeObservation`, `BASIS_LABEL`); `export-findings.mjs` (`verifyBundle`); `benchmark.mjs` (`prepareV2`, `scoreV2`, `compareV2`); `run-tests.mjs` (seven evidence-kind cases); `test-observation.mjs`; `test-benchmark.mjs`.
