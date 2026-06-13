# Testing Anti-Patterns

Each entry is a recurring way testing goes wrong, why it's tempting, why it bites, and the correction. When you catch yourself doing one, stop and switch.

## Testing implementation instead of behaviour

**The pattern:** Tests assert *how* the code works (it called this method, set this private field, looped this way) rather than *what* it does (given this input, this output).
**Why it's tempting:** Implementation details are concrete and easy to assert on, and mocking frameworks make verifying internal calls easy.
**Why it bites:** The tests break on every refactor even when behaviour is preserved, which is backwards, refactoring is supposed to be safe, and these tests punish it. People then "fix" the tests to match the new implementation, so the tests only ever verify that the code is the code. Negative value: maintenance cost plus false confidence.
**Correction:** Assert behaviour through the public surface, at observable outcomes. Behaviour tests survive refactoring and fail only on real regressions. See the cardinal principle in the main skill.

## Asserting exact equality on non-deterministic output

**The pattern:** Testing AI output (or anything non-deterministic) by asserting it equals a specific expected string.
**Why it's tempting:** Exact-equality assertions are how deterministic tests work, so it's the reflex.
**Why it bites:** The output legitimately varies between runs, so the test fails randomly, gets labelled flaky, and gets muted, taking its protection with it and eroding trust in the suite.
**Correction:** Test deterministic scaffolding normally with the AI mocked; test real output by properties and invariants (shape, constraints, safety), not equality; track quality with evals over a representative set. See `non-deterministic.md`.

## Over-mocking

**The pattern:** Mocking so many dependencies that the tests pass while the real system is broken, or mocking and asserting on internal calls.
**Why it's tempting:** Mocks make tests fast and isolated, and mocking everything feels like rigorous unit testing.
**Why it bites:** Heavily-mocked tests verify the mocks, not reality, they go green while the actual integration fails, and the bug ships. Asserting on internal calls couples tests to implementation (the first anti-pattern in mock form).
**Correction:** Mock only the boundaries you must (external, slow, non-deterministic); use real dependencies for the integrations you're verifying, covered by integration tests. Keep interaction-assertions rare. See `test-doubles.md`.

## Chasing a coverage percentage

**The pattern:** Writing tests to hit a coverage number, producing tests that execute lines without meaningfully asserting on them.
**Why it's tempting:** A coverage target is a concrete, measurable goal, and hitting it feels like progress.
**Why it bites:** Tests written for the number execute code without verifying it, the highest form of false confidence: the percentage says protected, the suite catches nothing.
**Correction:** Use coverage as a floor to find untested risky code, never as a target. Aim meaningful tests at high-risk code; let a good number be a byproduct, not a goal. See `coverage.md`.

## Interdependent tests

**The pattern:** Tests that rely on other tests having run, or on shared mutable state, so they only pass in a particular order or as a group.
**Why it's tempting:** Reusing state set up by another test saves setup code.
**Why it bites:** The suite breaks when reordered, run in parallel, or run individually, and it hides bugs (a test passes only because another left the right state). Debugging one test in isolation becomes impossible.
**Correction:** Each test sets up and tears down its own state and passes in any order, run alone or in parallel. No shared mutable state between tests. See `test-quality.md`.

## Tolerating flaky tests

**The pattern:** A test that fails intermittently without the code changing, left in the suite and re-run until it passes.
**Why it's tempting:** Fixing flakiness is fiddly, and re-running until green is quicker in the moment.
**Why it bites:** Tolerated flakiness trains everyone to dismiss failures ("just that flaky one, re-run it"), and that habit spreads until a real failure gets waved through as flakiness and ships. One flaky test erodes trust in the whole net.
**Correction:** Fix flaky tests immediately (control the non-determinism, the clock, randomness, ordering, unmocked external calls, shared state) or remove them. Never leave a test failing intermittently. See `test-quality.md` and `non-deterministic.md`.

## Testing trivial code while complex logic goes untested

**The pattern:** Heavy tests on getters, pass-throughs, and simple code, while the complex, risky logic has little or none.
**Why it's tempting:** The trivial tests are easy to write; the complex ones are hard, so the easy ones get written and the hard ones deferred.
**Why it bites:** Effort goes where there's no risk, and the actual risk, the complex logic, the money handling, the core rules, stays unprotected. The suite looks busy and guards the wrong things.
**Correction:** Prioritise by risk, likelihood of breaking times cost of breaking. Test the complex, costly, depended-on code hard; test the trivial lightly or not at all. See `what-to-test.md`.

## Inverting the pyramid

**The pattern:** A suite that's mostly slow end-to-end tests with few fast unit tests (the ice-cream cone).
**Why it's tempting:** End-to-end tests feel more convincing ("they test the real thing"), and skipping unit tests feels faster up front.
**Why it bites:** The suite is slow (so it's run rarely), flaky (end-to-end tests fail for environmental reasons), and imprecise (failures could be anywhere), which gets it ignored and removes the net.
**Correction:** Many fast precise unit tests at the base, fewer integration, fewest end-to-end. Push logic verification down to fast unit tests; reserve end-to-end for the few critical journeys. See `test-levels.md`.

## No tests on the code most likely to break

**The pattern:** The money handling, the data-integrity writes, the core domain rules, left untested because they're hard to test or "obviously work".
**Why it's tempting:** This code is often the most entangled and hardest to get under test, so it gets skipped.
**Why it bites:** It's exactly the code where a bug is most costly and often most silent, a wrong charge, corrupted data, a broken core rule, discovered late and painfully.
**Correction:** This is the highest-priority code to test, even when it's hard. Use characterisation tests and seams to get it under test if it resists (see `characterisation-and-legacy.md`). The difficulty is a reason to invest, not to skip. See `what-to-test.md`.

## Writing after-the-fact tests that mirror the code

**The pattern:** Writing tests after the code by reading what it does and asserting exactly that, including any bugs, without thinking about what it *should* do.
**Why it's tempting:** It's fast and produces green tests and coverage.
**Why it bites:** Tests that just mirror the implementation pin whatever the code happens to do (bugs included) and verify nothing about correctness, they'll pass even if the behaviour is wrong, because they were written to match it. (This is distinct from deliberate characterisation tests, which pin current behaviour *knowingly* as a refactoring net, not as a substitute for verifying correctness.)
**Correction:** Tests should assert what the code *should* do, derived from the requirement or the expected behaviour, so they can catch a discrepancy between intent and implementation. When you genuinely only have "what it currently does" (legacy code), characterisation tests are the honest tool, but know you're pinning behaviour for safety, not verifying correctness. See `characterisation-and-legacy.md`.
