# Indexing intent and canonical URLs

Record which production routes should be public and indexable, and which preview, private or utility routes should not. Compare intended policy with the deployed response rather than assuming production must index every route.

## Check the controls together

- Inspect robots.txt, meta robots and `X-Robots-Tag`, including environment overrides. An unintended production `noindex` or broad disallow can be serious; an intentional exclusion is not a defect.
- Robots rules control crawling, not authentication or reliable index removal. A crawler must be allowed to fetch a page to see its `noindex`; blocking that fetch can leave a URL known through other links.
- Protect private/staging data with appropriate access controls. Do not expose it solely so a crawler can read `noindex`; route any disclosure to `code-audit` security.
- Check direct and redirected responses, including parameter, host and scheme variants. Use appropriate permanent redirects for genuinely moved content and avoid chains or loops.

## Canonical consistency

Compare canonical annotations, redirects, internal links and sitemap entries. Canonicals should identify the intended representative of duplicate or near-duplicate content, normally with absolute production URLs. The declared canonical is a signal; where available, compare it with the engine-selected canonical.

Self-referencing canonicals can make policy explicit, but absence alone does not prove an indexing defect. Do not canonicalise distinct products, pagination or useful service pages to an unrelated parent. Review locale alternatives with `internationalisation`.

## Evidence

Capture representative URL variants, HTTP status, relevant directives, declared canonical and available provider result. Identify whether the mismatch is observed, inferred from configuration or unverified. Do not promise a timeline for reindexing or ranking changes.

## Sources checked 9 November 2026

- [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google canonicalisation guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

Recheck provider behaviour before implementation. `crawl-policy-and-ai.md` covers purpose-specific crawler controls.
