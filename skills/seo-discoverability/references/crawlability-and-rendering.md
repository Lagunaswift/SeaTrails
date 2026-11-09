# Crawlability and rendering

Establish which public pages need discovery and which consumers need their content. An authenticated application shell can be intentional. A public article, search result and social preview may have different rendering requirements.

## Inspect access and content separately

- Trace the public route, status code, redirects, internal links and required resources. Check origin and CDN/WAF rules as well as robots directives.
- Compare the initial HTTP response with the rendered DOM and, where authorised access exists, the search engine's URL inspection. Record the route, revision and method used.
- Google can render JavaScript. Some social-preview and other crawlers cannot. Missing text in View Source is a reason to investigate the intended consumer, not proof that Google sees a blank page.
- Exercise direct navigation and client navigation to valid and missing resources. A styled error screen served as HTTP 200 can create a soft 404. Check server status and user recovery together.
- Public links should have usable destinations. Inspect orphaned important pages and hash-only routing where distinct indexable pages are required.

## Recommend a proportionate remedy

Use existing static rendering, server rendering or prerendering facilities when they address a demonstrated visibility, preview or delivery problem. Preserve equivalent content for users and crawlers. Bot-specific dynamic rendering is a workaround, not the default long-term recommendation. Do not require a framework migration merely to populate View Source.

An unavailable Search Console account, blocked preview tester or untested crawler is a coverage limitation. A browser user-agent string alone does not prove that a real crawler can pass the CDN's bot checks.

## Findings and ownership

Report an unintended access block, a rendered-content failure for the intended consumer, incorrect route/status behaviour or an evidenced discovery gap. State whether the failure is observed, inferred from source or awaiting live verification. Private data returned to an unauthorised consumer belongs to `code-audit` security; refer it there and keep the discovery consequence separately scoped.

## Sources checked 9 November 2026

- [Google JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google dynamic-rendering guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering)

Recheck consumer and framework behaviour against current official documentation when executing the audit. Crawl policy is covered in `crawl-policy-and-ai.md`; indexing rules in `indexing-and-canonical.md`.
