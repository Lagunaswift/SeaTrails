---
name: harness-dev
description: "Use this skill before touching skills/production-audit/scripts/ — audit-check.mjs (the integrity gate), run-tests.mjs (the adversarial regression suite), or render-report.mjs (the renderer). Trigger on 'change the harness', 'add a check to audit-check', 'harness failure', 'add a slop pattern', 'the gate is wrong'. It encodes the attack-first discipline: every behaviour change starts as a bypass case in the test suite, and weakening the harness flips a test."
---

# Changing the integrity harness

The harness is the audit's trust anchor: `README.md` publicly claims "Weakening the harness flips a test." Every change here either honours that claim or breaks it. The failure mode this skill exists to prevent: an agent hits a hard failure while working on something else and "fixes" it by loosening the check that fired. That is not a fix; it is the exact bypass the harness was built to stop.

## The iron rules

1. **Never weaken a check to make a failure go away.** If the harness fails an audit, the audit is wrong until proven otherwise. If you believe the *check* is wrong, prove it: write the legitimate input as a test case, show which existing case documents the behaviour, and argue the change in the PR — explicitly, as a behaviour change.
2. **Attack-first.** Every new or changed behaviour starts as a case in `run-tests.mjs`:
   - write the bypass (a bad audit the harness currently, wrongly, passes) as an `expect: 'fail'` case;
   - run the suite and watch that case fail (the harness passed what it shouldn't — you've proven the gap exists);
   - close the gap in `audit-check.mjs`, minimally;
   - run the suite: everything green. The bypass is now locked forever.
3. **Deleting or loosening an existing case is treated as an attempted bypass** unless the PR argues otherwise in so many words. Cases are a catalogue of real, historical cheats.
4. **Zero dependencies, Node 16+.** No imports beyond `node:` builtins. The scripts run bare in any target repo (ADR 0002). No package.json, ever.
5. **Pair every FAIL with its nearest legitimate PASS.** The boundary cases are the suite's best content — e.g. design-aesthetic at high fails *and* a high interaction failure via the UX lens passes. A check without its boundary case will over-fire one day and someone will "fix" it by weakening it.

## Map of audit-check.mjs

- **Registration constants** (top of file): `LENSES`, `CATEGORIES`, `SEVERITIES`, `CONFIDENCE`, `VSTATUS`, `LENS_CATEGORIES` (category ownership), `LENS_PREFIXES` (prefix ownership). Adding a lens edits these — see `.claude/skills/add-lens/`.
- **Shape regexes**: `ID_RE` (`/^[A-Z0-9]+-\d{3,}$/`, validates ids), `EVIDENCE_LOC` + `EVIDENCE_CODE` + `hasRealEvidence` (the ≥12-char verified-evidence standard), `FINDING_ID_IN_TEXT` (extracts finding ids from chain *prose*). **`FINDING_ID_IN_TEXT` must extract every *registered* prefix shape that `ID_RE` validates** — the historical bug here was digit-bearing prefixes (`A11Y-001`, `SOC2-001`, `I18N-001`) validating fine in id fields but evading the prose scan. There is a test case locking this now; keep it in mind for any prefix-shape change.
- **Check functions**, one invariant each: `checkSchema`, `checkSeverityVerification`, `checkPostVerification`, `checkReconciliation`, `checkSeverityLaundering`, `checkChains` (components, prose refs, severity_basis, root_cause), `checkRollCall`, `checkComplianceDuty` (+ `REGULATED_CLASS_RE`), `checkCoverage`, `checkRemediationOrder`, `checkEvidenceFiles` (`--repo` mode), `checkProse` (+ `SLOP_HARD`/`SLOP_WARN`). Note the invariant numbering in comments is non-monotonic in source order (8 sits before 7); call order at the bottom of the file is what runs.
- **fail() vs warn()**: `fail` blocks (exit 1), `warn` prints. Promoting a warn to a fail is a behaviour change — attack-first, and update the case that documented it as a warn (coverage went through exactly this promotion).
- **Exit codes**: 0 = all hard invariants hold; 1 = ≥1 failure; 2 = bad input. Scripts and CI depend on these — never repurpose them.

## Map of run-tests.mjs

Each case is `{ name, expect: 'pass' | 'fail', ledger: [findings...], report: {...} }` (or `rawReport` for malformed-JSON cases). Builders: `finding(overrides)` — a minimal valid finding (SEC-001, code-audit, security, medium, unverified) — and `report(overrides)`; `GOOD_EVIDENCE` is the canonical passing evidence string. The runner writes each case to a temp dir, spawns the real harness (`spawnSync`), and compares exit codes. No mocks: the suite tests the shipped artifact.

Name cases the house way: `<attack>: <what the bad audit did> FAILS` / `<legitimate thing> PASSES`. The name is documentation — a reader should understand the bypass from the name alone.

## Slop-pattern changes

`SLOP_HARD` (hard-fail, unambiguous tells) and `SLOP_WARN` (borderline, warn only) in `audit-check.mjs`. To add a pattern: decide the tier honestly (a word with legitimate technical uses goes in WARN — "robust" is sometimes just the word), add the regex with its `why` string, and add a regression case for HARD additions. Keep the README's counts in sync if it states them.

## render-report.mjs changes

The renderer computes everything from `report.json` — keep it that way: no new hand-written inputs, no reading the ledger or repo, nothing that lets prose diverge from gated data (ADR 0013). Structure changes must be mirrored in `references/report-format.md` (the contract doc; the renderer governs on disagreement, so update the doc, not just the code).

## Validate

```bash
node skills/production-audit/scripts/run-tests.mjs      # every case, expected exit codes, 0 failed
node .claude/skills/release-check/scripts/check-consistency.mjs
```

If your change added an invariant, ask: which docs state this rule? (`finding-schema.md`, `ledger-and-reconciliation.md`, `verification-and-severity.md`, `report-format.md`, the ADRs.) Update them in the same commit — the harness enforces the contract; the references *are* the contract.

## Worked example (from this repo's history)

The chain-prose scanner used `[A-Z]{2,6}` and silently skipped digit-bearing prefixes: a chain step citing a dropped `A11Y-001` sailed through the dangling-reference check. The fix, in order: a new case — *"chain step text references a DROPPED A11Y finding (digit-bearing prefix) FAILS"* — run, observed wrongly passing (proving the gap), then `FINDING_ID_IN_TEXT` broadened to `[A-Z][A-Z0-9]{1,5}`, suite green, case locked. That is the whole discipline in one paragraph.
