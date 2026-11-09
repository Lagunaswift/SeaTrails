# Caching

Not fetching or recomputing what has not changed. Caching is among the most effective performance tools because the fastest request is the one never made. The discipline is caching what is safe to cache, for as long as it is valid, and invalidating correctly so users do not get stale content.

## Safety and ownership before speed

Classify responses as public, user-specific or tenant-specific before caching. Inspect HTTP/CDN directives, application/query cache keys, service workers and invalidation on writes, logout, account switching and permission changes. `private` restricts shared-cache reuse; `no-store` has a different purpose, and neither replaces server-side authorisation. Do not recommend public caching simply because a response is expensive.

Where authorised, use separate synthetic users/tenants and an anonymous session to verify isolation and freshness. If the evidence shows private data served to another audience, hand the root cause to `code-audit` as `SEC`/`security`; this lens's canonical category remains `performance`. Record unavailable runtime verification explicitly. No production purge or cross-account probing is implied by the audit.

## HTTP/browser caching of static assets

Static assets (JS, CSS, images, fonts) rarely change between deploys, so the browser should cache them and not re-download on every visit. The mechanism is HTTP cache headers:
- Long cache lifetimes on static assets so repeat visits load them from disk, not the network.
- **Cache-busting for updates:** the catch is that if an asset is cached for a year and you ship a new version, users get the stale one. The standard solution is content-hashed filenames (`app.a1b2c3.js`), the filename changes when the content changes, so the new deploy references a new URL the browser has not cached, while unchanged assets keep their cached versions. Most build tools do this automatically; confirm it is on.

The common failure is either no caching (everything re-downloaded every visit) or caching without cache-busting (users stuck on stale versions after a deploy). Get both right: cache aggressively, bust correctly.

## CDN / edge caching

A CDN serves cached content from a location near the user instead of from the origin server. For static assets and cacheable responses this cuts latency dramatically for users far from the origin, and offloads the origin. Most hosting platforms include a CDN; the question is whether assets and cacheable responses are actually served through it. Cacheable dynamic responses (pages or API responses that are the same for many users for a while) can also be edge-cached for big wins.

## Client-side data caching

In the app, data already fetched should not be refetched needlessly on every navigation. A data-fetching layer with caching (the framework's data cache, a query library, or deliberate in-memory caching) means navigating back to a screen shows cached data instantly while optionally revalidating in the background, rather than a fresh loading spinner every time. The balance is freshness vs speed: cache for responsiveness, revalidate so data does not go stale.

## Server-side caching of expensive work

Expensive computed or fetched results that are the same across requests (an expensive query, a rendered page, an external API response, an AI completion for a repeated prompt) can be cached server-side so the cost is paid once and served many times. This overlaps `scaling-audit` (caching as a cost-and-load control) and is both a performance and a cost win.

## Cache invalidation: the hard part

The famous hard problem. Cached data that should have updated but did not is a correctness bug dressed as a performance feature. The disciplines:
- **Content-hashed filenames** for static assets (invalidation by changing the URL, the clean solution).
- **Explicit invalidation** when the underlying data changes (clear/update the cache on write).
- **Time-based expiry (TTL)** where slightly stale is acceptable, cache for a bounded time, accept the data can be up to that old.
- Choose per data type based on how bad staleness is: a price or stock count tolerates little staleness; a blog post tolerates a lot.

## What to flag
- Static assets with no caching (re-downloaded every visit) or caching without cache-busting (stale after deploy).
- Measured latency or repeated transfer that a suitable CDN/edge cache could improve safely; absence of a CDN alone is not a defect.
- Client refetching the same data on every navigation with no caching.
- Expensive server work recomputed per request that could be cached.

## The honest framing
Caching turns repeated work into work done once. The biggest wins: cache static assets aggressively with content-hashed filenames (fast repeat visits, correct updates), serve them from a CDN (fast for distant users), and cache fetched data client-side so navigation feels instant. The price of caching is the discipline of invalidation, cache only what you can correctly keep fresh, and choose the staleness each data type tolerates.

## Connection to other skills
`scaling-audit` for server-side caching as cost/load control. `network-and-requests` (this skill) for the request-reduction side. `release-and-ops` for how cache-busting interacts with deploys.

Source checked 9 November 2026: [RFC 9111, HTTP caching](https://www.rfc-editor.org/rfc/rfc9111.html). Provider-specific caching defaults must be checked against the deployed stack.
