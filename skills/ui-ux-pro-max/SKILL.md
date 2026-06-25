---
name: ui-ux-pro-max
description: "UI/UX design intelligence with searchable databases: 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 17 stacks. Includes a BM25 search engine and automated design system generator. Trigger on: plan UI, build landing page, choose color palette, recommend fonts, design system, style recommendation, chart type, dashboard design, e-commerce design, SaaS design, mobile app design, dark mode, glassmorphism, brutalism, minimalism, or any request where product-type-specific design data would improve the output. Complements the ux-ui-patterns skill (interaction design methodology) and frontend-design skill (visual aesthetics and anti-AI-patterns) by providing the data layer: curated palettes, font pairings, style catalogs, and design system generation."
---

# UI/UX Pro Max - Design Intelligence

Searchable design database with 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 17 technology stacks. BM25 search engine with automated design system generation.

**Complementary skills:**
- `ux-ui-patterns` — how interfaces should work (interaction design, states, forms, navigation)
- `frontend-design` — how interfaces should look (visual aesthetics, anti-AI-patterns)
- `ui-ux-pro-max` (this skill) — data-driven design decisions (palettes, fonts, style catalogs, design system generation)

## When to Apply

Use this skill when the task involves **UI structure, visual design decisions, interaction patterns, or user experience quality control**.

### Must Use

- Designing new pages (Landing Page, Dashboard, Admin, SaaS, Mobile App)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts)
- Choosing color schemes, typography systems, spacing standards, or layout systems
- Reviewing UI code for user experience, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand expression)

### Skip

- Pure backend logic, API/database design, infrastructure, DevOps, or non-visual automation

**Decision criteria**: If the task will change how a feature **looks, feels, moves, or is interacted with**, this skill should be used.

## Rule Categories by Priority

| Priority | Category | Impact | Domain | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|----------|----------|--------|--------|------------------------|------------------------|
| 1 | Accessibility | CRITICAL | `ux` | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | `ux` | Min size 44x44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| 3 | Performance | HIGH | `ux` | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | `style`, `product` | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons |
| 5 | Layout & Responsive | HIGH | `ux` | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom |
| 6 | Typography & Color | MEDIUM | `typography`, `color` | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, Gray-on-gray, Raw hex in components |
| 7 | Animation | MEDIUM | `ux` | Duration 150-300ms, Motion conveys meaning, Spatial continuity | Decorative-only animation, Animating width/height, No reduced-motion |
| 8 | Forms & Feedback | MEDIUM | `ux` | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront |
| 9 | Navigation Patterns | HIGH | `ux` | Predictable back, Bottom nav <=5, Deep linking | Overloaded nav, Broken back behavior, No deep links |
| 10 | Charts & Data | LOW | `chart` | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

## Quick Reference

### 1. Accessibility (CRITICAL)

- `color-contrast` - Minimum 4.5:1 ratio for normal text (large text 3:1)
- `focus-states` - Visible focus rings on interactive elements (2-4px)
- `alt-text` - Descriptive alt text for meaningful images
- `aria-labels` - aria-label for icon-only buttons; accessibilityLabel in native
- `keyboard-nav` - Tab order matches visual order; full keyboard support
- `form-labels` - Use label with for attribute
- `skip-links` - Skip to main content for keyboard users
- `heading-hierarchy` - Sequential h1-h6, no level skip
- `color-not-only` - Don't convey info by color alone (add icon/text)
- `dynamic-type` - Support system text scaling; avoid truncation as text grows
- `reduced-motion` - Respect prefers-reduced-motion
- `voiceover-sr` - Meaningful accessibilityLabel/accessibilityHint; logical reading order
- `escape-routes` - Provide cancel/back in modals and multi-step flows
- `keyboard-shortcuts` - Preserve system and a11y shortcuts

### 2. Touch & Interaction (CRITICAL)

- `touch-target-size` - Min 44x44pt (Apple) / 48x48dp (Material)
- `touch-spacing` - Minimum 8px/8dp gap between touch targets
- `hover-vs-tap` - Use click/tap for primary interactions; don't rely on hover alone
- `loading-buttons` - Disable button during async operations; show spinner or progress
- `error-feedback` - Clear error messages near problem
- `cursor-pointer` - Add cursor-pointer to clickable elements (Web)
- `gesture-conflicts` - Avoid horizontal swipe on main content; prefer vertical scroll
- `tap-delay` - Use touch-action: manipulation to reduce 300ms delay (Web)
- `standard-gestures` - Use platform standard gestures consistently
- `system-gestures` - Don't block system gestures
- `press-feedback` - Visual feedback on press (ripple/highlight)
- `haptic-feedback` - Use haptic for confirmations; avoid overuse
- `gesture-alternative` - Always provide visible controls for critical actions
- `safe-area-awareness` - Keep primary touch targets away from notch, Dynamic Island, gesture bar
- `no-precision-required` - Avoid requiring pixel-perfect taps on small icons
- `swipe-clarity` - Swipe actions must show clear affordance
- `drag-threshold` - Use a movement threshold before starting drag

