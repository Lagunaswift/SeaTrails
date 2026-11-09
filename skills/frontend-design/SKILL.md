---
name: frontend-design
description: "Create or improve frontend interfaces for their audience and task. Use when building web components, pages, applications or visual treatments. Preserve approved brand rules and useful conventions; diagnose weak hierarchy, irrelevant decoration and inconsistent execution in context."
---

Build working interfaces with a clear hierarchy, coherent visual choices and appropriate detail. During maintenance, preserve the product's identity and established interaction patterns. A request to fix a defect is not a request to redesign the site.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, establish the context and an appropriate visual direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Follow the supplied brief and brand. Editorial, playful, restrained and utilitarian directions can all be appropriate. Propose a new direction only when the task calls for one.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: Which real product qualities should the design communicate? Use supplied content and assets; do not invent proof or claims.

Use the existing design system where available. If the brief is missing, record assumptions and solve the immediate task without inventing a replacement identity. Read production-audit/references/design-review-context.md when implementing an audit recommendation.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Legible and appropriate to the task
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose readable type that fits the brand and content. A system stack, Arial or Inter can be the right choice. Inspect hierarchy, line length, weight, fallback and loading cost before changing a font.
- **Colour & Theme**: Reuse meaningful colour roles and tokens. Check actual contrast and states in every supported theme. A gradient or a solid background is a contextual choice.
- **Motion**: Add motion when it explains a transition or supplies useful feedback. Preserve reduced-motion behaviour, keyboard use and performance. A content page can work well without entrance animation.
- **Spatial Composition**: Fit density and hierarchy to the reading, comparison or work task. Symmetry, asymmetry, grids and single columns are available tools; novelty alone is not a requirement.
- **Backgrounds & Visual Details**: Give decoration a purpose and a budget. Preserve clear foreground content. Check blur, textures and overlays against real text, images, themes and lower-powered devices.

Consistency across a product is useful. Vary a treatment when the content or task needs a different hierarchy, not to make each screen look unrelated.

Use the smallest implementation that delivers the intended result. Preserve working components and avoid new dependencies for cosmetic changes without a clear benefit.

## Patterns to review in context

The patterns below are prompts for inspection. Their presence does not establish AI authorship or a design defect. Use the product's audience, task, brand and observed behaviour to judge each one. This rule governs every example and suggested alternative below.

Choose keep, rewrite, restyle or remove, and state the observed reason. Keep useful conventions. Rewrite unsupported or redundant content only to facts the owner can support. Restyle a useful element when hierarchy or consistency is the issue. Remove an element when it adds no useful information or obstructs the task. A token substitution without a reason is not an improvement.

For an eyebrow, identify whether it supplies audience, category, location, status or evidence context. "Case study" above a project title can stay; "Overview" can correctly name a summary. A label that repeats the heading can be removed. A meaningful label competing with the heading can be restyled, while preserving readable size and contrast. Common nouns, gerunds and uppercase text are not failures by themselves.

### Structure & Layout

**A landing sequence chosen before the content.** Check whether the hero, features, proof, pricing and action answer the visitor's questions in a useful order. A familiar sequence can work. Reorder or remove a section when its actual content is redundant, unsupported or misplaced.

**Dashboard metrics without a decision.** Identify what the user needs to notice and do. Four equal metric cards can suit four comparable measures; they can also hide the one urgent exception. Consider a feed, master-detail view, table, timeline or map when the task calls for it. Verify with realistic data, including zero values and long labels.

**Unconsidered navigation.** Sidebars, top navigation, tabs and bottom bars each support different tasks. Check discoverability, current location, hierarchy and available space before changing a familiar pattern. Preserve useful conventions and existing routes.

**Mixed-size grids without meaningful emphasis.** Check whether larger tiles deserve their prominence and whether visual order agrees with reading/focus order. Retain the grid when it helps comparison or expresses a real content hierarchy.

**Unexamined symmetry.** Centred sections and equal grids may suit comparable content. Check whether important differences remain visible. Use an uneven split or left-weighted composition when it clarifies a real hierarchy; retain symmetry when it supports the task.

### Spacing & Shape

