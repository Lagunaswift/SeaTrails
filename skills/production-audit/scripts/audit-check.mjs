#!/usr/bin/env node
// =============================================================================
// production-audit integrity harness
// -----------------------------------------------------------------------------
// Validates an audit's raw-findings ledger + final report against the invariants
// that make the audit trustworthy. This is the forcing function: the rules in
// verification-and-severity.md, finding-schema.md, and report-format.md stop
// being things an agent can *claim* to have followed and become things a script
// *checks*.
//
// Pure Node, zero dependencies. Runs in any repo with Node 16+.
//
// Usage:
//   node audit-check.mjs <audit-dir>  [--repo <path>]
//   node audit-check.mjs --ledger <path.jsonl> --report <path.json>  [--repo <path>]
//
//   <audit-dir> must contain:
//     raw-findings.jsonl   one finding JSON per line (the pre-merge raw set)
//     report.json          { scope, coverage, reconciliation, findings:[...], dropped:[...] }
//
// Exit codes:
//   0  all hard invariants hold (warnings may still print)
//   1  at least one hard FAILURE — the audit is NOT trustworthy as-is
//   2  bad input / could not run
// =============================================================================

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const LENSES = new Set([
  'code-audit', 'ai-saas-security', 'scaling-audit', 'release-and-ops', 'data-privacy',
  'frontend-robustness', 'performance', 'accessibility',
  'email-deliverability', 'soc2-compliance', 'adversary-emulation', 'seo-discoverability',
  'mobile-and-responsive', 'analytics-and-instrumentation', 'internationalisation', 'anti-slop-writing',
  'code-quality', 'dependency-audit', 'infrastructure-config',
]);
const CATEGORIES = new Set([
  'security', 'correctness', 'scaling', 'ops', 'privacy', 'performance', 'accessibility',
  'email', 'frontend', 'seo', 'mobile', 'analytics', 'i18n', 'compliance', 'attack-path', 'design-aesthetic', 'content',
  'code-quality', 'supply-chain', 'infrastructure',
]);
const SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'];
const SEV_RANK = Object.fromEntries(SEVERITIES.map((s, i) => [s, i]));
const CONFIDENCE = new Set(['factual', 'reasoning']);
const VSTATUS = new Set(['unverified', 'verified', 'refuted', 'capped']);
const ID_RE = /^[A-Z0-9]+-\d{3,}$/;
// "Real evidence" must reference code: a file:line, or a backtick-quoted span.
const EVIDENCE_LOC = /[\w./\\-]+:\d+/;
const EVIDENCE_CODE = /`[^`]+`/;

// Which categories each lens may legitimately own (primary dimension). A finding
// whose category falls outside its lens's set is a mis-binning — the channel an
// adversary used to hide a critical IDOR under category "analytics".
const LENS_CATEGORIES = {
  'code-audit': ['security', 'correctness', 'frontend', 'performance', 'design-aesthetic'],
  'ai-saas-security': ['security', 'privacy'],
  'scaling-audit': ['scaling', 'ops', 'performance', 'correctness'],
  'release-and-ops': ['ops', 'security'],
  'data-privacy': ['privacy', 'compliance', 'security'],
  'frontend-robustness': ['frontend', 'correctness', 'accessibility'],
  'performance': ['performance'],
  'accessibility': ['accessibility', 'frontend'],
  'email-deliverability': ['email', 'ops'],
  'soc2-compliance': ['compliance', 'security', 'privacy'],
  'adversary-emulation': ['attack-path', 'security'],
  'seo-discoverability': ['seo'],
  'mobile-and-responsive': ['mobile', 'frontend', 'accessibility'],
  'analytics-and-instrumentation': ['analytics', 'privacy'],
  'internationalisation': ['i18n'],
  'anti-slop-writing': ['content'],
  'code-quality': ['code-quality', 'correctness', 'security'],
  'dependency-audit': ['supply-chain', 'security'],
  'infrastructure-config': ['infrastructure', 'security', 'ops'],
};
// Which id prefixes each lens may use (from finding-schema.md's prefix table).
const LENS_PREFIXES = {
  'code-audit': ['SEC', 'COR', 'DBG', 'TST', 'STR', 'UIUX'],
  'ai-saas-security': ['AI'],
  'scaling-audit': ['SCALE'],
  'release-and-ops': ['OPS'],
  'data-privacy': ['PRIV'],
  'frontend-robustness': ['FE'],
  'performance': ['PERF'],
  'accessibility': ['A11Y'],
  'email-deliverability': ['EMAIL'],
  'soc2-compliance': ['SOC2'],
  'adversary-emulation': ['CHAIN'],
  'seo-discoverability': ['SEO'],
  'mobile-and-responsive': ['MOB'],
  'analytics-and-instrumentation': ['ANL'],
  'internationalisation': ['I18N'],
  'anti-slop-writing': ['COPY'],
  'code-quality': ['QUAL'],
  'dependency-audit': ['DEP'],
  'infrastructure-config': ['INFRA'],
};

const failures = [];
const warnings = [];
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);
const prefixOf = (id) => (typeof id === 'string' ? id.replace(/-\d+$/, '') : '');
const hasRealEvidence = (e) =>
  typeof e === 'string' && e.trim().length >= 12 && (EVIDENCE_LOC.test(e) || EVIDENCE_CODE.test(e));
// Extract finding-id patterns from prose (chain steps, issue text, detection_gap).
// Letter-first, then letters or digits: every registered prefix (incl. A11Y, SOC2,
// I18N) must be extractable here, or a dangling reference in prose evades the check.
const FINDING_ID_IN_TEXT = /\b([A-Z][A-Z0-9]{1,5}-\d{3,})\b/g;
const extractReferencedIds = (text) =>
  typeof text === 'string' ? [...text.matchAll(FINDING_ID_IN_TEXT)].map((m) => m[1]) : [];

// ---- arg parsing ------------------------------------------------------------
function parseArgs(argv) {
  const a = argv.slice(2);
  if (a.length === 0) return null;
  const out = {};
  let positional = null;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--ledger' && a[i + 1]) out.ledger = a[++i];
    else if (a[i] === '--report' && a[i + 1]) out.report = a[++i];
    else if (a[i] === '--repo' && a[i + 1]) out.repo = a[++i];
    else if (!positional) positional = a[i];
  }
  if (positional && !out.ledger) {
    out.ledger = join(positional, 'raw-findings.jsonl');
    out.report = out.report || join(positional, 'report.json');
  }
  return (out.ledger && out.report) ? out : null;
}

function readLedger(path) {
  if (!existsSync(path)) { fail(`ledger not found: ${path}`); return []; }
  const lines = readFileSync(path, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  const out = [];
  lines.forEach((line, i) => {
    try { out.push(JSON.parse(line)); }
    catch { fail(`ledger line ${i + 1}: not valid JSON`); }
  });
  return out;
}

function readReport(path) {
  if (!existsSync(path)) { fail(`report not found: ${path}`); return null; }
  let parsed;
  try { parsed = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { fail(`report.json: not valid JSON (${e.message})`); return null; }
  // INVARIANT 0: report must be a well-formed object, not an array or scalar.
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    fail('report.json must be a JSON object with findings/dropped/reconciliation keys (got array or scalar)');
    return null;
  }
  if (!Array.isArray(parsed.findings)) fail('report.json: "findings" must be an array');
  if (!Array.isArray(parsed.dropped)) fail('report.json: "dropped" must be an array');
  if (!parsed.reconciliation || typeof parsed.reconciliation !== 'object') fail('report.json: "reconciliation" object missing');
  return parsed;
}

// ---- INVARIANT 1: schema conformance ---------------------------------------
function checkSchema(f, where) {
  const id = f && f.id ? f.id : '<no id>';
  const tag = `${where} ${id}`;
  if (!f || typeof f !== 'object') { fail(`${where}: finding is not an object`); return; }
  if (!ID_RE.test(f.id || '')) fail(`${tag}: id must match <PREFIX>-<3+digits>`);
  if (!LENSES.has(f.lens)) fail(`${tag}: lens "${f.lens}" not a known lens`);
  if (!CATEGORIES.has(f.category)) fail(`${tag}: category "${f.category}" invalid`);
  if (!SEV_RANK.hasOwnProperty(f.severity)) fail(`${tag}: severity "${f.severity}" invalid`);
  if (!CONFIDENCE.has(f.confidence_type)) fail(`${tag}: confidence_type "${f.confidence_type}" invalid`);
  for (const k of ['title', 'issue', 'consequence', 'fix']) {
    if (typeof f[k] !== 'string' || !f[k].trim()) fail(`${tag}: "${k}" missing or empty`);
  }
  // location
  if (!f.location || typeof f.location !== 'object') fail(`${tag}: location missing`);
  else {
    if (typeof f.location.file !== 'string' || !f.location.file.trim()) fail(`${tag}: location.file missing`);
    if (f.location.line != null && !Number.isInteger(f.location.line)) fail(`${tag}: location.line must be an integer or null`);
    if (f.location.others != null && !Array.isArray(f.location.others)) fail(`${tag}: location.others must be an array`);
  }
  // verification block
  if (!f.verification || typeof f.verification !== 'object') fail(`${tag}: verification block missing`);
  else if (!VSTATUS.has(f.verification.status)) fail(`${tag}: verification.status "${f.verification?.status}" invalid`);
  // id prefix must belong to the owning lens (provenance is traceable)
  if (LENSES.has(f.lens) && ID_RE.test(f.id || '')) {
    const allowed = LENS_PREFIXES[f.lens] || [];
    if (!allowed.includes(prefixOf(f.id))) {
      fail(`${tag}: id prefix "${prefixOf(f.id)}" is not one of lens ${f.lens}'s prefixes [${allowed.join(', ')}]`);
    }
  }
  // category must be plausible for the owning lens (no hiding a critical under a benign dimension)
  if (LENSES.has(f.lens) && CATEGORIES.has(f.category)) {
    const allowedCats = LENS_CATEGORIES[f.lens] || [];
    if (!allowedCats.includes(f.category)) {
      fail(`${tag}: category "${f.category}" is implausible for lens ${f.lens} (allowed: ${allowedCats.join(', ')})`);
    }
  }
}

