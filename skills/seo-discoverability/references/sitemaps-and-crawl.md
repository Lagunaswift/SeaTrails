# Sitemaps and search diagnostics

A sitemap is a discovery aid. It does not guarantee crawling or indexing and does not replace internal links. Evaluate its usefulness for the size, change frequency and discoverability of the site's public content; a small, well-linked site need not fail solely because it lacks one.

## Inspect an existing sitemap

- Check a successful XML response, correct production host, supported size/format and any sitemap index.
- Include intended canonical, indexable URLs; investigate redirects, errors, accidental exclusions, missing important pages and mismatched canonical targets.
- Ensure `lastmod`, when supplied, reflects real significant page changes. Do not reset every URL's date on every build. Google ignores `priority` and `changefreq`; do not require or tune them as ranking controls.
- Check discovery through robots.txt or an existing provider submission. An audit may report a missing setup; it does not authorise submitting or changing the account.

## Search Console and provider evidence

When authorised access exists, confirm the property covers the actual production protocol/host or domain. Inspect sitemap processing and a representative selection of the home page, service/content pages, dynamic routes, canonical variants and intentionally excluded routes. Record indexing status, reported cause, last crawl and declared versus selected canonical where available. A live inspection and an indexed snapshot answer different questions; record which was used.

Distinguish expected exclusions from errors. If access is unavailable, name the checks that remain unverified and provide the exact URLs for the owner to inspect. A public fetch cannot establish property ownership, sitemap submission or Google's indexed state.

## Crawl efficiency

For a large or highly parameterised site, inspect infinite filters, calendar spaces, duplicate variants and redirect chains. Do not force a crawl-budget project onto a small site. Useful service/content hierarchy and internal links remain part of the assessment; do not generate thin pages to fill a quota.

## Sources checked 9 November 2026

- [Google sitemap overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Search Console page indexing report](https://support.google.com/webmasters/answer/7440203)

Recheck current provider limits and report semantics at execution time.
