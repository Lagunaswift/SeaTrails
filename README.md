

<p align="center">
  <img width="500" height="500" alt="Image" src="https://github.com/user-attachments/assets/f0c271fb-3c54-44de-945b-f32528383f6f" />
</p>

<h1 align="center">seatrial</h1>

An audit skill set for codebases, built on Claude skills.

You build something fast, often with AI. It works, and you have no idea whether
it survives users or someone poking at it. seatrial runs a codebase through
audit lenses (security, privacy, scaling, compliance, accessibility,
AI-specific risks, code quality, dependencies, infrastructure, and more), each
reading for one kind of problem. An
orchestrator collates, de-duplicates, and ranks the findings.

It produces a report; you decide what to fix. It won't change your code or claim
you're "safe". A clean pass means these lenses didn't fire, nothing more.

## The integrity harness

The lenses find things. The harness makes sure the audit didn't cheat.

`audit-check.mjs` is a zero-dependency Node script that sits between the audit
and the delivered report. It assumes the AI will try to produce a clean-looking
result that hides a critical, and fails the build when it does. The report is not
delivered until the harness exits zero.

What it catches:

- **Severity laundering.** Every finding's severity in the final report is
  compared against its severity in the raw ledger. A critical that quietly
  became a low fails the build unless there's a logged disagreement with a
  written reason. Same for merges: a critical absorbed into a low-severity
  survivor inherits the higher severity or the build breaks.
- **Hollow verification.** Marking a finding as "verified" requires quoting the
  actual code: a file:line reference or a backtick code span, minimum twelve
  characters. Empty evidence or "checked the code" as evidence fails the build.
- **Fabricated citations.** Pass `--repo <path>` and every cited file and line
  number is checked against the actual codebase. A finding that references
  `route.ts:142` when the file has 80 lines, or doesn't exist, hard-fails.
- **Lost findings.** Every raw finding must end in exactly one state: reported,
  merged, or dropped. A finding with no disposition is a lost finding. The
  reconciliation arithmetic (raw = reported + merged + dropped) is checked.
- **Dangling attack chains.** If verification drops a finding that an attack
  chain references, the chain is built on a claim the audit no longer stands
  behind. The harness catches it and tells you whether to re-synthesise
  (finding was refuted) or rewrite the reference (finding was merged).
- **Category hiding.** Each lens can only file findings under categories it
  legitimately owns. A security IDOR filed under category "analytics" fails.
- **Coverage gaps.** An audit that examined a fraction of the source files fails
  unless it declares itself partial and names what it skipped. Per-lens coverage
  is gated too: a lens that ran with no row in the coverage matrix, or a matrix
  row for a lens that never ran, fails the build.
- **AI slop in the report.** 50 regex patterns for unambiguous AI writing
  ("delve", "game-changer", "experts agree") hard-fail the build. 10 borderline
  terms warn. Plain deterministic code with no model in the loop.

147 adversarial test cases lock the harness. Each is a way a past audit tried to
look clean while hiding something. They are not happy-path tests; they are
attacks. A few of the actual case names from `run-tests.mjs`:

```
severity laundering: ledger critical, report relabels same id to low
merged critical: a critical merged into a benign (low) survivor
junk evidence: critical verified with evidence "x"
wrong category: a code-audit IDOR hidden under category "analytics"
chain component references a DROPPED (refuted) finding FAILS
```

Weakening the harness flips a test.

## What's in here

**Orchestrator** (`production-audit`). Runs the lenses, merges findings that
share a root cause, ranks by likely damage, and demands evidence before anything
is reported as fact. The harness gates the final output.

**21 audit lenses**, one per concern:

| Lens | Concern |
|---|---|
| code-audit | security, correctness, tests, structure, UI/UX |
| ai-saas-security | prompt injection, cost runaway, token/rate limits |
| scaling-audit | durability, concurrency, cost at scale, observability |
| release-and-ops | secrets, config, CI/CD, rollback, reproducibility |
| data-privacy | data inventory, consent, deletion, retention, breach readiness |
| performance | perceived speed, assets, bundle, caching, runtime |
| accessibility | semantics, keyboard, screen readers, contrast, forms |
| email-deliverability | SPF/DKIM/DMARC, reputation, list hygiene |
| frontend-robustness | async states, double-submit, validation, races |
| internationalisation | text externalisation, locales, timezones, RTL, Unicode |
| seo-discoverability | crawlability, indexing, metadata, structured data |
| mobile-and-responsive | responsive layout, touch, viewport, cross-device |
| analytics-and-instrumentation | metrics, events, funnels, activation/retention |
| anti-slop-writing | user-facing copy quality, AI-slop detection |
| soc2-compliance | trust services criteria, data-protection duties (synthesis) |
| code-quality | magic numbers, loose equality, AI spaghetti, senior-review checklist |
| dependency-audit | lock files, version pinning, supply chain, postinstall scripts |
| infrastructure-config | Docker, Terraform, K8s, CI/CD, nginx, secrets in config |
| adversary-emulation | attack chains from atomic findings (synthesis, runs last) |
| impeccable-audit | design-system coherence, themes, hierarchy, state presentation |
| taste-audit | brand/brief fit and visual direction on marketing, portfolio and editorial surfaces |

