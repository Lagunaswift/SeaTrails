# Making Misuse Hard

The best interface makes incorrect use difficult to express and impossible to express silently, rather than relying on the caller to read the documentation and remember the rules. Documentation is a request that callers be careful; structure is a guarantee that they can't be careless. Wherever you can replace "the docs say don't do X" with "X cannot be written", you remove a whole class of bug for every caller, forever.

## The pit of success

Design so that the easy, obvious way to use the interface is also the correct way. Callers follow the path of least resistance; if that path leads to correct use, they fall into success without trying. If correct use requires effort and the easy path leads to a bug, callers will take the easy path and hit the bug. Two framings of the same goal:

- Make the **right thing easy** and the **wrong thing hard** (or impossible). The default call, the obvious parameter, the natural sequence should all be correct. Misuse should require going out of the way.
- The opposite, the "pit of failure", is an interface where the natural call is subtly wrong: a default that's dangerous, an easy-to-call method that should rarely be used, an order of operations that's tempting but incorrect. Every such trap is a bug you've delegated to your callers.

## Make illegal states unrepresentable

The strongest technique: shape the interface so that invalid calls and invalid combinations simply cannot be expressed. This is the interface-design twin of the data-modelling principle of the same name, applied to calls instead of stored data.

- **Parameters that must agree shouldn't be passed separately.** If a call takes a `type` and a `payload` that must match (a "credit card" type with card details, a "bank" type with account details), accepting them as two independent parameters lets the caller pass a mismatched pair the interface can't refuse at the type level. Model the valid combinations as distinct shapes (a tagged union, distinct methods, distinct types) so a mismatch can't be written.
- **Operations that only make sense in a certain state shouldn't be available in others.** If you can only `confirm` an order that's `pending`, an interface that exposes `confirm` on every order invites the caller to confirm a shipped one and discover the rule via an error. Where the surface allows, model states as types so that `confirm` only exists on the pending shape (this is harder in some surfaces than others, see the surface files, but the goal holds: don't offer operations that the current state forbids).
- **Required-and-mutually-exclusive choices should be one parameter, not several optional ones.** If exactly one of three options must be chosen, three optional booleans permit zero, two, or three to be set, all illegal. One required enum permits only the legal choices. The shape of the parameters should admit only valid configurations.

## Use the type system as a guardrail

In typed surfaces, the type system is your cheapest and strongest enforcement, it checks every caller at compile time, before any code runs, with no effort from them:

- **Precise types over permissive ones.** A parameter typed as a specific enum can't receive a typo'd string; one typed as `string` can receive anything. A function that takes a `PositiveInt` can't be handed a negative; one that takes `number` can. Every time you narrow a type, you delete a category of invalid call.
- **Distinct types for distinct concepts**, even when they share a representation. A `UserId` and an `OrderId` that are both strings underneath should be distinct types at the interface, so a caller can't pass one where the other is expected, a swap the compiler catches instead of a runtime bug. This is especially valuable for same-typed positional parameters (see `designing-for-the-caller.md`).
- **Make the absence of a value explicit in the type** (an optional/nullable type) rather than relying on a sentinel or convention the caller must know. The type then forces the caller to handle the absent case.
- This is the structural version of encoding preconditions (see `contracts.md`): a precondition expressed in the type is one the caller cannot violate, as opposed to one they must remember.

## Where types can't reach, fail early and loudly

Not every rule can be a type (untyped surfaces, dynamic input, runtime-only constraints). For those, enforce at the boundary, immediately, with a clear failure:

- **Validate at the edge.** Check the precondition the moment the call arrives, before doing any work, and reject violations with an error that says exactly what was wrong. A call that's going to fail should fail at the entry point with a clear message, not three layers deep with a cryptic one (this is the design-side of failing fast; see `failure-as-contract.md`).
- **Fail at the earliest possible moment.** The sooner an invalid call is rejected, the closer the error is to the cause and the easier the caller's fix. An invalid input that's accepted and only causes trouble much later is a debugging cost you've handed the caller.
- **Make the error instructive.** "Invalid argument" tells the caller nothing; "startDate must be before endDate, got start=X end=Y" tells them exactly what to fix. The error message is part of the misuse-resistance: it turns a wrong call into a quick correction instead of a hunt.

## Don't let convenience create traps

A specific tension: features added for convenience can create misuse paths.

- **A permissive default that's dangerous.** Defaulting to "delete cascade" or "public visibility" because it's convenient means every caller who doesn't think about it gets the dangerous behaviour. Defaults should be the safe choice, even when the unsafe one is more convenient, the caller who wants the unsafe behaviour can opt in explicitly, which is exactly when they should be thinking about it.
- **An overly flexible interface that accepts many shapes.** Accepting input in five formats "to be helpful" multiplies the ways to be subtly wrong and the cases you must handle. A narrower interface that accepts one clear shape is harder to misuse than a flexible one that accepts anything.
- **Convenience methods that bypass safety.** A shortcut that skips a check the long path enforces becomes the path callers take, complete with the skipped check. If a check matters, it shouldn't be bypassable by taking the convenient route.

## The principle in one line

Prefer "it won't compile / it gets rejected at the door" over "the docs say don't". Each rule you move from documentation into the structure of the interface is a rule that enforces itself on every caller without their cooperation. Documentation scales with how carefully each caller reads; structure scales to all of them automatically.
