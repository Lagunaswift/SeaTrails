// Observation records end to end: capture, record, gate, render.
// Every rejection below is evidence that is missing, stale, altered,
// inapplicable or contradicted. The gate must fail closed on each.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { hash, canonical, findingHash } from './assurance.mjs';
import { observe, changedLines } from './observation.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = mkdtempSync(join(tmpdir(), 'seatrial-observation-'));
let count = 0;
const ok = (name) => { count++; if (process.env.VERBOSE) console.log(`✔  ${name}`); };

const VULNERABLE = `const BASE = 'https://app.invalid';
export function nextUrl(next) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return BASE + '/';
  return new URL(next, BASE).href;
}
`;
const FIXED = `const BASE = 'https://app.invalid';
export function nextUrl(next) {
  const url = new URL(typeof next === 'string' ? next : '/', BASE);
  return url.origin === BASE ? url.href : BASE + '/';
}
`;
const RECORDS = `export function getRecord(db, actor, id) {
  return db.find((row) => row.id === id);
}
`;
const QUOTA = `export function allow(state, limit) {
  if (state.count >= limit) return false;
  state.count += 1;
  return true;
}
`;
const PREAMBLE = `import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const load = (file) => import(pathToFileURL(join(process.env.SEATRIAL_SNAPSHOT, file)));
const step = (action, expected, observed) => appendFileSync(process.env.SEATRIAL_STEPS, JSON.stringify({ action, expected, observed }) + '\\n');
`;
const REDIRECT_PROBE = `${PREAMBLE}const { nextUrl } = await load('src/redirect.mjs');
console.log('probing redirect handling');
step('nextUrl("/account")', 'https://app.invalid/account', nextUrl('/account'));
step('origin of nextUrl("/\\\\evil.invalid")', 'https://app.invalid', new URL(nextUrl('/\\\\evil.invalid')).origin);
`;
const QUOTA_PROBE = `${PREAMBLE}const { allow } = await load('src/quota.mjs');
const state = { count: 0 };
const admitted = [1, 2, 3, 4, 5].filter(() => allow(state, 3)).length;
step('five requests against a limit of three', 3, admitted);
`;
// Never touches the target: it reports a deviation whatever the code does.
const FAKE_PROBE = `${PREAMBLE}step('assert the defect', 'safe', 'vulnerable');\n`;

const repo = join(root, 'repo');
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
mkdirSync(join(repo, 'src'), { recursive: true });
execFileSync('git', ['init', '-q', repo]);
const SOURCES = { 'src/redirect.mjs': VULNERABLE, 'src/records.mjs': RECORDS, 'src/quota.mjs': QUOTA };
for (const [file, text] of Object.entries(SOURCES)) writeFileSync(join(repo, file), text);
git('add', '.');
const FILES = Object.keys(SOURCES).sort();

const finding = (id, file, over = {}) => ({ id, lens: 'code-audit', category: id.startsWith('SEC') ? 'security' : 'correctness', severity: 'high',
  title: `Defect in ${file}`, issue: 'The function does not hold its contract.', consequence: 'A caller is misled.', fix: 'Correct the guard.',
  location: { file, line: 2 }, confidence_type: 'factual',
  verification: { status: 'verified', evidence: `${file}:2 — \`${SOURCES[file].split('\n')[1].trim().slice(0, 30)}\`` }, ...over });
const withVerification = (f, extra) => ({ ...f, verification: { ...f.verification, ...extra } });

