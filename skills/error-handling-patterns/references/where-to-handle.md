# Where to Handle: Choosing the Layer

Catching an error in the wrong place is as harmful as not catching it. The skill is handling each failure at the layer that has both the **information** to decide what the failure means and the **authority** to act on it, and letting it propagate through the layers that have neither. Catch too low and you can't make the right decision; catch too high and you've lost the specificity to respond well.

## The information-and-authority test

For any failure, ask the layer currently looking at it two questions:

1. **Does this layer know enough to decide what the failure means?** A low-level function that reads a file knows "the read failed" but not whether that's fatal (the file was required) or fine (it was optional with a default). It lacks the context. The caller who asked for the read usually knows why, and therefore what the failure means.
2. **Does this layer have the authority to act on the decision?** Knowing a failure means "tell the user to log in again" is useless three functions deep where there's no user to talk to. The request handler at the boundary has the user; the leaf function doesn't.

A layer that answers no to either should **propagate**, not handle. A layer that answers yes to both is the right place to **handle**. Most leaf-level code answers no to both and should propagate cleanly; most decisions happen near the boundaries.

## Catching too low

The symptom: a deep utility function wraps its own failure in a try/catch and decides what to do, but it doesn't have the context, so it decides badly, usually by returning a default, null, or empty value that hides the failure from the caller who *would* have known what to do.

- A `parseConfig` that catches a parse error and returns `{}` has decided, on behalf of every caller, that a broken config is fine. The caller who needed that config now runs on empty defaults and fails mysteriously later. The parse function should have let the error propagate to whoever knows whether this config is optional.
- The fix is restraint: low-level code should usually do the fallible thing and let failure propagate, adding context (see `error-context.md`) but not deciding the response. Push the decision up to where the context lives.

There is a real exception: a low-level function that genuinely *can* recover correctly without higher context (a transient-retry on its own network call, a true local default that's correct regardless of caller) may handle locally. The test still applies, it has the information and authority for *that specific* recovery. Retry logic, for instance, often legitimately lives low.

## Catching too high

The symptom: a single try/catch wraps an enormous span of code at the top, catching everything, so by the time the error arrives the handler can't tell what failed or respond specifically. It can only do something generic ("show an error page"), and it often catches failures it never intended to (see over-broad catching in `anti-patterns.md`).

- A top-level handler that wraps the entire request and shows "something went wrong" for any failure has lost the ability to tell the user *what* went wrong and *what to do*. Validation errors, auth errors, and genuine server failures all collapse into the same useless message.
- The fix: handle specific, recoverable failures at the specific layer that understands them (catch the validation error where you can tell the user which field), and reserve the top-level catch for the genuinely unexpected, as a last-resort safety net that logs loudly and returns a clean generic error, not as the primary handling.

## The boundary/chokepoint pattern

The most robust structure combines specific mid-level handling with two deliberate boundaries:

- **Specific handlers** where a particular recoverable failure is understood and can be acted on. These are surgical: catch *this* error type, here, because here is where the response is known.
- **A top-level safety net** at each entry point (request handler, job runner, message consumer, the program's main) that catches anything that propagated all the way up unhandled. Its job is not to recover but to prevent a single failure from taking down the whole process, log the full detail, alert if warranted, and return a clean error at that boundary. Every long-running system needs this net so one unhandled failure in one request doesn't crash everything.

The shape: errors propagate freely up from the leaves, get caught specifically only where a layer can genuinely handle them, and anything that reaches the top hits the safety net. This gives you specific recovery where possible and guaranteed containment everywhere else.

## Handle at boundaries, propagate in between

A useful default for layered systems: the **boundaries** of your system (where it meets users, callers, external services, the OS) are where errors get surfaced and translated; the **interior** mostly propagates. Interior code that catches and handles is the exception, justified by the information-and-authority test, not the rule. This keeps the failure-handling decisions concentrated where the context is richest, instead of scattered through every function as defensive noise.

## Don't catch what you can't handle

The simplest version of the whole principle: if catching an error here doesn't let you do something genuinely useful with it, don't catch it here. Let it propagate to where someone can. A catch block that only re-throws, or only logs-and-re-throws, or only returns a vague default, is usually a catch that shouldn't exist at this layer.