// ---- INVARIANT 2: severity cannot exceed verification ----------------------
function checkSeverityVerification(f, where = 'report') {
  const v = f.verification || {};
  const isHigh = f.severity === 'critical' || f.severity === 'high';
  // design-aesthetic (visual/polish) and content (user-facing copy quality) are product-credibility axes,
  // not readiness blockers — both hard-capped at medium. NOTE: this caps ONLY purely-aesthetic / purely-copy
  // findings. Interaction/robustness failures (frontend / accessibility) and copy that causes a real failure
  // (misleading legal text → compliance, wrong instructions → correctness) must be categorised by consequence,
  // NOT design-aesthetic/content, so they keep their real high/critical.
  if (f.category === 'design-aesthetic' && isHigh) {
    fail(`${f.id}: design-aesthetic finding at ${f.severity} — visual/polish caps at medium/low/info. If this is really an interaction/robustness failure (broken state, no confirm, keyboard trap), recategorise it as frontend/accessibility so it keeps its severity.`);
  }
  if (f.category === 'content' && isHigh) {
    fail(`${f.id}: content finding at ${f.severity} — user-facing copy quality caps at medium/low/info. If the copy causes a real failure (misleading legal disclaimer, instructions that lose data, an error message that breaks a flow), recategorise it by consequence (compliance/correctness/frontend) so it keeps its severity.`);
  }
  // "verified" means code was read — demand real evidence AT ANY severity.
  if (v.status === 'verified' && !hasRealEvidence(v.evidence)) {
    fail(`${f.id}: marked verified but evidence is not real (needs a file:line or backtick code span, ≥12 chars) — quote what you read`);
  }
  // "capped" can never sit at critical/high (it means "couldn't verify, dropped to medium").
  if (v.status === 'capped' && isHigh) {
    fail(`${f.id}: ${f.severity} with verification.status="capped" — capped findings cap at medium/low/info, never high/critical`);
  }
  // critical/high must be verified-with-evidence or capped (and capped already failed above if high).
  if (isHigh && v.status !== 'verified' && v.status !== 'capped') {
    fail(`${f.id}: ${f.severity} severity with verification.status="${v.status}" — must be verified (with evidence) or capped at medium`);
  }
  // reasoning-typed crit/high must carry a note (the inference must be stated) and is surfaced for human confirmation.
  if (isHigh && f.confidence_type === 'reasoning') {
    if (!v.note || !String(v.note).trim()) fail(`${f.id}: reasoning-typed ${f.severity} must carry a verification.note tracing the inference`);
    warn(`${f.id}: reasoning-typed ${f.severity} — a consequence-chain inference; confirm against the code before acting`);
  }
}

