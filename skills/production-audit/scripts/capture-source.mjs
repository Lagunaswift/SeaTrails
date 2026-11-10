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

// Run through the controller, with evidence storage outside worker write access.
import { mkdirSync, writeFileSync, readFileSync, appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hash, canonical, source, inventory } from './assurance.mjs';

try {
  const [command, repo, directory, ...rest] = process.argv.slice(2);
  if (!repo || !directory) throw Error('usage: capture-source.mjs init|read <repo> <evidence-dir> [actor role lens file]');
  const dir = resolve(directory);
  if (command === 'init') {
    if (rest.length) throw Error('init takes no extra arguments');
    mkdirSync(dir, { recursive: true });
    if (existsSync(resolve(dir, 'manifest.json'))) throw Error('capture already exists; use a new evidence directory');
    const manifest = { version: 1, run_id: randomUUID(), files: inventory(repo), exclusions: [] };
    writeFileSync(resolve(dir, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
    writeFileSync(resolve(dir, 'reads.jsonl'), '', { flag: 'wx' });
    writeFileSync(resolve(dir, 'reviews.json'), '[]', { flag: 'wx' });
    console.log(JSON.stringify({ run_id: manifest.run_id, manifest_sha256: hash(canonical(manifest)), files: manifest.files.length }));
  } else if (command === 'read') {
    const [actor, role, lens, file] = rest;
    if (rest.length !== 4 || !actor || !['audit', 'review'].includes(role) || !lens) throw Error('read requires actor audit|review lens file');
    const manifest = JSON.parse(readFileSync(resolve(dir, 'manifest.json')));
    const bytes = source(repo, file);
    const entry = manifest.files.find(f => f.file === file);
    if (!entry || entry.sha256 !== hash(bytes)) throw Error('source changed or was not inventoried');
    if (bytes.includes(0)) throw Error('binary source: record a reasoned exclusion before capture or inspect with a separate tool');
    const log = resolve(dir, 'reads.jsonl');
    // Serialize calls in the controller. This tool is not a concurrent log server.
    const records = readFileSync(log, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
    const body = { sequence: records.length + 1, previous: records.length ? records[records.length - 1].receipt_sha256 : hash(canonical(manifest)),
      run_id: manifest.run_id, actor, role, lens, file, sha256: entry.sha256 };
    const receipt = { ...body, receipt_sha256: hash(canonical(body)) };
    // A successful stdout write records delivery to the caller, never comprehension.
    await new Promise((resolve, reject) => process.stdout.write(bytes, e => e ? reject(e) : resolve()));
    appendFileSync(log, JSON.stringify(receipt) + '\n');
    console.error(JSON.stringify(receipt));
  } else throw Error('unknown capture command');
} catch (e) { console.error(e.message); process.exitCode = 2; }
