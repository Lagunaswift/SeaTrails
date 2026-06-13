# Indexing control: robots and canonical

Telling search engines what to index, and, more importantly, not accidentally telling them not to. This area contains one of the most devastating silent bugs in web development: the leftover block that hides an entire site from search, working perfectly for users while being completely invisible to Google.

## robots.txt

A file at the site root that tells crawlers which paths they may or may not crawl. Uses:
- Legitimately keep crawlers out of admin areas, internal endpoints, duplicate or low-value paths.
- The danger: a `Disallow: /` (block everything) left over from development, or an overly-broad rule that blocks important content. This makes the site uncrawlable.
- Note robots.txt controls *crawling*, not strictly indexing, a disallowed page can in some cases still appear in results without content; to keep something out of the index, use `noindex` (below), not just robots.txt.

## The accidental noindex (the silent catastrophe)

A `noindex` directive (via a meta robots tag or HTTP header) tells search engines: do not put this page in the index. It is essential for pages you genuinely want excluded (staging, thank-you pages, internal). The catastrophe:

**A site-wide `noindex` left over from staging/development, shipped to production.** Staging environments are routinely set to `noindex` so they do not get indexed, correct. But if that setting carries into production (a config that did not flip, a template that always emits it), the live site tells Google to deindex everything, while working flawlessly for users. It simply vanishes from search over the following days, and the cause is one stray tag nobody sees. This has sunk real businesses' traffic and is maddening to diagnose because nothing looks broken.

Always verify: does production emit `noindex` anywhere it should not? Is the staging-vs-production indexing behaviour explicitly controlled (staging blocked, production indexable), rather than left to a shared default that can leak the wrong way? This check belongs in every launch (ties to `release-and-ops`, environment differences).

## Canonical URLs

The same content is often reachable at multiple URLs:
- with and without a trailing slash; with and without `www`; `http` vs `https`; with tracking/query parameters; index pages reachable several ways.

To a search engine these can look like duplicate content, which splits ranking signals across the variants and weakens all of them. A **canonical tag** (`<link rel="canonical" href="...">`) declares the one authoritative URL for a piece of content, so search engines consolidate signals onto it. Set a self-referencing canonical on each page to its preferred URL, and ensure variants point to the same canonical. Also pick one host convention (www or not, https) and redirect the others, so there is one true URL, reinforced by canonical.

## Other indexing signals
- **Redirects:** use permanent redirects (301) for moved content so ranking transfers; avoid long redirect chains.
- **Pagination and parameters:** handle so paginated and parameterised URLs do not create unhelpful duplicate index entries.
- **hreflang** for multi-language sites (tells search engines which language/region version to show, ties to `internationalisation`).

## What to flag
- A site-wide or important-page `noindex` in production, especially a suspected staging leftover (the silent catastrophe, top priority to check).
- robots.txt blocking content that should be crawlable (e.g. a leftover `Disallow: /`).
- No canonical handling where content is reachable at multiple URLs (duplicate-content signal dilution).
- Multiple host variants (www/non-www, http/https) not consolidated to one.

## The honest framing
The highest-priority check here is defensive: make sure nothing is accidentally telling search engines *not* to index the site. The staging `noindex` that leaked to production is a real, business-sinking, silent failure, the site works perfectly and disappears from search without a trace. After that, consolidate duplicate URL variants with canonical tags and one host convention so ranking signals are not split. Indexing control is mostly about not shooting yourself in the foot, then about tidying duplicates.

## Connection to other references
The staging-vs-production indexing difference is an environment-config concern (`release-and-ops`). Crawl access (robots) pairs with crawlability-and-rendering.md. hreflang for multi-language sites ties to `internationalisation`.
