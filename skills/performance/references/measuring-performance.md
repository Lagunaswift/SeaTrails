# Measuring performance

Performance work starts with measurement, always. The most common waste in optimisation is fixing something that was never the bottleneck. Before changing anything, find what is actually slow and how slow, then you know what is worth fixing and you can prove the fix worked.

## The user-facing metrics

These reflect what a user actually experiences, not internal numbers:

- **Largest Contentful Paint (LCP):** time until the largest content element (usually the main image or heading) renders. The headline load-speed number. Good is under ~2.5s; over ~4s feels slow.
- **Interaction to Next Paint (INP):** how quickly the page responds to user input. Captures jank and unresponsiveness after load.
- **Cumulative Layout Shift (CLS):** how much visible content jumps around during load (an image loading and shoving text down, a banner appearing). Low is good; high is the maddening "I tapped the wrong thing because it moved" experience.
- **First Contentful Paint (FCP):** when anything first appears. Earlier than LCP; the "is it even loading" moment.
- **Time to Interactive / Total Blocking Time:** when the user can actually use the page, not just see it. A page can paint fast but be frozen while JS executes.
- **Total transferred weight and request count:** how many bytes and round-trips before the page is usable.

## The tools

- **Lighthouse** (in Chrome DevTools or as CI): scores the Core Web Vitals and lists concrete issues with estimated savings. The fastest way to a prioritised list.
- **The Network waterfall** (DevTools Network tab): shows every request, its size, when it started, and what blocked it. This is where you see the 4MB image, the sequential request chain, the render-blocking script.
- **The Performance profiler** (DevTools): for runtime/interaction issues, shows what the main thread is doing and where time goes after load.
- **Bundle analysers** (for JS): show what is actually in the bundle and what is bloating it (see javascript-bundle).
- **Real-user monitoring (field data):** lab tools measure one run on your machine; field data (e.g. Chrome UX Report, or RUM in your analytics) measures real users on real devices and networks, which is what actually matters.

## Measure under realistic conditions

The single biggest measurement mistake: testing only on a fast machine on a fast connection (the developer's setup). Real users are often on mid-range phones on mobile networks, where a heavy bundle or large images hurt many times more. Use throttling (DevTools can simulate slow CPU and network) and test on the conditions your actual users have. A page that is fine on localhost can be unusable on a mid-range phone on 4G.

## Finding the dominant bottleneck

Most apps have one or two problems that dominate. The method:
1. Run Lighthouse for the prioritised list with estimated savings.
2. Look at the network waterfall for the biggest items and the longest chains.
3. Identify the single largest contributor to LCP (often one image or one blocking resource) and the total JS weight.
4. Fix the biggest thing, then measure again, the numbers should move. If they do not, you fixed the wrong thing.

## The honest framing
Do not optimise on a hunch and do not optimise everything. Measure, find the one or two things that dominate the slowness, fix those, and re-measure to prove it. A single measurement before and after turns performance work from guessing into engineering. The rest of this skill's references are the fixes; this is how you know which ones you actually need.
