---
name: accessibility
description: "Use this skill to assess or build an interface so people with disabilities can use it: keyboard navigation, screen-reader support, colour contrast, focus management, semantic markup, ARIA, and forms that everyone can complete. Trigger on phrases like 'accessibility', 'a11y', 'WCAG', 'screen reader', 'keyboard navigation', 'colour contrast', 'aria', 'alt text', 'focus', 'is this accessible', 'can disabled users use this', 'accessibility audit', 'compliance' in a UI context, or when building or reviewing any user-facing interface that should be usable by everyone. This is the inclusive-interface lens, covering both the engineering of accessible UI and the obligations behind it (WCAG, and laws like the ADA, the Equality Act, the European Accessibility Act). It does not cover visual design aesthetics (use frontend-design) or load speed (use performance). Defaults to a prioritised assessment of barriers and the concrete fixes; recommends automated plus manual testing. Applies to any web or app interface."
---

# Accessibility

The lens for one question: **can people with disabilities actually use this interface?** Roughly one in five people has a disability, visual, motor, auditory, cognitive, and an interface that only works for a mouse-using, sighted, fast-reading user excludes them. Accessibility is both the right thing and, increasingly, a legal requirement (WCAG is the standard; the ADA, the UK Equality Act, and the European Accessibility Act give it teeth). Fast-built apps routinely ship inaccessible: clickable divs that keyboards cannot reach, images with no alt text, contrast too low to read, forms a screen reader cannot make sense of.

This does not cover visual aesthetics (`frontend-design`) or speed (`performance`), though it overlaps with both (semantic, accessible markup is also cleaner markup). It is the can-everyone-use-it lens.

## The cardinal principle

**Build on semantic HTML and the keyboard, and most accessibility follows; reach for ARIA only to fill genuine gaps.** The largest single source of inaccessible interfaces is non-semantic markup, divs and spans wired up with click handlers instead of real buttons, links, and form controls. A real `<button>` is focusable, keyboard-operable, and announced correctly by a screen reader for free; a `<div onclick>` is none of those and needs a pile of ARIA and JS to imitate what the button gave you natively. Use the right element first. ARIA is a patch for when no native element fits, not a default.

## Assessment by default, with testing guidance

Default to assessing barriers in priority order with concrete fixes. Recommend the right mix of testing: automated tools catch a meaningful fraction quickly, but the majority of real barriers are only found by manual testing (keyboard-only, actual screen reader), so never claim "accessible" on an automated pass alone.

## The standard: WCAG, briefly

WCAG (Web Content Accessibility Guidelines) is the reference standard, organised around four principles, content must be Perceivable, Operable, Understandable, and Robust (POUR). Conformance levels are A, AA, AAA; **AA is the usual target** and what most laws effectively require. You do not need to memorise WCAG to build accessibly; the areas below cover what matters in practice and map to it.

## The areas, in priority order

### 1. Semantic structure and markup (the foundation)
Get this right and most else follows; get it wrong and nothing else can fully compensate.
- Real interactive elements: `<button>` for actions, `<a>` for navigation, real form controls, not divs/spans with handlers.
- Proper heading hierarchy (one h1, logical nesting) and landmarks (nav, main, header) so structure is navigable.
- Lists, tables, and form elements marked up as what they are, so assistive tech conveys their meaning.
`references/semantic-structure.md` covers native elements, headings, landmarks, and when structure breaks assistive tech.

### 2. Keyboard accessibility
Everything operable without a mouse. Motor-impaired users, screen-reader users, and many others navigate by keyboard.
- Every interactive element reachable and operable by keyboard (Tab, Enter/Space, arrows where appropriate).
- Visible focus indicator so keyboard users can see where they are (never remove focus outlines without replacing them).
- Logical focus order; no keyboard traps (focus that cannot be moved out of a widget).
`references/keyboard-and-focus.md` covers keyboard operability, focus order, focus management in dynamic UI, and traps.

### 3. Screen-reader support and text alternatives
What non-visual users receive. The interface must convey through text/semantics what sighted users get visually.
- Alt text on meaningful images; empty alt on decorative ones (not missing, explicitly empty).
- Labels on all form controls, programmatically associated, not just visually adjacent.
- Accessible names for icon-only buttons and controls.
- Dynamic updates announced (live regions) so screen-reader users learn of changes they cannot see.
`references/screen-readers-and-text.md` covers alt text, labels, accessible names, and announcing change.

### 4. Colour and visual accessibility
What low-vision, colour-blind, and many ordinary users need to perceive content.
- Sufficient colour contrast for text (WCAG AA: 4.5:1 normal text, 3:1 large) and for meaningful UI elements.
- Not relying on colour alone to convey meaning (the red/green-only status that colour-blind users cannot distinguish).
- Text that can be resized/zoomed without breaking the layout.
`references/colour-and-visual.md` covers contrast ratios, colour-alone failures, and zoom/reflow.

### 5. Forms and inputs
Where accessibility most directly determines whether a task can be completed.
- Every input has an associated label; required fields and formats communicated non-visually.
- Errors identified in text (not colour alone), associated with the field, and clearly described.
- Instructions and validation conveyed to assistive tech, not just shown visually.
`references/forms-and-inputs.md` covers labelling, error handling, and accessible validation.

### 6. Testing accessibility
How to actually know, rather than assume.
- Automated tools (axe, Lighthouse, etc.): fast, catch a real but limited share (missing alt, low contrast, missing labels). Necessary, not sufficient.
- Manual keyboard test: unplug the mouse, can you do everything?
- Actual screen-reader test: the only way to know the non-visual experience.
`references/testing-accessibility.md` covers the automated/manual split, what each catches, and a practical testing routine.

## How to report
Order by barrier severity: things that make a task impossible for some users (keyboard-inoperable controls, unlabelled forms, missing alt on essential images) before things that make it harder (minor contrast, focus-order quirks). For each: the barrier, who it excludes, the WCAG-aligned fix. Be honest that an automated scan is a floor, not proof; note what needs manual/screen-reader testing to confirm.

## Scoping
Match to reach and obligation. A throwaway internal tool used by a known team has lighter obligations than a public consumer service (which likely has legal duties under the ADA/Equality Act/EAA). But the foundational items, semantic markup, keyboard operability, labels, contrast, are cheap, benefit everyone, and should be the default for anything user-facing. The honest output for most apps is "the markup and keyboard support are the real gaps; fix the non-semantic controls, add the missing labels and alt text, fix contrast, and you have cleared the barriers that actually exclude people."

## Skills this leans on
- `frontend-design`: the visual/UX side; accessibility ensures that experience reaches everyone (contrast and focus styling live at the overlap)
- `performance`: semantic markup overlaps; both benefit from clean structure
- `testing-strategy`: accessibility checks can be part of the test/CI suite (automated a11y tests)
