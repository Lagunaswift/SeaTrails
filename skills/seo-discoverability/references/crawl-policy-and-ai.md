# Crawler policy and AI discovery

Record the owner's intended audiences for each public content class. Search indexing, model training and user-triggered fetching can use separate controls. Preserve existing content rights and access restrictions; an audit does not authorise opening every AI crawler.

## Inspect the intended policy

- Compare robots directives with origin/CDN/WAF configuration and available crawler observations. Verify permitted public content without disabling general protection.
- OpenAI documents independent OAI-SearchBot and GPTBot controls for search and training. ChatGPT-User handles certain user-triggered requests and is not the search-indexing switch.
- Googlebot controls Google Search access. Google-Extended controls specified Gemini uses and does not determine Google Search inclusion or ranking.
- Robots directives communicate preferences to compliant consumers. Protect private files, paid content and admin resources with server-side access controls. Refer any exposure to `code-audit` security.

## Optional llms.txt

Assess an existing file for accurate public links, maintenance and disclosure. Its absence is not an automatic defect. Google Search says it ignores llms.txt for ranking and visibility; Lighthouse's agentic-browsing guidance treats an absent file as not applicable. It may be useful for a supported agent/documentation workflow, with the owner deciding whether that benefit warrants upkeep.

No file, schema type or crawler allowance guarantees an AI citation. Report observed referrals or citations with their date and scope. Do not invent a visibility score from a handful of prompts.

## Content and measurement

Useful public answers, clear authorship and credible sources support the reader's task. Identify factual content gaps without imposing five blog posts, an original-research quota or a special AI writing style. Publication/update dates should reflect real events or substantive changes. Search Console and provider diagnostics require observed access; unavailable accounts remain limitations.

## Sources checked 9 November 2026

- [OpenAI crawlers](https://developers.openai.com/api/docs/bots)
- [Google common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- [Google AI optimisation guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Lighthouse llms.txt audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt)

Recheck current provider controls at execution time. This reference changes audit interpretation; it does not install files, alter robots rules or contact external services.
