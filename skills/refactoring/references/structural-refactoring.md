# Structural Refactoring: Data and Modules

Structure isn't only the inside of functions. It's also the shape of in-memory data and the boundaries between modules, and reshaping those is higher-stakes than local code changes because far more depends on them. The same discipline applies, behaviour held constant, small verified steps, a safety net, but with extra care proportional to the larger blast radius. This file also marks where refactoring meets its neighbouring concerns: this skill owns the *act* of safely restructuring; the *design* of what the new structure should be belongs to other skills.

## The blast radius principle

The cost and risk of a refactoring scale with how much depends on the thing you're changing:

- **A local change** (extract a variable, rename a private function) touches little, so a mistake is contained and cheap. These you do freely and often.
- **A data-shape change** touches everything that reads or writes that data, often many places across the codebase. A mistake propagates to all of them.
- **A module-boundary change** touches everything that uses the module, potentially including code you don't control (other modules, other teams, external callers). A mistake breaks all of them, and some may be beyond your reach to fix.

The wider the blast radius, the more the change demands parallel-change technique (see `small-steps.md`), a solid net, and deliberate planning, rather than a quick freehand edit. Match the care to the radius: local changes are cheap and forgiving; structural changes are neither.

## Refactoring the shape of in-memory data

Reshaping a data structure, splitting one into two, merging two into one, changing a field's type or representation, restructuring a nested shape, is among the higher-radius refactorings because data is read and written from many places.

- **This skill owns the safe-change mechanics; state-management owns the target shape.** *How* to reshape the data without breaking behaviour is refactoring (below). *What* the data should look like, whether something is real state or derived, whether a shape admits illegal combinations, where state should live, is the state-management skill's domain. When a data refactor is really "this state is badly structured," consult state-management for the destination and use this skill's discipline to get there safely.
- **Use parallel change for anything widely used.** Don't change the shape and all its users in one big step. Introduce the new shape alongside the old, migrate readers and writers to it a few at a time (each a small verified step), then remove the old shape once nothing uses it. Throughout, the code works because both shapes coexist during migration.
- **The behaviour-preservation care is in the read/write sites.** Every place that read the old shape must read the new one equivalently; every write must produce the same effective state. The net (tests over the behaviour that depends on this data) is what catches a site you reshaped wrong. Reshaping data without tests over the behaviour it drives is especially dangerous, because the effects surface far from the change (the data-and-state debugging difficulty).

## Refactoring module boundaries

Changing what a module contains, splitting an overloaded module, merging fragments, moving a responsibility from one module to another, reshaping what a module exposes, is high-radius because modules are used by other code, and the boundary is a contract.

- **This skill owns the safe-change mechanics; interface design owns the target boundary.** *How* to move a boundary without breaking callers is refactoring (below). *What* makes a good boundary, what to expose vs hide, how to keep a public surface small and consistent, how to design the contract, is the interface-design skill's domain. When a module refactor is really "this boundary is wrong," consult interface design for the destination and use this skill's discipline to get there.
- **The critical distinction: internal boundary vs public interface.** Moving a boundary that's entirely internal (all callers are code you control) is a refactor: you change the boundary and update all callers in the same body of work, verifying as you go, and behaviour is preserved end to end. Moving a boundary that's *public* (callers you don't control, other teams, external consumers) is **not a pure refactor**, because you can't update all the callers. Changing a public interface is a breaking change, and it's governed by versioning, deprecation, and backward-compatibility (interface design's domain), not by refactoring alone. Know which one you're doing: the same transformation is a safe refactor internally and a breaking change at a public boundary.
- **Use parallel change, and finish it.** Module restructuring is prone to the half-done state (see `small-steps.md`), the new module exists, some callers moved, the old lingers, and now there are two ways things are organised. Plan to complete the migration and remove the old structure. A half-migrated module split is worse than the overloaded module you started with.

## Where refactoring stops and a different skill begins

The capstone position of this skill means it touches several others at its edges. The boundaries, stated cleanly:

- **Persisted data is not this skill.** Reshaping a database schema is data-modelling's evolution (expand/migrate/contract over stored data, backfills, mixed-shape records), a related discipline with the same shape but different hazards (you can't update all the existing *data* in one step, and old records persist). When a refactor reaches the database, it's left refactoring and entered schema evolution. The in-memory shape is this skill (with state-management for the target); the stored shape is data-modelling.
- **Changing behaviour is not this skill.** The moment a structural change also changes what the code does, it's no longer refactoring (the cardinal rule), it's development, done as a separate step. Refactoring makes the change easy; the change itself is its own work.
- **A public interface change is not a pure refactor.** As above, it's a breaking change under interface design's versioning rules. Refactoring can freely move internal boundaries; public ones need the compatibility discipline.

## The throughline

Structural refactoring is the same discipline as local refactoring, scaled up: behaviour held, small verified steps, a net, with parallel change as the technique for landing a wide change as a sequence of working steps, and with care proportional to the blast radius. What changes at scale is the stakes (more depends on it), the need to finish (half-done structural changes are their own mess), and the boundaries with neighbouring skills (state-management for the data's target shape, interface design for the module's target boundary and for public-interface changes, data-modelling for anything persisted). This skill carries the safe-change mechanics across all of them; it defers the design of the destination to the skill that owns it.
