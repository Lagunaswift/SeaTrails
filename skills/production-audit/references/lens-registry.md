# Lens Registry

This is the coordination map for the production audit. Every lens the orchestrator can run is listed here with: the backing skill, the reference files the subagent should read, what the lens owns (non-overlapping with other lenses), its id prefix, and its priority.

The orchestrator **must** consult this registry when spawning subagents. A subagent that runs a lens without reading its backing skill produces ad-hoc findings instead of structured ones — the quality difference is the entire point of having skills.

**Each lens's own `SKILL.md` is the authoritative source for its methodology and passes.** This registry summarises; the skill file governs. The reference files listed are the skill's own `references/` unless noted otherwise.

## How to use this registry

When running a lens (Stage 2), the orchestrator should:
1. Look up the lens here; note its backing skill, prefix, and priority.
2. Tell the subagent to read the backing `SKILL.md` and its references before starting.
3. Tell the subagent to follow that skill's passes, **adapted to the detected stack** (`stack-adaptation.md`).
4. Collect findings in the **canonical schema** (`finding-schema.md`), using the lens's id prefix, and append them to the `raw-findings.jsonl` ledger (`ledger-and-reconciliation.md`). The schema **overrides** any "standard format" or "prioritised report" output instruction in the backing skill — see `running-the-lenses.md`.

## Two phases: atomic lenses, then synthesis lenses

- **Atomic lenses** scan the code and emit findings about individual issues. Run these first.
- **Synthesis lenses** (`soc2-compliance`, `adversary-emulation`) run *after* the atomic lenses and consume the ledger of atomic findings as their input. Run them last, before verification.

---

## Lens 1: code-audit  (prefix SEC/COR/DBG/TST/STR/UIUX · priority 1)

- **Skill:** `.claude/skills/code-audit/SKILL.md` — itself an orchestrator running 6 sub-passes with specialist sub-skills.
- **Owns:** Auth/authz bugs, injection (incl. SQL injection on SQL stacks), CSRF, XSS, business-logic errors, application-level data integrity and races, test-coverage gaps, code structure, API design quality, UI/UX review.
- **Sub-skills:** `ai-saas-security`, `saas-production-security`, `error-handling-patterns`, `state-management`, `debugging-methodology`, `testing-strategy`, `refactoring`, `api-and-interface-design`, `data-modelling`, `UX-UI`, `frontend-design`.
- **Passes:** Security → Correctness → Active debugging probe → Tests → Structure → UI/UX.
- **Type:** Atomic (always runs first).
- **Design findings route by consequence, not by lens:** Pass 6 applies `UX-UI` (functional usability) and `frontend-design` (visual quality / anti-AI-slop). **Purely aesthetic** findings (colour, spacing, hierarchy, brand, generic-AI-slop, microcopy tone — worst case "looks unprofessional") carry `category: design-aesthetic`, are hard-capped at medium by the harness, and report in the separate "Design quality & distinctiveness" section. But **interaction/robustness failures that surface through this pass keep their real severity and are NOT design-aesthetic** — a missing error state, no-confirm destructive delete, unguarded double-submit, or keyboard trap is categorised `frontend` (owned by `frontend-robustness`) or `accessibility` and stays in the readiness tiers. Cap cosmetic findings; never cap a genuine interaction failure that merely arrived through the UX lens.
- **Conditional deepener — Stripe:** when Stage 0 detects a Stripe integration, the Security and Correctness passes additionally read `.claude/skills/stripe-best-practices/SKILL.md` as a payment-integration checklist (webhook **signature verification**, **idempotency keys**, restricted/secret API-key handling, Checkout/PaymentIntent selection, subscription-state correctness, refund/dispute handling). Findings stay under code-audit's `SEC`/`COR` prefixes with `pass: "payment-integration"` and `dedup.also_seen_by_lenses: ["stripe-best-practices"]` so they're attributable without a separate lens. (The `stripe-projects` and `upgrade-stripe` skills are build/migration tools, not audit lenses, and are not used.)

## Lens 2: ai-saas-security  (prefix AI · priority 1)

- **Skill:** `.claude/skills/ai-saas-security/SKILL.md`
- **References:** the skill's `references/` (rate-limiting, cost-control, input-security, output-security, ai-infrastructure).
- **Owns:** Prompt injection, AI cost runaway, token budgets, per-user AI rate limiting, output filtering/safety, AI caching security, model-key protection, AI monitoring/kill switches.
- **Passes:** Rate limiting → Cost control → Input security → Output security → AI infrastructure.
- **Type:** Atomic. **When to run:** any AI surface exists. **Prerequisite:** assumes `saas-production-security` foundations.

