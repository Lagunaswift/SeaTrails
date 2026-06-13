# Test Levels: The Pyramid

Tests come at different levels of scope, from a single small unit in isolation up to the whole system running end to end. Each level trades speed and precision against realism. Matching the level to what you're verifying, and keeping the overall mix in the right proportion, is what makes a suite both fast enough to run constantly and meaningful enough to trust.

## The three levels

- **Unit tests** verify a single small piece (a function, a class, a module) in isolation, with its dependencies replaced by test doubles where needed (see `test-doubles.md`). They're fast (no I/O, no network, no database), precise (a failure points at one small thing), and numerous. They're where most of your testing logic lives, because they can exhaustively cover the edge cases of complex logic cheaply.
- **Integration tests** verify that several units work together correctly, often including a real dependency (a real database, a real call between modules). They're slower and less precise (a failure could be in any of the integrated parts) but more realistic, they catch the bugs that live in the *seams* between units, which unit tests with mocked boundaries miss. They're fewer than unit tests and aimed at the integrations that actually matter.
- **End-to-end tests** verify the whole system from the outside, as a user or caller experiences it (through the UI, through the public API). They're the slowest, the most brittle (many moving parts, any of which can cause a failure or a flake), and the least precise, but the most realistic, they're the only level that confirms the whole thing actually works together. They're the fewest, reserved for the critical paths that must not break.

## The pyramid shape

The classic and sound guidance is a pyramid: **many unit tests at the base, fewer integration tests in the middle, fewest end-to-end tests at the top.** The shape follows from the trade-offs:

- Unit tests are cheap, fast, and precise, so you can afford many, and they give you exhaustive edge-case coverage of your logic without slowing the suite.
- Integration tests are more expensive, so you use fewer, targeted at the seams where real bugs occur (the database query, the module boundary, the external call).
- End-to-end tests are the most expensive and flakiest, so you use the fewest, covering only the handful of critical user journeys that absolutely must work.

The pyramid keeps the suite fast (dominated by quick unit tests) while still confirming integration and whole-system behaviour with a thinner layer of slower tests. A fast suite gets run constantly, which is what makes it a real safety net; a slow suite gets skipped, which is how protection evaporates.

## Matching level to purpose

Use the level that verifies what you actually need to verify, at the lowest level that can do it:

- **Verifying logic and edge cases** (does this calculation handle the boundary, does this rule branch correctly): unit test. Push edge-case coverage as low as possible, it's cheapest and most precise there.
- **Verifying a seam** (does the code correctly use the database, do these two modules integrate, does the real external call work as expected): integration test. The seam is exactly what a unit test with a mocked boundary can't verify (see the over-mocking trap in `test-doubles.md`).
- **Verifying a critical user journey works end to end** (can a user actually sign up, can an order actually be placed): end-to-end test. But only the critical journeys, not every path.

The rule of thumb: test at the lowest level that gives real confidence. If a unit test can verify it, don't reach for an integration test; if an integration test suffices, don't reach for end-to-end. Lower is faster, more precise, and less flaky.

## The inverted pyramid (and the ice-cream cone)

The common anti-pattern is inverting the shape: mostly slow end-to-end tests, few unit tests, sometimes drawn as an "ice-cream cone" (wide slow top, thin fast base). It happens because end-to-end tests feel more convincing ("it tests the real thing") and because skipping unit tests feels faster up front. The result is a suite that's slow (so it's run rarely), flaky (end-to-end tests fail for environmental reasons constantly), and imprecise (a failure could be anywhere), which trains people to ignore failures and erodes the whole net. If your suite is mostly end-to-end, it's inverted, and the fix is pushing logic verification down into fast unit tests and reserving end-to-end for the few critical journeys.

## Proportion is a guide, not a quota

The pyramid is a shape to aim for, not a precise ratio to enforce. Some systems legitimately have more integration tests (when the logic is thin but the integrations are the risk, a system that's mostly glue between services). The principle underneath is the durable one: prefer fast, precise, low-level tests where they give confidence, use slower higher-level tests where only they can verify the seam or the journey, and keep the slow flaky end-to-end layer thin. Aim for a suite that's mostly fast, runs in seconds to minutes, and gets run on every change, because a net that's too slow to run is not a net.
