# Characterisation Tests and Legacy Code

The code that most needs tests usually has none, and you need a net before you can safely change it. This is the same bind the refactoring skill describes from the other side: you want tests to refactor safely, but the code is hard to test until you refactor it. The way through is to capture what the code *currently does* before changing anything, giving you a regression net even without a specification of what it *should* do.

## Characterisation tests: pin current behaviour

A characterisation test (also called a pinning or golden-master test) asserts what the code *currently does*, not what it should do. You run the code across a range of inputs, observe the actual outputs, and write tests that lock those observed outputs in place. Now any change that alters behaviour fails a test, which is exactly the net you need to refactor or remediate safely.

- **It pins bugs too, deliberately.** If the code currently returns the wrong answer for some input, the characterisation test pins the wrong answer. That's correct: the net's job is to detect *change*, and refactoring must preserve behaviour including buggy behaviour. Fixing the bug is a separate behavioural change, made as its own step after the structure is safe (the refactoring skill's cardinal rule). Trying to "fix as you pin" reintroduces the mix-structure-and-behaviour problem.
- **You don't pin everything, you pin what your change might affect.** Enough behaviour around the area you're going to touch that a regression there would be caught. Exhaustively pinning a huge module you're changing one corner of is wasted effort; pin the corner and its surroundings.
- **Write them by probing actual behaviour.** Feed representative inputs, especially edge cases (empty, boundary, null, the unusual shapes from `what-to-test.md`), capture what comes out, assert it. Where the output is large or complex, a golden-master approach (snapshot the whole output, assert it doesn't change) can pin a lot of behaviour quickly, with the caveat that an over-broad snapshot can be brittle and hard to read when it fails.

## Getting untestable code under test: seams

Some code can't be characterised as-is because it has no *seam*, no place to observe or substitute its behaviour. It's entangled with I/O, global state, direct external calls, or construction so tight you can't invoke it in a test without triggering everything. The move is to introduce a seam: a small, safe structural change that creates a place to get a test in.

- **A seam is a point where you can substitute behaviour without editing the code around it,** a parameter you can pass a double to, an extracted function you can call directly, an injected dependency you can fake. Introducing one lets you isolate the code enough to test it.
- **The seam-introducing change is the dangerous part,** because it's made *before* you have a net (you're changing code precisely to make it testable). Keep it as small and as mechanically safe as possible, a pure extraction or an injection of an existing dependency, exactly the kind of change least likely to alter behaviour (the refactoring skill's safest transformations, performed by tool where possible). Do the minimum to create one seam, get a test through it, then you're back to the safe loop.
- This is the legacy-code bootstrap: a tiny, careful, unverified structural change to create testability, then tests, then safe change from there. It's slow and deliberate, and it's the honest answer to "how do I touch scary untested code", you create the conditions for a net before you rely on one, rather than refactoring blind.

## The order of operations for a tangled codebase

When you need to change code that has no tests and resists testing:

1. **Identify the smallest area you need to change**, and the behaviour around it that your change could affect.
2. **Find or create a seam** to get that area under test. If a seam exists, use it. If not, make the smallest safe structural change to introduce one (the riskiest step, done with maximum care).
3. **Write characterisation tests** through the seam, pinning the current behaviour of the area, including its edge cases and any current bugs.
4. **Verify the net is real**, that the tests would actually fail if behaviour changed (confirm they exercise the paths you're about to touch).
5. **Now refactor or remediate safely**, under the full discipline (small steps, verify after each), with the characterisation tests as the net.
6. **If you're also fixing a bug**, that's a separate behavioural step after the structure is safe: change the behaviour, update the characterisation test to pin the *new* (correct) behaviour, verify.

## When the cost is too high

Characterising badly tangled code is real work, and sometimes the honest call is that it's not worth it for the change at hand, the area is too entangled, the change too small, the risk of the seam-introducing step too high relative to the benefit. Then the options are to make the smallest possible change with maximum manual care and no net (accepting the risk explicitly, for a genuinely tiny change), or to defer the change until a larger effort can justify properly characterising the area. What you don't do is make a large change to badly tangled code with no net and assume it's fine, that's the refactoring-without-a-safety-net failure at its most dangerous, in exactly the code most likely to break.

## The connection to refactoring

This file and the refactoring skill's safety-net file are two views of the same discipline: refactoring needs a net, legacy code lacks one, and characterisation tests plus seams are how the net gets created so the refactoring can proceed safely. When the task is "clean up this untested mess", the sequence is always: pin current behaviour, get a seam if needed, then refactor under the net, never the other way around.
