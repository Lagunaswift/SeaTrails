// Observation records: seatrial-observation/1.
// A quotation shows text alignment. An observation shows what a search or an
// executed probe returned against the captured snapshot. This module records
// both kinds and lets the gate re-derive every stored conclusion. The gate
// replays searches and re-hashes probe artefacts; it never executes a probe.
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync, appendFileSync,
  symlinkSync, readdirSync, statSync, chmodSync } from 'node:fs';
import { resolve, join, dirname, basename, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hash, canonical, source, inventory } from './assurance.mjs';

export const FORMAT = 'seatrial-observation/1';
export const BASES = ['source-quote', 'static-search', 'runtime-observation', 'runtime-reproduction', 'simulated-test'];
const SURFACES = ['process', 'web', 'game'];
const FIDELITY = ['real', 'stubbed', 'simulated'];
const OBS_ID = /^OBS-\d{3,}$/;
const LIMITS = { pattern: 300, line: 4000, matches: 500, steps: 200, stepBytes: 1 << 20, output: 4 << 20,
  artefacts: 20, artefactBytes: 5 << 20, timeout: 600000, searchMs: 30000 };
const nonempty = v => typeof v === 'string' && v.trim().length > 0;
const strings = v => Array.isArray(v) && v.every(nonempty);
const obsId = n => `OBS-${String(n).padStart(3, '0')}`;
const safeName = v => nonempty(v) && !isAbsolute(v) && !v.includes('\\') && v.split('/').every(p => p && p !== '.' && p !== '..');
const SELF = fileURLToPath(import.meta.url);

// ---- static search -----------------------------------------------------------
// Line-based regular-expression scan over the inventoried text files. The scan
// is deterministic, so the gate repeats it instead of trusting the stored result.
function scan({ repo, files, pattern, flags, include }) {
  const re = new RegExp(pattern, flags || '');
  const out = { files_scanned: 0, binary_skipped: 0, long_lines_truncated: 0, match_count: 0, matches: [] };
  for (const file of files) {
    if (include.length && !include.some(p => file === p || file.startsWith(p))) continue;
    const bytes = source(repo, file);
    if (bytes.includes(0)) { out.binary_skipped++; continue; }
    out.files_scanned++;
    const lines = bytes.toString('utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.length > LIMITS.line) { line = line.slice(0, LIMITS.line); out.long_lines_truncated++; }
      if (re.test(line)) { out.match_count++; out.matches.push({ file, line: i + 1 }); }
    }
  }
  out.matches_sha256 = hash(canonical(out.matches));
  out.matches = out.matches.slice(0, LIMITS.matches);
  return out;
}
// A report-supplied pattern can backtrack without bound. Run the scan in a
// child with a deadline; a search that cannot finish is not evidence.
export function runSearch(repo, files, search) {
  const input = JSON.stringify({ repo, files, pattern: search.pattern, flags: search.flags || '', include: search.include || [] });
  const child = spawnSync(process.execPath, [SELF, '--search-worker'], { input, encoding: 'utf8', timeout: LIMITS.searchMs, maxBuffer: 64 << 20 });
  if (child.error || child.status !== 0) throw Error(`search did not complete (${child.error?.code || child.stderr?.trim() || 'failed'})`);
  return JSON.parse(child.stdout);
}
function validateSearch(search) {
  if (!search || typeof search !== 'object') throw Error('search block missing');
  if (!nonempty(search.pattern) || search.pattern.length > LIMITS.pattern) throw Error(`search.pattern must be 1-${LIMITS.pattern} characters`);
  if (search.flags != null && !/^[iu]{0,2}$/.test(search.flags)) throw Error('search.flags may contain only i and u');
  if (search.include != null && !strings(search.include)) throw Error('search.include must be an array of path prefixes');
  if (!['present', 'absent'].includes(search.expect)) throw Error('search.expect must be present or absent');
  new RegExp(search.pattern, search.flags || '');
}
const searchHolds = (expect, count) => expect === 'absent' ? count === 0 : count > 0;

