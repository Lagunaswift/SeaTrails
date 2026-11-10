# Handover — state of seatrial

Written 2026-07-01 on branch `claude/opus-4.8-documentation-gy6nfh`, after a full read of the repo by a documentation pass; updated 2026-07-02 after two follow-up passes that executed the backlog's top items. This is the orientation document for the next agent or maintainer: what exists, what just changed, what is known-broken or known-odd, and what is worth doing next.

**Reading order for a new session:** `CLAUDE.md` (root — the working rules) → this file → `docs/OPERATORS-GUIDE.md` (if running audits) → `docs/decisions/` (before changing architecture) → `skills/production-audit/ARCHITECTURE.md` (the wiring).

## What this repo is

seatrial (repo name SeaTrails): 34 Claude skills, comprising 21 audit lenses, the production-audit orchestrator and 12 craft skills. The zero-dependency gate, renderer and regression suite remain the execution checks. The core suite contains 155 cases, with 20 evidence integration checks, 88 observation checks (89 when a browser library resolves) and 103 corpus/scorer checks.

## Observation records update (2026-11-10)

**What exists.** Verified findings name their evidence basis. `observe.mjs` records a replayable search or an executed probe against the captured snapshot, with an optional control replacement of the cited file. `observation.mjs` holds the recording logic and the gate rules; `audit-check.mjs` calls it after `checkAssurance`. `export-findings.mjs` writes a sealed bundle for another tool. Contracts: `references/observation-contract.md`, `references/findings-interchange.md`. Decision and rejected alternatives: ADR 0018. Reports opt in with `assurance_version: 2`; version 1 and legacy behaviour are unchanged except that a legacy report can no longer cite observation-backed evidence.

**How it was built.** Attack-first: eight evidence-kind cases were added to `run-tests.mjs` and seven were observed passing the gate before INVARIANT 13 and the shape checks closed them. No existing case was removed or relaxed. A separate adversarial review of the new code was commissioned; see "Independent review" below.

**What was measured.** `scripts/benchmark/v2-2026-11-10/` holds twenty blinded runs on corpus v2 across two model tiers (`summary.json` is the scored comparison; `references/evidence-assurance.md` has the protocol).

| Question | Result |
|---|---|
| Does a probe-enabled protocol detect more than reading? | No. Recall and false-positive rate were identical per model: 13/16 and 13/16 on the larger model, 29/32 and 29/32 on the smaller (adjudicated). Token cost rose 6% and 20%. |
| Does it verify a concrete claim more accurately? | No. Every arm scored 24/24. |
| Were the unexpected findings false? | No. All ten disputes were adjudicated for the workers by execution. Four members labelled sound hold real contract violations; 0 of 86 findings were false after adjudication. |
| Do repeated runs agree? | 92–96% of cases read-only and 88% observe on the smaller model (24 cases, 2 repeats). |
| Do independent passes add recall? | Post hoc: the union of all runs located 16/16 defects against 13–14.5 per single run. |
| Is observe-arm evidence checkable? | 43 of 43 findings cited an observation the log confirms as a deviation on that case. 21 of 64 recorded observations were never cited by the worker. |

Read this as: the mechanism's measured value is evidence a gate can check and disputes execution can settle. A detection benefit is unsupported on short single-module code and untested on multi-file, stateful or browser-dependent code. Limits: prompt-level isolation only, model versions unavailable, small counts, one seed per task, workers acted as their own controller.

**Not run.** No audit of a real repository used the new records. The web adapter ran only against the fixture page. No game adapter exists. The benchmark did not exercise controls, searches or the gate's accounting rules; those are covered by `test-observation.mjs` only.

**Open pull requests.** #5's head (`2f942bf`) is an ancestor of main: nothing is left to merge. #4's single commit (`38092ba`) has 500 of its 509 substantive added lines verbatim in main, which integrated that work through #7; the other nine are superseded counts and phrasing. Neither was merged or closed in this pass. Closing both without merging loses nothing.

### Independent review

