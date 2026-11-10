#!/usr/bin/env node
// =============================================================================
// render-report.mjs — generate the human-readable audit report FROM report.json
// -----------------------------------------------------------------------------
// The method line, counts, severity tiers, coverage matrix, and reconciliation
// are all computed from the validated report.json, so the prose a reader trusts
// cannot diverge from the data the harness gated. This command gates its own
// input snapshot before printing any report.
//
//   node render-report.mjs <audit-dir> --repo <repo> --assurance <evidence-dir>
//   node render-report.mjs <historical-audit-dir> --legacy
//
// Pure Node, zero dependencies.
// =============================================================================

import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const SEV_RANK = Object.fromEntries(SEV_ORDER.map((s, i) => [s, i]));
// Presentation labels from the website profile catalogue, not report input.
const WEBSITE_FEATURE_NAMES = new Map([
  'Dark mode', 'Language switcher', 'Back-to-top', 'Reading progress/time',
  'Copy/share', 'Save-for-later/recently-viewed', 'Shortcuts', 'Custom text sizing',
  'Interactive tables', 'Search/filter/sort', 'Expandable/searchable FAQs', 'Autosave/drafts',
  'Password visibility', 'Contents navigation', 'Offline access', 'Rich tooltips',
  'Loading animation', 'Sticky header/CTA or floating contact', 'Print treatment', 'Confirmation',
  'Before-and-after gallery', 'Cart reminders', 'A/B tests', 'llms.txt',
].map((name, index) => [`OPT-${String(index + 1).padStart(2, '0')}`, name]));
let R, gate, args = {};
let snapshot;
try {
  const argv = process.argv.slice(2);
  let dir;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--legacy') { if (args.legacy) throw Error('duplicate --legacy'); args.legacy = true; }
    else if (['--report', '--ledger', '--repo', '--assurance'].includes(flag)) {
      const key = flag.slice(2);
      if (args[key] || !argv[i + 1] || argv[i + 1].startsWith('-')) throw Error(`invalid ${flag}`);
      args[key] = argv[++i];
    } else if (flag.startsWith('-') || dir) throw Error(`unexpected argument ${flag}`);
    else dir = flag;
  }
  if (dir) {
    if (args.report || args.ledger) throw Error('use directory OR --report/--ledger');
    args.report = join(dir, 'report.json'); args.ledger = join(dir, 'raw-findings.jsonl');
  }
  if (!args.report || !args.ledger) throw Error('supply audit directory or --report and --ledger');
  if (!args.legacy && (!args.repo || !args.assurance)) throw Error('delivery requires --repo and --assurance; --legacy explicitly renders a limited historical audit');
  if (args.legacy && args.assurance) throw Error('--legacy and --assurance are mutually exclusive');
  // Gate and render the SAME bytes. A report replaced during validation cannot be delivered.
  const reportBytes = readFileSync(args.report);
  const ledgerBytes = readFileSync(args.ledger);
  snapshot = mkdtempSync(join(tmpdir(), 'seatrial-render-'));
  writeFileSync(join(snapshot, 'report.json'), reportBytes);
  writeFileSync(join(snapshot, 'raw-findings.jsonl'), ledgerBytes);
  const command = [fileURLToPath(new URL('./audit-check.mjs', import.meta.url)), snapshot, '--json'];
  if (args.repo) command.push('--repo', args.repo);
  if (args.assurance) command.push('--assurance', args.assurance);
  const result = spawnSync(process.execPath, command, { encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  gate = JSON.parse(result.stdout);
  if (result.status !== 0 || !gate.ok) {
    console.error((gate.failures || ['validation failed']).join('\n'));
    process.exitCode = 1;
  } else R = JSON.parse(reportBytes.toString('utf8'));
} catch (e) { console.error(`cannot render report: ${e.message}`); process.exitCode = 2; }
finally { if (snapshot) rmSync(snapshot, { recursive: true, force: true }); }
if (!R) process.exit(process.exitCode || 1);

const findings = Array.isArray(R.findings) ? R.findings : [];
const dropped = Array.isArray(R.dropped) ? R.dropped : [];
const scope = R.scope || {};
const cov = R.coverage || {};
const rec = R.reconciliation || {};
const website = cov.website_readiness;
const websiteGaps = [];

// ---- chain collapse: re-narrated attack chains fold into their root-cause finding ----
// A chain carrying chain.root_cause_finding (pointing at a reported finding) is the attack-path
// RE-NARRATION of one already-reported defect, not a second defect. Fold its narrative into the
// root cause's entry and exclude it from the tier counts, so the report counts DISTINCT DEFECTS,
// not findings. Emergent chains (root_cause_finding null/absent) stay as their own findings.
const reportedIds = new Set(findings.map((f) => f.id));
const collapsedChainIds = new Set();
const attachmentsByRoot = new Map(); // rootId -> [chainFinding, ...]
for (const f of findings) {
  const rc = f.category === 'attack-path' && f.chain ? f.chain.root_cause_finding : null;
  if (rc && typeof rc === 'string' && rc !== f.id && reportedIds.has(rc)) {
    collapsedChainIds.add(f.id);
    if (!attachmentsByRoot.has(rc)) attachmentsByRoot.set(rc, []);
    attachmentsByRoot.get(rc).push(f);
  }
}
// Polish axes (visual design + user-facing copy) report in their own capped section, never the tiers.
const POLISH = new Set(['design-aesthetic', 'content']);
// A finding is visible in the readiness tiers if it is not a polish-axis finding (its own section)
// and not a re-narrated chain folded into its root cause.
const visible = (f) => !POLISH.has(f.category) && !collapsedChainIds.has(f.id);

// ---- counts computed from the data (the method line cannot lie) -------------
const verified = findings.filter((f) => f.verification?.status === 'verified').length;
const capped = findings.filter((f) => f.verification?.status === 'capped').length;
const downgraded = findings.filter((f) => f.verification?.verifier_disagreed === true).length;
// The gating set = DISTINCT critical/high defects (folded chains and design-aesthetic excluded).
// This is the headline, not the raw total — leading with the raw total is the inflated-count failure.
const gating = findings.filter((f) => (f.severity === 'critical' || f.severity === 'high') && visible(f));
const gatingCrit = gating.filter((f) => f.severity === 'critical').length;
const gatingHigh = gating.filter((f) => f.severity === 'high').length;
const gatingReasoning = gating.filter((f) => f.confidence_type === 'reasoning').length;
const backlog = findings.filter((f) => (f.severity === 'medium' || f.severity === 'low') && visible(f));
const backlogReasoning = backlog.filter((f) => f.confidence_type === 'reasoning').length;
const bySev = (s) => findings.filter((f) => f.severity === s && visible(f)).sort((a, b) => (a.id < b.id ? -1 : 1));
const out = [];
const w = (s = '') => out.push(s);
// Observation summaries come from the gate's own result, never from report prose.
const observations = gate.assurance?.observations || [];
const observationById = new Map(observations.map((o) => [o.id, o]));
const BASIS_LABEL = { 'source-quote': 'source quotation', 'static-search': 'replayed static search', 'runtime-observation': 'runtime observation (no control; behaviour seen, not tied to the cited code)',
  'runtime-reproduction': 'runtime reproduction (deviation on the snapshot, repeated, and gone under a control change confined to the cited files)', 'simulated-test': 'simulated test (the snapshot code was not executed)' };
const describeObservation = (o) => o.kind === 'search'
  ? `${o.id} search /${o.pattern}/${o.flags || ''} over ${o.files_scanned} file(s)${o.include?.length ? ` under ${o.include.join(', ')}` : ''}, expected ${o.expect}: ${o.match_count} match(es), expectation ${o.holds ? 'held' : 'FAILED'}` +
    (o.binary_skipped || o.long_lines_truncated ? ` (${o.binary_skipped} binary file(s) skipped, ${o.long_lines_truncated} long line(s) truncated)` : '')
  : `${o.id} ${o.surface} probe (${o.fidelity}${o.stubs?.length ? `; stubs: ${o.stubs.join(', ')}` : ''}): ${o.result}` +
    (o.result === 'deviation' || o.result === 'conforms' ? `, ${o.deviations} of ${o.steps} step(s) deviated` : '') +
    (o.reason ? ` — ${o.reason}` : '') + `; control ${o.control_status.replace('_', ' ')}` + (o.control_changes?.length ? ` (${o.control_changes.join(', ')})` : '');

const lensesRun = (scope.lenses_run || []).join(', ') || 'unspecified';
const deferred = scope.lenses_deferred || [];
const partial = scope.partial === true || deferred.length > 0;

// ---- 1. title + method line -------------------------------------------------
w(`# Production audit — ${scope.app || 'application'}`);
w();
const stack = R.stack_profile
  ? `${[R.stack_profile.language, R.stack_profile.framework, R.stack_profile.datastore].filter(Boolean).join(' / ')}`
  : 'stack unspecified';
const methodBits = [
  `${(scope.lenses_run || []).length} lens(es) run (${lensesRun})`,
  `${rec.raw ?? findings.length + dropped.length} raw findings → ${findings.length} reported, ${rec.merged ?? 0} merged, ${dropped.length} dropped`,
  `critical/high adversarially verified (${verified} verified, ${capped} capped, ${downgraded} severity-calibrated, ${dropped.length} dropped as false positives)`,
  `integrity harness passed on the rendered snapshot (${args.assurance ? 'evidence records checked' : 'legacy structural checks only'})`,
  `report mode (no code changed)`,
];
w(`**Method.** Stack: ${stack}. ${methodBits.join('; ')}.` +
  (partial ? (website && !deferred.length
    ? ' **This is a PARTIAL audit** — required website assessment work remains; see coverage and limitations.'
    : ` **This is a PARTIAL audit** — ${deferred.length} applicable lens(es) deferred (${deferred.join(', ')}); a follow-up run is required.`) : ''));
w();

// ---- 1b. by the numbers — lead with the GATING SET, not the raw total -------
const collapsedNote = collapsedChainIds.size ? ` ${collapsedChainIds.size} re-narrated attack chain(s) folded into the root-cause defect they re-tell (counted once, not twice).` : '';
w(`**By the numbers.** ${gating.length} issue(s) gate readiness — ${gatingCrit} critical, ${gatingHigh} high — all adversarially verified or capped` +
  (gatingReasoning ? `; ${gatingReasoning} of these are reasoning-typed inferences to confirm against the code` : '') +
  `. Below them, ${backlog.length} medium/low finding(s) form a backlog` +
  (backlog.length ? ` (${backlogReasoning} reasoning-typed — candidate issues to confirm, not confirmed defects)` : '') +
  `. The raw reported total (${findings.length}) is the ledger count, **not** a count of confirmed defects.` +
  collapsedNote);
w();

// ---- 2. scope ---------------------------------------------------------------
w(`## Scope`);
w(`- **Evidence assurance:** ${args.assurance ? 'source quotes, finding-bound review records and recorded file deliveries checked. Semantic conclusions remain reviewer judgements; reads do not prove comprehension.' : 'LIMITED historical mode: coverage and semantic verification are self-reported.'}`);
if (observations.length) w(`- **Observations:** ${observations.length} recorded against the captured snapshot (${observations.filter((o) => o.kind === 'search').length} replayed search(es), ${observations.filter((o) => o.kind === 'execution').length} probe run(s)). Each finding names its evidence basis; a quotation, a search, an executed probe and a simulated test are different kinds of evidence.`);
for (const entry of gate.assurance?.exclusions || []) w(`- **Excluded tracked file:** \`${entry.file}\` — ${entry.reason}`);
for (const warning of gate.warnings || []) w(`- **Gate warning:** ${warning}`);
w(`- **Lenses run:** ${lensesRun}`);
if (scope.review_profiles?.length) w(`- **Review profiles:** ${scope.review_profiles.join(', ')}`);
if (deferred.length) w(`- **Lenses deferred (NOT yet run):** ${deferred.join(', ')} — open coverage gap, follow-up required.`);
// Regulated data class → a legal data-protection duty is in scope regardless of any stated goal.
const dataClasses = Array.isArray(R.stack_profile?.data_classes) ? R.stack_profile.data_classes : [];
const REGULATED_RE = /(special-category|biometric|genetic|\bhealth\b|financial|children|minor|government-id|location)/i;
const regulatedClasses = dataClasses.filter((c) => REGULATED_RE.test(String(c)));
if (regulatedClasses.length) {
  // Map detected class -> example framework(s). Which one actually applies is jurisdiction-dependent
  // (where the users and data are) and usually needs operator confirmation — so these are examples.
  const j = regulatedClasses.join(',').toLowerCase();
  const fw = [];
  if (/health/.test(j)) fw.push('GDPR Art. 9 / HIPAA');
  if (/biometric|genetic|special-category/.test(j)) fw.push('GDPR Art. 9 / biometric laws');
  if (/financial/.test(j)) fw.push('PCI-DSS / GLBA');
  if (/children|minor/.test(j)) fw.push('COPPA / age-appropriate-design codes');
  if (/government-id/.test(j)) fw.push('breach & ID-theft laws');
  if (/location/.test(j)) fw.push('CCPA/CPRA sensitive PI');
  const fwHint = fw.length ? ` (e.g. ${[...new Set(fw)].join('; ')} — confirm which applies by jurisdiction)` : ' (confirm the framework by jurisdiction)';
  w(`- **Regulated data class(es) detected:** ${regulatedClasses.join(', ')} — a **legal data-protection duty** under the applicable framework${fwHint} is in scope *by data class*, independent of any stated compliance goal. SOC 2 *certification* may be deferred; this duty may not. See the compliance findings.`);
}
if (typeof cov.files_examined === 'number' && typeof cov.files_total === 'number') {
  w(`- **Files examined:** ${cov.files_examined} of ${cov.files_total}` + (cov.files_examined < cov.files_total ? ` (${cov.files_total - cov.files_examined} not examined — see "what could not be assessed")` : ' (all inventoried files recorded)'));
}
w();

// ---- 3. executive summary ---------------------------------------------------
w(`## Executive summary`);
w(R.summary || `${gating.length} issue(s) gate readiness (${gatingCrit} critical, ${gatingHigh} high), all adversarially verified or capped` +
  (gatingReasoning ? `, ${gatingReasoning} of them reasoning-typed inferences to confirm` : '') +
  `. A further ${backlog.length} medium/low finding(s) form a backlog (${backlogReasoning} reasoning-typed). ` +
  `Counts are distinct defects across ${(scope.lenses_run || []).length} lens(es) — the raw reported total (${findings.length}) is the ledger count, not confirmed defects. See "the few to fix first" below.`);
w();

// ---- 4. the few to fix first ------------------------------------------------
// Distinct defects only: folded chains are excluded (the gating set already excludes them).
w(`## The few to fix first`);
const fixFirst = [...gating].sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]).slice(0, 6);
if (!fixFirst.length) w(`_No critical or high findings._`);
for (const f of fixFirst) w(`1. **[${f.severity}] ${f.id} — ${f.title}** (\`${f.location?.file}${f.location?.line != null ? ':' + f.location.line : ''}\`)`);
w();

