# Production-Audit — Architecture & Lens Map

How the production-audit orchestrator is wired: the pipeline, every lens, the machinery that makes the output trustworthy, and how all 29 skills in `.claude/skills/` relate to it.

---

## The pipeline (6 stages + gate + render)

```
                          ┌─────────────────────────────────────────────────────────┐
                          │                  PRODUCTION-AUDIT (orchestrator)          │
                          └─────────────────────────────────────────────────────────┘

  Stage 0          Stage 1            Stage 2                 Stage 3      Stage 4        Stage 5
  ───────          ───────            ───────                 ───────      ───────        ───────
 ┌─────────┐     ┌──────────┐     ┌──────────────────┐     ┌─────────┐  ┌──────────┐  ┌──────────┐
 │ DETECT  │ ──> │  SCOPE   │ ──> │   RUN LENSES     │ ──> │ MERGE & │->│ VERIFY   │->│ REPORT   │
 │ stack   │     │ select   │     │  atomic → synth  │     │ dedup   │  │ (adversa-│  │ json→md  │
 │         │     │ lenses   │     │  → ledger        │     │         │  │ rial)    │  │          │
 └─────────┘     └──────────┘     └──────────────────┘     └─────────┘  └──────────┘  └──────────┘
  stack-          scope-and-       running-the-lenses        merge-and-   verification  report-format
  adaptation      lens-selection                             deduplicate  -and-severity
      │                                  │                        │            │            │
      └── records stack_profile          └── appends every        └── records  └── fills    │
          → drives lens choice               finding to               merged_from  verdict   │
            & phrasing                        raw-findings.jsonl       (no loss)    + caps    │
                                              (canonical schema)                             │
                                                                                             ▼
                                                              ┌────────────────────────────────────┐
                                                              │  GATE   node audit-check.mjs <dir>   │  must exit 0
                                                              │  ─────  raw = reported+merged+dropped│
                                                              │         crit/high verified-or-capped │
                                                              │         data-class duty enforced     │
                                                              │         regression-locked suite      │
                                                              └────────────────────────────────────┘
                                                                                 │ exit 0
                                                                                 ▼
                                                              ┌────────────────────────────────────┐
                                                              │ RENDER  node render-report.mjs <dir> │  → report.md
                                                              │ ──────  counts computed FROM json    │
                                                              │         (prose can't diverge)        │
                                                              └────────────────────────────────────┘
```

**Honest boundary:** Stages 0–5 are executed by an *agent* (discipline). The two scripts machine-*gate* and machine-*render* the result — they don't run the audit. There is no single end-to-end command; the agent walks the stages, the scripts validate and render the artifacts it writes.

---

## The lenses (17)

Atomic lenses scan the code; the two **synthesis** lenses run last and consume the ledger of atomic findings.

| # | Lens | Prefix | Owns | Type |
|---|------|--------|------|------|
| 1 | **code-audit** | SEC/COR/DBG/TST/STR/UIUX | Security, correctness, debug-probe, tests, structure, UI/UX (itself a 6-pass orchestrator) | atomic · pri 1 |
| 2 | **ai-saas-security** | AI | Prompt injection, AI cost/token runaway, rate limits, output safety | atomic · pri 1 |
| 3 | **scaling-audit** | SCALE | Durability/backups, SPOFs, data-level concurrency, resilience, cost-at-scale, observability | atomic · pri 2 |
| 4 | **release-and-ops** | OPS | Secrets, config/env parity, CI/CD, deploy safety, rollback, cron | atomic · pri 2 |
| 5 | **data-privacy** | PRIV | GDPR: consent, erasure, export, retention, third-party sharing, PII in logs | atomic · pri 2 (1 for health data) |
| 6 | **frontend-robustness** | FE | Four async states, form/double-submit, validation, slow/failed requests, defensive rendering | atomic · pri 3 |
| 7 | **performance** | PERF | Perceived speed, bundle, rendering path, images, caching, runtime | atomic · pri 4 |
| 8 | **accessibility** | A11Y | Semantic structure, keyboard/focus, screen readers, contrast, forms, motion (WCAG 2.1 AA) | atomic · pri 4 |
| 9 | **mobile-and-responsive** | MOB | Viewport, breakpoints, touch targets, mobile input, PWA manifest | atomic · pri 4 |
| 10 | **email-deliverability** | EMAIL | SPF/DKIM/DMARC, reputation, templates, stream separation, unsubscribe | atomic · pri 5 |
| 11 | **seo-discoverability** | SEO | Crawlability, indexing/canonical, metadata, structured data, social sharing | atomic · pri 5 |
| 12 | **analytics-and-instrumentation** | ANL | Meaningful events, funnels, activation/retention, consent-gated tracking | atomic · pri 5 |
| 13 | **internationalisation** | I18N | Text externalisation, locale formatting, timezones, RTL, Unicode | atomic · pri 5 |
| 14 | **soc2-compliance** | SOC2 | Maps Trust Services Criteria → code evidence; flags control gaps; data-protection duty (DPIA/Art.9/HIPAA/…) by data class | **synthesis** · pri 6 |
| 15 | **adversary-emulation** | CHAIN | Chains findings into MITRE ATT&CK attack paths; detection gaps; red/blue/purple | **synthesis** · pri 7 (last) |
| 16 | **anti-slop-writing** | COPY | Quality of user-facing copy (landing/onboarding/microcopy/email) — AI-slop writing tells. Capped at medium → `content` | atomic · pri 5 |
| 17 | **code-quality** | QUAL | Senior-review checklist: magic numbers, loose equality, empty catches, naming, async anti-patterns, boundary hygiene, AI-code tells | atomic · pri 3 |

