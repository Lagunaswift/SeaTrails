---
name: refactoring
description: "Use this skill whenever changing the structure of existing code without changing what it does: renaming, extracting functions or modules, removing duplication, simplifying tangled logic, reshaping data structures, splitting or merging units, or cleaning up code so it's easier to work with. Trigger on phrases like 'refactor this', 'clean this up', 'this is messy', 'simplify this', 'extract a function', 'rename', 'reduce duplication', 'this is hard to follow', 'restructure', 'tidy up', 'this code smells', 'make this more readable', or when about to change code's shape while keeping its behaviour. Also trigger proactively when working in code that's hard to change and a cleanup would make the real task easier. Covers what to refactor (code smells), how to do it safely (behaviour preservation, small steps, a safety net), and when not to. Does NOT cover changing behaviour or adding features (ordinary development), debugging a failure (use debugging-methodology), or evolving a database schema (use data-modelling)."
---

# Refactoring

A method for changing the structure of existing code without changing what it does, safely, so the code becomes easier to understand and change while continuing to behave exactly as before. Refactoring covers all of code's shape: names, functions, modules, the arrangement of logic, the shape of in-memory data. The unifying constraint is what separates refactoring from ordinary code change: **behaviour is held constant while structure changes.**

## The defining discipline

Refactoring is not "changing code." It is changing code's *structure* while its *behaviour* stays identical. That single constraint is the whole discipline, and the two failure modes this skill exists to prevent both come from breaking it:

1. **Mixing structural change with behavioural change in one step.** You refactor and fix a bug, or refactor and add a feature, at the same time. When something breaks, you can't tell whether your restructuring broke it or your behaviour change did, because you changed both. The investigation that should have been trivial ("the refactor was supposed to change nothing, so what I touched is the cause") becomes a tangle.
2. **Refactoring with no way to know behaviour held.** You restructure code with no test, no check, no verification that it still does the same thing, and you ship a silent behaviour change you never intended. Refactoring without a safety net isn't refactoring, it's rewriting and hoping.

Keep behaviour and structure changes strictly separate, and refactor only with a way to confirm behaviour was preserved, and refactoring is safe. Violate either and it's a source of bugs wearing the costume of cleanup.

## The cardinal rule

**Never change structure and behaviour in the same step.** Each change is one or the other, never both. When you want to do both (clean up the code *and* fix a bug *and* add a feature, which is common and legitimate), do them as a sequence of separate steps: refactor first while behaviour stays frozen, verify, then change behaviour as its own step, verify again. The order can vary (sometimes you tidy before, sometimes after), but the steps never merge. This rule is what makes every other part of the discipline work: it's what lets the safety net mean something (a refactor that should change nothing either keeps the tests green or reveals exactly that you broke something), and it's what keeps a break attributable to its cause.

## The method

### 1. Know why you're refactoring

Refactoring is a means, not an end. Refactor to make code easier to understand, or to make a change you're about to make easier, or to remove a structure that's actively causing bugs, not because the code offends you or because cleaner is abstractly better. Aimless refactoring (gold-plating code that works and isn't in your way) burns time, adds risk, and is itself a failure mode. The two good reasons are "I need to understand or change this and its current shape is in the way" and "this structure is generating bugs." `references/when-to-refactor.md` covers the legitimate triggers, the opportunistic-vs-planned distinction, and when *not* to refactor.

### 2. Recognise what needs refactoring

Code communicates its problems through recognisable signs, the symptoms that structure has gone wrong: duplication, things that are too big, names that mislead, logic that's tangled, changes that ripple further than they should. These signs point to what to fix and often to the specific refactoring that fixes it. Recognising them is how you find what to refactor rather than guessing. `references/code-smells.md` catalogues the common signs, what each indicates, and the refactoring each typically calls for.

### 3. Establish the safety net first

Before changing anything, ensure you have a way to confirm behaviour is preserved. Usually that's tests that exercise the code you're about to restructure; if they don't exist, the first step is often to add them (characterisation tests that capture what the code *currently* does, before you touch it). Without a net, you cannot know your refactor preserved behaviour, and "I read it carefully and it looks the same" is not knowing. `references/safety-net.md` covers what counts as a net, characterisation tests for untested code, refactoring legacy code with no tests, and the role of types and tooling.

### 4. Change in small, reversible steps

Refactor in the smallest steps that keep the code working, verifying after each, rather than a single large restructuring you can't check until the end. Small steps mean that if a step breaks behaviour, you know exactly which step did it and can undo just that one. A big-bang refactor that's broken somewhere is a debugging problem on top of a refactor; a sequence of verified small steps never accumulates an untraceable break. `references/small-steps.md` covers step size, verifying continuously, keeping the code working throughout, and committing at green states.

### 5. Apply the right transformation

Most refactorings are known, named transformations with a safe mechanical procedure: extract a function, rename, inline, move, replace a conditional with a clearer structure, introduce a parameter object. Knowing the common ones, and the careful step-by-step way to perform each so behaviour is preserved, turns refactoring from risky freehand editing into applying a known-safe move. `references/common-refactorings.md` covers the most useful transformations and how to perform each safely.

### 6. Refactoring data and modules, not just functions

Structure includes the shape of in-memory data and the boundaries between modules, and reshaping those is higher-stakes than local code changes because more depends on them. The same discipline applies (behaviour held, small steps, a net), with extra care because the blast radius is larger. This connects to neighbouring concerns: reshaping in-memory state structure overlaps state-management, reshaping a module's public interface overlaps interface design, and reshaping persisted data is a different skill entirely (data-modelling's evolution). `references/structural-refactoring.md` covers data-shape and module-boundary refactoring, the larger blast radius, and where these touch the persisted-data and interface boundaries.

## Anti-patterns

The recurring ways refactoring goes wrong, each with its correction, in `references/anti-patterns.md`:

- Changing behaviour while "just refactoring" (the cardinal violation)
- Refactoring with no safety net, trusting that it looks equivalent
- Big-bang refactoring with no verification until the end
- Refactoring code that didn't need it (gold-plating, aimless cleanup)
- Refactoring in the same commit as a feature or bug fix (untraceable breaks)
- Over-abstracting in the name of removing duplication (wrong-abstraction)
- Renaming or moving without updating all references
- Refactoring without understanding what the code currently does
- Starting a large refactor with no plan to land it (leaving it half-done)
- Chasing purity past the point of usefulness

## Reference index

- `references/when-to-refactor.md`: legitimate triggers, opportunistic vs planned, when not to
- `references/code-smells.md`: the signs that structure has gone wrong, and what each calls for
- `references/safety-net.md`: tests as the net, characterisation tests, legacy code, types and tooling
- `references/small-steps.md`: step size, continuous verification, keeping code working, green commits
- `references/common-refactorings.md`: the named transformations and how to perform each safely
- `references/structural-refactoring.md`: data-shape and module refactoring, blast radius, the boundaries
- `references/anti-patterns.md`: the failure modes above, each with its correction
