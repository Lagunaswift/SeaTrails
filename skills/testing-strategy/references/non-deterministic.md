# Testing Non-Deterministic and AI Output

Code that calls an AI model, or any non-deterministic source, cannot be tested the way deterministic code is. The output legitimately varies between identical runs, so asserting exact equality produces a test that fails randomly, gets marked flaky, and gets muted, taking its protection with it. The approach differs at the root, and the first move is to separate the parts of the system that *are* deterministic (almost all of it) from the genuinely non-deterministic boundary (the model's output), and test each appropriately.

## Split deterministic from non-deterministic

Most of an AI-using application is ordinary deterministic code that happens to sit around an AI call: the request building, the input validation, the prompt assembly, the parsing of the response, the error handling, the rate limiting, the state updates, the business logic that acts on the result. All of that is deterministic and gets tested normally, with the AI call itself replaced by a double (see `test-doubles.md`). Only the model's actual output is non-deterministic, and it's a thin slice of the system.

This split is the key architectural point, and it has a design consequence: **structure the code so the AI call is an isolatable boundary.** If the AI call is tangled directly into the business logic, you can't test the logic without invoking the model (slow, non-deterministic, costs money). If the AI call sits behind a clean boundary (a function, an interface), you can mock it in the deterministic tests and test everything around it normally. This connects to interface design and state management: a well-bounded AI dependency is testable; an entangled one isn't. If you find the AI is hard to test, the usual cause is that it's not behind a boundary, and the fix is structural.

## Test the deterministic scaffolding normally

With the AI call behind a mockable boundary, the surrounding code gets ordinary tests:

- **Input/prompt construction:** given these inputs, the request sent to the model has the expected shape, the right context, the right parameters. Deterministic, assert exactly.
- **Response parsing and validation:** given a (canned) model response, the code extracts/parses/validates it correctly, including malformed responses (the model returned something unexpected) and the error path (the model call failed). This is high-value: the response-handling edge cases are where AI-integration bugs cluster, and they're fully deterministic to test with stubbed responses.
- **The logic that acts on the result:** given a parsed result, the business logic does the right thing. Deterministic.
- **Resilience around the call:** retries, timeouts, fallbacks, rate limiting (connects to error-handling's resilience patterns), all testable with a double that simulates failures, slowness, and rate-limit responses.

The mock here returns *representative* responses, including the awkward ones (empty, malformed, refusal, oversized, the shape that breaks your parser), so the deterministic tests cover how your code handles the range of things the model can actually return.

## Test the AI output itself by properties, not equality

For the genuinely non-deterministic part, the model's actual output, you can't assert exact strings, but you can assert *properties* that must hold regardless of the exact wording:

- **Shape and structure:** if you asked for JSON, the output parses as valid JSON with the required fields. If you asked for a list of five items, there are five items. Structural properties are deterministic even when content varies.
- **Invariants:** properties that must always hold. The output doesn't contain the system prompt (a leak check, connects to the security skills). The output is within a length bound. The output doesn't contain prohibited content. A summary is shorter than its input. A translation is non-empty. These are assertable on varying output.
- **Constraints satisfied:** if the task was "extract the dates from this text", the output dates actually appear in the input. If "pick one of these options", the choice is one of the options. You're checking the output obeys the task's rules, not that it's a specific string.
- **Format and schema validation:** the output conforms to the contract you expect, validated as a schema. This catches the model drifting from the required format, which is a real and common failure.

Property-based testing is the general name for this, assert what must be true about *any* valid output, not a specific output. It's the right model for anything non-deterministic, AI or otherwise (a random shuffle still has the same elements; a generated id still matches the id format).

## Evals: grading quality that isn't a pass/fail property

Some things about AI output aren't a hard property but a quality judgement, is the answer actually good, helpful, correct, on-tone. These can't be a simple assertion, and they're tested with **evals**: a set of representative inputs, run through the system, with the outputs graded against a rubric. Grading can be automated (a scoring function, or another model grading against criteria) or human, and the eval tracks quality as a *score over a set* rather than a pass/fail on one output.

- Evals are how you know whether a prompt change made things better or worse, run the eval set before and after, compare the scores. Without them, prompt changes are guesswork.
- Evals run differently from unit tests: not on every commit (they're slow and may cost money), but as a deliberate quality check when the AI behaviour changes. They're a distinct discipline from the regression suite, complementary to it.
- An eval set is itself an asset: a curated collection of inputs that represent the real range of use, including the hard cases, with expected qualities defined. Building it is most of the work, and it's where the value is.

For an AI-heavy application, the testing picture is: deterministic tests (the bulk, fast, on every commit) cover everything around the AI with the model mocked; property/invariant tests cover the structural and safety guarantees of real output; and evals (slower, deliberate) track output *quality* over a representative set when the AI behaviour changes.

## Don't let non-determinism leak into the deterministic tests

A final discipline: keep the non-determinism contained at its boundary so it doesn't make the rest of the suite flaky. The clock, randomness, ids, ordering, and the AI call are all injected or mocked in the deterministic tests, so those tests are fully reproducible. A deterministic test that occasionally fails is usually one where some non-determinism (a real timestamp, an unmocked random, an unstable ordering) leaked in, and the fix is to control that source (inject the clock, seed or mock the randomness, sort the unordered) rather than to tolerate the flake. Flakiness anywhere trains everyone to ignore failures (see `test-quality.md`), so the non-deterministic boundary must stay sealed off from the deterministic suite.
