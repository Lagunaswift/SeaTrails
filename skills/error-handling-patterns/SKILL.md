---
name: error-handling-patterns
description: "Use this skill whenever writing, reviewing, or fixing how code deals with failure: errors, exceptions, rejected promises, error return values, failed external calls, timeouts, retries, and what happens when something goes wrong. Trigger on phrases like 'handle this error', 'error handling', 'try/catch', 'what if this fails', 'should I retry', 'this can fail', 'failure case', 'what happens when the API is down', or when reviewing code that only covers the happy path. Also trigger proactively when writing code that calls something fallible (network, database, file system, external service, parsing, input) BEFORE the failure handling exists, and when reviewing for swallowed errors or over-broad catches. Covers designing failure paths, catching at the right layer, failing loudly vs gracefully, and resilience for unreliable calls (retry, backoff, circuit breaker, timeout). Does NOT cover debugging an existing failure (use debugging-methodology) or input validation as security (use the security skills)."
---

# Error Handling Patterns

A language-agnostic discipline for deciding what your code does when something goes wrong, instead of handling failure as an afterthought or hiding it. The core ideas hold whether your language uses exceptions, error return values, or Result types; the mechanics differ and live in the language reference files.

## Why this is hard to get right

Failure handling is where code quality is won or lost. The happy path is the part you think about; the failure paths are the majority of what can actually happen, and they're the part that's untested, unseen in the demo, and exercised for the first time by a real user at the worst moment. Code that's correct on the happy path and careless on failure looks finished and isn't. Two opposite mistakes dominate, and this skill exists to prevent both:

1. **Hiding failure** so it happens silently. The error is swallowed, logged at a level nobody reads, or replaced with a default that masks it. The system keeps running on wrong assumptions, and the real failure surfaces later as something baffling and far away.
2. **Handling failure at the wrong place or too broadly.** A catch-all that treats every failure the same, a catch so high up it can't do anything useful, a catch so low it can't make the right decision. The error is "handled" in a way that loses the information needed to handle it well.

The discipline below is about treating failure paths as first-class code: deciding deliberately, for each thing that can fail, what should happen.

## The cardinal rule

**Every failure must end in exactly one of three fates, chosen deliberately: handled, propagated, or surfaced. Never silently swallowed.**

- **Handled** means you can meaningfully recover here, so you do, and the program continues correctly.
- **Propagated** means this layer can't make the right decision, so the error travels up (with its context intact) to a layer that can.
- **Surfaced** means it reaches a boundary where it's reported: to a user as a comprehensible message, to an operator as an alert, to a caller as a clear error response, and to the logs with enough detail to diagnose.

The forbidden fourth fate is **swallowed**: caught and discarded, so the failure vanishes without recovery, propagation, or report. Every empty catch block, every bare `except: pass`, every ignored error return is a swallowed failure waiting to become an inexplicable bug. When you catch an error, you owe an answer to "which of the three fates is this, and why?" If you can't answer, you're swallowing it.

## The method

### 1. Identify what can fail

Before handling anything, know what's fallible. Anything that crosses a boundary or depends on the outside world can fail, and the failures are not exotic, they're routine: the network call times out or returns an error status, the database is unreachable or rejects the write, the file isn't there or isn't readable, the input doesn't parse or violates an expectation, the external service returns something you didn't expect, the operation runs out of time or resources. Walk the code and mark every call that can fail. The unmarked ones are where the happy-path assumption hides.

### 2. Classify the failure

Not all failures are the same, and the classification determines the response. The single most useful distinction: **is this failure expected or unexpected, and is it recoverable or not?** A file-not-found when reading optional config is expected and recoverable (use defaults). A corrupted core data structure is unexpected and unrecoverable (fail fast and loud). Treating these the same, either crashing on the recoverable one or limping on the unrecoverable one, is the root of most bad error handling. `references/classifying-failures.md` covers the taxonomy that drives every later decision.

### 3. Decide the fate: handle, propagate, or surface