// ---- INVARIANT 3: post-verification honesty --------------------------------
function checkPostVerification(f) {
  if (f.added_post_verification === true && (f.severity === 'critical' || f.severity === 'high')) {
    const v = f.verification || {};
    if (v.status !== 'verified') {
      fail(`${f.id}: added_post_verification finding at ${f.severity} but not re-verified — cap at medium or route back through Stage 4`);
    }
  }
}

// ---- INVARIANT 4: reconciliation — no finding silently lost ----------------
function checkReconciliation(ledger, report, ledgerById) {
  if (!report) return;
  const reported = new Set((report.findings || []).map((f) => f.id));
  const mergedAway = new Set();
  for (const f of report.findings || []) {
    for (const m of (f.dedup && f.dedup.merged_from) || []) mergedAway.add(m);
  }
  const dropped = new Set((report.dropped || []).map((d) => d.id));

  // Every raw ledger id must have exactly one disposition.
  for (const f of ledger) {
    if (!f || !f.id) continue;
    const n = [reported.has(f.id), mergedAway.has(f.id), dropped.has(f.id)].filter(Boolean).length;
    if (n === 0) fail(`reconciliation: raw finding ${f.id} has NO disposition (not reported, merged, or dropped) — a lost finding`);
    if (n > 1) fail(`reconciliation: raw finding ${f.id} has ${n} dispositions — must be exactly one`);
  }
  // Every reported finding must trace to the ledger (unless explicitly post-verification).
  for (const f of report.findings || []) {
    if (!ledgerById[f.id] && f.added_post_verification !== true) {
      fail(`reconciliation: reported finding ${f.id} is not in the ledger and not flagged added_post_verification — untraceable`);
    }
  }
  // Dropped entries need a substantive reason; dropping a ledger crit/high needs a refutation with evidence.
  for (const d of report.dropped || []) {
    if (!d.reason || String(d.reason).trim().length < 8) fail(`reconciliation: dropped ${d.id} needs a substantive reason (≥8 chars)`);
    const orig = ledgerById[d.id];
    if (orig && (orig.severity === 'critical' || orig.severity === 'high')) {
      const v = d.verification || orig.verification || {};
      if (v.status !== 'refuted' || !hasRealEvidence(v.evidence)) {
        fail(`reconciliation: dropping ${d.id} (was ${orig.severity}) requires verification.status="refuted" with real evidence — prove the false positive`);
      }
    }
  }
  // Arithmetic must balance against the stated reconciliation block.
  const r = report.reconciliation || {};
  const counted = { raw: ledger.length, reported: reported.size, merged: mergedAway.size, dropped: dropped.size };
  for (const k of ['raw', 'reported', 'merged', 'dropped']) {
    if (typeof r[k] === 'number' && r[k] !== counted[k]) fail(`reconciliation: stated ${k}=${r[k]} but actual ${k}=${counted[k]}`);
  }
  if (counted.reported + counted.merged + counted.dropped !== counted.raw) {
    fail(`reconciliation: reported(${counted.reported}) + merged(${counted.merged}) + dropped(${counted.dropped}) != raw(${counted.raw})`);
  }
}

