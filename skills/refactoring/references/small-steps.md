# Small Steps

Refactor in the smallest steps that keep the code working, verifying after each one, rather than performing a large restructuring you can't check until the end. This is the discipline that makes refactoring tractable and breaks attributable: when each step is small and verified, a break is always caused by the step you just made, and undoing it is trivial. The alternative, a big-bang restructuring, turns any mistake into a debugging hunt layered on top of an unfinished refactor.

## Why small and verified beats big and bold

The case for small steps is entirely about where a break leaves you:

- **Attribution.** After a small verified step, if behaviour broke, the cause is that one step, because everything before it was verified green. You don't search; you know. After a big restructuring that's broken somewhere, you've converted a refactor into a debugging problem: something in a large diff changed behaviour, and now you must find it (the binary-search-the-failure problem, which small steps avoid entirely by never accumulating an unverified change).
- **Reversibility.** A small step that goes wrong is undone by reverting one small change back to working code. A big-bang that goes wrong leaves you choosing between debugging a large broken diff or throwing away a lot of work. Small steps mean you're never far from a working state.
- **Continuous working code.** With small steps, the code works after every step, so you can stop at any point and what you have is functional. A big-bang leaves the code broken throughout the middle, so an interruption (a priority change, the end of the day) strands you with non-working code (see "landing it" below).

The instinct that big steps are faster is usually wrong: small steps feel slower per step but are faster to a *correct* result, because they never incur the debugging cost that a broken big-bang does. The speed of refactoring is dominated by the time spent finding what broke, and small steps drive that toward zero.

## What "small" means

A step is small enough when you can state exactly what it changed and verify it quickly. Concretely:

- **One transformation at a time.** Extract this one function. Rename this one thing. Move this one piece. Not "extract three functions, rename five things, and move a module" as one step. Each named refactoring (see `common-refactorings.md`) is typically one step or a short sequence of even smaller ones.
- **Each step keeps the code working.** After the step, the code compiles, runs, and passes the tests. You don't take a step that leaves the code broken "to be fixed by the next step", each step lands at a working state. (Some refactorings have an intermediate moment where both old and new exist; that's fine as long as the code still works at the step boundary, see the parallel-change note below.)
- **Verify after each.** Run the tests (or the relevant subset) after every step. The loop is: one transformation, verify green, repeat. Green after every step is what makes the next step safe to take.

## The refactoring loop

The core rhythm, once a safety net exists (see `safety-net.md`):

1. Pick the next small transformation.
2. Apply it (by tool where possible, see `common-refactorings.md`).
3. Run the tests.
4. Green: the step preserved behaviour. Commit (see below). Go to 1.
5. Red: the step broke something. Undo it (it's small, so this is cheap), and either retry it more carefully or in even smaller pieces.

This loop never lets an unverified change accumulate. At every commit you have working code, and the distance back to working code is never more than one small step.

## Commit at every green state

Commit (or otherwise checkpoint) each time the tests are green after a step. This makes version control part of the safety net (see `safety-net.md`):

- Each green commit is a known-good state you can return to. If a later step goes wrong in a way you didn't catch immediately, you can revert to the last green commit and lose only the steps since.
- A series of small green commits is also a readable history of the refactor, each commit a single comprehensible transformation, which is far easier to review and to bisect (if a behaviour change is later discovered) than one enormous commit.
- These refactoring commits should contain *only* refactoring, no behaviour changes mixed in (the cardinal rule, and see `anti-patterns.md`), so that the history cleanly separates "this changed structure" from "this changed behaviour."

## Parallel change: keeping code working through a bigger restructure

Some refactorings can't be done in a single small step that keeps everything working, you need to change a thing and all its users, which is too big for one step. The technique is parallel change (also called expand/contract, the same shape as data-model evolution and interface versioning): introduce the new structure alongside the old, migrate users to the new one a few at a time (each migration a small verified step), then remove the old once nothing uses it.

- **Expand:** add the new function/structure/name beside the old. Both exist; code still works.
- **Migrate:** move callers from old to new, a few per step, verifying each time. Throughout, the code works because both old and new are present.
- **Contract:** once nothing uses the old one, remove it. One final verified step.

This keeps a large structural change as a sequence of small working steps instead of one big broken-in-the-middle change. It's the general technique for any refactor too big to do atomically (renaming something used everywhere, changing a widely-used data shape, splitting a heavily-used module).

## Landing it: don't leave refactors half-done

A risk specific to larger refactors: starting an ambitious restructuring and not finishing, leaving the codebase in a half-migrated state with both the old and new structure present and neither fully adopted. This is worse than not having started, now there are two ways things are done, and everyone has to understand both. The disciplines that prevent it:

- **Prefer refactors you can land in small complete steps**, each of which leaves the code in a coherent working state, so partial completion still leaves something whole rather than a half-migration.
- **If using parallel change, finish the contract step.** The migration isn't done until the old structure is gone. A parallel change abandoned after expand-and-partial-migrate is the half-done state. Plan to complete it, and treat the leftover old structure as a debt to clear, not a permanent fixture.
- **Scope planned refactors to what you can actually finish.** A refactor too big to land in the time available should be broken into independently-completable pieces, each one shippable on its own, rather than one large effort that's all-or-nothing and likely to be left incomplete.

The principle throughout: the code is in a working, coherent state after every step, you're never more than one small step from green, and the refactor is either finished or left at a clean stopping point, never stranded half-applied.