**12 craft skills** for the fix phase: refactoring, testing-strategy,
debugging-methodology, data-modelling, error-handling-patterns,
api-and-interface-design, state-management, frontend-design, ux-ui-patterns,
stripe-best-practices, saas-production-security, ui-ux-pro-max.

34 skills total (21 lenses + 1 orchestrator + 12 craft).

`ui-ux-pro-max` is a data-driven design intelligence toolkit with searchable
CSV databases (161 color palettes, 57 font pairings, 67+ UI styles, 25 chart
types, 99 UX guidelines) and a BM25 search engine that generates complete
design systems from product-type queries. Requires Python 3.

## Design audits

`impeccable-audit` and `taste-audit` are self-contained, read-only adaptations of the Impeccable audit/critique methods and Taste Skill's context-first design review. They preserve existing brand rules and use the same ledger, verification and deduplication as the other lenses. Their intake notes identify the reviewed upstream revisions; no upstream CLI, detector, hook or runtime is installed.

Ask for `production-audit` as usual; it selects the relevant design lenses for the surfaces present. Or request an `impeccable audit` / `taste audit` on a named route. Taste is for marketing, portfolio and editorial surfaces, not operational dashboards. Cosmetic findings cap at medium; genuine task blockers keep their functional severity. Without browser evidence, the report explicitly limits its visual claims.

## Website readiness

For websites and web applications, production-audit selects a [website-readiness profile](skills/production-audit/references/website-readiness-profile.md). It routes twelve topics through existing lenses and records decisions for twenty-four optional features. The [coverage map](skills/production-audit/references/website-readiness-coverage.md) accounts for all 119 controls in the supplied website brief without creating a second finding system.

The profile covers real journeys, navigation and contact actions, truthful commercial information, privacy/measurement and contextual design. Existing security, accessibility, performance and operational checks remain with their native owners. Familiar fonts, gradients, cards and eyebrows receive a keep/rewrite/restyle/remove decision based on their purpose. Missing optional features do not become defects automatically.

Ask Claude or Codex:

> Read `.claude/skills/production-audit/SKILL.md` and run a production audit with the website-readiness profile. Check existing coverage before proposing additions. Preserve useful design conventions and approved brand choices. Record evidence, optional-feature decisions and gaps, then deliver the gated report with fixes ordered by risk and dependency. Keep this run in report mode.

The gate checks that the declared profile has complete, consistent coverage records and surviving finding references. Browser/provider evidence limits remain visible. It does not prove visual quality or that every defect was detected.

## Machine-readable gate

```bash
node skills/production-audit/scripts/audit-check.mjs <audit-dir> --repo <target-repo> --json
```

`--json` emits one result object with `format_version`, `ok`, `exit_code`, `failures`, `warnings` and counts when validation ran. Exit codes stay 0 (gate passed), 1 (gate failed), 2 (bad command arguments). Text output remains the default. A supplied invalid repository path fails; evidence checking is never silently skipped. Evidence paths must stay inside the repository, and secondary/refutation citations are checked too.

## How it works

Point it at a repo. Each lens reads the code for its concern and records findings
with file/line evidence. No evidence, no finding. The orchestrator collapses
duplicates to single root causes (the same bug caught by three lenses is one
problem, not three) and ranks by likely damage rather than by how alarming the
category sounds.

Severity adjusts to the data the app handles. An auth gap on ordinary data and
the same gap on health or financial data are not the same finding.

## Add or extend

Each lens and check follows a fixed contract. See [CONTRIBUTING.md](CONTRIBUTING.md).
Adding a check is adding one file. Fork, write it, open a PR. If something bit
you that isn't covered, it should be.

## What this isn't

A first pass that catches known patterns. It raises the floor, it doesn't
remove the ceiling. It doesn't understand your app's business logic: the
ownership check that's right on nine routes and missing on the tenth, or a
deletion that doesn't delete. Those need a human reading the code with full
context. Run this first; it clears the common ground so the human review
can focus on the hard stuff.

## Licence

MIT.

## Evidence and detection measurement

New reports use captured source deliveries and exact, finding-bound review records. The renderer invokes validation before emitting the report. See [the evidence protocol](skills/production-audit/references/evidence-assurance.md) for controller isolation, capture, review and delivery commands. Legacy reports remain explicitly labelled as self-reported.

The detection benchmark exports a label-free worker packet and scores precision, recall and false-positive rate separately from integrity regression tests. Its initial eight synthetic cases cover four security weaknesses; they do not establish production accuracy or coverage of every lens.

The first fresh-agent security calibration found 4/4 seeded defects with 0 false positives across four fixed counterparts. The worker was given no evaluator labels, with prompt-level isolation only. Model version was unavailable. [Raw results and limitations](skills/production-audit/scripts/benchmark/baseline-2026-10-16.json) are committed so this limited result can be rescored.
