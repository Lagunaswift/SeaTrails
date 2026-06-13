# JavaScript bundle size

The second usual culprit after assets. JavaScript is uniquely expensive: unlike an image, it must be downloaded, parsed, compiled, AND executed before the app works, and that execution happens on the main thread, blocking interaction. A large bundle hurts twice, in download time and in the CPU time to run it, and the CPU cost lands hardest on the mid-range phones real users carry.

## The common problems

**The whole app shipped for the first screen.**
The default fast-built setup bundles all the application code into one file the user downloads before anything works, even though the first screen needs a fraction of it. The user pays to download the settings page, the admin panel, and the rarely-used features just to see the landing page. The fix is code-splitting: break the bundle so each route or screen loads only what it needs, and load the rest on demand.

**Heavy dependencies pulled in whole.**
A common bloat source: importing an entire large library to use one function (a whole date library for one format call, a whole lodash for one helper, a giant UI kit for two components). Check the bundle for large dependencies and whether they are used in full or could be replaced with something smaller, a targeted import, or native code.

**No tree-shaking / dead code shipped.**
Code that is imported but never used should be eliminated from the bundle (tree-shaking). This requires the dependencies and the build to support it (ES modules, side-effect-free imports). Dead code that ships is pure waste.

**Duplicated dependencies.**
Multiple versions of the same library bundled because different dependencies pulled different versions. The bundle analyser reveals this; deduping removes it.

## Finding it

A **bundle analyser** (webpack-bundle-analyzer, the build tool's analysis output, or similar) shows a visual breakdown of what is in the bundle and what is taking the space. This is the equivalent of the network waterfall for JS: it turns "the bundle is big" into "this one dependency is 40% of it." Always look before cutting.

## The fixes, by impact

1. **Code-split by route/screen** so the first load ships only what the first screen needs. Usually the biggest win for a multi-screen app.
2. **Lazy-load heavy components** that are not needed immediately (a chart library, a rich editor, a modal's contents), so they load when used rather than up front.
3. **Replace or trim heavy dependencies** identified by the analyser, smaller alternatives, targeted imports, or native APIs.
4. **Ensure tree-shaking works** and dedupe duplicate versions.

## What to flag
- Total JS shipped for the first meaningful screen, if it is large (megabytes), that is the headline finding.
- The largest dependencies in the bundle and whether they earn their weight.
- No code-splitting at all (single monolithic bundle) for a multi-screen app.
- Heavy components loaded eagerly that could be deferred.

## The honest framing
JS is the most expensive thing per byte because it blocks the main thread, not just the network. The goal is to ship the least JavaScript needed for what the user is doing right now, and defer the rest. Code-splitting the first load and trimming a couple of oversized dependencies usually moves the interactivity numbers (TTI/INP) more than any other JS change. Measure the bundle, cut the biggest contributors, re-measure.

## Connection to other skills
`refactoring` governs the restructuring when splitting code or swapping dependencies, so behaviour is preserved. Unpinned/oversized dependencies also touch `release-and-ops` (dependency hygiene) and supply-chain concerns.
