# Intake notes — ui-ux-pro-max (maintainer file, not part of the upstream skill)

This skill was imported wholesale in commit `c8cfb3e` (2026-06-25). The upstream origin was not recorded at import time; treat the imported content as third-party. This file records the intake decisions so they are not re-litigated.

## Decisions

- **Voice.** The skill is written in American English with emoji in script output, against this repo's British house style. Kept as-is — `CLAUDE.md` exempts the two vendored skills (`ui-ux-pro-max`, `stripe-best-practices`) so their content can be diffed against upstream if an origin is ever identified. Do not partially Anglicise it.
- **Orphaned data removed (2026-07-02).** `data/design.csv` (~1,775 rows) and `data/draft.csv` (~1,778 rows) were deleted: no script or doc referenced them, and `draft.csv`'s own header note (in Chinese) said the search engine and CLI never read it — it described itself as a design backup/reference. They were ~208K of dead weight with bilingual content the runtime could never surface. If they are ever wanted back, they exist in git history at `c8cfb3e`.
- **Dependencies.** Python 3 stdlib only — matching the repo's zero-dependency rule (ADR 0002). Keep it that way; no pip.

## The smoke test

The release-check consistency checker runs the toolkit end-to-end (domain search implied by the design-system path, BM25 over the CSVs, the ASCII renderer):

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "saas dashboard" --design-system   # exit 0, emits a design system
```

A broken CSV, a bad import, or a Python regression fails the release check rather than surfacing mid-design-session. The checker warns and skips when `python3` is absent.

## When refreshing from upstream

1. Record where the refresh came from, here.
2. Re-check for orphaned data files (`grep -rn "<file>.csv" scripts/ SKILL.md` for each data file).
3. Confirm stdlib-only imports (`grep -rn "^import\|^from" scripts/` — everything must be standard library).
4. Re-run the smoke test and the full release check.
