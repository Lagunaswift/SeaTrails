# Identifying State: Find the Minimal Real Facts

Before structuring state, find what the state actually is. Most state bugs are made possible at this step, by treating something as independent state when it isn't. The goal is the smallest set of independent facts the program must remember, from which everything else can be derived. Less state is less to keep consistent, fewer things that can drift, fewer combinations that can go wrong. Every fact you can eliminate from the state is a class of bug you've removed.

## The test: is this real state or derivable?

For each candidate piece of state, ask: **can this be computed from other state I already have?** If yes, it is not independent state, it's a derived value, and storing it creates a second source of truth that will drift (see `derived-state.md`). Only the facts that *cannot* be computed from anything else are genuine state.

- A list of items is state. The *count* of items is not, it's `length`. The *filtered* list is not, it's a computation over the list and the filter. The *"is the list empty"* flag is not, it's `count === 0`.
- The set of selected ids is state. *"Are any selected"* is derived. The *selected items themselves* are derived (the ids plus the list).
- The raw input value is state. *"Is the input valid"* is usually derived (a computation over the input). *"Should the submit button be enabled"* is derived from validity and other state.

Run this test on everything you're tempted to store. The surprising amount of "state" that turns out derivable is exactly the state that, if stored, would have drifted.

## The minimal set captures intent, not consequences

Genuine state represents a *decision* or an *input* the program received and must remember, the things the world told it that it can't recompute:

- What the user typed, selected, toggled, navigated to.
- What an external system returned that you're holding onto.
- Where the program is in a process it's running (which step, which mode).
- Anything that arrived from outside and isn't recoverable by computation.

Everything downstream of those, the views, the totals, the validity, the enabled-ness, the formatted versions, is a consequence, and consequences are computed, not stored. The skill is separating the inputs (real state) from the consequences (derived), and keeping only the inputs as state.

## Watch for the same fact wearing two outfits

A subtle form of redundant state: two pieces of state that look different but encode the same underlying fact, so they can contradict each other:

- A `selectedItem` object *and* a `selectedId`, when the id is just the object's id. Two homes for "what's selected", able to disagree.
- An `isLoggedIn` boolean *and* a `currentUser` object, when logged-in is really just "currentUser is present." The boolean can say true while the user is null.
- A `currentPage` number *and* a `currentItems` array, when the items are determined by the page.

When you find two pieces of state where one determines the other, one of them isn't state, it's derived from its partner. Keep the one that's the genuine input (usually the smaller, more primitive one, the id, the presence, the page) and derive the other.

## Don't over-minimise into recomputation that loses information

The counter-pressure: some things look derivable but aren't, because the derivation would lose information the program genuinely needs to remember:

- An *expensive* derivation that's needed constantly may justify being cached (a stored derived value with an invalidation plan, see `derived-state.md`), but that's a deliberate performance exception, not a reason to call it independent state.
- A value that *was* derived from input that's no longer available is now genuine state (a snapshot taken at a moment, like "the price when the order was placed", is real state even though it looks like it derives from "the current price", because the current price has since changed and the snapshot must persist independently). This mirrors the snapshot-vs-live distinction in data-modelling: the captured-at-a-moment value is its own fact.
- Order, history, and "how we got here" are real state when the program needs them and they can't be reconstructed from the current values alone.

The judgement: derive what's a pure function of current state; keep as state what's an input, a decision, a snapshot, or a history that recomputation would lose. When unsure whether something is derivable, try to write the function that computes it from your other state, if you can, it's derived; if the function would need information you don't have, it's real state.

## The payoff

A program whose state is the minimal set of real facts, with everything else derived, has structurally eliminated the largest category of state bugs: it cannot have two values for one fact, because each fact exists once, and it cannot have a derived value go stale, because derived values aren't stored. The work of identifying minimal state is the work of preventing drift before it can happen. Spend it before you wire anything up, because adding state is easy and removing state that code already depends on is the hard migration.
