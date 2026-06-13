# Stage 2: Running the lenses

With the applicable lenses chosen, run each over the codebase. The orchestrator does not reinvent each lens's analysis, it invokes each specialist skill's discipline and collects what it finds. The job at this stage is to run them consistently, cite every finding to file and line, and tag each with its owning lens so the later merge and consolidation can work.

## Skill-loading protocol

Before running any lens, the orchestrator (or each subagent if running in parallel) **must** load the lens's backing skill. This is what turns ad-hoc analysis into structured, repeatable auditing.

1. **Consult the lens registry** (`references/lens-registry.md`). Look up the lens by name. The registry tells you: (a) the backing skill file path, (b) the id prefix, (c) a summary of its passes, (d) what the lens owns, (e) the reference files to read.
2. **Read the backing skill file.** Every lens now has a dedicated `SKILL.md` (the 14 atomic lenses — code-audit, ai-saas-security, scaling-audit, release-and-ops, data-privacy, frontend-robustness, performance, accessibility, email-deliverability, seo-discoverability, mobile-and-responsive, analytics-and-instrumentation, internationalisation, anti-slop-writing — plus the 2 synthesis lenses, soc2-compliance and adversary-emulation). Read that file and follow its methodology — its passes, priorities, severity guidance, and overlap notes. Do not approximate or guess what a skill covers; the skill is the authority on its own method.
3. **Read the lens's reference files.** Each rich skill has a `references/` directory (6–7 files) that expand its passes. Read the ones relevant to the surfaces present. The registry lists them per lens.
4. **Synthesis lenses read the ledger — but adversary-emulation reads the *reconciled* one.** soc2-compliance runs after the atomic lenses and takes `raw-findings.jsonl` as its primary input. **adversary-emulation** runs after Stages 3–4 (merge + verification) and takes the **reconciled, verified** finding set as input — not the raw pre-reconciliation ledger. Chains must only reference findings that survived reconciliation; the harness hard-fails any chain whose component id was dropped or merged away (see `ledger-and-reconciliation.md`). Give the adversary-emulation subagent the reconciled findings, not the raw ledger.
5. **When spawning subagents**, include the skill-loading instruction in the subagent prompt. Tell the subagent: "Read `.claude/skills/{skill-name}/SKILL.md` and its references before starting. Follow its passes in order, adapted to the detected stack (`stack-adaptation.md`). Emit findings in the canonical schema (`finding-schema.md`) — that schema **overrides** any output format the backing skill describes."

The skill-loading protocol is not optional. A subagent that "runs a security pass" without reading `code-audit/SKILL.md` and its 11 sub-skill references will produce shallow, incomplete findings. The skills encode what to look for, where, and how to calibrate severity — they are the difference between an audit and a grep.

## Run each lens under its own discipline

For each selected lens, apply that skill's actual method, do not approximate it. `code-audit` runs its six passes (security, correctness, debugging probe, tests, structure, UI/UX); `scaling-audit` runs its six (durability, SPOFs, concurrency, dependencies, cost, observability); and so on. Each lens knows its own passes and priorities; the orchestrator's contribution is running them all and then doing the cross-lens work the individual lenses cannot. Read each lens's SKILL.md and references as you run it, rather than working from memory of what it covers.

## Priority order of the run

Run in roughly descending order of how catastrophically a miss bites, so the most important analysis happens first and is freshest:
1. `code-audit` (security/correctness) and `ai-saas-security`: breaches and broken logic.
2. `scaling-audit` and `release-and-ops`: data loss, outages, unshippable releases.
3. `data-privacy`: legal and trust exposure, often high-stakes.
4. `frontend-robustness`: user-facing breakage on real conditions.
5. `performance`, `accessibility`, `mobile-and-responsive`: usability and reach.
6. `email-deliverability`, `seo-discoverability`, `internationalisation`, `analytics-and-instrumentation`, `anti-slop-writing`: reach, discoverability, measurement, and copy quality.

The order is a guide, not a constraint; what matters is that all selected lenses run and nothing is dropped because attention flagged late.

## The citation standard

Every finding must be cited to **file and line** (e.g. `src/app/api/email/route.ts:40`), the same standard the reference audit holds. A finding without a location is not actionable and not verifiable. When a finding spans several places, cite the primary site and list the others. This citation is also what makes Stage 4's adversarial verification possible, you cannot re-check a claim you cannot locate.

## Adapt every lens to the detected stack

Stage 0 produced a stack profile (see `stack-adaptation.md`). The lens skills are written with concrete examples that are often Next.js/Firebase-flavoured — those are illustrations of universal questions, not the questions themselves. Before running a lens, translate its checks to the stack in front of you: "Firestore transaction" → "SQL transaction / row lock" on a Postgres app; "`loading.tsx`" → the framework's async-state mechanism, or "not applicable" on a headless API. Add the stack-specific checks the JS-flavoured lenses under-emphasise (SQL injection on any SQL stack, unsafe deserialization on Python/Java, goroutine/context issues on Go). Use the translation table in `stack-adaptation.md`. The intent is portable; the vocabulary is not — apply the intent, and say in scope which checks were translated or skipped as inapplicable.

## The canonical schema overrides each backing skill's own output format

