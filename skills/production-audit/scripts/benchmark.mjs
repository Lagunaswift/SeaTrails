#!/usr/bin/env node
// Copyright 2026 LagunaForge
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { readFileSync, mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hash, canonical } from './assurance.mjs';

export const corpus = JSON.parse(readFileSync(new URL('./benchmark/corpus.json', import.meta.url)));
export const corpusHash = hash(canonical(corpus));
export function score(results) {
  if (results.corpus_sha256 !== corpusHash) throw Error('wrong corpus version/hash');
  for (const key of ['model', 'model_version', 'skills_commit', 'prompt_sha256', 'run_id', 'started_at']) {
    if (typeof results[key] !== 'string' || !results[key].trim()) throw Error(`missing run metadata: ${key}`);
  }
  if (results.limitations != null && (!Array.isArray(results.limitations) || results.limitations.some(v => typeof v !== 'string' || !v.trim()))) throw Error('invalid run limitations');
  if (typeof results.blind !== 'boolean') throw Error('record whether the auditor saw ground truth');
  if (!Array.isArray(results.cases) || results.cases.length !== corpus.cases.length) throw Error('every case needs an explicit completed result');
  const seen = new Set();
  let tp = 0, fp = 0, fn = 0, tn = 0, negativeFalsePositives = 0;
  const details = [];
  for (const output of results.cases) {
    const truth = corpus.cases.find(c => c.id === output.id);
    if (!truth || seen.has(output.id) || output.status !== 'complete' || !Array.isArray(output.findings)) throw Error('unknown, duplicate or incomplete case');
    seen.add(output.id);
    let matched = false, localFP = 0;
    for (const finding of output.findings) {
      if (!finding || typeof finding.weakness !== 'string' || !Number.isInteger(finding.line) || finding.line < 1 || typeof finding.explanation !== 'string' || !finding.explanation.trim()) throw Error('malformed detection');
      // Exact case, weakness and defect line, one match per ground-truth defect.
      // Duplicate, wrong-location and unrelated findings are false positives.
      if (truth.vulnerable && !matched && finding.weakness === truth.weakness && finding.line === truth.line) { tp++; matched = true; }
      else { fp++; localFP++; }
    }
    if (truth.vulnerable && !matched) fn++;
    if (!truth.vulnerable) {
      if (output.findings.length) negativeFalsePositives++;
      else tn++;
    }
    details.push({ id: output.id, detected: matched, false_positives: localFP, missed: truth.vulnerable && !matched });
  }
  const negatives = corpus.cases.filter(c => !c.vulnerable).length;
  return { corpus: corpus.name, corpus_sha256: corpusHash,
    metadata: Object.fromEntries(['model','model_version','skills_commit','prompt_sha256','run_id','started_at','blind'].map(k => [k, results[k]])),
    tp, fp, fn, tn, precision: tp + fp ? tp / (tp + fp) : null, recall: tp / (tp + fn),
    false_positive_rate: negativeFalsePositives / negatives,
    limitations: ['Small synthetic paired corpus; no estimate of production accuracy.', 'Location/CWE matching requires independent adjudication of explanations and unexpected valid findings.', 'Regression and scorer tests are not detector runs.', ...(results.limitations || [])], details };
}

// ---- corpus v2: behaviour pairs, split packets, arm comparison ------------------
// v1 is saturated and shows both members of each pair to the same worker in a
// fixed order. v2 gives a worker one member per pair under an opaque id, keeps
// the id mapping in a separate key, and scores two protocols on the same cases.
export const corpusV2 = JSON.parse(readFileSync(new URL('./benchmark/corpus-v2.json', import.meta.url)));
export const corpusV2Hash = hash(canonical(corpusV2));
// A verification packet gives the worker one concrete claim per case and asks
// whether it holds. The same claim is true of one pair member and false of the other.
export const claimsV2 = JSON.parse(readFileSync(new URL('./benchmark/claims-v2.json', import.meta.url)));
const TASKS = ['detect', 'verify'];
const LINE_TOLERANCE = 1;
const ARMS = ['read-only', 'observe'];
const TOOLS = ['assurance.mjs', 'capture-source.mjs', 'observation.mjs', 'observe.mjs'];