A reviewer with no part in the design was given the code and the contract and asked for runnable proofs of any report the gate wrongly accepts. It proved nine weaknesses in the first implementation (commit `00fc514`). All nine are closed in the following commit, each with a test in `test-observation.mjs` or `run-tests.mjs`, and each proof script was re-run and now ends in a rejection.

| Weakness proved | Closed by |
|---|---|
| A search that never read the cited file backed `static-search` | Scope check on replay: the finding's file must have been scanned; a `present` result needs a match in the finding's files |
| A control changed the cited file cosmetically and fixed another file | Every control file must be one the finding names, its primary location included |
| A probe kept state between runs and conformed under the control without loading the target | Fresh probe copy per run; the subject is repeated beside the control in a hidden order; new status `unstable` |
| A record relabelled `exploratory` escaped the conflict and drop rules | Both rules read the probe's targets, whatever its subject and wherever it is cited |
| Any deviation, even simulated, cancelled a conforming probe | Only a controlled reproduction outweighs a conforming run |
| A linked `.git` let a probe plant a hook that ran inside the gate | `.git` cannot be linked; the tools run git with `core.fsmonitor` off |
| The last record could be cut from the log | Store directories must match the chain; the remaining limit is stated in the contract |
| Record text injected a section into the report | Record text is one bounded line; the renderer prints search flags and files read |
| A malformed dropped entry passed the gate and crashed the renderer | Shape check in the gate, legacy path included |

The reviewer also listed some twenty attacks the gate already rejected. Limits that remain open are in `observation-contract.md`: a probe that keeps state outside its working directory and counts runs, a probe that pattern-matches source text, writes to linked directories, and forgery by a party who controls the whole evidence directory.

### Follow-up work, sized for a single worker each

Each task names its files and its acceptance. None overlaps another. Harness tasks follow `.claude/skills/harness-dev/`.

1. **Corpus v3: repair the mislabelled pairs.** Never edit `corpus-v2.json`; its runs are bound to its hash. Create `benchmark/corpus-v3.json` and `claims-v3.json`, and let `benchmark.mjs` select a corpus by name. Fix both members of pairs 04, 05, 07 and 10 so each differs only by its intended defect, and extend each oracle to cover the adjudicated inputs. Accept when: every `check` in `adjudications-v2.json` returns false on the corresponding v3 sound member; `test-benchmark.mjs` asserts all v3 labels; a separate adjudicator has tried to break every sound member by execution and its rulings file has no `unlabelled_defect`.
2. **Cases where reading should fail.** New corpus of small multi-file repositories (3–6 files): a guard in another module, state built over a call sequence, a framework default. `prepare-v2` learns directory cases. Write the hypothesis and the stopping rule into the results directory before any run. Accept when: both tasks and both arms are run on two model tiers with two repeats, and the write-up states the result whichever way it falls. If the read-only arm is again at ceiling, say so and stop.
3. **Union of passes, pre-registered.** Add `benchmark.mjs union-v2 <scored...>` reporting located defects and flagged sound cases for the union of k runs, k = 1 to n. Tests in `test-benchmark.mjs`. Then run three read-only repeats per split per model on corpus v3 and record cost per added defect. Accept when: the command is tested and the runs are stored like `v2-2026-11-10/`.
4. **Replay observations on a later snapshot.** `observe.mjs replay <repo> <old-evidence> <new-evidence>` re-runs each stored specification against a new capture and appends records to the new directory with a `replays` field naming the original record. The old directory is never written. A specification whose targets are gone records `unavailable`. Output: a table of result transitions per observation. `checkObservations` validates `replays` when present. Accept when: `test-observation.mjs` covers deviation→conforms after a fix, an unchanged deviation, a missing target, and an untouched old directory.
5. **Entry-point inventory with a checkable denominator.** `coverage.surface_inventory` lists routes, handlers and forms with a disposition each (`examined`, `finding`, `not_applicable`). Each class cites a search observation with `expect: present`; every match of that search must map to an inventory entry. Files: `audit-check.mjs`, `observation.mjs`, `references/coverage-matrix.md`, `run-tests.mjs`, `test-observation.mjs`. Accept when: an inventory that omits a matched line is shown passing today and failing after, with its boundary case.
6. **Game adapter example.** `fixtures/observation/game-loop/`: a deterministic headless loop module, a probe that writes one step per checkpoint, a control. No dependency. Accept when: `test-observation.mjs` runs it everywhere and `observation-contract.md` replaces "No example ships yet".
7. **Tell the lenses when to ask for an observation.** Add one "evidence to request" line to `references/running-the-lenses.md` and to the lenses whose claims are behavioural or about absence: `frontend-robustness`, `code-audit` (correctness and access passes), `accessibility` (keyboard journeys), `scaling-audit` (concurrency), `ai-saas-security` (rate and cost limits). Output contracts do not change. Accept when: the consistency checker is clean and each line names the claim type and the observation kind.
8. **Keep benchmark material out of installs.** The operator guide's install step copies `scripts/benchmark/`, labels and keys included, into target repositories. Document an install that omits it, or move it under a maintainer path, and update the paths in `benchmark.mjs`, the tests and the references. Accept when: all four suites and the consistency checker pass and the operator guide states what is copied.
9. **Diagnostic codes** (existing backlog item 2) now also covers the observation failures in `checkObservations`: stable codes per rule, no change to exit semantics.

