# Application abuse checks

Use S18.01 through S18.15 for the application surfaces present. These are source-provenance labels within existing controls, with no new lens, score or report fields. Record each probe's applicability, result and evidence or missing scope in the ordinary topic notes. Reuse S04/S16 evidence when its revision, actors, operations and conditions cover this probe; cite that coverage explicitly. Merge shared root causes while retaining the source labels.

Read handlers, policies and configuration before execution. Use the actual implementation in isolated fixtures, disposable accounts and a predefined small request/work budget with an external timeout. Disable external effects; no live charges, messages, credential guessing or bulk calls. Preserve report-only mode. Follow [evidence assurance](../../production-audit/references/evidence-assurance.md) and the [observation contract](../../production-audit/references/observation-contract.md), including fidelity and named stubs. A substitute verifies only the boundary it exercises; provider configuration or model behaviour may remain untested. Record credential types, never values.

## Contents

- [Script in a username](#s1801-script-in-a-username)
- [Changed resource identifier](#s1802-changed-resource-identifier)
- [Direct admin access](#s1803-direct-admin-access)
- [API key in the browser](#s1804-api-key-in-the-browser)
- [Prompt injection](#s1805-prompt-injection)
- [Admin role at sign-up](#s1806-admin-role-at-sign-up)
- [Edited price](#s1807-edited-price)
- [Faked payment](#s1808-faked-payment)
- [Repeated redemption](#s1809-repeated-redemption)
- [Negative or invalid quantity](#s1810-negative-or-invalid-quantity)
- [Guessed login code](#s1811-guessed-login-code)
- [Mislabelled upload](#s1812-mislabelled-upload)
- [Secret-bearing files in Git](#s1813-secret-bearing-files-in-git)
- [Abused AI endpoint](#s1814-abused-ai-endpoint)
- [Direct database query](#s1815-direct-database-query)

## S18.01: Script in a username

Where user text is rendered, trace names through public pages, stored records and admin views. Inspect each output context, safe sinks and deliberate rich-text handling. Preserve legitimate names and punctuation; a character blacklist cannot replace contextual protection. See [OWASP XSS prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

Evidence: a harmless isolated browser marker is rendered as data or rejected, never executed; a permitted name still displays correctly. Record the actual render paths tested. A source search alone cannot establish browser behaviour.

Owner: `code-audit`. Existing controls: SEC-07; SEC-06 for field validation.

## S18.02: Changed resource identifier

Apply to URLs, request bodies and other references selecting protected resources. Exercise synthetic A/B records through direct read, update, delete and download operations where supported. Include ownership changes and bulk paths. [OWASP IDOR guidance](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html) requires object-level permission checks even with unpredictable identifiers.

Evidence: A's request for B's protected resource fails without disclosure or mutation; permitted A access succeeds. Record actors, operations and effective permissions. Reuse the existing boundary probes where their evidence covers these paths.

Owner: `code-audit`. Existing controls: SEC-04, SEC-05.

## S18.03: Direct admin access

Where privileged operations exist, inspect their loaders, APIs and mutations. Use anonymous, member and authorised-admin fixtures, including direct calls and revoked roles. [OWASP authorisation guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) places enforcement at the protected operation.

Evidence: unauthorised actors cannot obtain privileged data or effects; the authorised administrator succeeds. A visible login page, discoverable route name or harmless shell alone establishes no privilege bypass.

Owner: `code-audit`. Existing controls: SEC-03, SEC-04.

## S18.04: API key in the browser

Classify exposed values by provider, intended visibility and effective privileges. Inspect built assets and configuration without exercising a discovered credential. [Firebase client keys](https://firebase.google.com/docs/projects/api-keys) can be public when appropriately restricted and paired with the required data protections; server or metered-provider secrets need different treatment.

Evidence: a redacted inventory distinguishes permitted public configuration from privileged exposure, with effective restrictions or a named provider-access gap. Confirmed exposure needs an authorised revocation/rotation plan; hiding the string alone cannot revoke it.

Owners: `release-and-ops`; `code-audit` for client delivery. Existing controls: SEC-01, SEC-02.

## S18.05: Prompt injection

Apply only to runtime AI that consumes untrusted input or retrieved content. Trace data access and proposed tool actions to permission checks outside the model. Follow [OWASP prompt-injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html).

Evidence: inert direct/retrieved instruction fixtures and instrumented tool substitutes preserve the actual data/action boundaries; permitted tasks work. Where private data exists, test that A cannot obtain fixture B's records. Validate proposed arguments and rendered output at their destination. A refusal or keyword filter alone cannot establish protection. Scripted model output can test tool enforcement, but leaves actual model responses untested. Do not transmit private data or invoke paid models for this fixture.

Owners: `ai-saas-security`; `code-audit` for shared permissions. Existing controls: SEC-15, SEC-04.

## S18.06: Admin role at sign-up

Inspect registration, profile updates and invitations for caller-controlled role, owner or entitlement fields. [OWASP mass-assignment guidance](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html) favours explicit allowed fields while retaining object/action authorisation.

Evidence: tampered synthetic requests cannot persist an elevated role or perform a protected action. Verify stored state and downstream permission, not merely the response message. Legitimate invited-admin provisioning must retain its server-validated authority and work normally; do not ban privileged provisioning as a whole.

Owner: `code-audit`. Existing controls: SEC-03, SEC-04, SEC-05, SEC-06.

## S18.07: Edited price

For commerce, trace the server's allowed catalogue product/price, currency and entitlement selection. Test changed amount, price ID and currency against the actual offer. A valid provider price ID still needs application eligibility checks. [Stripe's Checkout API](https://docs.stripe.com/api/checkout/sessions/create) accepts catalogue prices or configured price data; the application must choose them under its business rules.

Evidence: finite local fixtures cannot obtain an unintended discount or entitlement; the normal order computes correctly. Preserve approved donations or customer-set pricing within their explicit limits. Use a counted payment substitute and record its limits.

Owner: `code-audit`. Existing controls: PAY-01, SEC-06.

## S18.08: Faked payment

Trace fulfilment to authoritative provider state bound to the intended order/account, including delayed payment methods. Test fabricated return/client state, an invalid event signature and an attempt to use B's genuine payment reference for A. [Stripe fulfilment guidance](https://docs.stripe.com/checkout/fulfillment.md?ui=full-page) covers server verification and repeated/concurrent delivery.

Evidence: invalid or mismatched claims grant A no paid benefit; a valid payment fulfils its own eligible order once. Reuse webhook signature/replay evidence where applicable. Keep approved free trials or zero-price orders distinct from false payment claims; make no live charge.

Owner: `code-audit`. Existing controls: PAY-01, PAY-02.

## S18.09: Repeated redemption

For coupons, credits or rewards, establish eligibility, stacking and per-account/global redemption rules. Inspect atomic eligibility checks, benefit issuance and durable consumption. [OWASP business-logic guidance](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html) covers concurrent redemption and replay.

Evidence: one valid redemption and retry preserve the intended benefit. For a limited offer, a fresh fixture with one allowance remaining must resist exceeding it through a controlled concurrent pair. Use distinct eligible actors for a shared/global allowance; a pair on one account establishes only that account's behaviour. Inspect committed redemption counts and benefit totals. Distinct idempotency keys cannot bypass business uniqueness; retries must reconcile an unknown external result. Multi-use offers retain their approved rules. Do not run the screenshot's hundred-request campaign.

Owners: `code-audit`; `scaling-audit` for atomicity. Existing controls: PAY-01, PAY-02, REL-02, REL-08.

## S18.10: Negative or invalid quantity

For order quantities, validate supported units and ranges across add, update and checkout paths before monetary or inventory effects. Discrete item counts require positive integers; fractional goods and explicit removal/refund operations follow their own rules. See [OWASP input validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html).

Evidence: a finite set of negative, zero, fractional, malformed and out-of-range fixtures follows those rules without unintended credits, stock changes or totals. Valid quantities still work. Inspect arithmetic, coercion and related stock constraints; rejecting a value only in the browser leaves the server boundary untested.

Owner: `code-audit`. Existing controls: SEC-06, PAY-01, REL-08.

## S18.11: Guessed login code

Where codes authorise login or recovery, inspect randomness, account/purpose binding, expiry, consumption and attempt limits. [NIST authentication guidance](https://pages.nist.gov/800-63-4/sp800-63b.html) covers online guessing and replay; select limits for the actual policy rather than copying a universal threshold.

Evidence: use a reduced local attempt budget and simulated clock. Invalid, expired, reused and wrong-account fixtures fail; valid use and permitted recovery work. Confirm retries/new challenges cannot bypass the policy's account-level protection. Reuse S16.06/S16.13 evidence where scoped. Do not guess live codes, send messages or lock real users out.

Owners: `code-audit`; `scaling-audit` for shared limits. Existing controls: SEC-03, COST-01.

## S18.12: Mislabelled upload

Inspect supported formats, actual decoding, storage and serving policy. An extension, declared MIME type or re-encoding step alone cannot establish safety. Retain processing bounds and publication controls from [OWASP upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

Evidence: a tiny harmless mismatched fixture is rejected or isolated under that policy; a valid supported image works. Verify private/quarantined objects cannot become public through an alternate path. Supporting documents, game builds or other non-image formats is legitimate when their own controls apply. Do not use executable payloads or decompression bombs.

Owner: `code-audit`. Existing controls: SEC-11; SEC-07 for active-content sinks.

## S18.13: Secret-bearing files in Git

Inspect tracked files, relevant history and delivered artefacts with secret-redacting tools. Classify actual contents: public configuration and example placeholders can be intentional. [OWASP secret management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) includes revocation of compromised credentials.

Evidence: record credential type, exposure location/scope and authorised rotation status without printing values. Deleting a file or adding an ignore rule cannot revoke an exposed credential. Keep replacement-consumer checks and unresolved provider work visible; do not rewrite shared history automatically or validate a leaked key through a paid call.

Owner: `release-and-ops`. Existing controls: SEC-01, SEC-02.

## S18.14: Abused AI endpoint

For runtime AI endpoints, inspect identity-based quotas, request/concurrency limits and bounded input/output/tool work before costly dispatch. [OWASP API resource-consumption guidance](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/) covers rate and spending controls.

Evidence: small local budgets, counted provider/tool substitutes and a controlled multi-worker pair demonstrate the declared quota scope; rejected work does not call the provider. Permitted work still runs. Check reservation/reconciliation across retries and cancellation. Distinguish enforced caps from alerts and record provider enforcement delays or access gaps. These fixtures establish neither actual provider billing nor production capacity. Do not send ten thousand requests or make paid model calls.

Owners: `ai-saas-security`; `scaling-audit` for shared quotas. Existing controls: SEC-15, COST-01, COST-02, REL-07.

## S18.15: Direct database query

Identify whether the label means an intended client API, exposed privileged connection or unsafe query construction. Direct client access can be valid with effective grants and data policies; see [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

Evidence: synthetic anonymous/A/B requests through the actual client path enforce permitted rows, fields and writes while intended public access works. Record effective roles; an administrator-only query cannot establish client isolation. Reuse S16.12 for views/functions. Inspect parameterisation where untrusted input constructs queries. Avoid real data dumps, privileged credential experiments or blanket removal of the client API.

Owner: `code-audit`. Existing controls: SEC-04, SEC-05; SEC-06 for query construction.

Primary sources checked 15 November 2026. Recheck provider behaviour and deployed-version guidance when executing the audit.
