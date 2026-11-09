# Colour, motion and visual adaptability

Record the actual component, state, theme and background when measuring a visual barrier. A screenshot or a nominal design token alone may not describe the rendered contrast.

## Contrast and meaning

For WCAG 2.2 AA, normal text generally needs 4.5:1 and large text 3:1; large text means at least 18 pt or 14 pt bold. Meaningful non-text UI/graphics generally need 3:1 against adjacent colours. Apply the relevant exceptions, including inactive controls and purely decorative content, before declaring failure. Test text over imagery against the relevant background, and supported light/dark themes independently.

Colour must not be the sole carrier of status, errors, required fields or chart distinctions. Check labels, shapes or patterns that preserve the meaning without colour. A greyscale check can help inspection but does not itself establish conformance.

## Resize, reflow and spacing are separate checks

- **Resize text, 1.4.4:** test up to 200% without loss of content or functionality, applying the criterion's exceptions.
- **Reflow, 1.4.10:** inspect a 320 CSS-pixel-wide viewport for horizontal writing, or equivalent 400% zoom on a 1280 CSS-pixel-wide viewport. Avoid whole-page two-dimensional scrolling or lost content. Tables, maps and other content requiring two-dimensional layout can qualify for exceptions; contain necessary scrolling and preserve access.
- **Text spacing, 1.4.12:** apply the specified line, paragraph, letter and word spacing overrides and check clipping, overlap and missing controls. This does not require a custom text-size widget.

Record the viewport/zoom and tested state. Do not conflate a mobile screenshot or 200% browser zoom with all three checks.

## Motion and timed content

Inspect moving/auto-updating content, pause/stop/hide controls, flashing and time limits against their applicable criteria. Respect `prefers-reduced-motion`; test that a reduced-motion treatment preserves meaning and functionality. Distinguish AA requirements from enhanced recommendations such as animation-from-interaction controls.

## Sources checked 9 November 2026

[WCAG 2.2](https://www.w3.org/TR/WCAG22/) supplies the thresholds, definitions and exceptions. Recheck exact criteria when claiming a failure. Keyboard focus and pointer targets are covered in `keyboard-and-focus.md` and `wcag-22-checks.md`.
