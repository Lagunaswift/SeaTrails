# CLAUDE.md — working on seatrial

This repo is **seatrial**: a codebase-audit suite built as Claude skills. There is no application here. The product is prose — 32 skills (19 audit lenses, 1 orchestrator, 12 craft skills) — plus three zero-dependency Node scripts that make the audit's output trustworthy. Read `README.md` first; it is accurate and current.

The single most important idea: **skills run the audit; scripts gate it.** An agent executes the audit by reading the skills; `audit-check.mjs` hard-fails any report that violates the integrity invariants; `render-report.mjs` generates the human report from gated data. The harness assumes the auditing AI will cheat. That assumption extends to you: do not fight the harness, and never weaken it to make a failure go away.

## Repo map

```
skills/                         THE PRODUCT. Installed by copying into a target repo's .claude/skills/
  production-audit/             the orchestrator: SKILL.md (6 stages), ARCHITECTURE.md, references/ (10 contracts),
                                scripts/ (audit-check.mjs, run-tests.mjs, render-report.mjs, fixtures/)
  <19 lens dirs>                one concern each; see the lens table in README.md
  <12 craft dirs>               fix/design-phase skills (refactoring, testing-strategy, ui-ux-pro-max, …)
docs/                           maintainer docs (tracked selectively — see .gitignore note below)
  HANDOVER.md                   current state, known drift, improvement backlog — read this second
  OPERATORS-GUIDE.md            how to run the suite against a target repo, well
  decisions/                    ADRs: why the architecture is shaped like this — read before changing it
.claude/skills/                 repo-local maintenance skills (add-lens, harness-dev, release-check)
.github/                        PR template (the check contract) + CI running the harness tests
```

**Path trap:** every path *inside* the product docs (`node .claude/skills/production-audit/scripts/...`, skill references in `lens-registry.md`) assumes the **installed** location in a target repo. In *this* repo the same files live under `skills/`. Translate accordingly; do not "fix" product docs to point at `skills/`.

**.gitignore trap:** `docs/*` and `.claude/*` are ignored with specific negations (`!docs/decisions/`, `!docs/HANDOVER.md`, `!docs/OPERATORS-GUIDE.md`, `!.claude/skills/`). A new file elsewhere under `docs/` will be silently untracked — add a negation or put it in `docs/decisions/`. Never commit real audit output (`*report*.json/md` are ignored for a reason: they name live apps).

## Commands

```bash
node skills/production-audit/scripts/run-tests.mjs            # harness regression suite; must end "0 failed"
node .claude/skills/release-check/scripts/check-consistency.mjs   # cross-file drift check (counts, enums, registry)
node skills/production-audit/scripts/audit-check.mjs <audit-dir> [--repo <path>]   # gate an audit's artifacts
node skills/production-audit/scripts/render-report.mjs <audit-dir>                 # render report.md from report.json
```

Both checks must pass before any commit that touches `skills/`. There is no package.json anywhere — the scripts are zero-dependency by design (ADR 0002); do not add npm dependencies. `ui-ux-pro-max` scripts are Python 3 stdlib-only — same rule.

## Architecture in one breath

Stages 0–5: detect stack → select lenses → run lenses (append every finding to `raw-findings.jsonl` in the canonical schema) → merge → adversarially verify → consolidate into `report.json` → **gate** → **render**. Every raw finding ends reported, merged, or dropped (`raw = reported + merged + dropped`). Critical/high findings must be verified with quoted code or capped. Chains build only on the reconciled set. Coverage has a denominator. Slop prose fails the build. The full reasoning: `skills/production-audit/ARCHITECTURE.md` and `docs/decisions/`.

The 19 lenses split into two families you must not confuse:

- **Family A (14 prose specialists)** — code-audit, ai-saas-security, scaling-audit, release-and-ops, data-privacy, performance, accessibility, email-deliverability, frontend-robustness, internationalisation, seo-discoverability, mobile-and-responsive, analytics-and-instrumentation, anti-slop-writing. Standalone craft-style skills; they say nothing about schemas or categories. The orchestrator's `lens-registry.md` **injects** the output contract when they run as lenses (the canonical schema overrides their "How to report" prose).
- **Family B (5 audit-native)** — soc2-compliance, code-quality, dependency-audit, infrastructure-config, adversary-emulation. Written for this suite; each carries a `## What to produce` section naming its prefix and category inline.

