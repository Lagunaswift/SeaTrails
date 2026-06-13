# Crawlability and rendering

The gate before everything else. A search engine can only rank what its crawler can reach and read. If the crawler cannot access a page, or accesses it and sees nothing because the content has not rendered, the page is invisible, and no amount of good content or clever metadata changes that. This is where discoverability most often fails for fast-built apps, and it fails silently.

## Can the crawler reach the pages?

Basic access:
- Pages must not be blocked by robots rules (robots.txt or meta robots) that you did not intend (indexing-and-canonical.md covers the accidental-block trap).
- Content behind a login/auth wall is not publicly crawlable, fine if intended, a problem if you wanted those pages found.
- Pages must be reachable by links a crawler can follow. A page with no internal links pointing to it (an "orphan" page) may never be discovered. Working internal linking is how crawlers traverse the site.
- Broken links, server errors, and redirect chains impede crawling; keep the link graph clean.

## The client-rendering trap (the big one)

The most damaging and most common technical-SEO failure in fast-built single-page apps:

A fully client-rendered SPA serves an almost-empty HTML shell (a `<div id="root">` and a script bundle). The actual content is built by JavaScript in the browser *after* load. A human sees the content; a crawler may see a blank page. Search engines have varying and unreliable JavaScript execution, content that only exists after JS runs may be seen late, partially, or not at all. The result: a beautiful, content-rich app that appears empty to search engines and does not rank.

The fixes, all about getting real content into the HTML the crawler first receives:
- **Server-side rendering (SSR):** the server renders the full HTML for each request, so the crawler (and the user) gets real content immediately, then it hydrates into an interactive app.
- **Static site generation (SSG):** pages are pre-rendered to static HTML at build time, ideal for content that does not change per request.
- **Prerendering:** a fallback that serves pre-rendered HTML specifically to crawlers.

Modern frameworks (Next.js, Nuxt, SvelteKit, Astro, and others) provide SSR/SSG precisely so content is in the initial HTML. The anti-pattern is a pure client-rendered app for content that needs to be found. (This also overlaps `performance`'s rendering-path: SSR/SSG help both discoverability and perceived speed.)

The test: fetch the page as a crawler would (view source / fetch the raw HTML, not the rendered DOM in devtools, or use a fetch-as-crawler tool). If the content is not in that raw HTML, crawlers may not see it.

## URLs and structure

- **Clean, meaningful URLs** (readable paths reflecting content) are better for both crawlers and users than opaque query-string or hash-based ones. Hash-fragment routing (`#/page`) historically was not crawled as distinct pages; use real path-based routes.
- **A sensible structure** (logical hierarchy, important pages not buried deep) helps crawlers understand and prioritise.
- **One canonical URL per piece of content** (indexing-and-canonical.md), avoid the same content at many URLs.

## What to flag
- Content only present after client-side JS, with no SSR/SSG/prerender (the crawler-sees-blank trap, usually the top finding for an SPA).
- Important pages blocked, orphaned (no internal links), or behind auth unintentionally.
- Hash-based routing or opaque URLs where crawlable path-based routes are needed.
- Broken links / redirect chains impeding crawl.

## The honest framing
Before any metadata or optimisation, confirm the crawler can both reach the page and see its content in the raw HTML. The defining fast-built failure is the client-rendered app that looks great to humans and blank to search engines, fixed by server-rendering or static-generating the content so it is in the HTML from the first byte. Check by viewing the raw fetched HTML, not the rendered page. Crawlability and rendering are the gate; nothing downstream matters until they pass.

## Connection to other references
Indexing permissions (robots/noindex) are indexing-and-canonical.md. SSR/SSG also serve `performance` (rendering path). The framework choice that enables SSR/SSG touches `frontend-design` and overall architecture.
