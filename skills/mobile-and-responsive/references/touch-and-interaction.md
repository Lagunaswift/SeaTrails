# Touch targets and interaction

Touch is a different input from a mouse, and an interface designed for a precise cursor fails under imprecise fingers. The differences are concrete: fingers are large and inexact, there is no hover, and gestures differ from clicks. An interface that ignores this is technically functional but frustrating to use on the devices most people hold.

## Touch target size and spacing

A mouse cursor is a single pixel; a fingertip covers a sizeable area and lands imprecisely. So controls sized for a mouse are often too small to tap reliably:
- **Minimum target size:** guidelines put a comfortable minimum around 44x44px (Apple) / 48x48px (Android/Material), tap targets smaller than this are hard to hit accurately. Small icon buttons, tiny text links, compact controls designed at the desk fail here.
- **Spacing between targets:** adjacent tappable elements need enough gap that a finger does not hit the wrong one. Densely-packed links/buttons (fine with a mouse) cause mis-taps on touch. Space them, or enlarge their hit areas.
- The visible element can stay small if its *hit area* is enlarged (padding, an invisible larger touch region), the thing being tapped must be finger-sized even if the icon looks small.

This overlaps `accessibility`: adequate target size helps motor-impaired users too, the same fix serves both.

## The hover problem

Touch devices have no hover state, the finger is either not touching or tapping; there is no "pointer is over this but not pressing." So any interaction that depends on hover breaks on touch:
- **Hover-only menus/dropdowns** that open when the mouse moves over them have no way to open on touch (a tap may navigate instead, or do nothing). Provide a tap/click way to open them.
- **Content revealed only on hover** (tooltips, info that appears on mouseover, controls that show on hover) is unreachable on touch, the user never sees it. Make it available via tap, or always-visible, on touch.
- **Hover feedback** (a state change on mouseover) simply does not happen on touch; do not rely on it to communicate something essential.

The rule: hover can *enhance* on devices that have it, but nothing essential can depend on it, because touch devices do not. Design the interaction to work by tap first.

## Gestures and native behaviour

- **Support expected gestures** where they fit (swipe to dismiss, pull to refresh, pinch to zoom on images/maps), they are what touch users expect.
- **Do not break native gestures.** Hijacking scroll, disabling pinch-zoom (also an accessibility harm, viewport-and-rendering.md), or capturing swipes that the browser/OS needs frustrates users and breaks expectations. Intervene in native touch behaviour only deliberately and carefully.
- **Account for touch imprecision in interactions** (drag handles big enough to grab, sliders tappable, etc.).

## What to flag
- Tap targets below ~44x44px or packed too closely (mis-tap risk), the common touch finding.
- Hover-dependent interactions (menus, revealed content, essential feedback) with no touch equivalent (unusable on touch).
- Broken or hijacked native gestures (scroll, pinch-zoom) where unnecessary.
- Drag/precise interactions that assume mouse precision.

## The honest framing
Design interactions for the finger, not the cursor: targets big enough (~44px) and spaced enough to tap reliably, and never depend on hover, because touch devices do not have it (the hover-only menu is the classic break). Support the gestures touch users expect and do not hijack the native ones. These are not edge cases; touch is how most people use the web, so an interface that only works well with a mouse is broken for the majority. The fixes (bigger targets, tap-accessible everything, working gestures) also tend to help accessibility.

## Connection to other references
Target size and not-disabling-zoom are shared with `accessibility`. The hover-to-tap and gesture handling overlap `frontend-robustness` (handling the real input conditions). Viewport/zoom basics are viewport-and-rendering.md.