export function selectV2(seed, split) {
  if (typeof seed !== 'string' || !seed.trim()) throw Error('a seed is required');
  if (!['A', 'B'].includes(split)) throw Error('split must be A or B');
  const pairs = [...new Set(corpusV2.cases.map(c => c.pair))];
  const chosen = pairs.map(pair => {
    const members = corpusV2.cases.filter(c => c.pair === pair).sort((a, b) => a.id < b.id ? -1 : 1);
    const first = parseInt(hash(`${seed}:${pair}`).slice(0, 8), 16) % 2;
    return members[split === 'A' ? first : 1 - first];
  });
  // Opaque ids carry no pair, order or label information.
  return chosen.map(c => ({ opaque: `c-${hash(`${seed}:${c.id}`).slice(0, 10)}`, case: c })).sort((a, b) => a.opaque < b.opaque ? -1 : 1);
}

export function prepareV2(packet, { key, seed, split, arm = 'read-only', tools, task = 'detect' }) {
  if (!ARMS.includes(arm)) throw Error(`arm must be one of ${ARMS.join(', ')}`);
  if (!TASKS.includes(task)) throw Error(`task must be one of ${TASKS.join(', ')}`);
  if (task === 'verify' && claimsV2.corpus_sha256 !== corpusV2Hash) throw Error('claims file belongs to another corpus version');
  if (!key) throw Error('--key <file> is required: the id mapping must live outside the worker packet');
  const inside = (base, path) => { const rel = relative(resolve(base), resolve(path)); return !rel.startsWith('..') && !isAbsolute(rel); };
  if (inside(packet, key)) throw Error('the key must be stored outside the worker packet');
  if (arm === 'observe' && (!tools || inside(packet, tools))) throw Error('the observe arm needs --tools <directory> outside the worker packet');
  const selected = selectV2(seed, split);
  mkdirSync(packet, { recursive: false });
  mkdirSync(resolve(packet, 'cases'));
  for (const { opaque, case: c } of selected) {
    const dir = resolve(packet, 'cases', opaque); mkdirSync(dir);
    writeFileSync(resolve(dir, 'target.mjs'), c.source);
    writeFileSync(resolve(dir, 'CONTRACT.md'), `${c.contract}\n`);
    if (task === 'verify') writeFileSync(resolve(dir, 'CLAIM.md'), `${claimsV2.claims[c.pair].claim}\n`);
  }
  const scope = `Do not read anything outside this directory${arm === 'observe' ? ' and the tools directory named below' : ''}. Do not search for labels, evaluators or other copies of these files.\n`;
  const common = task === 'verify'
    ? `Each directory under cases/ holds one independent module (target.mjs), the behaviour it must guarantee (CONTRACT.md) and one claim about what the module does (CLAIM.md). An auditor wrote each claim; some are true of the code in front of you and some are false. For each case decide whether the claim holds for this target.mjs exactly as written. Supporting a false claim counts against you, and so does refuting a true one.\n\nReturn one JSON object: {"cases":[{"id":"<directory name>","status":"complete","verdict":"supported" or "refuted","explanation":"<what the code does with the claimed input>"${arm === 'observe' ? ',"observations":["OBS-001"]' : ''}}]}. Every case directory must appear once.\n\n${scope}`
    : `Each directory under cases/ holds one independent module (target.mjs) and the behaviour it must guarantee (CONTRACT.md). Inputs named in a contract as attacker-controlled are hostile. For each case decide whether the module can violate its contract. Some cases are sound; reporting a defect that the code does not have counts against you, and so does missing one that it has. Report at most the defects you can tie to a line.\n\nReturn one JSON object: {"cases":[{"id":"<directory name>","status":"complete","findings":[{"weakness":"CWE-<number>","line":<1-based line in target.mjs>,"explanation":"<the input and the wrong outcome>"${arm === 'observe' ? ',"observations":["OBS-001"]' : ''}}]}]}. A sound case has "findings": []. Every case directory must appear once.\n\n${scope}`;
  let protocol = `Protocol: read-only. Reach your verdicts by reading the code. Do not execute the targets or any code derived from them.\n`;
  if (arm === 'observe') {
    mkdirSync(tools, { recursive: true });
    for (const name of TOOLS) copyFileSync(new URL(`./${name}`, import.meta.url), resolve(tools, name));
    copyFileSync(new URL('../references/observation-contract.md', import.meta.url), resolve(tools, 'observation-contract.md'));
    const evidence = resolve(tools, 'evidence');
    execFileSync('git', ['init', '-q', packet]);
    execFileSync('git', ['-C', packet, 'add', 'cases']);
    execFileSync(process.execPath, [resolve(tools, 'capture-source.mjs'), 'init', resolve(packet), evidence], { stdio: 'ignore' });
    protocol = `Protocol: observe. Read the code first. ${task === 'verify' ? 'Then test each claim by recording a probe with the observation tool, and let its result decide' : 'Where reading leaves a verdict uncertain, or before reporting a defect, record a probe with the observation tool and let its result decide'}:\n\n  node ${resolve(tools, 'observe.mjs')} ${resolve(packet)} ${evidence} <spec.json>\n\nRead ${resolve(tools, 'observation-contract.md')} for the specification format (kind "execution", surface "process", fidelity "real"; the probe imports the module from $SEATRIAL_SNAPSHOT/cases/<id>/target.mjs and appends {"action","expected","observed"} steps to $SEATRIAL_STEPS, where expected is what CONTRACT.md requires). Use the case directory name as "subject" and cases/<id>/target.mjs as the target. Write specifications and probes under ${resolve(tools, 'work')}, never inside this directory: the tool refuses to record once the packet changes. Do not run the targets any other way. Cite the observation ids that ${task === 'verify' ? 'decided each verdict' : 'support each finding'}. A probe that conforms is evidence against the defect it tested.\n`;
  }
  writeFileSync(resolve(packet, 'TASK.md'), `${common}\n${protocol}\nCorpus SHA-256: ${corpusV2Hash}\n`);
  writeFileSync(key, JSON.stringify({ corpus_sha256: corpusV2Hash, seed, split, arm, task, map: Object.fromEntries(selected.map(s => [s.opaque, s.case.id])) }, null, 2));
  return { corpus_sha256: corpusV2Hash, cases: selected.length, split, arm, task };
}

