#!/usr/bin/env node
// =============================================================================
// Regression suite for audit-check.mjs
// -----------------------------------------------------------------------------
// Every case below is a bypass that an adversarial review constructed against an
// earlier version of the harness — an input representing a BAD audit that the
// harness wrongly let pass. Each is now locked: the suite asserts the harness
// gives the expected exit code. If you weaken the harness, a case here flips and
// this suite fails.
//
//   node run-tests.mjs
//
// Exit 0 = all cases behave as expected. Exit 1 = a regression.
// =============================================================================

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const HARNESS = join(HERE, 'audit-check.mjs');

// ---- helpers to build minimal valid findings -------------------------------
function finding(over = {}) {
  return {
    id: 'SEC-001', lens: 'code-audit', pass: 'security', title: 'x', category: 'security',
    location: { file: 'a.ts', line: 1, others: [] },
    issue: 'issue text', consequence: 'consequence text', severity: 'medium',
    confidence_type: 'factual',
    verification: { status: 'unverified', evidence: '', verifier_disagreed: false, note: '' },
    fix: 'fix text', dedup: { merged_from: [], also_seen_by_lenses: [] }, added_post_verification: false,
    ...over,
  };
}
const GOOD_EVIDENCE = 'a.ts:1 — `const x = req.query.id` no guard in handler';
function report(over = {}) {
  return {
    scope: { app: 't', lenses_selected: ['code-audit'], lenses_run: ['code-audit'] },
    coverage: { files_total: 1, files_examined: 1, matrix: [] },
    reconciliation: { raw: 0, reported: 0, merged: 0, dropped: 0 },
    dropped: [], findings: [], ...over,
  };
}

