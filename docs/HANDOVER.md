# Handover — state of seatrial

Written 2026-07-01 on branch `claude/opus-4.8-documentation-gy6nfh`, after a full read of the repo by a documentation pass; updated 2026-07-02 after a second pass that executed the backlog's top three items. This is the orientation document for the next agent or maintainer: what exists, what just changed, what is known-broken or known-odd, and what is worth doing next.

**Reading order for a new session:** `CLAUDE.md` (root — the working rules) → this file → `docs/OPERATORS-GUIDE.md` (if running audits) → `docs/decisions/` (before changing architecture) → `skills/production-audit/ARCHITECTURE.md` (the wiring).

## What this repo is

seatrial (repo name SeaTrails): 32 Claude skills — 19 audit lenses, the `production-audit` orchestrator, 12 craft skills — plus a zero-dependency integrity harness (`audit-check.mjs`) that gates every audit report, its adversarial regression suite (`run-tests.mjs`, 50 cases), and a renderer (`render-report.mjs`) that generates the human report from gated data. The audit is executed by an agent reading prose; the scripts make its output's *integrity* machine-checked. ADRs 0001–0014 record why.

## Verify this handover's claims

```bash
node skills/production-audit/scripts/run-tests.mjs                    # 50 passed, 0 failed
node .claude/skills/release-check/scripts/check-consistency.mjs      # 0 failures, 2 known warnings
```

The two warnings (UX-UI and seo-discoverability name mismatches) are documented traps, not regressions — see "Known oddities" below.

## History

| When | What | Effect |
|---|---|---|
| 2026-06-13 | Initial release (`045ec71`) | 28 skills, the harness, the suite's whole shape, in one drop (+16.8k lines) |
| 2026-06-15 | Three lenses added (`e663ae7`…`4258a21`) | code-quality (+ yellow/orange adversary passes, deferred-implementation detection), dependency-audit, infrastructure-config; wired into harness + registry → 31 skills |
| 2026-06-25 | `ui-ux-pro-max` (`c8cfb3e`) | vendored design-intelligence toolkit: 3 Python scripts + 32 CSVs (+9.3k lines) → 32 skills |
| 2026-07-01 | this branch | documentation layer + drift repairs + one harness gap closed (below) |
| 2026-07-02 | this branch | backlog items 1–3 executed: coverage-matrix enforcement, runnable fixtures, inline lens contracts (below) |

## What this branch changed

**New documentation layer** (all tracked via targeted `.gitignore` negations — see the trap note below):

- `CLAUDE.md` — working rules for agents in this repo.
- `docs/decisions/` — 14 ADRs + index, retrospective records of the load-bearing decisions.
- `docs/OPERATORS-GUIDE.md` — running the suite against a target repo: install, subagent orchestration, staging, gate-failure table.
- `docs/HANDOVER.md` — this file.
- `.claude/skills/add-lens/` — the complete lens/check registration procedure (all nine registration points).
- `.claude/skills/harness-dev/` — the attack-first discipline for touching the harness, with a map of both scripts.
- `.claude/skills/release-check/` — pre-merge validation: skill doc + `scripts/check-consistency.mjs`, a zero-dependency checker that cross-references the harness enums, schema, registry, directories, and README/ARCHITECTURE counts.
- `.github/workflows/tests.yml` — CI running the regression suite + consistency check on every push/PR. Until now nothing ran the tests automatically; "weakening the harness flips a test" only binds if the tests run.

**One harness integrity gap found and closed (test-first):** `FINDING_ID_IN_TEXT` used `[A-Z]{2,6}` and could not extract digit-bearing prefixes (`A11Y-…`, `SOC2-…`, `I18N-…`) from chain prose — so a chain step citing a dropped A11Y finding evaded the dangling-reference check. Case 43 ("chain step text references a DROPPED A11Y finding") was written first and observed wrongly passing, then the regex was broadened to `[A-Z][A-Z0-9]{1,5}`. While writing that case it emerged that the neighbouring original case (dropped `SEC-002` in chain text) lacks a `remediation_order`, so it fails via the remediation check rather than pinning the prose check specifically; the new case supplies the order so the prose reference is its only possible failure. Tightening the older case the same way is a small open task.

**Drift repaired** (each found by cross-reading, now guarded by the consistency checker):

