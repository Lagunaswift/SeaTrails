# Website boundaries and payment probes

Use this reference in code-audit's Security and Correctness passes when the relevant website/API surfaces exist. Keep findings in the native schema under the owning `SEC` or `COR` pass. Missing accounts or checkout are not defects in a public information site.

Read handlers, guards and existing tests before probing. Run only bounded, authorised tests with disposable accounts/data and payment test modes. An audit does not authorise live charges, messages, key rotation or production stress tests. Where execution or provider access is unavailable, record the source evidence, proposed check and remaining uncertainty.

## Resource ownership and roles

Map protected operations to actors and resources, including server actions, bulk queries, exports and direct object/download URLs. Trace identity from the authenticated server context through the final read or write. Client-supplied roles and hidden buttons cannot establish permission. Check privileged server SDKs separately from client database rules.

For each distinct boundary, inspect or safely exercise anonymous access, owner A, unrelated B and a privileged fixture. Substitute B's identifier in A's read/update/delete/download request, call an admin operation as a member, and repeat after role removal. The unauthorised operation must fail while the permitted operation still works. Check allowed update fields so a profile update cannot grant a role or change another record's owner. Record which paths and actors were covered. See [OWASP authorisation](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## Payment state and event processing

Trace the server's selection of product, price, currency, customer and entitlement. Test tampered fields and direct visits to success/return URLs: neither may establish an unpaid entitlement. Follow the authoritative provider state and the product's approved fulfilment policy, including asynchronous payment states.

Inspect signature verification before any durable webhook effect. Use the provider's documented raw-body verification and timestamp policy where applicable. Missing, invalid or expired signatures must fail. A valid event can still be a duplicate or arrive after a newer event; distinguish the delivery signature's age from the business event's age.

Inspect durable deduplication, business uniqueness and atomic state changes. A stable operation identity must survive timeout retries and process restarts. Test concurrent submissions, duplicate delivery and out-of-order events against one intended business outcome. Reconcile an unknown result before retrying a charge. Lifecycle decisions such as grace periods, cancellation and refunds must match the existing policy.

For Stripe, consult the current [webhook](https://docs.stripe.com/webhooks) and [idempotent-request](https://docs.stripe.com/api/idempotent_requests) documentation alongside the registered Stripe deepener. Do not upgrade the integration merely to match a version named in a reference.

## Private caches and account changes

Classify cached responses and state as intentionally public, user-specific or tenant-specific. Trace CDN, server and application caches as well as browser/service-worker storage. Check that a cache hit preserves authorisation and that keys use trusted identity where access depends on it. Inspect invalidation after role/entitlement changes and edits.

Exercise A, then B, then anonymous access to the same path. Include logout/account switching, browser back and any supported offline mode. Private responses, drafts and search suggestions must not appear for another person. Check the actual intermediary policy where available; a source `Cache-Control` setting alone does not establish the deployed CDN behaviour. Route data-disclosure findings to `security`; ordinary stale public content belongs to its existing correctness/performance owner. See [OWASP cache security](https://cheatsheetseries.owasp.org/cheatsheets/Web_Cache_Security_Cheat_Sheet.html).

## Remote fetching and active content

For URL imports, image proxies, previews and callbacks, trace the destination through parsing, DNS resolution, redirects and connection. Check schemes/ports, permitted networks, response size and timeouts. A public-host check must survive redirects and a changed DNS answer; inspect connection-time enforcement and retry/fallback destinations. Use a controlled fixture instead of requesting real cloud metadata or unrelated internal services. The permitted public fetch should succeed while prohibited destinations cannot be reached. See [OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

For uploads and playable user content, read `../../saas-production-security/references/web-security.md`, section 9. Verify the private/quarantined/public transition and the application's origin/credential boundary. Intended public downloads and games may be supported; publication and execution still require the documented controls.

## Evidence limits

Separate a source-level defect, an observed runtime result and an unavailable check. Retain the actual environment/revision and redacted method/output for executed probes. Use the production-audit verification and coverage contracts; this reference adds no status vocabulary or pass-all checklist. Report each root cause once, with its affected operations and the proposed acceptance test.
