# Rate Limiting for AI SaaS Endpoints

## Table of Contents
1. [Why AI Endpoints Need Different Rate Limiting](#why-different)
2. [Token-Aware Rate Limiting](#token-aware)
3. [Sliding Window Algorithm](#sliding-window)
4. [Concurrent Request Limiting](#concurrent)
5. [Tiered Rate Limits](#tiered)
6. [Feature-Specific Limits](#feature-specific)
7. [Rate Limit Response Headers](#headers)
8. [Bypass Prevention](#bypass-prevention)
9. [Implementation Patterns](#implementation)
10. [Testing Rate Limits](#testing)

---

## 1. Why AI Endpoints Need Different Rate Limiting {#why-different}

Standard API rate limiting counts requests per time window. This is insufficient for AI endpoints because request cost varies by orders of magnitude. A request with 10 input tokens and a request with 100,000 input tokens cost vastly different amounts, but a simple request counter treats them identically.

AI rate limiting must track two dimensions: request count (to prevent infrastructure abuse) and token volume (to prevent cost abuse). Both must be enforced simultaneously.

Additionally, AI requests are slow. A typical API call returns in 50-200ms. An AI completion can take 5-60 seconds. This means concurrent request limits matter far more than they do for fast APIs, because each in-flight request holds server resources and provider capacity for much longer.

---

## 2. Token-Aware Rate Limiting {#token-aware}

### The Problem

A user sends 100 requests per hour. Under a simple rate limiter, this is fine if the limit is 100/hr. But if each request includes a 50-page document (80,000 tokens input) and requests a 4,000-token response, that user is consuming 8.4 million tokens per hour. At typical pricing, that is $25-80 per hour for a single user.

### The Solution

Track token usage alongside request count. Enforce limits on both.

```
Token Budget Structure:
├── Input tokens consumed (tracked per request from provider response)
├── Output tokens consumed (tracked per request from provider response)
├── Total tokens = input + output
├── Budget period (hourly, daily, monthly)
└── Limits applied per user, per feature, per tenant
```

### Pre-Request Token Estimation

Before sending a request to the AI provider, estimate the token cost:

1. Count input tokens using a tokenizer (tiktoken for OpenAI, Anthropic's tokenizer for Claude). This is an exact count for input.
2. The output token count is unknown before generation. Use `max_tokens` as the upper bound for budget reservation.
3. Reserve the estimated cost from the user's budget. If the reservation exceeds the remaining budget, reject the request before it reaches the provider.
4. After the response completes, reconcile: release the unused portion of the reservation (actual output tokens will be less than max_tokens in most cases).

### Post-Request Token Accounting

Every AI provider returns actual token usage in the response metadata. Use these exact numbers (not estimates) for billing and budget tracking.

```
Provider response metadata (typical):
{
  "usage": {
    "input_tokens": 1523,
    "output_tokens": 847,
    "total_tokens": 2370
  }
}
```

Store this per-request, aggregate per-user, and check against budgets.

### Implementation Notes

- Run the tokenizer server-side. Client-side token counting can be spoofed.
- For streaming responses, count output tokens incrementally. If the running total approaches the budget limit, cancel the stream.
- Cache tokenizer instances. Re-initialising a tokenizer per request adds latency.
- Account for system prompt tokens. Your system prompt uses tokens on every request, and users cannot control this cost. Factor it into your pricing model, not the user's budget.

---

## 3. Sliding Window Algorithm {#sliding-window}

### Why Not Fixed Windows

Fixed window rate limiting divides time into discrete blocks (e.g., 12:00-12:01, 12:01-12:02). A user can make their full quota of requests at 12:00:59 and again at 12:01:00, effectively doubling their rate at window boundaries.

For AI endpoints where each request is expensive, this boundary burst can double your cost exposure in the worst case.

### Sliding Window Implementation

Use a sliding window log or sliding window counter. The log approach stores each request timestamp and counts requests within the trailing window. The counter approach approximates by weighting the previous window's count.

**Sliding Window Log (precise, more memory):**
```
For a 60-second window with 10 request limit:
1. On each request, record timestamp
2. Remove all timestamps older than (now - 60 seconds)
3. Count remaining timestamps
4. If count >= 10, reject
```

Use sorted sets in Redis for this. ZRANGEBYSCORE to trim old entries, ZCARD to count.

**Sliding Window Counter (approximate, less memory):**
```
For a 60-second window with 10 request limit:
1. Track count for current minute and previous minute
2. Weight = (seconds remaining in current minute) / 60
3. Effective count = (previous minute count * weight) + current minute count
4. If effective count >= 10, reject
```

This uses two counters per window instead of storing every timestamp. The approximation error is small and always conservative (may reject slightly early, never late).

### Recommended Approach

Use sliding window counters for request-count limiting (low memory, good enough accuracy) and sliding window logs for token-budget limiting (need precise accounting, worth the memory cost).

---

## 4. Concurrent Request Limiting {#concurrent}

### The Problem

A user opens 50 browser tabs and sends a request in each simultaneously. Even if they are within their per-minute rate limit, all 50 requests hit your provider at once. This consumes 50 slots of provider rate limit capacity, potentially blocking other users.

With AI requests taking 5-30 seconds each, these 50 concurrent requests hold resources for the entire duration. The user has effectively monopolised your AI capacity.

### The Solution

Track in-flight requests per user. Before sending a request to the provider, check the count. If it exceeds the limit, queue or reject.

```
Concurrent limit by tier:
├── Free: 1 concurrent request
├── Starter: 3 concurrent requests
├── Pro: 5 concurrent requests
└── Enterprise: 10-20 concurrent requests (configurable)
```

### Implementation

Use an atomic counter (Redis INCR/DECR or database row lock). Increment before sending to provider, decrement when the response completes (including errors and timeouts). Use a TTL on the counter as a safety net — if your decrement fails (process crash, network error), the counter auto-expires rather than permanently blocking the user.

Set the TTL to your maximum allowed request duration plus a buffer (e.g., 120 seconds if your timeout is 90 seconds).

### Edge Case: Streaming Responses

Streaming responses are "in flight" for their entire duration, which can be 30-60 seconds for long completions. The concurrent limit applies for the full stream duration. Warn users in your UI if they try to send a new message while a stream is active.

---

## 5. Tiered Rate Limits {#tiered}

### Structure

Every AI SaaS needs at minimum three tiers. Define limits for each dimension separately.

```
Free Tier:
  requests_per_minute: 5
  requests_per_hour: 30
  requests_per_day: 100
  tokens_per_day: 25,000
  max_tokens_per_request: 1,000
  concurrent_requests: 1
  max_input_length: 4,000 characters
  features: [chat]

Paid Tier:
  requests_per_minute: 20
  requests_per_hour: 200
  requests_per_day: 2,000
  tokens_per_day: 500,000
  max_tokens_per_request: 4,000
  concurrent_requests: 3
  max_input_length: 20,000 characters
  features: [chat, document_processing, image_generation]

Enterprise Tier:
  requests_per_minute: custom
  requests_per_hour: custom
  requests_per_day: custom
  tokens_per_day: custom (pooled across org)
  max_tokens_per_request: 8,000
  concurrent_requests: 10
  max_input_length: 100,000 characters
  features: [all]
```

### Implementation Notes

- Store tier configuration as data, not code. You will change limits frequently as you learn usage patterns.
- Enterprise limits should be configurable per customer, not a fixed tier.
- Track usage against the most restrictive applicable limit. A user might be under their hourly limit but over their daily limit.
- Free tier limits should be tight enough that a single abusive free user cannot cause meaningful cost. If your AI cost is $0.01 per request average, 100 free requests/day = $1/day/user worst case. Decide if that is acceptable at your projected free user count.

---

## 6. Feature-Specific Limits {#feature-specific}

Different AI features have different cost profiles. A chat message might cost $0.005. An image generation might cost $0.04. A document analysis might cost $0.50. Applying the same rate limit to all three either over-restricts cheap features or under-restricts expensive ones.

```
Feature-specific limits (example paid tier):
├── Chat completions: 200/hour, 500k tokens/day
├── Image generation: 20/hour, 100/day
├── Document processing: 10/hour, 50/day
├── Embedding generation: 1000/hour, 10k/day
├── Code generation: 100/hour, 200k tokens/day
└── Agent execution: 20/hour, 5 concurrent, 50k tokens per run
```

Each feature gets its own rate limit bucket. A user exhausting their image generation limit can still use chat.

---

## 7. Rate Limit Response Headers {#headers}

Return standard rate limit headers on every response from AI endpoints. This lets clients implement their own backoff logic and prevents unnecessary retry storms.

```
X-RateLimit-Limit: 200          # Max requests in window
X-RateLimit-Remaining: 147      # Requests remaining
X-RateLimit-Reset: 1714000000   # Unix timestamp when window resets
X-RateLimit-Limit-Tokens: 500000    # Max tokens in window
X-RateLimit-Remaining-Tokens: 312000 # Tokens remaining
Retry-After: 34                 # Seconds to wait (on 429 responses)
```

Return HTTP 429 (Too Many Requests) when any limit is hit. Include `Retry-After` header with the number of seconds until the relevant limit resets. Include a response body that specifies WHICH limit was hit (request count, token budget, concurrent limit) so the client can respond appropriately.

---

## 8. Bypass Prevention {#bypass-prevention}

### Account Cycling

Attackers create multiple free accounts to bypass per-user limits. Countermeasures:

- Require email verification before enabling AI features
- Rate limit AI access by verified phone number (one phone = one AI quota pool)
- Track device fingerprints and flag accounts sharing fingerprints
- Require payment method on file (even for free tier) — this is the strongest deterrent
- Monitor for accounts created from the same IP range in short succession
- Apply IP-based rate limits as a secondary layer (catches shared infrastructure abuse)

### Header Spoofing

If you rate limit by IP using X-Forwarded-For or similar headers, attackers can spoof these. Only trust IP information from your own infrastructure (load balancer, CDN). Configure your reverse proxy to strip or overwrite incoming X-Forwarded-For headers.

### API Key Sharing

Paid users sharing API keys to split costs. Monitor for API keys used from geographically impossible locations (London and Tokyo within minutes) or from excessive numbers of distinct IPs.

### Timing Attacks

Sophisticated attackers probe rate limit windows by measuring response times. Requests near the limit edge may show different latency patterns. Mitigate by adding small random delays to rate-limited responses (jitter).

---

## 9. Implementation Patterns {#implementation}

### Redis-Based Rate Limiter (Recommended)

Redis is the standard backing store for rate limiting. It provides atomic operations, TTL-based expiry, and sufficient performance for high-throughput checking.

Key structure:
```
ratelimit:{user_id}:{feature}:requests:{window}  → counter
ratelimit:{user_id}:{feature}:tokens:{window}    → counter
ratelimit:{user_id}:concurrent                    → counter
```

Use Lua scripts for atomic check-and-increment to prevent race conditions.

### Database-Backed Rate Limiter (Fallback)

If Redis is unavailable, use a database table with row-level locking. This works at lower throughput but adds latency. Acceptable for < 100 requests/second.

### In-Memory Rate Limiter (Single-Instance Only)

If you run a single server instance, in-memory rate limiting (Map/Object with TTL) works and avoids external dependencies. This breaks immediately when you add a second instance. Use only for MVPs or prototypes.

### Middleware Placement

Rate limiting middleware must run before any AI processing logic. The check order:

```
Request received
  → Authentication
  → Rate limit check (reject here if over limit, before any compute)
  → Input validation
  → Token estimation and budget check
  → AI provider call
  → Output filtering
  → Response
  → Post-request accounting (update counters with actual usage)
```

---

## 10. Testing Rate Limits {#testing}

### What to Test

1. Limits are enforced at the exact threshold (not off-by-one)
2. Sliding windows do not allow boundary bursts
3. Concurrent limits properly decrement on error/timeout
4. Token budget accounting matches provider-reported usage
5. Rate limit headers are accurate
6. 429 responses include correct Retry-After values
7. Different features have independent limit buckets
8. Tier upgrades take effect immediately
9. Redis/store failure degrades gracefully (fail-open vs fail-closed — decide which, document it, test it)

### Load Testing

Use a load testing tool to simulate:
- Single user at limit boundary
- Multiple users at limit boundary simultaneously
- Burst traffic from single user
- Gradual ramp to find the breaking point
- Provider timeout simulation (do concurrent counters decrement properly?)
- Redis failure simulation (does the system fail-open or fail-closed as designed?)

### Fail-Open vs Fail-Closed

If your rate limit store (Redis) is down, do you allow all requests (fail-open) or reject all requests (fail-closed)?

- **Fail-open** risks cost runaway during an outage. But users can still access the service.
- **Fail-closed** protects costs but blocks all users during an outage.

Recommended: fail-open with aggressive alerting and a global circuit breaker as the backup. A Redis outage is rare and brief. Blocking all users during it is usually worse than the cost risk.