let serial = 0;
function scenario() {
  const evidence = join(root, `evidence-${++serial}`);
  const cli = (script, ...args) => execFileSync(process.execPath, [join(here, script), ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  cli('capture-source.mjs', 'init', repo, evidence);
  for (const file of FILES) { cli('capture-source.mjs', 'read', repo, evidence, 'author', 'audit', 'code-audit', file); cli('capture-source.mjs', 'read', repo, evidence, 'verifier', 'review', 'code-audit', file); }
  const manifest = JSON.parse(readFileSync(join(evidence, 'manifest.json'), 'utf8'));
  const lastReceipt = (name) => { const text = existsSync(join(evidence, name)) ? readFileSync(join(evidence, name), 'utf8').trim() : ''; return text ? JSON.parse(text.split('\n').pop()).receipt_sha256 : hash(canonical(manifest)); };
  let specs = 0;
  const record = (spec, files = {}) => {
    const dir = join(root, `spec-${serial}-${++specs}`); mkdirSync(dir);
    for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
    writeFileSync(join(dir, 'spec.json'), JSON.stringify({ actor: 'verifier', ...spec }));
    return observe(repo, evidence, join(dir, 'spec.json'));
  };
  const probe = (subject, file, source, over = {}, extra = {}) => record({ kind: 'execution', surface: 'process', fidelity: 'real', subject,
    claim: `Behaviour of ${file} against its contract.`, targets: [file], probe: { files: ['probe.mjs'], command: [process.execPath, '{probe}/probe.mjs'] }, ...over },
    { 'probe.mjs': source, ...extra });
  const gate = ({ findings = [], dropped = [], ledger = null, version = 2, coverage = {}, reviewOver = () => {}, reportOver = {} }) => {
    const raw = ledger || [...findings, ...dropped.map(d => d.raw)];
    const report = { assurance_version: version, scope: { lenses_selected: ['code-audit'], lenses_run: ['code-audit'] },
      coverage: { files_total: FILES.length, files_examined: FILES.length, receipt_head: lastReceipt('reads.jsonl'), areas_total: 1,
        matrix: [{ lens: 'code-audit', files: FILES }], ...(version === 2 ? { observation_head: lastReceipt('observations.jsonl') } : {}), ...coverage },
      findings, dropped: dropped.map(({ raw: _raw, ...d }) => d),
      reconciliation: { raw: raw.length, reported: findings.length, merged: 0, dropped: dropped.length },
      remediation_order: findings.filter(f => f.severity === 'high').map(f => ({ id: f.id, reason: 'Close the demonstrated defect.' })), ...reportOver };
    const review = (f, verdict) => { const r = { finding_id: f.id, finding_sha256: findingHash(f), manifest_sha256: hash(canonical(manifest)), auditor: 'author', reviewer: 'verifier', verdict,
      claim: 'The function does not hold its contract.', preconditions: 'A caller supplies the input.', data_flow: 'The argument reaches the return value.',
      counterevidence: 'No other guard exists in this module.', rationale: 'The quoted line decides the outcome.',
      observation_review: 'The probe imports the cited module from the snapshot and calls the exported function; it shows this input only.',
      citations: [{ file: f.location.file, start: 2, end: 2, quote: SOURCES[f.location.file].split('\n')[1] }] }; reviewOver(r); return r; };
    writeFileSync(join(evidence, 'reviews.json'), JSON.stringify([...findings.filter(f => f.verification.status === 'verified').map(f => review(f, 'supported')), ...dropped.map(d => review(d.raw, 'refuted'))]));
    const audit = join(root, `audit-${serial}-${++specs}`); mkdirSync(audit);
    writeFileSync(join(audit, 'report.json'), JSON.stringify(report));
    writeFileSync(join(audit, 'raw-findings.jsonl'), raw.map(f => JSON.stringify(f)).join('\n'));
    const res = spawnSync(process.execPath, [join(here, 'audit-check.mjs'), audit, '--repo', repo, '--assurance', evidence, '--json'], { encoding: 'utf8' });
    return { ...JSON.parse(res.stdout), audit };
  };
  return { evidence, record, probe, gate };
}
const accepts = (name, result) => { assert.equal(result.ok, true, `${name}: ${(result.failures || []).join(' | ')}`); ok(name); return result; };
const rejects = (name, result, pattern) => { assert.equal(result.ok, false, `${name}: expected rejection`); assert.match(result.failures.join('\n'), pattern, name); ok(name); };
const CONTROL = { control: { replace: [{ file: 'src/redirect.mjs', with: 'fixed.mjs' }] } };
const REDIRECT = finding('SEC-001', 'src/redirect.mjs');
const reproduce = (s) => s.probe('SEC-001', 'src/redirect.mjs', REDIRECT_PROBE, CONTROL, { 'fixed.mjs': FIXED });

try {
  // ---- a reproduced defect ----------------------------------------------------
  {
    const s = scenario();
    const o = reproduce(s);
    assert.equal(o.execution.result, 'deviation'); assert.equal(o.execution.control_status, 'discriminating');
    assert.equal(o.execution.subject.steps, 2); assert.equal(o.execution.subject.deviations, 1);
    assert.deepEqual(o.execution.control.replace[0].changed, changedLines(Buffer.from(VULNERABLE), Buffer.from(FIXED))); ok('probe deviates on the snapshot and conforms under the control replacement');
    const reported = withVerification(REDIRECT, { basis: 'runtime-reproduction', observations: [o.id] });
    const passed = accepts('runtime-reproduction backed by a discriminating observation is accepted', s.gate({ findings: [reported] }));
    assert.equal(passed.assurance.observations[0].control_status, 'discriminating'); ok('gate result carries the observation summary');
    const rendered = spawnSync(process.execPath, [join(here, 'render-report.mjs'), passed.audit, '--repo', repo, '--assurance', s.evidence], { encoding: 'utf8' });
    assert.equal(rendered.status, 0, rendered.stderr);
    assert.match(rendered.stdout, /runtime reproduction/); assert.match(rendered.stdout, /OBS-001/); assert.match(rendered.stdout, /## Observations/); ok('renderer names the evidence basis and lists the observation');
    // Export for another tool: gated, sealed, and refused when the audit does not pass.
    const exportCli = (...args) => spawnSync(process.execPath, [join(here, 'export-findings.mjs'), ...args], { encoding: 'utf8' });
    const exported = exportCli(passed.audit, '--repo', repo, '--assurance', s.evidence);
    assert.equal(exported.status, 0, exported.stderr);
    const bundle = JSON.parse(exported.stdout);
    assert.equal(bundle.format, 'seatrial-findings/1'); assert.equal(bundle.findings[0].evidence_basis, 'runtime-reproduction');
    assert.equal(bundle.findings[0].observations[0].control_status, 'discriminating'); assert.equal(bundle.findings[0].severity, 'high');
    assert.equal(bundle.source.manifest_sha256, passed.assurance.manifest_sha256); assert.equal(bundle.producer.evidence_level, 'assurance-2');
    const bundlePath = join(root, 'bundle.json'); writeFileSync(bundlePath, exported.stdout);
    assert.equal(exportCli('--verify', bundlePath).status, 0); ok('export: a gated audit yields a sealed bundle that carries the evidence basis');
    const softened = JSON.parse(exported.stdout); softened.findings[0].severity = 'low'; writeFileSync(bundlePath, JSON.stringify(softened));
    const refused = exportCli('--verify', bundlePath); assert.equal(refused.status, 2); assert.match(refused.stderr, /SEC-001 was altered/); ok('export: a consumer-side severity edit breaks the seal');
    const promoted = JSON.parse(exported.stdout); promoted.findings.push({ id: 'GAME-001', title: 'Added downstream' }); writeFileSync(bundlePath, JSON.stringify(promoted));
    assert.match(exportCli('--verify', bundlePath).stderr, /altered after export/); ok('export: a finding added downstream breaks the seal');
    const failing = s.gate({ findings: [REDIRECT] });
    const blocked = exportCli(failing.audit, '--repo', repo, '--assurance', s.evidence);
    assert.equal(blocked.status, 1); assert.equal(blocked.stdout, ''); ok('export: an audit that fails the gate exports nothing');
    assert.equal(exportCli(passed.audit).status, 2); ok('export: evidence arguments are required unless the audit is declared legacy');
    rejects('missing: reproduction claimed with no observation cited', s.gate({ findings: [withVerification(REDIRECT, { basis: 'runtime-reproduction' })] }), /not accounted for|no supporting observation/);
    rejects('omitted: an observation recorded for a finding is left out of the report', s.gate({ findings: [REDIRECT] }), /OBS-001 .*not accounted for/);
    rejects('omitted: a finding observation moved to the unbound list', s.gate({ findings: [REDIRECT], coverage: { other_observations: [o.id] } }), /must be cited on that finding/);
    rejects('unknown: a cited observation that was never recorded', s.gate({ findings: [withVerification(reported, { observations: [o.id, 'OBS-009'] })] }), /OBS-009, which is not in the observation chain/);
    rejects('stale head: report names a different observation chain head', s.gate({ findings: [reported], coverage: { observation_head: '0'.repeat(64) } }), /observation_head differs/);
    rejects('version: observation records exist under assurance_version 1', s.gate({ findings: [REDIRECT], version: 1 }), /declare assurance_version 2/);
    rejects('review: the independent review says nothing about the observation', s.gate({ findings: [reported], reviewOver: r => delete r.observation_review }), /observation_review/);
    rejects('contradiction: a reproduced defect cannot be dropped', s.gate({ dropped: [{ id: 'SEC-001', reason: 'Judged unreachable on reading.', observations: [o.id], raw: REDIRECT }] }), /reproduced this defect/);
    const other = finding('SEC-002', 'src/records.mjs');
    rejects('inapplicable: an observation recorded for another finding is borrowed', s.gate({ findings: [REDIRECT, withVerification(other, { basis: 'runtime-reproduction', observations: [o.id] })] }), /was recorded for SEC-001/);

    // Altered evidence. Each edit is restored before the next.
    const tamper = (name, path, change, pattern) => { const before = readFileSync(path); writeFileSync(path, change(before.toString('utf8'))); rejects(name, s.gate({ findings: [reported] }), pattern); writeFileSync(path, before); };
    const store = join(s.evidence, 'observations', 'OBS-001');
    tamper('altered: probe step record edited after the run', join(store, 'subject', 'steps.jsonl'), t => t.replace('evil.invalid', 'app.invalid'), /artefacts are missing or altered/);
    tamper('altered: probe output edited after the run', join(store, 'subject', 'stdout.txt'), t => t + 'extra', /artefacts are missing or altered/);
    tamper('altered: probe source swapped after the run', join(store, 'probe', 'probe.mjs'), () => FAKE_PROBE, /probe file probe.mjs was altered/);
    tamper('altered: control replacement swapped after the run', join(store, 'control', 'replace', '0'), () => VULNERABLE + '\n', /control replacement was altered/);
    tamper('altered: stored specification edited', join(store, 'spec.json'), t => t.replace('"real"', '"stubbed"'), /stored specification was altered/);
    const log = join(s.evidence, 'observations.jsonl');
    tamper('altered: recorded outcome edited without rehashing', log, t => t.replace('"control_status":"discriminating"', '"control_status":"absent"'), /broken observation chain/);
    // A forger who rehashes the chain still cannot make the outcome disagree with the stored runs.
    const forge = (change) => (t) => { const r = JSON.parse(t.trim()); const { receipt_sha256: _old, ...body } = r; change(body); return JSON.stringify({ ...body, receipt_sha256: hash(canonical(body)) }) + '\n'; };
    const forged = (name, change, pattern) => { const before = readFileSync(log); writeFileSync(log, forge(change)(before.toString('utf8')));
      const head = JSON.parse(readFileSync(log, 'utf8').trim()).receipt_sha256; rejects(name, s.gate({ findings: [reported], coverage: { observation_head: head } }), pattern); writeFileSync(log, before); };
    forged('forged: rehashed chain flips a conforming control to discriminating', b => { b.execution.control.result = 'deviation'; }, /recorded control result differs|recorded outcome differs/);
    forged('forged: rehashed chain hides the deviation count', b => { b.execution.subject.deviations = 0; b.execution.subject.result = 'conforms'; b.execution.result = 'conforms'; b.execution.control_status = 'not_run'; }, /result differs from its stored steps/);
    forged('forged: rehashed chain retargets the observation outside the inventory', b => { b.targets = ['src/absent.mjs']; }, /targets must name inventoried files/);
  }

  // ---- weaker evidence cannot be presented as stronger ----------------------------
  {
    const s = scenario();
    const o = s.probe('SEC-001', 'src/redirect.mjs', REDIRECT_PROBE);
    assert.equal(o.execution.control_status, 'absent');
    rejects('overclaim: an uncontrolled run presented as a reproduction', s.gate({ findings: [withVerification(REDIRECT, { basis: 'runtime-reproduction', observations: [o.id] })] }), /no supporting observation/);
    accepts('an uncontrolled run is accepted as runtime-observation', s.gate({ findings: [withVerification(REDIRECT, { basis: 'runtime-observation', observations: [o.id] })] }));
    rejects('overclaim: an executed probe presented as a simulated test is still checked', s.gate({ findings: [withVerification(REDIRECT, { basis: 'simulated-test', observations: [o.id] })] }), /no supporting observation/);
    accepts('underclaim: a quote-verified finding may cite its observation', s.gate({ findings: [withVerification(REDIRECT, { observations: [o.id] })] }));
    rejects('basis on an unverified finding', s.gate({ findings: [{ ...REDIRECT, severity: 'medium', verification: { status: 'unverified', basis: 'runtime-observation', observations: [o.id] } }] }), /only meaningful on a verified finding/);
  }
  {
    const s = scenario();
    const o = s.probe('SEC-001', 'src/redirect.mjs', FAKE_PROBE, CONTROL, { 'fixed.mjs': FIXED });
    assert.equal(o.execution.control_status, 'non_discriminating'); ok('a probe that ignores the target is caught by the control');
    rejects('fake probe: non-discriminating control cannot back a reproduction', s.gate({ findings: [withVerification(REDIRECT, { basis: 'runtime-reproduction', observations: [o.id] })] }), /no supporting observation/);
    rejects('fake probe: non-discriminating control cannot back an observation either', s.gate({ findings: [withVerification(REDIRECT, { basis: 'runtime-observation', observations: [o.id] })] }), /no supporting observation/);
  }
  {
    const s = scenario();
    const o = s.probe('SEC-001', 'src/redirect.mjs', FAKE_PROBE, { fidelity: 'simulated', stubs: ['whole redirect module modelled in the probe'] });
    rejects('simulated test presented as a runtime observation', s.gate({ findings: [withVerification(REDIRECT, { basis: 'runtime-observation', observations: [o.id] })] }), /no supporting observation/);
    accepts('a simulated test is accepted under its own name', s.gate({ findings: [withVerification(REDIRECT, { basis: 'simulated-test', observations: [o.id] })] }));
  }
  {
    // The control changes a different file from the one the finding blames.
    const s = scenario();
    const o = s.probe('SEC-002', 'src/records.mjs', REDIRECT_PROBE, CONTROL, { 'fixed.mjs': FIXED });
    assert.equal(o.execution.control_status, 'discriminating');
    rejects('inapplicable: reproduction whose control changes another file', s.gate({ findings: [withVerification(finding('SEC-002', 'src/records.mjs'), { basis: 'runtime-reproduction', observations: [o.id] })] }), /does not tie the behaviour/);
  }

  // ---- negative results are evidence too --------------------------------------------
  {
    const s = scenario();
    const quota = finding('COR-001', 'src/quota.mjs');
    const o = s.probe('COR-001', 'src/quota.mjs', QUOTA_PROBE);
    assert.equal(o.execution.result, 'conforms'); ok('a probe of correct code records a conforming result');
    accepts('a refuted finding is dropped with its conforming observation cited', s.gate({ dropped: [{ id: 'COR-001', reason: 'The limit admits exactly three requests.', observations: [o.id], raw: { ...quota, verification: { status: 'refuted', evidence: 'src/quota.mjs:2 — `if (state.count >= limit) return false;` rejects the fourth call' } } }] }));
    rejects('contradiction: verified although the only real probe saw conforming behaviour', s.gate({ findings: [withVerification(quota, { observations: [o.id] })] }), /saw conforming behaviour/);
    const fake = s.probe('COR-001', 'src/quota.mjs', FAKE_PROBE);
    assert.equal(fake.execution.result, 'deviation');
    rejects('contradiction: an uncontrolled deviating probe does not cancel a conforming one', s.gate({ findings: [withVerification(quota, { observations: [o.id, fake.id] })] }), /saw conforming behaviour/);
    rejects('review: observations cited on a quote-verified finding still need the reviewer\'s assessment', s.gate({ findings: [withVerification(quota, { observations: [o.id, fake.id], observation_conflict_note: 'The probe used a single caller; the defect needs two interleaved callers.' })], reviewOver: r => delete r.observation_review }), /observation_review/);
    const both = [o.id, fake.id];
    const kept = accepts('a conflict kept on source reading must say why, and is surfaced', s.gate({ findings: [withVerification(quota, { observations: both, observation_conflict_note: 'The probe used a single caller; the defect needs two interleaved callers.' })] }));
    assert.ok(kept.warnings.some(w => /COR-001.*conforming/.test(w))); ok('the retained conflict is a visible warning');
  }
  {
    const s = scenario();
    const o = s.record({ kind: 'execution', surface: 'web', fidelity: 'real', subject: 'SEC-001', claim: 'Redirect followed in a browser.', targets: ['src/redirect.mjs'], unavailable: 'No browser runtime in the controller environment.' });
    assert.equal(o.execution.result, 'unavailable');
    accepts('unavailable evidence is recorded and cited without supporting anything', s.gate({ findings: [withVerification(REDIRECT, { observations: [o.id] })] }));
    rejects('unavailable evidence cannot back a runtime basis', s.gate({ findings: [withVerification(REDIRECT, { basis: 'runtime-observation', observations: [o.id] })] }), /no supporting observation/);
  }

  // ---- probe failures are errors, not results ---------------------------------------
  {
    const s = scenario();
    const crash = s.probe('SEC-001', 'src/redirect.mjs', `${PREAMBLE}step('before the crash', 1, 2);\nthrow new Error('boom');\n`);
    assert.equal(crash.execution.result, 'error'); ok('a crashing probe is an error even after reporting a deviation');
    const silent = s.probe('SEC-001', 'src/redirect.mjs', 'console.log("REPRODUCED");\n');
    assert.equal(silent.execution.result, 'error'); ok('a probe that prints a verdict but records no step is an error');
    const slow = s.probe('SEC-001', 'src/redirect.mjs', 'setTimeout(() => {}, 60000);\n', { timeout_ms: 300 });
    assert.equal(slow.execution.result, 'error'); assert.equal(slow.execution.subject.timed_out, true); ok('a probe that exceeds its deadline is an error');
    rejects('errored probes cannot back a runtime basis', s.gate({ findings: [withVerification(REDIRECT, { basis: 'runtime-observation', observations: [crash.id, silent.id, slow.id] })] }), /no supporting observation/);
    process.env.SEATRIAL_TEST_SECRET = 'do-not-leak';
    const env = s.probe('SEC-001', 'src/redirect.mjs', `${PREAMBLE}step('ambient credential visible to the probe', null, process.env.SEATRIAL_TEST_SECRET ?? null);\n`);
    delete process.env.SEATRIAL_TEST_SECRET;
    assert.equal(env.execution.result, 'conforms'); ok('the probe environment is scrubbed of ambient variables');
  }

  // ---- static search ----------------------------------------------------------------
  {
    const s = scenario();
    const records = finding('SEC-002', 'src/records.mjs');
    const absent = s.record({ kind: 'search', subject: 'SEC-002', claim: 'No ownership comparison exists in the record lookup.', targets: ['src/records.mjs'], search: { pattern: 'owner|actor\\s*===', include: ['src/records.mjs'], expect: 'absent' } });
    assert.equal(absent.search.holds, true); assert.equal(absent.search.files_scanned, 1);
    const reported = withVerification(records, { basis: 'static-search', observations: [absent.id] });
    accepts('static-search basis backed by a replayed search is accepted', s.gate({ findings: [reported] }));
    const present = s.record({ kind: 'search', subject: 'exploratory', claim: 'Every module exports a function.', targets: FILES, search: { pattern: '^export function', expect: 'present' } });
    assert.equal(present.search.match_count, 3);
    rejects('omitted: an exploratory observation left out of the report', s.gate({ findings: [reported] }), /OBS-002 .*not accounted for/);
    accepts('exploratory observations are listed under coverage.other_observations', s.gate({ findings: [reported], coverage: { other_observations: [present.id] } }));
    const log = join(s.evidence, 'observations.jsonl');
    const original = readFileSync(log, 'utf8');
    const lines = original.trim().split('\n').map(l => JSON.parse(l));
    const rehash = (r, previous) => { const { receipt_sha256: _old, ...body } = r; body.previous = previous; return { ...body, receipt_sha256: hash(canonical(body)) }; };
    lines[0].search.match_count = 0; lines[0].search.holds = true; lines[0].search.pattern = 'row'; lines[0].search.matches = []; lines[0].search.matches_sha256 = hash(canonical([]));
    const first = rehash(lines[0], lines[0].previous), second = rehash(lines[1], first.receipt_sha256);
    writeFileSync(log, [first, second].map(r => JSON.stringify(r)).join('\n') + '\n');
    rejects('forged: rehashed search result that a replay does not reproduce', s.gate({ findings: [reported], coverage: { other_observations: [present.id], observation_head: second.receipt_sha256 } }), /differs from a replay/);
    writeFileSync(log, original);
    const missed = s.record({ kind: 'search', subject: 'SEC-002', claim: 'No lookup by id exists.', targets: ['src/records.mjs'], search: { pattern: 'row\\.id', expect: 'absent' } });
    assert.equal(missed.search.holds, false);
    rejects('a search whose expectation failed cannot back static-search', s.gate({ findings: [withVerification(records, { basis: 'static-search', observations: [missed.id] })], coverage: { other_observations: [present.id] } }), /not accounted for|no supporting observation/);
    assert.throws(() => s.record({ kind: 'search', subject: 'x', claim: 'x', targets: FILES, search: { pattern: '(', expect: 'absent' } }), /Invalid regular expression/); ok('an invalid pattern is refused');
    assert.throws(() => s.record({ kind: 'search', subject: 'x', claim: 'x', targets: FILES, search: { pattern: 'a', flags: 'g', expect: 'absent' } }), /flags/); ok('stateful flags are refused');
    assert.throws(() => s.record({ kind: 'search', subject: 'x', claim: 'x', targets: ['src/none.mjs'], search: { pattern: 'a', expect: 'absent' } }), /inventoried/); ok('a target outside the inventory is refused');
  }

  // ---- website evidence modes ---------------------------------------------------------
  {
    const s = scenario();
    const topics = ['journeys', 'identity-navigation', 'access-security', 'commerce', 'reliability-cost', 'interaction-states', 'mobile-accessibility', 'performance', 'discovery-sharing', 'privacy-measurement', 'content-brand', 'layout-features'];
    const website = (evidence) => ({ scope: { lenses_selected: ['code-audit'], lenses_run: ['code-audit'], review_profiles: ['website-readiness'] }, coverageExtra: {
      website_readiness: { topics: topics.map((id, i) => ({ id, owner: 'code-audit', applicability: 'applicable', reason: 'Review the fixture surface.', status: 'assessed', surfaces: ['/: initial state'],
        evidence: i === 0 ? evidence : [{ mode: 'source', ref: 'src/redirect.mjs:2, captured source review' }], finding_ids: [], limitations: [] })),
      features: Array.from({ length: 24 }, (_, i) => ({ id: `OPT-${String(i + 1).padStart(2, '0')}`, presence: 'absent', decision: 'not_needed', reason: 'No approved task needs this feature.', finding_ids: [], evidence: [], limitations: [] })) } } });
    const run = (evidence, extra = {}) => { const w = website(evidence); return s.gate({ reportOver: { scope: w.scope }, coverage: { ...w.coverageExtra, ...extra } }); };
    rejects('website: interactive evidence with only a prose reference', run([{ mode: 'interactive', ref: 'Walked the sign-in journey by hand.' }]), /interactive evidence must name the observation/);
    const processRun = s.probe('journeys', 'src/redirect.mjs', REDIRECT_PROBE);
    rejects('website: interactive evidence backed by a non-web observation', run([{ mode: 'interactive', ref: 'Redirect journey.', observation: processRun.id }]), /needs a completed web observation/);
    const webRun = s.probe('journeys', 'src/redirect.mjs', REDIRECT_PROBE, { surface: 'web' });
    accepts('website: interactive evidence backed by a recorded web observation', run([{ mode: 'interactive', ref: 'Redirect journey.', observation: webRun.id }], { other_observations: [processRun.id] }));
    rejects('website: one observation cited twice', run([{ mode: 'interactive', ref: 'Redirect journey.', observation: webRun.id }, { mode: 'rendered', ref: 'Same run again.', observation: webRun.id }], { other_observations: [processRun.id] }), /referenced more than once/);
  }

  // ---- the audited repository stays untouched; stale snapshots fail ------------------
  {
    const s = scenario();
    assert.throws(() => s.probe('SEC-001', 'src/redirect.mjs', `import { writeFileSync } from 'node:fs';\nwriteFileSync(process.env.TARGET, 'tampered');\n`, { env: { TARGET: join(repo, 'src/quota.mjs') } }), /repository changed during observation/);
    writeFileSync(join(repo, 'src/quota.mjs'), QUOTA);
    assert.equal(existsSync(join(s.evidence, 'observations.jsonl')), false); assert.equal(existsSync(join(s.evidence, 'observations', 'OBS-001')), false); ok('a probe that writes to the audited repository is discarded, with no record');
    assert.throws(() => s.probe('SEC-001', 'src/redirect.mjs', REDIRECT_PROBE, { links: ['src'] }), /tracked source/); ok('tracked source cannot be linked into the snapshot');
    assert.throws(() => s.probe('SEC-001', 'src/redirect.mjs', REDIRECT_PROBE, { control: { replace: [{ file: 'src/redirect.mjs', with: 'same.mjs' }] } }, { 'same.mjs': VULNERABLE }), /identical to the source/); ok('a control that changes nothing is refused');
    assert.throws(() => s.probe('SEC-001', 'src/redirect.mjs', REDIRECT_PROBE, { fidelity: 'stubbed' }), /stubs must name/); ok('stubbed fidelity must name its stubs');
    const o = reproduce(s);
    const reported = withVerification(REDIRECT, { basis: 'runtime-reproduction', observations: [o.id] });
    accepts('baseline before the source moves', s.gate({ findings: [reported] }));
    writeFileSync(join(repo, 'src/redirect.mjs'), FIXED);
    rejects('stale: the source changed after the observation', s.gate({ findings: [reported] }), /inventory changed/);
    assert.throws(() => reproduce(s), /inventory changed/); ok('a new observation against a moved source is refused');
    writeFileSync(join(repo, 'src/redirect.mjs'), VULNERABLE);
    const cli = spawnSync(process.execPath, [join(here, 'observe.mjs'), repo, s.evidence], { encoding: 'utf8' });
    assert.equal(cli.status, 2); assert.match(cli.stderr, /usage/); ok('the command refuses incomplete arguments');
  }
  // ---- web journey example (needs the controller's browser library) -------------------
  let browser = 'skipped: no browser library resolves in this environment';
  let playwright = null;
  try { playwright = createRequire(import.meta.url).resolve('playwright'); } catch { /* optional */ }
  if (playwright) {
    const example = join(here, 'fixtures', 'observation', 'web-journey');
    const site = join(root, 'site-repo');
    mkdirSync(join(site, 'site'), { recursive: true });
    execFileSync('git', ['init', '-q', site]);
    writeFileSync(join(site, 'site', 'index.html'), readFileSync(join(example, 'site', 'index.html')));
    execFileSync('git', ['-C', site, 'add', '.']);
    const evidence = join(root, 'site-evidence');
    execFileSync(process.execPath, [join(here, 'capture-source.mjs'), 'init', site, evidence], { stdio: 'ignore' });
    const env = Object.fromEntries(['NODE_PATH', 'PLAYWRIGHT_BROWSERS_PATH'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
    const specDir = join(root, 'site-spec'); mkdirSync(specDir);
    for (const name of ['probe.mjs', 'index.control.html']) writeFileSync(join(specDir, name), readFileSync(join(example, name)));
    writeFileSync(join(specDir, 'spec.json'), JSON.stringify({ kind: 'execution', surface: 'web', fidelity: 'real', actor: 'verifier', subject: 'FE-001',
      claim: 'A double click places two orders.', targets: ['site/index.html'], probe: { files: ['probe.mjs'], command: [process.execPath, '{probe}/probe.mjs'] },
      control: { replace: [{ file: 'site/index.html', with: 'index.control.html' }] }, env, timeout_ms: 120000 }));
    const o = observe(site, evidence, join(specDir, 'spec.json'));
    assert.equal(o.execution.result, 'deviation', JSON.stringify(o.execution.subject));
    assert.equal(o.execution.control_status, 'discriminating', JSON.stringify(o.execution.control));
    assert.equal(o.execution.subject.steps, 2); assert.equal(o.execution.subject.deviations, 1);
    assert.equal(o.execution.subject.artefacts[0].path, 'after-double-click.png'); assert.ok(o.execution.subject.artefacts[0].bytes > 1000);
    ok('web journey: double submission deviates in a real browser, the control removes it, a screenshot is retained');
    browser = 'web journey example ran in a real browser';
  }
  console.log(`${count} observation checks passed (${browser})`);
} finally { rmSync(root, { recursive: true, force: true }); }
