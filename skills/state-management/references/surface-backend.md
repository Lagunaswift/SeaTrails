# Surface: Backend and Server-Side State

Server-side state has a defining tension the frontend doesn't: a server usually handles many requests, often concurrently, often across multiple instances, so in-memory state is shared in ways that create concurrency hazards and scaling limits. The backend translation of the principles, with statelessness as the dominant theme.

## Prefer statelessness per request

The most valuable server-state principle is to keep request handling stateless: each request carries what it needs, the handler doesn't rely on in-memory state left over from previous requests, and the canonical truth lives in a shared store (a database, a cache server) rather than in the process's memory.

- **Stateless requests can be handled by any instance.** When a handler depends on in-memory state from a prior request, that request must hit the same instance, which breaks the moment you run more than one instance (and you will, for availability and scale). Statelessness is what lets requests be load-balanced freely, retried safely, and scaled horizontally.
- **In-memory per-request state is fine and should be local.** State created and used within a single request (parsed input, intermediate values, the request's context) is local state with the request's lifetime, scope it to the request and let it die with the request. The hazard is not per-request memory; it's per-request memory that *leaks* into being treated as if it persists.
- **Persistent truth belongs in the shared store, not process memory.** Anything that must outlive a request or be seen by other requests goes in the database or a shared cache (the data-modelling skill owns how that's structured), not in a module-level variable in one process. A value stored in one instance's memory is invisible to the others and lost on restart, holding canonical state there is a drift-and-loss bug.

## The dangerous pattern: state leaking across requests

A specific, serious backend bug: state that should be per-request bleeding into shared scope, so one request sees another's data. This is both a correctness bug and a security one (cross-tenant or cross-user data exposure):

- **Module-level mutable state mutated per request.** A variable at module scope that handlers write to per request is shared across all requests that instance handles. Two concurrent requests interleave their writes; one request reads state another request set. This is the runtime form of the state-leakage-between-contexts bug from data-and-state debugging.
- **A reused client/context holding request-specific data.** A shared service object that stashes "the current user" or "the current tenant" as mutable state, then serves a different request, leaks the previous request's identity into the next. Request-specific data must live in request-scoped storage, never on a shared object.
- The fix is scope discipline (see `scope-and-ownership.md`): request-specific state is request-scoped, passed through the request's own context, never parked on shared mutable structures. The test is the leakage test from debugging: if two requests handled in sequence (or concurrently) by one instance can see each other's data, you have state in the wrong scope.

## Concurrency on genuinely shared state

When server state *is* legitimately shared (an in-memory cache, a connection pool, a counter), concurrent access is the hazard, and the data-and-state race conditions apply directly:

- **Read-modify-write races** on shared in-memory state lose updates when two requests interleave (both read, both modify, both write, one overwrites the other). The fixes are the same as the data world: atomic operations, proper synchronisation, or designing the state so the operation is atomic. Don't hand-roll "check then update" on shared state under concurrency.
- **Check-then-act races** (check a shared value, act on it, but it changed in between) need the check and act to be atomic, not two separate steps.
- **Prefer pushing shared mutable state to infrastructure built for it.** A shared cache server, a database with real transactions, an atomic counter in a store, these handle concurrency correctly so your process doesn't have to. In-process shared mutable state under concurrency is easy to get wrong and a reason to keep canonical state in the store rather than the process.

## Session and cached state

- **Session state** (what's known about a user across their requests) is a copy/cache of truth that needs a clear home. Holding it in one instance's memory breaks multi-instance; holding it in a shared store (or carrying it in the request via a token) keeps it consistent across instances. Treat session state as shared state with a real home, subject to single-source-of-truth, not as casual per-process memory.
- **In-memory caches** on the server are justified copies (performance across the boundary to a slower store), and they carry the cache obligation: an invalidation/expiry plan (see `derived-state.md` and `single-source-of-truth.md`). A per-instance cache also has a consistency wrinkle, each instance has its own, so they can disagree, and an invalidation in one isn't seen by the others. Decide whether per-instance staleness is acceptable or whether you need a shared cache; either is fine if chosen deliberately, the bug is an unmanaged per-instance cache that drifts silently.

## The backend summary

Keep request handling stateless and request-state request-scoped; put canonical truth in a shared store rather than process memory; treat any genuinely shared in-memory state as a concurrency problem to be handled with proper atomicity or pushed to infrastructure; and treat session and cache state as managed copies with real homes and invalidation. The recurring backend failure is in-memory state that's treated as more durable or more private than it actually is, persisting what's per-request, sharing what should be isolated, holding canonical truth where only one instance can see it.
