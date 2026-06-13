# Cross-device testing

How to actually know the interface works across devices, rather than assuming from the one view the developer sees. Nearly all the mobile and responsive failures in this skill share a root cause: they were never witnessed, because the app was only ever looked at on a desktop browser at full width. Testing across the real range is what surfaces them.

## Emulation versus real devices

- **Browser device-emulation** (devtools responsive mode, device presets) is the fast first pass: it shows the layout at different viewport sizes and catches the obvious responsive breakage (overflow, layout not reflowing). Use it constantly during development. But it has limits: it approximates screen size, not touch feel, not real device CPU, not platform-specific browser quirks, and not the on-screen keyboard's real behaviour.
- **Real devices** are where the truths emerge: actual touch precision and target size, real performance on real hardware (mobile-performance.md), how the on-screen keyboard actually behaves, iOS-vs-Android browser differences, notch/safe-area reality, gesture feel. At least some testing on a real phone (and tablet) is necessary; emulation alone gives false confidence.

The practical stance: emulate continuously for layout, but confirm on real devices for touch, performance, and platform behaviour before trusting it.

## The testing matrix

Cover the range, not one point:
- **Sizes:** small phone, large phone, tablet, desktop, and the awkward in-between widths (where layouts often break between breakpoints).
- **Orientation:** portrait and landscape (a layout can work in one and break in the other, viewport-and-rendering.md).
- **Platforms:** iOS (Safari) and Android (Chrome) differ in rendering, gestures, form controls, and quirks, test both, not just one. Safari in particular has behaviours that differ from Chrome.
- **Input:** actually use touch (tap the targets, try the gestures), and actually open forms with the on-screen keyboard, do not just look at the static layout.

You cannot test every device, but testing across this matrix (a couple of sizes, both orientations, both platforms, real touch) catches the vast majority of cross-device issues.

## A practical routine
1. **During build:** browser responsive mode, check the layout reflows cleanly across widths and at the in-between sizes (no horizontal scroll, no overflow).
2. **Interaction check:** on a real device (or careful emulation), verify tap targets are hittable, no hover-only traps, gestures work, forms get the right keyboard and the field stays visible.
3. **Performance check:** throttle CPU/network (or use a mid-range device) to confirm it is usable, not just fast on the desktop (mobile-performance.md).
4. **Platform check:** look at it on both iOS and Android, since they differ.
5. **Orientation check:** rotate, confirm both work.

## What to flag
- Evidence the interface was only tested at desktop width (the root cause behind most findings, no responsive/touch testing done).
- No real-device testing (touch, performance, platform quirks unverified, emulation-only false confidence).
- One platform only (iOS or Android, but not both).
- In-between sizes and landscape orientation never checked (common gap even when phone-portrait was).

## The honest framing
Almost every mobile and responsive bug exists because nobody looked at the app on the device where it breaks. Emulate continuously while building to catch layout problems, but confirm on real devices, both iOS and Android, with real touch and the real keyboard, because emulation cannot tell you how it actually feels or performs in a hand. Test the matrix (sizes, orientations, platforms, real input), not the single desktop view, and the failures this skill warns about stop being invisible. The cheapest fix for mobile breakage is to actually look at the thing on a phone.

## Connection to other references
This verifies everything else in the skill, layout (responsive-layout.md), touch (touch-and-interaction.md), viewport/orientation (viewport-and-rendering.md), forms (mobile-input.md), performance (mobile-performance.md). The realistic-conditions principle is shared with `performance`'s measuring approach.
