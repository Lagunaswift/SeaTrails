# Website brief coverage and native ownership

This is the integration map for the supplied Website Audit and Remediation Brief, reviewed 9 November 2026. Its 119 controls comprise 95 core/conditional checks and 24 optional-feature decisions. The source material included duplicate screenshots; the unrelated RAM-email script supplies no website requirement. Twelve layout examples supply vocabulary, not twelve more controls.

The brief's IDs below are provenance labels only. They are not SeaTrails finding IDs and must never enter raw-findings.jsonl as findings. SeaTrails keeps its existing lenses, severity rules, evidence assurance, report-by-default mode and canonical output. Read website-readiness-profile.md for runtime selection, topic coverage and optional decisions.

Brief version 1.1 also adds a journey review informed by [Jakob Nielsen's ten usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/). Read [nielsen-usability-review.md](../../ux-ui-patterns/nielsen-usability-review.md) for the ten perspectives, original task probes and existing-control crosswalk. HEUR-01 through HEUR-10 are review labels, not additional controls. This source is separate from the screenshot material; the 119 controls and original 201 source entries remain unchanged.

## Reuse and additions

Most security, operations, state handling, performance and accessibility checks already had owners. The integration adds the website profile and commercial completeness reference, makes boundary tests more explicit, updates requirements that could produce incorrect findings and aligns design guidance with purpose. Existing design/evidence work is retained. An entry marked "existing" still has to be assessed when applicable; it is not a claim that a target website passed.

Paths in this table are relative to the installed .claude/skills/ directory. Read only the relevant backing skill and references for each selected lens.

| Brief controls | Native owner and reference | Integration |
|---|---|---|
| BASE-01, BASE-02 | production-audit/references/website-readiness-profile.md; production-audit/references/stack-adaptation.md | Adds audience, route/template and journey context |
| BASE-03 | code-audit; data-privacy; production-audit/references/stack-adaptation.md | Existing roles/data inventory, stronger direct-boundary review |
| BASE-04 | production-audit/references/evidence-assurance.md; production-audit/references/website-readiness-profile.md | Retains captured-source/reviewer evidence, adds browser/provider context |
| BASE-05, BASE-06 | production-audit/references/website-readiness-profile.md | Adds explicit applicability, authority and optional decisions |
| SEC-01, SEC-02 | release-and-ops/references/secrets-and-config.md | Existing secret/public-key classification and exposure response |
| SEC-03, SEC-04, SEC-05 | code-audit; saas-production-security/references/web-security.md | Existing account/permission/rule checks, extended direct role/tenant probes |
| SEC-06, SEC-07 | code-audit; saas-production-security/references/web-security.md | Existing validation, injection and contextual XSS protection |
| SEC-08, SEC-09, SEC-10 | saas-production-security/references/web-security.md; infrastructure-config | Existing transport, cookies, headers and origins; corrects blanket CSRF advice |
| SEC-11, SEC-12 | code-audit; saas-production-security/references/web-security.md | Adds general SSRF and explicit public-upload/active-content publication boundaries |
| SEC-13, SEC-14 | dependency-audit; infrastructure-config; release-and-ops | Existing build/runtime/configuration checks; source maps judged by disclosure/policy |
| SEC-15 | ai-saas-security and its references | Existing AI-specific checks, conditional on an actual AI surface |
| PAY-01, PAY-02, PAY-03 | code-audit; saas-production-security; stripe-best-practices | Extends server-authoritative payment and negative webhook/replay/order probes |
| COST-01, COST-02 | scaling-audit/references/cost-at-scale.md; ai-saas-security/references/cost-control.md | Clarifies enforced caps, notification, delay and distributed scope |
| REL-01, REL-02 | scaling-audit/references/dependencies-and-resilience.md; frontend-robustness/references/form-submission.md | Existing bounded retries/idempotency, extended payment boundary cases |
| REL-03 | scaling-audit; data-modelling; saas-production-security/references/production-readiness.md | Existing query, index, bounded-result and load checks |
| REL-04 | code-audit; performance/references/caching.md | Adds private cache isolation and consequence routing |
| REL-05, REL-06, REL-07 | scaling-audit/references/data-durability.md, scaling-audit/references/observability.md, scaling-audit/references/concurrency-and-load.md | Adds restore side-effect isolation, demonstrated alerts and bounded evidence |
| REL-08 | scaling-audit; code-audit; frontend-robustness | Existing consistency/race/recovery checks, stronger interruption evidence |
| UX-01, UX-02, UX-07, UX-08, UX-09 | code-audit; ux-ui-patterns/website-completeness.md; ux-ui-patterns/nielsen-usability-review.md | Adds focused website navigation, contact, identity, missing-page and task-help review |
| UX-03 | mobile-and-responsive; impeccable-audit | Existing responsive/content stress review, contextual layout guidance |
| UX-04, UX-06 | code-audit; ux-ui-patterns/forms-and-input.md; ux-ui-patterns/nielsen-usability-review.md; accessibility | Existing field/action semantics and validation; explicit exits, error prevention and memory review across steps |
| UX-05, UX-10 | frontend-robustness/references/form-submission.md; ux-ui-patterns/nielsen-usability-review.md; production-audit/references/website-readiness-profile.md | Adds precise saved/submitted/delivered, cancellation/recovery outcomes and conditional draft decisions |
| A11Y-01, A11Y-02 | accessibility/references/semantic-structure.md; accessibility/references/screen-readers-and-text.md | Existing semantics/alternatives; removes H1-count-only failures |
| A11Y-03, A11Y-04, A11Y-05 | accessibility; ux-ui-patterns/accessibility.md | Existing keyboard/focus/form checks; explicit focus-obscuring states |
| A11Y-06, A11Y-07, A11Y-08 | accessibility/references/colour-and-visual.md; mobile-and-responsive | Corrects resize/reflow and target-size requirements and exceptions |
| A11Y-09, A11Y-10, A11Y-11 | accessibility and its references | Adds accessible authentication and complete applicable WCAG 2.2/manual review |
| PERF-01 | performance/references/measuring-performance.md | Separates repeatable lab evidence from field percentiles |
| PERF-02, PERF-03, PERF-04, PERF-05, PERF-06 | performance; frontend-robustness | Existing assets/bundles/rendering/cache checks; explicit console/runtime evidence |
| SEO-01 | seo-discoverability/references/crawl-policy-and-ai.md | Adds purpose-specific search/training/retrieval policy |
| SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07 | seo-discoverability and its references | Preserves existing checks, corrects rendering, metadata and rich-result assumptions |
| SEO-08, SEO-09, SEO-10, SEO-11, SEO-12 | seo-discoverability; ux-ui-patterns/website-completeness.md | Adds useful content, authentic dates/proof and provider evidence; no arbitrary content quota |
| PRIV-01, PRIV-02 | data-privacy/references/lawful-basis-and-consent.md; analytics-and-instrumentation | Updates actual-purpose assessment and conditional exceptions |
| PRIV-03 | data-privacy; ux-ui-patterns/website-completeness.md | Connects approved policies to observable business behaviour |
| PRIV-04 | analytics-and-instrumentation | Existing useful-event review, explicit attribution/privacy/experiment checks |
| PRIV-05 | data-privacy; code-audit; frontend-robustness | Existing retention/deletion/export, stronger cache/draft boundaries |
| BRAND-01, BRAND-02, BRAND-06 | taste-audit; anti-slop-writing; ux-ui-patterns/website-completeness.md | Existing provenance/brand review, adds commercial facts and evidence |
| BRAND-03, BRAND-04, BRAND-05 | impeccable-audit; taste-audit; frontend-design | Retains design-system review, adds layout vocabulary and preservation rule |
| BRAND-07 | production-audit/references/design-review-context.md; ux-ui-patterns/nielsen-usability-review.md; anti-slop-writing; frontend-design | Adds keep/rewrite/restyle/remove with contextual eyebrow examples; relevance review preserves useful detail and brand |
| CONV-01, CONV-02, CONV-03, CONV-04, CONV-05 | code-audit; ux-ui-patterns/website-completeness.md | Adds truthful offer/checkout/fulfilment and task-based friction review |
| CONV-06 | analytics-and-instrumentation ; production-audit/references/website-readiness-profile.md | Connects observed friction to conditional, measured experiments |
| OPT-01 through OPT-24 | production-audit/references/website-readiness-profile.md, optional-feature catalogue | Records every feature decision and routes existing functionality to native owners |
| OPS-01, OPS-02 | release-and-ops; testing-strategy; refactoring | Existing build/release/rollback and authorised-fix discipline |
| OPS-03 | release-and-ops/references/environments.md | Adds explicit source-versus-provider reconciliation and access limits |
| OPS-04 | production-audit/references/evidence-assurance.md; production-audit/references/verification-and-severity.md | Retains independent finding review; records fix-phase rechecks |

## Intentional corrections

Useful source advice is preserved without copying its blanket prescriptions. Public client keys and deliberate source maps need classification. Optional llms.txt, dark mode, original research, galleries, blog quotas and A/B tests cannot become automatic launch blockers. Current crawler, privacy and accessibility claims are supported in the specialist references and must be rechecked when those requirements change.

The keep/rewrite/restyle/remove rule also applies to familiar words and common layouts. The integration does not rank the nine brand concepts from the screenshot as a universal law. Review product experience, positioning, story, recognisable assets, consistency, name, guidelines, logo and purpose against the product's actual audience and evidence.
