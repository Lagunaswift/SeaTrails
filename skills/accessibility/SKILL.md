---
name: accessibility
description: "Use this skill to assess or build an interface so people with disabilities can use it: keyboard navigation, screen-reader support, colour contrast, focus management, semantic markup, ARIA, and forms that everyone can complete. Trigger on phrases like 'accessibility', 'a11y', 'WCAG', 'screen reader', 'keyboard navigation', 'colour contrast', 'aria', 'alt text', 'focus', 'is this accessible', 'can disabled users use this', 'accessibility audit', 'compliance' in a UI context, or when building or reviewing any user-facing interface that should be usable by everyone. This is the inclusive-interface lens, covering both the engineering of accessible UI and the obligations behind it (WCAG, and laws like the ADA, the Equality Act, the European Accessibility Act). It does not cover visual design aesthetics (use frontend-design) or load speed (use performance). Defaults to a prioritised assessment of barriers and the concrete fixes; recommends automated plus manual testing. Applies to any web or app interface."
---

# Accessibility

Assess whether people with disabilities can complete the intended tasks. Prefer native semantic controls, then verify actual keyboard, visual and assistive-technology behaviour. Good semantics help; they do not by themselves establish accessibility.

## Assessment by default

Run a read-only assessment unless changes are requested. Use **WCAG 2.2 Level AA as the working technical target**, unless the project specifies another applicable standard. Identify the version, scope and any contractual or legal requirement separately; WCAG conformance is not a universal legal verdict.

The checks below are a practical entry point, not the full standard. For a conformance assessment, review all applicable criteria and complete processes. Do not infer compliance from a clean automated scan or a sample of pages.

## Areas to assess

### 1. Semantics and structure

Use real buttons for actions, links for navigation, associated form labels, meaningful landmarks and appropriate list/table markup. Headings should explain the content hierarchy. A single primary H1 is a useful convention; its count alone is not a WCAG pass/fail test. Check document and passage language, page titles and a way to bypass repeated navigation.

Read `references/semantic-structure.md`.

### 2. Keyboard, focus and pointer interaction

Verify complete tasks by keyboard: logical order, visible focus, appropriate widget behaviour, escapable dialogs and sensible focus after route/state changes. Sticky headers, banners and overlays must not entirely obscure a focused component. Check target size and permitted exceptions, and alternatives to dragging.

Read `references/keyboard-and-focus.md` and `references/wcag-22-checks.md`.

### 3. Screen readers and alternatives

Check meaningful image alternatives, explicit empty alternatives for decorative images, accessible control names, states and status messages. Use a real screen reader/browser combination for representative flows when available. Captions, transcripts and audio description require an applicable media assessment; a text/ARIA scan does not cover them.

Read `references/screen-readers-and-text.md`.

### 4. Visual access and adaptability

Measure applicable text and non-text contrast, avoid colour-only meaning, and test text resizing, narrow reflow and text-spacing overrides separately. Respect reduced-motion preferences and inspect moving, flashing or timed content against the applicable criteria. Do not remove essential information when changing a visual treatment.

Read `references/colour-and-visual.md`.

### 5. Forms and authentication

Inspect labels, instructions, autocomplete purpose, error association, recovery and success announcements. Check financial/data submissions for appropriate review or correction. Password managers, paste and accessible alternatives matter; adding a password-visibility toggle alone does not make authentication accessible. Repeated information and time limits also need review.

Read `references/forms-and-inputs.md` and `references/wcag-22-checks.md`.

### 6. Verification and coverage

Combine automated checks with keyboard, visual/reflow and screen-reader checks. Record routes, states, viewport, tool versions and browser/assistive technology actually exercised. Mark unavailable or incomplete checks as limitations. Add meaningful regression coverage where a demonstrated barrier warrants it, rather than treating a tool installation as a required feature.

Read `references/testing-accessibility.md`.

## How to report

Describe the observed barrier, affected task/users, reproduction evidence, applicable criterion and smallest coherent remedy. Prioritise blocked critical tasks and widespread barriers; do not grade severity from a criterion label alone. Distinguish an observed failure from missing verification. A recommendation beyond AA should be labelled as such, not presented as an AA violation.

## Sources and scope

References use the [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) and [WAI evaluation guidance](https://www.w3.org/WAI/test-evaluate/), checked 9 November 2026. Recheck current standards and project obligations when making a formal conformance claim. Internal tools also need an access assessment; a small audience does not establish that users have no access needs.

## What to produce under a production-audit

Standalone, report as prose per "How to report". As a lens under `production-audit`, emit findings in the canonical schema (`production-audit/references/finding-schema.md`) instead, appended to the run's `raw-findings.jsonl` as discovered: prefix `A11Y`, category `accessibility` — or `frontend` where the failure is interaction robustness rather than access. The schema overrides the prose format above.

## Skills this leans on
- `frontend-design`: the visual/UX side; accessibility ensures that experience reaches everyone (contrast and focus styling live at the overlap)
- `performance`: semantic markup overlaps; both benefit from clean structure
- `testing-strategy`: accessibility checks can be part of the test/CI suite (automated a11y tests)
