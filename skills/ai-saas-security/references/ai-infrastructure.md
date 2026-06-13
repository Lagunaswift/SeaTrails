# AI Infrastructure Security

## Table of Contents
1. [AI Endpoint Authentication](#ai-auth)
2. [Provider API Key Management](#provider-keys)
3. [Multi-Tenant AI Context Isolation](#multi-tenant)
4. [AI Response Caching](#caching)
5. [Monitoring and Observability](#monitoring)
6. [Graceful Degradation](#degradation)
7. [Webhook and Callback Security for Async AI](#webhooks)
8. [Network Configuration for AI Proxies](#network)
9. [Incident Response Playbooks](#incident-response)

For general infrastructure security (auth hardening, session management, secrets management, server hardening, deployment), see the `saas-production-security` skill. This file covers infrastructure concerns specific to the AI proxy layer.

---

## 1. AI Endpoint Authentication {#ai-auth}

### Zero Unauthenticated AI Access

No AI endpoint should be accessible without authentication. An unauthenticated endpoint with AI behind it is an unlimited credit card left on a public counter.

This is the most impactful single control. Implementing auth on AI endpoints blocks the highest-volume attack vector (anonymous abuse) immediately.

"But we want a demo experience for visitors." Rate limit unauthenticated access to 3-5 requests total, tied to IP + device fingerprint, using the cheapest model. Cap max_tokens at 200. This is a taste, not a product.

### Per-Request Authorization

Authentication confirms identity. Authorization confirms permission. On every AI request, verify:

1. User is authenticated (valid session/token/key)
2. User's account is active (not suspended, not deleted)
3. User's plan includes this AI feature
4. User has remaining budget/quota for this feature
5. User is not flagged for abuse

All five checks must pass before the request reaches the AI provider. Fail fast — check in order of cheapness (account status from cache, then budget from database).

### Customer API Keys for AI Access

If you offer an API that includes AI features, customer API keys need additional controls beyond standard API key security:

- Per-key token budgets (separate from the account-level budget)
- Per-key feature restrictions (a key might have chat access but not document processing)
- Per-key model restrictions (limit which AI models a key can access)
- Per-key rate limits (a key might have lower limits than the account total)
- Real-time usage tracking per key (visible to the customer in their dashboard)

---

## 2. Provider API Key Management {#provider-keys}

### These Are Your Most Valuable Secrets

A leaked provider API key gives an attacker direct access to your AI provider account with your billing. The financial exposure is immediate and potentially unbounded.

**Storage:**
- Secrets manager only (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault, Doppler)
- Never in source code, .env files on developer machines, or client-side code
- Never in CI/CD logs or build artifacts

**Access:**
- Only your AI proxy service reads provider keys
- No other service, no human (except during rotation), no CI/CD pipeline needs direct access
- Audit all access to the secret store

**Rotation:**
1. Generate new key in provider dashboard
2. Update secret store with new key
3. Verify new key works (test request)
4. Deploy configuration pointing to new secret
5. Monitor for errors during rollover
6. Revoke old key after confirming zero usage on it
7. Complete within 1 hour

Rotate quarterly on schedule. Rotate immediately on suspected compromise.

**Environment separation:**
Separate keys for development, staging, production. Set low spend limits on dev and staging keys. A dev key with a $50/month limit cannot become a $10,000 incident.

---

## 3. Multi-Tenant AI Context Isolation {#multi-tenant}

### The Threat

In multi-tenant SaaS, different tenants' data must never cross boundaries. AI applications have unique leakage vectors because the AI's context window can mix data from different sources, and the AI may reference any content in its context when generating output.

### Isolation Requirements

**Context isolation:** Each AI request must contain only data from the requesting user's tenant. Verify tenant ID on every piece of data included in the prompt:

```
Data to verify per request:
  System prompt customisation → belongs to this tenant?
  Conversation history → belongs to this user in this tenant?
  RAG retrieval results → filtered by this tenant?
  Tool/function definitions → scoped to this tenant's permissions?
  File/document content → uploaded by this user in this tenant?
```

**Cache isolation:** Cache keys must include tenant ID. A cached response for Tenant A must never be served to Tenant B, even if the queries are identical.

```
WRONG: cache_key = hash(model + input_text)
RIGHT: cache_key = hash(tenant_id + model + system_prompt_version + input_text)
```

**RAG isolation:** Vector database queries must include a tenant filter. Every document in the vector store must be tagged with its tenant ID.

```
WRONG: vector_db.search(query=user_input, limit=5)
RIGHT: vector_db.search(query=user_input, limit=5, filter={"tenant_id": user.tenant_id})
```

**Fine-tuning isolation:** If you fine-tune models per tenant, use separate fine-tuning jobs. Verify training data ownership before submission. A model fine-tuned on Tenant A's data must never serve Tenant B.

### Testing Isolation

Write automated tests and run them in CI:

```
Test: "Tenant A's conversation history absent from Tenant B's AI context"
  1. Create conversation for Tenant A with distinctive content
  2. As Tenant B, send AI request referencing that content
  3. Verify AI response shows no knowledge of Tenant A's content

Test: "RAG retrieval respects tenant boundaries"
  1. Index document for Tenant A
  2. As Tenant B, query for content from that document
  3. Verify zero results returned

Test: "Cache does not serve cross-tenant responses"
  1. As Tenant A, send query and confirm response is cached
  2. As Tenant B, send identical query
  3. Verify Tenant B gets fresh response, not Tenant A's cached one
```

---

## 4. AI Response Caching {#caching}

### Why Cache

AI API calls are expensive and slow. Caching identical or similar requests saves money and reduces latency. A well-implemented cache can cut provider costs 20-50% for products with repetitive query patterns.

### Exact Match Caching

Cache the full AI response keyed by a hash of: tenant_id + model + system_prompt_version + input_text.

```
TTL: 1-24 hours depending on feature
```

Works well for: classification, extraction, FAQ-style queries.
Does not work for: creative generation, personalised responses, time-sensitive queries.

### Semantic Caching

Use embeddings to find cached responses for semantically similar queries.

```
Flow:
  1. Embed user's input
  2. Search cache for embeddings within cosine similarity threshold (0.95)
  3. If match → return cached response
  4. If no match → call provider, cache response with embedding
```

Requires: embedding model, vector similarity search, carefully tuned threshold.

### Cache Invalidation

Invalidate when:
- System prompt changes (all cached responses are stale)
- RAG knowledge base updates
- User reports incorrect cached response
- TTL expires

Tag cached responses with system_prompt_version and knowledge_base_version. Version change invalidates all matching cache entries.

### Cache Security

- Never serve across tenant boundaries (section 3)
- Do not cache responses flagged by content filters
- Do not cache responses containing detected PII (or cache only the redacted version)
- Encrypt cached data at rest if it may contain sensitive content
- Set reasonable TTLs — indefinite caching accumulates stale and potentially leaked data

---

## 5. Monitoring and Observability {#monitoring}

### AI-Specific Metrics

Beyond standard application monitoring (covered in the general skill), track these AI-specific metrics:

**Cost metrics (dashboard, check hourly):**
```
total_ai_spend_today (vs budget ceiling)
ai_spend_per_hour (trend)
ai_spend_per_user_average
ai_spend_per_feature
ai_cost_per_request_average
cost_per_token_average (verify against provider pricing)
cache_hit_rate (direct cost saving indicator)
```

**Performance metrics (dashboard, continuous):**
```
time_to_first_token_p50_p95_p99
tokens_per_second_streaming
provider_error_rate
provider_timeout_rate
```

**Security metrics (dashboard + alerts):**
```
injection_detection_rate (% of requests flagged)
content_policy_violation_rate (input and output)
pii_detection_rate_in_outputs
system_prompt_leak_count
rate_limit_hit_rate
```

### Alert Thresholds

```
Warning:
  Total hourly AI spend > 1.5x rolling average
  Provider error rate > 10%
  Average TTFT > 2x baseline

Critical:
  Total hourly AI spend > 3x rolling average
  Provider error rate > 50%
  Circuit breaker tripped

Emergency:
  Daily AI budget exceeded
  Provider API key suspected compromised
  Single user generating > 10% of total platform AI cost
```

### Notification Channels

- Warning: Slack channel, email to engineering
- Critical: PagerDuty, SMS to on-call
- Emergency: PagerDuty high-urgency, SMS to on-call + engineering lead + CTO

---

## 6. Graceful Degradation {#degradation}

### When the Provider Is Down

**Tier 1: Failover to secondary provider.**
Route to an alternative provider. Response quality may differ. Inform the user if quality is expected to be lower.

**Tier 2: Serve cached responses.**
If an exact or semantic cache hit exists, serve it with a note: "Using a cached response while our AI service is recovering."

**Tier 3: Queue for later.**
Accept the request, queue it, process when provider recovers. Inform the user of the delay. Only viable for non-real-time features.

**Tier 4: Disable AI features gracefully.**
Clear message that AI features are temporarily unavailable. Non-AI features remain fully operational.

### When Over Budget

If the global circuit breaker trips:
1. Downgrade all requests to cheapest viable model
2. Reduce max_tokens to minimum useful value
3. Disable non-essential AI features (suggestions, background processing)
4. Keep essential AI features running on restricted budget
5. Alert the team for manual review

### When Under Attack

If coordinated abuse is detected:
1. Enable emergency rate limiting
2. Require CAPTCHA on AI endpoints
3. Temporarily disable free-tier AI access
4. Block offending IPs/accounts
5. Switch to queue-based processing

---

## 7. Webhook and Callback Security for Async AI {#webhooks}

### Outgoing Webhooks (Your System → User's Endpoint)

If you notify users via webhook when async AI processing completes:

1. **Validate the URL.** Reject internal/private IPs, reject non-HTTPS.
2. **Sign the payload.** HMAC signature so the recipient verifies authenticity.
3. **Minimal payload.** Send a notification with result ID. Recipient fetches full result via authenticated API.
4. **Retry with backoff.** 3 retries, exponential backoff, then mark delivery failed.
5. **Rate limit delivery.** A flood of completed AI tasks should not overwhelm the recipient.

### Incoming Callbacks (Provider → Your System)

If receiving async completion notifications from an AI provider:

1. **Verify source.** Check signatures, IP allowlists, or shared secrets.
2. **Validate payload.** Look up the referenced job ID in your database. Verify it exists and belongs to the expected user.
3. **Idempotency.** Process each callback exactly once using the job ID as key.

---

## 8. Network Configuration for AI Proxies {#network}

### Architecture

Your AI proxy service (the service that calls the AI provider) should:
- Not be directly accessible from the internet
- Accept requests only from your API gateway or backend services
- Use service mesh authentication (mutual TLS) for internal communication
- Have network-level access controls restricting which services can call it

### CORS for AI Endpoints

```
Allowed origins: your domain(s) only
Allowed methods: POST
Allowed headers: Authorization, Content-Type, X-Request-ID
Credentials: true (if session-based auth)
```

No wildcard origins on AI endpoints.

### DDoS Protection

AI endpoints are attractive DDoS targets because each request is expensive. Configure your CDN/WAF with:
- Lower rate limit thresholds than other endpoints
- Aggressive bot detection
- CAPTCHA challenge for suspicious traffic
- Geographic restrictions if your user base is concentrated

---

## 9. Incident Response Playbooks {#incident-response}

### AI Cost Runaway

```
Detection: Global spend alert fires
Severity: Critical
Response time: 15 minutes

1. Check circuit breaker status. Trip it manually if not already tripped.
2. Check provider dashboard for unexpected charges.
3. Identify cause:
   a. Single user → suspend account, investigate
   b. Many users → check for bug in recent deploy, roll back
   c. No users → check for leaked API key, rotate immediately
4. Assess financial impact.
5. Restore at reduced capacity while investigating.
6. Post-incident: adjust thresholds, improve detection.
```

### Provider API Key Compromise

```
Detection: Unusual provider usage, unknown IPs, provider alert
Severity: Emergency
Response time: Immediate

1. Rotate key immediately (generate new, deploy, revoke old).
2. Check provider usage logs for unauthorised activity.
3. Assess financial damage.
4. Determine compromise vector (code commit, log exposure, insider, breach).
5. Audit all secret access for past 30 days.
6. Notify affected parties if user data was accessible.
7. Post-incident: review secrets management, add usage anomaly detection.
```

### Mass Prompt Injection Attack

```
Detection: Spike in injection alerts, user reports of unusual AI behaviour
Severity: High
Response time: 30 minutes

1. Enable emergency rate limiting.
2. Characterise the attack pattern from injection detection logs.
3. Update detection patterns for novel techniques.
4. Review AI outputs from attack period for data leakage.
5. Notify affected users if data may have been exposed.
6. Post-incident: update defences, add pattern to detection.
```

### Data Leakage via AI Output

```
Detection: User report, PII detection spike, system prompt leak alert
Severity: Critical
Response time: 15 minutes

1. Identify scope: how many users, which data, what time period.
2. Disable the affected AI feature.
3. Determine source (training data, cross-tenant context, system prompt, caching bug).
4. If cross-tenant: notify affected tenants per breach notification obligations.
5. Fix root cause (context isolation, caching, RAG filter).
6. Verify fix with isolation tests.
7. Re-enable at limited capacity, monitor.
8. Post-incident: full report, regulatory notification if required.
```
