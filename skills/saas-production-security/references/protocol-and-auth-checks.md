# Protocol and authentication checks

Use these source probes for the architecture present in the audited product. S16.01 through S16.10 preserve the order of the supplied security screenshot. They map to existing controls and native lenses; they add no finding prefixes, report fields or security score. Read [web-security.md](web-security.md) alongside the applicable probe.

## Scope and evidence

Establish the exposed services, identity providers and request path before selecting probes. Record why an absent protocol or feature is inapplicable. Missing provider access is a limitation on applicable work. Report findings through their native owner and reconcile shared root causes once.

Inspect source, dependency versions and deployed configuration first. For a managed mitigation, a current provider advisory tied to the actual service and effective configuration can satisfy the scoped check. Record the date and any unprotected origin path. A provider logo or an unused configuration file cannot establish protection.

Run behavioural checks only in isolated fixtures with synthetic accounts and data. Define a small input set, request limit and external execution timeout before running it. Dangerous parsing, resource exhaustion and cache tests must use disposable local services with no shared traffic, production credentials or external side effects. This review does not authorise live denial-of-service traffic, shared-cache poisoning or attempts against other users. Stop at the first deviation; retain its evidence without escalating traffic.

Follow [evidence-assurance.md](../../production-audit/references/evidence-assurance.md) and [observation-contract.md](../../production-audit/references/observation-contract.md). An executed claim uses the existing observation protocol when applicable. Keep provider observations distinct from source-backed execution, preserve counterevidence and name gaps. Record credential types and redacted outcomes, never token, password or OTP values. Passing a bounded fixture supports its stated conditions, not general immunity to an attack class.

## Contents

