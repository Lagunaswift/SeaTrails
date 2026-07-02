# Operator's guide — running seatrial well

How to run the full audit suite against a target repo with a capable agent (Claude Opus 4.8 or better) and get the trustworthy-report behaviour the architecture was built for. The orchestrator's own docs (`skills/production-audit/SKILL.md` + `references/`) are the contract; this guide is the operational layer around them: installation, subagent orchestration, budgeting, and what to do when the gate fails.

## 1. Install into the target repo

The suite is drop-in: copy the skills tree into the target repo's `.claude/skills/`.

```bash
# from the seatrial repo root
cp -R skills/. /path/to/target-repo/.claude/skills/
```

Every internal path in the suite (`node .claude/skills/production-audit/scripts/...`, registry skill paths) assumes exactly this location. Nothing needs installing beyond the copy: the gate/render scripts are zero-dependency Node 16+, and `ui-ux-pro-max` (only needed in the fix phase) wants a stock Python 3.

In the **target** repo, make sure audit artifacts can't be committed: seatrial's own `.gitignore` lines are the model (`*report*.json`, `*report*.md`, the audit dir). The report names real findings about a live app — treat it like a pentest report.

## 2. Session setup

- Create an audit directory (e.g. `audit/`) in the target repo for `raw-findings.jsonl` and `report.json`.
- Invoke the `production-audit` skill ("run a full production audit of this repo"). The agent walks Stages 0–5; there is deliberately no end-to-end command.
- Keep the target repo checked out locally — the gate's `--repo` flag validates every cited file:line against it, and you always want that on.

## 3. Orchestrating the lenses with subagents

Stage 0 (stack profile — including `data_classes`, which arms the compliance gate) and Stage 1 (lens selection, stated scope) are cheap: do them in the main context, and record them in `report.json` immediately.

Stage 2 is the bulk of the run and is where a strong operator model pays for itself. The pattern that works:

- **One subagent per lens**, run in parallel batches by registry priority (priority 1 first: code-audit, ai-saas-security; then 2: scaling, ops, privacy, dependency, infrastructure; then 3–5). Parallel atomic lenses are safe — they only append findings; nothing reconciles until Stage 3.
- **The subagent prompt is scripted** by `references/running-the-lenses.md` §5 and it is not optional. Each subagent must be told: read `.claude/skills/<lens>/SKILL.md` and its references first; follow its passes adapted to the stack profile (pass the profile in); emit findings in the canonical schema with the lens's prefix; the schema **overrides** the backing skill's own output-format prose. A subagent that skips the skill produces ad-hoc findings — the quality difference is the entire point of the suite.
- **Append, never summarise.** Each finding goes into `raw-findings.jsonl` as discovered, verbatim, in schema shape. The historical failure this prevents: a run that compressed ~60 findings to ~45 in a summarising step and lost criticals. Have subagents return their findings as JSONL and append mechanically.
- **Ids must be unique across the run** — prefixes keep lenses disjoint; let each subagent number from 001 within its prefix.
- **Synthesis ordering is hard:** `soc2-compliance` runs after the atomic lenses (it reads the ledger). `adversary-emulation` runs **only after Stage 3–4 reconciliation is frozen** — hand it the reconciled, verified finding set, never the raw ledger. The harness hard-fails chains that reference dropped/merged ids, so running it early wastes the whole pass.

Stage 3 (merge) and Stage 4 (adversarial verification) want fresh eyes: a verifier subagent per critical/high finding, prompted to *disprove* it against the actual code, returning the structured verdict (status + evidence quote + note). Reasoning-typed findings get their inference attacked, not just their citation. Record verdicts into the findings; move refuted ones to `dropped` with reasons.

## 4. Budgeting and staging — decide before you start

A full sweep on a real codebase rarely fits one session. The orchestrator's rule: **decide up front** whether this is a one-session or staged run, and if staged, run highest-stakes lenses first (security → AI security → correctness → scaling/ops/privacy) and deliver an explicit partial report — `scope.partial: true`, deferred lenses named, the PARTIAL stamp in the method line. The gate enforces the honesty; you supply the plan.

Resuming: re-state scope, list what already ran and where that report is, run the remainder, reconcile against the same ledger. The two reports together cover the set without re-work.

Cost intuition for a capable model: the lens sweep dominates (each subagent reads a large slice of the repo); verification is a set of small, focused reads; merge/report are cheap. If the budget is tight, cut lens *count* by priority, never lens *depth* — a shallow pass that misses things but reports "covered" is the failure mode; a deferred lens honestly named is fine.

## 5. Gate, render, deliver

```bash
node .claude/skills/production-audit/scripts/audit-check.mjs audit/ --repo .
node .claude/skills/production-audit/scripts/render-report.mjs audit/ > audit/report.md
```

Gate first, render second, always with `--repo`. Never hand-write or hand-edit `report.md` — every count in it is computed from the gated `report.json` so the prose cannot diverge. The report is not delivered until the gate exits 0.

### When the gate fails

The failure messages name the invariant. The common ones:

| Failure says | It means | The fix |
|---|---|---|
| unverified critical/high | Stage 4 didn't reach it | verify it against the code, or cap it at medium with a note |
| lost finding / reconciliation mismatch | a raw id has no disposition | decide: reported, merged (record in survivor's `merged_from`), or dropped (with reason) |
| severity laundering | report severity < ledger severity, silently | either restore the severity or record the calibration (`verifier_disagreed: true` + note) |
| junk evidence | "verified" without quoted code | quote the actual code: file:line or a backtick span, ≥12 chars |
| category not plausible for lens | mis-binned finding | file it under a category the lens owns (see `LENS_CATEGORIES`) |
| chain references dropped/merged id | chain built pre-reconciliation | re-synthesise (refute-orphan) or rewrite to the survivor id (merge-orphan) — the message says which |
| compliance duty | regulated `data_classes` with no compliance coverage | run the soc2-compliance duty pass, or record a `category: compliance` finding |
| coverage | files examined < total without `scope.partial` | declare the partial honestly, and name the gap in "what could not be assessed" |
| slop prose | a banned phrase in the deliverable | rewrite the sentence; the message quotes the match |

The one thing never to do: weaken the check that fired. In this repo that flips a regression test; in a target repo it silently unmakes the guarantee the report ships under.

## 6. What a good run looks like

- Stack profile recorded, `data_classes` honestly populated.
- Scope states which lenses ran, which were deferred, which were excluded as not-applicable and why. Nothing padded: a static site doesn't get a scaling pass to look thorough.
- Ledger grows during Stage 2, monotonically; nothing edited in place.
- Every critical/high carries a verdict with quoted evidence; some findings got dropped (an audit that drops nothing verified nothing).
- Gate exits 0 with `--repo`; report leads with the gating set, and the remediation order reads like an engineer's plan (damage-rate-per-effort), not a severity sort.
- The fix phase, if requested, is a separate engagement under the craft skills (`testing-strategy` first for a safety net, then `refactoring`, `debugging-methodology`, and the design skills) — never mixed into the audit session.

## 7. Running a single lens

For one concern, skip the orchestrator and use the specialist skill directly (`code-audit` for security-only, etc.). Most lenses double as standalone advisory skills and produce a prose report in that mode — the canonical schema and the gate only apply under `production-audit`. If you want gated output for a single lens, run the orchestrator with a one-lens scope; the machinery works the same.