// ---- executed probes -----------------------------------------------------------
// The probe reports steps: the action taken, the outcome the application's
// contract requires, and the outcome it saw. The tool, not the probe, decides
// whether they differ, and derives the result from the stored bytes.
export function parseSteps(text) {
  const steps = [];
  for (const line of text.split('\n').filter(l => l.trim())) {
    const step = JSON.parse(line);
    if (!step || typeof step !== 'object' || Array.isArray(step) || !nonempty(step.action)
      || !Object.prototype.hasOwnProperty.call(step, 'expected') || !Object.prototype.hasOwnProperty.call(step, 'observed')) throw Error('each step needs action, expected and observed');
    steps.push({ action: step.action, deviates: canonical(step.expected) !== canonical(step.observed) });
  }
  if (!steps.length || steps.length > LIMITS.steps) throw Error(`a probe must record 1-${LIMITS.steps} steps`);
  return steps;
}
export function armResult(arm, stepsText) {
  if (arm.timed_out) return { result: 'error', reason: 'probe timed out' };
  if (arm.exit_code !== 0) return { result: 'error', reason: `probe exited ${arm.signal || arm.exit_code}` };
  let steps;
  try { steps = parseSteps(stepsText); } catch (e) { return { result: 'error', reason: `invalid step record: ${e.message}` }; }
  const deviations = steps.filter(s => s.deviates).length;
  return { result: deviations ? 'deviation' : 'conforms', steps: steps.length, deviations };
}
export function controlStatus(subjectResult, control) {
  if (!control) return 'absent';
  if (subjectResult !== 'deviation') return 'not_run';
  return control.result === 'conforms' ? 'discriminating' : control.result === 'deviation' ? 'non_discriminating' : 'failed';
}
// Lines of the original that the control replacement changes (common prefix
// and suffix trimmed). An insertion yields an empty range starting at its position.
export function changedLines(original, replacement) {
  const a = original.toString('utf8').split('\n'), b = replacement.toString('utf8').split('\n');
  let p = 0; while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let s = 0; while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
  return { start: p + 1, end: a.length - s };
}

function validateExecution(spec, manifestFiles) {
  if (!SURFACES.includes(spec.surface)) throw Error(`surface must be one of ${SURFACES.join(', ')}`);
  if (!FIDELITY.includes(spec.fidelity)) throw Error(`fidelity must be one of ${FIDELITY.join(', ')}`);
  if (spec.fidelity === 'real' ? (spec.stubs != null && spec.stubs.length) : !(strings(spec.stubs) && spec.stubs.length)) throw Error('stubs must name what was replaced, and only when fidelity is not real');
  if (spec.unavailable != null) { if (!nonempty(spec.unavailable)) throw Error('unavailable needs a reason'); return; }
  const probe = spec.probe;
  if (!probe || !Array.isArray(probe.files) || !probe.files.length || !probe.files.every(safeName)) throw Error('probe.files must list relative probe files');
  if (new Set(probe.files.map(f => basename(f))).size !== probe.files.length) throw Error('probe file names must be unique');
  if (!strings(probe.command) || !probe.command.length) throw Error('probe.command must be an argument array');
  if (spec.timeout_ms != null && (!Number.isSafeInteger(spec.timeout_ms) || spec.timeout_ms < 1 || spec.timeout_ms > LIMITS.timeout)) throw Error('invalid timeout_ms');
  if (spec.links != null && !(Array.isArray(spec.links) && spec.links.every(safeName))) throw Error('links must be relative paths');
  for (const link of spec.links || []) if (manifestFiles.some(f => f === link || f.startsWith(link + '/'))) throw Error(`link ${link} is tracked source; only untracked dependency directories may be linked`);
  if (spec.env != null && (typeof spec.env !== 'object' || Array.isArray(spec.env) || Object.entries(spec.env).some(([k, v]) => !/^[A-Z][A-Z0-9_]*$/.test(k) || typeof v !== 'string' || /^SEATRIAL_/.test(k)))) throw Error('env must map upper-case names to strings');
  if (spec.control != null) {
    const r = spec.control.replace;
    if (!Array.isArray(r) || !r.length || r.some(e => !e || !manifestFiles.includes(e.file) || !safeName(e.with))) throw Error('control.replace entries need an inventoried file and a replacement path');
    if (new Set(r.map(e => e.file)).size !== r.length) throw Error('control.replace repeats a file');
  }
}