## Lens 3: scaling-audit  (prefix SCALE · priority 2)

- **Skill:** `.claude/skills/scaling-audit/SKILL.md`
- **References:** `scaling-audit/references/`: data-durability, concurrency-and-load, dependencies-and-resilience, cost-at-scale, failure-and-deployment, observability.
- **Owns:** Data durability/backups, single points of failure, data-level concurrency/atomicity (transactions), dependency resilience (circuit breakers, timeouts, retries), cost scaling (N+1, unbounded reads), observability/health checks.
- **Passes:** Durability → Concurrency & load → Dependencies & resilience → Cost at scale → Failure & deployment → Observability.
- **Type:** Atomic. **Overlap:** application-level races are code-audit's; this owns data-level atomicity.

## Lens 4: release-and-ops  (prefix OPS · priority 2)

- **Skill:** `.claude/skills/release-and-ops/SKILL.md`
- **References:** `release-and-ops/references/`: secrets-and-config, environments, ci-cd, release-safety, rollback-and-recovery, reproducibility.
- **Owns:** Secrets management/exposure, config & environment parity, CI/CD, build checks, deployment safety (migrations, index ordering), rollback readiness, service-worker versioning, cron-job safety, reproducibility.
- **Passes:** Secrets & config → Environments → CI/CD → Release safety → Rollback & recovery → Reproducibility.
- **Type:** Atomic. **Overlap:** secrets in client bundles are also code-audit's; this owns the operational lifecycle.

## Lens 5: data-privacy  (prefix PRIV · priority 2, elevated to 1 for health/financial/children's data)

- **Skill:** `.claude/skills/data-privacy/SKILL.md`
- **References:** `data-privacy/references/`: data-inventory-and-minimisation, lawful-basis-and-consent, data-subject-rights, retention-and-third-parties, transparency-and-policy, breach-readiness.
- **Owns:** Data inventory/classification (esp. special-category data), consent (collection, granularity, withdrawal enforcement), right to erasure (deletion completeness), portability (export completeness), retention, third-party sharing disclosure, analytics consent gating, PII in logs.
- **Passes:** Data inventory & minimisation → Lawful basis & consent → Data-subject rights (deletion/export) → Retention & third parties → Transparency & policy → Breach readiness.
- **Type:** Atomic. **Overlap:** the privacy/regulatory view of data flows others also touch.
- **Elevation:** when `stack_profile.data_classes` shows a regulated class (`special-category:*`, `financial`, `children`, `government-id`, `precise-location`), this lens is **priority 1**, and its findings are the raw material the `soc2-compliance` data-protection-duty pass re-projects as the impact-assessment / lawful-basis gap under the applicable framework (Lens 14). Regulated data also makes that compliance pass mandatory, not optional.

## Lens 6: frontend-robustness  (prefix FE · priority 3)

- **Skill:** `.claude/skills/frontend-robustness/SKILL.md`
- **References:** `frontend-robustness/references/`: async-states, form-submission, validation, slow-and-failed-requests, optimistic-and-races, edge-inputs-and-defensive-rendering.
- **Owns:** The four async states (loading/success/error/empty), form submission/double-submit, client-server validation sync, slow/failed-request handling, optimistic updates & rollback, defensive rendering (null guards), offline/PWA behaviour, error boundaries.
- **Passes:** Async states → Form submission → Validation → Slow & failed requests → Optimistic updates & races → Edge inputs & defensive rendering.
- **Type:** Atomic. **When to run:** an interactive frontend exists (skip for headless API / static site).

## Lens 7: performance  (prefix PERF · priority 4)

- **Skill:** `.claude/skills/performance/SKILL.md`
- **References:** `performance/references/`: measuring-performance, javascript-bundle, rendering-path, assets-and-media, caching, network-and-requests, runtime-and-interaction.
- **Owns:** Perceived speed (LCP/FCP/TTFB), bundle size, rendering path (server vs client), image/asset optimisation, caching strategy, runtime performance.
- **Passes:** Measuring → Bundle → Rendering path → Assets & media → Caching → Network & requests → Runtime & interaction.
- **Type:** Atomic. **Overlap:** API/db response time at scale is scaling-audit's; this owns the perceived/rendering path.

## Lens 8: accessibility  (prefix A11Y · priority 4)

