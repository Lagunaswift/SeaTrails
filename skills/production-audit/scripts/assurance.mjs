// Source delivery and review evidence. No dependency on a model/provider.
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const hash = value => createHash('sha256').update(value).digest('hex');
export const canonical = value => JSON.stringify(value && typeof value === 'object'
  ? Array.isArray(value) ? value.map(v => JSON.parse(canonical(v)))
    : Object.fromEntries(Object.keys(value).sort().map(k => [k, JSON.parse(canonical(value[k]))]))
  : value);
export const findingHash = finding => hash(canonical(finding));
export function source(root, file) {
  if (typeof file !== 'string' || !file || isAbsolute(file) || file.includes('\\') || file.split('/').some(p => p === '..' || p === '.' || !p)) throw Error('invalid source path');
  const base = realpathSync(root), path = realpathSync(resolve(base, file));
  const rel = relative(base, path);
  if (isAbsolute(rel) || rel === '..' || rel.startsWith('../') || !statSync(path).isFile()) throw Error('source outside repository or not a file');
  return readFileSync(path);
}
export function inventory(root) {
  const top = execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  if (realpathSync(top) !== realpathSync(root)) throw Error('--repo must be the repository root');
  // Tracked files are an independent, reproducible denominator. No extension heuristics.
  const files = execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).split('\0').filter(Boolean);
  return [...new Set(files)].sort().map(file => ({ file, sha256: hash(source(root, file)) }));
}
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const equalSet = (a, b) => Array.isArray(a) && a.length === new Set(a).size && a.length === b.size && a.every(v => b.has(v));

export function checkAssurance(report, ledger, repo, directory) {
  if (!repo || !directory) throw Error('--repo and --assurance are required');
  if (![1, 2].includes(report.assurance_version)) throw Error('report.assurance_version must be 1 or 2');
  const readJSON = name => JSON.parse(readFileSync(resolve(directory, name), 'utf8'));
  const manifest = readJSON('manifest.json');
  const reads = readFileSync(resolve(directory, 'reads.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  const reviews = readJSON('reviews.json');
  const actual = inventory(repo);
  if (manifest.version !== 1 || canonical(manifest.files) !== canonical(actual)) throw Error('inventory changed or is incomplete; restart capture');
  const manifestHash = hash(canonical(manifest));
  if (!nonempty(manifest.run_id) || !Array.isArray(manifest.exclusions)) throw Error('invalid manifest');
  const files = new Map(actual.map(v => [v.file, v.sha256]));
  const excluded = new Set();
  for (const entry of manifest.exclusions) {
    if (!files.has(entry.file) || excluded.has(entry.file) || !nonempty(entry.reason)) throw Error('invalid or duplicate exclusion');
    excluded.add(entry.file);
  }
  const run = new Set(report.scope.lenses_run);
  const byLens = new Map([...run].map(l => [l, new Set()]));
  const byActor = new Map();
  const authorLenses = new Map();
  let previous = manifestHash;
  for (const [i, record] of reads.entries()) {
    const { receipt_sha256, ...body } = record;
    if (record.sequence !== i + 1 || record.previous !== previous || receipt_sha256 !== hash(canonical(body)) || record.run_id !== manifest.run_id) throw Error('broken read receipt chain');
    if (!files.has(record.file) || files.get(record.file) !== record.sha256 || !nonempty(record.actor) || !['audit', 'review'].includes(record.role)) throw Error('invalid source delivery receipt');
    if (record.role === 'audit') {
      if (!run.has(record.lens)) throw Error('receipt belongs to an unrun lens');
      const key = `${record.actor}:${record.lens}`;
      if (!authorLenses.has(key)) authorLenses.set(key, new Set());
      authorLenses.get(key).add(record.file);
      if (!excluded.has(record.file)) byLens.get(record.lens).add(record.file);
    }
    const key = `${record.role}:${record.actor}`;
    if (!byActor.has(key)) byActor.set(key, new Set());
    byActor.get(key).add(record.file);
    previous = receipt_sha256;
  }
  if (report.coverage.receipt_head !== previous) throw Error('coverage receipt head differs from capture');
  const examined = new Set([...byLens.values()].flatMap(s => [...s]));
  if (report.coverage.files_total !== files.size - excluded.size || report.coverage.files_examined !== examined.size) throw Error('coverage counts differ from observed deliveries');
  for (const lens of run) {
    const row = report.coverage.matrix.find(r => r?.lens === lens);
    if (!row || !equalSet(row.files, byLens.get(lens))) throw Error(`coverage files differ for ${lens}`);
  }
  if (!Array.isArray(reviews)) throw Error('reviews must be an array');
  const targets = new Map(report.findings.map(f => [f.id, { finding: f, verdict: f.verification.status === 'verified' ? 'supported' : 'inconclusive' }]));
  for (const drop of report.dropped) {
    const raw = ledger.find(f => f.id === drop.id);
    if (raw) targets.set(drop.id, { finding: raw, verdict: 'refuted' });
  }
  const seen = new Set();
  for (const review of reviews) {
    const target = targets.get(review.finding_id);
    if (!target || seen.has(review.finding_id)) throw Error('duplicate or unknown review target');
    seen.add(review.finding_id);
    if (review.finding_sha256 !== findingHash(target.finding) || review.manifest_sha256 !== manifestHash) throw Error('stale review: finding or source inventory changed');
    if (!nonempty(review.auditor) || !nonempty(review.reviewer) || review.auditor === review.reviewer) throw Error('review must name a separate reviewer');
    if (review.verdict !== target.verdict) throw Error('review verdict conflicts with finding disposition');
    for (const key of ['claim', 'preconditions', 'data_flow', 'counterevidence', 'rationale']) if (!nonempty(review[key])) throw Error(`review missing ${key}`);
    if (!Array.isArray(review.citations) || !review.citations.length) throw Error('review needs exact source quotations');
    if (!authorLenses.get(`${review.auditor}:${target.finding.lens}`)?.has(target.finding.location.file)) throw Error('auditor has no delivery for finding location');
    if (!review.citations.some(c => c.file === target.finding.location.file)) throw Error('review must quote the finding location');
    for (const citation of review.citations) {
      if (!files.has(citation.file) || !byActor.get(`review:${review.reviewer}`)?.has(citation.file)) throw Error('reviewer has no delivery for cited source');
      const lines = source(repo, citation.file).toString('utf8').split('\n');
      if (!Number.isInteger(citation.start) || !Number.isInteger(citation.end) || citation.start < 1 || citation.end < citation.start || citation.end > lines.length || !nonempty(citation.quote)) throw Error('invalid quotation range');
      if (citation.quote !== lines.slice(citation.start - 1, citation.end).join('\n')) throw Error('quotation does not match source');
    }
  }
  for (const [id, target] of targets) {
    if ((target.verdict === 'supported' || target.verdict === 'refuted') && !seen.has(id)) throw Error(`missing semantic review for ${id}`);
  }
  if (canonical(inventory(repo)) !== canonical(actual)) throw Error('source changed during validation');
  return { files_total: files.size - excluded.size, files_delivered: examined.size,
    exclusions: manifest.exclusions, reviews: reviews.length, run_id: manifest.run_id, manifest_sha256: manifestHash };
}
