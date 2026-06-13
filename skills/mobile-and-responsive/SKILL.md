---
name: mobile-and-responsive
description: "Use this skill to build or assess how a web interface behaves across screen sizes and on touch devices: responsive layout, touch targets and gestures, viewport handling, mobile-specific input and performance constraints, and the cross-device testing that catches what a desktop build misses. Trigger on phrases like 'responsive', 'mobile', 'mobile-friendly', 'breakpoints', 'media queries', 'touch targets', 'viewport', 'doesn't work on my phone', 'looks broken on mobile', 'tablet', 'small screen', 'fixed width', 'horizontal scroll on mobile', 'tap', 'mobile layout', or when an interface built on a desktop needs to work on phones and tablets too. This is the works-on-every-screen lens, the cross-device behavioural side of frontend. It does not cover visual design choices (use frontend-design) or load speed in general (use performance, though mobile performance overlaps). Defaults to a prioritised assessment of where the UI breaks across devices and the fixes. Applies to any web frontend."
---

# Mobile and Responsive

The lens for one question: **does the interface work on the screen and device the user actually has, not just the one it was built on?** Most development happens on a large desktop screen with a mouse, while most real-world web traffic is on phones, with small screens, touch input, variable viewports, and tighter constraints. An interface that is only ever seen on the developer's monitor ships with mobile breakage the developer never witnesses: content overflowing, tap targets too small to hit, layouts assuming width that is not there, inputs that fight the on-screen keyboard. This skill is the cross-device behavioural discipline that makes an interface usable everywhere.

It does not cover visual design taste (`frontend-design`) or general load speed (`performance`, though mobile performance constraints overlap). It is the does-it-work-on-every-screen lens.

## The cardinal principle

**Build and test for the small touch screen, because that is what most users have and it is the harder constraint; scaling up to desktop is easier than cramming down to mobile.** The classic failure is building desktop-first on a big screen and treating mobile as an afterthought, which produces interfaces that technically "respond" but are awkward or broken on phones, the devices most people use. Designing for the constrained case first (small viewport, touch, thumb reach) and progressively enhancing for larger screens produces interfaces that work everywhere, because the hard case was solved first.

## Assessment by default, build guidance when asked

Default to assessing where the interface breaks or degrades across screen sizes and on touch, in priority order with fixes. Give implementation guidance (responsive layout approach, breakpoints, touch handling) when asked to build rather than assess.

## The areas, in priority order

### 1. Responsive layout (the core)
The interface must adapt its layout to the available width, not assume one size.
- **No fixed widths that force horizontal scrolling** on small screens, the signature mobile breakage. Content should reflow to fit the viewport.
- **Fluid, flexible layouts** (relative units, flexbox/grid that wrap and reflow) rather than pixel-fixed layouts built for one width.
- **Breakpoints** that adapt the layout at sensible sizes (a multi-column desktop layout collapsing to single-column on mobile), driven by content needs, not specific device models.
`references/responsive-layout.md` covers fluid layout, breakpoints, avoiding fixed widths, and mobile-first ordering.

### 2. Touch targets and interaction
Touch is not a mouse; fingers are bigger and less precise than a cursor.
- **Tap targets large enough** to hit reliably (guidelines put a minimum around 44x44px), and spaced so adjacent targets are not mis-tapped. Tiny links/buttons designed for a mouse fail on touch.
- **No hover-dependent interactions** with no touch equivalent (a menu that only opens on hover is unusable on touch, which has no hover).
- **Touch gestures** (swipe, pinch) where appropriate, and not breaking native ones (scrolling, zoom).
`references/touch-and-interaction.md` covers target size/spacing, the hover problem, and touch gestures.

### 3. Viewport and the mobile rendering basics
The settings and behaviours that make a page render correctly on mobile at all.
- **The viewport meta tag** (`width=device-width, initial-scale=1`), without it, mobile browsers render the page at desktop width and shrink it, producing tiny unreadable content. A frequent, basic omission.
- **Not disabling zoom** (`user-scalable=no`), which harms accessibility (low-vision users need to zoom; overlaps `accessibility`).
- Handling the dynamic viewport (mobile browser chrome that appears/disappears, the `100vh` problem on mobile) and safe areas (notches).
`references/viewport-and-rendering.md` covers the viewport tag, zoom, dynamic viewport height, and safe areas.

### 4. Mobile input and forms
Forms on mobile have constraints and opportunities desktop does not.
- **Correct input types** (`type="email"`, `tel`, `number`, etc.) so mobile shows the right keyboard (a numeric pad for numbers, an @ for email), a big usability win that is cheap to get right.
- **Inputs not obscured by the on-screen keyboard**; the focused field should stay visible when the keyboard opens.
- **Touch-friendly form controls** (adequately sized, easy to tap selects/checkboxes), and avoiding tiny fiddly controls.
`references/mobile-input.md` covers input types/keyboards, keyboard-obscuring, and touch-friendly controls.

### 5. Mobile performance and network constraints
Phones are slower and on worse networks than the developer's machine; the `performance` skill's concerns hit hardest here.
- Mobile devices have less CPU and memory (heavy JS hurts more) and worse, metered networks (large assets hurt more). The performance disciplines matter most on mobile.
- Test under throttled mobile conditions, not just desktop on fast wifi (the measure-under-realistic-conditions point from `performance`).
- Be mindful of data usage and battery (large media, constant polling).
`references/mobile-performance.md` covers the amplified performance constraints on mobile and testing realistically (cross-references `performance`).

### 6. Cross-device testing
How to actually know it works, rather than assuming from the desktop view.
- **Test on real devices and at real sizes**, not only the desktop browser at full width. The browser's device-emulation is a start but misses touch feel, real performance, and platform quirks.
- Test the range: small phone, large phone, tablet, desktop; portrait and landscape; iOS and Android (which differ).
- Test touch interactions by actually touching, and forms with the real on-screen keyboard.
`references/cross-device-testing.md` covers emulation vs real devices, the size/orientation/platform matrix, and a practical routine.

## How to report
Order by severity: things that make the interface unusable on mobile (horizontal-scroll-forcing fixed widths, missing viewport tag, un-tappable targets, hover-only controls) before degradations (slightly tight spacing). For each: the device/size where it breaks, what the user experiences, the fix. Frame around "what happens on a phone, on touch, on a small screen", the conditions a desktop build never exercises. Note what needs real-device testing to confirm.

## Scoping
Match to the actual audience. An internal tool used only on desktops has little mobile need, say so. A public consumer app, where mobile is likely the majority of traffic, must work well on phones, and there the small-screen, touch case is the primary one, not an afterthought. The honest output for most public fast-built apps is "it was built and tested on desktop; on a phone it has horizontal scroll / tiny tap targets / a missing viewport tag / hover-only menus, fix those and it becomes usable where most of your users actually are."

## Skills this leans on
- `frontend-design`: the visual side; responsive behaviour is how that design adapts across sizes (the design must be conceived to flex)
- `performance`: mobile is where performance constraints bite hardest, the two overlap heavily on mobile
- `accessibility`: touch-target size and not-disabling-zoom are shared concerns; large targets and zoomability serve both
- `frontend-robustness`: handling varied conditions (orientation, viewport changes) overlaps defensive UI behaviour
