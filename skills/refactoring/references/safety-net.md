# The Safety Net

Refactoring's promise is that behaviour stays identical while structure changes. That promise is only worth anything if you can *verify* it, and "I read it carefully and it looks equivalent" is not verification, it's hope. The safety net is whatever lets you confirm, after each change, that behaviour was preserved. Without one, you are not refactoring; you are restructuring blind and shipping whatever behaviour change you accidentally introduced. Establishing the net comes before touching the code.

## Why "it looks the same" isn't enough

Human reading misses behaviour changes constantly, especially the edge cases that the happy-path reading skips: the empty input, the boundary value, the error path, the subtle ordering, the off-by-one. A refactor that looks behaviour-preserving can change what happens when the list is empty, when the value is null, when two things race. The whole point of refactoring is that it's *safe*, and safe means *verified*, not *believed*. The net is what converts "I think this is equivalent" into "this is equivalent, and here's how I know."

## Tests are the usual net

The standard safety net is a set of tests that exercise the code you're about to restructure and assert its current behaviour. With them, the refactoring loop becomes safe and tight: make a small change, run the tests, green means behaviour held, red means you broke something and you know it was the change you just made (see `small-steps.md`). The tests turn each step into a verified step.

- **The tests must actually cover the behaviour you're changing the structure of.** Tests that pass regardless of whether your refactor is correct provide no net for that refactor. Before relying on the net, confirm it would *catch* a behaviour change, ideally by checking the tests exercise the paths you're touching, including the edge cases.
- **Run them after every step**, not just at the end. A net you only check at the end tells you that *something* in a large change broke behaviour, not *which* part, which is the big-bang problem (see `small-steps.md`). Frequent runs keep each break attributable.
- **Fast tests make the loop work.** If the tests take too long to run after every small step, you'll stop running them, and the net stops protecting you. Refactoring rewards a fast-running test suite; slow suites push people toward big risky steps.

## When there are no tests: characterisation tests

The hardest and most common real situation: you need to refactor code that has no tests, often precisely the messy, important, legacy code most in need of refactoring. The chicken-and-egg is real, you want to refactor it to make it testable, but you want tests to refactor it safely. The way through is **characterisation tests** (also called pinning tests): tests that capture what the code *currently does*, including any bugs, before you change anything.

- A characterisation test doesn't assert what the code *should* do; it asserts what it *currently* does. You run the code with various inputs, observe the outputs, and write tests that pin those observed outputs in place. Now you have a net that will fire if your refactoring changes any of that behaviour.
- This deliberately pins existing bugs too. That's correct: refactoring preserves behaviour, including buggy behaviour. If the code currently returns the wrong thing for some input, the characterisation test pins the wrong thing, so your refactor is verified to not change it. Fixing the bug is a separate behavioural change, done as its own step after the refactor (the cardinal rule again).
- Write characterisation tests by probing the code's actual behaviour across a range of inputs, especially edge cases, until you've pinned enough of its behaviour to refactor with confidence. You don't need to pin everything, just the behaviour your refactor might affect.

## Refactoring genuinely untestable code

Sometimes code is so tangled that you can't even get it under a characterisation test without changing it first (it has no seams, everything is entangled with I/O or global state). Then you're in the legacy-code bind, and the move is to make the *smallest, safest possible* structural change, by hand, with maximum care, to introduce a seam where you can get a test in, then test, then refactor properly:

- The initial seam-introducing change is the riskiest, because it's unverified. Keep it as small and as mechanically safe as possible (a pure extraction or move that a tool can do, see `common-refactorings.md`), exactly the kind of change least likely to alter behaviour.
- Once a seam exists and a test is in, you're back to the normal safe loop. The dangerous part is just the bootstrap.
- This is slow and careful work, and it's the honest answer to "how do I refactor scary untested code": you don't do it freehand and hope; you carefully create the conditions for a net, then proceed safely.

## Types and tooling as a partial net

Other things contribute to the net, though usually not as a full substitute for tests:

- **A type system** catches a real class of refactoring errors for free: a rename that misses a reference, a moved function called with the wrong arguments, a changed shape used incorrectly. In a strongly-typed codebase, the compiler is a meaningful part of the net, it will refuse to build if many kinds of refactoring mistake occur. It doesn't catch behavioural changes within type-correct code, so it complements tests rather than replacing them.
- **Refactoring tools** (an IDE's automated rename, extract, move) are safer than manual editing because they perform the transformation mechanically across all references, removing the human-error step. Where a tool can do the refactoring, prefer it to hand-editing (see `common-refactorings.md`). The tool is part of the net: a tool-performed rename can't miss a reference the way a manual one can.
- **Version control** is the net under the net: committing at every green state (see `small-steps.md`) means any step that goes wrong can be reverted to the last known-good state. It doesn't verify behaviour, but it guarantees you can always get back to working code.

## The rule

Establish how you'll verify behaviour preservation *before* you start changing structure. If that's existing tests, confirm they cover what you're touching. If there are none, write characterisation tests first. If the code can't be tested without a change, make the smallest safe seam by hand, then test. The one thing you don't do is refactor important code with no net and trust that it looks the same, because looking the same is exactly the judgement that's unreliable, and it's the judgement the whole discipline exists to replace with verification.
