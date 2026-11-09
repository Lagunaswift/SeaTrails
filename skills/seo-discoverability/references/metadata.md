# Page metadata

Inspect titles and descriptions on distinct public pages and their shared templates. Use accurate text that helps a reader identify the page. Framework starter text, accidental duplication and metadata that describes a different route are useful findings.

## Titles and descriptions

- A title should identify the page and, where helpful, the organisation. Keep its distinguishing information readable when truncated.
- A description should summarise that page truthfully. Search engines may generate their own snippets; a supplied description does not guarantee particular wording or click-through.
- Treat familiar character counts as editing guidance. Display width and query context vary; exceeding a fixed count alone is not an audit failure.
- Parameter variants need intentional canonical and metadata handling. Do not force artificial uniqueness onto equivalent URLs.

## Route and consumer checks

Compare the initial response and rendered head on direct requests and client navigation. Verify the actual consumers: search rendering and a non-JavaScript social preview can behave differently. Check for contradictory or duplicated tags and confirm the route-specific image/title pair in `social-sharing.md`.

Check document language, meaningful heading structure and a clear primary page title with `accessibility`. One primary H1 is a useful convention; H1 count alone is not an SEO acceptance test. For supported translations, coordinate language/region metadata with `internationalisation`.

Inspect favicons, app icons where applicable, browser-tab identity and leftover starter branding. A hosting subdomain or a Vite/React stack is not evidence of defective engineering. Recommend domain changes only where the approved production identity requires them.

## Evidence and limits

Record the route/template, observed tags and the discrepancy. Cite the responsible source for generated metadata. Distinguish absent data from inaccurate data and from a proposed copy improvement. Do not predict ranking or sales uplift from changing tags.

## Sources checked 9 November 2026

- [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

Use current platform documentation for implementation. `anti-slop-writing` reviews the wording; this lens owns metadata delivery and consistency.
