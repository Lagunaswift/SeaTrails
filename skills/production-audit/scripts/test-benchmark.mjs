import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { corpus, corpusHash, score } from './benchmark.mjs';
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
  console.log(`${checks} corpus/scorer checks passed (these are NOT detector accuracy results)`);
} finally { rmSync(dir, { recursive: true, force: true }); }
