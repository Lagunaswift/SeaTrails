# Stage 4: Adversarial verification and severity calibration

A finding is a claim, and claims from a fast, broad sweep across many lenses include false positives, over-reactions, and miscalibrated severities. Before anything reaches the report, re-examine the serious findings against the actual code as an adversary trying to *disprove* them. This is the step that turns an alarmist pile into a trustworthy report, and it is exactly what the reference audit did (38 critical/high findings verified, 5 dropped as false positives, several downgraded).

## The severity-verification consistency rule

A finding's severity cannot exceed what its verification note supports. This is a hard constraint, not a guideline:
- If the verification note says "needs direct code verification," "pending verification," "keeping as [severity] pending confirmation," or any equivalent admission that the code was not actually read, the finding **cannot** sit at critical or high. It must either be verified (read the code, close the gap, then rate it) or capped at medium with an explicit "unverified — severity capped" note until someone reads the code.
- A finding that carries a high or critical severity while its own verification text admits non-verification is the single most corrosive pattern in an audit report, because it teaches the reader to distrust the severity labels on findings that *were* verified. One "high (but I didn't check)" poisons the credibility of every other "high (confirmed)."
- The test is simple: does the verification note contain a concrete statement about what the code actually does at the cited location? If yes, the severity can reflect what was found. If the note contains hedging language ("may," "could," "if X then this is a false positive," "needs checking"), the severity must reflect that uncertainty — cap it or park it.

This rule applies regardless of how plausible the finding is. A plausible-but-unverified finding at medium with an honest "unverified" tag is more useful than the same finding at critical with a verification note that contradicts the rating. The reader can still prioritise checking it; what they can't recover from is a report that asserts rigour it didn't apply.

## Record the verdict in the schema — this rule is now machine-enforced

The consistency rule above used to be prose an agent could agree with and then violate. It is now a hard check. Every finding carries a `verification` block (see `finding-schema.md`):

```jsonc
"verification": {
  "status": "verified",          // unverified | verified | refuted | capped
  "evidence": "route.ts:31 — `const uid = searchParams.get('uid')`, no ownership guard in handler",
  "verifier_disagreed": true,    // did you change the lens's severity/reachability?
  "note": "downgraded from critical: the global $50/day ceiling bounds the cost path"
}
```

The mechanical contract, enforced by `scripts/audit-check.mjs`:
- **`status: "verified"`** requires a non-empty `evidence` field — a quote of the code you actually read at the cited location. "Verified" with empty evidence is a hard failure. You cannot mark something verified without showing what you read.
- **Any finding at `critical` or `high` must be `verified` or `capped`.** A critical/high left `unverified` is a hard failure — the harness exits non-zero and the audit does not ship. This is the AI-02 pattern ("keeping as high pending verification") made impossible: the build breaks instead of the reader being misled.
- **`capped`** is the honest escape hatch: you could not verify it in the time available, so you capped it at medium and said why in `note`. A capped finding can sit in the report at medium; it can never sit at high/critical.
- **`refuted`** means verification disproved it — it moves to `report.dropped` with a reason, not into the findings list.

Run the harness before delivering. If it fails on an unverified critical, you have two honest options and no third: verify it (read the code, fill `evidence`), or cap it (drop to medium, fill `note`). There is no "leave it at high and hope."

## Reasoning findings get extra scrutiny

A finding's `confidence_type` (see `finding-schema.md`) changes how you verify it:
- **`factual`** findings (locational: "no auth check on this route," "no `.limit()` on this query") — verify the citation is correct. If the cited code says what the finding says, it stands.
- **`reasoning`** findings (consequence chains: "because X, an attacker can achieve Y") — the factual base may be solid while the inferred consequence is wrong. Verify by **attacking the inference**: is the path actually reachable in sequence? Does a constraint elsewhere bound the consequence? A reasoning finding at critical/high that you cannot fully trace through the code must be capped at medium with a note that it needs human confirmation — these are exactly the findings a human should confirm against the code before acting, and the report must say so. Attack chains (`category: attack-path`) are reasoning findings by nature; hold them to this bar.

### The reasoning backlog is not a finding count to wave around

