# When to Refactor

Refactoring is a means to an end, never the end itself. It changes structure to make code easier to understand or change, or to remove a structure that's causing bugs. Done for those reasons, at the right moment, it's one of the highest-value things you can do to a codebase. Done aimlessly, because the code offends you or because "cleaner" feels virtuous, it burns time, adds risk to working code, and is itself a failure mode. Knowing when to refactor is as much of the skill as knowing how.

## The two good reasons

Almost all justified refactoring traces to one of two motives:

- **To make code easier to understand or change, when you need to.** You're about to work in some code, and its current shape is in your way: you can't follow it, or the change you need to make is awkward because of how it's structured. Refactoring to clear that path is direct, valuable work, you're paying down the obstacle that's between you and your actual task. The refactor earns its place by making the next thing easier.
- **To remove a structure that's actively causing bugs.** Some structures generate bugs repeatedly: duplication where copies drift, tangled logic where every change breaks something, a shape that lets illegal states exist. Refactoring these isn't cosmetic; it removes the soil the bugs grow in. The refactor earns its place by killing a recurring problem.

If a proposed refactor serves neither, no one needs to understand or change this code right now, and it isn't causing bugs, it's hard to justify. Working code that's out of your way and not generating problems can be left alone, even if its structure isn't to your taste.

## Opportunistic vs planned refactoring

Refactoring happens at two scales, and both are legitimate:

- **Opportunistic ("leave it better than you found it"):** as you work in code for some other reason, you make small structural improvements to the parts you're touching, a clearer name here, an extracted function there. This is the everyday form, woven into normal work, low-risk because it's small and local, and it's how a codebase stays healthy without ever needing a big cleanup project. The discipline: improve what you're already in, in service of the work, not a detour into unrelated cleanup.
- **Planned (a deliberate refactoring task):** sometimes a structure is enough of an obstacle that it's worth a dedicated effort, separate from feature work, to restructure it. This is higher-risk and needs more care (a real safety net, small steps, a plan to land it, see `small-steps.md`), and it should be justified by a real obstacle, an upcoming body of work the current structure would make painful, or a structure that's a persistent bug source, not by a general wish for tidiness.

The common healthy pattern is mostly opportunistic refactoring with occasional planned efforts for genuine structural problems. A codebase that needs constant large planned refactors is one where opportunistic improvement isn't happening.

## Refactor before, or after, but separate from, the change

When you need to both restructure and change behaviour, the refactor is a separate step from the behaviour change (the cardinal rule), and it can sit on either side:

- **Refactor first ("make the change easy, then make the easy change"):** when the current structure makes your intended behaviour change hard, refactor to make the change easy, *then* make it. This is often the cleaner order, you reshape the code so the feature or fix drops in naturally, rather than forcing the change into an awkward structure.
- **Refactor after:** sometimes you make the change first (perhaps under time pressure) and clean up afterward, once you understand the shape the code wants to take. Also fine, as long as the cleanup is its own step and actually happens.

Either order works. What's not allowed is doing them in the same step (see the cardinal rule and `anti-patterns.md`).

## When not to refactor

Restraint is part of the skill. Don't refactor when:

- **The code works, isn't in your way, and isn't causing bugs.** Aesthetic dissatisfaction is not a reason to risk changing working code. "I'd have written it differently" is not "it needs changing." Leave it.
- **You don't have a safety net and can't cheaply get one, and the risk outweighs the benefit.** Refactoring untested critical code with no way to verify behaviour is dangerous; sometimes the right call is to leave it until you can establish a net (see `safety-net.md`), rather than restructure blind.
- **You're about to throw the code away.** Don't polish what's being deleted or replaced soon.
- **It's a rewrite, not a refactor.** When "refactoring" turns into rebuilding the thing from scratch, that's a different, much riskier undertaking with its own justification needed, not the incremental, behaviour-preserving discipline this skill describes. Be honest about which one you're doing; calling a rewrite a refactor hides its risk.
- **The deadline is now and the refactor isn't required to ship.** Refactoring is investment; sometimes the investment has to wait. The danger is *never* paying it back, so a deferred refactor should be a real intention, not a permanent excuse, but "not right now" is a legitimate answer.

## The gold-plating trap

The specific failure this section guards against: refactoring as procrastination or perfectionism, endlessly polishing structure that's already good enough, chasing an ideal of cleanliness past the point where it helps anyone. Every refactor has a cost (time, and risk to working code) and should have a benefit (easier to understand, easier to change, fewer bugs). When the benefit has run out, more abstractions, more indirection, more "cleanup" of code that was already fine, stop. The goal is code that's easy to work with, not code that's maximally pure. Past "easy to work with," additional refactoring is subtracting value, not adding it. Recognise when the code is good enough and move on.