// ---- INVARIANT 5: severity may not be laundered between ledger and report --
function checkSeverityLaundering(report, ledgerById) {
  if (!report) return;
  for (const f of report.findings || []) {
    const orig = ledgerById[f.id];
    // (a) same id silently downgraded
    if (orig && SEV_RANK[f.severity] < SEV_RANK[orig.severity]) {
      const v = f.verification || {};
      if (v.verifier_disagreed !== true || !v.note || !String(v.note).trim()) {
        fail(`${f.id}: severity downgraded ${orig.severity}→${f.severity} without a recorded calibration (set verifier_disagreed=true and explain in note)`);
      }
    }
    // (b) a survivor must take the max severity of everything merged into it
    for (const mid of (f.dedup && f.dedup.merged_from) || []) {
      const m = ledgerById[mid];
      if (m && SEV_RANK[f.severity] < SEV_RANK[m.severity]) {
        fail(`${f.id}: survivor at ${f.severity} but absorbed ${mid} at ${m.severity} — a survivor must take the highest severity of its merged findings (else a critical is laundered into a benign finding)`);
      }
    }
  }
}

// ---- INVARIANT 6: attack chains reference RECONCILED findings ---------------
// Chains must reference the post-reconciliation finding set. A finding that was
// refuted (dropped) or absorbed (merged) cannot anchor a chain — the underlying
// claim is gone or lives under a new id. The harness enforces: reconcile first,
// then synthesise chains, then validate references. A dangling chain reference
// (component id absent from the reconciled reported set) blocks report delivery.
function checkChains(ledger, report, ledgerById) {
  const ledgerIds = new Set(ledger.map((f) => f && f.id).filter(Boolean));
  const reportedIds = new Set((report?.findings || []).map((f) => f && f.id).filter(Boolean));
  const droppedIds = new Set((report?.dropped || []).map((d) => d && d.id).filter(Boolean));
  const mergedToSurvivor = Object.create(null);
  for (const f of report?.findings || []) {
    for (const m of (f.dedup && f.dedup.merged_from) || []) mergedToSurvivor[m] = f.id;
  }
  for (const f of report?.findings || []) {
    const hasBlock = !!f.chain;
    const isAttack = f.category === 'attack-path';
    if (isAttack && !hasBlock) fail(`${f.id}: category attack-path but no chain block`);
    if (hasBlock && !isAttack) fail(`${f.id}: has a chain block but category is "${f.category}" (must be attack-path)`);
    if (hasBlock) {
      // 6a: component_findings — provenance (in ledger) AND reconciliation (in reported set)
      for (const c of f.chain.component_findings || []) {
        if (c === f.id) { fail(`${f.id}: chain component references itself`); continue; }
        if (!ledgerIds.has(c)) { fail(`${f.id}: chain component ${c} is not in the ledger`); continue; }
        if (!reportedIds.has(c)) {
          if (droppedIds.has(c)) {
            fail(`${f.id}: chain component ${c} was DROPPED during reconciliation (verifier refuted it) — the chain references a finding absent from the report; re-synthesise the chain without it or downgrade`);
          } else if (mergedToSurvivor[c]) {
            fail(`${f.id}: chain component ${c} was MERGED into ${mergedToSurvivor[c]} during reconciliation — rewrite the reference to the surviving parent id`);
          } else {
            fail(`${f.id}: chain component ${c} is in the ledger but absent from the reconciled set — dangling reference`);
          }
        }
      }
      // 6b: dangling id references in chain prose (issue, steps, detection_gap)
      const textIds = new Set();
      for (const id of extractReferencedIds(f.issue)) textIds.add(id);
      for (const step of f.chain.steps || []) {
        for (const id of extractReferencedIds(step)) textIds.add(id);
      }
      for (const id of extractReferencedIds(f.chain.detection_gap)) textIds.add(id);
      textIds.delete(f.id);
      for (const ref of textIds) {
        if (ledgerIds.has(ref) && !reportedIds.has(ref)) {
          if (droppedIds.has(ref)) {
            fail(`${f.id}: chain text references ${ref} which was DROPPED during reconciliation — update the prose or re-synthesise`);
          } else if (mergedToSurvivor[ref]) {
            fail(`${f.id}: chain text references ${ref} which was MERGED into ${mergedToSurvivor[ref]} — rewrite to the surviving parent id`);
          }
        }
      }
      // 6c: severity_basis — if present, every id must be a reconciled reported finding
      if (Array.isArray(f.chain.severity_basis)) {
        for (const sb of f.chain.severity_basis) {
          if (sb !== f.id && !reportedIds.has(sb)) {
            fail(`${f.id}: chain.severity_basis references ${sb} which is not in the reconciled finding set — severity cannot rest on an absent constituent`);
          }
        }
      }
      // 6d: root_cause_finding — a re-narrated chain folds into ONE reported defect
      const rc = f.chain.root_cause_finding;
      if (rc != null && rc !== '') {
        if (typeof rc !== 'string') {
          fail(`${f.id}: chain.root_cause_finding must be a string id (or null for an emergent chain)`);
        } else {
          if (rc === f.id) fail(`${f.id}: chain.root_cause_finding references the chain itself`);
          if (!reportedIds.has(rc)) fail(`${f.id}: chain.root_cause_finding ${rc} is not a reported finding — a re-narrated chain must fold into a finding that is actually in the report (else it is hidden)`);
          if (!(f.chain.component_findings || []).includes(rc)) fail(`${f.id}: chain.root_cause_finding ${rc} must also be one of this chain's component_findings (the root cause is part of the chain)`);
        }
      }
    }
  }
}

