# Cost Control for AI SaaS

## Table of Contents
1. [Cost Anatomy of an AI Request](#cost-anatomy)
2. [Per-Request Budget Enforcement](#per-request)
3. [Per-User Budget Management](#per-user)
4. [Global Circuit Breakers](#circuit-breakers)
5. [Token Pre-Estimation](#pre-estimation)
6. [Conversation Cost Management](#conversation)
7. [Retry Budget Management](#retries)
8. [Provider Failover for Cost Optimisation](#failover)
9. [Streaming Cost Control](#streaming)
10. [Agent and Tool-Use Cost Containment](#agents)
11. [Billing Reconciliation](#billing)
12. [Alerting Thresholds](#alerting)

---

## 1. Cost Anatomy of an AI Request {#cost-anatomy}

Every AI request generates cost across multiple dimensions. Understanding all of them prevents blind spots.

**Direct provider costs:**
- Input tokens (the prompt you send, including system prompt and conversation history)
- Output tokens (the completion the model generates)
- Image generation (fixed cost per image, varies by resolution)
- Embedding tokens (typically cheaper than completion tokens)
- Fine-tuned model surcharge (if applicable)
- Batch vs real-time pricing differences

**Infrastructure costs:**
- Compute time for pre/post processing (tokenization, filtering, logging)
- Storage for conversation history, logs, cached responses
- Bandwidth for streaming responses
- Redis/cache infrastructure for rate limiting

**Hidden cost multipliers:**
- Retry logic (each retry re-sends full input tokens)
- Conversation history growth (each message in a chat includes all previous messages as input)
- RAG context injection (retrieved documents add to input token count)
- System prompt length (sent with every request, paid for every time)
- Tool/function definitions (count as input tokens on every call)

---

## 2. Per-Request Budget Enforcement {#per-request}

### max_tokens Parameter

Every request to an AI provider must include a `max_tokens` parameter. This caps the output length and therefore the output cost.

**Server-side enforcement is mandatory.** If `max_tokens` comes from the client, treat it as a suggestion and apply your own ceiling:

```
Enforcement logic:
  client_requested_max = request.body.max_tokens
  server_ceiling = get_plan_max_tokens(user.plan, feature)
  effective_max = min(client_requested_max, server_ceiling)
  # Never allow effective_max to exceed server_ceiling
```

### Input Length Limits

Cap input length at the server before tokenization:

```
Input limits (example):
  Chat message: 10,000 characters
  Document upload: 50,000 characters (after extraction)
  Code input: 20,000 characters
  System prompt + user input + reserved output: must fit in context window
```

Reject requests exceeding these limits with a clear error message specifying the limit. Do not silently truncate — the user needs to know their input was too long, otherwise they will get confusing partial results.

### Context Window Budget Allocation

The provider's context window is finite. Allocate it explicitly:

```
Context window budget (example for 128k token model):
  System prompt:        2,000 tokens (reserved, fixed)
  Tool definitions:     1,000 tokens (reserved, fixed)
  Conversation history: up to 100,000 tokens (variable)
  User's new message:   up to 20,000 tokens (variable)
  Output reservation:   4,000 tokens (max_tokens setting)
  Safety buffer:        1,000 tokens
  
  Total: 128,000 tokens
```

If the sum of system prompt + history + new input + max_tokens exceeds the context window, truncate the conversation history (oldest messages first) or reject the request. Never let this silently fail — the provider will either error or silently truncate, and the AI will produce confused output either way.

---

## 3. Per-User Budget Management {#per-user}

### Token Budgets

Track cumulative token usage per user across configurable periods.

```
Budget tracking structure:
  user:{id}:tokens:daily     → running count, resets at midnight UTC
  user:{id}:tokens:monthly   → running count, resets on billing cycle
  user:{id}:spend:daily      → dollar amount, resets at midnight UTC
  user:{id}:spend:monthly    → dollar amount, resets on billing cycle
```

### Pre-Reservation Pattern

Before sending a request to the provider:

1. Estimate total cost (input tokens counted + max_tokens for output)
2. Check if estimated cost fits within remaining budget
3. If yes, reserve (deduct) the estimated amount
4. Send request to provider
5. On completion, reconcile: refund the difference between reserved and actual
6. On error, refund the full reservation

This prevents users from exceeding budgets by sending many requests simultaneously. Each request reserves its worst-case cost, and concurrent requests compete for the remaining budget.

### What Happens When Budget Is Exhausted

Options, in order of user experience quality:

1. **Downgrade model** — Switch from expensive model to cheaper one (e.g., GPT-4 to GPT-3.5, Claude Opus to Haiku). Inform the user.
2. **Reduce max_tokens** — Allow the request but with shorter output limit. Inform the user.
3. **Queue for next period** — Accept the request but delay execution until the budget resets.
4. **Hard reject** — Return 429 with clear message about budget exhaustion and reset time.
5. **Upsell** — Prompt user to upgrade plan for higher limits.

Implement at least options 4 and 5. Options 1-3 are better UX if your product supports them.

---

## 4. Global Circuit Breakers {#circuit-breakers}

### Purpose

A global circuit breaker kills all AI requests across the entire platform when total spend exceeds a threshold. This is your last-resort protection against cost runaway, whether caused by a bug, an attack, or a provider pricing error.

### Implementation

```
Circuit breaker states:
  CLOSED (normal operation)
    → Trips to OPEN when: daily_spend > threshold
  OPEN (all AI requests rejected)
    → Moves to HALF_OPEN after: manual intervention or cooldown period
  HALF_OPEN (limited traffic allowed)
    → Returns to CLOSED when: spend rate normalises
    → Returns to OPEN when: spend rate still elevated
```

### Threshold Configuration

Set multiple thresholds:

```
Warning threshold (50% of daily budget):
  → Alert on-call engineer
  → Log warning

Caution threshold (80% of daily budget):
  → Alert on-call + engineering lead
  → Begin logging all requests with full payloads

Critical threshold (95% of daily budget):
  → Alert on-call + engineering lead + CTO
  → Downgrade all requests to cheapest model

Emergency threshold (110% of daily budget):
  → OPEN circuit breaker — reject all AI requests
  → Page on-call immediately
  → Require manual reset
```

### Setting the Daily Budget

Calculate based on your maximum acceptable daily loss:

```
daily_budget = max_acceptable_loss_per_day

Example:
  Monthly AI budget: $10,000
  Daily average: $333
  Daily budget ceiling: $500 (1.5x average, allows for peak days)
  Emergency cutoff: $550
```

Review and adjust monthly based on actual usage patterns.

### What Gets Rejected During Circuit Break

All non-essential AI requests. If your product has essential AI features (e.g., safety-critical classifications), those should have a separate budget and circuit breaker. Do not let a chatbot feature's runaway cost disable a safety system.

---

## 5. Token Pre-Estimation {#pre-estimation}

### Why Estimate Before Sending

You need to know approximate cost before sending a request to the provider for two reasons: budget reservation (section 3) and request rejection (if the request is too expensive to accept).

### Estimation Methods

**Input tokens:** Use a tokenizer library matching your provider. tiktoken for OpenAI, Anthropic's tokenizer for Claude. The input token count is deterministic — you know exactly what you are sending.

**Output tokens:** Unknown before generation. Options for estimation:

1. **Use max_tokens as upper bound.** Conservative but simple. Works well for budget reservation because you refund the difference.
2. **Historical average.** Track average output length per feature and use that for estimation. Less conservative, better UX, but risks under-reservation.
3. **Input-proportional estimate.** For some features, output length correlates with input length. Build a regression model from historical data.

For budget reservation, use max_tokens. For cost forecasting and alerting, use historical averages.

### System Prompt Cost Awareness

Your system prompt is sent with every request. A 2,000-token system prompt at GPT-4 pricing costs roughly $0.06 per 1,000 requests in input tokens alone, regardless of what the user sends. At 100k requests/day, that is $6/day from system prompts alone.

Optimise system prompt length. Every token you remove from the system prompt saves money on every request.

---

## 6. Conversation Cost Management {#conversation}

### The Compounding Cost Problem

In a multi-turn conversation, each new message includes all previous messages as context. The cost of message N includes the full token count of messages 1 through N-1.

```
Message 1: 500 input tokens → cost: 500 input + output
Message 2: 500 + msg1 + msg2 = ~1,500 input tokens → cost: 1,500 input + output
Message 3: 500 + msg1 + msg2 + msg3 = ~3,000 input tokens → cost: 3,000 input + output
...
Message 20: 500 + all history = ~20,000 input tokens → cost: 20,000 input + output
```

Input token cost grows roughly quadratically with conversation length if messages are similar length.

### Mitigation Strategies

**Hard conversation length limit.** Cap the number of messages in a conversation. 20-50 messages is typical. After the limit, require the user to start a new conversation.

**Sliding context window.** Only include the last N messages as context, plus the system prompt. Older messages are dropped. The AI loses access to early conversation content, but costs stay bounded.

**Conversation summarisation.** When the conversation exceeds a threshold, send the full history to the AI with a summarisation prompt, then replace the history with the summary. The summary is much shorter but preserves key context. This adds one expensive summarisation call but reduces all subsequent call costs.

**Context-aware truncation.** More sophisticated than a simple sliding window: use token counting to ensure the context fits within a budget. Remove oldest messages first, but preserve the system prompt and the most recent exchange.

### Conversation Budget

In addition to per-request limits, set a per-conversation token budget. Track cumulative tokens across all messages in a conversation. When the budget is exhausted, the user must start fresh.

---

## 7. Retry Budget Management {#retries}

### The Cost of Retries

When an AI provider returns an error (rate limit, server error, timeout), your retry logic resends the request. Each retry re-sends the full input, incurring the full input token cost again.

Three retries on a 10,000-token input = 40,000 input tokens billed (original + 3 retries).

### Retry Budget Rules

1. **Maximum 2-3 retries per request.** Beyond that, the failure is likely persistent.
2. **Exponential backoff with jitter.** Base delay 1s, then 2s, then 4s, with random jitter of +/- 25%.
3. **Do not retry on 4xx errors (except 429).** Client errors will not succeed on retry. Only retry on 429 (rate limit) and 5xx (server error).
4. **Per-user retry budget.** Track retries per user per hour. If a user's requests are consistently failing, there is a systemic issue — continued retries waste money.
5. **Circuit breaker on provider errors.** If the provider returns 5xx errors on > 50% of requests in a 60-second window, stop sending requests for 30 seconds. This prevents burning money during a provider outage.
6. **Cheaper retry model.** On retry, consider downgrading to a cheaper model if available. A slightly worse response is better than no response and triple the cost.

### Timeout Configuration

Set timeouts appropriate to the request type:

```
Timeouts:
  Chat completion (short): 30 seconds
  Chat completion (long): 60 seconds
  Document analysis: 120 seconds
  Image generation: 60 seconds
  Embedding batch: 30 seconds
  Agent execution (per step): 30 seconds
  Agent execution (total): 300 seconds
```

A timed-out request still incurs cost for whatever tokens were generated before the timeout. Account for this in budget tracking — check the partial response for usage metadata if available.

---

## 8. Provider Failover for Cost Optimisation {#failover}

### Multi-Provider Strategy

Using multiple AI providers gives you both reliability and cost optimisation options.

```
Failover strategy:
  Primary: Provider A (best quality for your use case)
  Secondary: Provider B (acceptable quality, lower cost or higher limits)
  Fallback: Provider C (basic quality, lowest cost)
  
  Route to secondary when:
    - Primary rate limited (429)
    - Primary server error (5xx)
    - User's budget nearly exhausted (downgrade to cheaper)
    - Non-critical features (use cheapest adequate model)
  
  Route to fallback when:
    - Both primary and secondary unavailable
    - Global circuit breaker approaching threshold
    - Feature does not require high quality (embeddings, classification)
```

### Cost-Based Routing

For each AI feature, define which provider/model combinations are acceptable and their relative costs. Route to the cheapest acceptable option by default, upgrade for premium users or quality-critical features.

```
Feature routing (example):
  Chat (free tier): Haiku / GPT-4o-mini
  Chat (paid tier): Sonnet / GPT-4o
  Chat (enterprise): Opus / GPT-4
  Embeddings (all tiers): text-embedding-3-small
  Classification: Haiku / GPT-4o-mini (cheapest adequate)
  Document summary: Sonnet / GPT-4o
```

---

## 9. Streaming Cost Control {#streaming}

### Monitoring Mid-Stream

Streaming responses send tokens incrementally. You can count output tokens as they arrive and abort the stream if the count exceeds a threshold.

```
Streaming control loop:
  token_count = 0
  for each chunk in stream:
    token_count += count_tokens(chunk)
    if token_count > max_output_tokens:
      abort stream
      append "[Response truncated: output limit reached]"
      break
    if elapsed_time > timeout:
      abort stream
      append "[Response truncated: timeout]"
      break
    forward chunk to client
  
  update_budget(user, input_tokens, token_count)
```

### Client-Side Stream Cancellation

If the user navigates away or cancels, your server must also cancel the upstream request to the provider. An orphaned stream continues generating (and costing) tokens even though nobody is reading them.

Implement server-side cleanup: when the client connection drops, abort the provider request. This requires proper connection lifecycle management — SSE connections, WebSocket disconnection handlers, or HTTP/2 stream resets.

---

## 10. Agent and Tool-Use Cost Containment {#agents}

### The Risk

AI agents with tool access execute multiple AI calls in sequence. Each tool call is a separate completion, and the agent decides how many calls to make. Without limits, an agent can loop indefinitely, making dozens of API calls for a single user request.

### Containment Measures

**Step limit:** Maximum number of tool-use cycles per agent execution (e.g., 10 steps). After the limit, force the agent to respond with whatever it has.

**Total token budget per execution:** Sum of all input and output tokens across all steps. When the budget is exhausted, terminate the agent.

**Per-step timeout:** Each individual AI call within the agent has its own timeout.

**Total execution timeout:** The entire agent execution has a wall-clock timeout, regardless of how many steps have run.

**Tool call cost tracking:** Some tools trigger expensive operations (API calls, database queries, external services). Track cost per tool call and include it in the total execution budget.

**Loop detection:** Monitor for repeated identical tool calls. If the agent calls the same tool with the same parameters more than twice, it is likely stuck in a loop. Terminate and return an error.

```
Agent execution budget (example):
  max_steps: 10
  max_total_tokens: 50,000
  per_step_timeout: 30 seconds
  total_timeout: 300 seconds
  max_tool_retries: 2
  loop_detection: true (terminate on 3rd identical call)
```

---

## 11. Billing Reconciliation {#billing}

### Tracking Provider Invoices Against Internal Accounting

Your internal token tracking will drift from your provider's invoice. Reasons:

- Tokenizer version differences (your local tokenizer may count slightly differently)
- System prompt tokens not tracked consistently
- Failed requests that were partially processed
- Streaming responses aborted mid-stream
- Provider-side retries you did not initiate
- Caching (provider may charge differently for cached vs non-cached tokens)

### Reconciliation Process

Monthly, compare:
1. Your internal sum of (input_tokens + output_tokens) per provider
2. The provider's invoice or usage dashboard

Acceptable drift: < 5%. If drift exceeds 5%, investigate. Common causes: a code path that calls the provider without going through your tracking middleware, or a tokenizer discrepancy.

### Internal Cost Attribution

For multi-tenant SaaS, track cost per tenant so you can:
- Bill tenants accurately (if usage-based pricing)
- Identify tenants costing more than their revenue
- Enforce per-tenant budgets
- Forecast infrastructure costs

Store: user_id, tenant_id, feature, provider, model, input_tokens, output_tokens, cost_usd, timestamp. Aggregate in a data warehouse for reporting.

---

## 12. Alerting Thresholds {#alerting}

### User-Level Alerts (Internal)

```
Flag for review:
  - User exceeds 3x their typical daily usage
  - User hits rate limits > 10 times in an hour
  - User's per-request cost average jumps > 5x
  - New user (< 7 days old) reaches 80% of plan limit
```

### System-Level Alerts

```
Warning:
  - Total hourly spend > 1.5x rolling average
  - Provider error rate > 10%
  - Average response latency > 2x baseline
  - Rate limit rejection rate > 20%

Critical:
  - Total hourly spend > 3x rolling average
  - Provider error rate > 50%
  - Circuit breaker tripped
  - Zero successful AI requests in 5 minutes

Emergency:
  - Daily budget exceeded
  - Provider API key compromised (unusual usage pattern)
  - Single user generating > 10% of total platform cost
```

### Notification Channels

- Warning: Slack channel, email to engineering
- Critical: PagerDuty, SMS to on-call
- Emergency: PagerDuty high-urgency, SMS to on-call + engineering lead + CTO
