#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, path, ...extra] = process.argv.slice(2);
    if (!path || extra.length) throw Error('usage: benchmark.mjs prepare <new-directory> | score <results.json>');
    if (command === 'prepare') {
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