- `skills/production-audit/references/report-format.md` **created** — it was referenced from 8+ places (SKILL.md, ARCHITECTURE.md, four references, the harness header) but never existed. Reconstructed from `render-report.mjs`, which the file itself names as authoritative on any disagreement.
- `ARCHITECTURE.md`: "all 31 skills" → 32; `ui-ux-pro-max` added to the skill-inventory table (it appeared in no production-audit doc).
- `running-the-lenses.md`: "the 14 atomic lenses" → 17, with the three 06-15 lenses added to the list.
- `lens-registry.md`: code-quality pass list was missing "Deferred implementations" (the skill defines 12 passes; the registry said 11).
- `README.md`: adversarial-case count 42 → 43.
- `skills/UX-UI/SKILL.md`: its reading list pointed at `references/*.md`, a subdirectory that doesn't exist (the seven files sit flat in the skill root); paths corrected.
- `skills/analytics-and-instrumentation/SKILL.md`: removed the dangling reference to `belief-shift-engine`, a skill that exists nowhere in the repo.

**`.gitignore` note (trap for future doc work):** `docs/` and `.claude/` were fully ignored (the author keeps private packaging notes and machine-local config there). They are now `docs/*` and `.claude/*` with explicit negations for exactly the tracked assets (`!docs/decisions/`, `!docs/HANDOVER.md`, `!docs/OPERATORS-GUIDE.md`, `!.claude/skills/`). A new file elsewhere under `docs/` will be **silently untracked** until you add its negation. This was a deliberate trade: the author's private local files stay ignored; the durable docs are versioned.

The trap bit twice during this very pass: the protective `*report*.md` ignore (meant for real audit output) caught the new `references/report-format.md` at commit time, and then caught `docs/decisions/0013-report-rendered-from-gated-data.md` — a directory negation does not override a file-glob match, so `!docs/decisions/*.md` had to be explicit. Both fixed with targeted negations, and the consistency checker now runs `git check-ignore` over every tree that is meant to be tracked (`skills/`, `docs/decisions/`, `.claude/skills/`, `.github/`, the tracked root docs) so a repo file caught by an ignore pattern is a hard failure, not a silent omission.

## What the second pass changed (2026-07-02)

The top three backlog items, each done under the harness-dev discipline:

