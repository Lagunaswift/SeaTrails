---
name: seo-and-discoverability
description: "Use this skill to make a web app findable and correctly represented by search engines and when shared: crawlability and indexing, metadata and title tags, structured data, sitemaps and robots rules, canonical URLs, Open Graph / social sharing previews, and the technical SEO that determines whether content can be discovered at all. Trigger on phrases like 'SEO', 'search engine', 'not showing in Google', 'meta tags', 'title tag', 'meta description', 'structured data', 'schema.org', 'sitemap', 'robots.txt', 'canonical', 'Open Graph', 'OG tags', 'social preview', 'link preview', 'crawlable', 'indexing', 'discoverability', or when a public site should be found by search or look right when shared. This is the can-it-be-found lens, the technical and structural side of SEO. It does not cover copywriting (use anti-slop-writing) or page speed (use performance, though speed affects ranking). Defaults to a prioritised assessment of discoverability gaps and the fixes. Applies to any public web app or site."
---

# SEO and Discoverability

The lens for one question: **can search engines and social platforms find, understand, and correctly represent this site?** A site that is not crawlable, has no useful metadata, or blocks indexing by accident is invisible no matter how good its content, and a page shared to social with no preview data looks broken and gets fewer clicks. This is the technical and structural side of discoverability: not "write better content" (that is `anti-slop-writing`) but "make the content findable and correctly understood by the machines that surface it." Fast-built apps frequently ship with discoverability broken in ways nobody notices, a client-rendered app that crawlers see as blank, a stray `noindex`, missing titles, no sharing previews.

This does not cover content quality (`anti-slop-writing`) or page speed (`performance`, though speed is a ranking factor and the two overlap). It is the technical-SEO and shareability lens.

## The cardinal principle

**A page that cannot be crawled, rendered, and understood by a machine cannot be found, regardless of how good it is.** Discoverability fails first at the technical layer: the crawler cannot reach the page, cannot see the content (client-rendering with no fallback), is told not to index it, or cannot tell what it is about (no metadata). Content quality only matters once the technical layer lets the content be seen and understood. So the priority is always: can it be crawled, can it be rendered, is it allowed to be indexed, can its meaning be read, before any finer optimisation.

## Assessment by default, fixes when asked

Default to assessing discoverability in priority order, crawlability, rendering, indexing rules, metadata, structure, sharing, and flagging what blocks or weakens it. Give implementation guidance when asked to fix rather than assess.

## The areas, in priority order

### 1. Crawlability and rendering (the gate)
If a crawler cannot reach and read the content, nothing else matters.
- Can crawlers access the pages (not blocked by robots rules, auth walls, or broken links)?
- **Client-rendering trap:** a fully client-rendered app may serve a near-empty HTML shell that crawlers see as blank, the content only appears after JS runs, which crawlers may not execute reliably. Server-side rendering, static generation, or prerendering ensures crawlers get real content. This is the single biggest technical-SEO failure in fast-built SPAs.
- Clean, crawlable URLs and working internal linking so pages are reachable.
`references/crawlability-and-rendering.md` covers crawler access, the client-rendering trap and its fixes, and URL/linking structure.

### 2. Indexing control: robots and canonical (where accidents hide)
Telling search engines what to index, and not accidentally telling them not to.
- **robots.txt** and **meta robots / `noindex`:** the accidental `noindex` (often left over from staging) that hides a whole site is a classic, devastating, silent bug. Check nothing important is unintentionally blocked.
- **Canonical URLs:** when the same content is reachable at multiple URLs (with/without trailing slash, query params, http/https, www/non-www), a canonical tag tells search engines the authoritative one, avoiding duplicate-content dilution.
`references/indexing-and-canonical.md` covers robots rules, the accidental-noindex trap, and canonicalisation.

### 3. Page metadata: titles and descriptions (per page)
What search engines show in results and use to understand each page.
- **Title tag:** unique, descriptive per page, the most important on-page SEO element and the clickable result heading. Missing, duplicated, or generic titles are a common, high-impact gap.
- **Meta description:** the result snippet; not a direct ranking factor but drives click-through. Should be useful and per-page.
- Each page distinct, not the same title/description sitewide (a single-page-app failure when routing does not update them).
`references/metadata.md` covers titles, descriptions, per-page uniqueness, and the SPA title-update problem.

### 4. Social sharing: Open Graph and previews
How the page looks when shared to social/chat, which drives click-through from those channels.
- **Open Graph tags** (og:title, og:description, og:image) and Twitter Card tags control the preview card shown when a link is shared. Without them, shares show a bare URL or broken/empty preview, looking untrustworthy and getting fewer clicks.
- A representative preview image sized correctly.
`references/social-sharing.md` covers Open Graph, Twitter Cards, preview images, and per-page sharing data.

### 5. Structured data (schema.org)
Helping search engines understand *what* the content is, enabling rich results.
- Structured data (schema.org, usually JSON-LD) marks up the meaning of content (an article, a product, an event, a recipe, an organisation, a FAQ) so search engines can understand it and potentially show rich results (ratings, prices, FAQs in the listing).
- Use the right type for the content; keep it accurate to what is on the page (mismatched structured data can be penalised).
`references/structured-data.md` covers schema.org types, JSON-LD, rich results, and accuracy.

### 6. Sitemaps and crawl guidance
Helping search engines find and prioritise pages efficiently.
- An **XML sitemap** listing the indexable pages, submitted to search engines, helps discovery, especially for larger sites or those with poor internal linking.
- Keep it current (no dead/removed URLs), and consistent with robots/canonical signals.
- For large sites, crawl-budget awareness; for most, a current sitemap and clean linking suffice.
`references/sitemaps-and-crawl.md` covers XML sitemaps, submission, keeping them current, and crawl efficiency.

## How to report
Order by impact: an accidental `noindex` or a crawler-blank client-rendered app (which make the whole site invisible) before a missing structured-data type. For each: the issue, its effect on discoverability/sharing, and the fix. Distinguish "this makes the site/page unfindable" from "this is a missed optimisation." Note what needs verifying with real tooling (search console, the rich-results test, fetching as a crawler).

## Scoping
Match to whether and how the site needs to be found. A purely internal or auth-walled app does not need public SEO at all, say so, do not gold-plate. A public site whose success depends on being found needs the full set, with crawlability and indexing-control first. Even an app not chasing search rankings usually wants correct sharing previews (Open Graph) and no accidental `noindex`. The honest output for most public fast-built apps is "you have an accidental indexing block / your content is invisible to crawlers because it is client-rendered / your titles and sharing previews are missing, fix those and you are findable; finer optimisation comes after."

## What to produce under a production-audit

Standalone, report as prose per "How to report". As a lens under `production-audit`, emit findings in the canonical schema (`production-audit/references/finding-schema.md`) instead, appended to the run's `raw-findings.jsonl` as discovered: prefix `SEO`, category `seo` (its only category). The finding's `lens` value is `seo-discoverability` — the schema's enum value and this skill's directory name — not this file's frontmatter name; the harness rejects the latter. The schema overrides the prose format above.

## Skills this leans on
- `performance`: page speed and Core Web Vitals are ranking factors, fast and findable overlap, though that skill is speed and this is discoverability
- `anti-slop-writing`: the quality of the content and the copy in titles/descriptions (separate from the technical structure that surfaces it)
- `frontend-design`, `internationalisation`: rendering approach (SSR/SSG) and locale/hreflang signals for multi-language sites touch both
