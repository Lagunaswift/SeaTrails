# Passwordless sign-in

Apply these checks when the application or its identity provider offers the corresponding sign-in method. Inspect the verifier that makes the decision. An SDK import or a sign-in button establishes only that an integration exists.

## Email sign-in links

Follow one issuance and redemption path through the identity provider, mail delivery and session creation. Compare intended behaviour with source, provider settings and existing tests.

| Decision | Evidence to inspect |
| --- | --- |
| Who and what the link authorises | The server associates the token with a single identity, purpose and expiry. Check that account linking, password reset and email sign-in have distinct purposes. |
| Where the link goes | The email uses the configured application origin. After sign-in, the application accepts only its approved return destinations. Review how the landing page handles token-bearing URLs in logs, analytics and referrers. |
| When it is consumed | Inspect atomic redemption or the provider's equivalent guarantee. Two simultaneous redemptions must produce at most one successful exchange. An expired or already used link must not create a new session. |
| What an inbox preview does | Read the GET/confirmation flow and any email-provider link tracking. A preview or security scanner fetching the URL must leave the recipient a working sign-in path. A confirmation gesture or code-entry flow can provide that boundary. |
| Which limits survive sign-in | Check that the resulting session is for the intended account, retains any required second-factor step, and has the normal expiry and revocation policy. Inspect issuance throttling and responses for an unknown address. |

For self-managed tokens, inspect a cryptographically secure generator and protected verifier storage. A redacted provider record or a documented SDK guarantee tied to its version can establish who owns the control. Name any production setting that still needs confirmation. Record the handler, decision and scope of the evidence. Keep usable links, tokens and addresses out of findings.

## Passkeys

Inspect both registration and authentication. During registration, check how the application authorises adding a credential to this account and how it validates the challenge, allowed origin and relying-party ID. During sign-in, check challenge freshness and single use, verification against the stored public key, account binding and any required user-verification flag. Local user presence alone cannot establish that a PIN or biometric check succeeded.

Read the loss and recovery flow alongside the verifier. A strong sign-in path leaves an account exposed if a weaker recovery path silently enrols a new credential. For delegated authentication, record which checks the provider performs and inspect the application's callback and recovery configuration. Keep inaccessible provider behaviour under the existing coverage limitations.

See the [OWASP passkey guidance](https://cheatsheetseries.owasp.org/cheatsheets/Passkey_Security_Cheat_Sheet.html).