function materialise(repo, manifest, links) {
  const dir = mkdtempSync(join(tmpdir(), 'seatrial-snapshot-'));
  for (const entry of manifest.files) {
    const bytes = source(repo, entry.file);
    if (hash(bytes) !== entry.sha256) throw Error(`source changed since capture: ${entry.file}`);
    const path = join(dir, entry.file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, bytes);
    chmodSync(path, statSync(resolve(repo, entry.file)).mode & 0o777);
  }
  for (const link of links || []) {
    const target = resolve(repo, link);
    if (!existsSync(target)) throw Error(`link target missing: ${link}`);
    mkdirSync(dirname(join(dir, link)), { recursive: true });
    symlinkSync(target, join(dir, link));
  }
  return dir;
}

function runArm(spec, snapshot, probeDir, store) {
  const work = mkdtempSync(join(tmpdir(), 'seatrial-arm-'));
  try {
    const stepsPath = join(work, 'steps.jsonl'), artefactDir = join(work, 'artefacts'), home = join(work, 'home');
    mkdirSync(artefactDir); mkdirSync(home); writeFileSync(stepsPath, '');
    const fill = a => a.split('{probe}').join(probeDir).split('{snapshot}').join(snapshot);
    const [command, ...args] = spec.probe.command.map(fill);
    // Scrubbed environment: a probe receives no ambient credentials.
    const env = { PATH: process.env.PATH || '', HOME: home, TMPDIR: work, ...(spec.env || {}),
      SEATRIAL_SNAPSHOT: snapshot, SEATRIAL_PROBE: probeDir, SEATRIAL_STEPS: stepsPath, SEATRIAL_ARTEFACTS: artefactDir };
    const started = Date.now();
    const child = spawnSync(command, args, { cwd: snapshot, env, timeout: spec.timeout_ms || 60000, maxBuffer: LIMITS.output, killSignal: 'SIGKILL' });
    const timedOut = child.error?.code === 'ETIMEDOUT';
    if (child.error && !timedOut && child.error.code !== 'ENOBUFS') throw Error(`probe could not start: ${child.error.message}`);
    const stdout = child.stdout || Buffer.alloc(0), stderr = child.stderr || Buffer.alloc(0);
    let stepsText = readFileSync(stepsPath);
    if (stepsText.length > LIMITS.stepBytes) stepsText = Buffer.from('');
    mkdirSync(join(store, 'artefacts'), { recursive: true });
    writeFileSync(join(store, 'stdout.txt'), stdout); writeFileSync(join(store, 'stderr.txt'), stderr); writeFileSync(join(store, 'steps.jsonl'), stepsText);
    const artefacts = [];
    for (const name of readdirSync(artefactDir).sort().slice(0, LIMITS.artefacts)) {
      const path = join(artefactDir, name);
      if (!statSync(path).isFile() || statSync(path).size > LIMITS.artefactBytes) continue;
      const bytes = readFileSync(path);
      writeFileSync(join(store, 'artefacts', name), bytes);
      artefacts.push({ path: name, sha256: hash(bytes), bytes: bytes.length });
    }
    const arm = { exit_code: child.status, signal: child.signal || null, timed_out: timedOut, duration_ms: Date.now() - started,
      stdout_sha256: hash(stdout), stderr_sha256: hash(stderr), steps_sha256: hash(stepsText), artefacts };
    return { ...arm, ...armResult(arm, stepsText.toString('utf8')) };
  } finally { rmSync(work, { recursive: true, force: true }); }
}

