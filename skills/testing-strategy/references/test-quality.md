# Test Quality

A test's own quality determines whether the suite stays a trusted net or rots into ignored noise. Bad tests, flaky, slow, interdependent, obscure, don't just fail to protect; they actively erode the suite, because a suite that cries wolf gets muted, and a muted suite protects nothing. The qualities below are what keep tests worth having.

## Readable: a failure should explain itself

When a test fails, it should tell you what broke without a debugging session. A good test reads as a clear statement of a behaviour, and its failure message points at what's wrong.

- **Arrange, act, assert.** Structure each test in three clear phases: set up the inputs and state (arrange), perform the one action under test (act), check the outcome (assert). This structure makes a test scannable, the reader sees what's being set up, what's being done, what's expected, without untangling it.
- **Test one thing.** A test that checks one behaviour fails for one reason, so its failure is unambiguous. A test that checks five things fails for any of five reasons and you have to investigate which. Prefer several focused tests over one that asserts everything.
- **Name for the behaviour.** A test named for what it verifies ("returns empty list when no items match") tells you, from the failure report alone, what behaviour broke. A test named "test3" or "testFunction" tells you nothing and forces you to read the body. The name is the first line of the failure message; make it carry meaning.
- **Make the assertion specific.** "Assert the result equals the expected user object" beats "assert the result is truthy", a specific assertion catches more and explains the failure better. A vague assertion (just that something didn't throw, just that a value exists) often passes when behaviour is subtly wrong (connects to the coverage-without-verification problem in `coverage.md`).

## Independent: no test depends on another

Each test must stand alone, producing the same result regardless of which other tests ran, in what order, or whether they ran at all.

- **No shared mutable state between tests.** A test that relies on state another test created (a record in the database, a value in a module-level variable) breaks when tests run in a different order, in isolation, or in parallel. Each test sets up its own state and cleans up after, or uses isolated state per test (this is the state-leakage problem from state management, in test form).
- **No ordering dependency.** Tests should pass run in any order and run individually. An order-dependent suite is fragile (reordering breaks it) and hides bugs (a test only passes because a previous test left the right state). If tests must run in a specific order, that's a coupling smell to fix, not a constraint to document.
- Independence is what lets tests run in parallel (for speed) and lets you run one test in isolation (for debugging), both of which you want.

## Deterministic: same result every run

A test must produce the same result every time it runs, given the same code. A test that sometimes passes and sometimes fails without the code changing is *flaky*, and flaky tests are corrosive.

- **The sources of flakiness** are the usual non-determinism: real time/clocks, randomness, unmocked external calls, network, ordering of concurrent operations, shared state between tests, and unsealed AI/non-deterministic boundaries (see `non-deterministic.md`). Control each: inject the clock, seed or mock randomness, mock external calls, sort unstable orderings, isolate state.
- **A flaky test is worse than no test.** Once a test fails intermittently for no real reason, people start ignoring its failures ("oh, that one's just flaky, re-run it"), and that habit spreads to the whole suite, until a real failure gets dismissed as flakiness and ships. One tolerated flaky test trains everyone to mute the net. Fix flaky tests immediately or remove them; never leave them failing intermittently in the suite.

## Fast: fast enough to run constantly

A suite's value depends on it being run, and a suite that's too slow gets run rarely or skipped, which is when regressions slip through.

- **Fast tests get run on every change**, which is what makes them a real net (the refactoring loop depends on running tests after every small step, see the refactoring skill). Slow tests get run "later", and later is when the bug has already compounded.
- The pyramid (see `test-levels.md`) is largely about speed: many fast unit tests, few slow end-to-end ones, so the bulk of the suite is fast. If the whole suite is slow, it's usually too heavy on high-level tests or hitting real slow dependencies where doubles would serve.
- Keep the fast suite (the one run on every change) genuinely fast, seconds to a couple of minutes. Slower tests (broad integration, end-to-end, evals) can run less often (before merge, on a schedule) so they don't slow the constant loop.

## The cost of bad tests is negative

The throughline: a bad test isn't neutral, it's negative. A flaky test erodes trust in the whole suite. A slow test gets the suite skipped. An implementation-coupled test breaks on every refactor and gets mechanically "fixed" until it verifies nothing. An interdependent test hides bugs and breaks on reordering. An obscure test costs a debugging session every time it fails. Each of these costs more than it protects, which is why test quality isn't polish, it's what determines whether the suite is an asset or a liability. Tests are code, held to the same standards as the code they protect, and a test you wouldn't trust is one to fix or delete, not to leave festering in the suite.
