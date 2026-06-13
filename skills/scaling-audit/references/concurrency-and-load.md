# Concurrency and load

Working at one user is no evidence of working at many. This pass finds what breaks when requests arrive at the same time instead of one after another, and what degrades as the numbers climb.

## Concurrency hazards

**Races on shared state.**
When two requests touch the same data at the same time, code that's correct in isolation can corrupt it: read-modify-write without a lock or transaction, a counter that loses increments, a "check then act" that two requests both pass. These are invisible at low traffic (requests rarely overlap) and routine at high traffic. Look for shared mutable state updated outside a transaction or atomic operation. This is `state-management` territory; pull it in for the fix.

**The check-then-act gap.**
"Is this username taken? No? Create it." Two simultaneous requests both check, both see no, both create. Same pattern for "do they have credit," "is the seat free," "have we already processed this." Needs a uniqueness constraint, a lock, or an atomic operation, not application-level checking.

## The request path

**Synchronous work that should be backgrounded.**
If the request handler does slow work inline, calling the AI model, sending an email, generating a file, hitting a slow third party, then every one of those requests ties up a worker for the whole duration. Under load, all workers end up blocked on slow work and the app stops accepting requests, even though it's not "down." The fix direction is moving slow work off the request path into a queue/background job, returning fast, and delivering the result asynchronously.

**Unbounded work per request.**
Work that's fine for one user's data but grows with total data: loading all records to filter in memory, an endpoint that returns everything, an N+1 query pattern. Scales with the wrong number and falls over as data grows.

## Load characteristics

**Connection-pool exhaustion.**
Database (and other) connections are a finite pool. If each request holds a connection for a long time (because of slow inline work, see above) or leaks connections, the pool exhausts under concurrency and new requests fail waiting for one. Check pool size against expected concurrency, and whether connections are released promptly.

**Unbounded in-memory growth.**
Caches with no eviction, lists that only ever grow, per-user data accumulated in process memory: fine until memory fills, then the process dies (and if state was in memory, see failure-and-deployment, it takes that with it).

**O(n) and worse in users.**
Anything where the cost per request grows with the number of users or total records: scanning all users to do a thing, work that's quadratic in some growing quantity. Find the operations whose cost scales with total scale rather than staying constant per request.

## What to flag, by stage
- Prototype: most of this is theoretical at low traffic. Flag races on anything involving money or uniqueness (those bite even at low traffic and the cost is high), note the rest as "becomes a problem at scale."
- Real users: synchronous slow work in the request path and connection-pool limits are the common first failures, flag them.
- Growing / spiky traffic: the full sweep. Spiky traffic (a launch, a viral moment) surfaces concurrency bugs that steady traffic hides.

## Connection to other skills
`state-management` for the shared-state and race conditions; the concurrency hazards here are its scaling-facing edge.