// ---- 4b. remediation order (sequenced, with reasons) -----------------------
const remOrder = Array.isArray(R.remediation_order) ? R.remediation_order : [];
if (remOrder.length) {
  const idToFinding = Object.fromEntries(findings.map((f) => [f.id, f]));
  w(`## Remediation order`);
  w(`_Fix in this sequence — each entry explains why it sits where it does._`);
  w();
  for (let i = 0; i < remOrder.length; i++) {
    const entry = remOrder[i];
    const f = idToFinding[entry.id];
    const label = f ? `[${f.severity}] ${entry.id} — ${f.title}` : entry.id;
    w(`${i + 1}. **${label}** — ${entry.reason}`);
  }
  w();
}

// ---- 5. findings by tier ----------------------------------------------------
w(`## Findings by severity`);
for (const sev of SEV_ORDER) {
  const tier = bySev(sev);
  if (!tier.length) continue;
  w(`### ${sev.charAt(0).toUpperCase() + sev.slice(1)} (${tier.length})`);
  for (const f of tier) {
    const loc = `${f.location?.file}${f.location?.line != null ? ':' + f.location.line : ''}`;
    const lenses = [f.lens, ...((f.dedup?.also_seen_by_lenses) || [])].filter(Boolean).join(' + ');
    w(`- **${f.id} — ${f.title}**  \`${loc}\``);
    w(`  - Issue: ${f.issue}`);
    w(`  - Consequence: ${f.consequence}`);
    w(`  - Lens(es): ${lenses} · confidence: ${f.confidence_type} · review status: ${f.verification?.status}` + (f.verification?.verifier_disagreed ? ` · severity calibrated (${f.verification?.note || 'see note'})` : ''));
    if (f.category === 'attack-path' && f.chain) {
      w(`  - Attack path: ${(f.chain.steps || []).join(' → ')}`);
      if (f.chain.detection_gap) w(`  - Detection gap: ${f.chain.detection_gap}`);
    }
    if (args.assurance && f.verification?.status === 'verified') w(`  - Evidence basis: ${BASIS_LABEL[f.verification.basis ?? 'source-quote']}`);
    for (const id of f.verification?.observations || []) if (observationById.has(id)) w(`    - ${describeObservation(observationById.get(id))}`);
    w(`  - Fix: ${f.fix}`);
    if ((f.severity === 'critical' || f.severity === 'high') && f.confidence_type === 'reasoning') {
      w(`  - ⚠ reasoning finding — confirm the inference against the code before acting.`);
    }
    // Re-narrated attack chains that rest on THIS defect fold in here as supporting evidence
    // (one defect, two lenses — not a second critical in the tier above).
    for (const ch of attachmentsByRoot.get(f.id) || []) {
      w(`  - Also surfaced as an attack path by adversary-emulation (${ch.id}): ${(ch.chain?.steps || []).join(' → ')}`);
      if (ch.chain?.detection_gap) w(`    - Detection gap: ${ch.chain.detection_gap}`);
    }
  }
  w();
}

