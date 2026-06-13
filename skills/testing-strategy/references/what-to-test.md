# What to Test

Testing everything equally is how test suites become slow, brittle, and eventually abandoned. The goal is not maximal coverage; it is protection where protection matters. Concentrate testing where the cost of a bug is high and the chance of a bug is real, and spend little or nothing on code that's trivial or about to change. A focused suite that guards the dangerous parts beats a sprawling one that tests everything shallowly and runs too slowly to trust.

## Prioritise by risk: likelihood times cost

For each piece of code, weigh two things: how likely it is to break (now or under future change), and how bad it is when it breaks. Test hardest where both are high.

**High likelihood of breaking:**

- **Complex logic.** Branching, calculations, algorithms, anything with many paths or edge cases. Complexity is where bugs live and where a refactor can silently change behaviour.
- **Code that changes often.** A frequently-edited area is repeatedly exposed to regression; tests there earn their keep on every change.
- **Code many things depend on.** A widely-used function or module, when it breaks, breaks everything downstream. Its blast radius justifies strong tests.
- **Code with subtle edge cases.** Anything where empty, null, boundary, or unusual inputs behave differently, exactly the cases human reading skips (see the refactoring skill's safety net).

**High cost of breaking:**

- **Anything handling money.** Payments, billing, balances, pricing. A bug here costs real money and trust, directly.
- **Anything touching data integrity.** Writes, deletes, migrations, anything that can corrupt or lose data. Corruption is often irreversible and surfaces far from the cause.
- **Core domain rules.** The logic that *is* the product, the rules that define what it's supposed to do. A bug here is a bug in the thing's reason to exist.
- **Security-relevant logic.** Authorisation checks, input validation, access boundaries. A bug here is a vulnerability (and connects to the security skills).
- **Anything irreversible or hard to recover from.** Sending emails, charging cards, external side effects that can't be undone.

The top-right quadrant, likely to break *and* costly when it does, is where testing effort should concentrate. Money-handling logic with edge cases, core rules that change often, widely-depended-on code with subtle behaviour: test these thoroughly, including the edge cases.

## What's not worth testing (much, or at all)

Restraint is part of the strategy. Light testing or none is appropriate for:

- **Trivial code with no logic.** A plain getter, a simple pass-through, a one-line delegation. There's nothing to break that a type checker doesn't already catch; a test here verifies that assignment works, which it does.
- **Generated code and framework glue.** Code you didn't write and that the framework guarantees. Test your logic, not the framework's.
- **Code about to be deleted or rewritten.** Don't invest tests in what's leaving.
- **Pure configuration** with no behaviour. There's no logic to verify.
- **Throwaway and exploratory code.** A spike to learn something doesn't need a suite; if it graduates to real code, it gets tests then.

Testing trivial code heavily while complex logic goes untested is a common inversion (see `anti-patterns.md`): the easy tests get written because they're easy, and the hard, valuable ones get skipped because they're hard. Resist it, the value is in the hard tests.

## The edge cases that matter most

When you do test something, the edge cases are where the value concentrates, because the happy path is the part that's usually right and the edges are where bugs hide:

- **Empty:** empty string, empty list, empty input, zero items. A huge fraction of bugs are "didn't handle the empty case."
- **Boundaries:** the first, the last, the maximum, the minimum, one-past-the-end, the off-by-one zone. Boundaries are where logic flips and where it's easy to flip it one position wrong.
- **Null/absent:** missing values, null, undefined, not-provided. The "it was always there in testing" assumption that breaks on the record that doesn't have it.
- **The unexpected type or shape:** the value that crossed a boundary and isn't what the type claims (connects to data and interface concerns), the malformed input.
- **The error path:** what happens when the thing it depends on fails. The failure paths run in production far more than the demo showed (connects to error-handling), and they're the least-tested part of most code.
- **Zero, one, many:** the classic trio. Code often works for "many" and breaks for "one" or "zero" (or vice versa). Test all three.

A test of the happy path alone provides thin protection, because the happy path is rarely where regressions hide. The edge cases are the protection.

## A practical heuristic

When unsure whether something is worth testing, ask: "if this silently broke, how would I find out, and how bad would it be?" If the answer is "a user loses money and we'd find out from an angry support ticket weeks later", test it hard. If it's "the build fails immediately" or "nobody would notice or care", test it lightly or not at all. The suite's job is to catch the breaks that are both silent and costly, before they ship. Aim the effort there.
