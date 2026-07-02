---
name: scaling-audit
description: "Use this skill to assess whether an existing app will survive growth: when asked 'will this scale', 'is this production-ready', 'what breaks at 100/1k/10k users', 'can this handle load', 'is this ready to launch/grow', or to review an app for operational readiness, reliability, infrastructure, backups, concurrency, or cost-at-scale. Trigger on phrases like 'will it scale', 'production readiness', 'scaling review', 'load', 'traffic', 'going viral', 'what happens when usage grows', 'disaster recovery', 'backups', 'uptime', 'single point of failure', or when pointed at a repo and asked whether it can grow without falling over. This is the operational-readiness lens: it finds what breaks under growth, not security holes (use code-audit / ai-saas-security) or logic bugs (use debugging-methodology). Defaults to a prioritised report of risks; suggests fixes only when asked. Especially aimed at apps built fast with AI, where the v1 works but the questions that matter at scale were never asked."
---

# Scaling Audit

The lens for one question: **will this app survive growth, and what breaks first when it doesn't?** A vibe-coded or fast-built app usually works at the demo and at a handful of users, because working-at-small and surviving-at-scale are different problems, and the second one is invisible until traffic arrives. This skill finds the operational and scaling risks before they find you: the database with no backup, the single container with no failover, the synchronous call that falls over under concurrency, the cost that runs away when usage multiplies.

It does not cover security (that is `code-audit` and `ai-saas-security`) or correctness bugs (`debugging-methodology`). It overlaps with `error-handling-patterns`, `state-management`, and `data-modelling` and uses them as lenses, but its question is narrower: not "is this correct" but "does this hold up when there are 100x more users, requests, and data than today."

## The cardinal principle

**The danger isn't that you can't scale it. It's that you don't know which question to ask before it breaks.** Most scaling failures are not exotic. They are a known operational concern that nobody thought to check because the app worked fine at five users. The value of this audit is surfacing the questions a seasoned operator would ask, what happens to the data if the server dies, what happens to latency at 100x load, what happens to the bill, so they get answered on purpose rather than discovered in an outage.

## Report by default, fixes only when asked

Default to a prioritised report: what will break, roughly when (at what scale), why it matters, and what to do about it, without changing code. Fix only when explicitly asked, and when fixing, apply the relevant craft skills under their own disciplines (especially `refactoring` and `testing-strategy` so a scaling change doesn't silently break behaviour).

## The passes, in priority order

Ordered by how catastrophically and how commonly each fails an early-growth app. Work top down; the first two are where most fast-built apps die.

### Pass 1: Data durability and backups (highest priority)
The failure that has no recovery. If the database dies, is corrupted, or is wrongly deleted, can the data come back? Most fast-built apps have no answer.
- Is there an automated, tested backup of every datastore? Untested backups are not backups.
- Single point of failure on the data layer (one container, one disk, one unreplicated instance)?
- A wrong migration, bad delete, or bug, is there point-in-time recovery, or is the data simply gone?
`references/data-durability.md` covers backups, recovery, replication, migration safety, and the connection to `data-modelling`.

### Pass 2: Single points of failure and deployment
What happens when the one server, container, or process dies. Fast-built apps are often one Docker container with no redundancy.
- Single instance with no failover or restart? One process holding all state in memory?
- The "inadvertently locked to a single thread / single worker while trying to run many concurrent jobs" trap.
- Is deployment repeatable, or is the running system a hand-tended pet that can't be rebuilt?
`references/failure-and-deployment.md` covers SPOFs, redundancy, statelessness, process model, and reproducible deploys.

### Pass 3: Concurrency and load
What breaks when many things happen at once instead of one at a time. Works-at-one-user is no evidence of works-at-many.
- Race conditions on shared state under concurrent requests (ties to `state-management`).
- Synchronous/blocking work in the request path that should be queued (sending email, calling the model, heavy compute).
- Connection-pool exhaustion, unbounded in-memory growth, work that is O(n) in users.
`references/concurrency-and-load.md` covers concurrency hazards, the request path, queues and background work, and load characteristics.

### Pass 4: External dependencies and resilience
What happens when a thing the app depends on is slow, down, or rate-limiting. At scale, dependencies fail routinely rather than rarely.
- Calls to third parties (the AI provider, payment, email, OAuth) with no timeout, retry, backoff, or circuit breaker (directly `error-handling-patterns`' resilience patterns).
- One slow dependency stalling the whole app (no timeout, no bulkhead).
- Idempotency on operations that may be retried (payments, sends), or do retries double-charge.
`references/dependencies-and-resilience.md` covers timeouts, retry/backoff, circuit breakers, idempotency, and graceful degradation, leaning on `error-handling-patterns`.

### Pass 5: Cost at scale
What the bill does when usage multiplies. The failure that doesn't crash anything, it just bankrupts you.
- Per-request costs (AI tokens, third-party calls, egress) multiplied by 100x traffic, what is the number?
- Unbounded or abusable cost paths (no rate limit, no spend cap, ties to `ai-saas-security`).
- Cost that scales worse than linearly with users (N+1 external calls, no caching).
`references/cost-at-scale.md` covers per-unit cost modelling, runaway paths, caching, and spend controls.

### Pass 6: Observability
Whether you'd even know it was breaking. Without this, every other failure is discovered by an angry user, not by you.
- Any error tracking, metrics, or alerting, or is the first sign of failure a support ticket?
- Can you answer "is it up, is it slow, is it erroring" right now without guessing?
- Logs that help diagnose, without leaking secrets or PII (ties to `ai-saas-security`).
`references/observability.md` covers logging, metrics, alerting, health checks, and knowing-before-the-user-does.

## How to report

Order by severity (catastrophic-and-likely first: data loss, total outage), and for each: what breaks, at roughly what scale, why it matters, and the fix. Distinguish "will break" from "might strain." Note what you could not assess. Don't drown the real risks (no backups, single point of failure) under minor ones. The point is surfacing the few things that will actually take the app down as it grows, in the order they'll happen.

## Scoping
Match depth to stakes and stage. A prototype with no users does not need a multi-region disaster-recovery plan; tell them so rather than gold-plating. An app about to get real traffic, or already straining, warrants the full sweep. The honest output for an early app is often "you're fine for now; these three things break around when you hit real users, fix them before then" not a panic list.

## What to produce under a production-audit

Standalone, report as prose per "How to report". As a lens under `production-audit`, emit findings in the canonical schema (`production-audit/references/finding-schema.md`) instead, appended to the run's `raw-findings.jsonl` as discovered: prefix `SCALE`, category `scaling` — or `ops`, `performance`, or `correctness` where the consequence lands there. The schema overrides the prose format above.

## Skills this leans on
- `error-handling-patterns`: resilience (timeouts, retry, backoff, circuit breaker, idempotency) for pass 4
- `state-management`: concurrency and shared-state hazards for pass 3
- `data-modelling`: data layer and migration safety for pass 1
- `ai-saas-security`: cost controls and rate limiting overlap for passes 5 and 6
- `refactoring`, `testing-strategy`: govern any fixes made in fix mode
- `code-audit`: the sibling lens for security/correctness; this is the operational-readiness counterpart