- **Skill:** `.claude/skills/accessibility/SKILL.md`
- **References:** `accessibility/references/`: semantic-structure, keyboard-and-focus, screen-readers-and-text, colour-and-visual, forms-and-inputs, testing-accessibility.
- **Owns:** Semantic structure, keyboard/focus management, screen-reader support (ARIA, alt, live regions), colour/contrast and colour-only indicators, form accessibility, motion/reduced-motion, component-primitive accessibility. Target: WCAG 2.1 AA.
- **Passes:** Semantic structure → Keyboard & focus → Screen readers & text → Colour & visual → Forms & inputs → Testing.
- **Type:** Atomic. **When to run:** a user-facing UI exists (skip for headless API).

## Lens 9: email-deliverability  (prefix EMAIL · priority 5)

- **Skill:** `.claude/skills/email-deliverability/SKILL.md`
- **References:** `email-deliverability/references/`: authentication, sender-reputation, content-and-format, transactional-vs-marketing, list-hygiene, sending-setup.
- **Owns:** Email auth (SPF/DKIM/DMARC references in code), sender reputation (bounce/complaint handling), template quality, transactional-vs-marketing stream separation, unsubscribe (List-Unsubscribe, one-click), send resilience/rate-limiting, list hygiene.
- **Passes:** Authentication → Sender reputation → Content & format → Transactional vs marketing → List hygiene → Sending setup.
- **Type:** Atomic. **When to run:** the app sends email. **Note:** DNS-level records can't be verified from the repo — flag for live verification.

## Lens 10: seo-discoverability  (prefix SEO · priority 5)

- **Skill:** `.claude/skills/seo-discoverability/SKILL.md` (frontmatter name `seo-and-discoverability`; the lens id and finding `lens` value are `seo-discoverability`).
- **References:** `seo-discoverability/references/`: crawlability-and-rendering, indexing-and-canonical, metadata, structured-data, social-sharing, sitemaps-and-crawl.
- **Owns:** Crawlability (robots, sitemap, SSR vs CSR for public pages), indexing (canonical, noindex on auth-walled pages), metadata (title/description/OG/Twitter), structured data (JSON-LD), social-sharing previews.
- **Passes:** Crawlability & rendering → Indexing & canonical → Metadata → Structured data → Social sharing → Sitemaps.
- **Type:** Atomic. **When to run:** public-facing pages that want to be found. Skip for internal/auth-walled apps.

## Lens 11: mobile-and-responsive  (prefix MOB · priority 4)

- **Skill:** `.claude/skills/mobile-and-responsive/SKILL.md`
- **References:** `mobile-and-responsive/references/`: viewport-and-rendering, responsive-layout, touch-and-interaction, mobile-input, mobile-performance, cross-device-testing.
- **Owns:** Viewport config, responsive breakpoints, touch-target sizes, mobile input types, PWA manifest completeness, mobile performance, cross-device behaviour.
- **Passes:** Viewport & rendering → Responsive layout → Touch & interaction → Mobile input → Mobile performance → Cross-device testing.
- **Type:** Atomic. **When to run:** used on phones/tablets (most public web apps).

## Lens 12: analytics-and-instrumentation  (prefix ANL · priority 5)

- **Skill:** `.claude/skills/analytics-and-instrumentation/SKILL.md`
- **References:** `analytics-and-instrumentation/references/`: measuring-the-right-things, event-design, funnels-and-dropoff, activation-and-retention, privacy-respecting-analytics, acting-on-data.
- **Owns:** Meaningful event tracking, event-naming consistency, funnel instrumentation, activation/retention signals, feature-adoption measurement, error-tracking integration, privacy-respecting (consent-gated) tracking.
- **Passes:** Measuring the right things → Event design → Funnels & drop-off → Activation & retention → Privacy-respecting analytics → Acting on data.
- **Type:** Atomic. **Overlap:** consent gating also touches data-privacy (which checks consent exists/enforceable).

## Lens 13: internationalisation  (prefix I18N · priority 5)

- **Skill:** `.claude/skills/internationalisation/SKILL.md`
- **References:** `internationalisation/references/`: text-and-translation, formatting, timezones, rtl-and-bidi, unicode-and-encoding, locale-edge-cases.
- **Owns:** Text externalisation, locale-aware formatting (dates/numbers/currency), timezone handling, RTL/bidi layout, Unicode/encoding correctness, pluralisation.
- **Passes:** Text & translation → Formatting → Timezones → RTL & bidi → Unicode & encoding → Locale edge cases.
- **Type:** Atomic. **When to run:** targets multiple languages/locales. For single-locale apps, note as not-applicable.

## Lens 14: soc2-compliance  (prefix SOC2 · priority 6 · SYNTHESIS)