**Conditional deepener:** when Stage 0 detects **Stripe**, code-audit's Security/Correctness passes also apply **`stripe-best-practices`** (webhook signatures, idempotency, key handling, subscription-state). Findings carry `SEC`/`COR` prefixes, tagged `also_seen_by_lenses:["stripe-best-practices"]`.

**Compliance has two triggers (Lens 14):** SOC 2 *certification readiness* is keyed off a stated goal and is deferrable; the *data-protection duty* (an impact assessment + heightened lawful basis + disposal duties, under whichever framework governs the data — GDPR, HIPAA, PCI-DSS, COPPA, CCPA/CPRA…) is keyed off `stack_profile.data_classes` and is **mandatory** when a regulated class is present — in scope by data class, not by stated goal, and harness-enforced (framework-agnostic). Regulated data classes also elevate **data-privacy** (Lens 5) to priority 1.

---

## Lens 1 (code-audit) expands into 6 passes + craft sub-skills

```
code-audit  ──┬── Pass 1 Security      ── lens: saas-production-security  (+ ai-saas-security, + stripe-best-practices if Stripe)
              ├── Pass 2 Correctness    ── static reading
              ├── Pass 3 Debug probe    ── lens: debugging-methodology
              ├── Pass 4 Tests          ── lens: testing-strategy
              ├── Pass 5 Structure      ── lens: refactoring (code smells)
              └── Pass 6 UI/UX          ── lens: UX-UI (functional → frontend/correctness findings)
                                        ── lens: frontend-design (visual/anti-slop → category:design-aesthetic)
```

**Design & copy quality is a separate axis — capped by consequence, not by lens.** Purely visual anti-AI-slop findings carry `category: design-aesthetic` (from `frontend-design`); user-facing-copy anti-slop findings carry `category: content` (from `anti-slop-writing`, lens 16). Both are hard-capped at medium by the gate and render in their own **"Design & copy quality"** section — never in the critical/high readiness tiers. That stops "your gradient is generic" or "this headline reads as AI-written" from diluting "users can exfiltrate health data." **But the cap is narrow:** interaction/robustness failures that arrive through the UX lens (missing error state → blank screen, no-confirm destructive delete, unguarded double-submit, keyboard trap) are categorised by *consequence* as `frontend`/`accessibility`, and copy that causes a real failure (misleading legal disclaimer → `compliance`, instructions that lose data → `correctness`) is categorised by its consequence — all keep their real high/critical severity. Only "worst case: looks/reads bad" is `design-aesthetic`/`content`.

---

## The machinery (what makes the output trustworthy)