This is critical and easy to get wrong. The specialist lens skills (`scaling-audit`, `data-privacy`, `performance`, etc.) are general-purpose skills that predate this orchestrator. Each ends with its own "What to produce" section describing a *prioritised report* or a loose `id, title, file:line, issue, consequence, severity, fix` shape. **When a skill is run as a production-audit lens, the canonical schema (`finding-schema.md`) overrides that.** Read the backing skill for its *methodology* (what to look for, where, how to rate); ignore its *output-format* instruction and emit the canonical schema instead. The schema is what the ledger stores and what `audit-check.mjs` validates — a finding in any other shape is rejected by the harness, so loose-format output is not optional drift, it is a build failure.

Worked transform — a `scaling-audit` finding as the skill might phrase it, lifted into the schema:

> *Skill-style:* "SCALE-3: workout + PB write isn't atomic (src/lib/workouts.ts:88) — a crash between them corrupts the PB. High. Fix: use a transaction."

becomes the schema record:

```jsonc
{ "id": "SCALE-003", "lens": "scaling-audit", "pass": "Concurrency & load", "title": "Workout + personal-best write is not atomic",
  "category": "scaling", "location": { "file": "src/lib/workouts.ts", "line": 88, "others": [] },
  "issue": "The workout doc and its derived PB are written in two separate calls with no transaction.",
  "consequence": "A crash or concurrent write between them leaves the PB inconsistent with the workout — silent data corruption.",
  "severity": "high", "confidence_type": "factual",
  "verification": { "status": "unverified", "evidence": "", "verifier_disagreed": false, "note": "" },
  "fix": "Wrap both writes in a single transaction/batch.", "dedup": { "merged_from": [], "also_seen_by_lenses": [] },
  "added_post_verification": false }
```

Note the lifts: 2-digit `SCALE-3` → 3-digit `SCALE-003` (the harness requires ≥3 digits and the prefix must match the lens — see the prefix table in `finding-schema.md`); free-text location → structured `location`; bare "High" → `severity` + an empty `verification` block to be filled in Stage 4; plus `lens`, `category`, `confidence_type`. Whoever appends to the ledger (the subagent if it returns schema JSON, else the orchestrator transforming the subagent's output) does this lift — and because the harness validates every ledger record, a missed lift surfaces as a hard failure, not silent drift.

## Capture each finding in the canonical schema, append to the ledger

Every finding is recorded in the canonical schema defined in `finding-schema.md` — not an ad-hoc restatement of it. At minimum every finding carries: a schema `id` (lens prefix + 3+ digits), the owning `lens`, the `category`, a `title`, the `location` (file + line), the `issue`, the `consequence`, a preliminary `severity`, the `confidence_type` (factual vs reasoning — this matters for how it's later verified), the `fix`, and an empty `verification` block (filled in Stage 4).

As each lens produces findings, **append them verbatim to `raw-findings.jsonl`** (the ledger — see `ledger-and-reconciliation.md`), one JSON object per line. This append happens as the lens runs, not reconstructed afterward from a summary. When a subagent runs a lens, it returns its findings as structured schema objects and the orchestrator appends them to the ledger **without summarising or dropping any** — summarisation on the way into the ledger is exactly how criticals were lost in past runs. Consolidation is Stage 3's job and it records its decisions as dispositions; it never silently shrinks the set.

Keep findings atomic, one issue per finding, so they can be merged, verified, and ranked individually. A finding that bundles three separate issues cannot be cleanly deduplicated or severity-rated.

## Roll-call: confirm every selected lens actually ran

Before leaving Stage 2, do a roll-call against the lens set chosen in Stage 1: for each selected lens, confirm it ran and wrote findings (or explicitly wrote zero with a note on why). A lens that was selected but never ran is a silent coverage hole — the worst kind, because the report implies it was covered. Record per-lens status in the coverage matrix (`coverage-matrix.md`). A lens producing zero findings is a valid, reportable result ("ran, found nothing"); a lens that never ran is a gap that must be named.

## Run report mode throughout
No code changes at this stage (or any stage; fixing is a separate phase). The lenses are run in assessment mode, producing findings, not edits. This keeps the audit non-destructive and lets the user choose what to fix, in what order, after seeing the whole picture.

## What to produce from this stage
The `raw-findings.jsonl` ledger: every finding from every lens, in the canonical schema, one per line, appended as the lenses ran. Each is tagged with its owning lens, cited to file:line, with a preliminary severity, a confidence_type, and a fix. This is the unconsolidated input to Stage 3 (merge) and Stage 4 (verify). It will be longer and rougher than the final report, that is expected; the consolidation stages turn it into the deliverable — operating *on* the ledger and recording dispositions, never silently shrinking it. Plus the coverage matrix roll-call confirming which selected lenses actually ran.

## The honest framing
Run every applicable lens under its own real discipline (read each skill, do not approximate it), in descending order of stakes, citing every finding to file and line and tagging it with the lens that found it. Keep findings atomic. The output here is deliberately raw and over-long, the value the orchestrator adds comes next, in merging the duplicates, verifying the serious ones, and consolidating to the few things that matter. This stage's job is just to find everything, accurately located, so the later stages have clean material to work from.

## Connection to other stages
The file:line citations enable Stage 4's verification. The per-finding lens tags enable Stage 3's cross-lens merge. The atomic findings enable severity calibration and ranking. Run thoroughly here so consolidation has everything it needs.