## Website readiness update

On 9 November 2026, added an active Nielsen usability review under ux-ui-patterns, called by code-audit's UI/UX pass and the website profile. Its ten review labels map to the existing controls and coverage evidence. The review covers complete tasks, including memory between screens, useful help and truthful cancellation/recovery. Existing undo, cancellation, offline and routed-overlay guidance now distinguishes the product's actual commitments. The 119 controls, twelve profile topics, skill/lens counts and report schema remain unchanged.

The website-readiness profile routes twelve review topics and twenty-four optional-feature decisions through existing lenses. All 119 controls in the supplied website brief map to native ownership in `website-readiness-coverage.md`. New coverage records stay inside report.json; findings, ledger and severity contracts remain unchanged. The gate rejects missing/contradictory profile records, hidden gaps and dangling finding references. The renderer exposes all decisions and limitations. It validates declared integrity, not visual truth or detection completeness.

Added focused website/commercial completeness and direct security boundary references. Corrected rendering/SEO, consent, WCAG 2.2, cache, payment, spend-cap and restore guidance. Design audits, copy review and fix-phase frontend-design now share keep/rewrite/restyle/remove decisions based on purpose and observed consequences. Familiar words, fonts and patterns are not defects by themselves. Report mode remains the default.

The integration branch retains the earlier pending design/evidence work through a merge, alongside main's anti-slop-writing v2. It does not install a second detector or change the skill/lens count. ADR 0017 records the profile decision. New invariant cases were demonstrated failing before their gate changes; all original cases remain.

## Evidence assurance update

The renderer now gates a private snapshot itself and requires captured evidence for new reports. `capture-source.mjs` records full-file deliveries against a tracked-file manifest; `assurance.mjs` validates coverage and independent review records with exact source quotations. Controller isolation is required for provenance; the scripts do not provision a sandbox or prove semantic truth. `benchmark.mjs` prepares and scores a separate eight-case detection corpus. ADR 0016 and `references/evidence-assurance.md` specify the contracts and limits.

## Current integration

Added `impeccable-audit` and `taste-audit` with shared design context, upstream provenance, audit-only execution and explicit surface boundaries. Every registration point includes both lenses. No upstream CLI or detector is installed.

Closed reproduced gate bypasses: invalid `--repo` skipping checks; traversal/symlink evidence escapes; ignored secondary and refutation citations; duplicate dispositions; absent reconciliation counts; negative/fractional/impossible coverage; substring matrix matching; unknown or ambiguously deferred lenses. Added strict argument handling, `--json` output and validated `limitations` that survive report rendering. No original regression case was removed or relaxed.

Validation:

```bash
node skills/production-audit/scripts/run-tests.mjs
node skills/production-audit/scripts/test-assurance.mjs
node skills/production-audit/scripts/test-benchmark.mjs
node .claude/skills/release-check/scripts/check-consistency.mjs
```