- **Coverage matrix enforced** (was backlog #1). Four bypasses were written and observed wrongly passing, then `checkCoverage` was extended: when lenses ran, `coverage.matrix` must exist with a row per run lens, `areas_total` must be a positive number, and a row naming a lens that neither ran nor was deferred fails (coverage padding). A boundary case locks the legitimate pattern — a deferred lens's empty row. The suite's `report()` helper now derives a conforming default matrix from each case's own `lenses_run`, and the two pre-existing coverage cases carry explicit matrices so each still pins its original attack.
- **Fixtures are runnable worked examples** (was backlog #2). Both fixture dirs gained their paired `report.json`; the runner gained `fixtureDir` (spawn the harness against a committed directory) and `expectExit` (assert exit 1, a gate failure, not exit 2, an input error); the last two suite cases now run the fixtures end-to-end, so they cannot rot. `fixtures/README.md` explains what each demonstrates — the pass fixture shows merge, verification, a re-narrated chain, the compliance duty, the polish cap, and a full coverage block; the fail fixture is rejected for exactly four named reasons, including the "keeping as high pending verification" tell. The `*report*.json` ignore gained a fixtures negation.
- **Every lens declares its contract inline** (was backlog #3). All 14 Family A lenses now carry a `## What to produce under a production-audit` block naming their prefix, primary category, consequence-routed secondaries, and the ledger-append duty — including `anti-slop-writing` (COPY, `content`, the medium cap, the copy-vs-consequence boundary, and its second role governing the report's own prose) and `seo-discoverability` (which now states in-file that the `lens` enum value is the directory name, not its frontmatter name). The consistency checker verifies every lens's declared prefix set and primary category against the harness maps, so the blocks cannot drift.
- Also: the original chain-prose test case gained a `remediation_order` so the dropped-id-in-prose reference is its only possible failure (was backlog #6).

## Known oddities — understood, deliberately not "fixed"

- **`seo-discoverability`**: frontmatter `name: seo-and-discoverability` vs directory + lens-enum `seo-discoverability`. Documented in `lens-registry.md` as a known mismatch. Any finding must use the enum value. Aligning the frontmatter is a one-line fix *plus* the registry note — left alone because the author documented rather than fixed it, which reads as a choice; see backlog.
- **`UX-UI`**: directory name vs frontmatter `ux-ui-patterns`; every cross-reference uses `ux-ui-patterns`. Same treatment.
- **Install-location paths**: every path inside the product docs assumes `.claude/skills/` (the installed location in a *target* repo). In this repo the files live under `skills/`. This is correct, not drift — do not "fix" product docs to point at `skills/`.
- **Family A vs Family B lenses.** 14 lenses are standalone prose specialists (Family A) whose primary output is a prose report; 5 are audit-native (Family B). Since the second pass, both families carry the output contract in-file (`## What to produce under a production-audit` for A, bare `## What to produce` for B) and the checker verifies the declarations. The registry's override instruction still applies when Family A runs as lenses: the schema beats their "How to report" prose. The remaining reliable family discriminator is the description phrase "or when a production-audit selects this lens" (Family B only).
- **The suite's own prose vs its own rules.** The lens files use bolded-bullet lead-ins and em-dashes densely — patterns `anti-slop-writing` flags. The slop gate applies to audit *reports*, not repo prose; still, an irony to be aware of when editing.
- **`audit-check.mjs` invariant comments** are numbered non-monotonically in source (INVARIANT 8 sits above 7). Call order at the bottom of the file is what runs. Cosmetic.

## Improvement backlog, ranked

Each entry: why it matters, then the sketch. Ordered by value-to-effort for an agent picking up the repo. (The 2026-07-01 list's items 1, 2, 3 and 6 were executed on 2026-07-02 — see "What the second pass changed".)

1. **Resolve the code-audit ↔ `accessibility` category tension.** `lens-registry.md`'s code-audit entry says pass-6 access barriers are "categorised `frontend` … or `accessibility`", but `LENS_CATEGORIES` does not grant code-audit the `accessibility` category — a UIUX-prefixed finding filed as `accessibility` hard-fails. The inline contract added in the second pass routes access barriers to the accessibility lens via `dedup.also_seen_by_lenses`, matching the harness. Either extend code-audit's ownership deliberately (attack-first, with a boundary case) or tighten the registry wording to match the harness; today the registry sentence overstates.
2. **Resolve the two name mismatches** (`seo-and-discoverability`, `ux-ui-patterns`) one way or the other: align frontmatter to directory (then update `lens-registry.md`'s note, `CLAUDE.md`, and the consistency checker's allowlist) or record an ADR saying why they stay. Today they are allowlisted warnings; either resolution is better than the standing exception. The seo trap is at least now stated inside the skill itself.
3. **`ui-ux-pro-max` intake debt.** It ships two orphaned CSVs no script reads (`design.csv`, `draft.csv` — ~3.5k rows, bilingual content, one marked "backup/reference only" in a Chinese note); it is American-English against house style; its Python has no tests; and its data provenance/licence is unrecorded. Decide: wire the orphans in, or delete them; add a smoke test (`search.py --design-system "saas dashboard"` exits 0 and emits a palette); record provenance in the SKILL.md.
4. **Reshape `ai-saas-security` into lens form.** It is registered as a priority-1 lens but written as a build guide (implementation checklists, no numbered passes); the registry's pass list re-labels its sections. Its new What-to-produce block covers the output contract, but the body still reads build-first. Rewrite into detection-oriented passes without losing its content, or accept and document the genre exception.
5. **Harness `--json` output.** A machine-readable failure list would let CI annotate PRs and let orchestrating agents branch on specific invariants instead of parsing prose. Additive flag; attack-first cases for the flag's own shape.
6. **Distribution.** Installation is "copy skills/ into .claude/skills/" (now documented in the operator guide), but there is no install script, no versioning, no update path. Options: a `schema_version` field in `report.json` (gate warns on mismatch), a tagged-release convention, or packaging as a Claude Code plugin. Decide when there are external users to serve.
7. **`stripe-best-practices` staleness.** Vendored with a pinned API version string ("2026-04-22.dahlia"). Add a check-against-current-docs note in the skill, or a refresh cadence.
8. **Naming.** The product calls itself seatrial; the repo is SeaTrails. Cosmetic, author's call — but pick one before external users cite it.

## Working agreements

The rules live in `CLAUDE.md`; the procedures live in `.claude/skills/{add-lens,harness-dev,release-check}`. The one-sentence versions: run both checks before any commit; change the harness attack-first or not at all; register a lens in all nine places; write like the repo — British, direct, slop-free.