// ---- INVARIANT 8: a legal data-protection duty cannot be excluded as not-applicable ----
// When Stage 0 detects a regulated data class (special-category / financial / children / gov-id),
// a data-protection duty is in scope BY DATA CLASS under whatever framework governs that data in
// the app's jurisdiction (GDPR/UK GDPR, HIPAA, PCI-DSS, COPPA, CCPA/CPRA, …) — regardless of any
// stated compliance goal. The failure this prevents: folding that live legal duty into a one-line
// "compliance: not applicable — no stated SOC 2 goal." Certification is deferrable; the duty is not.
// (The check is framework-agnostic: it keys off the data class, not any one statute.)
const REGULATED_CLASS_RE = /(special-category|biometric|genetic|\bhealth\b|financial|children|minor|government-id|location)/;
function checkComplianceDuty(report) {
  if (!report) return;
  const sp = report.stack_profile || {};
  const classes = Array.isArray(sp.data_classes) ? sp.data_classes.map((c) => String(c).toLowerCase()) : [];
  const regulated = classes.filter((c) => REGULATED_CLASS_RE.test(c));
  if (!regulated.length) return; // no regulated class → no special duty (standard data-privacy still runs)
  const scope = report.scope || {};
  const lensesRun = new Set(scope.lenses_run || []);
  const excluded = (scope.excluded_not_applicable && typeof scope.excluded_not_applicable === 'object' && !Array.isArray(scope.excluded_not_applicable))
    ? scope.excluded_not_applicable : {};
  const hasComplianceFinding = (report.findings || []).some((f) => f && f.category === 'compliance');
  const covered = lensesRun.has('soc2-compliance') || hasComplianceFinding || scope.compliance_duty_in_scope === true;
  if (Object.prototype.hasOwnProperty.call(excluded, 'soc2-compliance') && !covered) {
    fail(`compliance-duty: regulated data class(es) [${regulated.join(', ')}] present, but soc2-compliance is listed in excluded_not_applicable and there is no compliance coverage. A legal data-protection duty (under the framework that applies to this data and jurisdiction — GDPR / HIPAA / PCI-DSS / COPPA / CCPA, etc.) is in scope BY DATA CLASS, not by stated goal — fold it out of "not applicable", run the data-protection-duty pass, or record a category:"compliance" finding for the gap. (SOC 2 certification may be deferred; the duty may not.)`);
    return;
  }
  if (!covered) {
    fail(`compliance-duty: regulated data class(es) [${regulated.join(', ')}] present but no data-protection-duty coverage — run soc2-compliance (data-protection-duty mode), set scope.compliance_duty_in_scope=true with the gap reported, or record at least one category:"compliance" finding. The duty is in scope by data class, not by stated goal.`);
  }
}