### 3. Performance (HIGH)

- `image-optimization` - Use WebP/AVIF, responsive images (srcset/sizes), lazy load
- `image-dimension` - Declare width/height or use aspect-ratio to prevent layout shift
- `font-loading` - Use font-display: swap/optional to avoid FOIT
- `font-preload` - Preload only critical fonts
- `critical-css` - Prioritize above-the-fold CSS
- `lazy-loading` - Lazy load non-hero components via dynamic import / route splitting
- `bundle-splitting` - Split code by route/feature to reduce initial load
- `third-party-scripts` - Load third-party scripts async/defer
- `reduce-reflows` - Avoid frequent layout reads/writes; batch DOM reads then writes
- `content-jumping` - Reserve space for async content (CLS)
- `virtualize-lists` - Virtualize lists with 50+ items
- `main-thread-budget` - Keep per-frame work under ~16ms for 60fps
- `progressive-loading` - Use skeleton screens / shimmer instead of spinners for >1s operations
- `input-latency` - Keep input latency under ~100ms
- `debounce-throttle` - Use debounce/throttle for high-frequency events
- `offline-support` - Provide offline state messaging and basic fallback
- `network-fallback` - Offer degraded modes for slow networks

### 4. Style Selection (HIGH)

- `style-match` - Match style to product type (use `--design-system` for recommendations)
- `consistency` - Use same style across all pages
- `no-emoji-icons` - Use SVG icons (Heroicons, Lucide), not emojis
- `color-palette-from-product` - Choose palette from product/industry (search `--domain color`)
- `effects-match-style` - Shadows, blur, radius aligned with chosen style
- `platform-adaptive` - Respect platform idioms (iOS HIG vs Material)
- `state-clarity` - Make hover/pressed/disabled states visually distinct
- `elevation-consistent` - Use a consistent elevation/shadow scale
- `dark-mode-pairing` - Design light/dark variants together
- `icon-style-consistent` - Use one icon set/visual language across the product
- `system-controls` - Prefer native/system controls over fully custom ones
- `blur-purpose` - Use blur to indicate background dismissal, not as decoration
- `primary-action` - Each screen should have only one primary CTA

### 5. Layout & Responsive (HIGH)

- `viewport-meta` - width=device-width initial-scale=1 (never disable zoom)
- `mobile-first` - Design mobile-first, then scale up
- `breakpoint-consistency` - Use systematic breakpoints (375 / 768 / 1024 / 1440)
- `readable-font-size` - Minimum 16px body text on mobile
- `line-length-control` - Mobile 35-60 chars; desktop 60-75 chars
- `horizontal-scroll` - No horizontal scroll on mobile
- `spacing-scale` - Use 4pt/8dp incremental spacing system
- `container-width` - Consistent max-width on desktop
- `z-index-management` - Define layered z-index scale
- `fixed-element-offset` - Fixed navbar/bottom bar must reserve safe padding
- `scroll-behavior` - Avoid nested scroll regions
- `viewport-units` - Prefer min-h-dvh over 100vh on mobile
- `content-priority` - Show core content first on mobile
- `visual-hierarchy` - Establish hierarchy via size, spacing, contrast

### 6. Typography & Color (MEDIUM)

- `line-height` - Use 1.5-1.75 for body text
- `font-pairing` - Match heading/body font personalities
- `font-scale` - Consistent type scale (12 14 16 18 24 32)
- `contrast-readability` - Darker text on light backgrounds
- `text-styles-system` - Use platform type system
- `weight-hierarchy` - Bold headings (600-700), Regular body (400), Medium labels (500)
- `color-semantic` - Define semantic color tokens, not raw hex in components
- `color-dark-mode` - Dark mode uses desaturated/lighter tonal variants
- `color-accessible-pairs` - Foreground/background pairs must meet 4.5:1 (AA) or 7:1 (AAA)
- `truncation-strategy` - Prefer wrapping over truncation
- `number-tabular` - Use tabular/monospaced figures for data columns and prices
- `whitespace-balance` - Use whitespace intentionally to group related items

### 7. Animation (MEDIUM)

