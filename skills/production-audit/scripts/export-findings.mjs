#!/usr/bin/env node
// Export gated findings for another tool: seatrial-findings/1.
// Like the renderer, this command gates a private snapshot of the report and
// ledger and emits nothing unless that gate passes. The bundle carries each
// finding unchanged, with the evidence basis the gate checked.
//
//   node export-findings.mjs <audit-dir> --repo <repo> --assurance <evidence-dir> > bundle.json
//   node export-findings.mjs <historical-audit-dir> --legacy > bundle.json
//   node export-findings.mjs --verify <bundle.json>
//
// Contract for consumers: references/findings-interchange.md.
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { hash, canonical } from './assurance.mjs';

export const BUNDLE_FORMAT = 'seatrial-findings/1';
const seal = (value, field) => { const { [field]: _omitted, ...rest } = value; return hash(canonical(rest)); };
export function verifyBundle(bundle) {
  if (!bundle || bundle.format !== BUNDLE_FORMAT) throw Error(`not a ${BUNDLE_FORMAT} bundle`);
  if (!Array.isArray(bundle.findings)) throw Error('bundle has no findings array');
  for (const f of bundle.findings) if (f.finding_sha256 !== seal(f, 'finding_sha256')) throw Error(`finding ${f?.id} was altered after export`);
  if (bundle.bundle_sha256 !== seal(bundle, 'bundle_sha256')) throw Error('bundle was altered after export');
  return { findings: bundle.findings.length, evidence_level: bundle.producer.evidence_level, manifest_sha256: bundle.source.manifest_sha256 };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let snapshot;
  try {
    const argv = process.argv.slice(2), args = {};
    let dir;
    for (let i = 0; i < argv.length; i++) {
      const flag = argv[i];
      if (flag === '--legacy') { if (args.legacy) throw Error('duplicate --legacy'); args.legacy = true; }
      else if (['--repo', '--assurance', '--verify'].includes(flag)) {
        const key = flag.slice(2);
        if (args[key] || !argv[i + 1] || argv[i + 1].startsWith('-')) throw Error(`invalid ${flag}`);
        args[key] = argv[++i];
      } else if (flag.startsWith('-') || dir) throw Error(`unexpected argument ${flag}`);
      else dir = flag;
    }
    if (args.verify) {
      if (dir || args.repo || args.assurance || args.legacy) throw Error('--verify takes only a bundle path');
      console.log(JSON.stringify(verifyBundle(JSON.parse(readFileSync(args.verify, 'utf8')))));
    } else {
      if (!dir) throw Error('usage: export-findings.mjs <audit-dir> --repo <repo> --assurance <evidence-dir> | <audit-dir> --legacy | --verify <bundle.json>');
      if (!args.legacy && (!args.repo || !args.assurance)) throw Error('export requires --repo and --assurance; --legacy explicitly exports a self-reported historical audit');
      if (args.legacy && args.assurance) throw Error('--legacy and --assurance are mutually exclusive');
      // Gate and export the SAME bytes.
      const reportBytes = readFileSync(join(dir, 'report.json')), ledgerBytes = readFileSync(join(dir, 'raw-findings.jsonl'));
      snapshot = mkdtempSync(join(tmpdir(), 'seatrial-export-'));
      writeFileSync(join(snapshot, 'report.json'), reportBytes); writeFileSync(join(snapshot, 'raw-findings.jsonl'), ledgerBytes);
      const command = [fileURLToPath(new URL('./audit-check.mjs', import.meta.url)), snapshot, '--json'];
      if (args.repo) command.push('--repo', args.repo);
      if (args.assurance) command.push('--assurance', args.assurance);
      const result = spawnSync(process.execPath, command, { encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024 });
      if (result.error) throw result.error;
      const gate = JSON.parse(result.stdout);
      if (result.status !== 0 || !gate.ok) { console.error((gate.failures || ['validation failed']).join('\n')); process.exitCode = 1; }
      else {
        const R = JSON.parse(reportBytes.toString('utf8'));
        const observations = new Map((gate.assurance?.observations || []).map(o => [o.id, o]));
        const findings = R.findings.map(f => {
          const out = { ...f, evidence_basis: f.verification?.status === 'verified' ? (args.legacy ? 'self-reported' : f.verification.basis ?? 'source-quote') : null,
            observations: (f.verification?.observations || []).map(id => observations.get(id)).filter(Boolean) };
          return { ...out, finding_sha256: seal(out, 'finding_sha256') };
        });
        const bundle = { format: BUNDLE_FORMAT,
          producer: { tool: 'seatrial', gate_format_version: gate.format_version, gate_ok: true, gate_warnings: gate.warnings,
            evidence_level: args.legacy ? 'self-reported' : `assurance-${R.assurance_version}`, report_mode: 'read-only audit; no code was changed' },
          source: { manifest_sha256: gate.assurance?.manifest_sha256 ?? null, capture_run_id: gate.assurance?.run_id ?? null,
            files_total: R.coverage?.files_total ?? null, files_examined: R.coverage?.files_examined ?? null, partial: R.scope?.partial === true,
            lenses_run: R.scope?.lenses_run || [], lenses_deferred: R.scope?.lenses_deferred || [] },
          report_sha256: hash(reportBytes), ledger_sha256: hash(ledgerBytes),
          findings, dropped: (R.dropped || []).map(d => ({ id: d.id, reason: d.reason, observations: d.observations || [] })),
          unbound_observations: (R.coverage?.other_observations || []).map(id => observations.get(id)).filter(Boolean),
          limitations: R.limitations || [] };
        process.stdout.write(JSON.stringify({ ...bundle, bundle_sha256: seal(bundle, 'bundle_sha256') }, null, 2) + '\n');
      }
    }
  } catch (e) { console.error(`cannot export findings: ${e.message}`); process.exitCode = 2; }
  finally { if (snapshot) rmSync(snapshot, { recursive: true, force: true }); }
}
