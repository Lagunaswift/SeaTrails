---
name: saas-production-security
description: "Use this skill whenever building, auditing, or hardening any SaaS application for production. Covers general web security (XSS, CSRF, injection, auth hardening, sessions, security headers, dependency security, file uploads, CORS, payments, compliance, deployment) and production readiness (subscription state management, billing edge cases, feature flags, data integrity, load balancing, disaster recovery, queue management, database migrations, error handling and resilience patterns, latency optimisation, observability, API versioning, governance, documentation, testing strategy, vendor lock-in, cloud costs, support operations). Trigger on any mention of: SaaS security, production readiness, security audit, security hardening, security headers, CSRF, XSS, auth hardening, session security, subscription states, billing logic, feature flags, disaster recovery, database migrations, load balancing, API versioning, deployment security, GDPR, PCI compliance, or any request to make an application production-grade. Also trigger when the user mentions going from MVP to production, hardening an app, or preparing for launch."
---

# SaaS Production Security

Before writing any code, read the relevant reference files:

- `references/web-security.md` — Transport security, auth hardening, sessions, XSS, CSRF, injection, security headers, dependencies, file uploads, CORS, logging, secrets, database security, server hardening, payments, account security, email, compliance, security testing, deployment
- `references/production-readiness.md` — Subscription states, billing, feature flags, data integrity, load balancing, multi-region, disaster recovery, queues, migrations, error handling, latency, observability, API versioning, user lifecycle, governance, documentation, testing, vendor lock-in, cloud costs, support ops

---

## Threat Model

Every SaaS application faces the same baseline threats regardless of what it does. These are not theoretical — they are the attacks that automated scanners and opportunistic attackers run against every publicly accessible application within hours of deployment.

### The Attack Surface

**1. Authentication and Session Attacks**
Credential stuffing (automated login attempts using breached password lists), brute force, session hijacking, session fixation, OAuth flow manipulation, password reset abuse. If your auth is weak, nothing else matters.

**2. Injection Attacks**
SQL injection, NoSQL injection, XSS (stored, reflected, DOM-based), command injection, template injection. Any place where user input reaches an interpreter without sanitisation is a vulnerability.

