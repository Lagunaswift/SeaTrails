# Social sharing: Open Graph and previews

How a page looks when someone shares its link, to social platforms, messaging apps, chat, anywhere a URL gets pasted. This is distinct from search-result appearance and controlled by different tags. Without them, a shared link shows a bare URL or a broken, empty card; with them, it shows an attractive preview that gets far more clicks and looks trustworthy.

## Open Graph tags

The Open Graph protocol (originally Facebook's, now used by most platforms) defines meta tags that control the preview card. The core ones:
- **`og:title`**, the title shown on the card (can differ from the SEO `<title>`, optimised for sharing).
- **`og:description`**, the description text on the card.
- **`og:image`**, the preview image, the single most impactful element; a good image dominates the card and drives clicks. Missing image = a bare, unappealing card.
- **`og:url`**, the canonical URL of the page.
- **`og:type`**, the content type (website, article, etc.).

Without Open Graph tags, platforms guess (scraping a title, maybe grabbing a random image) or show nothing, producing the bare-URL or broken-preview look that reads as low-quality or suspicious and suppresses click-through.

## Twitter/X Cards

X uses its own (Open-Graph-compatible) card tags: `twitter:card` (the card type, e.g. `summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`. Often these can fall back to the Open Graph tags, but specifying the card type and image gives control over how the link appears on X. Set them for sites where X sharing matters.

## The preview image

The image is what makes a shared link stand out, so:
- Provide a representative image per page where it matters (an article's image, a product's photo), or a good default site image otherwise.
- **Size it correctly.** Platforms expect particular dimensions (a large-card image is commonly around 1200x630); a wrongly-sized image gets cropped badly or rejected. Use the recommended dimensions.
- Host it at a stable, absolute URL (not a relative path, which preview scrapers may not resolve).

## Per-page sharing data and the SPA trap

As with SEO metadata (metadata.md), sharing tags must be **per page** and must be in the **crawlable/scrapable HTML**, not set only by client-side JS after load. Social scrapers (the bots that generate previews) generally do *not* execute JavaScript, so og tags that only appear after client render are invisible to them, the preview falls back to bare/empty even though the tags "exist" in the rendered DOM. This makes SSR/SSG (crawlability-and-rendering.md) matter for sharing too: the og tags need to be in the server-delivered HTML. An SPA that sets og tags client-side will show broken previews despite the tags being present at runtime.

## Testing previews
Social platforms provide preview-debugging/validator tools that fetch a URL and show the card they generate (and often let you refresh their cache). Use them to confirm the preview actually renders as intended, rather than assuming, previews are a thing you should verify by testing, not eyeball in the code.

## What to flag
- No Open Graph tags (shared links show bare URLs / broken previews, the main finding).
- Missing or wrongly-sized `og:image` (unappealing or broken card).
- Sharing tags set only client-side, absent from the server-delivered HTML (scrapers do not run JS, so previews break, the SPA trap).
- Same sharing data on every page where per-page would be better.
- Relative image URLs that scrapers cannot resolve.

## The honest framing
Open Graph (and Twitter Card) tags control how a link looks when shared, and their absence makes shares look broken or untrustworthy and kills click-through. The key, often-missed point: social scrapers do not execute JavaScript, so the tags must be in the HTML the server delivers, not applied client-side, which is why SPAs so often have broken previews despite "having" the tags. Set per-page og tags with a correctly-sized image in the server-rendered HTML, and verify with the platforms' preview validators rather than assuming.

## Connection to other references
Must be in the crawlable/server-rendered HTML, crawlability-and-rendering.md. Parallels the SEO metadata per-page discipline, metadata.md. The preview image design overlaps `frontend-design`.
