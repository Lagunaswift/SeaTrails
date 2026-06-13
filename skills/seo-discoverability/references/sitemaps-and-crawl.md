# Sitemaps and crawl guidance

Helping search engines find and prioritise the right pages efficiently. Once a site is crawlable, indexable, and well-described, a sitemap and clean crawl signals help engines discover all the pages that should be found and not waste effort on those that should not. For most sites this is a modest, tidy-up-level concern; for large sites it becomes more significant.

## XML sitemaps

An XML sitemap is a file listing the URLs you want search engines to know about, optionally with metadata (last-modified date, change frequency, priority). Its purpose:
- **Aid discovery**, especially of pages that internal linking might not surface well (deep pages, new pages, large catalogues). It is a direct "here are my pages" list to the search engine.
- It supplements, does not replace, good internal linking and crawlability, a sitemap helps engines find pages, but the pages still need to be crawlable and indexable to actually rank.

Practices:
- **Include the canonical, indexable URLs** you want found, not duplicates, redirects, noindexed pages, or error pages (listing those sends mixed signals).
- **Keep it current.** A sitemap full of dead/removed URLs or missing new ones is stale and less trusted. Generate it dynamically or regenerate on changes so it reflects the real current site.
- **Submit it** to search engines (via their search console / webmaster tools) and/or reference it in robots.txt, so engines know where it is.
- For large sites, split into multiple sitemaps with a sitemap index; keep within size limits.

## Consistency of signals

Crawl and index signals must agree, contradictions confuse engines and waste crawl effort:
- A URL in the sitemap should be indexable (not `noindex`, not robots-disallowed, not canonicalised to a different URL). Listing a page in the sitemap while telling engines not to index it is a contradiction.
- Canonical, robots, noindex, and sitemap should all point the same way for each page.

## Crawl efficiency (mostly for larger sites)

Search engines allocate a finite "crawl budget" per site, how much they will crawl in a given period. For most small/medium sites this is a non-issue (the whole site is crawled easily). For large sites it matters:
- Do not waste crawl budget on infinite or low-value URL spaces (endless parameter combinations, faceted-navigation explosions, calendar pages stretching forever), guide crawlers away from those (robots rules, canonical, parameter handling).
- Keep important pages shallow and well-linked so they are found and re-crawled promptly.
- Fix things that waste crawl effort: long redirect chains, large numbers of error pages, duplicate URL variants (indexing-and-canonical.md).

## What to flag
- No sitemap for a site large enough or poorly-linked enough to benefit (pages may go undiscovered).
- A stale sitemap (dead URLs, missing new pages) or one listing non-canonical/noindexed/redirecting URLs (mixed signals).
- Sitemap not submitted/referenced so engines do not know about it.
- Contradictory signals (a page in the sitemap but noindexed or canonicalised elsewhere).
- For large sites: crawl budget wasted on infinite/low-value URL spaces.

## The honest framing
A current XML sitemap listing your canonical, indexable URLs helps search engines discover everything that should be found, and it is cheap to generate and submit. Keep it accurate and make sure it agrees with your other signals (do not list pages you have told engines to ignore). For most sites this plus clean internal linking is enough; crawl-budget management only becomes a real concern at large scale or where the URL space can balloon. This is the lowest-priority area here, useful tidiness once the crawl/index/metadata fundamentals are right.

## Connection to other references
Sitemap entries must be crawlable (crawlability-and-rendering.md) and indexable, with consistent canonical/robots signals (indexing-and-canonical.md). Submission happens via search console, the same tooling used to verify indexing and rich results across this skill.
