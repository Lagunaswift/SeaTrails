---
name: testing-strategy
description: "Use this skill when deciding what to test, how to test it, or whether existing tests are any good: writing tests for new or untested code, reviewing coverage, structuring a suite, testing code that calls an AI model or other non-deterministic dependency, or establishing the safety net needed before refactoring. Trigger on phrases like 'write tests', 'add tests', 'test this', 'how do I test', 'what should I test', 'test coverage', 'unit test', 'integration test', 'is this tested', 'characterisation test', 'mock this', 'the tests are flaky', 'how do I test the AI part', or when about to change code that has no tests. Also trigger proactively before refactoring or remediating code that lacks a verification net. Covers what deserves testing, the test pyramid, deterministic vs non-deterministic (AI/LLM) output, characterisation tests for legacy code, test quality, and what coverage really means. Does NOT cover debugging a failing test (use debugging-methodology) or designing the code under test."
---

# Testing Strategy

A method for deciding what to test, how, and to what depth, so that tests actually protect against regressions and give the confidence to change code, rather than existing for their own sake or providing false comfort. The aim is not "tests" as a quota; it is a suite that fails when behaviour breaks and stays quiet when it doesn't, which is what makes change safe.

## What tests are for

Tests exist to answer one question reliably: **did this change break something that used to work?** A good suite answers yes-or-no fast and correctly, which is what lets you refactor, add features, and fix bugs without fear. Everything in this skill serves that: a test that doesn't catch a real regression is dead weight, and a test that fails when nothing actually broke (a false alarm) erodes trust until people ignore the suite entirely. The two failure modes to design against are tests that pass when they should fail (no protection) and tests that fail when they shouldn't (noise that gets muted).

This connects directly to refactoring: the refactoring skill's safety net *is* a test suite, and "establish the net before you change anything" is the same discipline seen from the other side. Where that skill assumes tests exist, this one is how they come to exist and whether they're worth trusting.

## The cardinal principle

**Test behaviour, not implementation.** A test should assert *what the code does* (given this input, it produces this result; given this action, this observable effect happens), not *how it does it* (it called this internal method, it set this private field, it looped this way). Behaviour tests survive refactoring, the whole point of refactoring is that behaviour is preserved, so behaviour tests stay green through a restructure and go red only on a real regression. Implementation tests break on every refactor even when behaviour is fine, which trains people to update tests mechanically to match the new implementation, at which point the tests verify nothing except that the code is the code. A suite coupled to implementation is worse than no suite, because it costs maintenance and provides false confidence. Assert through the public surface, at observable outcomes, and the tests become both a safety net and documentation of what the code promises.

## The method

### 1. Decide what deserves testing

Not all code is equally worth testing, and testing everything equally is how suites become slow, brittle, and unmaintained. Concentrate testing where the combination of *likelihood of breaking* and *cost of breaking* is highest: complex logic, anything handling money or data integrity, the core domain rules, the parts many things depend on, the edge cases that are easy to get wrong. Spend less on trivial code (a getter, a thin pass-through) and on code that's about to change anyway. `references/what-to-test.md` covers prioritising by risk, what's not worth testing, and the edge cases that matter most.

### 2. Choose the right kind of test

Tests come at different levels (a small unit in isolation, several units integrated, the whole system end to end), and each trades speed and precision against realism and coverage. The classic guidance is a pyramid: many fast, precise unit tests at the base; fewer integration tests; fewest slow, broad end-to-end tests at the top. Matching the test kind to what you're verifying keeps the suite both fast and meaningful. `references/test-levels.md` covers the pyramid, what each level is for, when to use which, and the anti-pattern of inverting it.

### 3. Handle the boundaries: test doubles

Code under test usually depends on other things (a database, a network call, an AI provider, the clock), and those dependencies are slow, unreliable, or non-deterministic. Test doubles (stubs, mocks, fakes) stand in for them so a test can run fast and deterministically. But doubles are a sharp tool: over-mocking couples tests to implementation and makes them pass while the real integration is broken. `references/test-doubles.md` covers when to use a double vs the real thing, the kinds and their uses, and the over-mocking trap.

### 4. Test non-deterministic and AI output differently

Code that calls an AI model (or any non-deterministic source) cannot be tested by asserting exact output equality, the output legitimately varies between runs. Testing it as if it were deterministic produces flaky tests that fail randomly and get muted. The approach differs at the root: test the deterministic scaffolding around the AI call normally, and test the AI output itself by *properties* and *evals* (does it have the right shape, satisfy invariants, pass a graded rubric) rather than exact matches. This is directly relevant to any application that uses an LLM. `references/non-deterministic.md` covers the deterministic/non-deterministic split, property-based and invariant testing, evals for AI output, and keeping the AI boundary mockable for the deterministic tests.

### 5. Add tests to code that has none

Often the code that most needs tests has none, and you need a net before you can safely change it. Characterisation tests capture what the code *currently does* (including its bugs) so you have a regression net even without a specification of what it *should* do. This is the bridge into the refactoring skill's safety net for legacy code. `references/characterisation-and-legacy.md` covers writing characterisation tests, getting untestable code under test by introducing seams, and the order of operations for adding tests to a tangled codebase.

### 6. Write tests that are worth having

A test's own quality matters: it should be readable (a failing test should tell you what broke without a debugging session), independent (not relying on other tests or shared mutable state), deterministic (same result every run, no flakiness), and fast enough to run often. Bad tests, flaky, slow, interdependent, obscure, get muted or deleted, taking the protection with them. `references/test-quality.md` covers structure (arrange/act/assert), naming, independence, determinism, the cost of flaky tests, and what makes a failure message useful.

## What coverage really means

Coverage numbers measure which lines ran during tests, not whether behaviour is verified. High coverage with weak assertions (the code ran but nothing meaningful was checked) is false confidence; the number says 90% and the suite catches nothing. Coverage is useful as a *floor* (it reveals code with no tests at all) and misleading as a *target* (chasing the number produces tests that execute lines without verifying them). `references/coverage.md` covers reading coverage honestly, why 100% is usually the wrong goal, and what to look at instead of the percentage.

## Anti-patterns

The recurring ways testing goes wrong, each with its correction, in `references/anti-patterns.md`:

- Testing implementation instead of behaviour (brittle tests that break on every refactor)
- Asserting exact equality on non-deterministic or AI output (flaky tests)
- Over-mocking until tests pass but the real integration is broken
- Chasing a coverage percentage with assertion-free tests
- Tests that depend on each other or on shared mutable state
- Flaky tests left in the suite (training everyone to ignore failures)
- Testing trivial code heavily while complex logic goes untested
- Inverting the pyramid (mostly slow end-to-end tests, few units)
- No tests on the code most likely to break (money, data integrity, core rules)
- Writing tests after the fact that just mirror whatever the code happens to do

## Reference index

- `references/what-to-test.md`: prioritising by risk, what's not worth testing, the edge cases that matter
- `references/test-levels.md`: the pyramid, unit/integration/end-to-end, matching level to purpose
- `references/test-doubles.md`: stubs/mocks/fakes, real-vs-double, the over-mocking trap
- `references/non-deterministic.md`: deterministic/AI split, property and invariant tests, evals for AI output
- `references/characterisation-and-legacy.md`: characterisation tests, seams, adding tests to untested code
- `references/test-quality.md`: structure, naming, independence, determinism, useful failures
- `references/coverage.md`: reading coverage honestly, why 100% is the wrong target
- `references/anti-patterns.md`: the failure modes above, each with its correction