Expected at that date: 147 core cases, 20 assurance checks and 17 corpus/scorer checks; the current counts are in "What this repo is" above, and `test-observation.mjs` is the fourth suite. 0 consistency failures and warnings. ADRs 0015 and 0016 record the preceding design/evidence additions. Earlier pass descriptions below are historical, not the current inventory.

## History

| When | What | Effect |
|---|---|---|
| 2026-06-13 | Initial release (`045ec71`) | 28 skills, the harness, the suite's whole shape, in one drop (+16.8k lines) |
| 2026-06-15 | Three lenses added (`e663ae7`…`4258a21`) | code-quality (+ yellow/orange adversary passes, deferred-implementation detection), dependency-audit, infrastructure-config; wired into harness + registry → 31 skills |
| 2026-06-25 | `ui-ux-pro-max` (`c8cfb3e`) | vendored design-intelligence toolkit: 3 Python scripts + 32 CSVs (+9.3k lines) → 32 skills |
| 2026-07-01 | this branch | documentation layer + drift repairs + one harness gap closed (below) |
| 2026-07-02 | this branch | backlog items 1–3 executed: coverage-matrix enforcement, runnable fixtures, inline lens contracts (below) |
| 2026-07-02 | this branch | next three backlog items executed: the accessibility category grant, both name mismatches, ui-ux-pro-max intake debt (below) |
| 2026-07-03 | this branch | anti-slop-writing gains a discourse-level "Shape of the Piece" layer from the StoryScope research (below) |
| 2026-11-07 | `anti-slop-writing-v2` | anti-slop-writing moves to version 2.0: the Root Problem tests (provenance, asymmetry, friction), the stop rule, the anti-forgery guard and late-2026 current-model tells replace the shape layer; frontmatter and the lens contract unchanged |
| 2026-11-10 | `claude/new-session-qljzjh` | observation records, named evidence kinds, findings export, corpus v2 with split packets, two tasks, two arms and adjudication; twenty blinded runs recorded (ADR 0018) |

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

## What the third pass changed (2026-07-02)

