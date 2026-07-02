#!/usr/bin/env node
// =============================================================================
// check-consistency.mjs — cross-file drift check for the seatrial repo
// -----------------------------------------------------------------------------
// The suite's registration data lives in several files that must agree: the
// harness's enums, the finding schema, the lens registry, the orchestrator's
// docs, and the README's counts. This script mechanically cross-references
// them, in the same spirit as the audit harness: agreement is checked, not
// claimed. Run from the repo root.
//
//   node .claude/skills/release-check/scripts/check-consistency.mjs
//
// Exit codes: 0 = consistent (warnings allowed), 1 = drift found, 2 = a parse
// anchor disappeared (a file changed shape; fix the anchor or this script).
//
// Pure Node, zero dependencies. If a check here false-positives, fix the drift
// or extend the allowlists below with a comment saying why — never delete the
// check.
// =============================================================================

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SKILLS = join(ROOT, 'skills');
const PA = join(SKILLS, 'production-audit');

const failures = [];
const warnings = [];
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);
const anchorFail = (m) => { console.error(`ANCHOR LOST: ${m}`); process.exit(2); };

// Known, documented name mismatches (see CLAUDE.md "Known traps" and
// lens-registry.md). New mismatches are failures; these two warn.
const NAME_MISMATCH_ALLOWLIST = { 'UX-UI': 'ux-ui-patterns', 'seo-discoverability': 'seo-and-discoverability' };
// The two synthesis lenses (used to derive the atomic count).
const SYNTHESIS = new Set(['soc2-compliance', 'adversary-emulation']);

const read = (p) => {
  if (!existsSync(p)) anchorFail(`expected file missing: ${p}`);
  return readFileSync(p, 'utf8');
};

// ---- ground truth 1: the directories on disk --------------------------------
const skillDirs = readdirSync(SKILLS).filter((d) => statSync(join(SKILLS, d)).isDirectory()).sort();

// ---- ground truth 2: the harness's registration constants -------------------
const harnessSrc = read(join(PA, 'scripts', 'audit-check.mjs'));
function parseSet(name) {
  const m = harnessSrc.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
  if (!m) anchorFail(`const ${name} = new Set([...]) in audit-check.mjs`);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}