- `duration-timing` - 150-300ms for micro-interactions; complex transitions <=400ms
- `transform-performance` - Use transform/opacity only; avoid animating width/height/top/left
- `loading-states` - Show skeleton or progress indicator when loading exceeds 300ms
- `easing` - Use ease-out for entering, ease-in for exiting; avoid linear
- `motion-meaning` - Every animation must express a cause-effect relationship
- `spring-physics` - Prefer spring/physics-based curves for natural feel
- `exit-faster-than-enter` - Exit animations shorter than enter (~60-70% of enter duration)
- `stagger-sequence` - Stagger list/grid item entrance by 30-50ms per item
- `shared-element-transition` - Use shared element / hero transitions between screens
- `interruptible` - Animations must be interruptible by user input
- `no-blocking-animation` - Never block user input during an animation
- `gesture-feedback` - Drag, swipe, pinch must provide real-time visual response
- `motion-consistency` - Unify duration/easing tokens globally

### 8. Forms & Feedback (MEDIUM)

- `input-labels` - Visible label per input (not placeholder-only)
- `error-placement` - Show error below the related field
- `submit-feedback` - Loading then success/error state on submit
- `required-indicators` - Mark required fields
- `empty-states` - Helpful message and action when no content
- `toast-dismiss` - Auto-dismiss toasts in 3-5s
- `confirmation-dialogs` - Confirm before destructive actions
- `progressive-disclosure` - Reveal complex options progressively
- `inline-validation` - Validate on blur, not keystroke
- `input-type-keyboard` - Use semantic input types for correct mobile keyboard
- `undo-support` - Allow undo for destructive or bulk actions
- `error-recovery` - Error messages must include a clear recovery path
- `multi-step-progress` - Multi-step flows show step indicator; allow back navigation
- `form-autosave` - Long forms should auto-save drafts
- `error-clarity` - Error messages must state cause + how to fix
- `focus-management` - After submit error, auto-focus the first invalid field

### 9. Navigation Patterns (HIGH)

- `bottom-nav-limit` - Bottom navigation max 5 items; use labels with icons
- `back-behavior` - Back navigation must be predictable and consistent
- `deep-linking` - All key screens must be reachable via deep link / URL
- `nav-label-icon` - Navigation items must have both icon and text label
- `nav-state-active` - Current location must be visually highlighted
- `nav-hierarchy` - Primary nav vs secondary nav must be clearly separated
- `modal-escape` - Modals must offer a clear close/dismiss affordance
- `search-accessible` - Search must be easily reachable
- `state-preservation` - Navigating back must restore scroll position, filter state, input
- `gesture-nav-support` - Support system gesture navigation without conflict
- `adaptive-navigation` - Large screens prefer sidebar; small screens use bottom/top nav
- `navigation-consistency` - Navigation placement stays the same across all pages

### 10. Charts & Data (LOW)

- `chart-type` - Match chart type to data type (trend->line, comparison->bar, proportion->pie)
- `color-guidance` - Use accessible color palettes; avoid red/green only pairs
- `data-table` - Provide table alternative for accessibility
- `pattern-texture` - Supplement color with patterns so data is distinguishable without color
- `legend-visible` - Always show legend near the chart
- `tooltip-on-interact` - Provide tooltips/data labels on hover or tap
- `responsive-chart` - Charts must reflow or simplify on small screens
- `empty-data-state` - Show meaningful empty state when no data exists
- `large-dataset` - For 1000+ data points, aggregate or sample; provide drill-down
- `number-formatting` - Use locale-aware formatting for numbers, dates, currencies
- `touch-target-chart` - Interactive chart elements must have >=44pt tap area

---

## Search Engine

### Prerequisites

Python 3.x required (no external dependencies). On Windows, use `python` instead of `python3`.

### Step 1: Analyze User Requirements

Extract from user request:
- **Product type**: Entertainment, Tool, Productivity, E-commerce, SaaS, Portfolio, Healthcare, Finance, etc.
- **Target audience**: Consumer, enterprise, age group, usage context
- **Style keywords**: playful, vibrant, minimal, dark mode, content-first, immersive, etc.
- **Stack**: Detect from the target project (React, Next.js, Vue, Flutter, etc.)

### Step 2: Generate Design System

**Always start with `--design-system`** for comprehensive recommendations with reasoning:

```bash
python skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This searches product, style, color, landing, and typography domains in parallel, applies reasoning rules, and returns a complete design system: pattern, style, colors, typography, effects, and anti-patterns.

**Example:**
```bash
python skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Step 2b: Persist Design System

Save the design system for hierarchical retrieval across sessions:

```bash
python skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

Creates `design-system/MASTER.md` (global source of truth) and `design-system/pages/` for page-specific overrides.

With page-specific override:
```bash
python skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

### Step 3: Supplement with Detailed Searches

