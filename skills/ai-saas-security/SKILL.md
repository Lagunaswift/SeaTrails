---
name: ai-saas-security
description: "Use this skill whenever building, auditing, or hardening a SaaS application that sends user input to an AI provider (OpenAI, Anthropic, Google, Replicate, etc.) or returns AI-generated output to users. Covers rate limiting, cost runaway prevention, prompt injection defence, token budget enforcement, abuse detection, output filtering, multi-tenant isolation, billing protection, and monitoring. Trigger on any mention of: AI rate limiting, LLM security, prompt injection, token budgets, AI cost control, AI abuse prevention, AI API security, AI billing protection, or any request to secure endpoints that proxy AI provider calls. Also trigger when the user is building middleware, API routes, or backend services that sit between users and an AI model."
---

# AI SaaS Security

This skill covers the security and cost concerns specific to SaaS applications that proxy user input to AI providers and return AI-generated output to users.

**Prerequisite:** General SaaS security (auth, XSS, CSRF, injection, headers, sessions, payments, deployment, production readiness) is covered by the `saas-production-security` skill. Read that first. This skill assumes those foundations are in place and focuses on what AI adds to the threat model.

Before writing any code, read the relevant reference files:

- `references/rate-limiting.md` — Token-aware rate limiting, sliding window algorithms, concurrent request limits, tiered structures, feature-specific limits, bypass prevention
- `references/cost-control.md` — Budget enforcement, circuit breakers, token pre-estimation, conversation cost management, retry budgets, provider failover, streaming cost control, agent containment
- `references/input-security.md` — Prompt injection defence (direct and indirect), input validation, file upload scanning for AI processing, encoding attacks, content policy pre-filtering, context window manipulation
- `references/output-security.md` — PII detection and redaction, system prompt leakage prevention, content policy post-filtering, structured output safety, multi-tenant data leakage, error message security
- `references/ai-infrastructure.md` — AI endpoint auth, provider API key management, multi-tenant AI context isolation, AI response caching, monitoring and observability, graceful degradation, webhook security for async AI, incident response playbooks

---

## Why AI Endpoints Need Separate Treatment

Standard web security protects your application from unauthorised access, data theft, and injection attacks. AI endpoints introduce three problems that standard security does not address:

**Every request costs real money.** A regular API call costs fractions of a cent in compute. An AI completion costs $0.005 to $0.50 depending on model and token count. An attacker or a bug can burn through thousands of dollars in minutes. Cost is a first-class security concern.

**Input becomes instructions.** In a standard API, user input is data — it gets validated, stored, and retrieved. In an AI API, user input becomes part of the instructions the model follows. This creates prompt injection: the user manipulates the AI's behaviour by crafting input that overrides system instructions.

**Output is unpredictable.** A standard API returns deterministic responses. An AI returns generated text that may contain PII, system prompt content, harmful material, or confidential data from other tenants — regardless of what was requested. You must filter output as aggressively as you filter input.

---

## Implementation Checklist

### Rate Limiting (→ references/rate-limiting.md)
- [ ] Per-user request rate limits (requests per minute/hour)
- [ ] Per-user token rate limits (input + output tokens per hour/day)
- [ ] Global rate limits (total requests across all users)
- [ ] Concurrent request limits per user (max simultaneous AI calls)
- [ ] Tiered limits by plan (free < paid < enterprise)
- [ ] Sliding window implementation (not fixed window)
- [ ] Rate limit headers in responses (X-RateLimit-Remaining, Retry-After)
- [ ] Separate limits for different AI features (chat vs image vs embeddings)
- [ ] IP-based limits for unauthenticated endpoints
- [ ] Rate limit bypass prevention (account cycling, header spoofing)

### Cost Control (→ references/cost-control.md)
- [ ] Per-user daily/monthly spend caps
- [ ] Per-request max_tokens enforced server-side
- [ ] Global daily spend ceiling with automatic circuit breaker
- [ ] Token pre-estimation before sending requests to provider
- [ ] Input length validation and truncation
- [ ] Streaming response cancellation on budget breach
- [ ] Provider cost tracking per user, per feature, per tenant
- [ ] Alerting at 50%, 80%, 95% of budget thresholds
- [ ] Automatic downgrade to cheaper model at high spend
- [ ] Retry budget limits (max retries, exponential backoff ceiling)
- [ ] Queue depth limits to prevent request pile-up

### Input Security (→ references/input-security.md)
- [ ] Input length hard limits (character and token count)
- [ ] Prompt injection detection (pattern matching + classifier)
- [ ] System prompt isolation (never concatenate user input into system prompt)
- [ ] File upload scanning before AI processing
- [ ] Encoding normalisation (Unicode NFKC, invisible character stripping)
- [ ] Content policy pre-filter (block prohibited content before it reaches the AI)
- [ ] Context window budget allocation (system + history + input + output fits in window)
- [ ] Indirect injection defence for RAG and document processing
- [ ] Request replay prevention (nonce or timestamp validation)