// ---- record an observation (controller side) ---------------------------------
export function observe(repo, directory, specPath) {
  const dir = resolve(directory), specDir = dirname(resolve(specPath));
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const before = inventory(repo);
  if (canonical(before) !== canonical(manifest.files)) throw Error('inventory changed or is incomplete; restart capture');
  const files = manifest.files.map(f => f.file);
  for (const key of ['actor', 'subject', 'claim']) if (!nonempty(spec[key])) throw Error(`spec.${key} is required`);
  if (!Array.isArray(spec.targets) || !spec.targets.length || spec.targets.some(t => !files.includes(t))) throw Error('targets must name inventoried files');
  if (!['search', 'execution'].includes(spec.kind)) throw Error('kind must be search or execution');
  const log = join(dir, 'observations.jsonl');
  const records = existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean).map(JSON.parse) : [];
  const id = obsId(records.length + 1);
  const store = join(dir, 'observations', id);
  if (existsSync(store)) throw Error(`observation store ${id} already exists`);
  const body = { format: FORMAT, sequence: records.length + 1,
    previous: records.length ? records[records.length - 1].receipt_sha256 : hash(canonical(manifest)),
    run_id: manifest.run_id, id, kind: spec.kind, actor: spec.actor, subject: spec.subject, claim: spec.claim,
    targets: [...new Set(spec.targets)].sort(), spec_sha256: hash(canonical(spec)) };
  const snapshots = [];
  try {
    if (spec.kind === 'search') {
      validateSearch(spec.search);
      const excluded = new Set((manifest.exclusions || []).map(e => e.file));
      const found = runSearch(repo, files.filter(f => !excluded.has(f)), spec.search);
      body.search = { pattern: spec.search.pattern, flags: spec.search.flags || '', include: spec.search.include || [],
        expect: spec.search.expect, ...found, holds: searchHolds(spec.search.expect, found.match_count) };
      mkdirSync(store, { recursive: true });
    } else {
      validateExecution(spec, files);
      const base = { surface: spec.surface, fidelity: spec.fidelity, stubs: spec.stubs || [] };
      if (spec.unavailable != null) {
        body.execution = { ...base, result: 'unavailable', reason: spec.unavailable, control_status: 'absent' };
        mkdirSync(store, { recursive: true });
      } else {
        const probeBytes = spec.probe.files.map(f => ({ name: basename(f), bytes: readFileSync(resolve(specDir, f)) }));
        const control = (spec.control?.replace || []).map(e => ({ file: e.file, bytes: readFileSync(resolve(specDir, e.with)) }));
        for (const c of control) if (hash(c.bytes) === manifest.files.find(f => f.file === c.file).sha256) throw Error(`control replacement for ${c.file} is identical to the source`);
        mkdirSync(join(store, 'probe'), { recursive: true });
        for (const p of probeBytes) writeFileSync(join(store, 'probe', p.name), p.bytes);
        const probeDir = mkdtempSync(join(tmpdir(), 'seatrial-probe-')); snapshots.push(probeDir);
        for (const p of probeBytes) writeFileSync(join(probeDir, p.name), p.bytes);
        const subjectDir = materialise(repo, manifest, spec.links); snapshots.push(subjectDir);
        const subject = runArm(spec, subjectDir, probeDir, join(store, 'subject'));
        let controlArm = null;
        if (control.length) {
          controlArm = { replace: control.map(c => ({ file: c.file, sha256: hash(c.bytes), changed: changedLines(source(repo, c.file), c.bytes) })) };
          control.forEach((c, i) => { mkdirSync(join(store, 'control', 'replace'), { recursive: true }); writeFileSync(join(store, 'control', 'replace', String(i)), c.bytes); });
          if (subject.result === 'deviation') {
            const controlDir = materialise(repo, manifest, spec.links); snapshots.push(controlDir);
            for (const c of control) writeFileSync(join(controlDir, c.file), c.bytes);
            Object.assign(controlArm, runArm(spec, controlDir, probeDir, join(store, 'control')));
          }
        }
        body.execution = { ...base, command: spec.probe.command, env_keys: Object.keys(spec.env || {}).sort(), links: spec.links || [],
          timeout_ms: spec.timeout_ms || 60000, probe_files: probeBytes.map(p => ({ path: p.name, sha256: hash(p.bytes) })),
          subject, control: controlArm, result: subject.result, control_status: controlStatus(subject.result, controlArm) };
      }
    }
    // An audit reads; it never writes. A probe that altered the audited
    // repository invalidates the capture, and nothing is recorded.
    if (canonical(inventory(repo)) !== canonical(before)) throw Error('the audited repository changed during observation; discard this capture');
    writeFileSync(join(store, 'spec.json'), canonical(spec));
    const record = { ...body, receipt_sha256: hash(canonical(body)) };
    appendFileSync(log, JSON.stringify(record) + '\n');
    return record;
  } catch (e) {
    rmSync(store, { recursive: true, force: true });
    throw e;
  } finally { for (const s of snapshots) rmSync(s, { recursive: true, force: true }); }
}