```
 finding-schema.md     →  one canonical record shape; every finding conforms (id, lens, category,
 (the contract)           location, severity, confidence_type, verification, dedup, chain?)

 ledger-and-            →  raw-findings.jsonl (append-only) + report.json; every raw finding ends as
 reconciliation.md         exactly one of reported / merged / dropped. Identity: raw = reported+merged+dropped

 scripts/audit-check.mjs → THE GATE. Hard-fails on: unverified crit/high, lost findings, severity
 (forcing function)        laundering, capped-at-critical, junk evidence, wrong-category hiding,
                           silently-skipped lens, fabricated chains, bad chain root_cause refs,
                           a legal data-protection duty excluded as not-applicable when a regulated
                           data class is present, bad prefixes, malformed report.

 scripts/run-tests.mjs   → regression suite locking every closed bypass. Must stay green.

 scripts/render-report.mjs → generates report.md FROM the gated report.json, so the method-line counts
                             a reader trusts are computed from data and cannot diverge. Leads with the
                             GATING SET (verified crit/high) not the raw total; collapses re-narrated
                             attack chains into their root-cause finding so the tier counts DISTINCT
                             defects, not findings.

 stack-adaptation.md    →  Stage 0 stack profile + cross-stack translation (Firestore↔SQL, adds SQLi
                           on SQL stacks, etc.) + DATA-CLASS detection (special-category/financial/
                           children) — drops into ANY repo, and triggers the legal data-protection
                           duty by data class, not by stated goal.

 coverage-matrix.md     →  lens × area matrix + files-examined fraction — gives "all issues" a denominator.
```

**Data flow:** atomic lenses → `raw-findings.jsonl` → merge (records dispositions) → verify (fills verdicts) → **freeze reconciled set** → adversary-emulation chains (consume only reconciled findings) → `report.json` → `audit-check.mjs` (gate, incl. dangling chain-reference check) → `render-report.mjs` → **`report.md`**.

**Pipeline ordering invariant:** chain synthesis consumes the *reconciled* finding set (post-merge, post-drop), never the raw pre-reconciliation ledger. A chain referencing a dropped or merged-away finding is a dangling reference — the harness hard-fails with a diagnostic naming whether the reference was a refute-orphan (re-synthesise) or a merge-orphan (rewrite to surviving parent id). See `ledger-and-reconciliation.md` for the full rule.

---

## Full skill inventory — role in the audit

| Role | Skills |
|------|--------|
| **Lens (17)** | code-audit, ai-saas-security, scaling-audit, release-and-ops, data-privacy, frontend-robustness, performance, accessibility, mobile-and-responsive, email-deliverability, seo-discoverability, analytics-and-instrumentation, internationalisation, soc2-compliance, adversary-emulation, anti-slop-writing, code-quality |
| **Craft sub-skill** (applied inside code-audit's passes) | saas-production-security, debugging-methodology, testing-strategy, refactoring, UX-UI, frontend-design |
| **Fix-phase craft skill** (handoff after the report, if fixing) | error-handling-patterns, data-modelling, api-and-interface-design, state-management (+ debugging-methodology, refactoring, testing-strategy reused) |
| **Conditional deepener** | stripe-best-practices (Stripe apps only) |
| **The orchestrator** | production-audit |


Every skill participates in an audit run or in the fix phase that follows it.

---

## Where everything lives

```
.claude/skills/production-audit/
├── SKILL.md                         the orchestrator (6 stages, the cardinal principle)
├── ARCHITECTURE.md                  this file
├── references/
│   ├── lens-registry.md             the coordination map (every lens → backing skill, prefix, passes)
│   ├── finding-schema.md            the canonical finding record + ID prefix table
│   ├── stack-adaptation.md          Stage 0: detection + cross-stack translation
│   ├── scope-and-lens-selection.md  Stage 1
│   ├── running-the-lenses.md        Stage 2 (+ skill-loading & schema-override protocol)
│   ├── merge-and-deduplicate.md     Stage 3
│   ├── verification-and-severity.md Stage 4 (structured verdicts, severity rules)
│   ├── coverage-matrix.md           coverage measurement
│   ├── ledger-and-reconciliation.md the ledger + report.json shape + reconciliation identity
│   └── report-format.md             Stage 5
└── scripts/
    ├── audit-check.mjs              the integrity gate (zero-dependency Node)
    ├── render-report.mjs            report.json → report.md
    ├── run-tests.mjs               regression suite (every closed bypass, incl. chain root-cause + data-class duty)
    └── fixtures/{pass,fail}/        worked examples (a valid audit, and a broken one)
```
