# Viewport and mobile rendering basics

The settings and behaviours that make a page render correctly on a mobile browser at all. Some of these are one-line basics whose absence breaks mobile rendering entirely; others are subtler mobile-browser behaviours (disappearing chrome, notches) that cause layout glitches if ignored.

## The viewport meta tag (the basic that is often missing)

Mobile browsers, by default, assume pages were designed for desktop and render them at a wide virtual width (around 980px), then shrink the result to fit the screen, producing a zoomed-out page with tiny, unreadable text and controls. The fix is the viewport meta tag:

`<meta name="viewport" content="width=device-width, initial-scale=1">`

This tells the browser to render at the device's actual width, so a responsive layout (responsive-layout.md) actually fits the screen at a readable size. **Without it, even a perfectly responsive CSS layout renders zoomed-out and tiny**, because the browser never uses the real width. Its absence is a frequent, basic, high-impact omission, the responsive CSS is wasted without it.

## Do not disable zoom

The viewport tag can include `user-scalable=no` or `maximum-scale=1` to prevent the user pinch-zooming. **Do not do this.** It is a serious accessibility harm, low-vision users rely on zoom to read, and disabling it locks them out (`accessibility`, colour-and-visual / zoom). There is rarely a good reason to prevent zoom, and the cost to users who need it is high. Allow zooming.

## The dynamic viewport (the 100vh problem)

Mobile browsers have UI chrome (address bar, toolbars) that appears and disappears as the user scrolls, which changes the visible viewport height dynamically. This breaks the common assumption that `100vh` is the visible height:
- `100vh` on mobile often refers to the *largest* viewport (chrome hidden), so a "full-height" element sized at 100vh can be taller than the actually-visible area when the chrome is showing, content cut off, or a layout that jumps as the bar hides/shows.
- The fix: the newer dynamic viewport units (`dvh`, `svh`, `lvh`, small/large/dynamic viewport height) that account for this, or layout approaches that do not depend on an exact viewport height. Be aware that `100vh` is not "the visible screen height" on mobile.

## Safe areas and notches

Modern phones have notches, rounded corners, home indicators, and camera cutouts that intrude on the rectangular screen. Content placed at the very edges (especially full-bleed layouts, fixed headers/footers) can be obscured by these. The `env(safe-area-inset-*)` values let layouts respect the safe area (padding content away from the notch/indicator). For full-screen or edge-to-edge layouts, account for safe areas so controls are not hidden under the notch or home bar.

## Orientation
Phones and tablets rotate. A layout that only works in portrait (or only landscape) breaks when the user rotates. Responsive layout should handle both orientations; test both (cross-device-testing.md). Be especially careful with fixed-height assumptions, which orientation changes invalidate.

## What to flag
- Missing viewport meta tag (mobile renders zoomed-out and tiny, basic and high-impact, the page looks broken on every phone).
- `user-scalable=no` / disabled zoom (accessibility harm).
- `100vh` used as "visible height" causing cut-off or jumpy layout on mobile (use dynamic viewport units).
- Edge content obscured by notches/home indicator (no safe-area handling) on full-bleed layouts.
- Layout that breaks in one orientation.

## The honest framing
Start with the one-line basic: the viewport meta tag, without it, all the responsive CSS in the world renders zoomed-out and unreadable on mobile, and its absence is a common silent breakage. Never disable zoom (it locks out users who need it). Then handle the mobile-browser realities: `100vh` is not the visible height (use dynamic viewport units), and notches/home indicators intrude on edge content (use safe-area insets). These are small, specific fixes whose absence produces very visible mobile breakage.

## Connection to other references
The viewport tag is what makes responsive-layout.md actually work on mobile. Not-disabling-zoom is shared with `accessibility`. Dynamic-viewport and orientation handling overlap `frontend-robustness` (handling varied real conditions).
