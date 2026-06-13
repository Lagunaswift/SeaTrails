# Versioning and Compatibility

An interface with callers is expensive to change, because the change has to be coordinated with people and code you may not control. The way to make change survivable is to design for it before the first caller arrives, so that most changes are safe and the rare breaking ones are managed deliberately. Retrofitting compatibility onto an interface that was never designed for it is one of the most painful tasks in software; a little forethought avoids it.

## What counts as a breaking change

A change is breaking if it can make existing correct callers stop working. Knowing exactly where this line sits is the foundation of everything else, because it tells you which changes are free and which need ceremony.

**Breaking** (can break existing callers):

- Removing or renaming anything public (an operation, a parameter, a field, an error code).
- Adding a new *required* input. Existing callers don't supply it and now fail.
- Changing the type or meaning of an existing input or output. Callers built on the old type/meaning break.
- Tightening what you accept (a value that used to be valid now rejected). Callers sending it break.
- Weakening what you guarantee (removing a promise callers relied on, changing behaviour they depended on).
- Changing how failure is reported (a new status for an old condition, a different error shape).

**Non-breaking** (safe, additive):

- Adding a new operation, endpoint, or optional element that existing callers can ignore.
- Adding a new *optional* input with a default that preserves old behaviour.
- Adding a new field to a response (if callers are tolerant readers, see below).
- Loosening what you accept (now accepting inputs you used to reject). Old callers sent a subset; they still work.
- Strengthening a guarantee in a way callers can't have depended on its absence.

The asymmetry mirrors data-model evolution: **additive is safe, subtractive and mutating are breaking.** Design changes to be additive whenever you possibly can, and you avoid the versioning problem entirely for those changes.

## Additive-first evolution

Most needs can be met without breaking anything if you reach for addition before modification:

- Need a new capability? **Add** a new operation/parameter/field rather than changing an existing one. The old callers keep working; new callers use the new thing.
- Need to change behaviour? Often you can add a new way alongside the old, default to the old behaviour, and let callers opt into the new, rather than changing the existing behaviour under everyone.
- Need to replace something? **Add** the replacement, **deprecate** the old (see below), and remove it only much later, rather than swapping it out immediately. This is the expand/migrate/contract pattern from data-model evolution, applied to interfaces: introduce the new, migrate callers over time, retire the old once nobody uses it.

The discipline is to treat breaking change as a last resort, reached only when addition genuinely can't express the need, not as the default way to make changes.

## Tolerant reading makes evolution easier

How callers *consume* an interface determines how freely it can grow. Callers who read tolerantly survive additive change; callers who read strictly break on it:

- A caller that ignores fields it doesn't recognise keeps working when you add new ones. A caller that rejects any unexpected field breaks the moment you add one, turning a safe additive change into a breaking one *for that caller*.
- Designing your own interface, encourage tolerant reading (and document that new fields may be added). Consuming someone else's, read tolerantly yourself so their additive changes don't break you.
- The general principle (be conservative in what you send, liberal in what you accept) means: emit exactly the documented shape, but tolerate extra and unknown content when receiving, so the other side can evolve.

## When you must break: version deliberately

Sometimes a breaking change is genuinely necessary. Then the goal is to not break existing callers *yet*, by running old and new in parallel:

- **Versioning** lets old and new contracts coexist so callers migrate on their own schedule instead of all at once. The mechanism depends on the surface (a version in the URL or header for HTTP, a new major version of a library, a new parallel function), covered in the surface files. The principle is the same: the old version keeps working while the new one is available, and callers move when ready.
- **Version the contract, not every change.** Additive changes don't need a new version (that's the point of additive). Reserve new versions for genuine breaks. A new version per release is churn that forces needless migration; a new version per breaking change is meaningful.
- **Semantic versioning** communicates this to library callers: major for breaking, minor for additive, patch for fixes. The number tells the caller whether updating is safe. Honour it, a breaking change in a minor bump betrays the caller's trust that minor is safe.

## Deprecation: the graceful path to removal

Removing something callers use is breaking; deprecation is how you get to removal without a sudden break:

- **Mark the old thing deprecated** while keeping it working, signalling that it will go away and pointing to the replacement. Callers get warning and a migration path instead of a surprise breakage.
- **Give real migration time and a real alternative.** Deprecating something with no replacement, or removing it immediately after deprecating, defeats the purpose. The deprecation period is for callers to migrate; it has to be long enough that they can.
- **Communicate it** where callers will see it: a compiler deprecation warning, a response header, release notes, documentation. A deprecation nobody notices is a removal in disguise.
- **Then remove**, once usage has genuinely dropped and the deprecation period has passed. This is the contract step of expand/migrate/contract: the old is gone only after callers have moved off it.

## Design the first version to need fewer breaks

The cheapest breaking change is the one you never have to make, and good initial design avoids many:

- **Keep the initial surface small** (see `information-hiding.md`). Fewer public elements means fewer things to later regret and break. You can always add; you can't easily remove.
- **Don't over-promise** (see `contracts.md`). Every guarantee you make is one you can't change without breaking. Promise what callers need, stay quiet on the rest, and you keep room to evolve without breaking.
- **Use extensible shapes** where you can foresee growth: a response object you can add fields to rather than a bare value, an options object you can add options to rather than a fixed positional list. These let future additions be additive instead of breaking.
- **Resist building for imagined future callers** (see `anti-patterns.md`). The tension: design for *change* (likely), not for *imagined requirements* (speculative). Extensible shapes are cheap insurance against change; elaborate generality for callers who don't exist is complexity you pay for now and a larger surface to maintain. Build the small honest interface today's callers need, shaped so it can grow, and let real future needs be met additively when they're real.