- [HTTP/2 Rapid Reset](#s1601-http2-rapid-reset)
- [Long-username authentication cache](#s1602-long-username-authentication-cache)
- [SAML assertion validation](#s1603-saml-assertion-validation)
- [nOAuth and account linking](#s1604-noauth-and-account-linking)
- [GraphQL aliases and work budgets](#s1605-graphql-aliases-and-work-budgets)
- [2FA code replay](#s1606-2fa-code-replay)
- [Regular-expression resource exhaustion](#s1607-regular-expression-resource-exhaustion)
- [JWT algorithm and key binding](#s1608-jwt-algorithm-and-key-binding)
- [Request framing and smuggling](#s1609-request-framing-and-smuggling)
- [Cache-key integrity and poisoning](#s1610-cache-key-integrity-and-poisoning)

## S16.01: HTTP/2 Rapid Reset

Applicability: an edge, load balancer, proxy or origin accepts HTTP/2. CVE-2023-44487 concerns resource use when streams are repeatedly cancelled. The presence of HTTP/2 alone does not establish an exposed implementation, and an application request limiter may not see the work performed at the protocol layer.

Check: inventory each HTTP/2 termination point and any direct origin route. Match its deployed version or managed-service mitigation to the vendor advisory. Inspect the effective protocol-abuse controls and monitoring. Prefer vendor regression fixtures if a self-managed implementation needs further evidence; do not generate a stream-reset flood to certify protection.

Acceptance evidence: deployment/version or provider records dated for the reviewed service, relevant effective settings and the protection boundary. Name unsupported hops or inaccessible settings. Scope the conclusion to the checked mitigation; ordinary successful HTTP/2 requests do not demonstrate resistance to exhaustion.

Owners: infrastructure-config; dependency-audit and scaling-audit support. Controls: SEC-13, COST-01, REL-06, REL-07, OPS-03.

Primary reference: [Google's Rapid Reset analysis](https://cloud.google.com/blog/products/identity-security/how-it-works-the-novel-http2-rapid-reset-ddos-attack).

## S16.02: Long-username authentication cache

Applicability: Okta AD/LDAP delegated authentication history, or custom credential/cache construction that can truncate inputs. The screenshot's 52-character claim refers to an Okta bug fixed on 30 October 2024. Exposure required the affected period beginning 23 July 2024, no applied MFA, a username of at least 52 characters, an earlier cached successful authentication and cache-first authentication. Length alone is not a vulnerability.

Check: for the historical Okta case, establish the listed preconditions and examine available authentication logs for that period; record unavailable retention. For custom logic, inspect encoding and full credential participation in cache/verification decisions. In a local fixture, check a few long and multibyte usernames with correct and incorrect synthetic passwords under normal and simulated fallback paths. Do not disconnect a real directory or shorten permitted usernames as a substitute for correcting the verification.

Acceptance evidence: applicable provider remediation/history records or fixture results showing invalid credentials remain rejected across the checked boundaries. Keep any unresolved historical investigation separate from current patch status.

Owners: code-audit; release-and-ops for provider history. Controls: SEC-03, SEC-13, OPS-03.

Primary reference: [Okta's advisory and complete preconditions](https://trust.okta.com/security-advisories/okta-ad-ldap-delegated-authentication-username).

## S16.03: SAML assertion validation

Applicability: a SAML service provider or broker consumes assertions. “SAML bypass” names a class of implementation faults. Ruby-SAML's CVE-2024-45409 is a historical signature-validation example; its old fixed versions do not establish a currently maintained dependency baseline.

Check: inventory the active SAML/XML libraries and current advisories. Confirm trusted IdP metadata, signature verification over the exact identity-bearing content consumed, and the audience, recipient and time checks required by the supported flow. Inspect request correlation and replay storage, including any explicitly supported unsolicited flow. Use local test-IdP fixtures: one valid response plus a bounded set with altered identity content, wrong audience, expiry or replay. Use maintained library regression fixtures for parser/signature-wrapping cases.

Acceptance evidence: valid authentication succeeds for its synthetic subject; each invalid fixture is rejected before session creation. Retain library/configuration versions and the consumed-assertion validation path. Missing metadata or broker access remains named work.

Owners: code-audit; dependency-audit supports. Controls: SEC-03, SEC-04, SEC-13, OPS-03.

Primary references: [Ruby-SAML maintainer advisory](https://github.com/SAML-Toolkits/ruby-saml/security/advisories/GHSA-jw9c-mfg7-9rx2); [OWASP SAML guidance](https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html).

## S16.04: nOAuth and account linking

Applicability: federated sign-in or account linking, particularly Microsoft Entra multi-tenant applications. Descope's 2023 nOAuth report concerns applications trusting a mutable email claim as identity. It does not establish that every Microsoft sign-in is bypassable.

Check: follow token validation into user lookup, tenant access and linking. Use the provider's stable identity contract, such as a validated issuer/subject pair or Entra tenant/object identity. Email, username and display claims must not independently grant another account's access. Require authenticated proof of control of the existing account before linking identities; an email-verification flag alone cannot justify a silent merge. With two synthetic identities, use a local trusted test issuer to supply matching email display claims and different stable subjects or tenants.

Acceptance evidence: the identities remain separate or enter an explicit, authenticated linking flow. Retain claim-validation and mapping locations with redacted outcomes; check issuer, audience and tenant policy as well as signatures.

Owners: code-audit; data-privacy supports account/data boundaries. Controls: SEC-03, SEC-04, PRIV-01, OPS-03.

Primary references: [Descope's nOAuth disclosure](https://www.descope.com/blog/post/noauth); [Microsoft claims-validation guidance](https://learn.microsoft.com/en-us/entra/identity-platform/claims-validation).

## S16.05: GraphQL aliases and work budgets

Applicability: GraphQL operations reach a resolver. Aliases are a supported language feature; counting HTTP requests alone can miss the work inside an operation. Depth limits alone also miss broad, shallow requests.

Check: inspect limits on breadth/aliases, accepted batching, list sizes and resolver cost. Verify authorisation per resource and rate accounting at the relevant resolver or business boundary. In an isolated schema, set deliberately small test budgets and submit a normal operation plus one just beyond the declared budget. Where authentication attempts are exposed through GraphQL, confirm their limit counts attempts, including aliases, without a brute-force run. Trusted documents are an option for known clients, not a mandatory restriction on every public API.

Acceptance evidence: the normal operation works, excess work is rejected before expensive resolution, and the observed resolver/attempt accounting matches the declared budget. Record the schema, middleware order and bounded execution results.

Owners: code-audit; scaling-audit supports resource limits. Controls: SEC-04, COST-01, COST-02, REL-03, REL-07.

Primary reference: [GraphQL security and demand control](https://graphql.org/learn/security/).

## S16.06: 2FA code replay

Applicability: OTP verification, backup codes or comparable single-use challenges. A short expiry does not itself prevent reuse during the valid period. A screen continuing to display the same time-based code does not show whether the verifier accepts it twice.

Check: inspect successful-use consumption, expiry and attempt limits. For issued challenges, check account, authentication attempt and purpose binding. In a local verifier fixture, accept one valid code, retry it once, and run one controlled pair of concurrent submissions. Use a simulated clock for expiry. Test a different challenge or account where the flow supports it; use no real SMS/email delivery or guessing loop.

Acceptance evidence: at most one authentication consumes the same valid OTP/challenge; the duplicate and expired attempts fail without elevating a session. Retain atomic storage/consumption logic and redacted outcomes. Recovery paths require the same inspection where they bypass the second factor.

Owners: code-audit; scaling-audit supports concurrent consumption. Controls: SEC-03, COST-01, REL-02, REL-08.

Primary reference: [NIST SP 800-63B, OTP verifiers and replay resistance](https://pages.nist.gov/800-63-4/sp800-63b.html).

## S16.07: Regular-expression resource exhaustion

Applicability: attacker-controlled text reaches regular expressions, including dependency and route matching. ReDoS depends on the pattern, engine and reachable input; a complex-looking expression alone is insufficient evidence.

Check: trace input-size limits to the matching call and inspect known dependency advisories. For a suspected pattern, use a small, capped set of matching and near-miss fixtures in a disposable process. Set an external hard timeout and memory/CPU budget before execution; a timer on the same blocked event loop cannot interrupt a synchronous match. Stop when the first case breaches the budget. Prefer simpler parsing or an appropriate engine where the behaviour warrants change, with compatibility checks.

Acceptance evidence: the input cap is enforced before matching and representative boundary cases stay within the stated budget, or the bounded deviation is recorded as a finding. Verify a correction only in an authorised fix phase. Keep engine/version, input lengths and timings; a static regex checker alone cannot certify safety.

Owners: code-audit; performance, dependency-audit and scaling-audit support. Controls: SEC-06, SEC-13, REL-07, PERF-06.

Primary reference: [Node.js guidance on regex and event-loop blocking](https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop).

## S16.08: JWT algorithm and key binding

Applicability: the application validates signed JWTs. Algorithm confusion occurs when untrusted token metadata changes the intended verification rules or key use. A decoded token is not evidence of verification.

Check: inspect the configured algorithm allowlist and binding between trusted issuer, key type and token purpose. The received header must not select an arbitrary algorithm or remote key location. In a local verifier with synthetic keys, use a valid token and a small invalid set covering an unapproved algorithm/key type, invalid signature, wrong issuer/audience and expiry. Test rejection of unsigned tokens in the authenticated-token path; do not assume every unrelated unsigned JWT representation is inherently defective.

Acceptance evidence: the intended valid token succeeds and each invalid fixture is rejected before claims authorise access. Retain library/version, verifier options, trusted key source and redacted outcomes. Separate access-token and identity-token validation where the protocol requires it.

Owners: code-audit; dependency-audit supports. Controls: SEC-03, SEC-04, SEC-12, SEC-13.

Primary reference: [RFC 8725, JWT best current practices](https://www.rfc-editor.org/rfc/rfc8725.html).

## S16.09: Request framing and smuggling

Applicability: requests pass through HTTP parsers or intermediaries, including protocol translation. A disagreement about request boundaries can desynchronise a connection. Merely enabling HTTP/2 at the browser-facing hop does not establish consistent handling downstream.

Check: map the edge-to-origin protocols, parser versions and connection reuse. Inspect current vendor fixes and handling of ambiguous framing or invalid fields. For self-managed code requiring reproduction, use maintained parser regression fixtures against a disposable local chain with no unrelated traffic. Define a small fixture set and hard timeout. Do not send crafted ambiguous requests to a live shared connection or public service.

Acceptance evidence: invalid or ambiguous fixtures follow a documented safe rejection/normalisation policy across every hop, without leaving a second request or reusable contaminated connection. Record hop versions, effective settings and fixture results. Managed-provider patch/configuration evidence can satisfy that boundary; an inaccessible origin stays an explicit gap.

Owners: infrastructure-config; code-audit and dependency-audit support. Controls: SEC-06, SEC-13, OPS-03.

Primary reference: [RFC 9112, message framing and request smuggling](https://www.rfc-editor.org/rfc/rfc9112.html).

## S16.10: Cache-key integrity and poisoning

Applicability: a shared cache serves responses influenced by request input. Poisoning can occur when response-changing input is absent from the effective cache identity. Keep this distinct from cache deception, where unintended caching exposes private responses.

Check: inspect cacheability, key construction and normalisation at each cache layer, including host/forwarded inputs, query handling and user-specific variants. Verify actual provider behaviour; adding a Vary header alone is insufficient if that cache does not honour it. Use a disposable isolated cache and two synthetic clients: vary one benign representation input, then confirm the other client receives its intended representation. Use inert markers, dedicated test keys and bounded requests; clear the fixture afterwards.

Acceptance evidence: untrusted inputs cannot contaminate another client's response. Private content follows the intended isolation or no-store policy. Retain origin/edge settings, observed cache decisions and redacted client results. A shared production cache must never be populated with test poison to obtain evidence.

Owners: code-audit; performance and infrastructure-config support. Controls: REL-04, SEC-04, SEC-07, PERF-05, OPS-03.

Primary references: [Cloudflare cache-poisoning guidance](https://developers.cloudflare.com/cache/cache-security/avoid-web-poisoning/); [Cloudflare cache-key documentation](https://developers.cloudflare.com/cache/how-to/cache-keys/); [PortSwigger's original cache-poisoning research](https://portswigger.net/research/practical-web-cache-poisoning).

Sources checked 14 November 2026. Historical advisories explain the screenshot labels; use current product advisories and the actual deployment when assessing exposure.
