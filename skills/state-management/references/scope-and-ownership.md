# Scope and Ownership

Where a piece of state lives, how widely it's accessible, determines how easy it is to reason about and how much can go wrong with it. The guiding principle: **put each piece of state at the narrowest scope that still serves everyone who needs it.** As local as possible, as global as necessary. State scoped too broadly becomes shared mutable state that anything can touch and nothing fully owns; scoped too narrowly, it forces awkward passing or, worse, duplication. The right scope is the smallest one that covers the genuine readers and writers.

## Why broad scope is costly

Global or broadly-shared mutable state is the easiest to reach for and among the hardest to live with:

- **Anything can change it, so anything can break it.** When state is globally accessible and mutable, the set of code that might have changed it is the whole program. Debugging a wrong value means suspecting everything (the data-and-state debugging difficulty at maximum). The wide scope is what makes "who changed this?" unanswerable.
- **It couples distant code.** Two unrelated parts of the program that both touch the global state are now coupled through it, a change to how one uses it can break the other, with no visible connection between them.
- **It obscures dependencies.** A function that reads global state has a hidden input not visible in its signature; one that writes it has a hidden effect. The function looks self-contained and isn't, which makes it harder to understand, test, and reuse (this connects to interface design, hidden inputs and effects are undocumented contract).
- **It invites the illegal-state and drift problems** by giving every piece of code the ability to mutate shared state directly, which is the opposite of concentrating writers (see `transitions.md`).

None of this means global state is never warranted, some state genuinely is application-wide (the current user, the theme, app-level configuration). It means breadth is a cost you pay for genuine sharing, not a default to reach for because it's convenient to access from anywhere.

## Choosing the scope

For each piece of state, find the narrowest scope that contains all its genuine readers and writers:

- **If only one component/function/unit uses it, it's local.** Keep it there. Local state is the easiest to reason about, its readers and writers are right there, its lifetime is the unit's lifetime, and nothing else can touch it. Most state is more local than people make it.
- **If a few related units share it, scope it to their common parent or a shared owner**, not to the whole application. Lift it just high enough to reach all of them (see lifting, below), and no higher.
- **If it's genuinely application-wide, it's global/shared**, but make that a deliberate decision about a fact that truly is application-scope, not a shortcut to avoid passing it. And when it is global, apply the write-concentration discipline hardest (see `transitions.md`), broad read access with narrow, controlled write access is far safer than broad write access.

## Lifting state without over-lifting

When several units need to share a piece of state, the move is to lift it to a common owner that all of them can reach, and have them read from and write to that owner rather than each holding their own. The discipline is lifting it to the *right* level:

- **Lift to the lowest common owner**, the nearest point that all the genuine sharers descend from or can access. Lifting exactly that far gives the sharing without widening access beyond the sharers.
- **Don't over-lift.** Pushing state higher than the lowest common owner (all the way to global "to be safe", or up several levels past where it's needed) widens its scope gratuitously, every level you lift past the necessary one is more of the program that can now reach state it has no business touching. Over-lifting is how state creeps toward global one convenient step at a time.
- **The signal you've lifted right**: every unit that can access the state actually needs it, and the units that don't need it can't reach it. If most of the code that *can* touch a piece of state doesn't *use* it, it's scoped too broadly.

## Ownership: one place is responsible

Beyond scope, each piece of state should have a clear owner, the one part of the program responsible for it, that holds the canonical copy (see `single-source-of-truth.md`) and ideally is the chokepoint for its changes (see `transitions.md`):

- Ownership answers "whose state is this?" Clear ownership means there's a definite place that's responsible for the state's correctness, its invariants, its lifecycle. Diffuse ownership (everyone shares it, no one owns it) means no one is responsible, and unowned shared state rots.
- The owner controls the writes and exposes reads; others go through the owner rather than reaching around it. This is encapsulation applied to state, the owner offers operations on the state and keeps the raw mutable state to itself, rather than exposing it for anyone to mutate (connecting to information-hiding in interface design).

## The scope-and-ownership summary

The healthiest state has each fact owned by one clear part of the program, scoped exactly as wide as its genuine sharers and no wider, with reads available to those who need them and writes concentrated in the owner. The unhealthiest has facts scattered at global scope, owned by no one, readable and writable by everything. Most of the distance between those two is resisting the convenient instinct to scope broadly and mutate freely, and instead keeping state as local, as owned, and as write-concentrated as its actual sharing requires.
