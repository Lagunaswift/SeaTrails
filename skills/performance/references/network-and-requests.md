# Network and requests

How many round-trips and how much waiting stand between load and a usable page. Each request has overhead (connection, latency); a page that makes many sequential requests before it is ready feels slow even if each request is small, because the user waits for the chain.

## The request waterfall

The network waterfall (see measuring-performance) shows requests over time. The shapes to look for:

**Sequential chains that could be parallel.**
Request A finishes, then B starts, then C, each waiting for the last, when they do not actually depend on each other and could fire together. A long staircase in the waterfall is wasted time; parallelising independent requests collapses it.

**Requests that block on each other unnecessarily.**
The classic: load the page, then load JS, then the JS fetches config, then fetches data, then renders, a chain of round-trips each adding latency. Where possible, fetch critical data earlier (server-side, or in parallel with other work) rather than in a late, dependent step.

**Client-side N+1.**
The front-end making one request per item in a list (fetch the list, then a request for each item's detail) instead of one request that returns what is needed. Same pathology as the backend N+1, but on the client, and each one is a full round-trip. Batch into fewer requests.

## Over-fetching

Requesting more data than the page uses: an endpoint that returns huge objects when the view needs three fields, fetching a full list when only the first page is shown, pulling related data that is never displayed. Over-fetching wastes bandwidth and parse time. Fetch what the view needs; paginate; request only the fields used (where the API allows).

## Caching and CDN (the cross-reference to caching.md)

Static assets (JS, CSS, images, fonts) should be served from a CDN/edge close to the user and cached so repeat visits and shared assets are not re-downloaded from origin every time. Missing CDN/caching means every asset travels from the origin server on every visit, slow for distant users and wasteful for repeat ones. Covered in depth in `caching.md`; flagged here because it shows up in the waterfall as slow, uncached asset loads.

## Connection setup costs

Each new origin the page connects to costs DNS lookup, TCP, and TLS handshake before any data flows. A page pulling from many third-party origins (several analytics, ad, font, widget domains) pays this repeatedly. Reduce the number of distinct origins, and `preconnect`/`dns-prefetch` for the critical ones to start the handshake early.

## What to flag
- Long sequential request chains in the waterfall that could be parallelised or fetched earlier.
- Client-side N+1 (a request per list item).
- Over-fetching (large responses for small needs).
- Static assets not on a CDN / not cached (also in caching.md).
- Many third-party origins each adding handshake cost.

## The honest framing
The waterfall tells the story: find the longest chain and the biggest waits before the page is usable, and shorten them by parallelising, fetching critical data earlier, batching N+1s, and caching static assets at the edge. The goal is fewer round-trips and less waiting on the critical path to a usable page. This is single-user latency; the many-users version (request volume, backend load) is `scaling-audit`.

## Connection to other skills
`caching.md` (this skill) for the CDN/caching detail. `scaling-audit` for the backend side of request volume. `api-and-interface-design` for designing endpoints that return the right shape so the client need not over-fetch or N+1.
