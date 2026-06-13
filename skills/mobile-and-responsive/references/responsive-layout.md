# Responsive layout

The core of cross-device work: the interface must adapt its layout to whatever width it is given, rather than assuming the one width it was built on. A layout that is fixed to desktop dimensions does not shrink gracefully, it overflows, forces horizontal scrolling, or clips, and that is the most common and most visible mobile breakage.

## No fixed widths forcing horizontal scroll

The signature failure: an element with a fixed pixel width wider than a phone screen (a 960px container, a fixed-width table, an image at its natural size) forces the whole page to scroll sideways on mobile. Horizontal scrolling on a normally-vertical page is almost always a bug and feels broken. Causes and fixes:
- Fixed pixel widths on containers, replace with fluid widths (percentages, viewport units, or max-width with width:100%).
- Content that does not wrap (long unbroken strings, wide tables, oversized images) overflowing the viewport, allow wrapping, make tables scroll within their own container or reflow, constrain images to their container.
- Elements positioned or sized assuming a wide canvas.

The test is simple: on a narrow viewport, is there horizontal scroll? If so, something is wider than the screen and needs to flex.

## Fluid, flexible layouts

Build layouts that flow rather than sit at fixed sizes:
- **Relative units** (%, rem, viewport units, fr in grid) over fixed pixels for layout dimensions, so things scale with the available space.
- **Flexbox and grid** that wrap and reflow, a row of cards that becomes a single column when there is not room, a grid that drops columns as width shrinks.
- **max-width with fluid width** so content fills small screens but does not stretch absurdly wide on large ones.
- Images and media constrained to their container (`max-width: 100%`) so they never overflow.

## Breakpoints

Breakpoints are the widths at which the layout changes shape (e.g. a three-column desktop layout collapsing to one column on mobile), implemented with media queries (or container queries). Principles:
- **Drive breakpoints by content, not specific devices.** Add a breakpoint where the layout starts to look cramped or awkward, not at "iPhone width" specifically, device sizes change constantly and chasing them is futile. The right breakpoint is where the content needs to reflow.
- **A few well-chosen breakpoints** usually suffice (roughly: phone, tablet, desktop), not a dozen device-specific ones.
- Between breakpoints, the fluid layout handles the in-between sizes, breakpoints are for structural changes, fluidity for the rest.

## Mobile-first ordering

Writing the base styles for the small screen and layering enhancements for larger screens (via min-width media queries) tends to produce cleaner, more reliable responsive CSS than the reverse (desktop base, then overriding down). Mobile-first means the constrained case is the default and larger screens add to it, which matches the cardinal principle (solve the hard case first). It also tends to ship less for mobile (which needs less), helping mobile performance.

## What to flag
- Fixed pixel widths wider than a phone forcing horizontal scroll (the top finding, almost always a bug).
- Content (tables, images, long strings) that overflows the viewport instead of wrapping/constraining.
- Pixel-fixed layouts that do not reflow, rather than fluid flex/grid.
- Breakpoints chasing specific devices instead of responding to content; or no breakpoints at all on a layout that needs them.

## The honest framing
A responsive layout flexes to fit the screen it is on: fluid widths and wrapping flex/grid for the in-between, a few content-driven breakpoints for structural changes, and nothing fixed wider than the smallest screen so there is never horizontal scroll. Build mobile-first so the constrained case is the default rather than an afterthought. The defining mobile bug is the fixed-width element forcing sideways scroll, check for it on a narrow viewport, because it is invisible at desktop width where the page was built.

## Connection to other references
The visual design must be conceived to flex across these sizes, `frontend-design`. Mobile-first shipping less also helps `performance` and mobile-performance.md. Touch interaction at these sizes is touch-and-interaction.md; the viewport tag that makes mobile render at the right width is viewport-and-rendering.md.