// ---- INVARIANT 7: roll-call — selected lenses actually ran -----------------
function checkRollCall(report) {
  if (!report) return;
  const scope = report.scope || {};
  const selected = scope.lenses_selected;
  const run = new Set(scope.lenses_run || []);
  if (!Array.isArray(selected)) {
    warn('roll-call: report.scope.lenses_selected not recorded — cannot verify every selected lens ran');
    return;
  }
  const deferred = new Set(scope.lenses_deferred || []);
  for (const lens of selected) {
    if (!run.has(lens) && !deferred.has(lens)) {
      fail(`roll-call: lens "${lens}" was selected but is neither in lenses_run nor lenses_deferred — a silently-skipped lens (mark it deferred for a partial run, or run it)`);
    }
  }
  if (deferred.size > 0 && scope.partial !== true) {
    warn(`roll-call: ${deferred.size} lens(es) deferred but report not marked scope.partial=true — a partial audit should say so`);
  }
}

// ---- INVARIANT 9: coverage — must be measured and, if incomplete, acknowledged
function checkCoverage(report, ledger) {
  if (!report) return;
  if (ledger.length === 0) warn('ledger is empty — no findings at all; confirm the pipeline actually ran (valid only for a truly trivial/static repo)');
  const c = report.coverage;
  if (!c) { fail('coverage: no coverage block in report — "all issues" is unmeasured and the audit cannot claim coverage'); return; }
  if (typeof c.files_total === 'number' && typeof c.files_examined === 'number') {
    if (c.files_examined < c.files_total) {
      const pct = ((c.files_examined / c.files_total) * 100).toFixed(0);
      const scope = report.scope || {};
      if (scope.partial !== true) {
        fail(`coverage: ${c.files_examined}/${c.files_total} source files examined (${pct}%) but report is not marked scope.partial=true — either examine the rest or acknowledge the gap`);
      } else {
        warn(`coverage: ${c.files_examined}/${c.files_total} source files examined (${pct}%) — partial run acknowledged; name the remainder in "what could not be assessed"`);
      }
    }
  } else {
    fail('coverage: files_total/files_examined not reported — coverage has no denominator');
  }
  // The lens × area matrix (coverage-matrix.md): when lenses ran, per-lens
  // coverage must be stated, not implied. A run lens with no row is unmeasured;
  // a row for a lens that neither ran nor was deferred is coverage padding.
  const run = (report.scope && report.scope.lenses_run) || [];
  const deferred = (report.scope && report.scope.lenses_deferred) || [];
  if (run.length === 0) return;
  const rows = Array.isArray(c.matrix) ? c.matrix : null;
  if (!rows || rows.length === 0) {
    fail(`coverage: lenses ran (${run.join(', ')}) but coverage.matrix is ${rows ? 'empty' : 'missing'} — state each lens's coverage per area (coverage-matrix.md)`);
    return;
  }
  // Object rows are matched on their lens field; string rows on their text.
  const rowTexts = rows.map((r) => (typeof r === 'string' ? r : (r && typeof r.lens === 'string' ? r.lens : JSON.stringify(r))));
  for (const lens of run) {
    if (!rowTexts.some((t) => t.includes(lens))) {
      fail(`coverage: lens "${lens}" ran but has no row in coverage.matrix — its coverage is unmeasured`);
    }
  }
  const inScope = new Set([...run, ...deferred]);
  for (const t of rowTexts) {
    for (const lens of LENSES) {
      if (t.includes(lens) && !inScope.has(lens)) {
        fail(`coverage: matrix row mentions "${lens}", which neither ran nor was deferred — coverage claimed for a lens that did not run`);
      }
    }
  }
  if (!(typeof c.areas_total === 'number' && c.areas_total > 0)) {
    fail('coverage: matrix present but areas_total is missing or not a positive number — the area denominator (coverage-matrix.md)');
  }
}

// ---- INVARIANT 10: remediation order — every gating finding has a fix position
function gatingFindingIds(report) {
  if (!report) return new Set();
  const reportedIds = new Set((report.findings || []).map((f) => f.id));
  const renarrated = new Set();
  for (const f of report.findings || []) {
    const rc = f.category === 'attack-path' && f.chain ? f.chain.root_cause_finding : null;
    if (rc && typeof rc === 'string' && rc !== f.id && reportedIds.has(rc)) renarrated.add(f.id);
  }
  const gating = new Set();
  for (const f of report.findings || []) {
    if ((f.severity === 'critical' || f.severity === 'high') &&
        f.category !== 'design-aesthetic' && f.category !== 'content' &&
        !renarrated.has(f.id)) {
      gating.add(f.id);
    }
  }
  return gating;
}

function checkRemediationOrder(report) {
  if (!report) return;
  const gating = gatingFindingIds(report);
  if (gating.size === 0) return;
  const order = report.remediation_order;
  if (!Array.isArray(order)) {
    fail(`remediation-order: ${gating.size} gating finding(s) but no remediation_order array in report.json`);
    return;
  }
  const ordered = new Set();
  for (const entry of order) {
    if (!entry || typeof entry.id !== 'string') { fail('remediation-order: entry missing an id'); continue; }
    if (ordered.has(entry.id)) warn(`remediation-order: duplicate entry ${entry.id}`);
    ordered.add(entry.id);
    if (typeof entry.reason !== 'string' || !entry.reason.trim()) {
      fail(`remediation-order: ${entry.id} has no reason — the ordering must be justified`);
    }
  }
  for (const id of gating) {
    if (!ordered.has(id)) {
      fail(`remediation-order: gating finding ${id} is not in the remediation order`);
    }
  }
}

