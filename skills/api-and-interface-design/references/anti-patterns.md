# Interface Design Anti-Patterns

Each entry is a recurring way interfaces go wrong, why it's tempting, why it bites, and the correction. When you catch yourself doing one, stop and switch.

## Designing outward from the implementation

**The pattern:** The interface mirrors how the code works internally, exposing what was easy to expose, named after internal mechanics, shaped around your steps rather than the caller's intent.
**Why it's tempting:** It's the path of least resistance, you build the thing, then expose what you built, in the shape you built it.
**Why it bites:** The caller is forced to understand your internals to use the interface, and when you change the internals, the interface (and every caller) breaks. You've coupled callers to your implementation through the very thing meant to decouple them.
**Correction:** Design inward from the caller. Write the ideal call first, the one that states intent, and shape the interface to make it possible. Let the implementation adapt behind the boundary. See `designing-for-the-caller.md`.

## Leaky abstraction

**The pattern:** Implementation details show through the contract, returned internal data structures, mechanism in names and parameters, behaviour that depends on internal specifics, errors that expose internals.
**Why it's tempting:** Returning the raw internal object is less work than defining a clean shape; the internal name is right there.
**Why it bites:** Callers couple to the leaked detail, so a change behind the boundary breaks them even though you "didn't change the interface." The abstraction stops abstracting.
**Correction:** Expose the contract, hide the rest. Return intentional shapes, name for intent not mechanism, translate errors into the interface's vocabulary. Test: could you rewrite the implementation without breaking any caller? See `information-hiding.md`.

## The boolean trap

**The pattern:** Opaque boolean parameters at the call site, `create(name, true, false)`, where the booleans' meaning is invisible without the docs.
**Why it's tempting:** A boolean is the quickest way to add an on/off option.
**Why it bites:** The call site is unreadable and the booleans are trivially passed in the wrong order or with the wrong value, with no help from the reader's eye or the compiler. A boolean parameter also often hides that the function does two different things.
**Correction:** Use named arguments, an options object, or an enum that states meaning at the call site (`Visibility.Public`, not `true`). If the boolean selects between two behaviours, consider two functions. See `designing-for-the-caller.md` and `surface-library.md`.

## Inconsistency across the interface

**The pattern:** Similar operations work differently, mixed naming for one concept, varying parameter order, different return shapes, different error reporting.
**Why it's tempting:** Each operation gets designed in isolation, locally optimised, without checking it against its siblings.
**Why it bites:** Callers can't generalise; every call is a fresh lookup and every difference is a special case to memorise. The interface is harder to learn and easier to use wrong, a tax on every use.
**Correction:** Make similar things work similarly, consistent names, order, shapes, and error handling. Prefer the consistent choice over the locally-perfect one. See `consistency.md`.

## The sprawling surface

**The pattern:** A huge public interface, many operations, many exported types, multiple overlapping ways to do the same thing.
**Why it's tempting:** Exposing things "in case someone needs them" feels helpful and costs nothing now.
**Why it bites:** Every public element is a permanent commitment you can't change without breaking callers. A large surface is hard to learn, offers many wrong paths, and calcifies your implementation because so much of it is exposed.
**Correction:** Expose the minimum. Start closed, open deliberately. Prefer one good way over three mediocre ones. It's cheap to add later, expensive to remove. See `information-hiding.md`.

## Permitting illegal combinations

**The pattern:** Accepting as separate parameters things that must agree (a type and a payload that must match), or several optional flags where only certain combinations are valid, so the caller can express states that are meaningless.
**Why it's tempting:** Flat, independent parameters are the straightforward way to accept input.
**Why it bites:** The caller assembles an invalid combination the interface can't refuse structurally, and discovers the rule by hitting a runtime error, if you check at all. The interface invites the bug.
**Correction:** Model valid combinations as shapes that admit only legal states, tagged unions, distinct methods, distinct types, a single required enum instead of several booleans. Make the illegal call unrepresentable. See `misuse-resistance.md`.

## Stringly-typed interfaces

**The pattern:** Passing meaning through unvalidated strings, a `status` string, a `type` string, options encoded in a string, where a precise type was available.
**Why it's tempting:** Strings are universal and require no type definitions; they feel flexible.
**Why it bites:** A string accepts every typo and invalid value, and the compiler can't help. `"acitve"` compiles fine and fails at runtime. The valid set lives only in docs and the caller's memory.
**Correction:** Use precise types, enums for closed sets, distinct types for distinct concepts, so invalid values can't be expressed and the compiler checks every caller. See `misuse-resistance.md`.

## Undocumented or surprising failure modes

**The pattern:** Ways the interface can fail that callers can't anticipate from the contract, silent failure as a normal-looking value, hidden state changes on failure, internals leaking through errors, undocumented exceptions.
**Why it's tempting:** Designing the success path feels like the job; failure gets handled "later", which is never.
**Why it bites:** Callers proceed on false success, or get blindsided by a failure they had no way to know about, in production, where the failure paths run far more than the demo showed.
**Correction:** Design failure as part of the contract, enumerate the failure modes, report them consistently, make failure distinguishable from valid results, don't leak internals. See `failure-as-contract.md`.

## Breaking changes without versioning or deprecation

**The pattern:** Changing the contract in a breaking way, removing a field, renaming an operation, adding a required parameter, and shipping it to existing callers with no version, no warning, no migration path.
**Why it's tempting:** Just changing it is less work than running old and new in parallel.
**Why it bites:** Existing callers break, at the moment they next call, with no warning and no path forward. You've turned your change into their emergency.
**Correction:** Prefer additive changes that don't break. When a break is unavoidable, version so old and new coexist, deprecate with a real migration window and a real alternative, then remove once callers have moved. See `versioning-and-compatibility.md`.

## Over-generalised for callers who don't exist

**The pattern:** Building elaborate flexibility, configuration, and extension points for imagined future requirements and hypothetical callers, before any real caller needs them.
**Why it's tempting:** It feels forward-thinking, and generality looks more sophisticated than a plain interface.
**Why it bites:** You pay the complexity now, in a larger surface to maintain, more ways to misuse, and harder-to-understand calls, for flexibility that often turns out wrong when the real requirement finally arrives and doesn't match what you imagined. The speculative generality is both a cost and frequently a mis-prediction.
**Correction:** Build the small, honest interface today's real callers need, shaped (with extensible response/options objects) so it can grow additively. Meet real future needs when they're real. Design for likely *change*, not for imagined *requirements*. See `versioning-and-compatibility.md`.
