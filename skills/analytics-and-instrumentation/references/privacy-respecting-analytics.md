# Privacy-respecting analytics

Measuring usage without violating privacy or the law. Analytics is a data-collection activity, and collecting behavioural data about people is exactly what privacy law governs. This reference covers the analytics-specific practices; for the legal substance (consent rules, lawful basis, data-subject rights) it **defers to `data-privacy`**, which owns that ground. The two skills meet here: do not let the drive to measure everything override the duty to collect lawfully and minimally.

## Consent before non-essential tracking

Analytics cookies and identifiers are, in most regimes, non-essential tracking that requires prior opt-in consent (GDPR/ePrivacy and similar). This is `data-privacy`'s domain (lawful-basis-and-consent), and this skill defers to it, but the analytics-relevant consequences:
- **Tracking must not fire before consent** where consent is required. The common violation is analytics loading on page load, before the consent banner is answered, which `data-privacy` flags. Instrumentation has to respect the consent state.
- **Design for the no-consent case:** some users will decline, so analytics will not see everyone. Either accept partial data, or use a privacy-respecting approach that needs no consent (below). Do not respond to declined consent by tracking anyway.

## Minimise personal data in events

The minimisation principle (`data-privacy`, data-inventory-and-minimisation) applied to analytics: track behaviour without hoarding personal data.
- **Use an internal/pseudonymous identifier**, not PII, to connect a user's events over time. You can analyse a user's funnel and retention via an opaque ID without putting their email or name in every event.
- **Keep PII out of event properties** unless genuinely necessary. Dumping emails, names, full addresses, or sensitive attributes into event payloads (easy to do carelessly) spreads personal data into the analytics system, which then becomes data you must secure, disclose, and be able to delete (`data-privacy`, data-subject-rights, deletion must reach analytics too). Track the behaviour, not the person's identity details.
- **Never put special-category data** (health, etc.) in analytics events without the heightened care `data-privacy` requires.

## Privacy-respecting and cookieless approaches

Where they suffice, analytics approaches that avoid personal data / cookies entirely sidestep much of the consent and minimisation burden:
- **Cookieless / privacy-first analytics** tools aggregate usage without tracking individuals or setting tracking cookies, often needing no consent banner because they collect no personal data. For many products' needs (traffic, page popularity, basic funnels) these are enough.
- **Aggregate over individual** where the question allows: if you need "how many completed checkout," you may not need to track identifiable individuals at all.
- The tradeoff: less individual-level detail (harder to do deep cohort/retention on identified users) for far less privacy burden. Choose based on what questions you actually need answered (measuring-the-right-things.md, do not collect individual-level data you will not use).

## Deletion and the analytics system
When `data-privacy`'s deletion right is exercised, the user's data in the analytics system must be deletable too (data-subject-rights). This is easier if you minimised (less to delete, pseudonymous IDs) and a real problem if you scattered PII through events. Design analytics so a user can be removed from it.

## What to flag
- Tracking firing before consent where consent is required (defer the rule to `data-privacy`, but flag the instrumentation behaviour).
- PII (emails, names, sensitive data) in event properties where an ID or nothing would serve (minimisation failure, and deletion burden).
- No consideration of the no-consent / privacy-respecting option where it would suffice.
- Analytics data that cannot be deleted on a data-subject request (PII scattered, no path to remove a user).

## The honest framing
Measure usage, but lawfully and minimally: respect consent (tracking must not fire before opt-in where required), keep personal data out of events (use pseudonymous IDs, track behaviour not identity), and consider privacy-respecting/cookieless analytics where they answer your questions without the consent and PII burden. The legal rules are `data-privacy`'s to define, this skill defers to it, but the instrumentation choices are made here: do not let "track everything" override "collect the least, lawfully." Minimal, consented analytics is both more lawful and, usually, perfectly sufficient for the decisions that matter.

## Connection to other skills
This reference defers throughout to `data-privacy` (consent, minimisation, deletion, special-category data) for the legal substance. Minimisation also echoes measuring-the-right-things.md (track only what informs a decision, which conveniently reduces privacy exposure). Securing the collected data is `ai-saas-security` / `code-audit`.