// ---- INVARIANT 11: evidence file verification (requires --repo) -------------
function checkEvidenceFiles(report, repoRoot) {
  if (!repoRoot || !report) return;
  if (!existsSync(repoRoot)) { warn(`evidence-files: --repo path "${repoRoot}" does not exist — skipping`); return; }
  const checked = new Set();
  const checkFile = (id, file, line, src) => {
    const key = `${file}:${line || ''}`;
    if (checked.has(key)) return;
    checked.add(key);
    if (file.length < 2 || /^https?:?$/i.test(file)) return;
    const fullPath = join(repoRoot, file);
    if (!existsSync(fullPath)) {
      fail(`${id}: ${src} cites ${file} but the file does not exist in the repo`);
      return;
    }
    if (line != null) {
      const lineCount = readFileSync(fullPath, 'utf8').split('\n').length;
      if (line > lineCount) {
        fail(`${id}: ${src} cites ${file}:${line} but the file has only ${lineCount} lines`);
      }
    }
  };
  for (const f of report.findings || []) {
    if (f.location && typeof f.location.file === 'string') {
      checkFile(f.id, f.location.file, f.location.line, 'location');
    }
    const v = f.verification || {};
    if (v.status === 'verified' && typeof v.evidence === 'string') {
      for (const m of v.evidence.matchAll(/([\w.\/\\-]+):(\d+)/g)) {
        const [, file, lineStr] = m;
        if (file.length >= 2 && !/^https?:?$/i.test(file)) {
          checkFile(f.id, file, parseInt(lineStr, 10), 'evidence');
        }
      }
    }
  }
}

