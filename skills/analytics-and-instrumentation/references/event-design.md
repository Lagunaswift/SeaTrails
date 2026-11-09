# Event design and schema

Define events around questions the product owner will act on. Use a consistent naming convention and a small tracking plan: name, meaning, trigger, permitted properties, authoritative source, destination and retention. Existing conventions can be retained if coherent.

## Accurate outcomes

- Distinguish an attempt (`checkout_started`) from a confirmed result (`purchase_completed`). A click or success-looking screen alone may not establish a completed transaction.
- Check SPA navigation, retries, duplicate listeners and browser/server/webhook paths. Use a stable event/transaction identifier where needed to deduplicate delivery; do not count replayed delivery as a new conversion.
- Separate development, staging, staff/test traffic and known bots from the intended report, documenting exclusions and their limits.
- Verify representative events against the authoritative application outcome. Record tool/provider access and actual observed payloads; uninspected server ingestion remains unverified.

## Useful, minimal properties

Include only properties needed for the stated analysis. Keep naming/types stable and document schema changes. Inspect URL paths, query strings, referrers and campaign/UTM values for email addresses, tokens or other personal information before forwarding. Free-text form input, payment details and session-replay fields need explicit treatment, not automatic capture.

## Identity and stitching

A pseudonymous internal ID can still be personal data. Use persistent identity only where necessary for a legitimate, documented measurement purpose and permitted under the applicable rules. Aggregate counts may answer the question without tracking individuals. Where stitching is needed, inspect the anonymous-to-account transition, consent/objection boundaries, logout and shared-device behaviour.

Absence of user stitching is not a finding unless the agreed analysis actually needs it. Refer legal scope, lawful basis, retention and rights to `data-privacy` and `privacy-respecting-analytics.md`.

## Evidence

Report inaccurate definitions, duplicate/missing outcomes, unnecessary payloads or identity errors with the event, route/state, sample payload and reproduction. Avoid inventing a full event schema just to make the audit look comprehensive.
