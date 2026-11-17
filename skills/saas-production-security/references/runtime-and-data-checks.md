# Runtime and data security checks

Use these probes during code-audit's Security pass when the relevant surface exists. S16.11 through S16.20 preserve screenshot provenance; they add no controls, lens, finding prefix or score. Route findings to the existing owners below, merge shared root causes and assess severity from reachable consequences. An unfamiliar API, data format or historical incident alone does not establish a vulnerability.

Read the source path, deployed-version documentation and available provider configuration first. Record applicability, the actual trust boundary and any missing evidence. Tests use an authorised isolated copy, disposable identities and inert fixtures, with outbound effects disabled. Declare a finite input set, work budget and external timeout before execution. No production oracle campaigns, account enumeration, real file extraction, live messages or paid calls are required. The observation tool is not a sandbox; arrange isolation before execution.

Keep the ordinary ledger and [evidence assurance](../../production-audit/references/evidence-assurance.md). For assurance version 2, follow the [observation contract](../../production-audit/references/observation-contract.md): the controller records searches/probes, fidelity and stubs; source quotations, runtime observations and controlled reproductions retain their different meanings. A conforming fixture establishes only its exercised case. Provider observations and unavailable checks keep their recorded scope and limitations. Sources below were checked on 14 November 2026.

## S16.11: Spoofed client-IP headers