### Output Security (→ references/output-security.md)
- [ ] PII detection and redaction on AI output
- [ ] System prompt leakage detection (canary tokens, substring matching, behavioural detection)
- [ ] Content policy post-filter
- [ ] Output length limits (abort streams exceeding expected length)
- [ ] Structured output validation (if expecting JSON, validate schema)
- [ ] AI output sanitised before rendering in UI (DOMPurify — AI can generate XSS payloads)
- [ ] User-facing error messages reveal nothing about internal architecture or provider

### AI Infrastructure (→ references/ai-infrastructure.md)
- [ ] Auth on every AI endpoint (zero unauthenticated AI access)
- [ ] Provider API keys in secrets manager, rotated quarterly
- [ ] Provider API keys never in client-side code
- [ ] Multi-tenant context isolation (no cross-tenant data in prompts)
- [ ] Response caching for repeated identical queries (keyed by tenant)
- [ ] Semantic caching for similar queries (cost reduction)
- [ ] Request logging with full audit trail (input hash, output hash, tokens, cost, user, timestamp)
- [ ] Anomaly detection on usage patterns
- [ ] Graceful degradation when provider is down (failover, cache, queue, or disable)
- [ ] Webhook signature verification for async AI callbacks
- [ ] CORS restricting AI endpoints to your domains

---

## Decision Framework

### Choosing Rate Limit Strategy

```
Is the endpoint authenticated?
├── No → IP-based rate limiting + CAPTCHA + aggressive limits
└── Yes → User-based rate limiting
          ├── Free tier → Strict (e.g. 20 req/hr, 10k tokens/day)
          ├── Paid tier → Moderate (e.g. 200 req/hr, 100k tokens/day)
          └── Enterprise → Custom limits + dedicated token pool
```

### Choosing Cost Control Strategy

```
What is the AI feature?
├── Chat/completion → Token budget per message + conversation length limit
├── Document processing → File size limit + page limit + token estimate before processing
├── Image generation → Fixed cost per generation + daily cap
├── Embeddings → Batch size limit + daily vector count cap
└── Agent/tool-use → Step limit + total token budget + timeout
```

### When Something Fails

Every AI request should have three independent safety nets:

1. **Pre-request validation** — Check rate limits, budget, input validity before calling the provider
2. **In-flight monitoring** — Track streaming token count, enforce timeouts, watch for runaway responses
3. **Post-request accounting** — Log actual cost, update budgets, flag anomalies

If any single layer fails, the other two still protect you.

---

## Priority Order

If adding AI features to an existing application (which already has general security from the `saas-production-security` skill), implement in this order:

1. **Auth on AI endpoints** — Zero unauthenticated access
2. **Per-request max_tokens** — Hard cap on every AI call, server-side
3. **Per-user request rate limits** — Sliding window, per minute and per hour
4. **Input length validation** — Hard character/token limits
5. **Global spend circuit breaker** — Kill switch when daily spend exceeds threshold
6. **Per-user daily token budget** — Track and enforce cumulative usage
7. **Prompt injection basic defence** — Pattern matching for known injection patterns
8. **Output PII filtering** — Scan AI responses before returning to user
9. **Request logging and monitoring** — Full audit trail with anomaly alerting
10. **Concurrent request limits** — Prevent single user monopolising provider capacity
11. **Caching layer** — Reduce redundant provider calls
12. **Advanced prompt injection defence** — Classifier-based detection, canary tokens
13. **Content policy post-filtering** — Enforce policy on AI output
14. **Multi-tenant isolation audit** — Verify zero cross-tenant data leakage

---

## Common Mistakes

**Using fixed-window rate limiting.** A user sends their full quota at 11:59:59 and again at 12:00:01, doubling their effective rate. Use sliding window or token bucket algorithms.

**Setting max_tokens on the client side only.** If the frontend sends `max_tokens: 100` but the backend does not enforce it, an attacker bypasses it with a direct API call. Enforce server-side.

**Trusting the AI to enforce business rules.** "Never reveal the system prompt" in a system prompt is a suggestion, not a security control. Filter outputs programmatically.

**Rate limiting by IP only.** Attackers rotate IPs. Rate limit by authenticated user ID as primary, IP as secondary for unauthenticated endpoints.

**Not limiting conversation length.** Message 51 of a conversation sends all 50 previous messages as input tokens. Cost grows quadratically. Cap conversation context or implement a sliding window.

**Logging AI outputs without redaction.** Audit logs become a PII liability. Redact before logging or encrypt with strict access controls.

**Forgetting retry costs.** Three retries on a 10,000-token input means 40,000 input tokens billed. Implement retry budgets.

**No timeout on streaming responses.** A streaming response accumulating tokens for 120 seconds costs the entire time. Set absolute timeouts on all AI calls.

**Constructing prompts client-side.** If the mobile app or SPA builds the full prompt including system instructions, an attacker modifies it. The server constructs prompts. The client sends user input only.

## What to produce under a production-audit

Standalone, this is a build and hardening guide. As a lens under `production-audit`, turn each unmet checklist item into a finding in the canonical schema (`production-audit/references/finding-schema.md`), appended to the run's `raw-findings.jsonl` as discovered: prefix `AI`, category `security` — or `privacy` where the consequence is data exposure rather than abuse or cost. The schema overrides the checklist format.
