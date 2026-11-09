# Structured data

Review structured data for the content and search features the site can actually support. Schema.org vocabulary and a search engine's supported rich-result types are separate things. Missing optional markup is not a release blocker by itself.

## Inspect and validate

- Match the type and properties to visible facts: products, articles, organisation details or other applicable content.
- Compare generated prices, availability, author details, dates and URLs with the page and its underlying data. Never invent ratings, customer reviews, research or credentials to complete a schema object.
- Validate representative generated output using the relevant official tool where available. Check required properties and current eligibility rules for the intended feature.
- Record the exact type, route, validation result and observed mismatch. A validator pass establishes only what that validator checked; it guarantees neither a rich result nor a ranking improvement.

## Current FAQ distinction

Google's documentation records the retirement of FAQ rich results from 7 May 2026. Do not recommend FAQ pages or FAQPage markup to obtain expandable Google results. Useful on-page questions can still serve readers. Retain or add semantic markup only for an identified consumer or purpose; do not strip valid markup merely because one search feature was retired.

## Sources checked 9 November 2026

- [Google structured-data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Google documentation updates, FAQ retirement](https://developers.google.com/search/updates)

Recheck supported types and eligibility before reporting a missing opportunity. Content accuracy also involves `anti-slop-writing`; indexing and rendering remain separate checks.
