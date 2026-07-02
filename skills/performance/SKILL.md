---
name: performance
description: "Use this skill to assess or improve how fast an app feels and loads for a single user: page load time, bundle size, rendering speed, perceived performance, caching, and Core Web Vitals. Trigger on phrases like 'why is this slow', 'page load', 'load time', 'bundle size', 'it feels sluggish', 'optimise performance', 'Core Web Vitals', 'LCP/CLS/INP', 'lazy load', 'caching', 'too many requests', 'first paint', 'time to interactive', 'images are huge', or when an app works but is slow to load or respond for one user. This is the perceived-speed lens, distinct from backend scaling under load (use scaling-audit for many-users; this is one-user-feels-slow). It does not cover backend throughput, concurrency, or infrastructure (scaling-audit), or correctness (debugging-methodology). Defaults to a prioritised assessment of what makes the app slow and the highest-impact fixes; measures before prescribing. Applies to any web frontend or app."
---

# Performance

The lens for one question: **does the app feel fast to a single user, and if not, what is the highest-impact thing slowing it down?** This is perceived performance, how quickly a page loads, paints, and becomes usable, which is separate from whether the backend survives load (that is `scaling-audit`). An app can be fast under no load and still feel slow because the bundle is huge, the images are unoptimised, or the page blocks on a dozen requests before showing anything. Users feel this immediately and leave; slow load is one of the most direct causes of abandonment.

This does not cover backend throughput or concurrency (`scaling-audit`), or logic bugs (`debugging-methodology`). It is the single-user, front-of-the-app speed lens.

## The cardinal principle

**Measure first, then fix the biggest thing. Never optimise on a hunch.** Performance work done by guessing wastes effort on things that do not matter while missing the one thing that does. The order is always: measure to find what is actually slow, fix the largest contributor, measure again. Most apps have one or two dominant problems (a 4MB image, a giant JS bundle, a render-blocking request) that account for most of the slowness; find those rather than micro-optimising everything.

## Measure before prescribing

Default to identifying what is actually slow before recommending fixes: what does a load actually do, what is big, what blocks, what is the real bottleneck. Use the real signals (the metrics below, a profile, the network waterfall) rather than assuming. A recommendation without a measurement behind it is a guess.

## What to measure: the user-facing signals

The metrics that reflect what a user actually experiences (Core Web Vitals and relatives):
- **Largest Contentful Paint (LCP):** how long until the main content appears. The headline "is it slow to load" number.
- **Interaction to Next Paint (INP):** how responsive it feels when the user interacts. Captures jank.
- **Cumulative Layout Shift (CLS):** how much the page jumps around as it loads. Captures the annoying reflow.
- **Time to Interactive / total blocking:** when the user can actually use the page, not just see it.
- **Total weight and request count:** how much is downloaded and how many round-trips before the page is usable.

`references/measuring-performance.md` covers these metrics, the tools (Lighthouse, the browser profiler, the network waterfall), and how to find the dominant bottleneck.

## The areas, in priority order

Ordered by how often each is the dominant problem in a typical app.

### 1. Asset weight: images, fonts, media
Usually the biggest and easiest win. Unoptimised images are the most common single cause of slow loads.
- Images far larger than their display size, wrong format (no modern format), not compressed, not lazy-loaded below the fold.
- Fonts blocking render, too many weights, no fallback.
- Large media loaded eagerly.
`references/assets-and-media.md` covers image optimisation, formats, lazy loading, and font loading.

### 2. JavaScript bundle size
The second usual culprit. Too much JS to download, parse, and execute before the app is usable.
- A large bundle shipped all at once instead of split, the whole app's code loaded for the first screen.
- Heavy dependencies pulled in whole for a small use, or duplicated.
- No code-splitting / lazy-loading of routes and heavy components.
`references/javascript-bundle.md` covers bundle analysis, code-splitting, tree-shaking, and dependency weight.

### 3. The critical rendering path
What blocks the page from showing and becoming usable.
- Render-blocking resources (synchronous scripts/styles in the head) delaying first paint.
- The page waiting on data before showing anything, instead of showing a shell and streaming content.
- Layout shift from content loading without reserved space (the CLS problem).
`references/rendering-path.md` covers render-blocking, loading strategy, streaming/skeletons, and avoiding layout shift.

### 4. Network and requests
How many round-trips and how much waiting before the page is ready.
- A waterfall of sequential requests where parallel or combined would be faster.
- Over-fetching data the page does not need; N+1 request patterns from the client.
- Missing HTTP caching / CDN for static assets, re-downloading what could be cached.
`references/network-and-requests.md` covers request reduction, the waterfall, CDN/edge, and over-fetching.

### 5. Caching strategy
Not recomputing or re-fetching what has not changed.
- Browser/HTTP caching headers on static assets (cache-busting done right so updates still land).
- CDN/edge caching for cacheable responses.
- Client-side caching of fetched data to avoid refetching on every navigation.
- Server-side caching of expensive computed results (overlaps `scaling-audit` cost/caching).
`references/caching.md` covers HTTP caching, CDN, client data caching, and cache invalidation.

### 6. Runtime and interaction performance
Why the app janks *after* it has loaded.
- Expensive work on the main thread blocking interaction (heavy compute, large re-renders).
- Unnecessary re-rendering (in component frameworks), work done on every render that need not be.
- Long lists rendered all at once instead of virtualised.
`references/runtime-and-interaction.md` covers main-thread work, render optimisation, and large-list handling.

## How to report
Lead with the measurement and the single biggest contributor. Order fixes by impact-per-effort: the 4MB hero image and the unsplit 2MB bundle are usually larger wins than any micro-optimisation. For each: what is slow, how much it is costing (a number from the measurement), and the fix. Distinguish "this is the bottleneck" from "this is minor." Resist listing every possible optimisation; name the few that move the number.

## Scoping
Match to the app and its users. A tiny internal tool does not need Core Web Vitals tuning; a public, consumer-facing app where load speed affects retention and conversion warrants the full pass. Mobile and slow-network users feel all of this far more than a developer on a fast machine, so measure under realistic conditions, not just on localhost. The honest output is often "your load is dominated by one unoptimised image and an oversized bundle; fix those two and you have most of the win."

## What to produce under a production-audit

Standalone, report as prose per "How to report". As a lens under `production-audit`, emit findings in the canonical schema (`production-audit/references/finding-schema.md`) instead, appended to the run's `raw-findings.jsonl` as discovered: prefix `PERF`, category `performance` (its only category). The schema overrides the prose format above.

## Skills this leans on
- `scaling-audit`: the backend/many-users counterpart; caching and cost overlap, but this skill is single-user perceived speed
- `frontend-design`: the visual/UX side; performance is how fast that experience arrives
- `refactoring`, `testing-strategy`: govern changes made when optimising, so a perf fix does not break behaviour
