# Accessibility

## 1. Why This Is Not Optional

Accessibility is not a feature. It is a quality bar. An interface that does not work with a keyboard, a screen reader, or for users with low vision is a broken interface. In many jurisdictions it is also a legal liability (ADA, EAA, EN 301 549).

Use WCAG 2.2 Level AA as the working technical target unless the project specifies another applicable standard. Legal and contractual obligations depend on scope and jurisdiction; this pattern reference is not a full conformance assessment. Use the `accessibility` lens for criterion-level findings and verification.

---

## 2. Semantic HTML

Use the correct HTML element for each purpose. This is the single highest-impact accessibility practice because screen readers, keyboards, and assistive technologies rely on semantic meaning.

```
Navigation:  <nav>
Page structure: <header>, <main>, <footer>, <aside>
Sections: <section> with a heading
Headings: <h1> through <h6> reflecting a meaningful content hierarchy
Lists: <ul>, <ol>, <li>
Buttons: <button> (not <div onclick>)
Links: <a href> (not <span onclick>)
Forms: <form>, <label>, <input>, <select>, <textarea>, <fieldset>, <legend>
Tables: <table>, <thead>, <tbody>, <th>, <td>
```

**The rule:** If a native HTML element does the job, use it. Do not recreate buttons with divs. Do not recreate dropdowns with custom JavaScript unless you also implement all keyboard behaviour and ARIA roles.

---

## 3. Keyboard Navigation

### Every Interactive Element Must Be Keyboard Accessible

- All functionality must be keyboard reachable and operable. Composite widgets may use one Tab stop and arrow-key navigation within the widget.
- Use the expected keys for each control: native buttons support Enter/Space; links use Enter; custom widgets follow their established keyboard pattern.
- Provide a keyboard escape/close path for dialogs and menus, using Escape where the interaction pattern expects it.
- Focus and DOM order should preserve meaning and operation, including the language reading direction. Avoid positive tabindex values that impose a competing order.

### Focus Management

- **Visible focus indicator.** Every focusable element shows a clear outline when focused. The browser default is fine. If you override it for aesthetic reasons, replace it with something equally visible — a 2px ring in your brand colour, offset from the element. Never use `outline: none` without a replacement.
- **Focus trapping in modals.** When a modal opens, focus moves to an appropriate element inside (sometimes a heading or explanatory text). Tab cycles only within the modal. When the modal closes, focus returns to the element that opened it.
- **Focus on content changes.** Use appropriate status announcements or focus management. Do not steal focus for every toast. Check that sticky headers, banners and overlays do not entirely obscure a focused component (WCAG 2.2 AA 2.4.11).

### Skip Links

Provide a "Skip to content" link as the first focusable element on every page. It jumps past the navigation to the main content. This lets keyboard users avoid tabbing through 20 nav items on every page load. Hide it visually until focused (position offscreen, bring on-screen on focus).

---

## 4. Screen Readers

### Labels

Every interactive element has an accessible name. For most elements, the visible text is the name. For elements without visible text:

- Icon-only buttons: `aria-label="Close"` or visually hidden text inside the button.
- Image buttons: `alt` attribute on the `<img>`.
- Inputs: `<label for="fieldId">` linked to the input. Every input has a visible label.
- Groups of controls: `<fieldset>` with `<legend>`.

### ARIA Roles and Attributes

ARIA supplements semantic HTML. It does not replace it.

**Use ARIA for:**
- Custom widgets when native elements do not meet the need (for example tabs or tree views); consider native details/summary for a simple disclosure
- Live regions that update dynamically (`aria-live="polite"` for non-urgent updates, `aria-live="assertive"` for urgent ones)
- States that are visually communicated but not semantically communicated (`aria-expanded`, `aria-selected`, `aria-current`)

**Do not use ARIA when native HTML works.** A `<button>` with text does not need `role="button"` and `aria-label`. The native element already provides both.

### Content Order

Screen readers read content in DOM order, not visual order. If your CSS reorders elements (flexbox order, grid placement, absolute positioning), the visual order and DOM order may diverge. Verify that the DOM order makes sense when read sequentially.

### Announcements for Dynamic Content

When content changes without a page load (AJAX updates, form validation, live data), screen readers need to be told. Use `aria-live` regions:

```html
<div aria-live="polite" aria-atomic="true">
  <!-- Content here is announced when it changes -->
  3 new messages
</div>
```

`polite`: announces at the next pause in speech (for non-urgent updates).
`assertive`: interrupts current speech; reserve it for genuinely urgent updates rather than every validation message.

---

## 5. Colour and Contrast

### Contrast Ratios (WCAG AA)

- Normal text: at least 4.5:1 contrast ratio against its background, applying the criterion exceptions.
- Large text (at least 18 pt, or 14 pt bold; approximately 24 or 18.7 CSS px respectively): at least 3:1.
- Meaningful UI components and graphical objects generally need 3:1 against adjacent colours; apply exceptions such as inactive controls and decorative content.

Test with a contrast checker tool (WebAIM Contrast Checker, browser dev tools). Do not eyeball it.

