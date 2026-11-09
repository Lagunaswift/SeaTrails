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

import { mkdtempSync, writeFileSync, rmSync, mkdirSync, symlinkSync } from 'node:fs';
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
  const out = {
    scope: { app: 't', lenses_selected: ['code-audit'], lenses_run: ['code-audit'] },
    reconciliation: { raw: 0, reported: 0, merged: 0, dropped: 0 },
    dropped: [], findings: [], ...over,
  };
  // Default coverage conforms to the matrix rules (a row per run lens, an
  // areas_total), derived from whatever scope the case set. Cases attacking
  // coverage itself pass their own block explicitly.
  if (!Object.prototype.hasOwnProperty.call(over, 'coverage')) {
    const runLenses = (out.scope && out.scope.lenses_run) || [];
    out.coverage = { files_total: 1, files_examined: 1, areas_total: 1, matrix: runLenses.map((l) => `${l}: all areas examined`) };
  }
  return out;
}


// One atomic finding with a matching roll-call and exact reconciliation.
function single(over = {}, reportOver = {}) {
  const f = finding(over);
  return { ledger: [f], report: report({
    scope: { lenses_selected: [f.lens], lenses_run: [f.lens] },
    reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
    findings: [f], ...reportOver,
  }) };
}
function evidenceRepo(dir) {
  mkdirSync(join(dir, 'repo'));
  writeFileSync(join(dir, 'repo', 'a.ts'), 'const x = 1;\n');
  writeFileSync(join(dir, 'outside.ts'), 'const outside = true;\n');
}
const VERIFIED = { status: 'verified', evidence: GOOD_EVIDENCE };

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
    // CONSEQUENCE ROUTING: code-audit's UI/UX pass surfaces real access barriers
    // (keyboard traps, unlabelled controls). Categorised by consequence they are
    // `accessibility` and keep their severity — the same grant frontend-robustness
    // and mobile-and-responsive already have. The registry has promised this
    // routing since the initial release; this case makes the harness honour it.
    name: 'code-audit access barrier at category accessibility (consequence routing) PASSES',
    expect: 'pass',
    ledger: [finding({ id: 'UIUX-003', category: 'accessibility', severity: 'high', title: 'Keyboard trap in the payment modal', issue: 'Focus cannot leave the modal via keyboard', consequence: 'Keyboard-only users cannot complete checkout', verification: { status: 'verified', evidence: 'modal.tsx:44 — `onKeyDown` swallows Tab; no focus release' } })],
    report: report({
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'UIUX-003', category: 'accessibility', severity: 'high', title: 'Keyboard trap in the payment modal', issue: 'Focus cannot leave the modal via keyboard', consequence: 'Keyboard-only users cannot complete checkout', verification: { status: 'verified', evidence: 'modal.tsx:44 — `onKeyDown` swallows Tab; no focus release' } })],
      remediation_order: [{ id: 'UIUX-003', reason: 'blocks checkout for keyboard users; small focused fix' }],
    }),
  },
  {
    // The grant is per-lens, not global: a lens that does not own accessibility
    // still cannot file under it.
    name: 'wrong category: a performance finding under category accessibility FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'PERF-002', lens: 'performance', category: 'accessibility', severity: 'low' })],
    report: report({
      scope: { app: 't', lenses_selected: ['performance'], lenses_run: ['performance'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'PERF-002', lens: 'performance', category: 'accessibility', severity: 'low' })],
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
      // remediation_order supplied so the dropped-id-in-prose reference is this
      // case's only possible failure (mirrors the A11Y variant below).
      remediation_order: [
        { id: 'SEC-001', reason: 'the entry point; closing it breaks the chain' },
        { id: 'CHAIN-001', reason: 'chain persists until the entry point is closed' },
      ],
    }),
  },
  {
    // CHAIN TEXT ORPHAN, digit-bearing prefix: same attack as above but the dropped
    // id's prefix contains digits (A11Y). The prose scanner must extract these too —
    // a pure-letter-only regex lets A11Y/SOC2/I18N references evade the check.
    // remediation_order is supplied so the ONLY possible failure is the prose reference.
    name: 'chain step text references a DROPPED A11Y finding (digit-bearing prefix) FAILS',
    expect: 'fail',
    ledger: [
      finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
      finding({ id: 'A11Y-001', lens: 'accessibility', category: 'accessibility', severity: 'medium' }),
      finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'exfil', steps: ['SEC-001 — entry', 'A11Y-001 keeps the victim from noticing the prompt'], component_findings: ['SEC-001'] } }),
    ],
    report: report({
      scope: { app: 't', lenses_selected: ['code-audit', 'accessibility', 'adversary-emulation'], lenses_run: ['code-audit', 'accessibility', 'adversary-emulation'] },
      reconciliation: { raw: 3, reported: 2, merged: 0, dropped: 1 },
      dropped: [{ id: 'A11Y-001', reason: 'focus trap not reproducible; modal releases focus' }],
      findings: [
        finding({ id: 'SEC-001', severity: 'high', verification: { status: 'verified', evidence: GOOD_EVIDENCE } }),
        finding({ id: 'CHAIN-001', lens: 'adversary-emulation', category: 'attack-path', severity: 'high', confidence_type: 'reasoning', verification: { status: 'verified', evidence: GOOD_EVIDENCE, note: 'traced' }, chain: { objective: 'exfil', steps: ['SEC-001 — entry', 'A11Y-001 keeps the victim from noticing the prompt'], component_findings: ['SEC-001'] } }),
      ],
      remediation_order: [
        { id: 'SEC-001', reason: 'the entry point; closing it breaks the chain' },
        { id: 'CHAIN-001', reason: 'chain persists until the entry point is closed' },
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
    // A conforming matrix is supplied so the files shortfall is this case's
    // only possible failure (the matrix rules have their own cases below).
    name: 'coverage: incomplete without scope.partial FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: report({
      coverage: { files_total: 100, files_examined: 30, areas_total: 1, matrix: ['code-audit: all areas examined'] },
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
      coverage: { files_total: 100, files_examined: 30, areas_total: 1, matrix: ['code-audit: all areas examined'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low' })],
    }),
  },
  {
    // HOLLOW LENS COVERAGE: files add up, but nothing states which lens covered
    // what — per-lens coverage is implied, not measured (coverage-matrix.md).
    name: 'coverage matrix: lenses ran but no matrix at all FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: report({
      coverage: { files_total: 1, files_examined: 1 },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low' })],
    }),
  },
  {
    name: 'coverage matrix: a run lens has no row in the matrix FAILS',
    expect: 'fail',
    ledger: [
      finding({ id: 'SEC-001', severity: 'low' }),
      finding({ id: 'PERF-001', lens: 'performance', category: 'performance', severity: 'low' }),
    ],
    report: report({
      scope: { app: 't', lenses_selected: ['code-audit', 'performance'], lenses_run: ['code-audit', 'performance'] },
      coverage: { files_total: 2, files_examined: 2, areas_total: 1, matrix: ['code-audit: all areas examined'] },
      reconciliation: { raw: 2, reported: 2, merged: 0, dropped: 0 },
      findings: [
        finding({ id: 'SEC-001', severity: 'low' }),
        finding({ id: 'PERF-001', lens: 'performance', category: 'performance', severity: 'low' }),
      ],
    }),
  },
  {
    // COVERAGE PADDING: the matrix claims a lens that never ran, inflating the
    // apparent breadth of the audit.
    name: 'coverage matrix: row claims a lens that neither ran nor was deferred FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: report({
      coverage: { files_total: 1, files_examined: 1, areas_total: 1, matrix: ['code-audit: all areas examined', 'scaling-audit: all areas examined'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low' })],
    }),
  },
  {
    name: 'coverage matrix: matrix present but areas_total missing FAILS',
    expect: 'fail',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: report({
      coverage: { files_total: 1, files_examined: 1, matrix: ['code-audit: all areas examined'] },
      reconciliation: { raw: 1, reported: 1, merged: 0, dropped: 0 },
      findings: [finding({ id: 'SEC-001', severity: 'low' })],
    }),
  },
  {
    // THE BOUNDARY: a deferred lens may sit in the matrix as an empty row — that
    // is exactly how a staged run stays honest (coverage-matrix.md). Only rows
    // for lenses that neither ran nor were deferred are illegal.
    name: 'coverage matrix: rows for every run lens plus a deferred lens\'s row PASSES',
    expect: 'pass',
    ledger: [finding({ id: 'SEC-001', severity: 'low' })],
    report: report({
      scope: { app: 't', lenses_selected: ['code-audit', 'performance'], lenses_run: ['code-audit'], lenses_deferred: ['performance'], partial: true },
      coverage: { files_total: 1, files_examined: 1, areas_total: 1, matrix: ['code-audit: all areas examined', 'performance: deferred — not yet run'] },
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
  // ---- the worked examples: the committed fixtures run end-to-end -------------
  // These lock the fixtures themselves: fixtures/pass is a complete valid audit
  // (gates clean), fixtures/fail is a broken one (rejected with exit 1 — a
  // gate failure, not an input error). If either fixture rots, this flips.
  {
    name: 'fixtures/pass: the complete worked example gates clean PASSES',
    expect: 'pass',
    fixtureDir: 'fixtures/pass',
  },
  {
    name: 'fixtures/fail: the broken worked example is rejected as untrustworthy (exit 1) FAILS',
    expect: 'fail',
    expectExit: 1,
    fixtureDir: 'fixtures/fail',
  },

  // ---- design lenses: category ownership and the consequence boundary --------
  {
    name: 'impeccable: design-system finding at medium PASSES',
    expect: 'pass',
    ...single({ id: 'IMP-001', lens: 'impeccable-audit', category: 'design-aesthetic' }),
  },
  {
    name: 'taste: contextual visual finding at medium PASSES',
    expect: 'pass',
    ...single({ id: 'TASTE-001', lens: 'taste-audit', category: 'design-aesthetic', confidence_type: 'reasoning' }),
  },
  {
    name: 'impeccable: security cannot be hidden in a design lens FAILS',
    expect: 'fail',
    ...single({ id: 'IMP-001', lens: 'impeccable-audit', category: 'security' }),
  },
  {
    name: 'taste: cannot claim frontend ownership to evade the polish cap FAILS',
    expect: 'fail',
    ...single({ id: 'TASTE-001', lens: 'taste-audit', category: 'frontend', severity: 'high', verification: VERIFIED }, { remediation_order: [{ id: 'TASTE-001', reason: 'test order' }] }),
  },
  {
    name: 'impeccable: verified access barrier keeps high severity PASSES',
    expect: 'pass',
    ...single({ id: 'IMP-001', lens: 'impeccable-audit', category: 'accessibility', severity: 'high', verification: VERIFIED }, { remediation_order: [{ id: 'IMP-001', reason: 'restore keyboard access' }] }),
  },
  {
    name: 'taste: visual preference at high FAILS',
    expect: 'fail',
    ...single({ id: 'TASTE-001', lens: 'taste-audit', category: 'design-aesthetic', severity: 'high', verification: VERIFIED }),
  },
  {
    name: 'impeccable: borrowing the taste prefix FAILS',
    expect: 'fail',
    ...single({ id: 'TASTE-001', lens: 'impeccable-audit', category: 'design-aesthetic' }),
  },
  // ---- evidence: local fixtures, not existence checks against the maintainer's repo
  {
    name: 'evidence: a supplied nonexistent repo cannot skip verification FAILS',
    expect: 'fail',
    expectExit: 1,
    repo: 'missing-repo',
    ...single(),
  },
  {
    name: 'evidence: a real in-repo file and line PASSES',
    expect: 'pass',
    repo: 'repo', setup: evidenceRepo,
    ...single({ verification: VERIFIED }),
  },
  {
    name: 'evidence: relative traversal outside the repo FAILS',
    expect: 'fail',
    expectExit: 1,
    repo: 'repo', setup: evidenceRepo,
    ...single({ location: { file: '../outside.ts', line: 1 } }),
  },
  {
    name: 'evidence: symlink escape outside the repo FAILS',
    expect: 'fail',
    expectExit: 1,
    repo: 'repo', setup: (dir) => { evidenceRepo(dir); symlinkSync('../outside.ts', join(dir, 'repo', 'escape.ts')); },
    ...single({ location: { file: 'escape.ts', line: 1 } }),
  },
  {
    name: 'evidence: directory cannot stand in for a cited file FAILS',
    expect: 'fail',
    expectExit: 1,
    repo: 'repo', setup: (dir) => { evidenceRepo(dir); mkdirSync(join(dir, 'repo', 'folder')); },
    ...single({ location: { file: 'folder', line: null } }),
  },
  {
    name: 'evidence: zero is not a source line FAILS',
    expect: 'fail',
    ...single({ location: { file: 'a.ts', line: 0 } }),
  },
  {
    name: 'evidence: secondary citations are checked too FAILS',
    expect: 'fail',
    repo: 'repo', setup: evidenceRepo,
    ...single({ location: { file: 'a.ts', line: 1, others: ['missing.ts:1'] } }),
  },
  {
    name: 'evidence: dropped high refutation cannot cite a missing file FAILS',
    expect: 'fail',
    repo: 'repo', setup: evidenceRepo,
    ledger: [finding({ severity: 'high' })],
    report: report({ reconciliation: { raw: 1, reported: 0, merged: 0, dropped: 1 },
      dropped: [{ id: 'SEC-001', reason: 'Guard prevents the reported failure', verification: { status: 'refuted', evidence: 'missing.ts:1 contains the rejecting guard' } }] }),
  },
  // ---- reconciliation: sets must not conceal duplicate or invented entries ---
  {
    name: 'reconciliation: missing declared counts FAILS',
    expect: 'fail',
    ...single({}, { reconciliation: {} }),
  },
  {
    name: 'reconciliation: duplicate report id cannot disappear into a Set FAILS',
    expect: 'fail',
    ...single({}, { findings: [finding(), finding()] }),
  },
  {
    name: 'reconciliation: duplicate dropped id FAILS',
    expect: 'fail',
    ledger: [finding()],
    report: report({ reconciliation: { raw: 1, reported: 0, merged: 0, dropped: 1 }, dropped: [
      { id: 'SEC-001', reason: 'Not reachable from this application' },
      { id: 'SEC-001', reason: 'Not reachable from this application' },
    ] }),
  },
  {
    name: 'reconciliation: a merged id has exactly one survivor FAILS',
    expect: 'fail',
    ledger: [finding(), finding({ id: 'SEC-002' }), finding({ id: 'SEC-003' })],
    report: report({ reconciliation: { raw: 3, reported: 2, merged: 1, dropped: 0 }, findings: [
      finding({ dedup: { merged_from: ['SEC-003'] } }), finding({ id: 'SEC-002', dedup: { merged_from: ['SEC-003'] } }),
    ] }),
  },
  // ---- coverage: a denominator must be a real count, and a lens an exact id ---
  {
    name: 'coverage: negative file counts FAILS',
    expect: 'fail',
    ...single({}, { coverage: { files_total: -1, files_examined: -1, areas_total: 1, matrix: ['code-audit: complete'] } }),
  },
  {
    name: 'coverage: examined cannot exceed total FAILS',
    expect: 'fail',
    ...single({}, { coverage: { files_total: 1, files_examined: 2, areas_total: 1, matrix: ['code-audit: complete'] } }),
  },
  {
    name: 'coverage: fractional counts FAILS',
    expect: 'fail',
    ...single({}, { coverage: { files_total: 1.5, files_examined: 1.5, areas_total: 1, matrix: ['code-audit: complete'] } }),
  },
  {
    name: 'coverage: fractional area count FAILS',
    expect: 'fail',
    ...single({}, { coverage: { files_total: 1, files_examined: 1, areas_total: 0.5, matrix: ['code-audit: complete'] } }),
  },
  {
    name: 'coverage: substring in a prose row cannot impersonate a lens FAILS',
    expect: 'fail',
    ...single({}, { coverage: { files_total: 1, files_examined: 1, areas_total: 1, matrix: ['not-code-audit: complete'] } }),
  },
  {
    name: 'coverage: exact lens in an object row PASSES',
    expect: 'pass',
    ...single({}, { coverage: { files_total: 1, files_examined: 1, areas_total: 1, matrix: [{ lens: 'code-audit', areas: { source: 'covered' } }] } }),
  },
  {
    name: 'coverage: duplicate lens rows FAILS',
    expect: 'fail',
    ...single({}, { coverage: { files_total: 1, files_examined: 1, areas_total: 1, matrix: ['code-audit: complete', 'code-audit: complete'] } }),
  },
  {
    name: 'roll-call: unknown selected and run lens FAILS',
    expect: 'fail',
    ...single({}, { scope: { lenses_selected: ['code-audit', 'invented'], lenses_run: ['code-audit', 'invented'] } }),
  },
  {
    name: 'roll-call: a lens cannot be both run and deferred FAILS',
    expect: 'fail',
    ...single({}, { scope: { partial: true, lenses_selected: ['code-audit'], lenses_run: ['code-audit'], lenses_deferred: ['code-audit'] } }),
  },
  {
    name: 'roll-call: deferred work cannot masquerade as complete FAILS',
    expect: 'fail',
    ...single({}, { scope: { lenses_selected: ['code-audit', 'performance'], lenses_run: ['code-audit'], lenses_deferred: ['performance'] } }),
  },
  // ---- machine-readable output and argument validation -----------------------
  {
    name: 'json: passing gate emits a single result object PASSES',
    expect: 'pass',
    args: ['--json'], json: true,
    ...single(),
  },
  {
    name: 'json: failing gate retains exit 1 and structured failures FAILS',
    expect: 'fail',
    expectExit: 1,
    args: ['--json'], json: true,
    ...single({ severity: 'high' }),
  },
  {
    name: 'json: unknown flag is an input error with structured output FAILS',
    expect: 'fail',
    expectExit: 2,
    args: ['--json', '--typo'], json: true,
    ...single(),
  },
  {
    name: 'args: missing repo argument is not silently ignored FAILS',
    expect: 'fail',
    expectExit: 2,
    args: ['--repo'],
    ...single(),
  },
  {
    name: 'shape: invalid findings array yields a diagnostic instead of a crash FAILS',
    expect: 'fail',
    expectExit: 1,
    args: ['--json'], json: true,
    ledger: [], report: { findings: {}, dropped: [], reconciliation: {} },
  },
  {
    name: 'evidence: dropped refutation inherited from ledger is still checked FAILS',
    expect: 'fail',
    expectExit: 1,
    repo: 'repo', setup: evidenceRepo,
    ledger: [finding({ severity: 'high', verification: { status: 'refuted', evidence: 'missing.ts:1 contains the rejecting guard' } })],
    report: report({ reconciliation: { raw: 1, reported: 0, merged: 0, dropped: 1 }, dropped: [{ id: 'SEC-001', reason: 'Guard prevents the reported failure' }] }),
  },
  {
    name: 'evidence: symlink to a file inside the repository PASSES',
    expect: 'pass',
    repo: 'repo', setup: (dir) => { evidenceRepo(dir); symlinkSync('a.ts', join(dir, 'repo', 'alias.ts')); },
    ...single({ location: { file: 'alias.ts', line: 1 } }),
  },
  {
    name: 'roll-call: missing selection cannot skip deferred-work checks FAILS',
    expect: 'fail',
    ...single({}, { scope: { lenses_run: ['code-audit'], lenses_deferred: ['performance'] } }),
  },
  {
    name: 'reconciliation: duplicate raw id with a fabricated merge to balance counts FAILS',
    expect: 'fail',
    ledger: [finding(), finding()],
    report: report({ reconciliation: { raw: 2, reported: 1, merged: 1, dropped: 0 }, findings: [finding({ dedup: { merged_from: ['SEC-404'] } })] }),
  },
  {
    name: 'limitations: named visual gaps survive the renderer PASSES',
    expect: 'pass',
    renderIncludes: 'Dark-theme screenshots were not available.',
    ...single({}, { limitations: ['Dark-theme screenshots were not available.'] }),
  },
  {
    name: 'limitations: a non-array must not disappear in rendering FAILS',
    expect: 'fail',
    ...single({}, { limitations: 'No browser was available' }),
  },
  {
    name: 'limitations: empty entries are not coverage explanations FAILS',
    expect: 'fail',
    ...single({}, { limitations: [''] }),
  },
  {
    name: 'limitations: generated filler in the delivered gap section FAILS',
    expect: 'fail',
    ...single({}, { limitations: ['In conclusion no browser was available.'] }),
  },
];

// ---- run --------------------------------------------------------------------
let passed = 0, failed = 0;
for (const c of cases) {
  // fixtureDir cases run the harness against a committed directory verbatim;
  // all other cases build their inputs in a temp dir.
  const dir = c.fixtureDir ? join(HERE, c.fixtureDir) : mkdtempSync(join(tmpdir(), 'audit-test-'));
  try {
    if (!c.fixtureDir) {
      const ledgerText = (c.ledger || []).map((f) => JSON.stringify(f)).join('\n');
      writeFileSync(join(dir, 'raw-findings.jsonl'), ledgerText);
      writeFileSync(join(dir, 'report.json'), c.rawReport != null ? c.rawReport : JSON.stringify(c.report));
    }
    if (c.setup) c.setup(dir);
    const argv = [HARNESS, dir, ...(c.repo ? ['--repo', join(dir, c.repo)] : []), ...(c.args || [])];
    const res = spawnSync(process.execPath, argv, { encoding: 'utf8', timeout: 10000 });
    const got = res.status === 0 ? 'pass' : 'fail';
    const exitOk = c.expectExit == null || res.status === c.expectExit;
    let jsonOk = true;
    if (c.json) {
      try {
        const out = JSON.parse(res.stdout);
        jsonOk = out.format_version === 1 && out.exit_code === res.status && out.ok === (res.status === 0)
          && Array.isArray(out.failures) && Array.isArray(out.warnings)
          && (res.status === 0 ? out.failures.length === 0 : out.failures.length > 0)
          && !res.stderr.trim();
      } catch { jsonOk = false; }
    }
    let renderOk = true;
    if (c.renderIncludes && res.status === 0) {
      const rendered = spawnSync(process.execPath, [join(HERE, 'render-report.mjs'), dir], { encoding: 'utf8', timeout: 10000 });
      renderOk = rendered.status === 0 && rendered.stdout.includes(c.renderIncludes);
    }
    const ok = got === c.expect && exitOk && jsonOk && renderOk && !res.error;
    if (ok) { passed++; console.log(`✔  ${c.name}  (expected ${c.expect}${c.expectExit != null ? `, exit ${c.expectExit}` : ''})`); }
    else {
      failed++;
      console.log(`✖  ${c.name}  — expected ${c.expect}${c.expectExit != null ? ` (exit ${c.expectExit})` : ''}, got ${got} (exit ${res.status})`);
      console.log(res.stdout.split('\n').filter((l) => l.includes('-') || l.includes('✖')).slice(0, 6).map((l) => `       ${l}`).join('\n'));
    }
  } finally {
    if (!c.fixtureDir) rmSync(dir, { recursive: true, force: true });
  }
}

console.log(`\n${'─'.repeat(60)}\n${passed} passed, ${failed} failed, ${cases.length} total`);
process.exit(failed ? 1 : 0);