- **Skill:** `.claude/skills/soc2-compliance/SKILL.md`
- **Owns:** Mapping the technical-control subset of the AICPA Trust Services Criteria (CC1–CC9 + optional Availability, Processing Integrity, Confidentiality, Privacy) onto code evidence, flagging controls with no backing. Does NOT cover organisational controls — out of scope for a code audit, and the lens says so.
- **Consumes:** Ledger findings from code-audit (CC6), release-and-ops (CC8), scaling-audit (Availability, CC7), data-privacy (Confidentiality, Privacy) — re-projected via `dedup.also_seen_by_lenses`.
- **Passes:** CC6 access → CC7 monitoring/audit-trail → CC8 change mgmt → CC3/CC4 risk → Availability → Confidentiality → Processing Integrity → Privacy. **Plus** a reduced data-protection-duty pass (impact assessment, heightened lawful basis, children's-data duties — under the framework that applies to the data class and jurisdiction) when triggered by data class.
- **When to run — two triggers, keep them apart:**
  - **Certification readiness** — a *stated* SOC 2 / audit-readiness goal. Runs the full criteria mapping. Deferrable when no such goal exists.
  - **Legal data-protection duty** — triggered by `stack_profile.data_classes` containing a regulated class (`special-category:*`, `financial`, `children`, `government-id`), **regardless of any stated goal**. Runs the reduced data-protection-duty pass. **Mandatory** — the harness fails an audit that excludes the duty as not-applicable when a regulated data class is present. Certification can be deferred; the legal duty cannot. Always with the boundary caveat.

## Lens 15: adversary-emulation  (prefix CHAIN · priority 7 · SYNTHESIS, runs last)

- **Skill:** `.claude/skills/adversary-emulation/SKILL.md`
- **Owns:** Chaining atomic findings into realistic attack paths (MITRE ATT&CK), assessing detection coverage (blue), pairing each path with its detection gap and cheapest break (purple), assessing developer awareness of the risk (yellow), and cross-referencing against known exploit patterns (orange). Finds chained exploits atomic auditing misses.
- **Consumes:** The whole ledger; credits component findings in `chain.component_findings`. Observability findings (scaling-audit) feed the detection pass.
- **Output:** `CHAIN`-prefixed findings, category `attack-path`, with the `chain` schema block including `builder_awareness` and `threat_intel` fields. Severity = realised impact of the path, not max of parts.
- **Passes:** Red: objectives → Red: kill-chains (ATT&CK) → Blue: detection → Purple: path→gap→fix → Yellow: builder awareness → Orange: threat intel → White: scope hygiene.
- **Boundary:** STRICTLY DEFENSIVE — owned-system threat modelling; never weaponised exploits, C2, evasion-for-attackers, or third-party targeting.
- **When to run:** any security-sensitive app. Skip for a static site with no backend.

## Lens 16: anti-slop-writing  (prefix COPY · priority 5 · ATOMIC)

- **Skill:** `.claude/skills/anti-slop-writing/SKILL.md`
- **Owns:** Quality of the app's **user-facing copy** (the words, not the pixels) — landing/marketing pages, onboarding flows, microcopy, button and menu labels, empty/error/loading-state wording, notifications, and transactional/marketing **email copy**. Audits for AI-slop tells: banned filler/false-authority/intensifier phrases, the correctio ("not X, it's Y"), exhaustive triples, performative warmth, throat-clearing, off-brand or generic voice, and the other patterns in the skill.
- **Type:** Atomic (runs in the atomic phase alongside the other content lenses, despite the registry number). It *reviews* copy against the standard — it does not rewrite (that is the fix phase).
- **Output:** `COPY`-prefixed findings, **category `content`**, **hard-capped at medium** by the harness and reported in the "Design & copy quality" section — the worst realistic outcome is "the copy reads as generated / off-brand / fails to convert," a credibility/conversion risk, not a safety one. **Cap by consequence, not by lens:** copy whose worst case is a *real failure* (a misleading legal disclaimer → `compliance`, instructions that cause data loss → `correctness`, an error message that breaks a flow → `frontend`) is owned by that consequence and keeps its real severity.
- **When to run:** the app has meaningful user-facing copy (a marketing site, onboarding, rich microcopy, customer emails). Light for a very early prototype; skip for a headless API, an internal dev tool, or a app with negligible copy. It audits the app's *own* text — never code comments, logs, or machine-to-machine output.
- **Overlap:** the copy twin of `frontend-design` (which owns *visual* anti-slop, category `design-aesthetic`); the two compose into the one "Design & copy quality" section. Distinct from `email-deliverability` (owns deliverability mechanics — SPF/DKIM/streams — not copy voice) and `seo-discoverability` (owns metadata *presence*, not its writing quality); cross-reference via `dedup.also_seen_by_lenses` where they touch the same text.
- **Note — same skill, two roles:** `anti-slop-writing` also governs the *audit report's own prose* (see SKILL.md). As a lens it audits the *product's* copy; as a prose governor it keeps the report itself slop-free. The two roles do not conflict.

## Lens 17: code-quality  (prefix QUAL · priority 3 · ATOMIC)

- **Skill:** `.claude/skills/code-quality/SKILL.md`
- **Owns:** Line-level and file-level code quality — the patterns a senior developer flags in PR review. Magic numbers, hardcoded values, loose equality, blanket `any` types, empty catches, inconsistent naming, async anti-patterns (unawaited promises, sequential awaits), mutation bugs, missing boundary validation, dead code and debug leftovers, separation-of-concerns violations, and the specific tells of AI-generated code (over-abstraction, "just in case" guards, inconsistent patterns across the same codebase, volume without depth).
- **Output:** `QUAL`-prefixed findings, category `code-quality`. Most findings are medium or low — these are maintainability issues, not safety issues. Escalate to high only when the pattern creates a real risk (empty catch silencing a payment failure, missing boundary check letting malformed data propagate); in those cases the consequence drives the category (`correctness`/`security`) and the relevant lens owns it.
- **Passes:** Hardcoding → Type safety → Control flow → Error handling hygiene → Naming → Dead code → Async discipline → Mutation → Boundary hygiene → Separation of concerns → Deferred implementations → AI-code tells.
- **Overlap:** Complements `refactoring` (which covers architectural smells: duplication, god objects, tangled modules) and `code-audit` Pass 5 (which applies refactoring as its structure lens). This lens covers the line-level patterns those miss. Also complements `error-handling-patterns` (architectural error strategy) — this lens flags the surface tells (empty catches, lost context) without prescribing the architecture.
- **When to run:** any codebase review. Especially useful when assessing code that may have been AI-generated and merged without senior review.

## Lens 18: dependency-audit  (prefix DEP · priority 2 · ATOMIC)

- **Skill:** `.claude/skills/dependency-audit/SKILL.md`
- **Owns:** Supply chain and dependency security — lock file hygiene, version pinning, dependency bloat, postinstall scripts, dev/prod boundary enforcement, and whether automated vulnerability scanning exists in CI. Works by reading lock files, package manifests, and CI config — never calls a registry or external API.
- **Output:** `DEP`-prefixed findings, category `supply-chain`. Most findings are medium (unpinned version, missing lock file). Escalate to high for postinstall scripts that download external content, security-critical packages on wildcards, or no automated scanning in CI.
- **Passes:** Lock file hygiene → Version pinning → Dependency count/bloat → Known-risky patterns → Dev vs production boundaries → CI vulnerability scanning.
- **Overlap:** Complements `release-and-ops` (secrets and deploy safety at the app level) and `code-audit` security pass (mentions dependency vulns but doesn't read lock files). This lens goes deeper on the dependency tree itself.
- **When to run:** any project with third-party dependencies. Skip for zero-dependency libraries.

## Lens 19: infrastructure-config  (prefix INFRA · priority 2 · ATOMIC)

- **Skill:** `.claude/skills/infrastructure-config/SKILL.md`
- **Owns:** Deployment and infrastructure configuration files checked into the repo: Dockerfiles, docker-compose, Terraform, CloudFormation, Kubernetes manifests, CI/CD pipelines, reverse proxy configs (nginx/Apache/Caddy), and secrets/env files. Checks for containers running as root, overly permissive IAM, exposed ports, missing security headers, secrets in build args, unpinned base images, privileged containers, and CI pipeline vulnerabilities.
- **Output:** `INFRA`-prefixed findings, category `infrastructure`. Severity by impact: publicly accessible database or secrets in config is critical/high; missing healthcheck or server version exposure is low/medium.
- **Passes:** Container security (Docker) → Cloud infrastructure (Terraform/CFN) → Kubernetes manifests → CI/CD pipeline security → Reverse proxy/server config → Environment and secrets files.
- **Overlap:** Complements `release-and-ops` (app-level deploy safety), `code-audit` (app-level security), and `scaling-audit` (app-level scaling). This lens checks the infrastructure layer beneath all of them.
- **When to run:** any project with infrastructure config files in the repo. Skip for client-side-only projects with no deployment config.
