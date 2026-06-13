# State Management Anti-Patterns

Each entry is a recurring way runtime state goes wrong, why it's tempting, why it bites, and the correction. When you catch yourself doing one, stop and switch.

## The same fact in two places

**The pattern:** One fact stored in two (or more) pieces of state that are supposed to agree, a `selectedItem` and a `selectedId`, an `isLoggedIn` flag and a `currentUser`.
**Why it's tempting:** Having the fact in both forms is convenient at each use site, no lookup, no computation, it's right there.
**Why it bites:** The two copies drift the moment one update path changes one and not the other. The program holds a contradiction, no error fires, and wrong behaviour surfaces far from the cause.
**Correction:** One home per fact. Keep the genuine input (the id, the presence) and derive the rest. If two pieces of state determine each other, one isn't state. See `single-source-of-truth.md` and `identifying-state.md`.

## Storing what should be derived

**The pattern:** Storing a value that's a function of other state, a `total` beside `items`, a `fullName` beside the name parts, an `isValid` flag beside the fields.
**Why it's tempting:** Storing the computed value once seems cheaper than recomputing, and updating it alongside its inputs feels manageable.
**Why it bites:** It's a second source of truth that goes stale the instant an input changes through a path that forgets to update it. This is the most common runtime state bug.
**Correction:** Derive it, compute from the source state at the point of use. Cache only if measured cost demands it, and then with input-keyed memoisation or explicit invalidation, never hand-maintained updates. See `derived-state.md`.

## Several booleans for one condition

**The pattern:** One underlying condition encoded as independent flags, `isLoading`/`isError`/`isSuccess`, that can combine into impossible states.
**Why it's tempting:** Adding a boolean per situation is the incremental, obvious move as requirements grow.
**Why it bites:** N booleans give 2^N combinations, most illegal, and the illegal ones happen when one path sets one flag and forgets another. The program enters contradictory states (loading and errored at once) and behaves incoherently.
**Correction:** Model the condition as one variant that holds only legal values, each carrying its own valid data. The contradiction becomes unrepresentable. See `illegal-states.md`.

## Caching a derived value with no invalidation

**The pattern:** Storing a computed result for performance, with no plan for what makes it correct again when its inputs change.
**Why it's tempting:** The cache speeds things up and "I'll update it when things change" sounds like a plan.
**Why it bites:** "Update it when I remember" fails the moment a path changes the inputs without updating the cache, and now the cache is silently stale. The value is right after a refresh/restart and wrong otherwise, the staleness signature.
**Correction:** Cache only with a structural invalidation mechanism, input-keyed memoisation (staleness impossible) or explicit invalidate-on-change. No invalidation plan means no cache. See `derived-state.md`.

## Global mutable state touched from everywhere

**The pattern:** State at global/broad scope that any code can read and write directly.
**Why it's tempting:** It's reachable from anywhere with no passing, lifting, or wiring, the path of least resistance to "I need this value here too."
**Why it bites:** Anything can change it, so debugging a wrong value means suspecting the whole program. It couples distant code invisibly and hides inputs and effects. It's the maximum-difficulty version of every state problem.
**Correction:** Scope each fact as narrowly as its genuine sharers allow, local where possible. Where state is truly shared, give it a clear owner and concentrate writes. Broad read access is fine; broad write access is the hazard. See `scope-and-ownership.md`.

## Mutation from too many sites

**The pattern:** A piece of state changed directly from many places, with no central path for its transitions.
**Why it's tempting:** Mutating it directly wherever you need to is immediate; routing through a chokepoint is more setup.
**Why it bites:** The state's behaviour is the emergent sum of many independent mutations, unfollowable and unguaranteeable. Half-transitions (change one field, forget the related one) land in illegal states. Debugging "what changed this?" has no central place to look.
**Correction:** Concentrate writes, route changes through few defined paths (a reducer, an owning method, a service). Make transitions explicit operations that move state coherently. Model a state machine when there are stages. See `transitions.md`.

## Treating server-fetched data as local state

**The pattern:** Data that lives on the server, fetched and then held on the client as ordinary local state, owned and mutated freely.
**Why it's tempting:** Once it's fetched it looks like any other state, so it gets treated like any other state.
**Why it bites:** It's actually a client-side copy of server-owned truth, and treated as a local original it drifts from the server with no reconciliation, the client shows stale data, or local edits diverge from the real value.
**Correction:** Treat server state as a managed cache of server truth, with refetch/invalidation/staleness handling (hand-rolled or via a data-fetching layer), distinct from genuine local state. See `surface-frontend.md` and `single-source-of-truth.md`.

## Per-request state leaking across requests

**The pattern:** Server state that should be per-request held in shared/module scope, so one request sees another's data.
**Why it's tempting:** A module-level variable or a reused shared object is convenient to reach from any handler.
**Why it bites:** Shared mutable state across requests means concurrent requests interleave and one reads another's data, a correctness bug and a security leak (cross-user/cross-tenant exposure).
**Correction:** Request-specific state is request-scoped, carried in the request's own context, never parked on shared mutable structures. Test: can two requests handled by one instance see each other's data? See `surface-backend.md`.

## Sharing mutable state without synchronisation

**The pattern:** Genuinely shared in-memory state (a cache, a counter, a pool) accessed concurrently with hand-rolled check-then-act or read-modify-write logic and no atomicity.
**Why it's tempting:** The logic looks correct when you imagine one caller at a time.
**Why it bites:** Under concurrency the steps interleave, updates are lost, checks act on changed values, the data-and-state race conditions in runtime form.
**Correction:** Use atomic operations or proper synchronisation, or push the shared state to infrastructure built for concurrency (a store with transactions, an atomic counter). Don't hand-roll concurrent mutation. See `surface-backend.md`.

## Reaching for distributed state when local would do

**The pattern:** Sharing mutable state across services/processes when a single owner or a shared store would suffice.
**Why it's tempting:** "Just share it across the services" sounds straightforward and avoids designating an owner.
**Why it bites:** Distributed shared mutable state collides with the network's unreliability and the consistency-availability trade, it's a specialist problem with no easy general solution, taken on unnecessarily.
**Correction:** Give the fact one owning service or push it to a shared store that all (stateless) services read through. Take on genuine distributed state only when single-ownership is truly impossible, and then choose a consistency model deliberately. See `surface-distributed.md`.

## Over-lifting local state to global

**The pattern:** Pushing state to global/broad scope when only one or a few units use it, often "to be safe" or to avoid passing it.
**Why it's tempting:** Global is reachable everywhere, so it never needs threading through, and broad feels future-proof.
**Why it bites:** It widens the blast radius gratuitously, more of the program can now touch state it doesn't use, recreating the global-mutable-state problems for state that didn't need to be shared at all.
**Correction:** Lift only to the lowest common owner of the genuine sharers, no higher. If most code that *can* reach the state doesn't *use* it, it's over-scoped. As local as possible, as global as necessary. See `scope-and-ownership.md`.
