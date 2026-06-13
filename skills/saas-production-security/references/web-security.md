# General SaaS Security

## Table of Contents
1. [Transport Security](#transport)
2. [Authentication Hardening](#auth-hardening)
3. [Session Management](#sessions)
4. [Cross-Site Scripting (XSS)](#xss)
5. [Cross-Site Request Forgery (CSRF)](#csrf)
6. [SQL and NoSQL Injection](#injection)
7. [Security Headers](#headers)
8. [Dependency Security](#dependencies)
9. [File Upload Security (General)](#file-uploads)
10. [CORS](#cors)
11. [Logging and Audit Trails](#logging)
12. [Secrets and Environment Variables](#secrets)
13. [Database Security](#database)
14. [Server and Infrastructure Hardening](#server)
15. [Payment and Billing Security](#payments)
16. [Account Security](#account-security)
17. [Email Security](#email)
18. [Regulatory Compliance Basics](#compliance)
19. [Security Testing](#testing)
20. [Deployment Security](#deployment)

---

## 1. Transport Security {#transport}

### HTTPS Everywhere

Every page, every API endpoint, every asset, every WebSocket connection. No exceptions. No "HTTP for the landing page, HTTPS for the app." HTTP anywhere is a vulnerability everywhere.

**Implementation:**
- Obtain TLS certificates via Let's Encrypt (free, automated) or your CDN provider
- Configure HSTS (HTTP Strict Transport Security) with a minimum max-age of 1 year (31536000 seconds)
- Include `includeSubDomains` in HSTS after verifying all subdomains support HTTPS
- Submit your domain to the HSTS preload list (hstspreload.org) for browser-level enforcement
- Redirect all HTTP requests to HTTPS at the infrastructure level (load balancer or CDN), not the application level

**TLS Configuration:**
- Minimum TLS 1.2. Prefer TLS 1.3.
- Disable TLS 1.0 and 1.1 entirely.
- Use strong cipher suites. Disable CBC-mode ciphers. Prefer AEAD ciphers (AES-GCM, ChaCha20-Poly1305).
- Test your configuration with SSL Labs (ssllabs.com/ssltest). Aim for an A+ rating.

### Certificate Management

- Automate certificate renewal. Manual renewal leads to expiry outages.
- Monitor certificate expiry dates. Alert at 30 days, 14 days, and 7 days before expiry.
- Use separate certificates for your main domain and API subdomains.
- If you terminate TLS at a load balancer, ensure internal traffic between the load balancer and application servers is also encrypted (or runs on a private network with strict access controls).

---

## 2. Authentication Hardening {#auth-hardening}

### Password Requirements

- Minimum 8 characters. Longer is better. Do not set maximum lengths below 128 characters.
- Check passwords against known breach databases (Have I Been Pwned API or a local copy of the pwned passwords hash list).
- Do not enforce arbitrary complexity rules (must include uppercase, number, symbol). These reduce password entropy by constraining the search space and annoy users into choosing weaker passwords. Length matters more than complexity.
- Hash passwords with bcrypt (cost factor 12+), scrypt, or Argon2id. Never MD5, SHA-1, or SHA-256 without a salt and key stretching.
- Salt every password hash individually. The hashing library handles this if you use bcrypt or Argon2id correctly.

### Multi-Factor Authentication (MFA)

- Offer TOTP (app-based, e.g., Google Authenticator, Authy) as a second factor.
- Support WebAuthn/passkeys as a stronger alternative.
- SMS-based 2FA is better than nothing but vulnerable to SIM swapping. Offer it as a fallback, not a primary MFA method.
- Enforce MFA for admin accounts. Strongly encourage it for all users.
- Store MFA recovery codes as hashed values, same as passwords.
- Rate limit MFA code attempts (max 5 failures in 15 minutes, then lock for 30 minutes).

### OAuth and Social Login

If you support "Sign in with Google/GitHub/etc.":
- Validate the `state` parameter on callback to prevent CSRF
- Verify the `id_token` signature using the provider's public keys (fetched from their JWKS endpoint)
- Check `iss` (issuer) and `aud` (audience) claims match your application
- Do not trust email addresses from OAuth providers without checking the `email_verified` claim
- Link social accounts to existing accounts by verified email, not by display name

### Password Reset Flow

- Generate a cryptographically random token (minimum 32 bytes)
- Store the token hashed (SHA-256 is fine for reset tokens since they are single-use and time-limited)
- Set a short expiry (15-30 minutes)
- Invalidate the token after use (single-use)
- Invalidate all existing reset tokens for the account when a new one is generated
- Do not reveal whether the email exists in your system. Always show "If an account exists with that email, we have sent a reset link."
- Rate limit reset requests per email (max 3 per hour)

---

## 3. Session Management {#sessions}

### Session Tokens

- Generate session IDs with a cryptographically secure random number generator. Minimum 128 bits of entropy.
- Store sessions server-side (database or Redis). The session ID in the cookie is a lookup key, not the session data itself.
- Set session expiry: idle timeout (30 minutes of inactivity) and absolute timeout (24 hours regardless of activity).
- Rotate session IDs on privilege changes (login, password change, MFA verification, plan upgrade).

### Cookie Configuration

```
Set-Cookie: session_id=<value>;
  HttpOnly;        ← JavaScript cannot read the cookie (XSS protection)
  Secure;          ← Cookie only sent over HTTPS
  SameSite=Lax;    ← CSRF protection (Strict if you can tolerate it)
  Path=/;          ← Available on all paths
  Max-Age=86400;   ← 24 hours
  Domain=yourdomain.com;
```

Every one of these flags matters. `HttpOnly` prevents XSS from stealing sessions. `Secure` prevents HTTP downgrade attacks. `SameSite` prevents CSRF. Do not omit any of them.

### JWT Considerations

If you use JWTs instead of server-side sessions:
- Keep JWTs short-lived (15-30 minutes max)
- Use refresh token rotation (each refresh token is single-use, issues a new refresh token alongside the new JWT)
- Store refresh tokens server-side with revocation capability
- Sign JWTs with RS256 or ES256 (asymmetric), not HS256 (symmetric), if multiple services verify them
- Never store sensitive data in the JWT payload — it is base64 encoded, not encrypted
- Validate `exp`, `iss`, `aud`, and `iat` claims on every request

---

## 4. Cross-Site Scripting (XSS) {#xss}

### The Threat

An attacker injects malicious JavaScript into your application that runs in other users' browsers. This can steal session cookies, redirect users, deface the interface, or perform actions as the victim.

AI SaaS applications have an elevated XSS risk because AI output is rendered in the UI. If the AI generates content containing a `<script>` tag or event handler, and you render it without sanitisation, the AI becomes an XSS vector.

### Prevention

**Output encoding:** Every piece of dynamic content rendered in HTML must be encoded for the context it appears in:
- HTML body: encode `<`, `>`, `&`, `"`, `'`
- HTML attributes: encode all non-alphanumeric characters
- JavaScript: use JSON serialisation, not string concatenation
- URLs: encode using `encodeURIComponent()`
- CSS: avoid injecting dynamic values into CSS entirely if possible

**Content Security Policy (CSP):** Deploy a strict CSP header (see section 7). A good CSP blocks inline scripts, which neutralises most XSS even if encoding is missed somewhere.

**AI output rendering:**
- If rendering AI output as HTML (e.g., markdown-to-HTML), use a sanitisation library (DOMPurify for client-side, sanitize-html for Node.js). Whitelist allowed tags and attributes. Strip everything else.
- If rendering AI output as plain text, encode it. Do not use `innerHTML` or `dangerouslySetInnerHTML` with unsanitised AI output.
- If the AI generates code blocks, render them inside `<pre><code>` with encoding. Do not execute AI-generated code in the browser.

**Framework protections:**
- React: JSX auto-encodes by default. Never use `dangerouslySetInnerHTML` with AI output unless you sanitise first.
- Next.js: Same as React, plus be careful with server-side rendering of user-generated or AI-generated content.
- Vue: `v-text` is safe, `v-html` is not. Sanitise before using `v-html`.

### Stored XSS via AI

If you store AI output and display it later (conversation history, saved reports), stored XSS becomes a concern. Sanitise on output (when rendering), not on input (when storing). This ensures old data is protected if you improve your sanitisation rules later.

---

## 5. Cross-Site Request Forgery (CSRF) {#csrf}

### The Threat

An attacker tricks a logged-in user's browser into making requests to your application. If the user is authenticated via cookies, the browser automatically attaches the session cookie to the forged request.

For AI SaaS, CSRF could trigger AI requests on the user's behalf, consuming their quota, sending their data to the AI, or changing their account settings.

### Prevention

**SameSite cookies:** Set `SameSite=Lax` on all session cookies. This blocks most CSRF attacks by preventing the browser from sending cookies with cross-origin POST requests.

**CSRF tokens:** For state-changing requests (POST, PUT, DELETE), include a CSRF token:
1. Generate a unique token per session (or per request for higher security)
2. Include it in a hidden form field or custom header
3. Validate it server-side on every state-changing request
4. Reject requests without a valid token

**Custom headers:** For API-style requests (AJAX/fetch), require a custom header (e.g., `X-Requested-With: XMLHttpRequest`). Browsers do not add custom headers to cross-origin requests without CORS pre-flight approval.

**Double-submit cookie pattern:** Set a CSRF token as a cookie and require it in the request body or header. The attacker cannot read the cookie value from another origin.

### API Endpoints

If your AI endpoints are accessed via API keys (not cookies), CSRF is not a concern for those endpoints — API keys are not automatically attached by the browser. CSRF protection applies to cookie-authenticated endpoints only.

---

## 6. SQL and NoSQL Injection {#injection}

### SQL Injection

If you use a relational database, parameterise every query. No exceptions. No "but this value comes from our own code." Parameterise everything.

```
WRONG: `SELECT * FROM users WHERE id = ${userId}`
RIGHT: `SELECT * FROM users WHERE id = $1` with parameter [userId]
```

Use an ORM or query builder that parameterises by default (Prisma, Drizzle, Knex, SQLAlchemy). If writing raw SQL, use parameterised queries exclusively.

### NoSQL Injection (Firebase/Firestore, MongoDB)

NoSQL databases are not immune to injection. MongoDB is vulnerable to operator injection:

```
WRONG (MongoDB):
  db.users.find({ username: req.body.username, password: req.body.password })
  
  Attack: { "username": "admin", "password": { "$ne": "" } }
  Result: Matches any admin with a non-empty password
```

**Firestore-specific:**
Firestore Security Rules are your primary defence. Rules run server-side and cannot be bypassed by client code.

- Write rules for every collection and document path
- Validate data types and value ranges in rules
- Never use `allow read, write: if true` in production
- Test rules using the Firebase emulator and the rules testing library
- Rules do not cascade — a rule on a parent collection does not apply to subcollections

```
// WRONG: too permissive
match /users/{userId} {
  allow read, write: if request.auth != null;
}

// RIGHT: scoped to the authenticated user
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### ORM Pitfalls

ORMs protect against injection by default, but raw query escapes bypass that protection:

```
// Prisma - safe by default
await prisma.user.findMany({ where: { email: userInput } })

// Prisma - raw query, injection risk if not parameterised
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`
// (template literal syntax in Prisma is actually safe — but string concatenation is not)
```

Audit your codebase for raw queries. Ensure all of them use parameterisation.

---

## 7. Security Headers {#headers}

### Essential Headers

Set these on every response from your application:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://your-api-domain.com; frame-ancestors 'none';
```

CSP is the most impactful security header. It blocks inline scripts (XSS mitigation), restricts which domains can load resources, and prevents clickjacking (`frame-ancestors 'none'`). Start strict and loosen only as needed, documenting each exception.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

HSTS forces HTTPS for the specified duration.

```
X-Content-Type-Options: nosniff
```

Prevents browsers from MIME-sniffing responses, which can turn non-executable content into executable content.

```
X-Frame-Options: DENY
```

Prevents your site from being embedded in iframes (clickjacking protection). Redundant with CSP `frame-ancestors` but still worth setting for older browsers.

```
Referrer-Policy: strict-origin-when-cross-origin
```

Controls how much URL information is sent in the Referer header. `strict-origin-when-cross-origin` sends the full URL for same-origin requests, only the origin for cross-origin HTTPS requests, and nothing for HTTPS-to-HTTP.

```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

Disables browser features your application does not use. Reduces attack surface from compromised third-party scripts.

```
X-XSS-Protection: 0
```

Disable the browser's built-in XSS filter — it is buggy and can introduce vulnerabilities. Rely on CSP instead.

### CSP for AI Features

If your AI features render markdown or rich content, your CSP needs to allow the required resources while staying restrictive:

- `script-src 'self'` — No inline scripts. All JS in files.
- `style-src 'self' 'unsafe-inline'` — Inline styles are often needed for dynamic content. If you can avoid them, use a nonce-based CSP instead.
- `img-src 'self' data: https:` — AI-generated content may reference external images. Restrict to HTTPS.
- `connect-src 'self' https://your-api.com` — Restrict AJAX/fetch to your own domains.

---

## 8. Dependency Security {#dependencies}

### The Risk

Your application's dependencies (npm packages, Python packages, etc.) can contain vulnerabilities or malicious code. A compromised dependency runs with your application's full permissions.

### Prevention

**Audit regularly:**
```
npm audit            (Node.js)
pip-audit            (Python)
```

Run these in CI on every build. Fail the build on critical or high severity vulnerabilities.

**Lock dependencies:**
Use lockfiles (`package-lock.json`, `yarn.lock`, `poetry.lock`). Commit them to version control. This ensures builds are reproducible and prevents supply chain attacks where a malicious version is published after you develop locally.

**Pin major versions:**
Use exact versions or pin to major version (`"express": "^4.18.2"` not `"express": "*"`). Automated dependency update tools (Dependabot, Renovate) will propose updates for review.

**Review before adding:**
Before adding a new dependency, check:
- Download count and trend (is it widely used?)
- Maintenance activity (last commit, open issues)
- Number of dependencies it pulls in (transitive dependency count)
- Whether you can achieve the same thing with built-in APIs or a smaller library
- Security track record (search for past CVEs)

**Subresource Integrity (SRI):**
If loading scripts from CDNs, use SRI hashes:
```html
<script src="https://cdn.example.com/lib.js" 
        integrity="sha384-abc123..." 
        crossorigin="anonymous"></script>
```

This ensures the CDN-served file matches what you expect. If the CDN is compromised, the browser refuses to execute the modified script.

---

## 9. File Upload Security (General) {#file-uploads}

### Validation

1. **File type:** Validate MIME type from file content (magic bytes), not just the extension or Content-Type header. Both can be spoofed.
2. **File size:** Enforce server-side. Client-side limits are for UX.
3. **Filename:** Sanitise. Strip path traversal characters (`../`, `..\\`). Generate a new random filename on the server. Never use the client-provided filename for storage.
4. **Content scanning:** Run antivirus/malware scanning on uploaded files before processing or storing them.

### Storage

- Store uploads outside the web root. Uploaded files should not be directly accessible via URL without access control.
- Serve uploaded files through an authenticated endpoint that checks the requesting user's permissions.
- Use a separate domain or CDN for serving uploaded content (prevents cookie theft if an uploaded file contains XSS).
- Set `Content-Disposition: attachment` on download responses to prevent browsers from rendering uploaded HTML/SVG files.

### Image-Specific

- Re-encode uploaded images server-side (open with an image library and save as a new file). This strips embedded payloads, EXIF data with location information, and potential exploits in image metadata.
- Limit image dimensions (e.g., max 4096x4096 pixels). Decompression bombs use small files that expand to enormous pixel dimensions.
- Validate image integrity — corrupt images that parse partially can crash processing libraries.

---

## 10. CORS {#cors}

### Configuration

```
Allowed origins: https://yourdomain.com, https://app.yourdomain.com
  (specific origins, never wildcard for authenticated endpoints)
  
Allowed methods: GET, POST, PUT, DELETE, OPTIONS
  (only what your API actually uses)
  
Allowed headers: Authorization, Content-Type, X-Request-ID, X-CSRF-Token
  (only what your client sends)
  
Credentials: true
  (if using cookies for auth — requires specific origin, not wildcard)
  
Max-Age: 86400
  (cache preflight responses for 24 hours to reduce OPTIONS requests)
```

### Common Mistakes

- `Access-Control-Allow-Origin: *` with credentials. This is invalid and browsers will reject it, but the intent reveals a misunderstanding of CORS.
- Reflecting the `Origin` header back as `Access-Control-Allow-Origin` without validation. An attacker sends `Origin: https://evil.com` and your server responds with `Access-Control-Allow-Origin: https://evil.com`. Validate the origin against your allowlist.
- Forgetting that CORS is enforced by browsers, not servers. Server-to-server requests bypass CORS entirely. CORS protects users' browsers, not your API.

---

## 11. Logging and Audit Trails {#logging}

### What to Log

```
Authentication events:
  - Login success/failure (with IP, user agent, timestamp)
  - MFA enrollment/verification
  - Password changes
  - Password reset requests
  - Account lockouts
  - Session creation/destruction
  
Authorization events:
  - Access denied (resource, user, reason)
  - Privilege escalation attempts
  - Admin actions (user management, settings changes)
  
Data events:
  - Data exports/downloads
  - Bulk data access
  - Account deletion
  - PII access (who accessed what)
  
Security events:
  - Rate limit violations
  - Input validation failures
  - CSRF token failures
  - Suspicious patterns (see anomaly detection)
```

### What Not to Log

- Passwords (even failed attempts — log the event, not the password)
- Full credit card numbers
- Session tokens or API keys (log last 4 characters for identification)
- PII unless required for the audit trail, and then only with encryption and access controls

### Log Security

- Logs are append-only. Application code cannot delete or modify log entries.
- Log storage is separate from application storage with independent access controls.
- Retention policy: security logs retained for minimum 1 year (adjust for regulatory requirements).
- Log access is itself logged (who viewed what logs, when).

---

## 12. Secrets and Environment Variables {#secrets}

### Never commit secrets to version control.

This includes:
- API keys (yours and third-party)
- Database credentials
- JWT signing keys
- Encryption keys
- OAuth client secrets
- Webhook secrets

Use `.gitignore` to exclude `.env` files. Use a pre-commit hook (e.g., git-secrets, trufflehog) to scan for accidental secret commits.

### Environment Variable Security

- `.env` files are for local development only. Production should use a secrets manager.
- Different secrets for each environment (dev, staging, production). A staging key compromise should not affect production.
- Rotate secrets that may have been exposed. If a developer leaves the team, rotate all secrets they had access to.

### In Next.js Specifically

- `NEXT_PUBLIC_` prefixed variables are embedded in client-side bundles. Never put secrets in `NEXT_PUBLIC_` variables.
- Server-side environment variables (without `NEXT_PUBLIC_`) are accessible only in API routes, `getServerSideProps`, and middleware. Use these for secrets.
- Verify by checking your built `.next` directory — search for any secret values that should not be there.

---

## 13. Database Security {#database}

### Access Control

- Application connects with a dedicated database user that has minimum required permissions. No admin/root access from the application.
- Different database users for different services if you run microservices.
- Database is not accessible from the public internet. Use private networking (VPC, private subnet). Access from developer machines goes through a bastion host or VPN.

### Encryption

- Encrypt data at rest (database-level encryption, all major cloud providers support this).
- Encrypt sensitive fields at the application level before storing (PII, financial data). This protects against database-level breaches.
- Encrypt connections to the database (TLS). Verify the certificate.

### Firestore-Specific

- Security Rules are your access control layer. Write comprehensive rules.
- Use `request.resource.data` validation in rules to enforce data schemas.
- Indexes can reveal data structure. Keep Firestore index configuration in version control and review changes.
- Firestore does not support field-level encryption natively. Encrypt sensitive fields in application code before writing.

### Backups

- Automated daily backups with retention policy (minimum 30 days).
- Test backup restoration regularly (quarterly minimum). An untested backup is not a backup.
- Store backups in a different region from your primary database.
- Encrypt backups at rest.
- Restrict backup access to a small set of operators.

---

## 14. Server and Infrastructure Hardening {#server}

### Principle of Least Privilege

Every component runs with the minimum permissions it needs. Your web server does not need write access to the entire filesystem. Your AI proxy service does not need database admin rights.

### Container Security (if using Docker/Kubernetes)

- Do not run containers as root. Use a non-root user in your Dockerfile.
- Use minimal base images (Alpine, distroless). Fewer packages = smaller attack surface.
- Scan container images for vulnerabilities (Trivy, Snyk Container).
- Do not store secrets in container images or environment variables passed at build time. Use runtime secret injection.
- Set resource limits (CPU, memory) on containers. Prevents a compromised container from consuming all host resources.

### Serverless Security (if using Vercel/Netlify/Firebase Functions)

- Function timeout limits prevent runaway execution (and cost).
- Memory limits serve the same purpose.
- Environment variables in the platform's dashboard are the secret management layer. Restrict who can view/edit them.
- Cold start behaviour can affect rate limiting if your rate limiter lives in-function memory. Use external state (Redis, database) for rate limiting.

### Firewall and Network

- Default deny on inbound traffic. Whitelist only required ports (443 for HTTPS, nothing else publicly).
- Outbound traffic restrictions: your application should only connect to known external services (AI providers, payment processors, email services, your own infrastructure). Block all other outbound traffic.
- Use a WAF (Web Application Firewall) in front of your application. Cloud providers and CDNs (Cloudflare, AWS WAF) offer managed WAF rules.

---

## 15. Payment and Billing Security {#payments}

### Stripe-Specific (since this is the common choice)

- Never handle raw card numbers. Use Stripe Elements or Checkout to keep card data off your servers entirely. This keeps you out of PCI DSS scope for most requirements.
- Verify Stripe webhook signatures on every webhook event. Use `stripe.webhooks.constructEvent()` with your webhook signing secret.
- Use idempotency keys on Stripe API calls to prevent double charges from retries.
- Store Stripe Customer IDs, not payment method details. Stripe manages the sensitive data.
- Use Stripe's test mode keys for development and staging. Never use live keys outside production.

### Webhook Verification

```
Verify EVERY incoming webhook:
  1. Check the signature header against your webhook secret
  2. Check the timestamp is recent (within 5 minutes)
  3. Look up the referenced object in your database to verify consistency
  4. Process idempotently (same webhook delivered twice produces the same result)
```

### Billing Integrity

- Cross-reference usage records with billing records. If you charge per AI request, your usage logs and Stripe charges should reconcile.
- Alert on billing anomalies: unexpected charges, failed payments, subscription changes not initiated by user actions.
- Handle payment failures gracefully. Retry failed charges on a schedule. After N failures, downgrade the account to free tier (do not delete data).

---

## 16. Account Security {#account-security}

### Account Enumeration Prevention

Do not reveal whether an account exists:
- Login: "Invalid email or password" (not "No account found" vs "Wrong password")
- Registration: "If this email is not already registered, you will receive a confirmation" (not "Email already exists")
- Password reset: "If an account exists, we have sent a reset link"

### Account Lockout

After 5 failed login attempts within 15 minutes, lock the account for 30 minutes. Notify the account owner via email. Allow unlock via email link.

Implement progressive delays: 1 second after 1st failure, 2 seconds after 2nd, 4 after 3rd. This slows brute force without locking out legitimate users who mistype once.

### Account Deletion

- Provide a self-service account deletion option (GDPR requirement).
- Soft-delete first (30-day recovery period), then hard-delete.
- Delete or anonymise all user data including: conversation history, uploaded files, AI-generated content, billing records (anonymise, do not delete — you need these for tax records), audit logs (retain anonymised for compliance period).
- Revoke all sessions, API keys, and OAuth tokens on deletion.
- Notify the user via email when deletion is scheduled and when it completes.

### Admin Access

- Admin accounts require MFA. No exceptions.
- Admin actions are logged with the specific admin user, action, target, and timestamp.
- Admin access to user data requires justification (ticketed support request, legal requirement).
- Implement admin IP allowlists if admin users work from known locations.
- Separate admin UI from the main application. Ideally a different subdomain with its own authentication.

---

## 17. Email Security {#email}

### Transactional Email

- Send email via a dedicated service (SendGrid, Postmark, AWS SES), not from your application server directly.
- Configure SPF, DKIM, and DMARC on your sending domain. This prevents attackers from spoofing emails from your domain.
- Do not include sensitive data in email bodies (no passwords, no API keys, no full account details). Include a link back to your application where the user can view details after authentication.

### Email Content Security

- Verify recipient email addresses (confirmation link on registration).
- Rate limit email sends per user (prevent abuse of your email service for spam).
- Sanitise any user-generated content included in emails (display names, message previews). An attacker could inject HTML into an email via their display name.

---

## 18. Regulatory Compliance Basics {#compliance}

This is not legal advice. Consult a lawyer for your specific jurisdiction.

### GDPR (if you have EU users)

- Privacy policy describing what data you collect, why, and how long you retain it.
- Cookie consent banner for non-essential cookies.
- Right to access: users can request a copy of their data.
- Right to deletion: users can request data deletion (section 16).
- Right to portability: users can request data in a machine-readable format.
- Data Processing Agreement (DPA) with your AI providers (they process your users' data).
- Record of processing activities documenting all data flows.
- Data breach notification within 72 hours to the supervisory authority if a breach risks user rights.

### CCPA (if you have California users)

- "Do not sell my personal information" link on your website.
- Disclose what personal information you collect and how it is used.
- Allow users to opt out of data sales.
- Do not discriminate against users who exercise their privacy rights.

### AI-Specific Considerations

- If you use user data to fine-tune models, users must consent and be able to opt out.
- AI-generated content may need to be labelled as AI-generated (EU AI Act requirements are evolving).
- If your AI makes consequential decisions (credit, hiring, healthcare), additional regulations apply. Consult a lawyer.

---

## 19. Security Testing {#testing}

### Automated Testing

**Static analysis (SAST):**
Run a static analysis tool on your codebase to detect vulnerabilities: hardcoded secrets, SQL injection patterns, XSS sinks, insecure configurations. Tools: Semgrep, SonarQube, ESLint security plugins.

**Dependency scanning:**
`npm audit` / `pip-audit` in CI on every build. Fail the build on critical vulnerabilities.

**Dynamic analysis (DAST):**
Run automated vulnerability scanning against a staging deployment. Tools: OWASP ZAP, Burp Suite (automated scan).

### Manual Testing

**Penetration testing:**
Hire a third-party penetration testing firm annually. Provide them with your threat model (including AI-specific threats) so they test the full surface.

**Code review:**
Security-focused code review on all changes to authentication, authorization, payment, and AI proxy code. These are the highest-risk areas.

### Security Checklists for PRs

Before merging code that touches security-sensitive areas:

```
[ ] No secrets in code or configuration files
[ ] Input validation on all new endpoints
[ ] Output encoding on all new rendered content
[ ] Authentication required on all new endpoints (unless intentionally public)
[ ] Authorization checks match the intended access model
[ ] New dependencies reviewed for security
[ ] Error messages do not leak internal details
[ ] Rate limiting applied to new endpoints
[ ] Logging added for security-relevant events
```

---

## 20. Deployment Security {#deployment}

### CI/CD Pipeline

- Only the CI/CD pipeline deploys to production. No manual deployments, no SSH-and-copy.
- Pipeline runs tests (including security checks) before every deploy.
- Pipeline accesses production secrets only at deploy time, does not cache them.
- Deployment is auditable: who triggered it, what commit was deployed, when.
- Rollback capability: you can revert to the previous version within minutes.

### Environment Separation

- Development, staging, and production are separate environments with separate credentials.
- Production data never reaches development or staging environments. Use synthetic data for testing.
- Staging mirrors production configuration (same infrastructure, same security settings) for accurate testing.

### Vercel-Specific

- Deployment protection: use Vercel's password protection or team-only access for preview deployments. Preview URLs are public by default — do not test with real data on unprotected preview deployments.
- Environment variables: set production secrets in the Vercel dashboard, scoped to production environment only.
- Custom domains: configure HTTPS (automatic with Vercel) and verify DNS ownership.
- Serverless function size limits and timeout limits act as natural resource constraints. Verify they are appropriate for your AI proxy functions.
