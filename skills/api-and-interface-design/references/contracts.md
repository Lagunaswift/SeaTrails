# Contracts: What an Interface Promises

Every interface is a contract whether or not anyone wrote it down. Stating it explicitly is the first design act, because the vagueness you discover while trying to state it cleanly is exactly the design problem you'd otherwise ship. If you can't say plainly what the interface requires and guarantees, you don't yet understand it well enough to expose it.

## The two halves of a contract

A contract has a caller's side and a provider's side:

- **Preconditions**: what the caller must guarantee for the interface to work. Valid inputs, required state, ordering ("you must open before you read"), things that must be true before the call. These are the caller's obligations.
- **Postconditions**: what the provider guarantees in return, given the preconditions held. The output, the effects, the state afterward, the invariants maintained. These are the provider's promises.

Designing the contract means deciding both halves deliberately: what you demand of the caller, and what you promise them. A loose precondition (you accept almost anything) means more work and more failure modes inside; a tight one (you demand a lot) pushes work onto the caller. A strong postcondition (you guarantee a lot) constrains your implementation; a weak one gives you freedom but makes the interface less useful. These are trades to make on purpose, not by accident.

## Make preconditions few and checkable

The fewer preconditions a caller must satisfy, the easier the interface is to use correctly. Each precondition is a way to get it wrong:

- **Prefer interfaces that demand little.** A function that works on any input in its type is easier to use right than one that requires the input to be pre-sorted, non-empty, and normalised. Where you can absorb a precondition (sort it yourself, handle the empty case), consider doing so rather than demanding it.
- **Where preconditions are unavoidable, make them checkable and check them.** A precondition the caller can't verify, or that you don't enforce, is a landmine. If "must be non-empty" matters, reject empty at the boundary with a clear error rather than producing garbage. Failing loudly on a violated precondition is far kinder than silently misbehaving (see `misuse-resistance.md`).
- **Encode preconditions in the type where possible**, so they're not preconditions at all but structural facts. A parameter typed to only accept valid values has no precondition to remember. This is the strongest form: the contract enforces itself.

## Make postconditions honest and complete

The provider's guarantees must be true *every* time, including the awkward cases, or the contract is a lie callers will trust and get burned by:

- **State what happens in the edge cases**, not just the happy path. What does it return for empty input, for a not-found, for a boundary value? An unstated edge case is one the caller will guess wrong.
- **Include effects, not just return values.** If the call mutates state, writes something, sends something, or changes the world, that's part of the postcondition. A function whose contract says "returns the user" but also silently sends an email has an undocumented effect that will surprise someone.
- **Don't promise more than you can keep across changes.** Every guarantee constrains your future implementation. Promising a specific ordering, a specific performance characteristic, or a specific format means you can't change it without breaking callers. Promise what callers genuinely need; leave yourself room on the rest (see `versioning-and-compatibility.md`).

## Total vs partial: what about inputs outside the contract?

An interface is **total** over its inputs if it does something sensible for every input of its declared type, and **partial** if some inputs have no defined behaviour. Partial interfaces are a frequent source of bugs because callers hit the undefined region without warning.

- Prefer **total** where reasonable: define behaviour for the whole input type, including empties, zeros, and boundaries, so there's no undefined region to fall into.
- Where an interface must be partial (some inputs are genuinely invalid), make the boundary explicit: reject the out-of-contract input loudly and immediately, rather than accepting it and behaving unpredictably. A partial interface that silently does *something* for invalid input is worse than one that clearly refuses.
- Better still, **narrow the input type** so the invalid inputs can't be expressed at all, converting a partial interface into a total one over a smaller type. If only positive numbers are valid, a type that only holds positive numbers removes the partiality (see `misuse-resistance.md`).

## Document the contract where the caller will see it

The contract belongs where a caller encounters the interface: the function's doc comment, the endpoint's API documentation, the type signatures themselves. Documentation that lives elsewhere, or in your head, isn't part of the contract the caller can rely on. The best documentation is the signature and types doing the work (a clear name, precise types, a Result type that shows failure), with prose filling only what types can't express: the effects, the edge-case behaviour, the guarantees that aren't visible in the shape. Prose that merely restates the signature is noise; prose that states what the signature can't is the contract.

## The contract is the stable thing

The implementation is free to change; the contract is what callers depend on, so it's what you must keep stable. This separation is the entire point of an interface: callers couple to the promise, not the mechanism, which is why you can rebuild the mechanism without telling them, as long as the promise holds. Everything in the rest of this skill, hiding implementation, consistency, misuse-resistance, versioning, is in service of keeping the contract clear, honest, and stable while the implementation behind it stays free.
