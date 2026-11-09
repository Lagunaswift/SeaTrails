---
name: taste-audit
description: "Audit visual direction, brand fit and generic composition using a Taste Skill-informed review. Trigger on: 'taste audit', 'audit design taste', 'generic-looking landing page', or when a production-audit selects this lens. Read-only; intended for marketing, portfolio and editorial surfaces, not a dashboard redesign or an automatic styling pass."
---

# Taste audit

## Why this matters

A technically correct landing page can still communicate the wrong product. This lens evaluates design choices against the actual brief and audience, using Taste Skill's context-first approach. Novelty, animation and whitespace are not universal goals.

Read `production-audit/references/design-review-context.md` first. Read the local brief, brand assets, `PRODUCT.md` and `DESIGN.md` where present. Distinguish explicit direction from inferred preferences. Existing brand decisions outrank upstream defaults. Missing brand documentation is a review limitation, not an automatic defect.

## The passes

### Pass 1: Brief and audience fit

**Check `brief-direction-conflict` · default severity medium.** A visible design choice conflicts with an explicit brief, audience requirement or preserved brand rule. Compare the brief with the specific page and its source, rather than judging it against a favourite reference site. Record the brief citation, UI citation and conflict. Fix direction: restore the agreed direction with the smallest local change.

**Check `unjustified-style-reset` · default severity medium.** A redesign replaces working typography, imagery or navigation conventions without an instruction to change them. Compare the available baseline and current surface; without a baseline, report the comparison as unavailable. Record what changed and the rule it breaks. Fix direction: preserve the established identity unless a concrete user problem justifies replacing it.

### Pass 2: Composition and useful density

**Check `template-over-content` · default severity medium.** Repeated equal cards, oversized hero space or decorative wrappers flatten information that has different importance. Inspect the actual content and reading order. Record which decision is obscured and which elements create the competition. Fix direction: make the layout express the content's priorities; do not replace one generic template with another.

**Check `density-task-mismatch` · default severity low.** The surface's information density conflicts with its stated job. Judge a portfolio, pricing page and long article separately. Record the available viewport, relevant content and inferred reading cost. Fix direction: adjust local grouping or spacing without hiding useful detail. Never apply marketing-page whitespace preferences to an operational dashboard.

### Pass 3: Typography, colour and imagery

**Check `unrelated-visual-language` · default severity low.** Type, iconography, illustration or photography mixes incompatible roles without support from the brief. Compare repeated roles and their source assets. Record the inconsistency and the project's existing rule. Fix direction: reuse the established visual vocabulary.

A neutral system font, Inter, a serif, a centred layout, pure black, gradients or a familiar component library can all be appropriate. Do not ban them by name. Colour-contrast failure belongs to accessibility, not taste. Do not prescribe unlicensed fonts or asset downloads.

### Pass 4: Motion and restraint

**Check `ornament-before-task` · default severity medium.** Motion or visual effects compete with reading, understanding the offer or finding the intended action. Trace the effect to source and distinguish direct observation from an inference. Record the trigger, affected element and task. Fix direction: remove the unnecessary effect or constrain it to a non-blocking role.

Taste Skill's variance, motion and density dials are useful discussion axes, not pass/fail thresholds. Do not silently import its numeric defaults, add animation, change frameworks or install a design system during an audit. Functional and reduced-motion failures go to the corresponding specialist lens with full severity.

### Pass 5: Anti-slop and prioritisation

**Check `generic-brand-substitution` · default severity medium.** Stock composition or imagery erases a concrete differentiator that the brief already supplies. State which differentiator is missing from which surface and cite the supporting content or assets. Generic wording alone belongs to `anti-slop-writing`. Fix direction: express the real product detail through the existing design system.

Prioritise concrete contradictions and repeated inconsistencies over personal preference. Keep strengths to preserve, uncertain observations and proposed directions distinct. A prediction about trust or conversion is a hypothesis, never a measured result without supplied data.

## What to produce

Emit the canonical schema (`production-audit/references/finding-schema.md`), prefix `TASTE`, category `design-aesthetic` only. Findings cap at medium. Most visual judgements are `confidence_type: reasoning`; verifying the underlying CSS does not prove a commercial consequence. Append findings to the ledger as they are found.

Use `verification.note` to record the brief citation, rendered evidence when available, viewport/state and assumptions. Without rendered evidence, limit claims to source-observable inconsistencies and explicitly mark visual assessment incomplete. No invented screenshots, conversion uplift, universal beauty score or claim that a page is objectively tasteful.

The same root cause seen by `impeccable-audit` or code-audit's UI/UX pass is merged once, with `dedup.also_seen_by_lenses` retaining credit. Hand actual interaction failures to `frontend-robustness` or `accessibility`, rather than downgrading them into this lens's capped category.

## Applicability and boundaries

Run on landing pages, marketing sites, portfolios, brand-led commerce and editorial surfaces where visual identity matters. On a mixed application, limit it to those routes. Skip for headless services, CLI tools, data tables, operational dashboards and multi-step application workflows; use `impeccable-audit` and the functional lenses there.

Fixes require a separate instruction. The lens never executes upstream redesign steps, rewrites brand files, generates assets, installs dependencies or changes production state. See `INTAKE.md` for provenance.