// ---- 5b. design & copy quality (separate axis — never in the readiness tiers) ------
const polish = findings.filter((f) => POLISH.has(f.category)).sort((a, b) => (a.id < b.id ? -1 : 1));
if (polish.length) {
  w(`## Design & copy quality (distinctiveness)`);
  w(`_Product-credibility findings — anti-AI-slop visual design (\`design-aesthetic\`, from frontend-design) and user-facing copy (\`content\`, from anti-slop-writing) — kept separate from the readiness tiers above and capped at medium. They affect trust and conversion, not safety. Address after the readiness findings._`);
  w();
  for (const f of polish) {
    const loc = `${f.location?.file}${f.location?.line != null ? ':' + f.location.line : ''}`;
    const axis = f.category === 'content' ? 'Copy' : 'Design';
    w(`- **[${axis}] ${f.id} — ${f.title}**  \`${loc}\`  _(severity: ${f.severity})_`);
    w(`  - Issue: ${f.issue}`);
    w(`  - Fix: ${f.fix}`);
  }
  w();
}

// ---- 6. declared website coverage and product decisions ---------------------
if (website) {
  const text = (value) => String(value).replace(/[\r\n]+/g, ' ').replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const evidence = (items) => items.map((entry) => `${entry.mode}: ${text(entry.ref)}`).join('; ');
  const featureLabel = (id) => `${id} ${WEBSITE_FEATURE_NAMES.get(id)}`;
  w('## Website readiness coverage');
  w();
  w('Assessed records a review of the listed surfaces with the stated evidence, not a global pass or proof that the product is safe. Evidence references describe recorded observations; the profile gate checks their structure, not their truth.');
  w();
  for (const topic of website.topics) {
    w(`- **${topic.id}** · ${topic.applicability} · ${topic.status} · owner: ${topic.owner}`);
    w(`  - Basis: ${text(topic.reason)}`);
    w(`  - Surfaces: ${topic.surfaces.length ? topic.surfaces.map(text).join('; ') : 'none recorded'}`);
    w(`  - Evidence: ${topic.evidence.length ? evidence(topic.evidence) : 'none claimed'}`);
    w(`  - Finding references: ${topic.finding_ids.join(', ') || 'none linked'}`);
    for (const limitation of topic.limitations) {
      w(`  - Limitation: ${text(limitation)}`);
      websiteGaps.push(`Website ${topic.id}: ${text(limitation)}`);
    }
  }
  w();
  w('### Optional feature decisions');
  w();
  w('Absence alone is not a defect. Recommendations and existing approvals do not authorise implementation during this read-only audit. Keep is a scoped recommendation, not a certification.');
  w();
  w('| Feature | Presence | Decision | Basis |');
  w('| --- | --- | --- | --- |');
  for (const feature of website.features) {
    w(`| ${featureLabel(feature.id)} | ${feature.presence} | ${feature.decision} | ${text(feature.reason)} |`);
  }
  const details = website.features.filter((feature) => feature.evidence.length || feature.finding_ids.length || feature.limitations.length);
  if (details.length) {
    w();
    for (const feature of details) {
      w(`- **${featureLabel(feature.id)} evidence and limits**`);
      if (feature.evidence.length) w(`  - Evidence: ${evidence(feature.evidence)}`);
      if (feature.finding_ids.length) w(`  - Finding references: ${feature.finding_ids.join(', ')}`);
      for (const limitation of feature.limitations) {
        w(`  - Limitation: ${text(limitation)}`);
        websiteGaps.push(`Website ${featureLabel(feature.id)}: ${text(limitation)}`);
      }
    }
  }
  w();
}