**Spacing that hides relationships.** Use the established scale to group related controls and distinguish sections. Consistency is useful; adjust density where the task or content hierarchy warrants it. Diagnose the relationship that is unclear before changing spacing tokens.

**Radius without a component role.** Inspect whether corners support the established component system at different sizes. A consistent radius can be intentional. Change it only for a demonstrated hierarchy or system mismatch.

**Buttons and chips that are hard to distinguish.** A pill shape can be a coherent brand choice. Check whether action, selection and status remain distinguishable through the complete treatment and accessible semantics; radius alone does not determine that.

### Surface & Depth

**Depth without a hierarchy.** Check whether shadows, borders and surface colours communicate grouping and layering. Repeated shadows are acceptable when their roles are consistent. Remove or change them when they obscure boundaries or imply interactivity that is absent.

**Transparency without a benefit.** Test text and controls over actual background content in both themes. Blur/transparency can express layering; an expensive effect with no visible or useful result can be simplified.

**Animated background decoration.** Check its relationship to the brand, contrast, distraction, reduced-motion behaviour and runtime cost. Retain a suitable gradient background; remove motion that prevents a user reading or completing the task.

### Colour & Type

**Colour roles chosen inconsistently.** Framework colours can be suitable. Check the actual role, brand fit and contrast of each colour, and accompany status colours with other cues. Consolidate inconsistent uses into meaningful tokens.

**Gradient text or actions with uneven contrast.** Measure readability across the complete gradient and background. Check fallback rendering and brand consistency. Its colours or popularity do not determine whether it should stay.

**A theme that does not fit the task.** A dark technical interface can be appropriate. Inspect surface separation, reading comfort, status distinction and the product's intended identity. Do not force a light theme to make the site look different.

**Type without hierarchy.** A common font is not the problem to diagnose. Check whether headings, body text, numbers and controls are readable and appropriately distinguished. Preserve a suitable existing font; change the treatment or face when the task and brand justify it.

### Iconography & Decoration

**Icons chosen without checking their role.** Existing Lucide, Heroicons or other coherent libraries can remain. Check recognisable meaning, accessible names, optical consistency and whether text would communicate better. Replacing a familiar icon library solely for novelty adds work without establishing a benefit.

**Repeated icon containers.** Check whether they aid scanning or communicate meaningful categories. Keep a coherent pattern when useful; simplify containers that compete with the content or make different concepts look identical.

**Emoji used without checking meaning.** Emoji can fit an informal brand. Inspect platform rendering, spoken labels and whether the symbol is informative or decorative. Essential action meaning needs a reliable accessible name.

**Unsupported trust claims.** Confirm customer logos, reviews, metrics and permission against supplied evidence. Remove unsupported claims or request the missing fact. Never manufacture social proof to complete a layout.

### Motion

**Broad transitions.** Inspect which properties actually change and why. Prefer explicit transitions where broad rules animate unintended layout or delay feedback. Choose timing for the interaction and test reduced-motion settings; one duration is not a universal defect.

**Hover that promises the wrong action.** Check that interactive feedback matches what the element does and has a suitable keyboard equivalent. Avoid hover-only access to essential information. A consistent hover treatment can stay when it communicates consistently.

### Content & Copy

**Labels that obscure the action.** State what a control does and what commitment it makes. Keep explanatory text when it helps the decision. "Start trial" can be clearer than either "Start" or a vague promotional sentence, depending on the actual action.

**Sample content mistaken for production data.** Remove unintended placeholders from released surfaces. For prototypes, label synthetic fixtures and exercise long names, empty values, errors and uneven counts. Do not pass invented fixtures off as real customers or results.

### Working density

Inspect interfaces at the volume people actually use. A dense table or settings list can be appropriate, provided reading, keyboard access and target requirements still work. Keep the content needed for the task visible and preserve useful comparisons. Evaluate a 50-row administration view as a work surface, not by the visual rhythm of a marketing page.

## Verify the change

Compare the changed component with the supplied brief and neighbouring components. Check actual content, supported widths/themes, zoom, focus and relevant interaction states. Record visual evidence at the same revision as the source. Preserve genuine business claims and approved assets. During a production audit, report findings without editing the app; perform implementation only in the authorised fix phase.