For each failure, pick one of the three fates from the cardinal rule, deliberately. The key judgement is **the layer**: handle the failure at the layer that has enough information to make the right decision and enough authority to act on it, and no higher or lower. A low-level function usually lacks the context to decide what a failure *means* for the user, so it propagates. A request handler usually has that context, so it decides. `references/where-to-handle.md` covers choosing the layer, why catching too low or too high both fail, and the chokepoint/boundary pattern.

### 4. Preserve context as it travels

An error that propagates must carry what's needed to understand it: what operation failed, on what input, because of what underlying cause. Re-throwing a generic error, or catching and replacing the original with a vague new one, destroys the trail and produces the "something went wrong" with no stack and no cause that makes debugging miserable. Wrap with context, chain the original cause, never discard it. `references/error-context.md` covers error chaining, adding context without losing the root cause, and what information an error should carry.

### 5. Fail loudly or degrade gracefully, on purpose

When a failure can't be recovered, you choose between two correct behaviours, and choosing wrong is the bug:

- **Fail fast and loud** when continuing would corrupt data, produce wrong results, or hide a real problem. A programming error, a violated invariant, an unreachable required dependency: stop, report, don't limp forward on bad state.
- **Degrade gracefully** when the failure is in something non-essential and a reduced experience beats a total one. A recommendations widget that can't load shouldn't take down the page; serve the page without it.

The mistake in both directions: limping forward on corrupt state when you should have stopped, or crashing the whole system over a non-essential failure that should have degraded. `references/fail-fast-vs-graceful.md` covers the decision, fallbacks, and degrading without hiding (a degraded path still reports that it degraded).

### 6. Handle unreliable external calls with resilience patterns

Calls across a network to things you don't control fail transiently and routinely, and naive handling makes it worse (a retry storm that amplifies an outage, a missing timeout that hangs forever, a dependency's slowness that cascades into your own). The established patterns, retry with backoff and jitter, timeouts everywhere, circuit breakers, idempotency, are not optional for production code that calls external services. This is the largest single topic in the skill. `references/resilience-patterns.md` covers each pattern, when it helps, when it hurts, and how they compose.

### 7. Surface failure usefully at the boundaries

Where errors reach the edges, make them useful to whoever receives them: a user gets a message they can understand and act on (not a stack trace, not "error 0x8004"), an API caller gets a structured, consistent error response, an operator gets an alert that distinguishes "the system is on fire" from "a user did something odd", and the logs get the full detail. The same failure often needs different surfacing for different audiences simultaneously. `references/surfacing-errors.md` covers user-facing messages, API error shapes, and the logging/alerting split.

## Anti-patterns

The recurring failures of failure handling, each with its correction, in `references/anti-patterns.md`:

- Swallowing: empty catch, bare except, ignored error return
- The catch-all that treats every failure identically
- Catching too broadly (grabbing errors you didn't mean to)
- Catching too high or too low to act usefully
- Replacing the original error with a vague new one (losing the cause)
- Using errors for normal control flow
- Returning a default/null that masks the failure
- Logging and re-throwing (the same error reported five times)
- Retrying without backoff, jitter, a cap, or a timeout
- Catching and continuing on an unrecoverable error (limping on bad state)
- Crashing the whole system over a non-essential failure

## Reference index

- `references/classifying-failures.md`: the expected/unexpected and recoverable/unrecoverable taxonomy
- `references/where-to-handle.md`: choosing the layer; too-low and too-high failures; boundaries
- `references/error-context.md`: chaining, wrapping, preserving the root cause, what an error should carry
- `references/fail-fast-vs-graceful.md`: when to stop vs degrade; fallbacks; degrading without hiding
- `references/resilience-patterns.md`: retry, backoff, jitter, timeout, circuit breaker, idempotency, bulkheads
- `references/surfacing-errors.md`: user messages, API error shapes, logging vs alerting
- `references/anti-patterns.md`: the failure modes above, each with its correction
- `references/javascript-typescript.md`: exceptions, promise rejection, async/await, error types, AggregateError
- `references/python.md`: exception hierarchy, except specificity, else/finally, chaining with `raise from`, context managers