// ---- gate side -----------------------------------------------------------------
const supports = {
  'static-search': o => o.kind === 'search' && o.search.holds,
  'runtime-observation': o => o.kind === 'execution' && o.execution.fidelity !== 'simulated' && o.execution.result === 'deviation'
    && o.execution.control_status !== 'non_discriminating',
  'runtime-reproduction': o => o.kind === 'execution' && o.execution.fidelity !== 'simulated' && o.execution.result === 'deviation'
    && o.execution.control_status === 'discriminating',
  'simulated-test': o => o.kind === 'execution' && o.execution.fidelity === 'simulated' && o.execution.result === 'deviation',
};
// True when a report makes any claim that only observation records can back.
export function claimsObservations(report) {
  const c = report?.coverage || {};
  if (c.observation_head != null || c.other_observations != null) return true;
  for (const f of report?.findings || []) {
    const v = f?.verification || {};
    if ((v.basis != null && v.basis !== 'source-quote') || (Array.isArray(v.observations) && v.observations.length) || v.observation_conflict_note != null) return true;
  }
  if ((report?.dropped || []).some(d => Array.isArray(d?.observations) && d.observations.length)) return true;
  const web = c.website_readiness;
  for (const key of ['topics', 'features']) for (const row of Array.isArray(web?.[key]) ? web[key] : []) {
    if ((Array.isArray(row?.evidence) ? row.evidence : []).some(e => e && e.observation != null)) return true;
  }
  return false;
}

