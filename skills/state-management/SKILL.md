---
name: state-management
description: "Use this skill whenever designing or fixing how an application holds and changes data in memory while it runs: UI/component state, application state, server-side request or session state, caches, in-memory stores, or anything tracking 'what is true right now'. Trigger on phrases like 'manage state', 'state management', 'store this in state', 'where should this live', 'single source of truth', 'this value is out of sync', 'stale data', 'the UI doesn't update', 'derived state', 'global state', 'shared state', 'state machine', or when two parts of a program hold copies of the same thing that can disagree. Also trigger proactively when adding state, a store, or a cache, BEFORE wiring it up, since state structure is hard to change once code depends on it. Covers single source of truth, derived vs stored state, making illegal states impossible, controlled transitions, and where state should live. Does NOT cover persisted/database modelling (use data-modelling) or debugging a sync bug (use debugging-methodology)."
---

# State Management

A method for deciding how an application holds and changes data in memory while it runs, so that what the program believes is true stays consistent, predictable, and impossible to corrupt. "State" here is runtime state: UI and component state, application state, server-side request and session state, in-memory caches and stores. Persisted data in a database is the data-modelling skill's domain; this skill is about the state that lives only while the program runs.

The principles are language- and framework-agnostic. Where the surface matters (a reactive frontend, a stateless server, a distributed system), the specifics live in the surface files.

## What makes state hard

A stateless function is easy to reason about: same input, same output, nothing remembered. State is what breaks that simplicity, the program now has memory, and memory can be wrong. Almost every state bug is one of four failures, and this skill is organised around preventing all four:

1. **Multiple sources of truth that drift.** The same fact is stored in two or more places, they're supposed to agree, and eventually they don't. One gets updated and the other doesn't, and now the program holds two contradictory beliefs about the same thing.
2. **Storing what should be derived.** A value that could be computed from other state is instead stored separately, creating a second source of truth for the same fact, which then drifts (a special case of the first failure, common enough to treat on its own).
3. **Illegal state combinations.** The state is structured so that contradictory or impossible combinations can be represented, loading and error at once, a "selected item" with no selection, and the program reaches them.
4. **Uncontrolled transitions.** State changes happen from too many places, in unpredictable orders, without a clear model of what transitions are allowed, so the state evolves in ways no one can follow or guarantee.

Get these four right and most state bugs never exist. The rest of the skill is how.

## The cardinal rule

**Every fact has exactly one home, and everything else derives from it or refers to it.** This single principle, one source of truth per fact, prevents the first two failures outright and underpins the others. When a fact lives in exactly one place, there's nothing for it to drift against; when other parts of the program need it, they read from that one home or compute from it, rather than keeping their own copy. The moment the same fact is stored in two places that can independently change, you have a synchronisation problem that no amount of careful updating fully solves, because correctness now depends on every writer, forever, remembering to update both. Design the single home first; treat every apparent need for a second copy as a question to interrogate, not a default to accept.

## The method

### 1. Identify the real state, and minimise it

Before structuring state, find what the genuine state actually is: the minimal set of facts from which everything else can be derived. Much of what programs store as "state" is not independent state at all, it's derivable from other state, and storing it creates the drift problem. The goal is the smallest set of independent facts that captures what the program needs to remember; everything else is computed. `references/identifying-state.md` covers finding the minimal state, the test for "is this real state or derivable", and why less state is less to keep consistent.

### 2. Give each fact a single source of truth

For each genuine fact, decide its one home, and ensure nothing else stores the same fact. Other parts of the program that need it read from that home or receive it, rather than caching their own copy. Where a copy seems necessary (often for performance or across a boundary), it's a deliberate, named exception with a plan to keep it consistent, never an accident. `references/single-source-of-truth.md` covers establishing the canonical home, the cost of every duplicate, and handling the cases where a copy is genuinely required.

### 3. Derive, don't store, what can be computed

Anything that can be calculated from the source-of-truth state should be computed when needed, not stored as its own state. Stored derived values are a second source of truth that drifts the instant the underlying state changes and the derived copy isn't updated. Compute it, and it's always correct by construction. `references/derived-state.md` covers the derive-vs-store decision, when caching a derived value is justified (and how to keep it valid), and the in-memory staleness that mirrors the caching problems of the data world.

### 4. Make illegal states unrepresentable

Structure the state so impossible and contradictory combinations cannot be expressed, rather than relying on code to avoid them. This is the runtime-state twin of the same principle in data-modelling and interface design: if the shape of the state can't represent "loading and loaded and errored simultaneously", no code path can put it there. The classic culprit is several independent flags that encode one underlying condition. `references/illegal-states.md` covers modelling state as explicit variants, the multiple-boolean trap, and choosing a shape that admits only valid combinations.

### 5. Control how state changes

Make state transitions explicit and constrained: change state through defined paths, in predictable ways, ideally from few places, rather than letting any code mutate anything from anywhere. Unconstrained mutation from many sites is how state becomes impossible to follow and transitions become impossible to guarantee. For state that moves through defined stages, model the state machine, the legal states and the legal transitions between them. `references/transitions.md` covers controlled mutation, modelling transitions, the runtime side of state machines (the data-modelling skill owns the persisted side), and concentrating writes.

### 6. Place state at the right scope

Put each piece of state at the narrowest scope that still serves everyone who needs it: as local as possible, as global as necessary. State scoped too broadly (global when it could be local) becomes shared mutable state that anything can touch and that's hard to reason about; state scoped too narrowly forces awkward passing or duplication. `references/scope-and-ownership.md` covers choosing scope, the cost of global/shared state, lifting state to its needed level without over-lifting, and ownership.

## Surfaces

The principles are shared; how state actually lives differs by surface. Read the relevant file:

- `references/surface-frontend.md`: UI and component state, reactivity, derived values in views, local vs shared vs server state, the update model
- `references/surface-backend.md`: server-side state, the value of statelessness per request, session state, in-memory caches, state across requests, concurrency on shared state
- `references/surface-distributed.md`: state across processes/services, why distributed shared state is hard, consistency models, and avoiding it where possible

## Anti-patterns

The recurring ways runtime state goes wrong, each with its correction, in `references/anti-patterns.md`:

- The same fact stored in two places that drift
- Storing a value that should be derived
- Several booleans encoding one condition (illegal combinations)
- Caching a derived value with no invalidation plan
- Global/shared mutable state touched from everywhere
- Mutation from so many sites that transitions can't be followed
- Treating server-side per-request state as if it persists (or vice versa)
- Sharing mutable state across requests or threads without synchronisation
- Reaching for distributed shared state when local would do
- Over-lifting state to global when it could be local

## Reference index

- `references/identifying-state.md`: finding the minimal real state; is-this-derivable
- `references/single-source-of-truth.md`: the canonical home; the cost of duplicates; necessary copies
- `references/derived-state.md`: derive vs store; justified caching; in-memory staleness
- `references/illegal-states.md`: unrepresentable illegal combinations; the multiple-boolean trap
- `references/transitions.md`: controlled mutation; runtime state machines; concentrating writes
- `references/scope-and-ownership.md`: choosing scope; global-state cost; lifting without over-lifting
- `references/surface-frontend.md`: UI/component state, reactivity, the update model
- `references/surface-backend.md`: server state, statelessness, sessions, caches, concurrency
- `references/surface-distributed.md`: cross-process state, consistency, avoiding distributed state
- `references/anti-patterns.md`: the failure modes above, each with its correction
