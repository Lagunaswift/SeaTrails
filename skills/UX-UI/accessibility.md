# Accessibility

## 1. Why This Is Not Optional

Accessibility is not a feature. It is a quality bar. An interface that does not work with a keyboard, a screen reader, or for users with low vision is a broken interface. In many jurisdictions it is also a legal liability (ADA, EAA, EN 301 549).

The standards below target WCAG 2.1 Level AA, which is the legal and practical minimum.

---

## 2. Semantic HTML

Use the correct HTML element for each purpose. This is the single highest-impact accessibility practice because screen readers, keyboards, and assistive technologies rely on semantic meaning.

```
Navigation:  <nav>
Page structure: <header>, <main>, <footer>, <aside>
Sections: <section> with a heading
Headings: <h1> through <h6> in order (never skip levels)
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

- All buttons, links, inputs, and controls must be reachable via Tab.
- All actions must be triggerable via Enter or Space.
- All modals and menus must be closable via Escape.
- Tab order must follow visual order (left to right, top to bottom). Never use tabindex values greater than 0 — they break natural tab order.

### Focus Management

- **Visible focus indicator.** Every focusable element shows a clear outline when focused. The browser default is fine. If you override it for aesthetic reasons, replace it with something equally visible — a 2px ring in your brand colour, offset from the element. Never use `outline: none` without a replacement.
- **Focus trapping in modals.** When a modal opens, focus moves to the first focusable element inside. Tab cycles only within the modal. When the modal closes, focus returns to the element that opened it.
- **Focus on content changes.** When new content appears (toast notification, error message, dynamic section), move focus to it or announce it. Otherwise screen reader users do not know it appeared.

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
- Custom widgets that have no native HTML equivalent (tabs, accordions, tree views, comboboxes)
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
`assertive`: interrupts current speech (for errors and urgent alerts).

---

## 5. Colour and Contrast

### Contrast Ratios (WCAG AA)

- Normal text (below 18px or 14px bold): 4.5:1 contrast ratio against background.
- Large text (18px+ or 14px+ bold): 3:1 contrast ratio.
- UI components and graphical objects: 3:1 contrast ratio against adjacent colours.

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

### Minimum Size

Touch targets (buttons, links, inputs, interactive elements) must be at minimum 44x44px (WCAG) or 48x48px (Material Design recommendation). This is the tappable area, not the visible element — padding counts.

```
A 24px icon button with 12px padding on each side = 48px touch target. Accessible.
A 24px icon button with 4px padding = 32px touch target. Too small.
```

### Spacing

Touch targets need spacing between them so adjacent taps do not hit the wrong target. Minimum 8px between touch targets.

### Hit Area Expansion

For text links in prose, the text itself may be small. Expand the hit area with padding on the anchor element so it is easier to tap without adding visual bulk.

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

This disables animations for users who have indicated motion sensitivity (vestibular disorders, motion sickness). Do not remove functional transitions entirely — a near-instant transition (0.01ms) preserves state changes without motion.

### Autoplay

Never autoplay video or audio. If autoplay is essential (a media-focused product), provide an immediate and obvious pause/stop control. Autoplay motion (animated backgrounds, marquees) must also respect reduced motion.

### Flashing Content

Content that flashes more than 3 times per second can trigger seizures. Do not create flashing content. This is not a guideline — it is a safety issue.

---

## 8. Forms (Accessibility-Specific)

### Labels

Every input has a visible `<label>` associated via `for`/`id`. No exceptions.

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
[ ] Verify the page works at 200% zoom without horizontal scrolling.
[ ] Test with prefers-reduced-motion enabled. Do animations stop?
[ ] Are all images either decorative (alt="") or have descriptive alt text?
```

### Automated Testing

Run axe-core or Lighthouse accessibility audit in CI. These catch structural issues (missing alt text, missing labels, contrast failures). They do not catch interaction issues (focus management, keyboard behaviour, screen reader experience). Automated testing is necessary but not sufficient.
