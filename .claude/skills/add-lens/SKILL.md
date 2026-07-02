---
name: add-lens
description: "Use this skill when adding a new audit lens or a new check to an existing lens in this repo, or when renaming a lens. Trigger on 'add a lens', 'new lens', 'add a check', 'extend the suite', 'register a lens'. It walks the full set of registration points — the harness enums, the finding schema, the lens registry, the orchestrator, the docs, and the tests — because missing any one of them makes valid findings hard-fail at the gate."
---

# Adding a lens or check to seatrial

A lens reads code for one concern. A check is one concrete pattern a lens looks for. The prose is the easy half; the suite only *works* if the lens is registered everywhere the machinery reads. This skill is the complete procedure. `CONTRIBUTING.md` is the public contract; this is the maintainer's checklist.

## First decide: check or lens?

- **A check** slots into an existing lens: one new pattern under the right pass, in that lens's `SKILL.md` (or its `references/` file for that area). Follow the check contract below, update the lens's registry entry if the pass list changed, done. One check per PR.
- **A lens** is a new concern with its own passes and its own category ownership. Open an issue first (per `CONTRIBUTING.md`) — scope agreement before build. Then follow the whole procedure.

## The check contract (from CONTRIBUTING.md — every check has all six)

- **id** — short, stable, kebab-case.
- **severity** — critical | high | medium. Critical = exploitable now, loses data, or burns money with no ceiling. High = mild effort, or a missing control. Medium = weakens a defence. Rank by likely damage, not category alarm.
- **What it is** — one paragraph: why it bites, why fast-built apps miss it.
- **How to detect** — precise enough that two people would flag the same lines. A check that fires on everything teaches people to ignore the report.
- **Evidence to record** — the exact thing to quote so the finding is checkable. Credential checks record the *type*, never the value.
- **The fix** — one line of direction.

## Which family is the new lens?

New lenses should be **Family B (audit-native)**: written for this suite, carrying their output contract inline. Model on `dependency-audit` (clean and short) or `infrastructure-config`. The skeleton:

```markdown
---
name: <lens-name>
description: "<Imperative verb> <scope>. Checks for: <list>. Trigger on: '<phrase>', '<phrase>', or when a production-audit selects this lens. <boundary caveat — what it does NOT do>."
---

# <Title>

## Why this matters
<why these files/paths go unreviewed; who gets bitten>

## The passes
### Pass 1: <name>
- **<check lead-in>:** <detection detail>
...

## What to produce
Findings in the canonical schema (`production-audit/references/finding-schema.md`),
prefix `<PREFIX>`, category `<category>`. <severity guidance for this lens>.
Use `dedup.also_seen_by_lenses` when the underlying issue is another lens's finding.

## Relationship to other skills
- **<skill>** — <boundary: what it owns that this doesn't>
```

Family A (the 14 prose specialists) exists for skills that are also useful standalone; its "cardinal principle / areas in priority order / How to report / Scoping / Skills this leans on" skeleton is documented in `docs/HANDOVER.md`. If you write one, remember it carries **no** schema language — the registry injects the contract — so its registry entry matters even more.

House style either way: British English, two frontmatter keys only (`name`, `description`), declarative and concrete, no slop (reread `skills/anti-slop-writing/SKILL.md`).

## The registration points — all of them, in order

Work through these top to bottom. After each group, the validation at the end catches what you missed.

1. **The skill itself** — `skills/<lens-name>/SKILL.md`. Directory name must equal frontmatter `name` (the two legacy mismatches, `UX-UI`/`ux-ui-patterns` and `seo-discoverability`/`seo-and-discoverability`, are allowlisted traps, not precedent).
2. **The harness** — `skills/production-audit/scripts/audit-check.mjs`:
   - add the lens name to `LENSES`;
   - add the new category to `CATEGORIES` (if it introduces one);
   - add `'<lens>': ['<primary-category>', <secondary categories it may legitimately file under>]` to `LENS_CATEGORIES` — keep this tight; every extra category is a hiding channel (see ADR 0008);
   - add `'<lens>': ['<PREFIX>']` to `LENS_PREFIXES`. Prefix: 2–6 chars, ALL-CAPS, unique. **Prefer pure letters** — the chain-prose scanner (`FINDING_ID_IN_TEXT`) accepts digits after the first letter, but pure-letter prefixes have never been the bug.
3. **The schema** — `skills/production-audit/references/finding-schema.md`: the `lens` enum, the `category` enum (if new), and the ID prefix table.
4. **The registry** — `skills/production-audit/references/lens-registry.md`: a `## Lens N: <name>  (prefix X · priority Y)` entry with Skill path (in `.claude/skills/…` install form), References, Owns (non-overlapping — name the boundary with the nearest lens), Passes, Type (atomic/synthesis), and When-to-run condition.
5. **The orchestrator** — `skills/production-audit/SKILL.md`: the Stage 2 lens list (one bullet: what it owns, what category its findings carry).
6. **Stage references** — `skills/production-audit/references/running-the-lenses.md` (the atomic-lens count and running order) and `scope-and-lens-selection.md` (the applicability map: which app types trigger it).
7. **Architecture** — `skills/production-audit/ARCHITECTURE.md`: the lens table row, the skill-inventory table, and the "The lenses (N)" / "all N skills" counts.
8. **README** — `README.md`: the lens table row and the "N skills total (L lenses + 1 orchestrator + C craft)" line.
9. **The tests** — `skills/production-audit/scripts/run-tests.mjs`: add at least two cases —
   - a finding from the new lens with its correct prefix + category **passes**;
   - the new category filed by a lens that doesn't own it (or the new lens filing under a category it doesn't own) **fails**.
   If the lens has a severity cap or special gating (like the polish axes), lock both directions: the cap fires, and the nearest legitimate uncapped case does not.

## Validate

```bash
node skills/production-audit/scripts/run-tests.mjs                 # 0 failed
node .claude/skills/release-check/scripts/check-consistency.mjs    # catches any registration point you missed
```

The consistency check cross-references the harness enums, the schema enums and prefix table, the registry entries, the directories on disk, and the README/ARCHITECTURE counts. If it is green and the tests are green, the lens is registered.

## Renaming a lens

Same list, in reverse care: the lens enum value is load-bearing (it appears in every finding), so a rename touches every registration point *plus* any test case using the old name. Grep for the old name across `skills/` before declaring done. Do not rename `seo-discoverability` or `UX-UI` casually — their mismatches are documented in `lens-registry.md` and `CLAUDE.md`; fixing them is a deliberate task (see the handover backlog), not a drive-by.
