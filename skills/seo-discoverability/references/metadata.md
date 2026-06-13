# Page metadata: titles and descriptions

What search engines display in results and use to understand each page. These are small pieces of text per page, but the title tag in particular is among the highest-impact on-page SEO elements, and getting metadata wrong (missing, duplicated, or never updating per page) is a common, easily-fixed gap.

## The title tag

The `<title>` is the most important single on-page SEO element and the clickable heading shown in search results. Requirements:
- **Unique per page.** Every page needs its own title describing that page. A whole site sharing one title (or "Home" everywhere) wastes the strongest on-page signal and produces useless, identical search listings.
- **Descriptive and front-loaded.** Put the distinctive, important words near the front; describe what the page actually is. Include the terms a searcher would use, naturally, not stuffed.
- **Reasonable length.** Search engines truncate long titles (~50-60 characters typically shown); keep the key content within the visible portion.
- A common convention: "Page topic, Site name", with the page-specific part first.

## The meta description

The `<meta name="description">` is the snippet text often shown under the title in results. It is **not a direct ranking factor**, but it strongly influences click-through (a compelling, relevant description gets more clicks than a truncated random sentence the engine pulls instead). Requirements:
- **Per page, written for that page**, summarising it usefully and invitingly.
- **Reasonable length** (~150-160 characters before truncation).
- If absent, the search engine generates a snippet from the page, often poorly, so a deliberate description is better.

## The single-page-app metadata trap

A specific, common failure: in a client-side-routed SPA, the title and meta tags are often set once in the initial HTML and **never updated as the user (or crawler) navigates between routes**. Every "page" then shares the homepage's title and description. Even with SSR/prerendering, if per-route metadata is not set, every page looks identical to search engines.

The fix: ensure each route/page sets its own title and meta description, via the framework's head/metadata management (Next.js metadata, react-helmet-style head management, the framework's equivalent), and ensure it is present in the server-rendered/prerendered HTML (crawlability-and-rendering.md), not only applied client-side after load. Per-page metadata that only appears after client JS may not be seen by crawlers.

## Other on-page metadata
- **Headings (`<h1>` etc.):** a clear, single descriptive `<h1>` per page reinforces the topic (also an `accessibility` concern, the two align). Logical heading structure helps both.
- **Alt text on images:** describes images to search engines as well as screen readers (overlaps `accessibility`); meaningful alt aids image search and context.
- **Language declaration** (`lang` attribute) and, for multi-language sites, hreflang (ties to `internationalisation` and indexing-and-canonical.md).

## What to flag
- Missing title tags, or the same title across many/all pages (the homepage-title-everywhere SPA failure).
- Generic or absent meta descriptions.
- An SPA that does not update title/meta per route (every page sharing one set).
- Per-page metadata applied only client-side, absent from the crawlable HTML.
- Missing or multiple/unclear `<h1>`s.

## The honest framing
Give every page a unique, descriptive title (the highest-impact piece) and a useful per-page meta description, and make sure both are in the HTML a crawler receives, not just set client-side after load. The signature fast-built failure is the SPA where every route shares the homepage's title because navigation never updates the head, easy to miss, easy to fix with the framework's metadata handling. Metadata is small, cheap, and high-impact once crawlability is sorted.

## Connection to other references
Metadata must be in the crawlable HTML, crawlability-and-rendering.md (SSR/SSG). Headings and alt text overlap `accessibility`. Title/description copy quality is `anti-slop-writing`. Social-sharing tags (og:title etc.) are the sharing counterpart, social-sharing.md.