// Adjudications record rulings made after blinded runs: a location that names the
// labelled defect, or a real defect the labels missed. They are applied only on
// request, and a scored run says whether they were.
export function scoreV2(results, key, observations = null, adjudications = null) {
  if (adjudications && adjudications.corpus_sha256 !== corpusV2Hash) throw Error('adjudications belong to another corpus version');
  if (results.corpus_sha256 !== corpusV2Hash || key.corpus_sha256 !== corpusV2Hash) throw Error('wrong corpus version/hash');
  for (const k of ['model', 'model_version', 'skills_commit', 'prompt_sha256', 'run_id', 'started_at']) {
    if (typeof results[k] !== 'string' || !results[k].trim()) throw Error(`missing run metadata: ${k}`);
  }
  if (typeof results.blind !== 'boolean') throw Error('record whether the auditor saw ground truth');
  if (results.arm !== key.arm || !ARMS.includes(results.arm)) throw Error('results arm differs from the prepared packet');
  if (results.limitations != null && (!Array.isArray(results.limitations) || results.limitations.some(v => typeof v !== 'string' || !v.trim()))) throw Error('invalid run limitations');
  const ids = Object.keys(key.map);
  if (!Array.isArray(results.cases) || results.cases.length !== ids.length) throw Error('every case needs an explicit completed result');
  const seen = new Set(), details = [];
  const meta = { corpus: corpusV2.name, corpus_sha256: corpusV2Hash, split: key.split, seed: key.seed, arm: key.arm, task: key.task || 'detect',
    metadata: Object.fromEntries(['model', 'model_version', 'skills_commit', 'prompt_sha256', 'run_id', 'started_at', 'blind'].map(k => [k, results[k]])),
    effort: { ...(results.effort && typeof results.effort === 'object' ? results.effort : {}), observations_recorded: observations ? observations.length : null } };
  if (meta.task === 'verify') {
    // The claim is true of the defective member only. "located" and "flagged"
    // both mean the worker supported the claim, so compareV2 reads either task.
    for (const output of results.cases) {
      const truth = corpusV2.cases.find(c => c.id === key.map[output.id]);
      if (!truth || seen.has(output.id) || output.status !== 'complete' || !['supported', 'refuted'].includes(output.verdict) || typeof output.explanation !== 'string' || !output.explanation.trim()) throw Error('unknown, duplicate or incomplete case');
      seen.add(output.id);
      const supported = output.verdict === 'supported';
      const probes = observations ? observations.filter(o => o.subject === output.id && o.kind === 'execution').map(o => o.execution.result) : null;
      details.push({ case: truth.id, pair: truth.pair, pair_kind: truth.pair_kind, defective: truth.defective, flagged: supported, located: truth.defective && supported, extra_findings: 0, correct: supported === truth.defective, probes });
    }
    const of = f => details.filter(f);
    const trueClaims = of(d => d.defective), falseClaims = of(d => !d.defective);
    const r = (n, d) => d ? n / d : null;
    return { ...meta, cases: details.length, true_claims: trueClaims.length, false_claims: falseClaims.length,
      true_claims_supported: of(d => d.defective && d.flagged).length, false_refutations: of(d => d.defective && !d.flagged).length,
      false_confirmations: of(d => !d.defective && d.flagged).length, false_claims_refuted: of(d => !d.defective && !d.flagged).length,
      recall: r(of(d => d.defective && d.flagged).length, trueClaims.length), false_positive_rate: r(of(d => !d.defective && d.flagged).length, falseClaims.length),
      accuracy: r(of(d => d.correct).length, details.length),
      limitations: ['Synthetic single-module pairs; each claim names a concrete input, which is easier to check than an open-ended claim in a real audit.', 'A worker sees one member of each pair, so one split covers half the corpus.', ...(results.limitations || [])], details };
  }
  const classes = {};
  const bucket = (kind, defective) => classes[`${kind}-${defective ? 'defective' : 'sound'}`] ??= { cases: 0, located: 0, flagged: 0 };
  let extraFindings = 0;
  for (const output of results.cases) {
    const truth = corpusV2.cases.find(c => c.id === key.map[output.id]);
    if (!truth || seen.has(output.id) || output.status !== 'complete' || !Array.isArray(output.findings)) throw Error('unknown, duplicate or incomplete case');
    seen.add(output.id);
    const rulings = (adjudications?.rulings || []).filter(r => r.case === truth.id);
    const unlabelled = rulings.filter(r => r.kind === 'unlabelled_defect').map(r => r.lines);
    const relabelled = !truth.defective && unlabelled.length > 0;
    // A member labelled sound that holds an adjudicated defect is scored as defective at the adjudicated lines.
    const accepted = relabelled ? unlabelled : truth.defective ? [truth.lines, ...rulings.filter(r => r.kind === 'accept_location').map(r => r.lines)] : [];
    const within = (f, ranges) => ranges.some(([a, b]) => f.line >= a - LINE_TOLERANCE && f.line <= b + LINE_TOLERANCE);
    const isDefective = truth.defective || relabelled;
    let located = false, wrong = 0, unlabelledFound = false;
    for (const f of output.findings) {
      if (!f || typeof f.weakness !== 'string' || !Number.isInteger(f.line) || f.line < 1 || typeof f.explanation !== 'string' || !f.explanation.trim()) throw Error('malformed detection');
      // The contract defines the defect, so location decides a match; the CWE label is recorded, not required.
      if (within(f, accepted)) { if (located) wrong++; located = true; if (relabelled) unlabelledFound = true; }
      else if (within(f, unlabelled)) unlabelledFound = true;
      else wrong++;
    }
    const flagged = output.findings.length > 0;
    const b = bucket(truth.pair_kind, isDefective);
    b.cases++; if (located) b.located++; if (flagged) b.flagged++;
    extraFindings += wrong;
    const probes = observations ? observations.filter(o => o.subject === output.id && o.kind === 'execution') : null;
    details.push({ case: truth.id, pair: truth.pair, pair_kind: truth.pair_kind, defective: isDefective, flagged, located, extra_findings: wrong,
      correct: isDefective ? located : !flagged, relabelled, unlabelled_defect_found: unlabelledFound,
      weakness_agrees: truth.defective && located ? output.findings.some(f => f.weakness === truth.weakness) : null,
      probes: probes ? probes.map(o => o.execution.result) : null });
  }
  const sum = (filter, field) => Object.entries(classes).filter(([k]) => filter(k)).reduce((n, [, v]) => n + v[field], 0);
  const defective = sum(k => k.endsWith('defective'), 'cases'), sound = sum(k => k.endsWith('sound'), 'cases');
  const tp = sum(k => k.endsWith('defective'), 'located'), fpCases = sum(k => k.endsWith('sound'), 'flagged');
  const ratio = (n, d) => d ? n / d : null;
  return { ...meta, adjudicated: !!adjudications, relabelled_cases: details.filter(d => d.relabelled).length,
    unlabelled_defects_found: details.filter(d => d.unlabelled_defect_found).length,
    cases: details.length, defective, sound, tp, fn: defective - tp, sound_cases_flagged: fpCases, extra_findings: extraFindings,
    recall: ratio(tp, defective), false_positive_rate: ratio(fpCases, sound), accuracy: ratio(details.filter(d => d.correct).length, details.length),
    trap_recall: ratio(classes['trap-defective']?.located ?? 0, classes['trap-defective']?.cases ?? 0),
    trap_false_positive_rate: ratio(classes['trap-sound']?.flagged ?? 0, classes['trap-sound']?.cases ?? 0),
    classes,
    limitations: ['Synthetic single-module pairs with an executable oracle; no estimate of accuracy on real repositories.', `A detection is a finding within ${LINE_TOLERANCE} line(s) of the labelled range; unexpected findings on sound cases need independent adjudication before being called false.`,
      'A worker sees one member of each pair, so one split covers half the corpus.', ...(results.limitations || [])], details };
}

