# Fail Fast vs Degrade Gracefully

When a failure can't be recovered, you face a binary choice with no third option: stop, or continue in a reduced way. Both are correct in different situations, and choosing the wrong one is the bug. Failing fast on something non-essential takes down a system that should have shrugged; degrading on something essential produces wrong results while pretending everything is fine.

## Fail fast and loud

Stop the operation immediately, report loudly, and do not continue, when continuing would be worse than stopping. Use it when:

- **Continuing would corrupt data or produce wrong results.** A failure mid-way through something that leaves state half-updated, a calculation missing a required input, a write that can't confirm it succeeded. Better to stop with a clear error than to persist garbage that someone trusts later.
- **The failure is a programmer error** (a violated invariant, an impossible state, a `null` that can't be `null`). This is a bug. Failing fast surfaces it where it can be fixed; limping past it hides it and corrupts downstream. Recovering from a bug is just a quieter bug.
- **A required dependency is unavailable with no fallback.** If the thing that just failed is essential to the operation and there's no alternative, continuing is pointless. Stop and surface it.

"Loud" matters as much as "fast": fail in a way that's *seen*, an error surfaced to the caller, a loud log, an alert if it's operational. A fast failure that's silent is just a swallowed error with extra steps.

## Degrade gracefully

Continue with reduced functionality when the failed thing is non-essential and a partial experience genuinely beats a total failure. Use it when:

- **The failure is isolated to something non-critical.** A recommendations panel, a "people also viewed" widget, an avatar that won't load, an analytics ping. None of these should take down the page or operation they sit within. Catch the failure, render without that piece, carry on.
- **A fallback is correct, not merely available.** Serve a cached value when the live one is unreachable, a default when the personalised one fails, a queue-for-later when the immediate write can't happen. The fallback has to leave the system *correct*, not just running, a stale cache is fine for a product description, dangerous for an account balance.

The unit of degradation matters: degrade the *smallest* thing that failed, not everything around it. One broken widget degrades to "that widget is absent," not "the whole page is an error."

## The decision in one question

For each unrecoverable failure: **would continuing without this produce a result that's wrong, or merely a result that's lesser?** Wrong, fail fast. Lesser, degrade. A missing recommendations widget makes the page lesser (degrade). A missing required field in a financial calculation makes the result wrong (fail fast). The whole judgement compresses to wrong-vs-lesser.

## Degrade without hiding

The dangerous failure mode of graceful degradation is that it *becomes* swallowing: the widget fails, you catch it, render without it, and never report that anything went wrong. Now a broken dependency is invisible, and it stays broken because nobody knows. A degraded path must still surface the failure to the people who need to know it, even while hiding it from the user who doesn't:

- Log the underlying failure with full context (it didn't stop mattering just because you degraded).
- Alert/track it operationally if it's a real dependency failing, the user sees a smooth experience, the operator sees that the recommendations service is down.
- Where appropriate, signal the degradation to the user honestly ("recommendations are temporarily unavailable") rather than silently showing nothing, so absence doesn't look like emptiness.

Graceful degradation hides the failure from the user's *experience*, never from the *logs and operators*. If your degradation path has no logging or alerting, you've built a silent failure and called it resilience.

## Partial failure in multi-step operations

A specific hard case: an operation with several steps where some succeed and one fails partway. Now you're in a partial state, and neither "fail fast" nor "degrade" cleanly applies, because work is already done. The options:

- **All-or-nothing (atomic).** Make the whole operation a transaction that fully completes or fully rolls back, so a mid-way failure leaves no partial state. Strongly preferred when the steps touch shared/persistent state, this is what transactions are for.
- **Compensate.** When true atomicity isn't available (steps span systems), undo the completed steps explicitly on failure (cancel the charge if the shipment can't be booked). Harder, error-prone, but sometimes the only option across service boundaries.
- **Make steps idempotent and resumable.** So a failed multi-step operation can be safely retried from where it stopped without redoing or duplicating completed work. See `resilience-patterns.md`.

The failure to avoid: leaving partial state with no rollback, no compensation, and no resumability, so a failure halfway through silently leaves the system inconsistent. Decide the partial-failure strategy *before* writing the multi-step operation, not after it first half-completes in production.
