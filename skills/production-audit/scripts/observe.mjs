#!/usr/bin/env node
// Record one observation against a captured snapshot. Run through the
// controller, like capture-source.mjs. A search is replayed by the gate. A
// probe executes target code in a temporary copy of the tracked files with a
// scrubbed environment; this tool is not a sandbox and blocks no network, so
// run it only where executing the target is acceptable, never against a
// production service.
//
//   node observe.mjs <repo> <evidence-dir> <spec.json>
//
// Specification and record format: references/observation-contract.md.
import { observe } from './observation.mjs';

try {
  const [repo, directory, spec, ...extra] = process.argv.slice(2);
  if (!repo || !directory || !spec || extra.length) throw Error('usage: observe.mjs <repo> <evidence-dir> <spec.json>');
  const record = observe(repo, directory, spec);
  const e = record.execution, s = record.search;
  console.log(JSON.stringify({ id: record.id, kind: record.kind, subject: record.subject, receipt_sha256: record.receipt_sha256,
    ...(s ? { expect: s.expect, match_count: s.match_count, holds: s.holds }
      : { result: e.result, control_status: e.control_status, steps: e.subject?.steps ?? null, deviations: e.subject?.deviations ?? null, reason: e.reason || e.subject?.reason || null }) }));
} catch (e) { console.error(e.message); process.exitCode = 2; }