// ---- INVARIANT 12: prose quality — the harness watches the watchman ---------
const SLOP_HARD = [
  [/\bdelve/i, 'filler verb'],
  [/\bdeep dive\b/i, 'filler'],
  [/\b(?:dive|diving) (?:deep|into?)\b/i, 'filler'],
  [/\bunpack (?:this|that|what|the)\b/i, 'filler'],
  [/\bit(?:'s| is) (?:worth|important|crucial) (?:to )?not(?:e|ing)\b/i, 'throat-clearing'],
  [/\bit bears mentioning\b/i, 'throat-clearing'],
  [/\bit should be noted\b/i, 'throat-clearing'],
  [/\blet(?:'s| us) (?:break this down|unpack|explore|dive)\b/i, 'pedagogical filler'],
  [/\bhere(?:'s| is) (?:the (?:kicker|thing)|where it gets|what (?:most|many))\b/i, 'false suspense'],
  [/\bwithout further ado\b/i, 'filler'],
  [/\bin conclusion\b/i, 'signposted conclusion'],
  [/\bto sum(?:marise|marize| up)\b/i, 'signposted conclusion'],
  [/\bin summary\b/i, 'signposted conclusion'],
  [/\bexperts? (?:agree|argue|believe|suggest)\b/i, 'false authority'],
  [/\bstudies show\b/i, 'false authority'],
  [/\bresearch suggests\b/i, 'false authority'],
  [/\bindustry reports? suggest\b/i, 'false authority'],
  [/\bit is widely (?:known|understood|accepted)\b/i, 'false authority'],
  [/\bneedless to say\b/i, 'false authority'],
  [/\bgame[- ]?chang(?:er|ing)\b/i, 'marketing language'],
  [/\bparadigm shift\b/i, 'jargon'],
  [/\bcutting[- ]?edge\b/i, 'marketing language'],
  [/\bstate[- ]?of[- ]?the[- ]?art\b/i, 'marketing language'],
  [/\bbest[- ]?in[- ]?class\b/i, 'marketing language'],
  [/\bworld[- ]?class\b/i, 'marketing language'],
  [/\bnext[- ]?level\b/i, 'marketing language'],
  [/\btransformative\b/i, 'marketing language'],
  [/\bsupercharg/i, 'marketing language'],
  [/\bsynerg(?:y|ies|istic)\b/i, 'jargon'],
  [/\bthrilled\b/i, 'performative enthusiasm'],
  [/\bpassionate about\b/i, 'performative enthusiasm'],
  [/\bincredibly rewarding\b/i, 'performative enthusiasm'],
  [/\bamazing opportunity\b/i, 'performative enthusiasm'],
  [/\bin today(?:'s| is) (?:world|fast|rapid|ever)/i, 'AI throat-clearing'],
  [/\bin the modern era\b/i, 'AI throat-clearing'],
  [/\bnavigate the complexit/i, 'AI filler'],
  [/\ba testament to\b/i, 'AI filler'],
  [/\bshed(?:s|ding)? (?:new )?light on\b/i, 'AI filler'],
  [/\bpave(?:s|d|ing)? the way\b/i, 'AI filler'],
  [/\bthe key takeaway is\b/i, 'AI filler'],
  [/\bthink of it (?:as|like)\b/i, 'patronising analogy'],
  [/\bimagine a world where\b/i, 'AI futurism'],
  [/\btruly (?:remarkable|incredible|important|significant)\b/i, 'hollow intensifier'],
  [/\babsolutely (?:essential|critical|crucial|vital)\b/i, 'hollow intensifier'],
  [/\butterly\b/i, 'hollow intensifier'],
  [/\bprofoundly\b/i, 'hollow intensifier'],
  [/\brich tapestry\b/i, 'AI metaphor tell'],
  [/\bserves as a (?:reminder|testament|beacon)\b/i, 'pompous copula'],
  [/\bstands as a (?:reminder|testament|beacon)\b/i, 'pompous copula'],
  [/\bdespite (?:these|its|this|those) challenges?\b/i, 'AI dismiss pattern'],
];

const SLOP_WARN = [
  [/\bleverage(?:s|d)?\b/i, 'use "use" or "exploit"'],
  [/\butilit?[sz]e\b/i, 'use "use"'],
  [/\bfacilitat/i, 'use "enable" or "allow"'],
  [/\bfoster(?:s|ed|ing)?\b/i, 'use "build" or "encourage"'],
  [/\bempower(?:s|ed|ing)?\b/i, 'use "enable"'],
  [/\bseamless(?:ly)?\b/i, 'marketing language'],
  [/\bholistic(?:ally)?\b/i, 'jargon'],
  [/\brobust\b/i, 'is "strong" or "thorough" more specific?'],
  [/\btapestry\b/i, 'AI metaphor tell'],
  [/\blandscape of\b/i, 'AI filler — name the actual domain'],
];

function checkProse(report) {
  if (!report) return;
  const fields = [];
  if (typeof report.summary === 'string') fields.push({ src: 'summary', text: report.summary });
  for (const f of report.findings || []) {
    for (const k of ['title', 'issue', 'consequence', 'fix']) {
      if (typeof f[k] === 'string') fields.push({ src: `${f.id}.${k}`, text: f[k] });
    }
  }
  for (const d of report.dropped || []) {
    if (typeof d.reason === 'string') fields.push({ src: `dropped:${d.id}.reason`, text: d.reason });
  }
  for (const { src, text } of fields) {
    for (const [re, why] of SLOP_HARD) {
      const m = text.match(re);
      if (m) fail(`prose: ${src} — "${m[0]}" (${why}). Rewrite to be direct.`);
    }
    for (const [re, why] of SLOP_WARN) {
      const m = text.match(re);
      if (m) warn(`prose: ${src} — "${m[0]}" (${why})`);
    }
  }
}

// ---- run --------------------------------------------------------------------
const args = parseArgs(process.argv);
if (!args || !args.ledger || !args.report) {
  console.error('usage: node audit-check.mjs <audit-dir>  |  --ledger <f.jsonl> --report <f.json>  [--repo <path>]');
  process.exit(2);
}

const ledger = readLedger(args.ledger);
const report = readReport(args.report);
const ledgerById = Object.create(null);
for (const f of ledger) { if (f && f.id) ledgerById[f.id] = f; }

// Schema over the ledger (raw findings must be well-formed). Severity/verification
// is enforced per-disposition: reported findings are checked directly below; merged
// findings are covered by the laundering check (survivor takes their max severity,
// then must be verified); dropped crit/high are covered by the drop-refutation rule.
for (const f of ledger) checkSchema(f, 'ledger');
for (const f of (report?.findings) || []) {
  checkSchema(f, 'report');
  checkSeverityVerification(f, 'report');
  checkPostVerification(f);
}
checkReconciliation(ledger, report, ledgerById);
checkSeverityLaundering(report, ledgerById);
checkChains(ledger, report, ledgerById);
checkRollCall(report);
checkComplianceDuty(report);
checkCoverage(report, ledger);
checkRemediationOrder(report);
checkEvidenceFiles(report, args.repo);
checkProse(report);

// ---- output -----------------------------------------------------------------
const line = '─'.repeat(70);
console.log(line);
console.log(`production-audit integrity check`);
console.log(`  ledger:  ${args.ledger}  (${ledger.length} raw findings)`);
console.log(`  report:  ${args.report}  (${report?.findings?.length ?? 0} reported findings)`);
if (args.repo) console.log(`  repo:    ${args.repo}  (evidence file verification enabled)`);
console.log(line);
if (warnings.length) {
  console.log(`\n⚠  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`   - ${w}`);
}
if (failures.length) {
  console.log(`\n✖  ${failures.length} HARD FAILURE(S) — audit is not trustworthy until resolved:`);
  for (const f of failures) console.log(`   - ${f}`);
  console.log(`\n${line}`);
  process.exit(1);
}
console.log(`\n✔  all hard invariants hold${warnings.length ? ' (see warnings above)' : ''}.`);
console.log(line);
process.exit(0);
