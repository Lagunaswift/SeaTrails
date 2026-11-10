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