On a broad sweep, the *majority* of findings are typically reasoning-typed mediums and lows — inferences the harness does not force you to verify (only crit/high must be verified or capped). They are real candidate issues worth a backlog, but they are **not confirmed defects**, and the report must not let the raw total imply they are. A run with 290 findings where 194 are reasoning-typed has not found 290 confirmed problems; it has found a few dozen verified gating defects and a long backlog of inferences to confirm. The headline must reflect that split (see "lead with the gating set" in `report-format.md`): lead with the verified critical/high count — the set that actually gates shipping — and present the reasoning mediums/lows honestly as a backlog with its confidence composition stated, never as a single inflated "N findings" number. Posting the raw total as if every entry were a confirmed defect is the inflated-count failure; hold the line against it here, where the confidence types are assigned.

## Verify every critical and high finding

For each finding rated critical or high (the ones that will drive action), go back to the cited code and test the claim adversarially:
- **Is it real?** Does the code actually do what the finding says, or did the lens misread it? Re-read the actual lines, follow the control flow. Many plausible findings dissolve on a close second look (a guard exists elsewhere; the dangerous path is unreachable; the handler re-validates downstream).
- **Is it reachable?** A vulnerability behind a condition that can never be true, or in dead code, is not a live issue. Confirm an attacker or a user can actually reach the path.
- **What is the *exact* achievable consequence?** This is the check most over-readings fail. Do not accept the finding's stated impact; derive the worst outcome actually reachable, by reading every constraint the code already places on the path. Read the conditions, allowlists, value checks, and guards in the cited code and state precisely what they permit and forbid, then describe the consequence in those exact terms. A finding that says "the user can do Y" is only as good as the code path that lets them; if the code constrains the action, the real consequence is the constrained one, not the worst one imaginable.
- **Is the severity right?** Does the real consequence (as just derived) match the assigned severity, once you account for mitigations already present (a cap, a sibling check, a value constraint, a bounded blast radius)?

### The over-read pattern to guard against
The most common false-or-inflated finding takes the form "the client can write field X, therefore they can achieve worst-case Y," without checking what the code restricts X to. The reasoning skips the constraint. Always close that gap: find where X is validated and read what values/ranges it actually allows.

Worked example (a real dogfood miss): a finding claimed "any user can grant themselves permanent premium" because a Firestore rule let the owner write `subscriptionStatus`. Reading the rule, it permitted the write only when `subscriptionStatus == 'trial'`, a literal value constraint. So the achievable consequence was not "premium" but "set the trial tier," and on closer reading the real, smaller hole was an *unconstrained `trialEndDate`* (no cap, no exists-check) allowing an over-long or repeatable trial. The correct finding is therefore "user can set an arbitrarily long or repeatable trial" at medium/high, not "user can grant themselves premium" at critical. The inflation came entirely from not reading the `== 'trial'` constraint sitting in the same rule. Catching this is the whole point of the stage: read the constraint, state the exact reachable consequence, rate that.

Verify mediums too where time allows, but criticals and highs are the priority, they are what the report leads with and what the user will act on, so they must be right.

## Drop, downgrade, upgrade

The verification has three honest outcomes:
- **Drop:** the finding is a false positive, the claimed flaw is not real or not reachable. Remove it. (Optionally note in the report that N findings were dropped in verification, as the reference audit does, it signals rigour.)
- **Downgrade:** the issue is real but less severe than first rated, because a mitigation bounds it (rate limit, spend ceiling, sibling guard, narrow window). Lower the severity to match the real-world impact.
- **Upgrade (rarer):** verification reveals the issue is worse than first rated (a wider blast radius, a second consequence the lens missed, often surfacing from the Stage 3 merge where combined consequences raise severity).

Record the calibration: when the verifier disagrees with the original lens's severity, show the calibrated rating and, briefly, why (e.g. "verifier: medium, bounded by the $50/day global ceiling"). This transparency is part of the report's credibility, the reader sees the severity was tested, not just asserted.

**Verification is mandatory and must be visible.** A run that does not show its verification has not earned trust, the reader cannot tell whether the criticals were re-checked or just asserted. Every audit must state, in the method line, that critical/high findings were adversarially verified and how many were dropped or downgraded as a result (even if the answer is "none dropped"). If a finding was checked and stood, that is a result worth the line; if the stage was skipped, the report must say so plainly rather than implying a rigour it does not have. A report whose criticals carry no evidence of having been re-read against the code should be treated as a draft, not a finished audit.

