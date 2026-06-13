# Production Readiness for AI SaaS

## Table of Contents
1. [Subscription State Machine](#subscription-states)
2. [Billing Edge Cases](#billing-edges)
3. [Feature Flags and Kill Switches](#feature-flags)
4. [Data Integrity and Consistency](#data-integrity)
5. [Load Balancing for AI Workloads](#load-balancing)
6. [Multi-Region and Data Residency](#multi-region)
7. [Disaster Recovery](#disaster-recovery)
8. [Queue and Background Job Management](#queues)
9. [Database Migrations and Schema Changes](#migrations)
10. [Error Handling and Resilience Patterns](#error-handling)
11. [Latency Optimisation](#latency)
12. [Observability Beyond Security](#observability)
13. [API Versioning and Contracts](#api-versioning)
14. [User Lifecycle Management](#user-lifecycle)
15. [Governance and Change Management](#governance)
16. [Documentation and Runbooks](#documentation)
17. [Testing Strategy](#testing)
18. [Vendor Lock-In and Portability](#vendor-lockin)
19. [Cloud Cost Management](#cloud-costs)
20. [Support Operations](#support-ops)

---

## 1. Subscription State Machine {#subscription-states}

### The Problem MVPs Ignore

An MVP has two states: free and paid. A production app has at least eight, and every transition between them affects what the user can do, what your system should allow, and what happens to in-flight AI requests.

### States

```
TRIAL
  → User signed up, free access to paid features for N days
  → AI features enabled with trial-tier limits
  → Transition: TRIAL → ACTIVE (payment added before expiry)
  → Transition: TRIAL → EXPIRED (no payment by deadline)

EXPIRED
  → Trial ended without payment
  → AI features disabled or downgraded to free tier
  → User data retained for N days (recovery window)
  → Transition: EXPIRED → ACTIVE (user adds payment)
  → Transition: EXPIRED → CHURNED (retention period ends)

ACTIVE
  → Paying customer, all plan features available
  → Transition: ACTIVE → PAST_DUE (payment fails)
  → Transition: ACTIVE → CANCELLING (user requests cancellation)
  → Transition: ACTIVE → ACTIVE (plan change — upgrade or downgrade)

PAST_DUE
  → Payment failed, retry in progress
  → AI features remain active during grace period (3-7 days typical)
  → Transition: PAST_DUE → ACTIVE (retry succeeds)
  → Transition: PAST_DUE → SUSPENDED (all retries exhausted)

SUSPENDED
  → Payment failed repeatedly, features disabled
  → User data retained, account accessible for billing management
  → AI features fully disabled
  → Transition: SUSPENDED → ACTIVE (user updates payment method)
  → Transition: SUSPENDED → CHURNED (retention period ends)

CANCELLING
  → User cancelled but current billing period has not ended
  → Full access until period end date
  → Transition: CANCELLING → FREE (period ends, user retains free-tier access)
  → Transition: CANCELLING → ACTIVE (user reactivates before period end)

FREE
  → No active subscription, free-tier limits apply
  → Transition: FREE → ACTIVE (user subscribes)

CHURNED
  → Account inactive beyond retention period
  → Data deletion scheduled per policy
  → Transition: CHURNED → ACTIVE (user returns and subscribes)
```

### AI-Specific State Concerns

**Mid-request plan changes.** A user on the Pro plan starts a long-running AI agent execution. While it is running, their payment fails and their account moves to PAST_DUE. What happens?

Options:
- Let the current request complete (bill for it, absorb the risk). This is the standard approach.
- Check plan status at each agent step and terminate if no longer valid (aggressive, poor UX).
- Queue a reconciliation check after the request completes (balanced — complete the work, then flag the cost discrepancy).

**Trial abuse.** Users create multiple trial accounts to get unlimited free AI access. Countermeasures from the rate limiting reference apply here (phone verification, device fingerprinting, payment method requirement). Additionally, tie trial eligibility to payment method — a card that was already used for a trial does not qualify for another.

**Downgrade handling.** User downgrades from Pro (100k tokens/day) to Free (25k tokens/day) mid-billing-cycle. If they have already used 60k tokens today, do they lose access immediately? Options:
- Immediate enforcement (disruptive, but simple)
- Enforce from next billing period (standard for most SaaS)
- Prorate and enforce from next day (compromise)

Document your choice. Users will ask.

---

## 2. Billing Edge Cases {#billing-edges}

### Proration

When a user upgrades mid-cycle, charge the prorated difference for the remaining days. When they downgrade, credit the unused portion. Your payment provider (Stripe) handles this if configured correctly, but you need to decide the policy and verify the implementation matches.

### Usage-Based Billing

If you charge per AI request or per token beyond a plan's included amount:

**Metering accuracy.** Your internal token counter and the provider's reported usage will drift (see cost-control.md section 11). Your billing must use your internal counter, not the provider's, because your internal counter is what you can audit and explain to a disputing customer. Reconcile monthly and investigate drift above 5%.

**Invoice timing.** Usage-based charges need a billing cycle cutoff. Requests that start before midnight and complete after midnight belong to the cycle in which they started (when the user initiated them), not when they completed. Decide this, document it, and implement it consistently.

**Spend alerts for users.** If users can incur usage-based charges, warn them before they hit overage thresholds. Alerts at 80% and 100% of included usage. Optional hard cap that blocks further AI requests when the limit is hit (some users want this, others want uninterrupted access with overage billing). Make it a user-configurable setting.

**Disputed charges.** Users will dispute AI charges they do not understand. Your logging must support showing the user exactly what they were charged for: timestamps, feature used, token count, cost. Build a usage dashboard early — it prevents support tickets.

### Refunds

Define a refund policy for AI usage:
- AI service errors (your bug, provider outage): automatic credit
- Content policy blocks (user's request was blocked after processing started): credit the input tokens, user did not receive output
- User dissatisfaction with AI output quality: no automatic credit (the service was provided), handle case-by-case

### Tax Handling

AI SaaS is subject to sales tax, VAT, or GST depending on jurisdiction. Use Stripe Tax or a similar service. Do not attempt to calculate tax yourself — the rules vary by jurisdiction and change frequently.

---

## 3. Feature Flags and Kill Switches {#feature-flags}

### Why Feature Flags Are Production Infrastructure

An MVP deploys features by shipping code. A production app deploys features by shipping code behind flags and enabling them independently of deployment. This separation is critical for AI features because:

- You can disable a misbehaving AI feature in seconds without a deploy
- You can roll out new AI features to a percentage of users and monitor before full release
- You can A/B test different AI models or prompts without code changes
- You can instantly downgrade all users to a cheaper model during a cost incident

### Flag Types

```
Release flags (temporary, removed after full rollout):
  new_document_summariser: true/false
  agent_v2_enabled: true/false

Operational flags (permanent, for runtime control):
  ai_global_kill_switch: true/false
  force_cheap_model: true/false
  max_tokens_override: null or number
  disable_image_generation: true/false
  rag_enabled: true/false

Experiment flags (temporary, for A/B testing):
  prompt_variant: "A" | "B" | "C"
  model_experiment: "sonnet" | "haiku"

Permission flags (permanent, per-tenant or per-user):
  beta_features_enabled: true/false
  custom_model_access: true/false
  api_access_enabled: true/false
```

### Implementation

Use a feature flag service (LaunchDarkly, Flagsmith, Unleash, or a simple database-backed solution). The flag check must be fast (< 5ms) — cache flag values in memory with a short TTL (10-30 seconds) and refresh from the source on a timer.

### Kill Switch Procedure

When you flip the global AI kill switch:

1. New AI requests are rejected immediately with a user-facing message
2. In-flight streaming responses continue to completion (aborting mid-stream is worse UX than the cost of completing them)
3. Background AI jobs are paused, not cancelled (they resume when the switch is off)
4. The user-facing message includes estimated restoration time if known
5. Non-AI features remain fully operational

Test the kill switch quarterly. If you have never flipped it, you do not know if it works.

---

## 4. Data Integrity and Consistency {#data-integrity}

### The Budget Deduction Problem

A user sends an AI request. Your system must:
1. Check budget → sufficient
2. Reserve budget (deduct estimated cost)
3. Send request to AI provider
4. Receive response
5. Reconcile budget (refund unused reservation)

If step 3 fails after step 2, you have deducted budget for work that was not done. If step 2 and step 3 are not atomic, a race condition allows two concurrent requests to both pass the check before either deduction is committed, exceeding the budget.

### Solutions

**Optimistic locking with version check.** Read the budget with a version number. Deduct and write back with a version check. If the version changed between read and write (another request modified it), retry.

**Atomic decrement.** Use an atomic operation (Redis DECRBY, Firestore transaction, SQL UPDATE ... WHERE balance >= cost) that checks and deducts in one operation. No race window.

**Saga pattern for multi-step operations.** For agent executions that span multiple AI calls, use a saga: each step has a compensating action. If step 4 fails, execute compensating actions for steps 3, 2, 1 (refund budget, clean up partial results).

### Eventual Consistency Risks

If your rate limit counters are in Redis and your budget tracking is in Firestore, these two systems can disagree. A request might pass rate limiting but fail the budget check, or vice versa. Accept this as an inherent property of distributed systems and design for it:

- Rate limiting is the fast path (Redis, ~1ms). It catches volume abuse.
- Budget checking is the authoritative path (database, ~10ms). It catches cost abuse.
- Both must pass. If they disagree temporarily, the more restrictive one wins.

### Idempotency

Every state-changing operation that touches money or AI usage should be idempotent. If a network timeout causes a retry, the retry should produce the same result as the original, not double the charge or double the AI call.

Implementation: assign a unique idempotency key to each operation. Before executing, check if that key has already been processed. If yes, return the stored result.

```
Idempotency scope:
  AI request submission: idempotency key = client-generated UUID
  Budget deduction: idempotency key = request ID
  Stripe charge: idempotency key = invoice ID + line item ID
  Webhook processing: idempotency key = webhook event ID
```

---

## 5. Load Balancing for AI Workloads {#load-balancing}

### Why AI Workloads Break Standard Load Balancing

Standard round-robin or least-connections load balancing assumes requests are roughly equal in duration. AI requests are not. A chat message takes 3 seconds. A document analysis takes 45 seconds. An agent execution takes 3 minutes.

A load balancer using least-connections will route all short requests to the instance that just finished a long one, while the instance running three long requests sits overloaded.

### Strategies

**Weighted least-connections.** Weight connections by expected duration. A document analysis counts as 10 connections. A chat message counts as 1. The load balancer considers weighted connections, not raw connection count.

**Separate pools.** Route different AI features to different server pools. Chat goes to a pool of small, fast instances. Document processing goes to a pool of larger instances with higher timeouts. Agent execution goes to a dedicated pool with long timeout configuration.

**Request queuing.** Instead of direct routing, use a work queue. Requests are enqueued with priority. Workers pull from the queue at their own pace. This decouples intake from processing and prevents overload. The queue depth becomes your backpressure signal — if the queue grows beyond a threshold, reject new requests or return estimated wait times.

### Connection Draining on Deploy

When deploying new code, the load balancer must drain existing connections before removing an instance. For AI requests that take 30-60 seconds, the drain timeout must accommodate this. Set drain timeout to your maximum request duration plus buffer (e.g., 120 seconds if max request is 90 seconds). A 5-second drain timeout (the default in many load balancers) will terminate in-flight AI requests mid-response.

### Health Checks

Standard health checks ping an endpoint and expect a fast response. If your AI service is under heavy load, the health check endpoint might be slow, causing the load balancer to mark it unhealthy and remove it — reducing capacity exactly when you need it most.

Use a dedicated lightweight health check endpoint that does not share resources with AI processing. It should verify the service is running and can accept connections, not that it can complete an AI request.

---

## 6. Multi-Region and Data Residency {#multi-region}

### Data Residency Requirements

GDPR and similar regulations may require that EU user data stays within the EU. This affects:

- Where your databases are hosted
- Which AI provider region you call (OpenAI and Anthropic offer EU endpoints)
- Where your caches store data
- Where your logs are stored
- Where backups are replicated

### AI Provider Region Routing

Route AI requests to the provider region that matches the user's data residency requirement:

```
User in EU → call AI provider's EU endpoint
User in US → call AI provider's US endpoint
User in APAC → call AI provider's US endpoint (if no APAC region available)
```

Check your AI provider's data processing terms for each region. Some providers process data in a specific region but may transfer it for model improvement unless you opt out.

### Multi-Region Architecture Considerations

Running your application in multiple regions adds complexity:

- Database replication across regions (read replicas for latency, write primary for consistency)
- Cache invalidation across regions
- Session management across regions (sticky sessions or distributed session store)
- Rate limit counter synchronisation (accept eventual consistency or use a global counter with higher latency)
- Deployment coordination (deploy to all regions simultaneously or roll out gradually)

Most AI SaaS applications do not need multi-region until they have thousands of users across continents. Start single-region with a clear migration path. The migration path means: do not hardcode assumptions about single-region (single database endpoint, single cache, single log store) deep into your code.

---

## 7. Disaster Recovery {#disaster-recovery}

### RTO and RPO

**Recovery Time Objective (RTO):** How long can your service be down before it causes unacceptable business damage? For most AI SaaS: 1-4 hours.

**Recovery Point Objective (RPO):** How much data loss can you tolerate? For most AI SaaS: 1 hour (you can lose up to 1 hour of conversation history).

These numbers drive your backup frequency, replication strategy, and failover architecture.

### DR Scenarios

**Scenario 1: AI provider outage.**
RTO: minutes (failover to secondary provider).
RPO: zero (no data loss, just degraded AI quality).
Action: automatic failover via multi-provider routing (see cost-control.md section 8).

**Scenario 2: Database failure.**
RTO: depends on backup restoration time (30 mins to 2 hours).
RPO: depends on backup frequency (1 hour if hourly backups).
Action: restore from latest backup. If using managed database (Firestore, RDS), the provider handles replication. Verify their SLA matches your RPO.

**Scenario 3: Full region outage (cloud provider failure).**
RTO: hours (DNS failover to another region, database replica promotion).
RPO: depends on replication lag.
Action: this is the expensive scenario to prepare for. Most startups accept the risk until scale justifies the investment. At minimum, ensure backups are stored in a different region so recovery is possible even if slow.

**Scenario 4: Data corruption (bad deploy, migration bug).**
RTO: minutes to hours (rollback deploy, restore data).
RPO: depends on when corruption was detected.
Action: deploy rollback procedure, point-in-time database recovery. This is the scenario that catches most teams unprepared because it is not an infrastructure failure — it is a code failure.

### DR Testing

Test disaster recovery quarterly. Simulate each scenario:
- Kill the AI provider connection and verify failover
- Restore from backup to a separate environment and verify data integrity
- Roll back a deployment and verify the previous version works
- Verify that monitoring and alerting fire correctly during each simulation

An untested DR plan is fiction.

---

## 8. Queue and Background Job Management {#queues}

### When to Queue AI Work

Not every AI request needs synchronous processing. Queue AI work when:

- Processing takes longer than the user is willing to wait (document analysis, batch operations)
- The result is not needed immediately (scheduled reports, digest emails)
- You need to control concurrency (limit parallel AI provider calls)
- You need retry guarantees (at-least-once processing)

### Queue Architecture

```
User request → API validates and enqueues → Returns job ID and status URL
Worker pulls from queue → Processes with AI provider → Stores result
User polls status URL (or receives webhook/push notification)
```

### Job Lifecycle

```
PENDING    → Job accepted, waiting in queue
PROCESSING → Worker picked up the job, AI request in progress
COMPLETED  → AI response received, result stored
FAILED     → Processing failed after all retries
CANCELLED  → User cancelled before processing started
EXPIRED    → Job sat in queue beyond maximum wait time
```

### Queue-Specific Concerns

**Dead letter queue.** Jobs that fail all retries go to a dead letter queue for manual investigation. Do not silently drop failed jobs.

**Job timeout.** Jobs in PROCESSING state for longer than the maximum expected duration are stuck. A monitor should detect and either retry or fail them. This catches worker crashes and hung AI provider connections.

**Priority queuing.** Paid users' jobs should process before free users' jobs. Enterprise users before standard paid. Implement queue priority, not separate queues per tier (separate queues require separate worker pools, which is more infrastructure for the same result).

**Queue depth monitoring.** If the queue grows beyond expected depth, either your workers are failing or demand exceeds capacity. Alert on queue depth. Display estimated wait time to users ("Your document is #47 in queue, estimated processing time: 12 minutes").

**Poison messages.** A job that consistently crashes workers is a poison message. After N consecutive failures on the same job, route it to the dead letter queue and continue processing other jobs. Do not let one bad job block the entire queue.

---

## 9. Database Migrations and Schema Changes {#migrations}

### Zero-Downtime Migrations

An MVP runs `ALTER TABLE` and hopes. A production app migrates without downtime.

The expand-contract pattern:

1. **Expand:** Add the new column/field/collection. Old code ignores it. New code writes to both old and new.
2. **Migrate:** Backfill existing data into the new structure. Run in batches, not all at once.
3. **Contract:** Remove the old column/field once all code reads from the new structure.

Each phase is a separate deployment. The database is always in a state that both old and new code can work with.

### Firestore-Specific

Firestore does not have a schema, but your application code imposes one. Migrations involve:

- Adding new fields: deploy code that writes the new field, then backfill existing documents
- Renaming fields: write to both old and new names, backfill, then stop reading the old name
- Changing field types: treat as a new field (write new type to new field name, backfill, deprecate old)
- Collection restructuring: create the new collection, dual-write during transition, backfill, switch reads, remove old collection

Backfill scripts for Firestore should use batched writes (500 docs per batch) with rate limiting to avoid hitting Firestore write limits.

### Migration Safety

- Every migration has a rollback plan. If the migration fails mid-way, you can reverse it.
- Test migrations against a copy of production data (anonymised) before running on production.
- Monitor database performance during migration. Large backfills can degrade query performance.
- Log migration progress. If a backfill of 1 million documents fails at document 750,000, you need to resume from there, not restart.

---

## 10. Error Handling and Resilience Patterns {#error-handling}

### Circuit Breaker Pattern (General)

Beyond the AI-specific circuit breaker in cost-control.md, apply circuit breakers to every external dependency: database, cache, email service, payment provider, analytics.

```
States:
  CLOSED: Normal operation. Track failure rate.
  OPEN: Failure rate exceeded threshold. All requests to this dependency 
        fail immediately (fast fail) instead of waiting for timeout.
  HALF_OPEN: After cooldown period, allow one test request through.
        If it succeeds, return to CLOSED. If it fails, return to OPEN.
```

This prevents cascade failures. If your database is slow, every request queues up waiting for database timeouts. With a circuit breaker, requests fail immediately once the database is detected as unhealthy, freeing up server resources.

### Bulkhead Pattern

Isolate resources so that failure in one area does not consume resources needed by others.

```
Example:
  Connection pool for AI provider: max 50 connections
  Connection pool for database: max 100 connections
  Connection pool for email service: max 10 connections
  
  If the AI provider is slow and all 50 AI connections are occupied,
  the database pool is unaffected. Non-AI features continue working.
```

### Retry Strategy (General)

Beyond AI-specific retries (cost-control.md section 7), standardise retry behaviour across all external calls:

```
Retry configuration:
  max_retries: 3
  base_delay: 1 second
  max_delay: 30 seconds
  backoff_multiplier: 2
  jitter: +/- 25%
  retry_on: [408, 429, 500, 502, 503, 504]
  do_not_retry_on: [400, 401, 403, 404, 422]
```

### Timeout Strategy

Every external call needs a timeout. Every timeout needs to be configured per dependency, not globally.

```
Timeouts:
  AI provider (chat): 30 seconds
  AI provider (document): 120 seconds
  Database read: 5 seconds
  Database write: 10 seconds
  Cache read: 1 second
  Cache write: 1 second
  Email send: 10 seconds
  Payment API: 15 seconds
  Webhook delivery: 10 seconds
```

A global 30-second timeout means your cache reads wait 30 seconds before failing. A 1-second cache timeout means a cache miss fails fast and you fall through to the database.

### Graceful Error Presentation

Map internal errors to user-facing messages. The user should understand what happened and what to do about it, without seeing technical details.

```
Internal: TimeoutError on AI provider call
User sees: "Our AI is taking longer than expected. Your request is still processing — we will notify you when it is ready."

Internal: Database connection refused
User sees: "We are experiencing a temporary issue. Please try again in a few minutes."

Internal: Rate limit exceeded
User sees: "You have reached your usage limit for this hour. Your limit resets at 2:00 PM." (specific, actionable)
```

---

## 11. Latency Optimisation {#latency}

### Time to First Token

For streaming AI responses, the metric that matters most is time to first token (TTFT) — how long the user waits before they start seeing output. Optimise the pre-AI-call pipeline to minimise TTFT.

```
Request lifecycle latency budget:
  Auth check: < 5ms (cached session lookup)
  Rate limit check: < 5ms (Redis)
  Input validation: < 10ms
  Token counting: < 20ms
  Budget check: < 10ms
  Total pre-AI overhead: < 50ms
  AI provider TTFT: 500ms - 2000ms (you cannot control this)
  
  Target total TTFT: < 2 seconds
```

If your pre-AI overhead is 500ms due to multiple database calls, you have doubled the perceived latency. Optimise this path aggressively.

### Caching for Latency

Cache everything that does not change per-request:
- User plan limits (cache for 60 seconds)
- System prompt text (cache until explicitly invalidated)
- Feature flag values (cache for 30 seconds)
- Token counts for static content (cache indefinitely)
- AI responses for identical queries (see infrastructure.md section 4)

### Streaming Optimisation

- Use server-sent events (SSE) or WebSockets for streaming. Do not poll.
- Forward AI provider chunks to the client as they arrive. Do not buffer the entire response.
- If running post-processing (PII detection, content filtering) on streaming output, use a small look-ahead buffer (section covered in output-security.md), not full buffering.
- Compress SSE streams with gzip/brotli at the CDN level.

### Edge Computing

If your users are globally distributed, deploy your API at the edge (Vercel Edge Functions, Cloudflare Workers, AWS Lambda@Edge) for the auth, rate limit, and validation steps. The AI provider call still goes to a central region, but the overhead before and after that call is handled close to the user.

This shaves 50-200ms off TTFT for users far from your server region.

---

## 12. Observability Beyond Security {#observability}

### Application Performance Monitoring

Track latency, error rates, and throughput for every endpoint, not just AI endpoints.

```
Key metrics per endpoint:
  p50, p95, p99 latency
  Error rate (4xx, 5xx)
  Request volume (per minute)
  Apdex score (what percentage of requests are satisfactorily fast)
```

### User-Facing Performance

Track what the user actually experiences:
- Page load time
- Time to interactive
- Time to first token (for AI features)
- Time to complete response (for AI features)
- Client-side error rate

Use Real User Monitoring (RUM). Synthetic monitoring catches infrastructure problems. RUM catches the problems your actual users experience.

### Structured Logging

Logs should be structured (JSON), not unstructured (plain text). Every log entry should include:

```
{
  "timestamp": "2026-05-17T14:23:01.123Z",
  "level": "info",
  "service": "ai-proxy",
  "trace_id": "abc123",
  "user_id": "user_456",
  "tenant_id": "tenant_789",
  "event": "ai_request_completed",
  "duration_ms": 3450,
  "model": "claude-sonnet-4-20250514",
  "input_tokens": 1523,
  "output_tokens": 847,
  "cost_usd": 0.0142,
  "cache_hit": false
}
```

Structured logs are searchable, filterable, and aggregatable. Unstructured logs are grep-able and little else.

### Dashboards

Build four dashboards:

**1. Service Health (check during incidents):**
Error rates, latency percentiles, provider status, circuit breaker states, queue depths.

**2. Business Metrics (check daily):**
Active users, AI feature adoption, conversion funnel, revenue, churn indicators.

**3. Cost Tracking (check daily):**
AI spend by provider, by model, by feature, by tenant. Budget consumption. Spend trend.

**4. User Experience (check weekly):**
TTFT distribution, completion rates, error rates by feature, user satisfaction signals (thumbs up/down if you collect them).

---

## 13. API Versioning and Contracts {#api-versioning}

### Why Version Your API

If you expose an API (your customers integrate with it), breaking changes break their code. AI SaaS APIs change frequently — new models, new parameters, changed response formats, deprecated features. Versioning lets you evolve without breaking existing integrations.

### Versioning Strategy

URL-based versioning is the simplest and most explicit:

```
/api/v1/chat/completions
/api/v2/chat/completions
```

### Breaking vs Non-Breaking Changes

**Non-breaking (safe to add without new version):**
- Adding a new optional parameter
- Adding a new field to the response
- Adding a new endpoint
- Adding a new enum value to an existing field

**Breaking (requires new version):**
- Removing a field from the response
- Changing a field's type
- Renaming a field
- Making a previously optional parameter required
- Changing error response format
- Changing authentication method

### Deprecation Policy

When deprecating an API version:
1. Announce deprecation with a timeline (minimum 6 months for paid APIs)
2. Add a `Sunset` header to deprecated version responses: `Sunset: Sat, 01 Nov 2026 00:00:00 GMT`
3. Add a `Deprecation` header: `Deprecation: true`
4. Log usage of deprecated versions. Contact active users directly.
5. After the sunset date, return 410 Gone with a message pointing to the new version.

---

## 14. User Lifecycle Management {#user-lifecycle}

### Onboarding

**First AI interaction.** The user's first AI experience sets their expectation for the product. Optimise it:
- Pre-warm any user-specific caches before their first request
- Use the fastest model for first interactions (latency matters more than quality for first impressions)
- Provide example prompts so the user does not start with a blank input
- Show a loading state immediately (skeleton, typing indicator) so the user knows the system is working

**Progressive feature exposure.** Do not dump every AI feature on a new user. Unlock features as they demonstrate engagement. This also limits abuse surface from new accounts.

### Offboarding

**Account deletion** (covered in general-security.md section 16 for security). The production readiness concerns:

- Export user's data before deletion (conversation history, generated content, usage records)
- Cancel active subscriptions and issue final invoice or prorated refund
- Revoke all API keys and OAuth tokens
- Remove user from all AI processing queues
- Clean up any fine-tuned models or custom configurations
- Honour the soft-delete recovery window (30 days typical)

**Data portability.** Users should be able to export their data in a usable format. For AI SaaS this means: conversation history (JSON or CSV), generated documents (original format), uploaded files, usage records.

---

## 15. Governance and Change Management {#governance}

### System Prompt Changes Are Production Changes

A system prompt change alters application behaviour as significantly as a code change. Treat them with the same process:

- System prompts live in version control, not in a database field someone edits directly
- Changes go through pull request review
- Changes are tested against a regression suite (a set of representative inputs that should produce expected outputs)
- Changes are deployed behind feature flags (new prompt for 10% of traffic, compare quality, then roll out)
- Changes are auditable (who changed what, when, why)

### Model Changes

Switching AI models (e.g., upgrading from Sonnet 3.5 to Sonnet 4) changes output quality, cost, and behaviour. Treat model changes as significant releases:

- Test the new model against your regression suite
- Compare quality metrics (if you have user feedback data)
- Compare cost metrics (new model may be cheaper or more expensive)
- Roll out gradually via feature flags
- Monitor quality signals (user feedback, error rates) during rollout
- Have a rollback plan (point back to previous model)

### Access Reviews

Quarterly, review who has access to:
- Production AI provider keys
- Production database
- User data (PII)
- Admin panel
- Deployment pipeline
- Secrets manager

Remove access for anyone who no longer needs it. This is a compliance requirement under most frameworks and a basic security practice.

---

## 16. Documentation and Runbooks {#documentation}

### Internal Documentation

**Architecture document.** A single page that shows how requests flow through your system, which services talk to which, where data is stored, and which external services you depend on. Update it when the architecture changes. If a new engineer cannot understand the system from this document, it is incomplete.

**Runbooks for operational tasks:**
- How to rotate AI provider API keys (step-by-step)
- How to trip and reset the global circuit breaker
- How to suspend a user account for abuse
- How to restore from a database backup
- How to roll back a deployment
- How to fail over to a secondary AI provider
- How to investigate a cost spike
- How to respond to a data breach report

Each runbook should be executable by any on-call engineer, not just the person who wrote it. Test runbooks by having someone who did not write them follow the steps.

**Decision log.** Record significant technical decisions and the reasoning behind them. "We chose Firestore over Postgres because..." "We set the free tier limit to 25k tokens/day because..." When someone asks "why do we do it this way?" six months later, the answer exists.

### API Documentation (if you expose an API)

- Every endpoint documented with parameters, response format, error codes, and examples
- Authentication section with key generation instructions
- Rate limit section with limits per plan
- Changelog with every change to the API, dated
- Migration guides for breaking changes between versions

### User-Facing Documentation

- Usage guide for AI features
- Explanation of limits and how to check remaining quota
- Troubleshooting for common errors ("Why was my request blocked?")
- Privacy documentation explaining how user data is handled by the AI
- Content policy explaining what the AI will and will not do

---

## 17. Testing Strategy {#testing}

### What to Test Beyond Unit Tests

**Integration tests against AI providers.**
Use recorded responses (VCR/cassette pattern) for CI. Run live tests against actual providers on a schedule (nightly or pre-release), not on every commit. Live AI tests are slow and cost money.

**Regression tests for AI quality.**
Maintain a set of representative inputs with expected output characteristics (not exact match — AI output varies, but you can check for: response includes key information, response does not contain prohibited content, response is within expected length range, response parses as valid JSON if structured output is expected).

**Load tests.**
Simulate production traffic patterns against a staging environment. Verify rate limits hold, circuit breakers trip at thresholds, queue depths stay manageable, and latency stays within targets. Run before major releases and monthly otherwise.

**Chaos tests.**
Deliberately break things and verify the system handles it:
- Kill the AI provider connection mid-request
- Exhaust the database connection pool
- Fill the request queue to capacity
- Crash a worker mid-processing
- Simulate a Redis failure

These should run in staging, not production (unless you are Netflix-scale with ring-fenced blast radius).

**End-to-end tests.**
A test that does what a user does: signs up, starts a conversation, sends messages, receives AI responses, hits a rate limit, upgrades plan, gets higher limits. This catches integration bugs that unit tests miss.

### Test Data

- Never use production data in tests. Generate synthetic data.
- For AI response testing, use recorded/mocked provider responses in CI.
- For load testing, use realistic but synthetic user profiles and inputs.
- Anonymise any production data used for debugging or performance analysis.

---

## 18. Vendor Lock-In and Portability {#vendor-lockin}

### AI Provider Lock-In

If your application is built entirely around OpenAI's API format, switching to Anthropic requires rewriting every AI integration. Mitigate this:

**Abstraction layer.** Build an internal AI service interface that your application code calls. The interface defines input format, output format, and capabilities. Behind it, adapters translate to provider-specific APIs.

```
Your code calls: aiService.complete({ messages, maxTokens, model })
Adapter translates to: OpenAI format, Anthropic format, Google format

Switching providers means writing a new adapter, not rewriting your application.
```

**Prompt portability.** System prompts often include provider-specific instructions ("You are a Claude assistant" or references to provider-specific features). Keep prompts provider-agnostic where possible. Provider-specific adjustments live in the adapter layer.

**Feature dependency audit.** List which provider-specific features you use:
- Function/tool calling (format differs between providers)
- Vision/multi-modal (availability and format differs)
- Fine-tuned models (not transferable between providers)
- Embeddings (dimension and format differ — switching embedding provider means re-embedding everything)
- Provider-specific safety features

Each dependency is a migration cost. Know the list.

### Infrastructure Lock-In

The same principle applies to cloud providers, databases, and services. Build abstraction where the migration cost is high and the likelihood of switching is non-trivial. Do not abstract everything — that is over-engineering. Abstract the things that are expensive to change and that you might actually change.

```
Worth abstracting:
  AI provider interface (likely to switch or multi-source)
  Email sending (easy to abstract, providers come and go)
  File storage (S3-compatible API is a de facto standard)
  
Probably not worth abstracting:
  Database (Firestore to Postgres is a rewrite regardless of abstraction)
  Auth provider (deep integration, rarely switched)
  Payment provider (Stripe's API is the abstraction)
```

---

## 19. Cloud Cost Management {#cloud-costs}

### Beyond AI Provider Costs

AI provider spend is the obvious cost. The surrounding infrastructure also scales with usage:

**Compute.** Serverless functions that process AI requests cost per invocation and per duration. A 30-second AI proxy function costs more than a 200ms REST endpoint.

**Bandwidth.** Streaming AI responses to users consumes egress bandwidth. At scale, this is non-trivial. CDN costs also scale with streaming volume.

**Storage.** Conversation history, cached AI responses, uploaded files, and logs all grow continuously. Set retention policies. Archive or delete old data.

**Database.** Firestore charges per read, write, and stored byte. Each AI conversation generates reads (load history) and writes (store new messages). A chatty application can generate surprising database bills.

### Cost Visibility

Tag all cloud resources with: service, environment, team, feature. This enables per-feature cost attribution. "Our document processing feature costs $X/month in compute, $Y in AI, and $Z in storage" is information you need for pricing decisions.

### Cost Optimisation Priorities

1. AI provider costs (typically 60-80% of total for an AI SaaS)
2. Database costs (can surprise you at scale)
3. Compute costs (optimise function duration and memory allocation)
4. Storage costs (retention policies, tiered storage)
5. Bandwidth costs (CDN configuration, compression)

---

## 20. Support Operations {#support-ops}

### AI-Specific Support Challenges

Users will file support tickets about AI output quality, which is a category that does not exist in non-AI SaaS. Prepare for:

**"The AI said something wrong."** You need a process for reviewing AI output complaints. Log conversation IDs so support can pull up the exact interaction. Define what warrants investigation (factual errors, policy violations, offensive content) vs what is expected behaviour (subjective quality, different phrasing than user wanted).

**"The AI stopped working."** Could be: rate limit hit, budget exhausted, provider outage, content policy block, or a bug. Support needs a dashboard showing the user's current limits, usage, and any recent errors for their account.

**"I was charged for AI that did not work."** The usage dashboard (section 2) is your first line of defence. If the user was charged for a request that errored, issue an automatic credit.

### Escalation Path

```
Tier 1 (self-service):
  Usage dashboard, FAQ, rate limit reset instructions, plan upgrade

Tier 2 (support agent):
  Account investigation, manual credit/refund, bug report filing,
  content policy appeal

Tier 3 (engineering):
  Bug investigation, provider issue escalation, data integrity issue,
  security incident
```

### Internal Tools for Support

Build these early — support without tooling is slow and expensive:

- **User lookup:** Search by email, ID, or conversation ID. Show plan, usage, limits, recent errors.
- **Conversation viewer:** Read the user's conversation to understand their complaint. Access-controlled and audited.
- **Credit tool:** Issue usage credits without engineering involvement.
- **Account action tool:** Suspend, unsuspend, force plan change, reset rate limits.
- **Impersonation mode:** See the app as the user sees it (read-only, audited, requires justification).
