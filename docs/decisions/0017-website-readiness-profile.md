# 0017: Website readiness uses existing lenses and explicit coverage

**Status:** Accepted on the integration branch

**Date:** 2026-11-09

## Context

A supplied website checklist combined existing security, reliability, accessibility and SEO concerns with optional features, commercial information and design preferences. Importing it as a new catch-all lens would duplicate ownership and findings. Treating every screenshot suggestion as mandatory would produce false positives, including removal of useful eyebrows/fonts and unnecessary features.

The pending design/evidence work already supplies contextual visual review, independent source review and stronger report integrity. The integration retains that history and main's newer writing guidance. It does not install another detector or replace the canonical finding contract.

## Decision

Add a website-readiness profile selected by the production-audit orchestrator for user-facing websites/apps. It supplies common product context, twelve coverage topics and twenty-four optional-feature decisions, with a provenance map for all 119 brief controls. Extend the existing specialist references only where the new material adds coverage or corrects a misleading rule.

Keep profile records inside scope/coverage in the existing report. Existing lenses own defects, native IDs enter the ledger and reconciliation resolves duplicates. Profile IDs remain coverage labels. The report-by-default and separately authorised fix phases remain unchanged.

Validate declared profile completeness, enum/array shapes, owner participation, partial/blocked work, evidence-reference presence and surviving finding links. Render all decisions and limitations. Preserve reports that do not declare the profile. An optional absent feature can be kept out of scope for a reason; an implemented optional feature still needs assessment. A missing browser/provider observation is an evidence gap, not inapplicability.

Use keep/rewrite/restyle/remove across design review, copy review and frontend implementation. Familiar conventions are judged by their purpose and actual effect. Correct stale or overbroad SEO, consent, accessibility, security and operational guidance in their native references.

## Consequences

The suite still contains 34 skills and 21 lenses. Website reports gain explicit context and coverage without a second findings system or 119-control runtime. The optional catalogue is intentionally small enough to review on each website run; every recommendation still needs a product reason.

The gate cannot infer intent, authenticate an arbitrary evidence reference or prove visual quality. It also cannot detect that an agent omitted profile selection entirely. Orchestration instructions, source assurance and independent review retain those responsibilities. The report states these limits.

The integration branch includes the pending design/evidence commits as ancestry and keeps the earlier branches intact. Review and release can assess the combined result without silently changing main.

## Enforced by

- `skills/production-audit/scripts/audit-check.mjs`: `checkWebsiteReadiness`, `checkProse`, `WEBSITE_TOPICS`, `WEBSITE_FEATURES`.
- `skills/production-audit/scripts/render-report.mjs`: declared website coverage section and accumulated website limitations.
- `skills/production-audit/scripts/run-tests.mjs`: attack-first bypass and nearest valid cases, plus rendered visibility and legacy cases.
- `skills/production-audit/references/website-readiness-profile.md`: product context, exact coverage contract, catalogue and execution rules.
- `skills/production-audit/references/design-review-context.md`: contextual decisions shared with copy review and fix-phase design.
