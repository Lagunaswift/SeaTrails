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
import { mkdtempSync, writeFileSync, rmSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { corpus, corpusHash, score, corpusV2, corpusV2Hash, selectV2, prepareV2, scoreV2, compareV2, claimsV2 } from './benchmark.mjs';
let checks = 0;
const dir = mkdtempSync(join(tmpdir(), 'seatrial-corpus-'));
try {
  for (const c of corpus.cases) {
    const path = join(dir, c.id + '.mjs'); writeFileSync(path, c.source);
    const { run } = await import(pathToFileURL(path));
    let breached = false;
    if (c.weakness === 'CWE-639') {
      const db = [{ id: 'own', owner: 'alice' }, { id: 'other', owner: 'bob' }];
      assert.equal(run(db, 'alice', 'own').id, 'own');
      breached = run(db, 'alice', 'other')?.owner === 'bob';
    } else if (c.weakness === 'CWE-22') {
      assert.equal(run('/srv/data', 'ok.txt'), '/srv/data/ok.txt');
      try { breached = run('/srv/data', '../private/key') === '/srv/private/key'; } catch {}
    } else if (c.weakness === 'CWE-601') {
      assert.equal(run('/home'), 'https://app.invalid/home');
      try { breached = run('//evil.invalid') === 'https://evil.invalid/'; } catch {}
    } else {
      const attack = "' OR 1=1 --";
      const db = { query: (sql, params) => ({ sql, params }) };
      const result = run(db, attack);
      breached = result.sql.includes(attack) && !result.params;
      if (!c.vulnerable) assert.deepEqual(result.params, [attack]);
    }
    assert.equal(breached, c.vulnerable, c.id); checks++;
  }
  const results = { corpus_sha256: corpusHash, model: 'scorer-test-only', model_version: 'test', skills_commit: 'test', prompt_sha256: 'test', run_id: 'test', started_at: 'test', blind: false,
    cases: corpus.cases.map(c => ({ id: c.id, status: 'complete', findings: c.vulnerable ? [{ weakness: c.weakness, line: c.line, explanation: 'test' }] : [] })) };
  assert.equal(score(results).recall, 1); assert.equal(score(results).precision, 1); checks++;
  const empty = JSON.parse(JSON.stringify(results)); empty.cases.forEach(c => c.findings = []);
  assert.equal(score(empty).fn, 4); assert.equal(score(empty).precision, null); checks++;
  const duplicates = JSON.parse(JSON.stringify(results)); duplicates.cases[0].findings.push(duplicates.cases[0].findings[0]);
  assert.equal(score(duplicates).fp, 1); checks++;
  const wrongLine = JSON.parse(JSON.stringify(results)); wrongLine.cases[0].findings[0].line = 99;
  assert.equal(score(wrongLine).fn, 1); assert.equal(score(wrongLine).fp, 1); checks++;
  const negative = JSON.parse(JSON.stringify(results)); negative.cases[1].findings = results.cases[0].findings;
  assert.equal(score(negative).false_positive_rate, 0.25); checks++;
  const missing = JSON.parse(JSON.stringify(results)); missing.cases.pop();
  assert.throws(() => score(missing), /every case/); checks++;
  const duplicateCase = JSON.parse(JSON.stringify(results)); duplicateCase.cases[1] = duplicateCase.cases[0];
  assert.throws(() => score(duplicateCase), /duplicate/); checks++;
  const incomplete = JSON.parse(JSON.stringify(results)); incomplete.cases[0].status = 'failed';
  assert.throws(() => score(incomplete), /incomplete/); checks++;
  assert.throws(() => score({ ...results, corpus_sha256: 'old' }), /corpus/); checks++;
  // ---- corpus v2: labels are whatever the shared oracle observes -----------------
  const pairs = new Map();
  for (const c of corpusV2.cases) {
    const base = join(dir, c.id);
    writeFileSync(base + '.target.mjs', c.source); writeFileSync(base + '.oracle.mjs', c.oracle);
    const mod = await import(pathToFileURL(base + '.target.mjs'));
    const { oracle } = await import(pathToFileURL(base + '.oracle.mjs'));
    const verdict = await oracle(mod);
    assert.equal(verdict.legitimate, true, `${c.id}: ordinary use must work`);
    assert.equal(verdict.breached, c.defective, `${c.id}: label disagrees with the oracle`);
    const lineCount = c.source.split('\n').length;
    assert.ok(Number.isInteger(c.lines[0]) && c.lines[0] >= 1 && c.lines[1] >= c.lines[0] && c.lines[1] <= lineCount, `${c.id}: line range`);
    if (!pairs.has(c.pair)) pairs.set(c.pair, []);
    pairs.get(c.pair).push(c); checks++;
  }
  for (const [pair, members] of pairs) {
    assert.equal(members.length, 2, pair); assert.equal(members.filter(m => m.defective).length, 1, pair);
    for (const key of ['contract', 'oracle', 'weakness', 'pair_kind']) assert.equal(members[0][key], members[1][key], `${pair}: ${key} must not distinguish the members`);
  }
  checks++;
  const A = selectV2('seed-x', 'A'), B = selectV2('seed-x', 'B');
  assert.equal(A.length, pairs.size); assert.equal(new Set(A.map(s => s.case.pair)).size, pairs.size);
  assert.equal(new Set([...A, ...B].map(s => s.case.id)).size, corpusV2.cases.length);
  assert.ok(A.every(s => !s.opaque.includes(s.case.pair) && /^c-[0-9a-f]{10}$/.test(s.opaque)));
  assert.notDeepEqual(selectV2('seed-y', 'A').map(s => s.opaque), A.map(s => s.opaque)); checks++;
  const defectiveInA = A.filter(s => s.case.defective).length;
  assert.ok(defectiveInA > 0 && defectiveInA < A.length, 'a split must mix defective and sound cases'); checks++;
  // The worker packet carries no label, oracle, pair id or corpus id.
  const packet = join(dir, 'packet'), keyPath = join(dir, 'key.json');
  prepareV2(packet, { key: keyPath, seed: 'seed-x', split: 'A' });
  const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
  const packetText = walk(packet).map(f => f + '\n' + readFileSync(f, 'utf8')).join('\n');
  for (const leak of ['oracle', 'defective', 'pair_kind', 'v2-0', 'v2-1', 'breached']) assert.ok(!packetText.includes(leak), `packet leaks "${leak}"`);
  assert.ok(!existsSync(join(packet, 'key.json'))); checks++;
  assert.throws(() => prepareV2(join(dir, 'p2'), { key: join(dir, 'p2', 'key.json'), seed: 's', split: 'A' }), /outside the worker packet/); checks++;
  assert.throws(() => prepareV2(join(dir, 'p3'), { key: join(dir, 'k3.json'), seed: 's', split: 'A', arm: 'observe' }), /--tools/); checks++;
  const key = JSON.parse(readFileSync(keyPath, 'utf8'));
  const truthOf = id => corpusV2.cases.find(c => c.id === key.map[id]);
  const v2 = { corpus_sha256: corpusV2Hash, arm: 'read-only', model: 'scorer-test-only', model_version: 'test', skills_commit: 'test', prompt_sha256: 'test', run_id: 'test', started_at: 'test', blind: false,
    cases: Object.keys(key.map).map(id => ({ id, status: 'complete', findings: truthOf(id).defective ? [{ weakness: truthOf(id).weakness, line: truthOf(id).lines[0], explanation: 'test' }] : [] })) };
  const perfect = scoreV2(v2, key);
  assert.equal(perfect.recall, 1); assert.equal(perfect.false_positive_rate, 0); assert.equal(perfect.accuracy, 1); assert.equal(perfect.trap_recall, 1); checks++;
  const copy = () => JSON.parse(JSON.stringify(v2));
  const silent = copy(); silent.cases.forEach(c => c.findings = []);
  assert.equal(scoreV2(silent, key).recall, 0); assert.equal(scoreV2(silent, key).false_positive_rate, 0); checks++;
  const noisy = copy(); noisy.cases.forEach(c => { if (!c.findings.length) c.findings = [{ weakness: 'CWE-20', line: 1, explanation: 'test' }]; });
  assert.equal(scoreV2(noisy, key).false_positive_rate, 1); assert.equal(scoreV2(noisy, key).recall, 1); checks++;
  const firstDefective = v2.cases.findIndex(c => c.findings.length);
  const near = copy(); near.cases[firstDefective].findings[0].line = truthOf(near.cases[firstDefective].id).lines[1] + 1;
  assert.equal(scoreV2(near, key).recall, 1, 'one line of tolerance'); checks++;
  const far = copy(); far.cases[firstDefective].findings[0].line = truthOf(far.cases[firstDefective].id).lines[1] + 2;
  assert.equal(scoreV2(far, key).fn, 1); assert.equal(scoreV2(far, key).extra_findings, 1); checks++;
  const relabelled = copy(); relabelled.cases[firstDefective].findings[0].weakness = 'CWE-0';
  assert.equal(scoreV2(relabelled, key).recall, 1); assert.equal(scoreV2(relabelled, key).details[firstDefective].weakness_agrees, false); checks++;
  const short = copy(); short.cases.pop();
  assert.throws(() => scoreV2(short, key), /every case/); checks++;
  assert.throws(() => scoreV2({ ...v2, arm: 'observe' }, key), /arm differs/); checks++;
  assert.throws(() => scoreV2({ ...v2, corpus_sha256: 'old' }, key), /corpus/); checks++;
  const unknown = copy(); unknown.cases[0].id = 'c-0000000000';
  assert.throws(() => scoreV2(unknown, key), /unknown/); checks++;
  // Comparison: paired counts between arms and agreement between repeats.
  const asArm = (scored, arm) => ({ ...scored, arm });
  const cmp = compareV2([perfect, scoreV2(silent, key), asArm(perfect, 'observe')]);
  const readOnly = cmp.groups.find(g => g.arm === 'read-only'), observe = cmp.groups.find(g => g.arm === 'observe');
  assert.equal(readOnly.runs, 2); assert.equal(readOnly.repeated_cases, key ? Object.keys(key.map).length : 0);
  assert.equal(readOnly.repeat_agreement, perfect.sound / perfect.cases); assert.equal(observe.recall, 1);
  assert.equal(cmp.paired[0].only_observe_correct, perfect.defective); assert.equal(cmp.paired[0]['only_read-only_correct'], 0); checks++;
  assert.throws(() => compareV2([perfect]), /at least two/); checks++;
  // Adjudications: every unlabelled-defect ruling is an executable fact about the case source.
  const adjudications = JSON.parse(readFileSync(new URL('./benchmark/adjudications-v2.json', import.meta.url)));
  assert.equal(adjudications.corpus_sha256, corpusV2Hash);
  for (const [i, ruling] of adjudications.rulings.entries()) {
    const c = corpusV2.cases.find(x => x.id === ruling.case);
    assert.ok(c && ['unlabelled_defect', 'accept_location'].includes(ruling.kind) && ruling.reason.trim() && ruling.lines[1] <= c.source.split('\n').length, `ruling ${i}`);
    if (ruling.kind === 'accept_location') { assert.equal(c.defective, true, 'a location ruling needs a labelled defect'); continue; }
    const rulingPath = join(dir, `ruling-${i}.mjs`); writeFileSync(rulingPath, ruling.check);
    const { holds } = await import(pathToFileURL(rulingPath));
    assert.equal(await holds(await import(pathToFileURL(join(dir, c.id + '.target.mjs')) + `?ruling${i}`)), true, `${c.id}: adjudicated defect does not reproduce`); checks++;
  }
  // Applied only on request; a relabelled member is then scored as defective at the adjudicated lines.
  const both = selectV2('seed-x', 'A').concat(selectV2('seed-x', 'B'));
  const fullKey = { corpus_sha256: corpusV2Hash, seed: 'seed-x', split: 'A', arm: 'read-only', map: Object.fromEntries(both.map(s => [s.opaque, s.case.id])) };
  const opaqueOf = id => both.find(s => s.case.id === id).opaque;
  const honest = { ...v2, cases: both.map(s => ({ id: s.opaque, status: 'complete', findings: s.case.defective ? [{ weakness: s.case.weakness, line: s.case.lines[0], explanation: 'test' }] : [] })) };
  const adjust = (id, findings) => { const r = JSON.parse(JSON.stringify(honest)); r.cases.find(c => c.id === opaqueOf(id)).findings = findings; return r; };
  const overflow = adjust('v2-04-a', [{ weakness: 'CWE-190', line: 24, explanation: 'test' }]);
  assert.equal(scoreV2(overflow, fullKey).sound_cases_flagged, 1); assert.equal(scoreV2(overflow, fullKey).adjudicated, false);
  const ruled = scoreV2(overflow, fullKey, null, adjudications);
  assert.equal(ruled.adjudicated, true); assert.equal(ruled.sound_cases_flagged, 0); assert.equal(ruled.details.find(d => d.case === 'v2-04-a').correct, true); checks++;
  const relabelledCount = adjudications.rulings.filter(r => r.kind === 'unlabelled_defect' && !corpusV2.cases.find(c => c.id === r.case).defective).length;
  assert.equal(scoreV2(honest, fullKey, null, adjudications).fn, relabelledCount, 'silence on a relabelled member is a miss once adjudicated'); checks++;
  const sink = adjust('v2-11-a', [{ weakness: 'CWE-863', line: 9, explanation: 'test' }]);
  assert.equal(scoreV2(sink, fullKey).fn, 1); assert.equal(scoreV2(sink, fullKey, null, adjudications).details.find(d => d.case === 'v2-11-a').located, true); checks++;
  const extra = adjust('v2-04-b', [{ weakness: 'CWE-20', line: 3, explanation: 'test' }, { weakness: 'CWE-190', line: 24, explanation: 'test' }]);
  assert.equal(scoreV2(extra, fullKey).extra_findings, 1); assert.equal(scoreV2(extra, fullKey, null, adjudications).extra_findings, 0); checks++;
  assert.throws(() => scoreV2(honest, fullKey, null, { ...adjudications, corpus_sha256: 'old' }), /another corpus/); checks++;
  assert.throws(() => compareV2([scoreV2(honest, fullKey), scoreV2(honest, fullKey, null, adjudications)]), /cannot mix/); checks++;
  // Verification task: each claim holds on the defective member and on no other.
  assert.equal(claimsV2.corpus_sha256, corpusV2Hash);
  assert.deepEqual(Object.keys(claimsV2.claims).sort(), [...pairs.keys()].sort()); checks++;
  for (const c of corpusV2.cases) {
    const checkPath = join(dir, c.id + '.claim.mjs'); writeFileSync(checkPath, claimsV2.claims[c.pair].check);
    const { holds } = await import(pathToFileURL(checkPath));
    const mod = await import(pathToFileURL(join(dir, c.id + '.target.mjs')) + '?claim');
    assert.equal(await holds(mod), c.defective, `${c.id}: claim truth disagrees with the label`); checks++;
  }
  const vPacket = join(dir, 'verify-packet'), vKeyPath = join(dir, 'verify-key.json');
  prepareV2(vPacket, { key: vKeyPath, seed: 'seed-x', split: 'B', task: 'verify' });
  const vText = walk(vPacket).map(f => f + '\n' + readFileSync(f, 'utf8')).join('\n');
  for (const leak of ['holds(', 'oracle', 'defective', 'pair_kind', 'v2-0', 'v2-1']) assert.ok(!vText.includes(leak), `verify packet leaks "${leak}"`);
  assert.ok(vText.includes('CLAIM.md')); checks++;
  const vKey = JSON.parse(readFileSync(vKeyPath, 'utf8'));
  const vTruth = id => corpusV2.cases.find(c => c.id === vKey.map[id]).defective;
  const verify = { ...v2, cases: Object.keys(vKey.map).map(id => ({ id, status: 'complete', verdict: vTruth(id) ? 'supported' : 'refuted', explanation: 'test' })) };
  const vPerfect = scoreV2(verify, vKey);
  assert.equal(vPerfect.task, 'verify'); assert.equal(vPerfect.accuracy, 1); assert.equal(vPerfect.false_confirmations, 0); assert.equal(vPerfect.false_refutations, 0); checks++;
  const credulous = { ...verify, cases: verify.cases.map(c => ({ ...c, verdict: 'supported' })) };
  assert.equal(scoreV2(credulous, vKey).false_confirmations, vPerfect.false_claims); assert.equal(scoreV2(credulous, vKey).false_positive_rate, 1); checks++;
  const dismissive = { ...verify, cases: verify.cases.map(c => ({ ...c, verdict: 'refuted' })) };
  assert.equal(scoreV2(dismissive, vKey).false_refutations, vPerfect.true_claims); assert.equal(scoreV2(dismissive, vKey).recall, 0); checks++;
  assert.throws(() => scoreV2({ ...verify, cases: verify.cases.map(c => ({ ...c, verdict: 'unsure' })) }, vKey), /incomplete/); checks++;
  assert.equal(compareV2([vPerfect, perfect]).paired.length, 0, 'runs of different tasks are never paired'); checks++;
  console.log(`${checks} corpus/scorer checks passed (these are NOT detector accuracy results)`);
} finally { rmSync(dir, { recursive: true, force: true }); }