Apply where a proxy-derived client address affects rate limits, privileged access or abuse decisions. Trace the deployed ingress path, trusted proxy configuration and header handling. Include alternate paths that reach the application without the expected proxy. [Express's proxy guidance](https://expressjs.com/en/guide/behind-proxies/) explains why trusting supplied forwarding headers or assuming the wrong hop count can let a client choose its apparent address.

In an isolated proxy/application fixture, compare the same caller with absent and conflicting forwarding headers. Confirm that only the trusted ingress determines the security-relevant address, that header changes cannot obtain a fresh quota or privilege, and that permitted users still work. Inspect configured proxy stripping/overwriting and the application's interpretation together. A mocked proxy does not verify the production edge; record the deployment evidence still needed. Preserve shared-IP handling and avoid treating an address as a user identity.

Owners: `code-audit`; `infrastructure-config` for repository proxy rules; `scaling-audit` for quota enforcement. Existing controls: SEC-04, COST-01, OPS-03.

## S16.12: Database views and row-level security

Apply where views, exposed database APIs or privileged query functions return protected rows. Inspect the database version, grants, view ownership and effective querying roles. PostgreSQL normally evaluates underlying view access using the view owner's permissions and RLS policies; `security_invoker` uses the caller's where supported. Table owners normally bypass RLS, and superuser/BYPASSRLS roles bypass it. `security_barrier` has a different purpose and is not a substitute for caller-based permissions. See [CREATE VIEW](https://www.postgresql.org/docs/current/sql-createview.html) and [row-security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

Use synthetic A/B records and query the actual exposed view path as anonymous, A and B where those roles exist. Test permitted reads and denied cross-owner reads, plus supported mutations. Record the effective role and policy evidence; an administrator-only test cannot establish caller isolation. Check privileged functions reached by the view. Intentionally privileged views can be valid when their grants and returned data enforce the approved boundary; do not rewrite every view or enable database-wide settings without assessing that design.

Owner: `code-audit`, with database-specific reference material. Existing controls: SEC-04, SEC-05.

## S16.13: Randomness used for security tokens

Trace generation through issuance and validation for reset/invitation tokens, session identifiers, CSRF nonces and other secrets whose unpredictability protects an action. [Math.random](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random) is unsuitable for this purpose. Supported choices include [Web Crypto](https://www.w3.org/TR/webcrypto/) and the runtime's cryptographic generator. Ordinary animation or simulation randomness needs no security finding.

Inspect the actual generator, encoded entropy and truncation, then verify the framework's expiry, binding and single-use behaviour where required. A few distinct outputs cannot prove unpredictability. With disposable accounts, a valid fixture token should authorise only its intended action; expired, reused or wrong-account tokens should fail as the product contract requires. Keep token values out of evidence. An authorised fix must preserve existing authentication flows and use the maintained library's contract rather than introduce custom cryptography.

Owner: `code-audit`. Existing controls: SEC-03; SEC-08 for CSRF tokens; SEC-09 for sessions.

## S16.14: Timing differences that disclose secrets or account state

Apply to secret/signature comparisons and authentication or recovery paths whose observable work depends on protected information. Inspect the whole path, including early exits, password verification and error handling. [Node's timingSafeEqual](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b) requires equal-length inputs and does not make its surrounding code timing-safe. Use the authentication library's verifier for passwords. Public-value comparisons do not require a constant-time primitive.

Use local fixtures to check malformed lengths and valid/invalid credentials without uncaught errors. Inspect whether nonexistent-account and wrong-password paths expose different account state, including response status/body and work performed; [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) covers these discrepancy paths. Where bounded local measurements are useful, record method, noise and limitations. A handful of network timings proves neither exploitability nor constant-time behaviour. Random delays do not replace a sound verification path, and the audit must not enumerate real accounts.

Owner: `code-audit`. Existing controls: SEC-03, SEC-14; PAY-02 for payment-signature paths.

## S16.15: Padding and decryption oracles

Apply where the application accepts attacker-influenced ciphertext and decrypts a format that can expose padding validity. A block-sized or Base64-looking value alone is insufficient evidence. Trace the actual cryptographic format, authentication order and externally observable error handling. [OWASP's padding-oracle review](https://wstg.owasp.org/latest/4-Web_Application_Security_Testing/09-Weak_Cryptography/02-Padding_Oracle/) covers this boundary; [cryptographic-storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) recommends authenticated encryption or correctly composed authentication where required.

In a disposable local fixture with test keys, compare valid input with a bounded set of malformed inputs. Record whether rejection leaks distinct decryption stages through responses or observable behaviour, and verify that unauthenticated plaintext is never used for a consequential action. Do not attempt iterative plaintext recovery or deploy an oracle scanner. A uniform error message alone does not establish cryptographic integrity. Any authorised format migration needs a maintained-library design and compatibility/rollback planning; replacing algorithms during an audit is outside report mode.

Owner: `code-audit`. Existing controls: SEC-06, SEC-13, SEC-14; SEC-09 for session/cookie paths.

## S16.16: Prototype pollution

Apply to JavaScript paths that merge, clone or assign untrusted property names, including parsed query/body data and imported configuration. Trace the assignment into a prototype and then the inherited value's use in a security-sensitive decision. [MDN's explanation](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution) distinguishes parsing data from the later operations that cause pollution. Check maintained dependencies and schema constraints as well as application code.

Use inert marker data in a fresh disposable process to verify that untrusted keys cannot change a target object's prototype, unrelated objects or a later request's defaults. Ordinary permitted fields must still work. Record the affected assignment and consumer; accepting a suspicious property name alone does not prove a usable defect. [OWASP's prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html) covers safe dictionary choices and the limitations of disabling `__proto__`: other paths, including `constructor.prototype`, remain relevant. Global prototype freezing requires compatibility assessment.

Owners: `code-audit`; `dependency-audit` for dependency provenance/version findings. Existing controls: SEC-06, SEC-07, SEC-13.

## S16.17: Server-side template injection

Apply where untrusted values reach template source, dynamically evaluated template strings or template selection. Include email, report/PDF and preview generation. Trace the data into the actual engine. [OWASP's SSTI prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Template_Injection_Prevention_Cheat_Sheet.html) distinguishes fixed templates with data variables from untrusted template code; HTML auto-escaping addresses a different boundary.

Use a harmless engine-specific marker in an isolated render fixture. Data-only fields must remain data and permitted templates must still render. Inspect nested evaluation and include/template-name selection even if the marker produces no visible change. Do not test commands, filesystem access, network callbacks or execution delays. If users intentionally author templates, assess the documented language, available objects and isolation instead of declaring all expression evaluation a defect. Record the reachable render context and impact supported by evidence.

Owner: `code-audit`. Existing controls: SEC-06, SEC-07.

## S16.18: XML external entities and resource loading

Apply wherever untrusted XML reaches a parser, including XML inside uploads, SVG/document processing, imports and federated-auth messages. Check the deployed parser and configuration, including schema validation, XInclude or stylesheet stages. [OWASP's XXE guidance](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html) recommends disabling DTDs where possible and restricting external resolution when a required format needs them; parser defaults vary.

Use small synthetic documents and a local resolver stub that denies and records external resolution. Check whether the production-equivalent parser configuration prevents prohibited resource loading while valid supported documents work. The stub's denial alone cannot establish that production resolution is disabled. Record parser version, effective settings and whether any resource request was attempted or allowed. Unsupported hardening settings must not silently continue processing. Do not read host files, target cloud metadata, trigger external callbacks or use expansion bombs. A stubbed test supports only the parser path and controls it actually exercises.

Owner: `code-audit`; `dependency-audit` for parser-version findings. Existing controls: SEC-06, SEC-11, SEC-12, SEC-13.

## S16.19: Cross-site WebSocket hijacking

Apply to WebSocket endpoints, especially browser connections authenticated by ambient cookies. Inspect exact allowed origins at the handshake, the session/authentication design and permission checks on messages or subscriptions. The ordinary HTTP CORS policy cannot establish these checks. [OWASP's WebSocket guidance](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html) also covers expiry/logout on long-lived connections and message-level authorisation.

With a local server and disposable sessions, compare the permitted browser origin with a controlled disallowed origin. Confirm unauthorised connections or protected operations fail, while legitimate use works. Repeat an A/B resource request over the connection and test the documented expiry/logout boundary. Record what happened at handshake and message processing separately. Public anonymous broadcasts and authenticated non-browser clients need their own stated policy; Origin is not proof of identity. Use bounded messages and connections, with no flood or live subscription to private data.

Owner: `code-audit`; `infrastructure-config` for repository upgrade/proxy settings. Existing controls: SEC-03, SEC-04, SEC-08, SEC-09.

## S16.20: Unicode identity canonicalisation

The likely reference behind "Unicode = SPOTIFY" is [Spotify's 2013 engineering write-up](https://engineering.atspotify.com/2013/6/creative-usernames), which describes an earlier account-hijacking incident. A username transformation changed again when applied twice; registration and password recovery consequently resolved different accounts. This is historical evidence for an identity-boundary check, with no claim about Spotify's current security.

Apply where user-controlled identifiers undergo normalisation, case mapping or collation across registration, login, recovery or account linking. Verify one documented identity policy and test its idempotence across the actual components. Bind recovery issuance, verified delivery destination and redemption to the same immutable account identity. Use disposable accounts and captured test mail to exercise intended-equivalent and distinct names; collisions must not overwrite an account or redirect recovery to another owner.

Record the transforms, database uniqueness rules and observed account IDs without exposing credentials. Preserve supported scripts; do not impose an ASCII ban or casually change password/email rules. [Unicode identifier security](https://www.unicode.org/reports/tr39/) and [RFC 8265](https://www.rfc-editor.org/rfc/rfc8265) distinguish identifier policies and comparison requirements. Confusable display names and canonical collisions need separate assessment. A policy/library change requires collision and migration review for existing identities.

Owners: `code-audit`; `internationalisation` for intended identifier handling. Existing controls: SEC-03, SEC-04.
