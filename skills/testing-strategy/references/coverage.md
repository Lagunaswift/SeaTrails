# Coverage: What It Really Means

Coverage measures which lines (or branches) of code executed while the tests ran. That is all it measures. It does *not* measure whether behaviour was verified, whether the assertions were meaningful, or whether the tests would catch a regression. Confusing "this line ran during a test" with "this line's behaviour is protected" is the central coverage mistake, and it produces high numbers with low protection.

## Coverage measures execution, not verification

A line counts as covered if a test caused it to run, regardless of whether the test *checked* what that line did. This means you can have high coverage and a useless suite:

- A test that calls a function and asserts nothing meaningful (or asserts only that it didn't throw) *covers* every line the function ran, while verifying almost nothing. The coverage tool reports those lines green; a regression in any of them sails through because nothing was actually checked.
- Coverage with weak assertions is false confidence in its purest form: the number says the code is tested, the suite catches nothing, and people trust the number. This is more dangerous than low coverage, because low coverage at least tells the truth about being unprotected.

The fix is not more coverage; it's meaningful assertions (see `test-quality.md`). A covered line is only protected if a test would *fail* when that line's behaviour breaks. Coverage can't tell you that; only the quality of the assertions can.

## Coverage as a floor, not a target

Coverage is genuinely useful in one direction and misleading in the other:

- **As a floor, it's useful.** Coverage reliably reveals code with *no* tests at all, the zero-coverage regions are honestly untested, and that's worth knowing. Low coverage is a true negative signal: this code is not exercised by any test. Used to find the gaps, coverage points you at real holes.
- **As a target, it's misleading.** The moment a coverage percentage becomes a goal (a mandated 80%, a 100% requirement), people write tests to hit the number, and tests written to hit a number are exactly the assertion-free, line-executing tests that provide false confidence. Goodhart's problem applies, when the measure becomes the target, it stops measuring what you cared about. Chasing the percentage optimises for executed lines, not verified behaviour.

Use coverage to find untested code worth testing; don't use it as a quota that tests must satisfy.

## Why 100% is usually the wrong goal

Demanding 100% coverage sounds rigorous and is usually counterproductive:

- It forces tests onto trivial code that doesn't need them (the getters, the pass-throughs, the framework glue from `what-to-test.md`), spending effort where there's no risk to protect against.
- It pushes people to write tests *for the number*, hitting lines without meaningful assertions, which is the false-confidence failure.
- The last stretch of coverage (the rare error branches, the defensive code, the hard-to-reach paths) often costs disproportionate effort for little protection, and sometimes the only way to hit it is contrived tests that verify nothing real.

A high number achieved honestly (meaningful tests on the code that matters) is fine as a *byproduct*; a high number pursued as a *goal* is a warning sign. The aim is protection of the risky code (see `what-to-test.md`), not a uniform percentage across all code regardless of risk.

## What to look at instead of the percentage

Better questions than "what's our coverage number":

- **Is the high-risk code (money, data integrity, core rules, complex logic) genuinely tested, with meaningful assertions and edge cases?** That's the coverage that matters, and it's a question about the *right* code being well-tested, not about an aggregate percentage.
- **Are there zero-coverage regions that should have tests?** Use coverage's floor signal to find untested risky code, and test it because it's risky, not to move the number.
- **Would the suite actually fail if behaviour broke?** The real test of a test suite. You can check it directly with mutation testing (deliberately introduce a bug and see if a test catches it), which measures protection in a way line coverage can't, if the mutated code still passes all tests, those tests weren't really verifying it. Mutation testing is more expensive than coverage but answers the question coverage can't: are the tests catching anything.

## The honest summary

Coverage tells you what ran, not what's protected. It's a useful flashlight for finding untested code and a misleading target that corrupts test-writing when chased. Aim testing effort at the code where bugs are likely and costly (per `what-to-test.md`), write tests with meaningful assertions that would fail on a real regression (per `test-quality.md`), and treat any coverage number as a rough floor-finder, never as the goal. A suite that catches regressions in the code that matters is the win; the percentage is at best a weak proxy for it and at worst a target that destroys it.
