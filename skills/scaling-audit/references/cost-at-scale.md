# Cost at scale

The failure that doesn't crash anything. The app keeps working; the bill just grows until it's unsustainable. Fast-built apps, especially AI ones, often have a per-request cost that's invisible at demo scale and ruinous at real scale. This pass models what the numbers do at 100x.

## The questions that matter

**What does one request actually cost?**
Find the variable cost per request: AI tokens (input + output, and any per-call overhead), third-party API calls (some charge per call), bandwidth/egress (serving large responses or files), per-operation database or storage costs. Get a rough per-request number, then multiply by realistic traffic. The exercise that matters: "at 10,000 users doing X per day, what's the monthly bill?" Fast-built apps almost never have this number, and producing it is often the most useful single output of this pass.

**Where can cost run away unbounded?**
Cost paths with no ceiling are the dangerous ones, the same shape as a security abuse path, but the damage is your bill rather than a breach. Look for:
- AI calls with no per-user rate limit and no global spend cap (one abusive user, or one bug in a loop, runs up unlimited spend). This overlaps directly with `ai-saas-security`'s cost-control guidance.
- Anything user-triggerable that costs money per trigger with no limit.
- Retry loops or background jobs that could spin and rack up cost if they malfunction.

**Does cost scale worse than linearly?**
Linear cost (2x users = 2x bill) is at least predictable. Worse-than-linear is the trap:
- N+1 external calls: doing per-item what could be done per-batch, so cost grows with items not requests.
- No caching of expensive, repeatable work: recomputing or re-fetching the same costly result for every request instead of caching it. The same AI completion or API response served from cache costs near nothing; regenerated every time, it scales linearly with traffic when it didn't need to.
- Work that fans out: one user action triggering many paid operations.

## Controls to check for
- Per-user rate limits and quotas (caps the per-user blast radius).
- A global spend cap or kill switch (the circuit breaker for cost, when spend crosses a threshold, something stops or alerts). `ai-saas-security` covers this for AI specifically.
- Caching on expensive repeatable operations.
- Monitoring on spend (you can't control what you don't watch, ties to observability).

## What to flag, by stage
- Prototype: produce the per-request cost number and the "at scale" projection anyway, it's cheap and it's often the wake-up. Flag unbounded AI/spend paths even at prototype stage, because a bug or abuse can hit them at any scale.
- Real users: the runaway paths and the missing spend cap are the priorities, one bad day can produce a shocking bill.
- Growing: the worse-than-linear patterns (N+1 paid calls, no caching), because those are what turn a manageable bill into an unmanageable one as traffic climbs.

## The honest framing
The useful output is a number and a sentence: "each active user costs roughly £X/month at current usage; at 10k users that's £Y; here are the two paths where a bug or abuse could make it unbounded." That lets them decide consciously, rather than discovering the cost curve from an invoice.

## Connection to other skills
`ai-saas-security` owns the AI cost-control and rate-limit patterns (spend caps, per-user quotas, kill switches); this pass checks they exist and models the cost. `error-handling-patterns` (idempotency) prevents retries from doubling cost.