function parseMap(name) {
  const m = harnessSrc.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`));
  if (!m) anchorFail(`const ${name} = {...} in audit-check.mjs`);
  const out = {};
  for (const line of m[1].matchAll(/'([^']+)':\s*\[([^\]]*)\]/g)) {
    out[line[1]] = [...line[2].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  }
  return out;
}
const harnessLenses = parseSet('LENSES').sort();
const harnessCategories = parseSet('CATEGORIES').sort();
const harnessLensCategories = parseMap('LENS_CATEGORIES');
const harnessLensPrefixes = parseMap('LENS_PREFIXES');

// ---- 1. every harness lens is a directory; maps cover exactly the lens set --
for (const lens of harnessLenses) {
  if (!skillDirs.includes(lens)) fail(`harness LENSES has "${lens}" but skills/${lens}/ does not exist`);
}
for (const [mapName, map] of [['LENS_CATEGORIES', harnessLensCategories], ['LENS_PREFIXES', harnessLensPrefixes]]) {
  const keys = Object.keys(map).sort();
  if (keys.join() !== harnessLenses.join()) {
    fail(`${mapName} keys differ from LENSES: only-in-map=[${keys.filter((k) => !harnessLenses.includes(k))}] only-in-LENSES=[${harnessLenses.filter((k) => !keys.includes(k))}]`);
  }
  for (const [lens, vals] of Object.entries(map)) {
    if (!vals.length) fail(`${mapName}["${lens}"] is empty`);
    if (mapName === 'LENS_CATEGORIES') {
      for (const c of vals) if (!harnessCategories.includes(c)) fail(`${mapName}["${lens}"] uses unknown category "${c}"`);
    }
  }
}

// ---- 2. finding-schema.md enums and prefix table match the harness ----------
const schemaSrc = read(join(PA, 'references', 'finding-schema.md'));
function parseEnumLine(label) {
  const m = schemaSrc.match(new RegExp(`\\*\\*\`${label}\`\\*\\*[^\\n]*`));
  if (!m) anchorFail(`**\`${label}\`** enum line in finding-schema.md`);
  return [...m[0].matchAll(/\`([a-z0-9-]+)\`/g)].map((x) => x[1]).filter((v) => v !== label).sort();
}
const schemaLenses = parseEnumLine('lens');
const schemaCategories = parseEnumLine('category');
if (schemaLenses.join() !== harnessLenses.join()) {
  fail(`finding-schema lens enum != harness LENSES: schema-only=[${schemaLenses.filter((l) => !harnessLenses.includes(l))}] harness-only=[${harnessLenses.filter((l) => !schemaLenses.includes(l))}]`);
}
if (schemaCategories.join() !== harnessCategories.join()) {
  fail(`finding-schema category enum != harness CATEGORIES: schema-only=[${schemaCategories.filter((c) => !harnessCategories.includes(c))}] harness-only=[${harnessCategories.filter((c) => !schemaCategories.includes(c))}]`);
}
// Prefix table rows: | lens-name | `P1` (…), `P2` |
const prefixRows = [...schemaSrc.matchAll(/^\| ([a-z0-9-]+) \| (.+) \|$/gm)]
  .filter((m) => harnessLenses.includes(m[1]));
if (!prefixRows.length) anchorFail('ID prefix table rows in finding-schema.md');
const schemaPrefixMap = {};
for (const row of prefixRows) schemaPrefixMap[row[1]] = [...row[2].matchAll(/\`([A-Z][A-Z0-9]{1,5})\`/g)].map((x) => x[1]);
for (const lens of harnessLenses) {
  const a = (schemaPrefixMap[lens] || []).slice().sort().join();
  const b = (harnessLensPrefixes[lens] || []).slice().sort().join();
  if (!schemaPrefixMap[lens]) fail(`finding-schema prefix table has no row for lens "${lens}"`);
  else if (a !== b) fail(`prefixes for "${lens}" differ: schema=[${a}] harness=[${b}]`);
}

// ---- 3. lens-registry.md has an entry per lens, and vice versa --------------
const registrySrc = read(join(PA, 'references', 'lens-registry.md'));
const registryLenses = [...registrySrc.matchAll(/^## Lens \d+: ([a-z0-9-]+)/gm)].map((m) => m[1]).sort();
if (!registryLenses.length) anchorFail('"## Lens N: <name>" headings in lens-registry.md');
if (registryLenses.join() !== harnessLenses.join()) {
  fail(`lens-registry entries != harness LENSES: registry-only=[${registryLenses.filter((l) => !harnessLenses.includes(l))}] harness-only=[${harnessLenses.filter((l) => !registryLenses.includes(l))}]`);
}
// Every .claude/skills/<name>/SKILL.md path the registry cites must exist under skills/.
for (const m of registrySrc.matchAll(/\.claude\/skills\/([A-Za-z0-9-]+)\/SKILL\.md/g)) {
  if (!skillDirs.includes(m[1])) fail(`lens-registry cites .claude/skills/${m[1]}/SKILL.md but skills/${m[1]}/ does not exist`);
}

// ---- 4. README counts and tables --------------------------------------------
const readmeSrc = read(join(ROOT, 'README.md'));
const totals = readmeSrc.match(/(\d+) skills total \((\d+) lenses \+ (\d+) orchestrator \+ (\d+) craft\)/);
if (!totals) anchorFail('"N skills total (L lenses + 1 orchestrator + C craft)" line in README.md');
const [, rTotal, rLenses, rOrch, rCraft] = totals.map(Number);
if (rTotal !== skillDirs.length) fail(`README says ${rTotal} skills total; skills/ has ${skillDirs.length} directories`);
if (rLenses !== harnessLenses.length) fail(`README says ${rLenses} lenses; harness registers ${harnessLenses.length}`);
if (rLenses + rOrch + rCraft !== rTotal) fail(`README arithmetic broken: ${rLenses}+${rOrch}+${rCraft} != ${rTotal}`);
const craftActual = skillDirs.filter((d) => !harnessLenses.includes(d) && d !== 'production-audit');
if (rCraft !== craftActual.length) fail(`README says ${rCraft} craft skills; disk has ${craftActual.length} (${craftActual.join(', ')})`);
// README lens table rows must be exactly the lens set. Craft-skill rows (if a
// craft table is ever added to the README) are excluded by name.
const readmeLensRows = [...readmeSrc.matchAll(/^\| ([a-z0-9-]+) \| .+ \|$/gm)]
  .map((m) => m[1]).filter((n) => !craftActual.includes(n)).sort();
if (readmeLensRows.join() !== harnessLenses.join()) {
  fail(`README lens table != harness LENSES: table-only=[${readmeLensRows.filter((l) => !harnessLenses.includes(l))}] missing=[${harnessLenses.filter((l) => !readmeLensRows.includes(l))}]`);
}
// README's adversarial-case count vs the actual suite.
const readmeCases = readmeSrc.match(/(\d+) adversarial test cases/);
const testsSrc = read(join(PA, 'scripts', 'run-tests.mjs'));
const actualCases = [...testsSrc.matchAll(/^\s*expect: '(?:pass|fail)'/gm)].length;
if (readmeCases && Number(readmeCases[1]) !== actualCases) {
  fail(`README says ${readmeCases[1]} adversarial test cases; run-tests.mjs defines ${actualCases}`);
}

// ---- 5. ARCHITECTURE.md counts ----------------------------------------------
const archSrc = read(join(PA, 'ARCHITECTURE.md'));
const archAll = archSrc.match(/all (\d+) skills/);
if (!archAll) anchorFail('"all N skills" phrase in ARCHITECTURE.md');
if (Number(archAll[1]) !== skillDirs.length) fail(`ARCHITECTURE.md says "all ${archAll[1]} skills"; skills/ has ${skillDirs.length}`);
const archLensCount = archSrc.match(/## The lenses \((\d+)\)/);
if (!archLensCount) anchorFail('"## The lenses (N)" heading in ARCHITECTURE.md');
if (Number(archLensCount[1]) !== harnessLenses.length) fail(`ARCHITECTURE.md lens heading says ${archLensCount[1]}; harness registers ${harnessLenses.length}`);

// ---- 6. running-the-lenses.md atomic count -----------------------------------
const runSrc = read(join(PA, 'references', 'running-the-lenses.md'));
const atomic = runSrc.match(/the (\d+) atomic lenses/);
if (atomic) {
  const expected = harnessLenses.filter((l) => !SYNTHESIS.has(l)).length;
  if (Number(atomic[1]) !== expected) fail(`running-the-lenses.md says "${atomic[1]} atomic lenses"; harness set implies ${expected} (19 minus the ${SYNTHESIS.size} synthesis lenses)`);
} else warn('running-the-lenses.md no longer states an atomic-lens count (anchor gone; update this script if intentional)');

// ---- 7. every skill has frontmatter; name matches directory -----------------
for (const dir of skillDirs) {
  const p = join(SKILLS, dir, 'SKILL.md');
  if (!existsSync(p)) { fail(`skills/${dir}/ has no SKILL.md`); continue; }
  const head = readFileSync(p, 'utf8').slice(0, 2000);
  const fm = head.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) { fail(`skills/${dir}/SKILL.md has no frontmatter block`); continue; }
  const name = fm[1].match(/^name:\s*(\S+)/m);
  const desc = fm[1].match(/^description:\s*\S/m);
  if (!name) fail(`skills/${dir}/SKILL.md frontmatter has no name`);
  if (!desc) fail(`skills/${dir}/SKILL.md frontmatter has no description`);
  if (name && name[1] !== dir) {
    if (NAME_MISMATCH_ALLOWLIST[dir] === name[1]) warn(`known name mismatch: skills/${dir}/ has name "${name[1]}" (documented trap; see CLAUDE.md)`);
    else fail(`skills/${dir}/SKILL.md name "${name[1]}" != directory "${dir}" (and not allowlisted)`);
  }
}

// ---- 8. no dead references/<file>.md inside production-audit ----------------
const paDocs = [join(PA, 'SKILL.md'), join(PA, 'ARCHITECTURE.md'), join(PA, 'scripts', 'audit-check.mjs'),
  ...readdirSync(join(PA, 'references')).map((f) => join(PA, 'references', f))];
for (const doc of paDocs) {
  const src = readFileSync(doc, 'utf8');
  for (const m of src.matchAll(/references\/([a-z0-9-]+\.md)/g)) {
    if (!existsSync(join(PA, 'references', m[1]))) fail(`${doc.replace(ROOT + '/', '')} references references/${m[1]} which does not exist`);
  }
}

// ---- 9. "Skills this leans on" style cross-references resolve ---------------
// In each lens/craft SKILL.md, hyphenated backtick tokens inside the
// relationship sections must be real skills (or aliases/categories).
const KNOWN_TOKENS = new Set([
  ...skillDirs, ...Object.values(NAME_MISMATCH_ALLOWLIST), ...harnessCategories,
  'production-audit', // orchestrator, always legal
]);
const SECTION_RE = /^## (Skills this leans on|Relationship to other skills|Overlapping skills)\b[\s\S]*?(?=^## |\n*$(?![\s\S]))/gm;
for (const dir of skillDirs) {
  const p = join(SKILLS, dir, 'SKILL.md');
  if (!existsSync(p)) continue;
  const src = readFileSync(p, 'utf8');
  for (const section of src.matchAll(SECTION_RE)) {
    for (const tok of section[0].matchAll(/\`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\`/g)) {
      if (!KNOWN_TOKENS.has(tok[1])) fail(`skills/${dir}/SKILL.md relationship section references \`${tok[1]}\` — not a skill, alias, or category in this repo`);
    }
  }
}

