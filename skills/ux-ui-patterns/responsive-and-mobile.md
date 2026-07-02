# Responsive and Mobile Design

## 1. Breakpoint Strategy

### Standard Breakpoints

```
Mobile:      0 - 639px      (single column, stacked layout)
Tablet:      640px - 1023px  (2 columns, adapted navigation)
Desktop:     1024px - 1279px (full layout, sidebar visible)
Large:       1280px+         (full layout with wider content area)
```

These are starting points. Adjust based on your actual content and layout needs. The right breakpoint is where your layout breaks, not where a device category nominally starts.

### Mobile-First

Write CSS mobile-first: default styles are for mobile, then add complexity at larger breakpoints with min-width media queries. This ensures the mobile experience is the baseline, not an afterthought.

```css
/* Mobile (default) */
.container { padding: 16px; }

/* Tablet and up */
@media (min-width: 640px) {
  .container { padding: 24px; }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container { padding: 32px; max-width: 1200px; margin: 0 auto; }
}
```

### Content-Driven Breakpoints

In addition to device breakpoints, add breakpoints where your content needs them. If a card grid looks cramped at 700px, add a breakpoint at 700px. Do not force content into device-category breakpoints if the content tells you otherwise.

---

## 2. Touch Targets and Interaction

### Thumb Zones

On mobile, the user holds the phone with one hand and reaches with their thumb. The bottom-centre of the screen is easiest to reach. The top corners are hardest.

```
Placement priorities for primary actions:
  1. Bottom of screen (easiest reach)
  2. Centre of screen
  3. Top of screen (hardest reach — put secondary/infrequent actions here)
```

This is why bottom navigation works on mobile and why "floating action button" placement at the bottom-right persists — it sits in the natural thumb zone.

### Touch vs Pointer

Touch interactions differ from pointer (mouse) interactions:

- No hover state on touch. Anything revealed only on hover (tooltips, dropdown previews, hover menus) is inaccessible on touch. Provide tap alternatives.
- No right-click on touch. Context menus need a long-press equivalent or a visible menu trigger.
- Touch is imprecise. Fingers are larger than cursors. Spacing between touch targets matters more.
- Swipe gestures are discoverable only if the user already knows they exist. Never make a swipe gesture the only way to perform an action. Always provide a visible button alternative.

### Gesture Patterns

```
Tap:        Select, navigate, toggle
Long press: Context menu, secondary actions
Swipe left/right: Delete, archive, reveal actions (always with visible alternative)
Pull down:  Refresh
Pinch:      Zoom (images, maps)
```

Every gesture must have a visible alternative. Gestures are shortcuts, not primary interactions.

---

## 3. Mobile Navigation

### Bottom Navigation

For mobile-first apps with 3-5 primary sections. Always visible. Icon + label.

### Hamburger Menu

For content-rich sites where full navigation does not fit on screen. The hamburger icon is now universally recognised, but the content behind it has lower discoverability than visible navigation. Put only secondary navigation behind the hamburger. Keep primary actions visible.

### Tab Bar (Scrollable)

For content categories or filter groups. A horizontal scrollable row of tabs or chips below the header. Shows that more options exist beyond the visible area.

### Full-Screen Overlay

For complex navigation with multiple levels, search, and rich content. Triggered by hamburger or dedicated button. Takes over the full screen. Close button returns to content.

---

## 4. Adaptive Content

### What to Change

- **Layout:** Single column on mobile, multi-column on desktop. This is the baseline responsive change.
- **Navigation:** Bottom tabs or hamburger on mobile, sidebar or top nav on desktop.
- **Content density:** More whitespace and larger touch targets on mobile, denser layouts on desktop.
- **Feature parity:** Every feature available on mobile. If it works on desktop, it works on mobile. Do not remove features from mobile — adapt them.

### What Not to Change

- **Information architecture.** The same content in the same hierarchy. Do not reorganise navigation between mobile and desktop — users switch between devices and expect consistency.
- **Functionality.** Do not hide features on mobile because they are "too complex." Adapt the interface, not the capability.
- **Content.** Do not show less content on mobile. Show the same content in a single-column layout. The user did not choose mobile to see less.

### Truncation and Overflow

On narrow screens, long text needs handling:

```
Titles and headings: Truncate with ellipsis after 1-2 lines (CSS line-clamp)
Descriptions: Truncate after 2-3 lines with "Read more" link
Data values: Abbreviate if possible (£1.2M instead of £1,200,000)
Navigation labels: Use shorter labels on mobile ("Dashboard" → "Home") or icons with labels
Table cells: Truncate with tooltip on hover/tap
```

Never truncate without providing a way to see the full content (tooltip, expand, detail view).

---

## 5. Viewport Considerations

### Safe Areas

Modern phones have notches, rounded corners, and gesture bars that intrude into the viewport. Use CSS `env(safe-area-inset-*)` to prevent content from being hidden behind hardware features.

```css
body {
  padding-bottom: env(safe-area-inset-bottom);
}
```

This is critical for bottom navigation and fixed-position elements.

### Virtual Keyboard

When a mobile keyboard opens, it covers roughly half the screen. Ensure:
- The focused input scrolls into view above the keyboard
- Fixed-position elements (bottom navigation, floating buttons) move up or hide when the keyboard is open
- The form is usable with the reduced viewport

### Viewport Meta Tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

Do not disable zoom (`maximum-scale=1, user-scalable=no`). Users with low vision need to zoom. Disabling zoom is both an accessibility failure and a usability failure.

---

## 6. Performance on Mobile

### Why It Matters More

Mobile users are on slower connections (4G, spotty WiFi) and less powerful hardware. A desktop-optimised site that loads in 2 seconds may take 8 seconds on mobile. Performance is a UX concern, not just an engineering concern.

### Practices

- **Lazy load below-the-fold content.** Images, embeds, and heavy components that are not visible on initial load should load as the user scrolls.
- **Optimise images.** Use responsive images (srcset), modern formats (WebP, AVIF), and appropriate sizes. Do not serve a 2000px image to a 375px viewport.
- **Minimise JavaScript.** Large JS bundles block rendering. Code-split by route. Defer non-critical scripts.
- **Prioritise above-the-fold content.** The user should see something useful within 1.5 seconds on a 4G connection.

---

## 7. Responsive Patterns for Common Components

### Forms on Mobile

- Full-width inputs (no side-by-side fields on mobile)
- Large touch targets on submit buttons (full width, 48px+ height)
- Appropriate input types for mobile keyboards: `type="email"` shows @ key, `type="tel"` shows number pad, `type="url"` shows .com key, `inputmode="numeric"` for numbers without the spinner

### Modals on Mobile

Convert modals to full-screen sheets or bottom sheets on mobile. A centred floating modal on a 375px screen leaves almost no visible background context and is hard to dismiss.

Bottom sheets (content that slides up from the bottom) work well on mobile:
- Swipe down to dismiss
- Content scrolls within the sheet
- Backdrop tap also dismisses
- Maximum height: 90% of viewport (leave context visible at top)

### Tables on Mobile

See data-display.md section 1 for responsive table strategies.

### Cards on Mobile

Single column. Full width. Maintain visual hierarchy but reduce information density if needed — show the 3 most important pieces of information, put the rest behind "View details."
