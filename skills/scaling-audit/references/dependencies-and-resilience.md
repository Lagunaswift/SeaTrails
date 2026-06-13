# External dependencies and resilience

At small scale, the things your app calls (the AI provider, payment, email, OAuth, any third party) seem reliable because you call them rarely. At scale you call them constantly, and constant calling means their occasional failures become your routine failures. This pass finds where one slow or failing dependency takes the whole app down with it.

This pass is the scaling-facing edge of `error-handling-patterns`. That skill owns the resilience patterns; here the question is specifically whether they're present on the calls that will fail under growth.

## The questions that matter

**Timeouts on every external call.**
A call with no timeout waits forever if the dependency hangs. Under load, every request that hits the hung dependency piles up, workers block, and the app stalls, not because it crashed, but because it's all waiting. Every network call needs a timeout. Check that they exist and are sane (seconds, not minutes).

**Retry with backoff, where appropriate.**
Transient failures (a blip, a brief rate-limit) are worth retrying; but naive immediate retries make things worse, a struggling dependency gets hammered harder by everyone retrying at once (the thundering herd). Retries need exponential backoff and a cap. Check: are failures retried at all, and if so, with backoff or naively?

**Circuit breakers on the calls that matter.**
If a dependency is down, continuing to call it wastes time (every call times out) and can deepen its outage. A circuit breaker stops calling a failing dependency for a while and fails fast instead, letting the app degrade gracefully rather than hang. Look for whether a hard dependency has any concept of "stop trying for now."

**Idempotency on anything that might be retried.**
This is the dangerous one for money. If a payment or an email send can be retried (by a user double-clicking, by an automatic retry, by a queue redelivering), and the operation isn't idempotent, you double-charge or double-send. Operations with side effects need an idempotency key or a dedupe mechanism so that doing them twice has the effect of doing them once. Check every payment, charge, send, and external write.

**Graceful degradation.**
When a non-critical dependency is down, does the app degrade (disable that feature, show a fallback) or fall over entirely? An app that's wholly dependent on every dependency being up has the combined downtime of all of them. Find the dependencies that should be optional but are currently load-bearing.

## What to flag, by stage
- Prototype: flag missing idempotency on payments (it bites even at low volume and the cost is real money), note the rest.
- Real users: missing timeouts and the no-retry / naive-retry posture on hard dependencies (especially the AI provider and payment) are common first failures at scale.
- Growing: the full set, plus circuit breakers and degradation, because at scale dependency failures stop being rare events and become weekly ones.

## Connection to other skills
`error-handling-patterns` owns timeouts, retry/backoff, circuit breakers, idempotency, and degradation as patterns. This pass is checking whether they're applied to the dependencies that will fail under growth. For any fix, that skill is the reference. `ai-saas-security` overlaps on the AI-provider call specifically (cost and rate-limit controls).
