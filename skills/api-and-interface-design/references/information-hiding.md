# Information Hiding

The purpose of an interface is to let callers depend on *what* without coupling to *how*. Every internal detail that escapes across the boundary is something callers will build on, which means something you can no longer change freely. Information hiding is the discipline of exposing the contract and concealing everything else, and it's what buys you the freedom to evolve the implementation.

## Every public element is a permanent commitment

Treat anything you expose as something you'll have to support indefinitely, because callers will use it and depend on it, including the parts you exposed by accident:

- A public function, field, endpoint, or type is a promise you've made to every current and future caller. Removing or changing it breaks them. The cost of a public element isn't writing it; it's being unable to change it later.
- This reframes the default: **expose nothing until there's a reason to.** It's easy to make a private thing public later (no caller is harmed by gaining access); it's painful to make a public thing private (every caller breaks). Start closed, open deliberately. The asymmetry strongly favours under-exposing.
- "I'll just make it public in case someone needs it" is how surfaces bloat into unmaintainable commitments. If no caller needs it now, hiding it costs nothing and keeps your options open.

## Keep the surface as small as it can usefully be

The size of the public surface is the size of your obligation and the size of what callers must learn:

- **A small surface is easier to learn, harder to misuse, and freer to change.** Callers can hold a small interface in their heads; a sprawling one sends them to the docs for every call and offers many wrong ways to do things.
- **Prefer few, well-chosen operations over many overlapping ones.** Three ways to do the same thing means callers pick inconsistently, you maintain three paths, and changing behaviour means changing all three consistently. One good way is better than three mediocre ones.
- When tempted to add to the surface, ask whether an existing element already covers it, or whether the new need is better met by composing existing pieces than by adding a new public one.

## Leaky abstractions: when the how shows through the what

An abstraction leaks when callers can see, or are forced to deal with, the implementation it was supposed to hide. Leaks couple callers to your internals silently, so they break when you change those internals even though you "didn't change the interface":

- **Returning internal representations.** Handing back your internal data structure, your ORM entity, your database row shape, means callers now depend on that shape, and a refactor of your storage breaks them. Return a stable, intentional shape that's part of the contract, not whatever your implementation happens to hold.
- **Mechanism in names and parameters.** A parameter called `useNewCache` or a method named `fetchViaGraphQL` exposes implementation choices the caller shouldn't know or care about. When you drop the cache or switch off GraphQL, the name is a lie and the parameter is dead, but callers depend on both.
- **Implementation-dependent behaviour.** If the interface's behaviour depends on an internal detail (ordering that happens to fall out of your data structure, a limit that's really your buffer size), callers will come to rely on the incidental behaviour, and changing the internal detail breaks them even though you never promised that behaviour. Either promise it (make it contract) or prevent reliance on it (don't expose it).
- **Errors that expose internals.** A failure that surfaces a database error, a stack trace, or an internal service name leaks your architecture across the boundary (see `failure-as-contract.md` and the error-handling skill). Translate failures into the interface's own vocabulary.

The test for a leak: "if I completely rewrote the implementation while keeping the promised contract, would any caller break?" If yes, something is leaking that shouldn't be, and that something is coupling callers to a "how" you wanted to keep free.

## Hide the data, expose the operations

A recurring form of information hiding: expose what callers can *do*, not the raw state they'd manipulate. Direct access to internal state lets callers put it into combinations you didn't intend and depend on its exact shape. Operations let you maintain invariants, validate, and change the underlying representation:

- Exposing a mutable internal collection lets callers modify it in ways that violate your invariants and couples them to its type. Expose the operations (add, remove, query) and keep the collection private.
- This is the encapsulation principle generally: the boundary offers behaviour, the state behind it is the implementation's business. It connects directly to making misuse hard (`misuse-resistance.md`), hidden state can't be put into an illegal configuration by a caller.

## The payoff

Information hiding feels like extra work at design time, defining a clean return shape instead of returning the raw entity, keeping things private, translating errors. The payoff is the ability to change. A well-hidden implementation can be rewritten, optimised, re-architected, or replaced entirely without a single caller noticing, because they only ever depended on the contract. A leaky one calcifies: every internal detail that escaped is a chain to the past. The discipline you spend hiding now is the freedom you keep later.
