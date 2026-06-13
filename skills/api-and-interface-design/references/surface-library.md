# Surface: Libraries, Functions, and Modules

The shared principles translate onto code interfaces, function and method signatures, classes, and module boundaries, with the language's own idioms and the compiler as an enforcement tool the HTTP surface doesn't have. This is the code translation of the principle files.

## The signature is the contract

A function's signature (its name, parameters, and return type) is the most-read part of its contract and often the only part callers look at. Make it carry as much of the contract as it can:

- **The name states intent** in the caller's vocabulary (see `designing-for-the-caller.md`): what it does, not how. `getActiveUsers`, not `queryUsersWhereStatusEquals`.
- **The parameter types state the preconditions** they can (see `misuse-resistance.md`): precise types that can't hold invalid values turn "the docs say pass a positive number" into "you can't pass a non-positive number."
- **The return type states the postcondition's shape**, including failure: a type that represents "might be absent" (optional) or "might have failed" (a Result type) forces the caller to handle those cases, where a bare return type lets them forget.

A signature that fully expresses the contract needs little prose; one that hides the contract behind permissive types (`any`, `string` for everything, no failure in the type) pushes the contract into documentation the caller may not read.

## Parameter design in code

Code surfaces make the parameter traps from `designing-for-the-caller.md` concrete:

- **Group parameters into an object once there are more than a few**, especially optional ones. A function taking a single options object (with named, defaulted fields) reads clearly at the call site, lets callers omit what they don't need, and, critically, lets you **add new optional fields without breaking existing callers** (an additive change, see `versioning-and-compatibility.md`). A long positional parameter list does none of these and breaks every caller when it grows.
- **Named arguments or an options object kill the boolean trap.** `render(doc, { interactive: true })` reads; `render(doc, true)` doesn't. Where the language lacks named arguments, an enum or options object recovers the readability.
- **Distinct types for distinct concepts** (a `UserId` type, not a bare string) make swapped-argument bugs into compile errors (see `misuse-resistance.md`). The compiler checks every caller for free.
- **Order positional parameters by importance and stability**, essential first, so that the rare positional addition disturbs the fewest callers, though an options object sidesteps this concern.

## The public/private split is the surface

In code, the interface is exactly what you make public; everything else is implementation you can change freely (see `information-hiding.md`). The language's visibility tools (export/not, public/private, module boundaries) are how you draw the contract:

- **Export the minimum.** Every exported function, type, and field is a commitment (see `versioning-and-compatibility.md`); every non-exported one is yours to change. Default to not exporting; export deliberately when a caller needs it. Internal helpers, intermediate types, and implementation classes stay private.
- **A module's exports are its contract.** The set of things a module exposes is what other modules couple to. Keep it small and intentional, a module that exports everything has no encapsulation and every internal change risks a caller.
- **Don't export mutable internal state.** Expose operations, not the raw data structure (see `information-hiding.md`), so callers can't violate invariants or couple to the representation.

## Return values over out-parameters and side effects

- **Return the result; don't mutate the caller's arguments** to communicate output, which is surprising and easy to miss. A function that silently modifies an object passed to it has a hidden effect (see `failure-as-contract.md` and `contracts.md` on documenting effects). Prefer returning new values to mutating inputs.
- **Prefer pure functions where the work allows**, same input gives same output, no hidden effects. They're trivially predictable, testable, and safe to call, the easiest possible contract. Reserve effects and mutation for where they're the actual point, and make them visible in the name and contract when present.
- **Return a value that represents failure** rather than relying on the caller to know an exception can be thrown (see the language files in the error-handling skill for the exception-vs-Result trade per language). The return type is where failure should be visible.

## Designing a class's methods

A class is an interface to the behaviour it encapsulates; its public methods are the contract:

- **Methods should keep the object's invariants.** Callers act through methods precisely so the object stays valid; if a method can leave the object in an inconsistent state, the contract is broken. This is misuse-resistance at the object level, don't offer a method that lets the caller break the object.
- **Don't expose operations that don't make sense in the current state** (see `misuse-resistance.md`). Where the language allows, model states as types so state-invalid operations aren't even available; where it doesn't, at least reject them clearly.
- **Construction should yield a valid object.** A constructor (or factory) that returns a half-initialised object the caller must then finish configuring before it's usable is a precondition trap. Prefer construction that produces a ready, valid object, so there's no invalid intermediate state for the caller to mishandle.

## Versioning a library

Breaking changes in code surfaces are governed by **semantic versioning** (see `versioning-and-compatibility.md`): major version for breaking changes, minor for additive, patch for fixes, so callers know from the version number whether updating is safe. Honour it strictly, callers trust that a minor or patch update won't break them, and a breaking change smuggled into one betrays that trust and burns them at the worst time. Use the language's **deprecation mechanism** (a deprecation annotation/warning) to mark things for removal while keeping them working, giving callers compile-time warning and a migration window before you remove in a later major version.