// ---- the cases --------------------------------------------------------------
const cases = [
  {
    name: 'baseline: a clean verified critical PASSES',
    expect: 'pass',
    ledger: [finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: '' } })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: '' } })],
      remediation_order: [{ id: 'SEC-001', reason: 'only critical; fix first' }],
    }),
  },
  {
    name: 'severity laundering: ledger critical, report relabels same id to low',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: '' } })],
    }),
  },
  {
    name: 'legit downgrade: ledger high → report medium WITH recorded calibration passes',
    expect: 'pass',
    ledger: [finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'medium', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: true, note: 'bounded by global rate limit' } })],
    }),
  },
  {
    name: 'merged critical: a critical merged into a benign (low) survivor',
    expect: 'fail',
    ledger: [
      finding({ id: 'SEC-010', severity: 'low' }),
      finding({ id: 'SEC-011', severity: 'critical' }),
    ],
    report: report({
      reconciliation: { raw: 2, reported: 1, merged: 1, dropped: 0 },
      findings: [finding({ id: 'SEC-010', severity: 'low', dedup: { merged_from: ['SEC-011'], also_seen_by_lenses: [] } })],
    }),
  },
  {
    name: 'capped at critical: a "capped" finding shipped at critical severity',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'capped', evidence: '', verifier_disagreed: false, note: 'no time' } })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'capped', evidence: '', verifier_disagreed: false, note: 'no time' } })],
    }),
  },
  {
    name: 'junk evidence: critical verified with evidence "x"',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'verified', evidence: 'x', verifier_disagreed: false, note: '' } })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'verified', evidence: 'x', verifier_disagreed: false, note: '' } })],
    }),
  },
  {
    name: 'verified medium with empty evidence (verified means code was read, at any tier)',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'medium', verification: { status: 'verified', evidence: '', verifier_disagreed: false, note: '' } })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'medium', verification: { status: 'verified', evidence: '', verifier_disagreed: false, note: '' } })],
    }),
  },
  {
    name: 'wrong category: a code-audit IDOR hidden under category "analytics"',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'critical', category: 'analytics', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'critical', category: 'analytics', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    }),
  },
  {
    name: 'design-aesthetic at high must cap (cosmetic → max medium)',
    expect: 'fail',
    ledger: [finding({ id: 'UIUX-001', category: 'design-aesthetic', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'UIUX-001', category: 'design-aesthetic', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: '' } })],
    }),
  },
  {
    name: 'design-aesthetic at medium (capped, reports separately) passes',
    expect: 'pass',
    ledger: [finding({ id: 'UIUX-002', category: 'design-aesthetic', severity: 'medium' })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'UIUX-002', category: 'design-aesthetic', severity: 'medium' })],
    }),
  },
  {
    // THE BOUNDARY (the easy-to-forget half): an interaction/robustness failure that arrives through the
    // UX lens — "no error state → blank screen on API failure" — is category `frontend`, NOT design-aesthetic,
    // and must KEEP its high severity. If the cap over-reached to all UX findings, this would wrongly fail.
    name: 'interaction failure via UX lens at high is NOT capped (frontend, keeps severity)',
    expect: 'pass',
    ledger: [finding({ id: 'FE-010', lens: 'frontend-robustness', category: 'frontend', severity: 'high', verification: { status: 'verified', evidence: 'feed.tsx:40 — no catch/error UI; fetch rejection renders null' } })],
    report: report({
      scope: { app: 't', lenses_selected: ['frontend-robustness'], lenses_run: ['frontend-robustness'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'FE-010', lens: 'frontend-robustness', category: 'frontend', severity: 'high', verification: { status: 'verified', evidence: 'feed.tsx:40 — no catch/error UI; fetch rejection renders null', verifier_disagreed: false, note: '' } })],
      remediation_order: [{ id: 'FE-010', reason: 'blank screen on API failure; user-visible' }],
    }),
  },
  {
    name: 'bad prefix: a data-privacy finding carrying id ZZZ-001',
    expect: 'fail',
    ledger: [finding({ id: 'ZZZ-001', lens: 'data-privacy', category: 'privacy', severity: 'medium' })],
    report: report({
      scope: { app: 't', lenses_selected: ['data-privacy'], lenses_run: ['data-privacy'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'ZZZ-001', lens: 'data-privacy', category: 'privacy', severity: 'medium' })],
    }),
  },
  {
    name: 'attack-path with no chain block (dodging chain validation)',
    expect: 'fail',
    ledger: [finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE }, confidence_type: 'reasoning' })],
    report: report({
      scope: { app: 't', lenses_selected: ['adversary-emulation'], lenses_run: ['adversary-emulation'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'critical', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: 'traced' } })],
    }),
  },
  {
    name: 'chain references a fabricated component finding',
    expect: 'fail',
    ledger: [finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'x' }, chain: { objective: 'o', steps: ['s'], component_findings: ['DOES-NOT-EXIST-999'] } })],
    report: report({
      scope: { app: 't', lenses_selected: ['adversary-emulation'], lenses_run: ['adversary-emulation'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: 'traced' }, chain: { objective: 'o', steps: ['s'], component_findings: ['DOES-NOT-EXIST-999'] } })],
    }),
  },
  {
    name: 'one-char drop reason on a critical (burying a finding)',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    report: report({
      reconciliation: { raw: 1, reported: 0, merged: 0, dropped: 1 },
      dropped: [{ id: 'SEC-001', reason: 'x' }],
      findings: [],
    }),
  },
  {
    name: 'legit drop: a critical refuted with evidence passes',
    expect: 'pass',
    ledger: [finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    report: report({
      reconciliation: { raw: 1, reported: 0, merged: 0, dropped: 1 },
      dropped: [{ id: 'SEC-001', reason: 'guard exists at a.ts:22; false positive', verification: { status: 'refuted', evidence: 'a.ts:22 — `if (uid !== session.uid) return 403`', verifier_disagreed: true, note: 'refuted' } }],
      findings: [],
    }),
  },
  {
    name: 'malformed report: report.json is a bare array',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    rawReport: '[]',
  },
  {
    name: 'silently skipped lens: selected but not run and not deferred',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: report({
      scope: { app: 't', lenses_selected: ['code-audit', 'data-privacy'], lenses_run: ['code-audit'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low' })],
    }),
  },
  {
    // THE COMPLIANCE-DUTY GATE: special-category data present, but the duty folded into
    // "not applicable — no stated SOC 2 goal" with no compliance coverage. The exact failure
    // a prior dogfood run surfaced. A legal duty is in scope by data class, not by stated goal.
    name: 'compliance duty: special-category data + soc2 excluded as not-applicable + no coverage FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: report({
      scope: { app: 't', lenses_selected: ['code-audit'], lenses_run: ['code-audit'], excluded_not_applicable: { 'soc2-compliance': 'no stated SOC 2 goal for a solo pre-launch product' } },
      stack_profile: { language: 'typescript', data_classes: ['special-category:health', 'children'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low' })],
    }),
  },
  {
    name: 'compliance duty: SOC 2 certification deferred BUT the duty covered by a compliance finding PASSES',
    expect: 'pass',
    ledger: [finding({ id: 'PRIV-001', lens: 'data-privacy', category: 'compliance', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    report: report({
      scope: { app: 't', lenses_selected: ['data-privacy'], lenses_run: ['data-privacy'], excluded_not_applicable: { 'soc2-compliance': 'SOC 2 certification deferred — no B2B buyer' } },
      stack_profile: { language: 'typescript', data_classes: ['special-category:health', 'children'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'PRIV-001', lens: 'data-privacy', category: 'compliance', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: '' } })],
      remediation_order: [{ id: 'PRIV-001', reason: 'regulated data; compliance duty' }],
    }),
  },
  {
    // The gate is NARROW: ordinary personal data carries no special duty, so it must NOT fire
    // (else every app with a login would be forced into a compliance pass).
    name: 'compliance duty: ordinary personal data only (no regulated class) does NOT trigger the gate',
    expect: 'pass',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: report({
      scope: { app: 't', lenses_selected: ['code-audit'], lenses_run: ['code-audit'], excluded_not_applicable: { 'soc2-compliance': 'no buyer' } },
      stack_profile: { language: 'typescript', data_classes: ['personal'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low' })],
    }),
  },
  {
    name: 'chain root_cause: re-narrated chain folding into a reported component PASSES',
    expect: 'pass',
    ledger: [
      finding({ id: 'PRIV-001', lens: 'data-privacy', category: 'privacy', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'critical', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'o', steps: ['s'], component_findings: ['PRIV-001'], root_cause_finding: 'PRIV-001' } }),
    ],
    report: report({
      scope: { app: 't', lenses_selected: ['data-privacy', 'adversary-emulation'], lenses_run: ['data-privacy', 'adversary-emulation'] },
      reconciliation: { raw: 2, reported: 2, merged: 0, dropped: 0 },
      findings: [
        finding({ id: 'PRIV-001', lens: 'data-privacy', category: 'privacy', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: '' } }),
        finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'critical', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: 'traced' }, chain: { objective: 'o', steps: ['s'], component_findings: ['PRIV-001'], root_cause_finding: 'PRIV-001' } }),
      ],
      remediation_order: [{ id: 'PRIV-001', reason: 'root cause of chain; fix first' }],
    }),
  },
  {
    // A re-narrated chain must fold into a REAL, REPORTED component — else the renderer would
    // collapse it onto something that isn't there (hiding the chain) or onto a non-component.
    name: 'chain root_cause: references an id that is not a reported component FAILS',
    expect: 'fail',
    ledger: [
      finding({ id: 'PRIV-001', lens: 'data-privacy', category: 'privacy', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'o', steps: ['s'], component_findings: ['PRIV-001'], root_cause_finding: 'PRIV-999' } }),
    ],
    report: report({
      scope: { app: 't', lenses_selected: ['data-privacy', 'adversary-emulation'], lenses_run: ['data-privacy', 'adversary-emulation'] },
      reconciliation: { raw: 2, reported: 2, merged: 0, dropped: 0 },
      findings: [
        finding({ id: 'PRIV-001', lens: 'data-privacy', category: 'privacy', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: '' } }),
        finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: 'traced' }, chain: { objective: 'o', steps: ['s'], component_findings: ['PRIV-001'], root_cause_finding: 'PRIV-999' } }),
      ],
    }),
  },
  {
    // CONTENT (user-facing copy) is a capped polish axis, like design-aesthetic: cosmetic-credibility,
    // never a readiness blocker. A content finding at high must cap to medium.
    name: 'content finding at high must cap (user-facing copy → max medium)',
    expect: 'fail',
    ledger: [finding({ id: 'COPY-001', lens: 'anti-slop-writing', category: 'content', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    report: report({
      scope: { app: 't', lenses_selected: ['anti-slop-writing'], lenses_run: ['anti-slop-writing'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'COPY-001', lens: 'anti-slop-writing', category: 'content', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE, verifier_disagreed: false, note: '' } })],
    }),
  },
  {
    name: 'content finding at medium (anti-slop-writing, its own capped section) PASSES',
    expect: 'pass',
    ledger: [finding({ id: 'COPY-002', lens: 'anti-slop-writing', category: 'content', severity: 'medium' })],
    report: report({
      scope: { app: 't', lenses_selected: ['anti-slop-writing'], lenses_run: ['anti-slop-writing'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'COPY-002', lens: 'anti-slop-writing', category: 'content', severity: 'medium' })],
    }),
  },
  {
    // Ownership: only anti-slop-writing owns `content`. A code-audit finding mislabelled content
    // (to dodge the readiness tiers, or by mistake) is an implausible category for the lens.
    name: 'wrong lens: a code-audit finding under category content FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', lens: 'code-audit', category: 'content', severity: 'medium' })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', lens: 'code-audit', category: 'content', severity: 'medium' })],
    }),
  },

  // ---- INVARIANT 6 extensions: chain ↔ reconciliation integrity ---------------
  // These lock a dogfood defect: chains referencing findings that
  // reconciliation dropped (refute-orphan) or merged (merge-orphan).

  {
    // THE REFUTE-ORPHAN: SEC-002 refuted, but CHAIN-001 still references it as a
    // component. The chain's severity rested on SEC-002; with it gone, the chain is
    // built on a claim the audit no longer stands behind.
    name: 'chain component references a DROPPED (refuted) finding FAILS',
    expect: 'fail',
    ledger: [
      finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'SEC-002', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'critical', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'exfil', steps: ['SEC-001 — entry', 'SEC-002 — escalate'], component_findings: ['SEC-001', 'SEC-002'] } }),
    ],
    report: report({
      scope: { app: 't', lenses_selected: ['code-audit', 'adversary-emulation'], lenses_run: ['code-audit', 'adversary-emulation'] },
      reconciliation: { raw: 3, reported: 2, merged: 0, dropped: 1 },
      dropped: [{ id: 'SEC-002', reason: 'guard exists at route.ts:22; false positive confirmed', verification: { status: 'refuted', evidence: 'route.ts:22 — `if (!auth) return 403`', verifier_disagreed: true, note: 'refuted' } }],
      findings: [
        finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
        finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'critical', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'exfil', steps: ['SEC-001 — entry', 'SEC-002 — escalate'], component_findings: ['SEC-001', 'SEC-002'] } }),
      ],
    }),
  },
  {
    // THE MERGE-ORPHAN: SCALE-004 merged into SCALE-005, but CHAIN-005 still
    // references the dead child id. The claim survives under a new id; the chain
    // reference must be rewritten to the surviving parent.
    name: 'chain component references a MERGED finding FAILS (should reference survivor)',
    expect: 'fail',
    ledger: [
      finding({ id: 'SCALE-004', lens: 'scaling-audit', category: 'scaling', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'SCALE-005', lens: 'scaling-audit', category: 'scaling', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'CHAIN-005', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'cost abuse', steps: ['SCALE-004 — bonus doubling'], component_findings: ['SCALE-004'] } }),
    ],
    report: report({
      scope: { app: 't', lenses_selected: ['scaling-audit', 'adversary-emulation'], lenses_run: ['scaling-audit', 'adversary-emulation'] },
      reconciliation: { raw: 3, reported: 2, merged: 1, dropped: 0 },
      findings: [
        finding({ id: 'SCALE-005', lens: 'scaling-audit', category: 'scaling', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE }, dedup: { merged_from: ['SCALE-004'], also_seen_by_lenses: [] } }),
        finding({ id: 'CHAIN-005', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'cost abuse', steps: ['SCALE-004 — bonus doubling'], component_findings: ['SCALE-004'] } }),
      ],
    }),
  },
  {
    // CHAIN TEXT ORPHAN: component_findings correctly references only the reconciled
    // set, but the chain's step prose still names a dropped finding id.
    name: 'chain step text references a DROPPED finding id FAILS',
    expect: 'fail',
    ledger: [
      finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'SEC-002', severity: 'medium' }),
      finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'exfil', steps: ['SEC-001 — entry', 'If SEC-002 also holds, blast radius widens'], component_findings: ['SEC-001'] } }),
    ],
    report: report({
      scope: { app: 't', lenses_selected: ['code-audit', 'adversary-emulation'], lenses_run: ['code-audit', 'adversary-emulation'] },
      reconciliation: { raw: 3, reported: 2, merged: 0, dropped: 1 },
      dropped: [{ id: 'SEC-002', reason: 'in-memory rendering confirmed; path not traversable' }],
      findings: [
        finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
        finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'exfil', steps: ['SEC-001 — entry', 'If SEC-002 also holds, blast radius widens'], component_findings: ['SEC-001'] } }),
      ],
    }),
  },
  {
    // SEVERITY-BASIS ORPHAN: chain components are all reconciled, but severity_basis
    // lists a dropped finding whose severity drove the chain's critical rating.
    name: 'chain severity_basis references a dropped finding FAILS',
    expect: 'fail',
    ledger: [
      finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'SEC-002', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'critical', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'exfil', steps: ['SEC-001 — entry'], component_findings: ['SEC-001'], severity_basis: ['SEC-001', 'SEC-002'] } }),
    ],
    report: report({
      scope: { app: 't', lenses_selected: ['code-audit', 'adversary-emulation'], lenses_run: ['code-audit', 'adversary-emulation'] },
      reconciliation: { raw: 3, reported: 2, merged: 0, dropped: 1 },
      dropped: [{ id: 'SEC-002', reason: 'guard exists; false positive confirmed', verification: { status: 'refuted', evidence: 'route.ts:22 — `if (!auth) return 403`', verifier_disagreed: true, note: 'refuted' } }],
      findings: [
        finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
        finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'critical', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'exfil', steps: ['SEC-001 — entry'], component_findings: ['SEC-001'], severity_basis: ['SEC-001', 'SEC-002'] } }),
      ],
    }),
  },
  {
    // CLEAN CHAIN: all component refs, text refs, and severity_basis point to
    // reconciled reported findings. The positive case for the new checks.
    name: 'chain with all references properly reconciled (incl. severity_basis) PASSES',
    expect: 'pass',
    ledger: [
      finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'FE-001', lens: 'frontend-robustness', category: 'frontend', severity: 'medium' }),
      finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'exfil', steps: ['SEC-001 — entry', 'FE-001 — exfil via client'], component_findings: ['SEC-001', 'FE-001'], severity_basis: ['SEC-001', 'FE-001'] } }),
    ],
    report: report({
      scope: { app: 't', lenses_selected: ['code-audit', 'frontend-robustness', 'adversary-emulation'], lenses_run: ['code-audit', 'frontend-robustness', 'adversary-emulation'] },
      reconciliation: { raw: 3, reported: 3, merged: 0, dropped: 0 },
      findings: [
        finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
        finding({ id: 'FE-001', lens: 'frontend-robustness', category: 'frontend', severity: 'medium' }),
        finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'exfil', steps: ['SEC-001 — entry', 'FE-001 — exfil via client'], component_findings: ['SEC-001', 'FE-001'], severity_basis: ['SEC-001', 'FE-001'] } }),
      ],
      remediation_order: [{ id: 'SEC-001', reason: 'entry point; fix first' }, { id: 'CHAIN-001', reason: 'chain requires SEC-001' }],
    }),
  },

  // ---- INVARIANT 9: coverage promoted to gate ---------------------------------
  {
    name: 'coverage: no coverage block FAILS (was warning, now gate)',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: { ...report({ reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 }, findings: [finding({ id: 'SEC-001', severity: 'low' })] }), coverage: undefined },
  },
  {
    name: 'coverage: incomplete without scope.partial FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: report({
      coverage: { files_total: 100, files_examined: 30, matrix: [] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low' })],
    }),
  },
  {
    name: 'coverage: incomplete WITH scope.partial=true PASSES (acknowledged gap)',
    expect: 'pass',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: report({
      scope: { app: 't', lenses_selected: ['code-audit'], lenses_run: ['code-audit'], partial: true },
      coverage: { files_total: 100, files_examined: 30, matrix: [] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low' })],
    }),
  },

  // ---- INVARIANT 10: remediation order ----------------------------------------
  {
    name: 'remediation order: critical finding with no remediation_order FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    }),
  },
  {
    name: 'remediation order: gating finding missing from order FAILS',
    expect: 'fail',
    ledger: [
      finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'SEC-002', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
    ],
    report: report({
      reconciliation: { raw: 2, reported: 2, merged: 0, dropped: 0 },
      findings: [
        finding({ id: 'SEC-001', severity: 'critical', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
        finding({ id: 'SEC-002', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      ],
      remediation_order: [{ id: 'SEC-001', reason: 'only included one' }],
    }),
  },
  {
    name: 'remediation order: entry without reason FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } })],
      remediation_order: [{ id: 'SEC-001', reason: '' }],
    }),
  },
  {
    name: 'remediation order: no gating findings = no order required PASSES',
    expect: 'pass',
    ledger: [finding({ id: 'SEC-001', severity: 'medium' })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'medium' })],
    }),
  },

  // ---- INVARIANT 12: prose quality (slop detection) ---------------------------
  {
    name: 'prose: finding title contains "delve" FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low', title: 'We delve into the auth issue' })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low', title: 'We delve into the auth issue' })],
    }),
  },
  {
    name: 'prose: finding consequence contains "game-changer" FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low', consequence: 'This is a game-changer for the attacker' })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low', consequence: 'This is a game-changer for the attacker' })],
    }),
  },
  {
    name: 'prose: report summary contains "in conclusion" FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: report({
      summary: 'In conclusion the app is insecure.',
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low' })],
    }),
  },
  {
    name: 'prose: clean technical language PASSES',
    expect: 'pass',
    ledger: [finding({ id: 'SEC-001', severity: 'low', title: 'Missing CSRF token on POST /api/users', issue: 'The handler accepts mutations without a CSRF token', consequence: 'An attacker can forge requests from an authenticated session', fix: 'Add CSRF middleware to all state-changing routes' })],
    report: report({
      summary: '1 low-severity finding. No gating issues.',
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low', title: 'Missing CSRF token on POST /api/users', issue: 'The handler accepts mutations without a CSRF token', consequence: 'An attacker can forge requests from an authenticated session', fix: 'Add CSRF middleware to all state-changing routes' })],
    }),
  },
];

// ---- run --------------------------------------------------------------------
let passed = 0, failed = 0;
for (const c of cases) {
  const dir = mkdtempSync(join(tmpdir(), 'audit-test-'));
  try {
    const ledgerText = (c.ledger || []).map((f) => JSON.stringify(f)).join('\n');
    writeFileSync(join(dir, 'raw-findings.jsonl'), ledgerText);
    writeFileSync(join(dir, 'report.json'), c.rawReport != null ? c.rawReport : JSON.stringify(c.report));
    const res = spawnSync(process.execPath, [HARNESS, dir], { encoding: 'utf8' });
    const got = res.status === 0 ? 'pass' : 'fail';
    const ok = got === c.expect;
    if (ok) { passed++; console.log(`✔  ${c.name}  (expected ${c.expect})`); }
    else {
      failed++;
      console.log(`✖  ${c.name}  — expected ${c.expect}, got ${got}`);
      console.log(res.stdout.split('\n').filter((l) => l.includes('-') || l.includes('✖')).slice(0, 6).map((l) => `       ${l}`).join('\n'));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

console.log(`\n${'─'.repeat(60)}\n${passed} passed, ${failed} failed, ${cases.length} total`);
process.exit(failed ? 1 : 0);