### Colour as Information

Never use colour as the only way to convey information.

```
Bad:  Red rows are errors, green rows are success (colourblind users cannot distinguish)
Good: Red rows with an ✕ icon, green rows with a ✓ icon
Good: Status column with text labels: "Error", "Success"
```

Charts must use patterns, labels, or other visual distinctions alongside colour.

### Dark Mode

If supporting dark mode, verify contrast ratios in both themes. Colours that pass in light mode may fail in dark mode and vice versa. Do not invert — redesign. Dark backgrounds need lighter text, and the contrast requirements are the same.

---

## 6. Touch Targets

### Size and Exceptions

WCAG 2.2 AA generally requires at least 24 × 24 CSS pixels under 2.5.8, with spacing, equivalent-control, inline, user-agent and essential exceptions. Evaluate the actual hit area and applicable exception before declaring failure. A 44 × 44 target is an enhanced/comfort target, not the universal AA minimum.

Padding can enlarge the hit area if it remains unobstructed and does not overlap adjacent controls. A 32-pixel target can satisfy AA; a 48-pixel target alone does not prove the whole control is accessible. There is no universal 8-pixel spacing rule in AA: check the criterion's geometry and the task's mis-tap risk. Inline prose links have an exception; avoid padding that disrupts reading layout.

### Pointer Alternatives

Where dragging is used, check a single-pointer alternative without dragging unless an exception applies. Keyboard access alone is not sufficient for that pointer requirement. Essential tooltip/menu content must also work without hover.

---

## 7. Motion and Animation

### Reduced Motion

Respect the user's `prefers-reduced-motion` system setting.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This is a possible starting point, not a universal fix. Inspect component behaviour: blanket animation overrides can break transition-driven logic or leave content hidden. Prefer reduced-motion treatments that preserve the final state and meaning, then test them. Assess pause/stop/hide and flashing requirements separately.

### Autoplay

Never autoplay video or audio. If autoplay is essential (a media-focused product), provide an immediate and obvious pause/stop control. Autoplay motion (animated backgrounds, marquees) must also respect reduced motion.

### Flashing Content

Content that flashes more than 3 times per second can trigger seizures. Do not create flashing content. This is not a guideline — it is a safety issue.

---

## 8. Forms (Accessibility-Specific)

### Labels

Every control needs an appropriate accessible name. Prefer persistent visible labels associated with inputs via `for`/`id`; use a visually hidden label only when the visible context remains clear. Do not use placeholder text as the only label.

```html
<label for="email">Email address</label>
<input id="email" type="email" name="email" />
```

For visually hidden labels (search inputs where the placeholder provides context), use a CSS visually-hidden class on the label, not `display: none` (which hides it from screen readers too).

### Error Announcements

When validation errors appear, screen readers need to know:

1. `aria-invalid="true"` on the errored field.
2. Error message linked via `aria-describedby`.
3. Error summary announced via `aria-live` region or by moving focus to the first error.

```html
<input id="email" aria-invalid="true" aria-describedby="email-error" />
<span id="email-error" role="alert">Please enter a valid email address</span>
```

### Autocomplete

Use the `autocomplete` attribute on form fields to help browsers and password managers fill them correctly:

```html
<input type="email" autocomplete="email" />
<input type="text" autocomplete="given-name" />
<input type="text" autocomplete="family-name" />
<input type="tel" autocomplete="tel" />
<input type="password" autocomplete="new-password" />
```

---

## 9. Testing

### Manual Testing Checklist

Before shipping any page:

```
[ ] Tab through the entire page. Can you reach every interactive element?
[ ] Is the focus indicator visible on every focused element?
[ ] Can you complete every task using only the keyboard?
[ ] Do modals trap focus and return it on close?
[ ] Does Escape close modals, dropdowns, and menus?
[ ] Test with a screen reader (VoiceOver on Mac, NVDA on Windows). Does it make sense?
[ ] Check colour contrast ratios (every text element and UI component).
[ ] Test 200% text resizing without lost content/function.
[ ] Test 320 CSS-pixel reflow (or equivalent 400% zoom), allowing legitimate two-dimensional content exceptions.
[ ] Test WCAG text-spacing overrides without clipping or lost controls.
[ ] Check password-manager/paste support, target-size exceptions and non-drag alternatives where applicable.
[ ] Test with prefers-reduced-motion enabled. Do animations stop?
[ ] Are all images either decorative (alt="") or have descriptive alt text?
```

### Automated Testing

Run axe-core or Lighthouse accessibility audit in CI. These catch structural issues (missing alt text, missing labels, contrast failures). They do not catch interaction issues (focus management, keyboard behaviour, screen reader experience). A clean scan is not proof of accessibility. Record the routes, states, tools and browser/assistive-technology combinations actually tested; report missing manual coverage explicitly.

## Sources checked 9 November 2026

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
- [WAI evaluation guidance](https://www.w3.org/WAI/test-evaluate/)

Recheck the applicable standard for a formal assessment. `accessibility/references/wcag-22-checks.md` supplies further WCAG 2.2 checks and exceptions.