## Changing things: the registration points

Adding or renaming a lens touches **all** of these, and missing one makes valid findings hard-fail (worked procedure: `.claude/skills/add-lens/`):

1. `skills/<lens>/SKILL.md` — the skill itself (match the family skeleton).
2. `skills/production-audit/scripts/audit-check.mjs` — `LENSES`, `CATEGORIES` (if new), `LENS_CATEGORIES`, `LENS_PREFIXES`.
3. `skills/production-audit/references/finding-schema.md` — lens enum, category enum, prefix table.
4. `skills/production-audit/references/lens-registry.md` — the registry entry (skill path, owns, passes, priority, type).
5. `skills/production-audit/SKILL.md` — the Stage 2 lens list.
6. `skills/production-audit/references/running-the-lenses.md` and `scope-and-lens-selection.md` — counts and applicability.
7. `skills/production-audit/ARCHITECTURE.md` — lens table + inventory + count.
8. `README.md` — the lens table and the "N skills total" line.
9. `skills/production-audit/scripts/run-tests.mjs` — cases locking the new lens's ownership rules.

Changing the **harness** (`audit-check.mjs`) has its own discipline — attack-first, test-locked, never weakened (`.claude/skills/harness-dev/`). The one-line version: write the bypass as a failing test case before touching the harness, and treat any PR that deletes or loosens an existing case as an attempted bypass.

## House style

- **British English** (colour, behaviour, -ise, licence). Exceptions: proper nouns/standards (Authorization, MITRE ATT&CK, CSS `color`) and the two vendored skills (`ui-ux-pro-max`, `stripe-best-practices`) which keep their upstream voice.
- **Frontmatter is exactly two keys**: `name` and `description`, description one double-quoted string. Family A descriptions follow "Use this skill to … Trigger on phrases like '…' … It does not cover X (use Y). Defaults to …. Applies to any …". Family B: bare imperative + "Trigger on: …, or when a production-audit selects this lens" + a boundary caveat.
- **Write like the repo.** Declarative, direct, opinionated, concrete. This repo gates *audit reports* on 50 slop regexes ("delve", "game-changer", "in conclusion", …) and its own prose is held to the same standard — before committing docs, reread `skills/anti-slop-writing/SKILL.md` and cut anything it would flag.
- Severity honestly: critical = exploitable now / loses data / burns money uncapped; high = mild effort or a missing control; medium = weakens a defence. Rank by likely damage, not category alarm.
- Checks record credential **types**, never values. No real app names, paths, or live findings anywhere in the repo.

## Known traps (current at 2026-07-01 — details in docs/HANDOVER.md)

- `seo-discoverability/SKILL.md` frontmatter says `name: seo-and-discoverability`, but the lens enum value and directory are `seo-discoverability`. Findings must use the enum value or the harness rejects them. Documented in `lens-registry.md`; do not "fix" one side without the other.
- `UX-UI/` directory ↔ frontmatter `name: ux-ui-patterns`; cross-references use `ux-ui-patterns`. Its supporting .md files sit flat in the skill root.
- `scripts/fixtures/{pass,fail}/` contain illustrative ledgers only (no report.json); they are not used by `run-tests.mjs` and cannot be run through the harness as-is.
- The orchestrator's SKILL.md description block is the *triggering surface* for the whole suite — edit its phrasing carefully.

## Before you finish any change

1. `node skills/production-audit/scripts/run-tests.mjs` → `0 failed`.
2. `node .claude/skills/release-check/scripts/check-consistency.mjs` → clean (it catches count drift, enum drift, dead references — the exact failure class this repo accumulates).
3. If you changed the suite's shape: update `docs/HANDOVER.md`'s state section; add an ADR to `docs/decisions/` if you changed a load-bearing decision (mark the old one superseded — never edit history).
4. Reread your prose against the slop lists. This repo's credibility is its writing.
