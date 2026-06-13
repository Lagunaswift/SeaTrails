# Resilience Patterns for Unreliable Calls

Any call across a network to something you don't control, an API, a database, a queue, another service, fails transiently and routinely. Production code that calls external things and assumes they always answer, immediately and correctly, is broken; it just hasn't been caught yet. These patterns make a system survive the unreliability of its dependencies. They also interact: applied naively, some of them *amplify* an outage rather than absorbing it, so understanding when each hurts is as important as when each helps.

## Timeouts: the one that's never optional

Every call that can block must have a timeout. Without one, a dependency that hangs (not fails, just never answers) hangs your code too, and the hang propagates: your request waits forever, holding a connection and a thread, while more requests pile up behind it, until you've exhausted resources and your own service goes down because *theirs* got slow. A slow dependency without timeouts is more dangerous than a failed one.

- Set an explicit, finite timeout on every network call, database query, and external operation. The default in most clients is "wait forever," which is never what you want in production.
- Choose the timeout from the operation's realistic latency, not arbitrarily. Too short and you abort calls that would have succeeded; too long and you've barely improved on infinite.
- Timeouts must cascade sensibly: if your request has a 30s budget and calls three services, they can't each have a 30s timeout. Budget the total across the chain, or an inner call's timeout can exceed the outer deadline and never even fire.

A timeout converts an unbounded hang (catastrophic) into a bounded, classifiable failure (a transient error you can retry or surface). That conversion is why it's the foundational pattern, the others assume failures are bounded, and timeouts are what bound them.

## Retry: only the transient, only with discipline

Retrying a failed call is right *only* for transient failures (see `classifying-failures.md`), timeouts, `5xx`, `429`, connection blips, brief contention conflicts. Never retry permanent failures (`4xx` except `429`, validation rejections, auth failures); they'll fail identically and you're just adding load and delay. The discipline around retry matters more than the retry itself:

- **Backoff, never immediate.** Retrying instantly, in a tight loop, hammers a dependency that's likely failing *because* it's overloaded, making the outage worse and possibly causing it. Wait between attempts, and increase the wait each time (**exponential backoff**: 1s, 2s, 4s, ...). Give the dependency room to recover.
- **Jitter, always.** If every client uses identical backoff, they all retry at the same instants, producing synchronised waves of load (the "thundering herd") that re-overload the recovering dependency on each wave. Add randomness to each delay so retries spread out. Backoff without jitter still produces stampedes; jitter is not optional decoration.
- **A hard cap.** Limit the number of attempts (and/or a total time budget). Infinite retry turns a transient failure into a permanent hang and a resource leak. After the cap, give up and surface the failure, it's now an unrecoverable failure for this operation.
- **Only retry idempotent operations** (see below), or you'll duplicate effects. Retrying a non-idempotent "charge the card" can charge twice if the first attempt actually succeeded but the *response* was what timed out.

The retry storm, immediate, un-jittered, uncapped retries against a struggling dependency, is one of the most common ways a minor blip becomes a full outage. Retry is a sharp tool; backoff, jitter, and a cap are what keep it from cutting you.

## Idempotency: the precondition for safe retry

An operation is idempotent if doing it twice has the same effect as doing it once. This is what makes retry safe: if you retry and the original actually succeeded, idempotency means the duplicate is harmless.

- Reads are naturally idempotent. Writes usually aren't, and that's the problem.
- Make writes idempotent with an **idempotency key**: the caller sends a unique key per logical operation; the server records it and, on a retry with the same key, returns the original result instead of doing the work again. This is how payment APIs make "charge once" safe under retry.
- Or design the operation to be naturally idempotent: "set status to shipped" is idempotent (running it twice leaves it shipped); "increment count" is not (twice doubles it). Prefer set-semantics over delta-semantics where you can.
- Without idempotency, every retry, every redelivered queue message, every double-clicked button risks duplicate effects: double charges, duplicate records, repeated emails. Idempotency is the model-level property that makes the whole retry pattern usable.

## Circuit breaker: stop hammering what's down

When a dependency is failing consistently (not a blip, a sustained outage), continuing to send it requests, even with backoff, wastes your resources, delays your users with doomed calls, and piles load on a service trying to recover. A circuit breaker stops this:

- It watches the failure rate to a dependency. While healthy, calls pass through (**closed**).
- When failures exceed a threshold, it **opens**: calls fail immediately without even attempting the dependency, for a cooldown period. Your code gets a fast, clean failure instead of waiting on a timeout for something that's clearly down, and the dependency gets breathing room.
- After the cooldown, it goes **half-open**: it lets a trial call or two through. Success closes it (recovered); failure re-opens it (still down).

The breaker's value is twofold: it fails *fast* during an outage (no more waiting on timeouts for a service you know is down), and it protects the struggling dependency from being hammered while it recovers. Pair it with a fallback (see `fail-fast-vs-graceful.md`), when the breaker is open, serve the cached/default/degraded response rather than just erroring.

## Bulkheads: contain the blast radius

Isolate resources so one failing dependency can't consume everything and starve the rest. The name is from ship compartments: a breach floods one compartment, not the whole hull.

- If all your outbound calls share one connection pool or thread pool, one slow dependency can consume the entire pool (every worker stuck waiting on it), and now calls to *healthy* dependencies fail too because there's nothing left to serve them. One sick dependency took down everything.
- Bulkheading gives each dependency (or class of work) its own bounded resource pool. The slow dependency exhausts *its* pool and fails, while the others keep working from theirs. The failure is contained to the thing that failed.

## How they compose

These aren't alternatives; a robust external call uses several together, in layers:

- **Timeout** on the call (bound the failure).
- **Retry with backoff + jitter + cap** around it (absorb transient failures), guarded by **idempotency** (make retry safe).
- **Circuit breaker** around the retry (stop retrying a sustained outage, fail fast instead).
- **Fallback** when the breaker is open or retries exhaust (degrade gracefully).
- **Bulkhead** isolating this dependency's resources (contain it).

Read inside-out: a single call gets a timeout; transient failures of that call get retried with discipline; sustained failure trips the breaker which short-circuits to a fallback; and the whole thing runs in an isolated resource pool so its worst case can't sink the ship.

## Don't over-engineer

The counter-pressure: a call to a fast, reliable, co-located dependency may need only a timeout. Wrapping every internal function call in retries and breakers is cargo-culting that adds latency, complexity, and its own bugs. Apply these in proportion to the call's actual unreliability and the cost of its failure. The full stack is for genuinely unreliable, important, external calls; a local cache read is not that. Match the pattern to the risk.
