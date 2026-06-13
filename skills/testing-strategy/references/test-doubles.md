# Test Doubles: Stubs, Mocks, and Fakes

Code under test usually depends on things that are slow, unreliable, expensive, or non-deterministic: a database, a network call, an AI provider, the clock, the file system. Test doubles stand in for those dependencies so a test can run fast and produce the same result every time. They're essential, and they're a sharp tool, the most common way a test suite becomes brittle or falsely green is misuse of doubles. The skill is using them at the right boundaries and not past them.

## What doubles are for

A double replaces a real dependency in a test, for one of these reasons:

- **Speed:** the real thing is slow (a network round-trip, a database write). A double makes the test fast enough to run constantly.
- **Determinism:** the real thing varies (the clock, a random source, an AI model, a live external service). A double makes the test produce the same result every run, no flakiness (see `non-deterministic.md`).
- **Isolation:** you want to test *this* unit's logic, not its dependency's, so you replace the dependency to remove it as a variable. A failure then points at the unit, not the dependency.
- **Controllability:** you need the dependency to behave a specific way the real one is hard to force (return an error, return an edge-case value, simulate a timeout). A double lets you script exactly the scenario you're testing.

## The kinds (briefly)

The terms are used loosely; what matters is the behaviour:

- **Stub:** returns canned answers to calls. "When asked for user 5, return this user." Used to feed the unit-under-test specific inputs from its dependency.
- **Mock:** a stub that also *verifies it was called* in an expected way. "Assert that save was called once with this argument." Used to verify the unit *interacts* with its dependency correctly. This is the kind most prone to the over-mocking trap (below), because verifying calls is verifying implementation.
- **Fake:** a working but simplified implementation. An in-memory version of the database, a fake clock you can advance. Used when you want realistic behaviour without the real dependency's cost. Often the best double, because the test exercises real-ish behaviour rather than canned answers.

Prefer the lightest double that does the job, and prefer fakes over mocks where a fake is available, because a fake exercises behaviour while a mock often just pins down calls.

## When to use a double vs the real thing

The central judgement, and where most mistakes happen:

- **Use a double when the dependency is slow, non-deterministic, expensive, external, or has side effects you don't want in a test** (the AI provider, the payment gateway, the email sender, the live clock). You can't and shouldn't hit these for real in a fast unit test.
- **Use the real thing when the dependency is fast, deterministic, and the integration with it is part of what you're verifying.** This is the key insight people miss: if you're testing whether your code correctly uses the database, mocking the database means you're testing your *assumptions* about the database, not the database. Some things must be tested against the real dependency (in an integration test, see `test-levels.md`), or you verify nothing about the actual integration.

The rule: mock the boundaries you don't own or can't afford to hit (external services, the AI, the clock); use the real thing for the boundaries whose integration you're actually trying to verify. A test that mocks the very thing it's supposed to be verifying the integration with is testing nothing real.

## The over-mocking trap

The most damaging double misuse: mocking so much that the test passes while the real system is broken. It takes a few forms, all worth recognising:

- **Mocking the thing under test's actual collaborators so thoroughly that the test only verifies the mocks.** Every dependency is a mock returning canned values, every interaction is asserted, and the test goes green, but it's verifying that the code calls the mocks the way the test set them up, which is circular. It can't catch a real bug because nothing real is exercised.
- **Mocking and asserting on internal calls (implementation testing via mocks).** Asserting "it called this internal method with these arguments" couples the test to *how* the code works, so it breaks on every refactor even when behaviour is preserved (the cardinal violation from the main skill, seen through mocks). The test verifies the implementation, not the behaviour, and becomes maintenance overhead with negative value.
- **Mocking a dependency wrongly, so the mock behaves differently from the real thing.** The test passes against the mock's behaviour, the code fails against the real dependency's actual behaviour, and the bug ships because the mock lied. The more you mock, the more chances for a mock to diverge from reality.

The signature of over-mocking: the unit tests are all green, but the system doesn't work when the pieces are connected. That gap is the mocks hiding the real integration's failures. The fix is to mock less, mock only the boundaries you genuinely must (external, slow, non-deterministic), and cover the real integrations with integration tests against real dependencies (see `test-levels.md`). A test suite that's all heavily-mocked unit tests and no integration tests is exactly the suite that passes while production breaks.

## A practical balance

Mock the genuinely external and non-deterministic (the AI provider, third-party services, the clock, randomness), use fakes for things like the database where a realistic in-memory version exists, and use the real dependency in integration tests for the seams whose correctness actually matters. Keep mock-based assertions on *interactions* rare, reserved for when the interaction itself is the behaviour being verified (did it actually send the email), not as the default way to test. The more your tests exercise real behaviour and the less they pin down internal calls, the more they protect you and the less they break on refactoring.
