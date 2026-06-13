# Observability

Whether you'd even know it was breaking. This pass is last in priority because it doesn't cause failures, but it determines whether every other failure is caught by you or reported by a furious user. An app with no observability is flying blind: the first sign of an outage is a support ticket, and diagnosing it means guessing.

## The questions that matter

**Would you know it's down right now?**
Is there anything that tells you the app is up, responding, and not erroring, without a human checking manually? At minimum a health check and an uptime monitor that alerts when the app stops responding. Without it, downtime lasts until someone happens to notice.

**Would you know it's erroring?**
Is there error tracking, something that captures exceptions and surfaces them, or do errors vanish silently into logs nobody reads? The common fast-built state is errors logged to stdout that nobody watches. Check for actual error capture and, ideally, alerting on a spike in errors.

**Would you know it's slow?**
Latency degradation is the early warning of a scaling problem (the synchronous-work-in-request-path issue from concurrency shows up first as creeping response times). Is there any metric on request latency? "It feels slow" from a user is the worst way to learn that the connection pool is exhausting.

**Can you diagnose when something is wrong?**
When an error does happen, is there enough in the logs to understand it, request context, what failed, where, without so much that it's noise? And critically: do the logs avoid leaking secrets and user PII? Logging a whole request body that contains tokens or personal data turns a debugging aid into a security and compliance problem. This ties to `ai-saas-security` (don't log secrets) and to the error-message discipline in `error-handling-patterns` (useful internal detail, safe external messages).

## The minimum viable set for a growing app
In rough priority:
1. Uptime/health monitoring with alerting (know it's down).
2. Error tracking with alerting (know it's erroring).
3. Basic latency/throughput metrics (know it's straining before it fails).
4. Structured, useful, PII-safe logs (diagnose when it does).

## What to flag, by stage
- Prototype: minimal observability is acceptable. Note that "you won't know when it breaks" so it's a conscious choice. Don't demand full metrics for an app with no users.
- Real users: no uptime monitoring and no error tracking is a real finding, you're depending on users to be your alerting system, which means slow response and bad experience. It's cheap to fix and catches problems early.
- Growing: latency metrics become important, because they're how you see the next scaling failure coming instead of hitting it. Add the PII-in-logs check, which becomes a compliance issue as the user base grows.

## The honest framing
Observability findings are rarely "this will break." They're "when something else breaks, you won't know until a user tells you, and you won't be able to tell why." Frame it as the difference between a five-minute fix and a five-hour mystery. For an app about to grow, putting in basic monitoring before the traffic arrives is the cheapest insurance in this whole audit.

## Connection to other skills
`ai-saas-security` for the don't-log-secrets/PII discipline and for monitoring spend (cost observability, see cost-at-scale). `error-handling-patterns` for the safe-external / useful-internal split on error detail.