// Compare scored runs. Groups by arm and model; within a group, cases scored
// more than once give a reproducibility figure; between two arms, cases scored
// by both give paired counts. Small counts are reported as counts.
export function compareV2(scores) {
  if (!Array.isArray(scores) || scores.length < 2 || scores.some(s => s?.corpus_sha256 !== corpusV2Hash || !Array.isArray(s.details))) throw Error('compare needs at least two scored v2 runs of the same corpus');
  if (new Set(scores.filter(s => (s.task || 'detect') === 'detect').map(s => !!s.adjudicated)).size > 1) throw Error('compare cannot mix adjudicated and unadjudicated detection scores');
  const groups = new Map();
  for (const s of scores) {
    const name = `${s.task || 'detect'} / ${s.arm} / ${s.metadata.model}`;
    if (!groups.has(name)) groups.set(name, { task: s.task || 'detect', arm: s.arm, model: s.metadata.model, runs: 0, byCase: new Map(), effort: [] });
    const g = groups.get(name); g.runs++; g.effort.push(s.effort || {});
    for (const d of s.details) { if (!g.byCase.has(d.case)) g.byCase.set(d.case, []); g.byCase.get(d.case).push(d); }
  }
  const mean = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const out = { corpus_sha256: corpusV2Hash, adjudicated: scores.some(s => s.adjudicated), groups: [], paired: [] };
  for (const [name, g] of groups) {
    const all = [...g.byCase.values()].flat();
    const pick = (f) => all.filter(f);
    const rate = (items, field) => items.length ? items.filter(d => d[field]).length / items.length : null;
    const repeated = [...g.byCase.values()].filter(v => v.length > 1);
    const numeric = key => { const v = g.effort.map(e => e[key]).filter(x => typeof x === 'number'); return v.length ? mean(v) : null; };
    out.groups.push({ group: name, task: g.task, arm: g.arm, model: g.model, runs: g.runs, distinct_cases: g.byCase.size, case_verdicts: all.length,
      recall: rate(pick(d => d.defective), 'located'), false_positive_rate: rate(pick(d => !d.defective), 'flagged'), accuracy: rate(all, 'correct'),
      trap_recall: rate(pick(d => d.defective && d.pair_kind === 'trap'), 'located'), trap_false_positive_rate: rate(pick(d => !d.defective && d.pair_kind === 'trap'), 'flagged'),
      repeated_cases: repeated.length, repeat_agreement: repeated.length ? repeated.filter(v => v.every(d => d.correct === v[0].correct && d.flagged === v[0].flagged)).length / repeated.length : null,
      mean_effort: { tokens: numeric('tokens'), tool_calls: numeric('tool_calls'), duration_ms: numeric('duration_ms'), observations_recorded: numeric('observations_recorded') } });
  }
  const names = [...groups.keys()];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const a = groups.get(names[i]), b = groups.get(names[j]);
    if (a.model !== b.model || a.arm === b.arm || a.task !== b.task) continue;
    // Majority verdict per case within each arm, then a paired count over shared cases.
    const majority = v => v.filter(d => d.correct).length * 2 > v.length;
    const shared = [...a.byCase.keys()].filter(c => b.byCase.has(c));
    let onlyA = 0, onlyB = 0, both = 0, neither = 0; const disagreements = [];
    for (const c of shared) {
      const x = majority(a.byCase.get(c)), y = majority(b.byCase.get(c));
      if (x && y) both++; else if (x) { onlyA++; disagreements.push({ case: c, correct_in: a.arm }); } else if (y) { onlyB++; disagreements.push({ case: c, correct_in: b.arm }); } else neither++;
    }
    out.paired.push({ task: a.task, model: a.model, arms: [a.arm, b.arm], shared_cases: shared.length, both_correct: both, [`only_${a.arm}_correct`]: onlyA, [`only_${b.arm}_correct`]: onlyB, neither_correct: neither, disagreements });
  }
  out.limitations = ['Counts this small do not support a significance claim; read the paired disagreements case by case.', 'Majority verdict per case when a case was run more than once in an arm; ties count as incorrect.'];
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, path, ...extra] = process.argv.slice(2);
    const usage = 'usage: benchmark.mjs prepare <new-directory> | score <results.json> | prepare-v2 <new-directory> --key <file> --seed <text> --split A|B [--task detect|verify] [--arm read-only|observe --tools <directory>] | score-v2 <results.json> --key <file> [--evidence <directory>] [--adjudications <file>] | compare-v2 <scored.json> <scored.json> [...]';
    const options = {};
    if (['prepare-v2', 'score-v2'].includes(command)) {
      for (let i = 0; i < extra.length; i += 2) {
        if (!['--key', '--seed', '--split', '--arm', '--tools', '--evidence', '--task', '--adjudications'].includes(extra[i]) || extra[i + 1] == null || options[extra[i].slice(2)]) throw Error(usage);
        options[extra[i].slice(2)] = extra[i + 1];
      }
    } else if (command !== 'compare-v2' && extra.length) throw Error(usage);
    if (!path) throw Error(usage);
    if (command === 'prepare-v2') console.log(JSON.stringify(prepareV2(path, options)));
    else if (command === 'score-v2') {
      if (!options.key) throw Error(usage);
      const log = options.evidence ? resolve(options.evidence, 'observations.jsonl') : null;
      const observations = log ? (existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : []) : null;
      const adjudications = options.adjudications ? JSON.parse(readFileSync(options.adjudications, 'utf8')) : null;
      console.log(JSON.stringify(scoreV2(JSON.parse(readFileSync(path, 'utf8')), JSON.parse(readFileSync(options.key, 'utf8')), observations, adjudications), null, 2));
    } else if (command === 'compare-v2') console.log(JSON.stringify(compareV2([path, ...extra].map(p => JSON.parse(readFileSync(p, 'utf8')))), null, 2));
    else if (command === 'prepare') {
      // Deliberately exclude labels/ground truth from the worker packet.
      mkdirSync(path, { recursive: false });
      for (const c of corpus.cases) {
        const dir = resolve(path, c.id); mkdirSync(dir); writeFileSync(resolve(dir, 'target.mjs'), c.source);
      }
      writeFileSync(resolve(path, 'TASK.md'), `Audit every target.mjs independently with SeaTrails. Report only defects evidenced within the stated boundary. Inputs are attacker-controlled. Record complete cases including those with no findings. Return {id,status:'complete',findings:[{weakness:'CWE-number',line:1,explanation:'...'}]}.\n\nContracts: record lookup must restrict results to actor; path resolution must remain lexically inside root (no symlinks exist in this fixture filesystem); redirects must remain on https://app.invalid; db.query uses SQL with ? placeholders and a separate parameters array.\n\nDo not read evaluator files or infer defects from case identifiers. Corpus SHA-256: ${corpusHash}\n`);
      console.log(JSON.stringify({ corpus_sha256: corpusHash, cases: corpus.cases.length }));
    } else if (command === 'score') console.log(JSON.stringify(score(JSON.parse(readFileSync(path, 'utf8'))), null, 2));
    else throw Error('unknown benchmark command');
  } catch (e) { console.error(e.message); process.exitCode = 2; }
}