export function checkObservations(report, ledger, repo, directory) {
  const dir = resolve(directory);
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const manifestHash = hash(canonical(manifest));
  const log = join(dir, 'observations.jsonl');
  const records = existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  if (report.assurance_version !== 2) {
    if (records.length) throw Error('observation records exist; declare assurance_version 2 so none can be left out');
    if (claimsObservations(report)) throw Error('observation-backed claims require assurance_version 2');
    return null;
  }
  const files = new Map(manifest.files.map(f => [f.file, f.sha256]));
  const excluded = new Set((manifest.exclusions || []).map(e => e.file));
  const read = (...p) => readFileSync(join(dir, 'observations', ...p));
  const byId = new Map();
  let previous = manifestHash;
  for (const [i, record] of records.entries()) {
    const { receipt_sha256, ...body } = record;
    if (record.format !== FORMAT) throw Error(`unsupported observation format in record ${i + 1}`);
    if (record.sequence !== i + 1 || record.id !== obsId(i + 1) || record.previous !== previous || record.run_id !== manifest.run_id
      || receipt_sha256 !== hash(canonical(body))) throw Error('broken observation chain');
    previous = receipt_sha256;
    const where = record.id;
    for (const key of ['actor', 'subject', 'claim']) if (!nonempty(record[key])) throw Error(`${where}: missing ${key}`);
    if (!Array.isArray(record.targets) || !record.targets.length || record.targets.some(t => !files.has(t))) throw Error(`${where}: targets must name inventoried files`);
    let spec;
    try { spec = read(record.id, 'spec.json'); } catch { throw Error(`${where}: stored specification is missing`); }
    if (hash(spec) !== record.spec_sha256) throw Error(`${where}: stored specification was altered`);
    if (record.kind === 'search') {
      const s = record.search;
      validateSearch(s);
      const again = runSearch(repo, [...files.keys()].filter(f => !excluded.has(f)), s);
      if (again.match_count !== s.match_count || again.matches_sha256 !== s.matches_sha256 || again.files_scanned !== s.files_scanned
        || s.holds !== searchHolds(s.expect, again.match_count)) throw Error(`${where}: stored search result differs from a replay against the snapshot`);
    } else if (record.kind === 'execution') {
      const e = record.execution;
      if (!e || !SURFACES.includes(e.surface) || !FIDELITY.includes(e.fidelity)) throw Error(`${where}: invalid execution record`);
      if (e.result === 'unavailable') {
        if (!nonempty(e.reason) || e.subject || e.control_status !== 'absent') throw Error(`${where}: invalid unavailable record`);
      } else {
        for (const p of e.probe_files || []) {
          let bytes; try { bytes = read(record.id, 'probe', p.path); } catch { throw Error(`${where}: probe file ${p.path} is missing`); }
          if (hash(bytes) !== p.sha256) throw Error(`${where}: probe file ${p.path} was altered`);
        }
        if (!Array.isArray(e.probe_files) || !e.probe_files.length) throw Error(`${where}: no probe recorded`);
        const arm = (name, value) => {
          let steps;
          try {
            if (hash(read(record.id, name, 'stdout.txt')) !== value.stdout_sha256 || hash(read(record.id, name, 'stderr.txt')) !== value.stderr_sha256) throw Error('output');
            steps = read(record.id, name, 'steps.jsonl');
            if (hash(steps) !== value.steps_sha256) throw Error('steps');
            for (const a of value.artefacts || []) if (hash(read(record.id, name, 'artefacts', a.path)) !== a.sha256) throw Error('artefact');
          } catch { throw Error(`${where}: stored ${name} artefacts are missing or altered`); }
          const derived = armResult(value, steps.toString('utf8'));
          if (derived.result !== value.result || (derived.deviations ?? null) !== (value.deviations ?? null) || (derived.steps ?? null) !== (value.steps ?? null)) throw Error(`${where}: recorded ${name} result differs from its stored steps`);
        };
        if (!e.subject) throw Error(`${where}: subject run missing`);
        arm('subject', e.subject);
        if (e.control) {
          if (!Array.isArray(e.control.replace) || !e.control.replace.length) throw Error(`${where}: control has no replacement`);
          e.control.replace.forEach((r, i) => {
            let bytes; try { bytes = read(record.id, 'control', 'replace', String(i)); } catch { throw Error(`${where}: control replacement is missing`); }
            if (!files.has(r.file) || hash(bytes) !== r.sha256 || r.sha256 === files.get(r.file)
              || canonical(changedLines(source(repo, r.file), bytes)) !== canonical(r.changed)) throw Error(`${where}: control replacement was altered or does not change the source`);
          });
          if (e.control.result != null) arm('control', e.control);
        }
        if (e.result !== e.subject.result || e.control_status !== controlStatus(e.subject.result, e.control)) throw Error(`${where}: recorded outcome differs from its stored runs`);
      }
    } else throw Error(`${where}: unknown observation kind`);
    byId.set(record.id, record);
  }
  if (report.coverage?.observation_head !== previous) throw Error('coverage.observation_head differs from the observation chain');

  // Every observation is accounted for exactly once: a failed attempt cannot be left out.
  const used = new Set();
  const ledgerIds = new Set(ledger.map(f => f.id));
  const take = (ids, where, allowedSubjects) => {
    if (ids == null) return [];
    if (!Array.isArray(ids) || ids.some(id => !OBS_ID.test(id))) throw Error(`${where}: observations must be an array of OBS ids`);
    return ids.map(id => {
      const o = byId.get(id);
      if (!o) throw Error(`${where}: references ${id}, which is not in the observation chain`);
      if (used.has(id)) throw Error(`${id} is referenced more than once`);
      if (allowedSubjects && !allowedSubjects.has(o.subject)) throw Error(`${where}: ${id} was recorded for ${o.subject}, not for this entry`);
      used.add(id);
      return o;
    });
  };
  const summary = [], warnings = [];
  let reviews = [];
  try { reviews = JSON.parse(readFileSync(join(dir, 'reviews.json'), 'utf8')); } catch { /* checkAssurance reports a missing review file */ }
  for (const f of report.findings) {
    const v = f.verification || {};
    const subjects = new Set([f.id, ...(f.dedup?.merged_from || [])]);
    const bound = take(v.observations, f.id, subjects);
    const basis = v.basis ?? 'source-quote';
    if (!BASES.includes(basis)) throw Error(`${f.id}: unknown verification.basis`);
    const places = new Set([f.location?.file, ...(f.location?.others || []).map(o => String(o).replace(/:\d+$/, ''))]);
    const onTarget = o => o.targets.some(t => places.has(t));
    // The reviewer, not the probe's author, states how the cited evidence bears on the code.
    if (bound.length && v.status === 'verified') {
      const review = Array.isArray(reviews) ? reviews.find(r => r?.finding_id === f.id) : null;
      if (!nonempty(review?.observation_review)) throw Error(`${f.id}: the independent review must assess the cited observations in observation_review (what was run or searched, what it exercises, what it cannot show)`);
    }
    if (basis !== 'source-quote') {
      if (v.status !== 'verified') throw Error(`${f.id}: basis ${basis} is only meaningful on a verified finding`);
      const backing = bound.filter(o => supports[basis](o) && onTarget(o));
      if (!backing.length) throw Error(`${f.id}: basis ${basis} has no supporting observation on the finding's location`);
      if (basis === 'runtime-reproduction' && !backing.some(o => o.execution.control.replace.some(r => places.has(r.file)))) throw Error(`${f.id}: the reproduction's control does not change the finding's location, so it does not tie the behaviour to that code`);
    }
    // A probe that ran real code and saw conforming behaviour contradicts "verified".
    const contrary = bound.filter(o => o.kind === 'execution' && o.execution.fidelity !== 'simulated' && o.execution.result === 'conforms');
    // Only a controlled reproduction outweighs it: an uncontrolled deviation may come from a probe that ignores the code.
    if (v.status === 'verified' && contrary.length && !bound.some(supports['runtime-reproduction'])) {
      if (!(nonempty(v.observation_conflict_note) && v.observation_conflict_note.trim().length >= 20)) {
        throw Error(`${f.id}: verified, yet ${contrary.map(o => o.id).join(', ')} ran and saw conforming behaviour; refute or cap it, record a reproduction, or explain in verification.observation_conflict_note`);
      }
      warnings.push(`${f.id}: kept as verified on source reading although ${contrary.map(o => o.id).join(', ')} saw conforming behaviour — ${v.observation_conflict_note.trim()}`);
    }
  }
  for (const d of report.dropped) {
    const bound = take(d.observations, `dropped ${d.id}`, new Set([d.id]));
    const reproduced = bound.filter(supports['runtime-reproduction']);
    if (reproduced.length) throw Error(`dropped ${d.id}: ${reproduced.map(o => o.id).join(', ')} reproduced this defect with a discriminating control; report it at the severity the consequence supports instead of dropping it`);
  }
  const web = report.coverage?.website_readiness;
  for (const key of ['topics', 'features']) for (const row of Array.isArray(web?.[key]) ? web[key] : []) {
    for (const entry of Array.isArray(row?.evidence) ? row.evidence : []) {
      if (!entry || typeof entry !== 'object') continue;
      const needs = entry.mode === 'interactive' || entry.mode === 'rendered';
      if (entry.observation == null) {
        if (needs) throw Error(`website ${row.id}: ${entry.mode} evidence must name the observation that recorded it`);
        continue;
      }
      const [o] = take([entry.observation], `website ${row.id}`, new Set([row.id]));
      if (needs && !(o.kind === 'execution' && o.execution.surface === 'web' && o.execution.fidelity !== 'simulated'
        && ['deviation', 'conforms'].includes(o.execution.result))) throw Error(`website ${row.id}: ${entry.mode} evidence needs a completed web observation, and ${o.id} is not one`);
    }
  }
  take(report.coverage?.other_observations, 'coverage.other_observations', null);
  for (const o of byId.values()) {
    if (!used.has(o.id)) throw Error(`${o.id} (subject ${o.subject}) is not accounted for; cite it on its finding, dropped entry or website record, or list it in coverage.other_observations`);
    if (ledgerIds.has(o.subject) && (report.coverage?.other_observations || []).includes(o.id)) throw Error(`${o.id} was recorded for finding ${o.subject} and must be cited on that finding's disposition`);
    summary.push({ id: o.id, kind: o.kind, subject: o.subject, actor: o.actor, claim: o.claim, targets: o.targets,
      ...(o.kind === 'search' ? { expect: o.search.expect, match_count: o.search.match_count, holds: o.search.holds, pattern: o.search.pattern }
        : { surface: o.execution.surface, fidelity: o.execution.fidelity, stubs: o.execution.stubs, result: o.execution.result,
          control_status: o.execution.control_status, reason: o.execution.reason || o.execution.subject?.reason || null,
          steps: o.execution.subject?.steps ?? null, deviations: o.execution.subject?.deviations ?? null,
          control_changes: (o.execution.control?.replace || []).map(r => `${r.file}:${r.changed.start}-${r.changed.end}`) }) });
  }
  return { observations: summary, warnings };
}

if (process.argv[1] && resolve(process.argv[1]) === SELF && process.argv[2] === '--search-worker') {
  try { console.log(JSON.stringify(scan(JSON.parse(readFileSync(0, 'utf8'))))); }
  catch (e) { console.error(e.message); process.exitCode = 2; }
}