// ---- 6b. coverage matrix ----------------------------------------------------
if (Array.isArray(cov.matrix) && cov.matrix.length) {
  w(`## Coverage matrix`);
  w('```');
  for (const row of cov.matrix) w(typeof row === 'string' ? row : JSON.stringify(row));
  w('```');
  w();
}

// ---- 6c. observations: every record, including the ones that supported nothing ----
if (observations.length) {
  w(`## Observations`);
  w('Recorded by the controller against the captured snapshot. The gate replayed each search and re-derived each probe result from its stored steps; it did not execute any probe. A probe shows behaviour for the inputs it used, not for all inputs. Whether a probe exercises the cited code is the reviewer\'s judgement, except where a control change to that code removed the deviation.');
  w();
  for (const o of observations) w(`- ${describeObservation(o)} · subject ${o.subject} · by ${o.actor} · targets ${o.targets.join(', ')}`);
  for (const o of observations) w(`  - ${o.id} claim under test: ${o.claim}`);
  w();
}

// ---- 7. reconciliation ------------------------------------------------------
w(`## Reconciliation`);
w(`raw ${rec.raw ?? '?'} = reported ${rec.reported ?? findings.length} + merged ${rec.merged ?? 0} + dropped ${rec.dropped ?? dropped.length}  _(verified by audit-check.mjs)_`);
if (dropped.length) {
  w();
  w(`**Dropped as false positives:**`);
  for (const d of dropped) w(`- ${d.id}: ${d.reason}` + ((d.observations || []).length ? ` (observations: ${d.observations.join(', ')})` : ''));
}
w();

// ---- 8. what could not be assessed -----------------------------------------
w(`## What could not be assessed`);
const gaps = [];
if (deferred.length) gaps.push(`**Lenses not yet run (follow-up required):** ${deferred.join(', ')}.`);
if (typeof cov.files_examined === 'number' && typeof cov.files_total === 'number' && cov.files_examined < cov.files_total) {
  gaps.push(`**${cov.files_total - cov.files_examined} source file(s) not examined.**`);
}
gaps.push(`**Detection accuracy:** integrity checks do not measure recall or false positives. Use a separately scored benchmark run; no accuracy claim follows from this report.`);
gaps.push(`**Live/runtime state** (deployed env vars, infra state, runtime behaviour) is not determinable from the repository.`);
for (const o of observations.filter((entry) => entry.result === 'unavailable' || entry.result === 'error')) {
  gaps.push(`**Observation ${o.id} (${o.subject}) produced no result:** ${o.reason || o.result}.`);
}
for (const limitation of R.limitations || []) gaps.push(limitation);
gaps.push(...websiteGaps);
for (const g of gaps) w(`- ${g}`);
w();

process.stdout.write(out.join('\n') + '\n');
