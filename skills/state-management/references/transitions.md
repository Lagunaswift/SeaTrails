# Controlling Transitions

State that can be mutated from anywhere, in any order, by any code, becomes impossible to reason about: you can't predict what state the program is in, you can't guarantee transitions are valid, and you can't find what changed a value when it goes wrong. Controlling *how* state changes, through defined paths, in predictable ways, from few places, is what makes state's evolution followable and its invariants holdable. This is the difference between state that drifts into chaos and state that moves through a known set of conditions on purpose.

## Concentrate the writers

The single most effective transition discipline is to have few places that change a given piece of state, ideally one:

- When one piece of code owns the mutation of a piece of state, you have exactly one place to look when it's wrong, one place to enforce invariants, and one place that must get the update right. When fifty call sites mutate it directly, the state's behaviour is the emergent sum of fifty independent decisions, and no one can hold that in their head.
- The shape this takes varies by surface, a reducer or action handler in a frontend store, a single method on the object that owns the state, a single service responsible for a server-side store, but the principle is constant: **route changes through a chokepoint** rather than mutating from everywhere. Readers can be many; writers should be few.
- This directly serves the single-source-of-truth and illegal-state goals: invariants are far easier to maintain when there's one writer to maintain them than when every mutation site must independently remember them.

## Make transitions explicit, not incidental

A transition is a move from one state to another. When transitions are explicit, named operations ("submit the form", "start loading", "complete the order"), you can see and control them. When they're incidental, scattered direct mutations of individual fields, the actual transition is implicit in which fields happened to change together, and it's easy to do half a transition (change one field, forget the related one) and land in an illegal combination:

- Prefer changing state through operations that represent meaningful transitions and move the state as a coherent whole, rather than poking individual fields. "Begin loading" sets the status to loading and clears the previous error and data together, as one transition, so you can't end up loading-with-a-stale-error.
- This pairs with modelling state as variants (see `illegal-states.md`): when the state is one status value with attached data, a transition replaces the whole thing with a new valid value, rather than mutating fields independently and risking a half-changed contradiction.

## Model the state machine when state moves through stages

When a piece of state moves through a defined set of stages with rules about which moves are allowed, that's a state machine, and modelling it explicitly prevents a whole class of bugs. (Data-modelling owns the *persisted* state machine, what's stored about an order's status and its history; this is the *runtime* side, the in-memory state moving through its stages while the program runs.)

- **Enumerate the legal states.** The operation is `idle`, `loading`, `success`, or `error`; the connection is `disconnected`, `connecting`, `connected`; the wizard is on one of its defined steps. Knowing the full set of legal states is half the battle, it's the set the state variable is allowed to hold.
- **Define the legal transitions.** Not every state can follow every other. You can go `idle -> loading`, `loading -> success`, `loading -> error`, but not `success -> loading` without going through a reset, and not `idle -> success` directly. The legal transitions are a small graph, and most state bugs are illegal transitions (jumping to a state you can't validly reach from the current one).
- **Enforce the transitions, don't just document them.** A transition function that only permits legal moves (rejecting or ignoring `success -> loading` if that's illegal) makes the invalid transition impossible, rather than relying on no code ever attempting it. Even a lightweight "given current state and this event, here's the next state, and unknown combinations are rejected" centralises and enforces the rules.

Explicit state machines turn "the state mysteriously got into a weird combination" into "that transition isn't allowed, rejected at the one place transitions happen." They're especially worth it for anything with more than a couple of stages: async flows, multi-step processes, connection lifecycles, anything with a clear notion of "what state are we in and what can happen next."

## Predictable change makes debugging tractable

A reason to control transitions that pays off constantly: when state changes through few, explicit, defined paths, debugging a wrong state is tractable, you look at the chokepoint, you see the transitions, you find which one was wrong. When state changes through scattered direct mutation, debugging means finding which of many call sites changed the value, with no central place to look (this is the data-and-state debugging difficulty in its runtime form). Controlled transitions are partly an investment in being able to understand your own program when it misbehaves.

## Don't over-engineer the simple cases

The counter-pressure: not every piece of state needs a formal state machine or a reducer. A single boolean toggle, a piece of purely local UI state with one obvious writer, a value that's set once and read, these don't need transition ceremony, and imposing it is complexity for its own sake. The machinery scales with the state's complexity: trivial state gets trivial handling; state with multiple stages, multiple writers, or invariants that span fields earns explicit transitions and possibly a modelled machine. Match the control to the state's actual complexity, the goal is followable, guaranteed transitions, not maximal formalism everywhere.
