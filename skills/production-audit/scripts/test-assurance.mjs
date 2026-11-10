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

import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkAssurance, hash, canonical, findingHash } from './assurance.mjs';
const here = fileURLToPath(new URL('.', import.meta.url));
let count = 0;
const dir = mkdtempSync(join(tmpdir(), 'seatrial-assurance-'));
try {
  execFileSync('git', ['init', '-q', dir]);
  writeFileSync(join(dir, 'a.js'), 'export const get = (db, id) => db.get(id);\n');
  execFileSync('git', ['-C', dir, 'add', 'a.js']);
  const evidence = join(dir, 'evidence');
  const capture = (...args) => execFileSync(process.execPath, [join(here, 'capture-source.mjs'), ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  capture('init', dir, evidence);
  capture('read', dir, evidence, 'author', 'audit', 'code-audit', 'a.js');
  capture('read', dir, evidence, 'verifier', 'review', 'code-audit', 'a.js');
  const manifest = JSON.parse(readFileSync(join(evidence, 'manifest.json')));
  const logs = readFileSync(join(evidence, 'reads.jsonl'), 'utf8');
  const head = JSON.parse(logs.trim().split('\n').pop()).receipt_sha256;
  const finding = { id: 'SEC-001', lens: 'code-audit', category: 'security', severity: 'high',
    title: 'Object access lacks ownership check', issue: 'A user can request another owner’s record.', consequence: 'Private records disclosed.', fix: 'Check owner before returning the record.',
    location: { file: 'a.js', line: 1 }, confidence_type: 'factual', verification: { status: 'verified', evidence: 'a.js:1 — `db.get(id)` is not owner scoped.' } };
  const report = { assurance_version: 1, scope: { lenses_selected: ['code-audit'], lenses_run: ['code-audit'] },
    coverage: { files_total: 1, files_examined: 1, receipt_head: head, areas_total: 1, matrix: [{ lens: 'code-audit', files: ['a.js'] }] },
    findings: [finding], dropped: [], reconciliation: { raw: 1, reported: 1, dropped: 0, merged: 0 }, remediation_order: [{ id: finding.id, reason: 'Prevent record disclosure.' }] };
  const review = { finding_id: finding.id, finding_sha256: findingHash(finding), manifest_sha256: hash(canonical(manifest)),
    auditor: 'author', reviewer: 'verifier', verdict: 'supported', claim: 'Record access is not owner scoped.', preconditions: 'Caller can choose an id.',
    data_flow: 'id goes directly to db.get.', counterevidence: 'No caller identity is accepted by this function; upstream restrictions require a separate check.',
    rationale: 'At this function boundary the supplied id is unrestricted.', citations: [{ file: 'a.js', start: 1, end: 1, quote: 'export const get = (db, id) => db.get(id);' }] };
  const save = reviews => writeFileSync(join(evidence, 'reviews.json'), JSON.stringify(reviews));
  save([review]);
  const check = (r = report) => checkAssurance(r, [finding], dir, evidence);
  assert.equal(check().files_delivered, 1); count++;
  const rejectReview = (name, change, pattern) => { const r = JSON.parse(JSON.stringify(review)); change(r); save([r]); assert.throws(() => check(), pattern, name); count++; save([review]); };
  rejectReview('fabricated quote', r => r.citations[0].quote = 'auth.requireOwner(id)', /quotation does not match/);
  rejectReview('stale finding', r => r.finding_sha256 = '0'.repeat(64), /stale review/);
  rejectReview('same reviewer', r => r.reviewer = r.auditor, /separate reviewer/);
  rejectReview('unobserved reviewer', r => r.reviewer = 'invented', /no delivery/);
  rejectReview('contradicted verdict', r => r.verdict = 'refuted', /verdict conflicts/);
  rejectReview('no counterevidence', r => r.counterevidence = '', /missing counterevidence/);
  rejectReview('escape', r => r.citations[0].file = '../a.js', /finding location/);
  rejectReview('invalid line', r => r.citations[0].start = 0, /quotation range/);
  save([]); assert.throws(() => check(), /missing semantic review/); count++; save([review]);
  save([review, review]); assert.throws(() => check(), /duplicate/); count++; save([review]);
  const changed = JSON.parse(JSON.stringify(report)); changed.coverage.files_examined = 0;
  assert.throws(() => check(changed), /counts differ/); count++;
  changed.coverage.files_examined = 1; changed.coverage.matrix[0].files = [];
  assert.throws(() => check(changed), /coverage files differ/); count++;
  writeFileSync(join(evidence, 'reads.jsonl'), logs.split('\n').slice(1).join('\n'));
  assert.throws(() => check(), /broken read receipt chain/); count++;
  writeFileSync(join(evidence, 'reads.jsonl'), logs);
  writeFileSync(join(dir, 'a.js'), 'changed'); assert.throws(() => check(), /inventory changed/); count++;
  writeFileSync(join(dir, 'a.js'), 'export const get = (db, id) => db.get(id);\n');
  writeFileSync(join(dir, 'new.js'), 'new file'); execFileSync('git', ['-C', dir, 'add', 'new.js']);
  assert.throws(() => check(), /inventory changed/); count++;
  execFileSync('git', ['-C', dir, 'rm', '--cached', 'new.js']);
  writeFileSync(join(dir, 'report.json'), JSON.stringify(report));
  writeFileSync(join(dir, 'raw-findings.jsonl'), JSON.stringify(finding));
  const rendered = spawnSync(process.execPath, [join(here, 'render-report.mjs'), dir, '--repo', dir, '--assurance', evidence], { encoding: 'utf8' });
  assert.equal(rendered.status, 0, rendered.stderr); assert.match(rendered.stdout, /source quotes/); count++;
  const missing = spawnSync(process.execPath, [join(here, 'render-report.mjs'), dir], { encoding: 'utf8' });
  assert.equal(missing.status, 2); assert.equal(missing.stdout, ''); count++;
  // Dropped findings also need a source-bound refutation, not an unexamined dismissal.
  const dropped = JSON.parse(JSON.stringify(report)); dropped.findings = []; dropped.dropped = [{ id: finding.id }];
  save([{ ...review, verdict: 'refuted' }]); assert.equal(check(dropped).reviews, 1); count++;
  save([]); assert.throws(() => check(dropped), /missing semantic review/); count++;
  console.log(`${count} assurance integration checks passed`);
} finally { rmSync(dir, { recursive: true, force: true }); }