**3. Data Exposure**
Misconfigured access controls, missing authorisation checks, IDOR (Insecure Direct Object References — user A accessing user B's data by changing an ID in the URL), exposed environment variables, secrets in client-side code, verbose error messages.

**4. Infrastructure Attacks**
DDoS, server misconfiguration, unpatched dependencies, compromised supply chain (malicious npm packages), exposed admin panels, missing security headers enabling clickjacking or content sniffing.

**5. Business Logic Abuse**
Subscription manipulation, payment fraud, coupon/referral abuse, rate limit circumvention, account enumeration, feature access beyond entitlement.

---

## Implementation Checklist

### Transport and Network
- [ ] HTTPS on all endpoints, no exceptions
- [ ] HSTS enabled with minimum 1-year max-age
- [ ] TLS 1.2 minimum, TLS 1.3 preferred
- [ ] Certificate renewal automated and monitored
- [ ] CORS configured with specific origin allowlist (no wildcard on authenticated endpoints)
- [ ] WAF deployed in front of the application

### Authentication
- [ ] Passwords hashed with bcrypt (cost 12+) or Argon2id
- [ ] Passwords checked against breach databases (Have I Been Pwned)
- [ ] MFA available (TOTP at minimum), enforced for admin accounts
- [ ] OAuth state parameter validated on callback
- [ ] OAuth id_token signature and claims verified
- [ ] Password reset tokens: cryptographically random, hashed, single-use, 15-30 min expiry
- [ ] Account enumeration prevented (generic messages on login, reset, registration)
- [ ] Account lockout after 5 failed attempts with progressive delays
- [ ] Login, logout, MFA, and password events logged with IP and user agent

### Sessions
- [ ] Session IDs cryptographically random (128+ bits entropy)
- [ ] Sessions stored server-side (Redis or database)
- [ ] Cookie flags: HttpOnly, Secure, SameSite=Lax (or Strict), appropriate Max-Age
- [ ] Session rotation on privilege changes (login, password change, plan upgrade)
- [ ] Idle timeout (30 min) and absolute timeout (24 hr)
- [ ] If using JWTs: short-lived (15-30 min), refresh token rotation, server-side revocation

### Input Protection
- [ ] CSRF tokens on all state-changing endpoints (or SameSite=Strict cookies)
- [ ] All database queries parameterised (no string concatenation, ever)
- [ ] Firestore Security Rules written and tested for every collection (if applicable)
- [ ] Input validation on every endpoint (type, length, format)
- [ ] File uploads: MIME validated via magic bytes, size limited, filename sanitised, antivirus scanned
- [ ] Uploaded files stored outside web root, served through authenticated endpoint

### Output Protection
- [ ] XSS prevention: all dynamic content encoded for its context (HTML, attribute, JS, URL)
- [ ] User-generated and AI-generated content sanitised before rendering (DOMPurify or equivalent)
- [ ] Content Security Policy header deployed (strict, no unsafe-inline for scripts)
- [ ] All security headers set: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- [ ] Error messages reveal no internal details (stack traces, query strings, internal URLs)

### Secrets and Dependencies
- [ ] No secrets in source code (pre-commit hook scanning with git-secrets or trufflehog)
- [ ] Separate secrets per environment (dev, staging, production)
- [ ] Production secrets in a secrets manager, not environment variables on developer machines
- [ ] NEXT_PUBLIC_ variables verified to contain no secrets (if Next.js)
- [ ] npm audit / pip-audit running in CI, failing on critical vulnerabilities
- [ ] Lockfiles committed to version control
- [ ] New dependencies reviewed before adoption

### Database
- [ ] Application connects with minimum-privilege database user
- [ ] Database not accessible from public internet
- [ ] Encryption at rest enabled
- [ ] Application-level encryption on PII fields
- [ ] Database connections use TLS
- [ ] Automated daily backups with tested restoration (quarterly test minimum)
- [ ] Backups stored in a different region, encrypted at rest

### Payments (if applicable)
- [ ] No raw card data handled (Stripe Elements or Checkout)
- [ ] Stripe webhook signatures verified on every event
- [ ] Idempotency keys on payment API calls
- [ ] Payment failures handled with retry schedule and graceful downgrade
- [ ] Usage records reconciled against billing records

### Logging and Audit
- [ ] Auth events logged (login, logout, MFA, password changes, lockouts)
- [ ] Admin actions logged (user management, settings changes)
- [ ] Access denied events logged
- [ ] Data export and bulk access logged
- [ ] Logs are append-only with independent access controls
- [ ] No passwords, full card numbers, or session tokens in logs
- [ ] Log retention: minimum 1 year for security logs

### Compliance
- [ ] Privacy policy published
- [ ] Cookie consent implemented (if applicable)
- [ ] Self-service data export (right to portability)
- [ ] Self-service account deletion with soft-delete recovery window
- [ ] Data Processing Agreements with third-party processors
- [ ] Breach notification process documented

### Deployment
- [ ] CI/CD is the only path to production
- [ ] Security checks (SAST, dependency audit) run in CI pipeline
- [ ] Staging environment mirrors production configuration
- [ ] Preview/staging deployments access-protected
- [ ] Rollback procedure documented and tested
- [ ] Annual third-party penetration test

### Production Readiness
- [ ] Subscription state machine implemented (trial → active → past_due → suspended → cancelled → churned)
- [ ] Mid-cycle upgrade/downgrade proration handled
- [ ] Usage-based billing metered accurately with user-facing dashboard
- [ ] Feature flags for all major features including a global kill switch
- [ ] Kill switch tested quarterly
- [ ] Idempotency on all state-changing money operations
- [ ] Circuit breakers on all external dependencies
- [ ] Timeouts configured per dependency (not one global timeout)
- [ ] Load balancer drain timeout matches maximum request duration
- [ ] Health checks lightweight and independent of main processing
- [ ] Disaster recovery: RTO/RPO defined, tested quarterly
- [ ] Dead letter queue for failed background jobs
- [ ] Database migrations follow zero-downtime expand-contract pattern
- [ ] Structured logging with trace IDs across request lifecycle
- [ ] Four dashboards: service health, business metrics, cost tracking, user experience
- [ ] API versioned with deprecation policy (if exposing API)
- [ ] Runbooks for: key rotation, deploy rollback, backup restore, incident response
- [ ] System prompt / config changes go through version control and review
- [ ] Support tooling: user lookup, conversation viewer, credit/refund tool, account actions

---

## Priority Order

If building from scratch, implement in this order:

1. **HTTPS and security headers** — one-time configuration, blocks entire classes of attacks
2. **Auth with proper password hashing and session management** — without this, nothing is protected
3. **Input validation and parameterised queries** — prevents injection attacks
4. **CSRF protection** — prevents cross-site attacks on authenticated users
5. **XSS prevention and CSP** — prevents script injection
6. **Secrets management** — keeps credentials out of source code
7. **Audit logging** — you need to know what happened when something goes wrong
8. **Rate limiting** — prevents abuse and brute force
9. **Payment security** — if handling payments, get this right early
10. **Feature flags and kill switch** — operational control without deploying
11. **Subscription state machine** — handle the full lifecycle, not just "free" and "paid"
12. **Error handling and circuit breakers** — resilience against dependency failures
13. **Monitoring and dashboards** — visibility into what is happening
14. **Queue management** — for anything that does not need synchronous processing
15. **Database migration strategy** — before you need it, not during a crisis
16. **Disaster recovery** — define RTO/RPO, test quarterly
17. **API versioning** — before you have external consumers, not after
18. **Documentation and runbooks** — before the first incident, not during it

---

## Common Mistakes

**Treating security as a feature to add later.** Auth, input validation, and output encoding are cheaper to build correctly from the start than to retrofit. Every week of delay accumulates technical debt that compounds.

**One global timeout for everything.** A 30-second timeout on cache reads means a cache miss takes 30 seconds to fail. A 1-second timeout on AI provider calls means every request fails. Configure timeouts per dependency based on expected response times.

**No subscription states beyond free and paid.** The first time a payment fails, you discover you have no past_due state, no grace period, no retry logic, and no path to recovery. Users churn because your system immediately locked them out instead of retrying.

**Feature flags as an afterthought.** The first time you need to disable a feature in production without deploying, you will wish you had built flags from the start. The kill switch you add in a panic at 2am is the one you should have built on day one.

**Untested backups.** A backup you have never restored is a file, not a backup. Test restoration quarterly. Verify data integrity after restoration. Time the process so you know your actual RTO.

**Console.log as an observability strategy.** Unstructured text logs are unsearchable at scale. Structured JSON logs with trace IDs, user IDs, and request metadata are queryable, alertable, and aggregatable. The migration from unstructured to structured gets harder the longer you wait.

**Manual deployments.** "I will just SSH in and fix it" works until it causes a production outage because the fix was not tested, not reviewed, and not reversible. CI/CD is infrastructure, not overhead.
