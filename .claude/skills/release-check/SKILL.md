---
name: release-check
description: "Use this skill before committing or merging any change to this repo — especially changes under skills/. Trigger on 'release check', 'pre-merge check', 'is this ready to commit', 'validate the repo', or at the end of any task that touched the suite. It runs the harness regression suite and the cross-file consistency checker, then walks the judgement checks a script cannot do."
---

# Release check for seatrial

The suite's registration data is spread across files that must agree (harness enums, finding schema, lens registry, orchestrator docs, README counts). This repo's characteristic failure is drift between them — every past lens addition left at least one stale count behind. The check is two scripts plus a short judgement pass.

## 1. The scripts (hard gates)

```bash
node skills/production-audit/scripts/run-tests.mjs
node .claude/skills/release-check/scripts/check-consistency.mjs
```

Both must exit 0. The consistency checker cross-references:

- harness `LENSES` / `CATEGORIES` / `LENS_CATEGORIES` / `LENS_PREFIXES` ↔ `finding-schema.md` enums and prefix table ↔ `lens-registry.md` entries ↔ directories on disk;
- README's "N skills total (L lenses + 1 orchestrator + C craft)" arithmetic, lens table, and adversarial-case count ↔ reality;
- `ARCHITECTURE.md` and `running-the-lenses.md` counts;
- every skill's frontmatter (name + description present; name matches directory, with the two documented mismatches warning rather than failing);
- dead `references/*.md` links inside production-audit;
- dangling skill names in "Skills this leans on" / "Relationship to other skills" sections.

Two standing warnings are expected (the UX-UI and seo-discoverability name mismatches — documented traps, see `CLAUDE.md`). Anything else needs fixing or an allowlist entry *with a comment saying why*. If the checker exits 2, a parse anchor disappeared: a doc changed shape, and either the doc or the checker needs a deliberate update — do not paper over it.

## 2. Judgement checks (a script cannot do these)

- **Prose quality.** Reread everything you wrote against `skills/anti-slop-writing/SKILL.md` — the banned words, the banned sentence patterns, the formatting tells (bolded-phrase bullet openers, em-dash overuse). This repo's product is judgement expressed in prose; slop in the repo undercuts the pitch.
- **British English** in repo-authored files (the vendored `ui-ux-pro-max` and `stripe-best-practices` keep their upstream voice).
- **No leakage.** No real app names, live findings, secrets, or credential values anywhere — the `.gitignore` blocks audit artifacts, but prose can leak too. Check examples you invented are generic.
- **Detection precision** for any new check: would two people flag the same lines from your wording? Vague detection is the one thing `CONTRIBUTING.md` promises to bounce.
- **Docs moved with the code.** Harness behaviour changes → `finding-schema.md` / `ledger-and-reconciliation.md` / `verification-and-severity.md` / `report-format.md` updated in the same commit. Load-bearing decision changed → new ADR in `docs/decisions/` superseding the old. Suite shape changed → `docs/HANDOVER.md` state section refreshed.
- **`.gitignore` negation trap.** New files under `docs/` need their own `!docs/...` negation or they silently stay untracked (`git status` must show them).

## 3. Commit hygiene

Logical units: product-skill changes, harness+tests changes, and maintainer-docs changes commit separately. Commit messages name the lens/check touched, in the imperative, like the existing history ("Add dependency-audit and infrastructure-config lenses", "Wire new lenses into the audit pipeline"). One check per PR (the public contribution contract); maintainers batching a coherent feature may group, but the PR body then lists each piece.
