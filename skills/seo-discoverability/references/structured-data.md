# Structured data (schema.org)

Helping search engines understand *what* the content is, not just read its words. Structured data marks up the meaning of a page's content in a machine-readable way, "this is a product with this price and these reviews", "this is a recipe with these ingredients and this cook time", "this is an article by this author published on this date", which lets search engines comprehend it and potentially show enhanced "rich results" (star ratings, prices, FAQ accordions, recipe cards) in the listing.

## What it is and how it is added

- **schema.org** is the shared vocabulary of types (Product, Article, Recipe, Event, Organization, LocalBusiness, FAQPage, BreadcrumbList, and many more) and their properties.
- **JSON-LD** is the recommended format: a block of structured JSON (usually in a `<script type="application/ld+json">`) describing the content's type and properties. It is preferred over the older inline microdata/RDFa because it is separate from the markup and easier to manage.
- You add a JSON-LD block per page describing what that page is, using the appropriate schema.org type and filling its properties from the page's real content.

## Why it matters

- **Rich results:** the main payoff. Marked-up content can appear with enhancements, a recipe with rating and time, a product with price and stock, an FAQ with expandable questions, an event with date, which make the listing larger, more useful, and more clickable. Without structured data, the listing is plain.
- **Understanding:** even without a visible rich result, it helps the engine correctly understand the entity (this is an organisation, here is its logo and social profiles), feeding knowledge panels and better matching.
- It does not directly boost ranking position, but the enhanced appearance and better understanding improve visibility and click-through.

## Use the right type, accurately

- **Match the type to the content:** Product for product pages, Article/BlogPosting for articles, Recipe for recipes, Organization/LocalBusiness for the business, FAQPage for genuine FAQs, BreadcrumbList for breadcrumb navigation. Use the most specific applicable type.
- **Keep it accurate to the page.** Structured data must reflect what is actually visible on the page. Marking up content that is not there, fake reviews, prices that differ from the page, FAQ markup for content not shown, is against guidelines and can earn a penalty or loss of rich-result eligibility. Accuracy is a requirement, not a nicety.
- **Fill the required and recommended properties** for the chosen type so it is eligible for the corresponding rich result (each rich-result type has properties it needs).

## Common useful types
- **Organization / LocalBusiness:** identifies the business, logo, contact, social profiles, for the site as an entity.
- **Article / BlogPosting:** author, date, headline, image, for content sites.
- **Product + Offer + AggregateRating:** price, availability, reviews, for e-commerce rich results.
- **FAQPage:** question/answer pairs that can show as expandable results.
- **BreadcrumbList:** the site hierarchy shown in results.

## Testing
Search engines provide a rich-results / structured-data testing tool that validates the markup and shows which rich results a page is eligible for. Use it, structured data is fiddly and easy to get subtly wrong, and the validator is the way to confirm it parses and qualifies rather than assuming.

## What to flag
- No structured data on content that would clearly benefit (products, articles, recipes, events, an FAQ, the organisation itself) and is missing rich-result opportunities.
- Wrong or overly-generic type for the content.
- Structured data that does not match the visible page content (a guidelines violation and penalty risk, important to flag).
- Required properties for a desired rich result missing (so it is ineligible).

## The honest framing
Structured data tells search engines what your content *is*, unlocking richer, more clickable listings and better understanding. It is lower priority than crawlability, indexing, and metadata (those determine whether you appear at all; this enhances how you appear), so it comes after them. Use the specific schema.org type that matches the content, in JSON-LD, keep it strictly accurate to what is on the page, and validate with the rich-results tool. Worth doing for content types that have rich results to gain; skip it where there is no applicable type rather than forcing it.

## Connection to other references
Lower priority than the crawl/index/metadata basics (this skill's earlier references). Multi-language structured data ties to `internationalisation`. Accuracy-to-page connects to the honesty principle shared with `data-privacy` and `anti-slop-writing` (do not claim what is not true).