// ---- 10. no product or tracked-doc file is gitignored -------------------------
// The protective ignores (*report*.md etc.) exist for real audit output; a
// repo file caught by them ships silently untracked. Found live twice:
// references/report-format.md, then docs/decisions/0013-report-*.md, both
// matched *report*.md and needed negations. Sweep every tree that is meant
// to be tracked. (docs/ at large is deliberately ignorable — private notes —
// so only the negated sets are swept.)
import { spawnSync } from 'node:child_process';
const trackedTrees = [SKILLS, join(ROOT, 'docs', 'decisions'), join(ROOT, '.claude', 'skills'), join(ROOT, '.github')];
const trackedFiles = [join(ROOT, 'docs', 'HANDOVER.md'), join(ROOT, 'docs', 'OPERATORS-GUIDE.md'), join(ROOT, 'CLAUDE.md'), join(ROOT, 'README.md')];
const sweep = [];
for (const t of trackedTrees) (function walk(dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else sweep.push(p.replace(ROOT + '/', ''));
  }
})(t);
for (const f of trackedFiles) if (existsSync(f)) sweep.push(f.replace(ROOT + '/', ''));
const ci = spawnSync('git', ['check-ignore', '--stdin'], { cwd: ROOT, input: sweep.join('\n'), encoding: 'utf8' });
if (ci.error) warn('git not available; skipped the gitignore sweep');
else for (const ignored of ci.stdout.split('\n').filter(Boolean)) {
  fail(`${ignored} is caught by .gitignore — a repo file that would ship untracked; add a negation`);
}

// ---- report ------------------------------------------------------------------
const line = '─'.repeat(70);
console.log(line);
for (const w of warnings) console.log(`⚠ WARN  ${w}`);
for (const f of failures) console.log(`✖ FAIL  ${f}`);
console.log(line);
console.log(`${failures.length} failure(s), ${warnings.length} warning(s) — checked ${skillDirs.length} skills, ${harnessLenses.length} lenses, ${actualCases} harness test cases.`);
process.exit(failures.length ? 1 : 0);
