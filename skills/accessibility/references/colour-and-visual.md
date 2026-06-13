# Colour and visual accessibility

What low-vision, colour-blind, and in fact most ordinary users need in order to perceive content. These issues affect a very wide group, not a small minority: poor contrast hurts anyone on a phone in sunlight, colour-only cues fail the ~8% of men with colour-blindness, and small fixed text excludes anyone who needs to zoom. The fixes are concrete and measurable.

## Colour contrast

Text must have enough contrast against its background to be readable. WCAG AA, the usual target, sets measurable minimums:
- **Normal text:** at least 4.5:1 contrast ratio.
- **Large text** (roughly 18pt+, or 14pt+ bold): at least 3:1.
- **Meaningful non-text** (icons, form borders, focus indicators, chart elements that carry meaning): at least 3:1.

Low-contrast text, light grey on white, mid-grey on a coloured background, a faint placeholder used as a label, is one of the most common failures, and it is fully measurable: contrast-checker tools (and browser DevTools) give the exact ratio. The frequent fast-built mistake is choosing text colours for how they look on the designer's good screen, where subtle grey reads fine, and not checking the ratio, where it fails for many users and in many conditions.

This overlaps `frontend-design`: the aesthetic choice of colours must clear the contrast threshold. A design that looks elegant in light grey but fails contrast is not finished; the colours need adjusting until they both look right and pass.

## Don't rely on colour alone

Meaning conveyed only by colour is invisible to colour-blind users and to anyone in conditions that wash colour out. The classic failures:
- Red text for errors / green for success with no other indicator, a red-green colour-blind user cannot tell them apart.
- A status shown only as a coloured dot.
- A required field marked only by red.
- Chart series distinguished only by colour.

The fix is to pair colour with another cue: an icon, a text label, a shape, a pattern. Colour can reinforce meaning, it just cannot be the *only* carrier of it. The test: convert the interface to greyscale, is all the meaning still there?

## Text resize and zoom (reflow)

Users with low vision often zoom the page or increase text size. The interface must remain usable when they do:
- Text should resize/zoom without being clipped, overlapping, or disappearing.
- The layout should reflow to accommodate larger text rather than breaking (content cut off, horizontal scrolling appearing, elements overlapping).
- Avoid fixing text at sizes that cannot grow, or layouts so rigid that zoom destroys them.

WCAG expects content to work up to 200% zoom without loss of content or function. The common failure is a rigid pixel-perfect layout that shatters when text grows.

## Other visual considerations
- **Don't convey information by sensory characteristic alone** ("click the round button on the right"), which fails users who cannot perceive shape/position.
- **Respect reduced-motion preferences:** users who set "reduce motion" (vestibular disorders, distraction sensitivity) should not be subjected to large animations; honour the `prefers-reduced-motion` setting.
- **Text over images** needs enough contrast against the busiest part of the image, not just the average.

## What to flag
- Text (or meaningful UI) below the contrast thresholds, with the measured ratio.
- Meaning carried by colour alone (status, errors, required fields, charts).
- Layouts that break or clip when text is zoomed to 200%.
- Large motion with no reduced-motion alternative.

## The honest framing
These are the most measurable accessibility items, contrast is a number, colour-alone is a greyscale test, zoom is a thing you can just try. They also help far more than the disabled minority: everyone benefits from readable contrast and a layout that survives zoom. Check the contrast ratios against AA, make sure no meaning rides on colour alone, and confirm the layout reflows under zoom. Concrete, testable, and high-impact for a wide group of users.

## Connection to other references
`frontend-design` overlaps directly, the palette and type choices must clear these thresholds, so accessibility is a constraint on the visual design, not separate from it. Focus indicators (keyboard-and-focus) must also meet the non-text contrast minimum.
