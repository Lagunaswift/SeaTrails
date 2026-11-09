# Measuring performance

Measure the relevant route and task before selecting an optimisation. Source inspection can identify a plausible bottleneck but cannot establish runtime latency or a numerical saving without measurement.

## Field metrics and thresholds

Current Core Web Vitals good thresholds are **LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds and CLS ≤ 0.1**, assessed at the 75th percentile and segmented by mobile/desktop. Inspect the available route/origin scope, collection period and sample coverage. Do not present origin-wide data as proof about every individual page.

Use available CrUX or appropriately governed real-user monitoring when authorised. A small/new site may lack sufficient field data; report that limitation. Do not install a tracker during an audit or infer that absent field data means a pass or failure.

## Lab diagnostics

Lighthouse, a network waterfall, bundle analysis and main-thread/interaction traces can explain a reproducible problem. A Lighthouse score or Total Blocking Time is not field INP. A load-only run may miss later layout shifts and interactions. Exercise the actual navigation, menu, search, form or checkout task implicated by the finding.

Record:

- URL/route, build revision and environment;
- tool/version, browser/device or emulation, viewport, CPU/network settings;
- cold/warm cache, authentication state and relevant fixture/data size;
- repeated comparable runs, their spread and the chosen summary, not the best score alone.

Capture asset transfer sizes, resource timing and expensive work supporting the proposed cause. Separate initial load from repeat navigation and interaction costs. Controlled lab throttling is an approximation, not a claim that a real device was tested.

## Recommendations and verification

Choose the largest evidenced contributor that can be changed without breaking function, accessibility or privacy. Set a route/task-specific budget when useful; no universal JavaScript-byte cap fits every product. Re-measure under the same conditions after an authorised change and report variation. A one-run improvement is weak evidence when its size is within normal noise.

Field data takes time to reflect a release. Describe lab improvement and any still-pending field validation separately. If tools or deployment access are unavailable, state the exact test needed instead of manufacturing results.

## Sources checked 9 November 2026

- [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [Web Vitals: field and lab measurement](https://web.dev/articles/vitals)

Recheck current metric definitions and provider reporting at execution time.