```bash
python skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

| Need | Domain | Example |
|------|--------|---------|
| Product type patterns | `product` | `--domain product "entertainment social"` |
| Style options | `style` | `--domain style "glassmorphism dark"` |
| Color palettes | `color` | `--domain color "entertainment vibrant"` |
| Font pairings | `typography` | `--domain typography "playful modern"` |
| Chart recommendations | `chart` | `--domain chart "real-time dashboard"` |
| UX best practices | `ux` | `--domain ux "animation accessibility"` |
| Google Fonts | `google-fonts` | `--domain google-fonts "sans serif popular variable"` |
| Landing structure | `landing` | `--domain landing "hero social-proof"` |
| React/Next.js perf | `react` | `--domain react "rerender memo list"` |
| App interface a11y | `web` | `--domain web "accessibilityLabel touch safe-areas"` |
| AI prompt / CSS keywords | `prompt` | `--domain prompt "minimalism"` |

### Step 4: Stack Guidelines

Get stack-specific implementation best practices:

```bash
python skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack <stack-name>
```

### Available Stacks

| Stack | Stack | Stack |
|-------|-------|-------|
| `react` | `nextjs` | `vue` |
| `nuxtjs` | `nuxt-ui` | `svelte` |
| `astro` | `swiftui` | `react-native` |
| `flutter` | `html-tailwind` | `shadcn` |
| `jetpack-compose` | `threejs` | `angular` |
| `laravel` | `javafx` | |

### Output Formats

```bash
# ASCII box (default)
python skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system

# Markdown
python skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Common Rules for Professional UI

### Icons & Visual Elements

| Rule | Standard | Avoid |
|------|----------|-------|
| No Emoji as Icons | Vector-based icons (Lucide, Heroicons, Phosphor) | Emojis for navigation, settings, or system controls |
| Vector-Only Assets | SVG or platform vector icons that scale cleanly | Raster PNG icons that blur or pixelate |
| Stable Interaction States | Color, opacity, or elevation transitions for press states | Layout-shifting transforms that cause jitter |
| Consistent Icon Sizing | Define icon sizes as design tokens (icon-sm, icon-md, icon-lg) | Mixing arbitrary values randomly |
| Stroke Consistency | Consistent stroke width within same visual layer | Mixing thick and thin stroke styles |
| Touch Target Minimum | 44x44pt interactive area minimum | Small icons without expanded tap area |

### Interaction

| Rule | Do | Don't |
|------|----|----- |
| Tap feedback | Pressed feedback (ripple/opacity/elevation) within 80-150ms | No visual response on tap |
| Animation timing | Micro-interactions 150-300ms with platform-native easing | Instant transitions or slow animations (>500ms) |
| Disabled state clarity | Disabled semantics, reduced emphasis, no tap action | Controls that look tappable but do nothing |
| Touch target minimum | Tap areas >=44x44pt (iOS) or >=48x48dp (Android) | Tiny tap targets |
| Gesture conflict prevention | One primary gesture per region | Overlapping gestures causing accidental actions |

### Light/Dark Mode Contrast

| Rule | Do | Don't |
|------|----|----- |
| Text contrast (light) | Body text contrast >=4.5:1 against light surfaces | Low-contrast gray body text |
| Text contrast (dark) | Primary text >=4.5:1, secondary >=3:1 on dark surfaces | Text that blends into background |
| Token-driven theming | Semantic color tokens mapped per theme | Hardcoded per-screen hex values |
| State contrast parity | Interaction states equally distinguishable in both themes | Defining states for one theme only |

### Layout & Spacing

| Rule | Do | Don't |
|------|----|----- |
| Safe-area compliance | Respect top/bottom safe areas for fixed elements | UI under notch, status bar, or gesture area |
| 8dp spacing rhythm | Consistent 4/8dp spacing system | Random spacing increments |
| Readable text measure | Limit line length on large devices | Edge-to-edge paragraphs on tablets |
| Scroll and fixed coexistence | Content insets for fixed bars | Scroll content obscured by sticky headers/footers |

---

## Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (use SVG)
- [ ] Consistent icon family and style
- [ ] Semantic theme tokens used consistently
- [ ] Pressed-state visuals do not shift layout bounds

### Interaction
- [ ] All tappable elements provide pressed feedback
- [ ] Touch targets meet minimum size
- [ ] Micro-interaction timing 150-300ms
- [ ] Disabled states visually clear and non-interactive
- [ ] Screen reader focus order matches visual order

### Light/Dark Mode
- [ ] Primary text contrast >=4.5:1 in both modes
- [ ] Secondary text contrast >=3:1 in both modes
- [ ] Both themes tested before delivery

### Layout
- [ ] Safe areas respected
- [ ] Scroll content not hidden behind fixed bars
- [ ] Verified on small phone, large phone, and tablet
- [ ] 4/8dp spacing rhythm maintained

### Accessibility
- [ ] All meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, and clear error messages
- [ ] Color is not the only indicator
- [ ] Reduced motion and dynamic text size supported
