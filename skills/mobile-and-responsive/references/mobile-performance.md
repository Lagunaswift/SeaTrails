# Mobile performance and network constraints

Mobile is where the `performance` skill's concerns hit hardest, so this reference is mostly a pointer to that skill with the mobile-specific amplification made explicit. The constraints a developer rarely feels on a fast desktop with fast wifi are the everyday reality for mobile users, and they make performance not a nice-to-have but a determinant of whether the app is usable at all.

## Why mobile amplifies every performance problem

- **Less CPU and memory.** Phones, especially mid-range and older ones (which a large share of users have), have far less processing power than a developer's machine. Heavy JavaScript that parses and executes instantly on a desktop can take many seconds on a mid-range phone, and the main-thread work that causes jank (`performance`, runtime-and-interaction) is much more punishing. The same bundle that is "fine" on desktop can make a phone sluggish or unresponsive.
- **Slower, variable, metered networks.** Mobile networks are slower, higher-latency, and less reliable than wired/wifi, and often metered (the user pays per MB). Large assets and bundles (`performance`, assets-and-media and javascript-bundle) that download quickly on fast wifi are slow and costly on mobile data. A heavy page is not just slow on mobile, it costs the user money and battery.
- **Battery.** Heavy CPU work, constant network activity, and frequent polling drain battery, a cost desktop users do not feel.

The upshot: the performance disciplines (small bundles, optimised assets, efficient rendering, caching) matter *most* on mobile, and an app that is acceptable on desktop can be unusable on a real phone on a real network.

## Test under realistic mobile conditions

This is the key practical point, and it echoes `performance`'s measure-under-realistic-conditions principle, sharpened for mobile:
- **Throttle CPU and network** to mid-range-phone, mobile-network levels (browser devtools can simulate both), not the developer's fast machine on fast wifi. The gap between "works on my setup" and "works on a real phone on 4G" is exactly where mobile performance bugs hide.
- **Test on an actual mid-range device** where possible, emulation approximates the network but not the real CPU constraints of a budget phone.
- Watch the metrics that matter on mobile: load time and interactivity under throttling, not the flattering desktop numbers.

## Mobile-specific performance practices
- **Ship less to mobile.** Mobile-first and responsive image serving (right-sized images per `performance`, assets-and-media) mean phones download less. Avoid loading desktop-weight assets on mobile.
- **Be frugal with data and battery:** avoid large autoplaying media, constant polling, and unnecessary background work on mobile.
- **Lazy-load** aggressively (off-screen content), so the constrained device does less up front.

## What to flag
- Heavy JS bundle / large assets that are merely slow on desktop but make mobile sluggish or expensive (escalate via `performance`).
- Performance only ever tested on desktop/fast wifi, never under throttled mobile conditions (so mobile slowness is unknown).
- Desktop-weight assets served to mobile (no responsive images, no mobile-appropriate loading).
- Data/battery-hungry behaviour (large autoplay media, constant polling) that punishes mobile users.

## The honest framing
Everything in the `performance` skill matters more on mobile, because phones have less power and worse, costlier networks than the machine the app was built on. The single practical habit: test under throttled CPU and network, not on your fast setup, because that gap is where mobile performance problems live, invisible until a real user on a real phone hits them. Ship less to mobile (right-sized assets, mobile-first), and remember that on mobile a heavy page does not just feel slow, it costs the user data and battery. For the actual techniques, this defers to `performance`; the mobile point is that the constraints are tighter and the testing must reflect them.

## Connection to other skills
This reference is the mobile-facing edge of `performance` (assets-and-media, javascript-bundle, runtime-and-interaction, measuring-performance), use that skill for the techniques. Shipping less to mobile ties to responsive-layout.md (mobile-first). The realistic-testing point also connects to cross-device-testing.md.
