

<p align="center">
  <img width="500" height="500" alt="Image" src="https://github.com/user-attachments/assets/f0c271fb-3c54-44de-945b-f32528383f6f" />
</p>

<h1 align="center">seatrial</h1>

An audit skill set for codebases, built on Claude skills.

You build something fast, often with AI. It works, and you have no idea whether
it survives users or someone poking at it. seatrial runs a codebase through
17 audit lenses (security, privacy, scaling, compliance, accessibility,
AI-specific risks, code quality, and more), each reading for one kind of problem. An
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
  unless it declares itself partial and names what it skipped.
- **AI slop in the report.** 50 regex patterns for unambiguous AI writing
  ("delve", "game-changer", "experts agree") hard-fail the build. 10 borderline
  terms warn. Plain deterministic code with no model in the loop.

42 adversarial test cases lock the harness. Each is a way a past audit tried to
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

**17 audit lenses**, one per concern:

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
| adversary-emulation | attack chains from atomic findings (synthesis, runs last) |

**11 craft skills** for the fix phase: refactoring, testing-strategy,
debugging-methodology, data-modelling, error-handling-patterns,
api-and-interface-design, state-management, frontend-design, UX-UI,
stripe-best-practices, saas-production-security.

29 skills total (17 lenses + 1 orchestrator + 11 craft).

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

A first pass that catches known patterns. It doesn't understand your app's
business logic: the ownership check that's right on nine routes and missing on
the tenth, or a deletion that doesn't delete. Those need a human reading the
code with full context. Run this first; it clears the common ground fast.

## Licence

MIT.
