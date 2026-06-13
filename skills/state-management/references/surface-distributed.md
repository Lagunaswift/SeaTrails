# Surface: Distributed State

State spread across multiple processes, services, or machines is the hardest form of state management, and the most important guidance is the least technical: **avoid distributed shared mutable state whenever you can.** The reason it's hard is fundamental, not a matter of picking the right library, so the first move is always to question whether you need it at all, and the second is to recognise which well-understood approach fits when you do. Deep distributed-systems engineering is its own discipline beyond this skill; this file is about recognising the territory and not walking into it accidentally.

## Why distributed shared state is genuinely hard

When the same fact must be agreed upon across machines that communicate over a network, you collide with constraints that don't exist in a single process:

- **The network is unreliable and slow.** Messages are delayed, lost, duplicated, and reordered. A machine can't tell "the other machine is down" from "the other machine is slow" from "the network between us failed." Every cross-machine state operation happens under this uncertainty.
- **There's no shared clock.** Machines disagree about what time it is and about the order events happened in, so "which update is newer?" has no simple answer across machines.
- **You can't have everything.** When the network partitions (machines can't reach each other), a distributed system must choose between staying consistent (refusing to answer rather than risk disagreeing) and staying available (answering, risking that different machines give different answers). You cannot have perfect consistency, perfect availability, and partition tolerance at once, and partitions are not optional, they happen, so the real choice is consistency-vs-availability under partition. This is the trade every distributed-state design is really making.

These are properties of the world, not deficiencies you can engineer away. They're why distributed shared mutable state is a different and harder problem than in-process state, and why "just share the state across the services" is never as simple as it sounds.

## First: avoid it

Most systems that think they need distributed shared state don't, and the architectures that avoid it are simpler and more robust:

- **Keep one owner per piece of state.** Instead of several services sharing and all mutating one fact, make one service the owner of that fact, and have others ask it rather than holding their own mutable copies. This is single-source-of-truth across services: the fact has one home (one service, backed by one store), and everyone else is a reader. The hard distributed-agreement problem mostly evaporates when only one party writes.
- **Push shared state into infrastructure built to handle it.** A database with real transactions, a dedicated cache/coordination service, a message queue, these are systems whose entire job is handling shared state correctly under concurrency and failure. Using one is almost always better than implementing distributed-state coordination yourself in application code. Let the database be the single source of truth that all your services read and write through, and most "distributed state" becomes "several stateless services sharing one store", which is the stateless-backend pattern (see `surface-backend.md`), not a distributed-consensus problem.
- **Prefer stateless services that externalise their state.** A service that holds no canonical state itself, deriving everything from a shared store per request, sidesteps cross-instance state entirely. This is why the stateless pattern matters so much: it turns "N services with shared state" into "N stateless workers and one store."

The strong default: design so that no two parties both own and mutate the same fact. If you can arrange that, you've avoided the hard problem rather than solving it.

## When you genuinely need it: know the trade you're making

Sometimes distributed shared state is unavoidable (multiple machines must coordinate, the state can't have a single owner, scale forces partitioning). Then the key is to make the consistency trade deliberately, knowing what you're choosing:

- **Strong consistency**: every reader sees the latest write, the system behaves as if there's one copy. Easiest to reason about, costs availability (under partition, it must refuse rather than risk disagreement) and latency (coordination takes round-trips). Right when correctness of the shared fact matters more than always being able to answer, balances, inventory that can't oversell, anything where a stale read causes real harm.
- **Eventual consistency**: copies may disagree briefly but converge given time without new writes. More available and faster, at the cost that readers can see stale or out-of-order values for a while. Right when temporary disagreement is tolerable and availability matters more, view counts, feeds, caches, status that can lag without harm.
- The choice is per-fact, not per-system: a single application can hold its money strongly-consistent and its analytics eventually-consistent. Decide for each shared fact which harm you can tolerate, a stale read, or an unavailable one, and that answer picks the consistency model.

## Recognise the patterns, reach for proven ones

When you're in genuine distributed-state territory, the work is mostly choosing among established, well-understood approaches rather than inventing:

- **A single authoritative store** (the database as the one source of truth) handles the majority of cases and should be the first thing you try to make sufficient.
- **Consensus systems** exist for the cases that truly need multiple machines to agree on shared state with strong guarantees, and they're hard enough that you use a proven implementation rather than writing your own.
- **Idempotency and message-based coordination** (services communicating through queues, operations designed to be safely retried, see the error-handling skill's idempotency treatment) let services coordinate without shared mutable state, each service owns its state and reacts to messages, which is often the robust alternative to sharing.

The throughline: distributed shared mutable state is a specialist problem with no easy general solution, because its difficulty comes from the network and physics, not from tooling. Treat needing it as a signal to first redesign toward a single owner or a shared store, and only when that's genuinely impossible, choose your consistency model deliberately and reach for proven systems rather than hand-rolled coordination. The best distributed-state code is the distributed-state code you arranged not to need.