- **code-audit granted the `accessibility` category** (was backlog #1). The registry had promised consequence routing ("a keyboard trap … is categorised `frontend` … or `accessibility`") that `LENS_CATEGORIES` did not permit. Resolved in the direction of the promise — the same grant `frontend-robustness` and `mobile-and-responsive` already carry. Test-first: a legitimate keyboard-trap case was observed failing under the old map, then the grant made (appended, so code-audit's primary category stays `security`), plus a guard case locking that the grant is per-lens (a performance finding under `accessibility` still fails). code-audit's What-to-produce block now states the direct routing instead of the `also_seen_by_lenses` workaround.
- **Both name mismatches resolved** (was backlog #2). `seo-discoverability`'s frontmatter aligned to its directory and enum (the registry's mismatch note removed; its What-to-produce block simplified). The `UX-UI` directory renamed to `ux-ui-patterns` to match its frontmatter, with every reference swept (code-audit, lens-registry, ARCHITECTURE, README, CLAUDE.md, the maintenance skills). The checker's name-mismatch allowlist is now empty — a clean run reports zero warnings, and any future mismatch is a failure.
- **ui-ux-pro-max intake debt cleared** (was backlog #3). The two orphaned CSVs (`design.csv`, `draft.csv` — unreferenced by any script or doc; one self-described, in a Chinese header note, as a backup the CLI never reads) deleted (~208K; recoverable at `c8cfb3e`). `INTAKE.md` added recording provenance, the vendored-voice decision, the removal, and the refresh checklist. The consistency checker now smoke-tests the toolkit end-to-end (`search.py "saas dashboard" --design-system` must exit 0 and emit a design system; warn-skip when python3 is absent; run with `-B` so the check drops no bytecode into the tree — the gitignore sweep also learned to skip build artifacts).

## What the fourth pass changed (2026-07-03)

**anti-slop-writing now covers shape, not just sentences.** The skill was entirely surface-level (banned words, sentence patterns, formatting). StoryScope (Russell et al., 2026, arXiv:2604.03136 — UMD/DeepMind; 10,272 human stories mirrored by five LLMs, 304 narrative features) showed the surface layer is the *transient* one: discourse-level structure alone separates human from AI at 93.2% macro-F1, artifact-removal editing moves that by only 1.6 points, and the five models cluster in one narrative region while human work disperses. The skill gains a "The Shape of the Piece" section — over-explanation (spelling out what the reader already inferred), forced tidiness (no tangents, total closure), performed feeling (bodily metaphor over plain naming), sensory quota, vague allusion vs named specifics, audience-and-world emptiness, convergent sameness, the fiction-specific tells, and per-model signatures (Claude restraint, GPT gossip, Gemini bleakness, DeepSeek front-loading, Kimi genericity). The revision pass opens with a shape sweep; the lens contract now audits long-form copy surfaces for shape findings even when no banned word appears; CLAUDE.md's house style and release-check's prose judgement reference both depths. The harness's regex gate is deliberately unchanged — shape tells are not regex-able, which the skill now says outright (the numbers are fiction-corpus findings; the section labels its generalisation honestly).

## Known oddities — understood, deliberately not "fixed"

- **Install-location paths**: every path inside the product docs assumes `.claude/skills/` (the installed location in a *target* repo). In this repo the files live under `skills/`. This is correct, not drift — do not "fix" product docs to point at `skills/`.
- **Family A vs Family B lenses.** 14 lenses are standalone prose specialists (Family A) whose primary output is a prose report; 5 are audit-native (Family B). Since the second pass, both families carry the output contract in-file (`## What to produce under a production-audit` for A, bare `## What to produce` for B) and the checker verifies the declarations. The registry's override instruction still applies when Family A runs as lenses: the schema beats their "How to report" prose. The remaining reliable family discriminator is the description phrase "or when a production-audit selects this lens" (Family B only).
- **The suite's own prose vs its own rules.** The lens files use bolded-bullet lead-ins and em-dashes densely — patterns `anti-slop-writing` flags. The slop gate applies to audit *reports*, not repo prose; still, an irony to be aware of when editing.
- **`audit-check.mjs` invariant comments** are numbered non-monotonically in source (INVARIANT 8 sits above 7). Call order at the bottom of the file is what runs. Cosmetic.

## Improvement backlog, ranked

Each entry: why it matters, then the sketch. Ordered by value-to-effort for an agent picking up the repo. (From the 2026-07-01 list: items 1, 2, 3 and 6 were executed in the second pass; the next three in the third pass — see above.)

1. **Reshape `ai-saas-security` into lens form.** It is registered as a priority-1 lens but written as a build guide (implementation checklists, no numbered passes); the registry's pass list re-labels its sections. Its new What-to-produce block covers the output contract, but the body still reads build-first. Rewrite into detection-oriented passes without losing its content, or accept and document the genre exception.
2. **Structured-output follow-through.** `--json` is implemented and tested. Future work: stable per-invariant diagnostic codes and optional CI annotations, without changing the existing gate exit semantics.
3. **Distribution.** Installation is "copy skills/ into .claude/skills/" (now documented in the operator guide), but there is no install script, no versioning, no update path. Options: a `schema_version` field in `report.json` (gate warns on mismatch), a tagged-release convention, or packaging as a Claude Code plugin. Decide when there are external users to serve.
4. **`stripe-best-practices` staleness.** Vendored with a pinned API version string ("2026-04-22.dahlia"). Add a check-against-current-docs note in the skill, or a refresh cadence.
5. **Naming.** The product calls itself seatrial; the repo is SeaTrails. Cosmetic, author's call — but pick one before external users cite it.

## Working agreements

The rules live in `CLAUDE.md`; the procedures live in `.claude/skills/{add-lens,harness-dev,release-check}`. The one-sentence versions: run both checks before any commit; change the harness attack-first or not at all; register a lens in all nine places; write like the repo — British, direct, slop-free.
