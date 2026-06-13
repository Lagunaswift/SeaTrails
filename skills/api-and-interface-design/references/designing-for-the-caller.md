# Designing for the Caller

The cardinal rule of the whole skill: design the interface from the caller's side of the boundary, around what they're trying to accomplish, not around how your implementation happens to work. This file is the practical how of that rule.

## Start from the call the caller wants to make

Before designing the interface, imagine the code the caller will write to use it. Write that call first, the ideal one, the one that reads as a clear statement of intent, and then design the interface to make that call possible. This inverts the usual (and wrong) direction of exposing what was easy to implement and letting the caller cope.

- The caller has a *goal* ("charge this customer", "get the active users", "save and notify"). The interface should let them state that goal directly, in roughly one call, without first understanding your internal steps.
- If the ideal call requires the caller to make three calls in sequence, pass the output of one as the input to the next, and remember the right order, your interface is exposing your implementation's steps as the caller's responsibility. Collapse them into the one call that expresses the intent, and do the sequencing inside.
- If the caller must pass information they shouldn't need to know (an internal id, a flag whose meaning is about your internals, a value you could derive yourself), you're making them do your bookkeeping. Remove it from the interface and handle it behind the boundary.

## Make the common case easy and the rare case possible

Most interfaces have a few operations that callers do constantly and many they do rarely. Optimise for the distribution:

- **The common case should be the shortest, most obvious path.** The 90% use should require minimal parameters, minimal ceremony, and the most discoverable name. If the most frequent operation needs five parameters and a setup call, the interface is mis-weighted.
- **The rare case should remain possible without complicating the common one.** Advanced options, unusual configurations, and escape hatches should exist but not intrude on the simple path. The classic technique is sensible defaults: the common call omits everything optional and gets good behaviour; the rare call overrides what it needs.
- **Don't force the rare case's complexity onto the common case.** If supporting one exotic caller means everyone passes an extra mandatory parameter, you've taxed the many for the few. Find a way to make the exotic path opt-in.

## Parameter design

Parameters are where interfaces become unusable in small increments. The traps:

- **Too many parameters.** A call with seven positional parameters is unreadable at the call site and easy to pass wrong. Group related parameters into a meaningful object/struct, or question whether the function is doing too much. A long parameter list is often a design smell pointing at a missing abstraction or an over-broad function.
- **Positional parameters of the same type.** `move(10, 20, 5, 8)` gives the caller no help and is trivially passed in the wrong order. Named parameters, an options object, or distinct types (so the compiler catches a swap) all fix this. The more same-typed parameters in a row, the more valuable naming becomes.
- **The boolean trap.** A bare `true`/`false` at a call site is opaque: `createUser("sam", true, false)`, what are true and false? The caller (and the reader) can't tell without the docs. Replace boolean flags with named arguments or, better, an enum/explicit type that states meaning at the call site (`Visibility.Public`, not `true`). A boolean parameter also often signals the function does two things and should be two functions. See `anti-patterns.md`.
- **Optional vs required.** Required parameters are the ones with no sensible default and that the operation can't proceed without. Everything else should be optional with a default. Making something required that could default forces ceremony on every caller; making something optional that's actually essential lets callers omit it and fail.
- **Order parameters by importance and stability.** Most-essential first, and put the parameters least likely to change toward the front (when the surface allows positional calls), so adding a new optional parameter later doesn't disturb existing calls.

## Return what the caller needs, in the shape they need it

- **Return the useful thing, not a status to look up separately.** A create that returns the created entity (with its new id) saves the caller a follow-up fetch. A function that returns only "success" and makes the caller re-query for the result it just produced is making them work.
- **Be consistent about return shape** across similar operations (see `consistency.md`), so callers can handle results uniformly.
- **Don't return internal representations** the caller would couple to (see `information-hiding.md`). Return what the contract promises, in a shape that's stable.

## Names are the first thing the caller reads

A name is the most-used part of an interface and the cheapest thing to get right or wrong. Name for what it does from the caller's perspective and in the caller's vocabulary, not the implementation's. `fetchUserFromCacheOrDb` leaks mechanism; `getUser` states intent. A name that describes *how* will become a lie when the how changes; a name that describes *what* survives. Detailed naming conventions are in `consistency.md`; the principle here is that the name is part of designing for the caller, and it should speak their language, not yours.

## The test

When the interface is drafted, role-play the caller: write three or four realistic uses, including an awkward one, without looking at the implementation. If the calls read as clear statements of intent, the parameters are obvious, and you didn't need to know how it works to use it right, the design is serving the caller. If you found yourself reaching for the implementation to know what to pass, or the calls read as a sequence of mechanical steps, redesign before you ship it to real callers who can't be redesigned around so cheaply.
