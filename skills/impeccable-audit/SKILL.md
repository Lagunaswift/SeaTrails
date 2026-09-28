---
name: impeccable-audit
description: "Audit interface implementation and design-system consistency using an Impeccable-informed review. Trigger on: 'impeccable audit', 'design quality audit', 'check the visual system', or when a production-audit selects this lens. Read-only; preserves the product's existing design direction and does not install or run upstream editing commands."
---

# Impeccable audit

## Why this matters

Individual components can work while the interface loses consistency across routes, themes and states. This lens checks those seams. It adapts Impeccable's audit and critique methods to the suite's evidence, ownership and severity rules. It is a SeaTrails integration, not a bundled installation of Impeccable's CLI or detector.

Read `production-audit/references/design-review-context.md` first. Establish the product's users, main tasks, existing design rules, reviewed routes and available evidence. Inspect the source before drawing conclusions from screenshots. Preserve deliberate brand choices and working conventions.

## The passes

### Pass 1: Design-system drift

**Check `token-drift` · default severity medium.** One component role acquires incompatible styling across routes or states. Compare the project's semantic tokens and reusable components with local overrides. Flag a deviation only when the role and state are equivalent and no documented exception explains it. Record both source locations, the token or rule and the override. Fix direction: use the established semantic token or document the necessary variant.

**Check `theme-role-mismatch` · default severity medium.** Theme changes alter a colour without preserving its meaning. Trace foreground/background pairs, borders, disabled controls and destructive actions through every supported theme. Record the theme, state, selector and conflicting values. Do not require a dark theme where the product does not promise one. Fix direction: map the component to the existing theme roles; send measured contrast failures to accessibility.

### Pass 2: Typography, spacing and hierarchy

**Check `role-hierarchy-drift` · default severity low.** Equivalent headings, labels or actions use unrelated scales and spacing, weakening scan order. Compare repeated roles across at least two concrete surfaces. Record the component locations and intended relationship; a single disliked font is insufficient. Fix direction: restore the project's type and spacing hierarchy without introducing a new aesthetic.

**Check `competing-emphasis` · default severity medium.** Decorative containers or secondary actions compete with the task's main action. Inspect the rendered surface when available and trace the relevant markup/CSS. Record the route, viewport and element, then explain the task consequence as an inference unless directly observed. Fix direction: reduce competing emphasis while preserving useful information.

### Pass 3: State and interaction consistency

**Check `ambiguous-interaction-state` · default severity medium.** Pending, active, disabled, selected, success and error states become indistinguishable or contradict component behaviour. Exercise available safe test states and inspect state branches. Record the branch and observed state; never simulate success by changing production data. Fix direction: connect the visible state to the actual outcome and retain a clear recovery action.

Actual task blockers belong to category `frontend`; verified keyboard or screen-reader barriers belong to `accessibility`. They keep their justified severity. A purely cosmetic difference stays `design-aesthetic`. Do not infer a keyboard trap from a still image.

### Pass 4: Responsive and content stress

**Check `content-breaks-composition` · default severity medium.** The design assumes a short label, an empty list or one viewport. Inspect long labels, text zoom, populated and empty states, and the product's supported widths. Record the exact route/state and the responsible source. Screenshot-only evidence cannot prove every width works. Fix direction: use the existing responsive layout rules; route clipping or blocked controls to the functional owner.

### Pass 5: Motion and rendering cost

**Check `motion-obscures-feedback` · default severity medium.** Animation delays a task cue, hides content or conflicts with reduced-motion behaviour. Inspect animation rules and lifecycle handling; observe the effect where browser access exists. Record the trigger, source and observed behaviour. Fix direction: retain useful feedback without making motion compulsory. Performance measurements and access barriers are owned by their existing specialist lenses; do not invent timing results from CSS.

### Pass 6: Anti-pattern triage

Treat repeated card shells, gratuitous gradients, decorative icon tiles and inconsistent geometry as search leads. Report a finding only when an observed pattern conflicts with this product's design system or user task. A font name, colour or component library never fails on its own. Inspect upstream detector output only if the user has already authorised that tool; retain its rule id and version, verify the finding independently, and deduplicate it against the other lenses.

## What to produce

Emit the canonical schema (`production-audit/references/finding-schema.md`), prefix `IMP`, primary category `design-aesthetic`. Secondary categories are `frontend` and `accessibility` only when the demonstrated consequence belongs there. Purely visual findings cap at medium; stylistic preferences alone produce no finding. Append every finding to the raw ledger during the run.

Every record names the violated local rule or user task, source location, observed condition, consequence and smallest fix direction. Keep inferred visual consequences `confidence_type: reasoning`. Record rendered evidence and limits in `verification.note`; source-only review must never claim a browser test passed.

Use `dedup.also_seen_by_lenses` to credit an independently overlapping review. Preserve the highest justified severity during merge. Do not produce a second finding for the same CSS rule under a second lens. Report strengths to preserve and unassessed states alongside the findings; do not invent an overall design score.

## Relationship to other skills

- `taste-audit` owns audience fit and visual direction on marketing, portfolio and editorial surfaces. This lens owns implementation coherence across UI surfaces, including dashboards.
- `accessibility`, `frontend-robustness`, `mobile-and-responsive` and `performance` retain their specialist tests and consequences. Route their findings to those owners or merge with explicit credit; no parallel audit scorecards.
- `anti-slop-writing` owns wording; `frontend-design`, `ux-ui-patterns` and `ui-ux-pro-max` are fix-phase resources, invoked only after the user chooses fixes.

See `INTAKE.md` for provenance and the deliberate differences from upstream.
