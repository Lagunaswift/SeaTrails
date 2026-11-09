---
name: seo-discoverability
description: "Use this skill to make a web app findable and correctly represented by search engines and when shared: crawlability and indexing, metadata and title tags, structured data, sitemaps and robots rules, canonical URLs, Open Graph / social sharing previews, and the technical SEO that determines whether content can be discovered at all. Trigger on phrases like 'SEO', 'search engine', 'not showing in Google', 'meta tags', 'title tag', 'meta description', 'structured data', 'schema.org', 'sitemap', 'robots.txt', 'canonical', 'Open Graph', 'OG tags', 'social preview', 'link preview', 'crawlable', 'indexing', 'discoverability', or when a public site should be found by search or look right when shared. This is the can-it-be-found lens, the technical and structural side of SEO. It does not cover copywriting (use anti-slop-writing) or page speed (use performance, though speed affects ranking). Defaults to a prioritised assessment of discoverability gaps and the fixes. Applies to any public web app or site."
---

# SEO and Discoverability

Assess whether intended public content can be discovered, indexed and represented accurately in search and sharing previews. Start with the owner's audience and indexing policy. Public marketing pages, documentation and authenticated application routes can require different treatment.

## Assessment by default

This is a read-only audit unless implementation is explicitly requested. Inspect the existing stack, routes and deployed behaviour before proposing changes. A hosting subdomain, framework choice, missing optional feature or near-empty initial HTML response does not establish a defect by itself. Do not migrate frameworks, open crawler access or submit external configuration during an audit.

## Areas, in dependency order

### 1. Access, rendering and route behaviour

Trace representative public routes through HTTP status, redirects, origin/CDN/WAF rules, required resources and internal links. Compare initial HTML with the rendered DOM and available provider diagnostics. Google can render JavaScript; other consumers, including sharing bots, may have different capabilities. Separate an observed visibility failure from a rendering risk that still needs verification.

Check direct entry, client navigation and missing routes. A useful error page must also have appropriate HTTP behaviour. Recommend existing static/server rendering facilities when they address an evidenced need, without treating SSR as a universal requirement.

Read `references/crawlability-and-rendering.md`.

### 2. Indexing intent, canonical URLs and crawler policy

Check production versus preview/staging indexing, robots rules, meta/HTTP robots directives, canonical targets and redirects together. Robots controls crawling, does not protect private content, and can prevent a crawler from seeing a `noindex` directive. Canonicals are signals, not a guaranteed engine decision; preserve distinct useful pages.

Treat search, model-training and user-triggered fetch policies separately. Respect the owner's choices. Missing `llms.txt` is not an automatic failure and no crawler allowance guarantees AI citations.

Read `references/indexing-and-canonical.md` and `references/crawl-policy-and-ai.md`.

### 3. Metadata, page structure and public identity

Check useful route-specific titles and descriptions, language declarations, descriptive headings and meaningful internal links. Assess content hierarchy around actual services and user questions. Do not create thin pages, an arbitrary number of posts or fabricated research. One primary H1 is a useful convention; multiple H1 elements alone do not prove an SEO or accessibility failure.

Identify framework-default names, icons and factual inconsistencies. Use `ux-ui-patterns/website-completeness.md` for production identity, business pages and content completeness; this lens owns their discoverability consequences. Titles and descriptions influence representation but are not guaranteed to be displayed verbatim.

Read `references/metadata.md`.

### 4. Sharing previews

Inspect route-specific Open Graph/card metadata and reachable representative images using the intended consumer where possible. Missing tags do not prove every platform displays a broken preview; record the actual preview or the unverified risk. Check for private information in public preview assets.

Read `references/social-sharing.md`.

### 5. Structured data

Check applicable, factual markup against visible content and current engine support. Separate valid schema.org vocabulary from eligibility for a particular search feature. Markup cannot guarantee a rich result or AI citation. Google retired FAQ rich results on 7 May 2026; useful FAQ content can still serve readers.

Read `references/structured-data.md` and recheck current provider guidance before making feature-specific claims.

### 6. Sitemaps and search diagnostics

Check whether a sitemap is useful for the site's size and link structure. Existing entries should reflect intended canonical, indexable URLs with truthful modification dates. Check the correct production Search Console property, sitemap processing and representative indexing/canonical diagnostics when access is available. Lack of account access is a limitation, not a claimed pass or failed ownership check.

Read `references/sitemaps-and-crawl.md`.

## How to report

Prioritise demonstrated access/indexing blocks and broken routes before representation gaps and optional enhancements. For each finding, record route/template, environment or revision, observed evidence, intended policy, effect and proportionate remedy. Distinguish source inspection, rendered-browser evidence and provider observations; state what remains unverified. Never promise rankings, indexing, click-through improvement or AI citations.

## Scoping

Public discovery work may be not applicable to private routes. Source/render differences, missing sitemaps or absent structured data require context before becoming findings. Keep content strategy with `anti-slop-writing` and `ux-ui-patterns`, speed with `performance`, and private-data exposure with `code-audit` security. References include dated primary sources for claims that can change.

## What to produce under a production-audit

Standalone, report as prose per "How to report". As a lens under `production-audit`, emit findings in the canonical schema (`production-audit/references/finding-schema.md`) instead, appended to the run's `raw-findings.jsonl` as discovered: prefix `SEO`, category `seo` (its only category), `lens` value `seo-discoverability`. The schema overrides the prose format above.

## Skills this leans on
- `performance`: page speed and Core Web Vitals are ranking factors, fast and findable overlap, though that skill is speed and this is discoverability
- `anti-slop-writing`: the quality of the content and the copy in titles/descriptions (separate from the technical structure that surfaces it)
- `frontend-design`, `internationalisation`: rendering approach (SSR/SSG) and locale/hreflang signals for multi-language sites touch both