## The severity scale

A consistent scale, applied by real-world impact:
- **Critical:** direct, reachable path to serious harm, a breach, data loss, account takeover, a legal violation, money loss, or (for safety-relevant apps) a failure of a safety function. Fix before shipping / immediately.
- **High:** a serious issue that is somewhat bounded, conditional, or not quite catastrophic, but clearly must be fixed soon.
- **Medium:** a real problem worth fixing, but limited in impact, likelihood, or scope.
- **Low / hygiene:** minor issues, defence-in-depth, code health, best-practice gaps.

Calibrate by actual impact in this app, not by category in the abstract. The same class of bug can be critical in one app and low in another depending on what it touches and what mitigates it. A privacy gap on health data is more severe than the same gap on a display preference; an unbounded cost path with a global ceiling is less severe than one without.

## Re-verify chains against surviving constituents after reconciliation

When this stage drops or downgrades a finding that an adversary-emulation chain references, the chain is stale:
- A **refuted** constituent invalidates the chain link it anchored — the chain must be re-synthesised or downgraded.
- A **downgraded** constituent may reduce the chain's achievable impact — re-evaluate the chain's severity against its surviving constituents' actual (calibrated) severities.
- A **merged** constituent survives under a new id — rewrite the chain reference to the surviving parent, but re-check whether the merge changed anything material (e.g. the merged finding's severity or scope).

The practical mechanism: adversary-emulation chain synthesis runs *after* this verification stage completes, consuming only the reconciled, verified finding set (see `ledger-and-reconciliation.md`). Chains are thus never built on claims the verifier has disproved. If chains were provisionally written during Stage 2, they must be re-validated here; the harness blocks any chain whose `component_findings` id is absent from the reconciled set.

For each chain, recompute severity from its surviving constituents only. A chain whose severity was driven by a now-absent constituent must be downgraded — it is not "guaranteed total infrastructure compromise" if the path-traversal link was refuted; it is "unauthenticated access of unknown blast radius." State the `severity_basis` (the constituent ids the severity rests on) in the chain block so the recompute is mechanical and auditable.

## What to produce from this stage
The merged findings, now verified: false positives dropped, severities calibrated to real impact, with the verifier's rating shown where it differs from the original. Each surviving finding is now something you have personally re-checked against the code and stand behind. This verified, calibrated set is what the report is built from.

**This set is the only source for the final report.** No findings may be added to the report after this stage completes. If a later re-read of the codebase or subagent output surfaces something new, it either goes back through verification (re-run the stage with the new findings included, set its `added_post_verification` flag, and re-verify) or it is reported in a clearly separated "unverified additions" section that the method line does not claim verification for. The failure mode this prevents: the orchestrator runs verification inside a workflow, then rebuilds the report from a different, larger finding set discovered by re-reading raw subagent outputs, and presents the result under the same "all findings verified" method line. That produces a report that asserts a rigour the process did not apply to every finding in it. The harness enforces this too: an `added_post_verification` finding at critical/high that was not re-verified is a hard failure.

**Run the harness as the exit gate.** Verification is not done when you believe it is done; it is done when `node .claude/skills/production-audit/scripts/audit-check.mjs <audit-dir>` exits zero against the ledger and report. The harness mechanically confirms every critical/high is verified-with-evidence or capped, that no raw finding was lost, and that the counts reconcile (see `ledger-and-reconciliation.md`). If it exits non-zero, the audit is not finished — resolve what it names and re-run.

## The honest framing
Treat every serious finding as a claim to disprove, not confirm: go back to the actual code, check it is real, reachable, and correctly rated, and drop, downgrade, or upgrade accordingly. Account for mitigations already in the code so severities reflect real-world impact, not worst-case theory. Show the calibration where it differs from the original lens. This is what separates a trustworthy audit from an alarmist one, the reader can act on a report whose serious findings have each survived an adversarial second look, whereas an unverified pile trains them to distrust the whole thing after the first false positive.

## Connection to other stages
Operates on Stage 3's merged findings (whose combined consequences may have already moved severity). Produces the verified, ranked set that Stage 5 formats. The "dropped N false positives" and the inline calibrated ratings both surface in the report (report-format.md) as signals of rigour, and the verification's limits feed the "what could not be assessed" section.
