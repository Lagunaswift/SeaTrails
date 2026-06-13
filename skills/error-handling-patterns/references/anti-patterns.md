# Error Handling Anti-Patterns

Each entry is a recurring way failure handling goes wrong, why it's tempting, why it bites, and the correction. When you catch yourself doing one, stop and switch.

## Swallowing the error

**The pattern:** An empty catch block, a bare `except: pass`, an ignored error return value. The failure is caught and discarded.
**Why it's tempting:** It makes the error "go away" and the code compiles and runs without complaint.
**Why it bites:** The failure didn't go away; it went *silent*. The program continues on wrong assumptions, and the real problem resurfaces later as a baffling symptom with the original cause long gone and no log to find it. This is the single most damaging error-handling mistake.
**Correction:** Every caught error gets one of three fates, handled, propagated, or surfaced (the cardinal rule). If you catch it, answer "which fate, and why?" An empty catch has no answer, so it shouldn't exist.

## The catch-all that treats everything the same

**The pattern:** One handler catches every possible failure and responds identically, usually a generic message or a single fallback.
**Why it's tempting:** One handler is less code than handling each failure specifically.
**Why it bites:** Different failures need different responses. A validation error, an auth failure, and a database outage are not the same problem and collapsing them into "something went wrong" throws away the chance to respond usefully to any of them, and often hides serious failures among trivial ones.
**Correction:** Handle specific, recoverable failures specifically, at the layer that understands them. Reserve a generic catch-all only as the top-level safety net for the genuinely unexpected. See `where-to-handle.md`.

## Catching too broadly

**The pattern:** A catch that grabs a wider category of errors than intended, catching (and hiding) failures you never meant to handle, including bugs.
**Why it's tempting:** Catching the broad base type is easier than naming the specific failures.
**Why it bites:** The broad catch silently absorbs programmer errors and unrelated failures along with the one you meant to handle. A typo that should crash loudly instead gets caught by your "handle network errors" block and hidden.
**Correction:** Catch the narrowest, most specific error type that represents the failure you can actually handle. Let everything else propagate. Specificity is what stops a handler from eating bugs. See the language files for how narrow catching works in each.

## Catching too high or too low

**The pattern:** Handling at a layer that lacks the context to decide (too low, so it returns a hiding default) or lacks the specificity to respond (too high, so it can only do something generic).
**Why it's tempting:** Too-low feels defensive ("handle it where it happens"); too-high feels tidy ("one place for all errors").
**Why it bites:** Too-low hides failures from the caller who knew what to do; too-high loses the information needed to respond well. Both produce worse handling than letting the error reach the layer with information and authority.
**Correction:** Handle at the layer with both the information to decide and the authority to act; propagate through the layers with neither. See `where-to-handle.md`.

## Replacing the cause with a vague new error

**The pattern:** Catching a detailed error and throwing a fresh generic one (`throw new Error("failed")`) that discards the original and its stack.
**Why it's tempting:** The new message reads cleanly; the original looked like noise.
**Why it bites:** The "noise" was the diagnostic information. The new error's stack points at your catch block, not the origin, converting a diagnosable failure into a mystery.
**Correction:** Wrap and chain, attach the original as the cause, never replace it. A clean outward message is a surfacing decision at the boundary and doesn't require destroying the cause internally. See `error-context.md`.

## Using errors for normal control flow

**The pattern:** Throwing and catching exceptions to handle ordinary, expected outcomes (an expected "not found", a normal "validation didn't pass"), as the routine path rather than the exceptional one.
**Why it's tempting:** Exceptions jump straight to the handler, which can feel convenient for skipping levels.
**Why it bites:** It obscures the normal flow (the real logic hides in catch blocks), it's often slow, and it blurs the line between "expected outcome" and "something went wrong," making genuine errors harder to spot. When everything throws, throwing stops signalling a problem.
**Correction:** Expected outcomes are return values, not exceptions. Reserve exceptions/errors for the genuinely exceptional. An expected "not found" is a result the caller handles normally; only the unexpected is an error. See `classifying-failures.md`.

## Returning a default that masks the failure

**The pattern:** On failure, returning null, an empty list, a zero, or a default, so the caller can't tell the difference between "no result" and "it failed."
**Why it's tempting:** It keeps the call site simple, no error to handle, just a value.
**Why it bites:** The caller proceeds as if the operation succeeded with that value. An empty list from a *failed* fetch looks identical to a genuinely empty result, so the program runs on a false "there's nothing here" when really "we couldn't find out." Wrong conclusions, silently.
**Correction:** Make failure distinguishable from a valid empty result. Propagate the error, or return a type that explicitly represents failure-vs-success, so the caller must confront the difference. A default is acceptable only when it's genuinely correct regardless of why it was reached, which is rarer than it seems.

## Log-and-rethrow at every level

**The pattern:** Every layer catches, logs, and re-throws the same error.
**Why it's tempting:** Each layer "wants to log what it saw."
**Why it bites:** One failure appears five times in the logs at five levels, looking like five problems and burying the signal. Investigating becomes untangling which log lines are the same error.
**Correction:** Log once, at the point of final handling or at the surfacing boundary. Propagate silently (adding context, not log lines) until then. See `error-context.md`.

## Retrying without discipline

**The pattern:** Retrying a failed call immediately, in a loop, with no backoff, no jitter, no cap, no idempotency check, and no distinction between transient and permanent failures.
**Why it's tempting:** "Just try again" is the obvious response to a failed call.
**Why it bites:** Immediate un-jittered retries hammer a struggling dependency and turn a blip into an outage (retry storm). Uncapped retries turn a transient failure into a permanent hang. Retrying non-idempotent operations duplicates effects. Retrying permanent failures adds load for nothing.
**Correction:** Retry only transient failures, only idempotent operations, with exponential backoff, jitter, and a hard cap, ideally behind a circuit breaker. See `resilience-patterns.md`.

## Limping forward on an unrecoverable error

**The pattern:** Catching a failure that left the program in a bad or incomplete state, then continuing anyway.
**Why it's tempting:** Continuing feels more robust than stopping.
**Why it bites:** The program runs on corrupt or incomplete state, producing wrong results or persisting bad data, and the eventual symptom is far from the cause. Recovering from what's really a fatal condition just delays and disguises the failure.
**Correction:** When continuing would corrupt data or produce wrong results, fail fast and loud. Robustness is stopping cleanly, not limping on bad state. See `fail-fast-vs-graceful.md`.

## Crashing over a non-essential failure

**The pattern:** Letting a failure in something minor (a recommendations widget, an analytics call, an optional enrichment) take down the whole operation or page.
**Why it's tempting:** Uniform "any error stops everything" handling is simpler than deciding what's essential.
**Why it bites:** A trivial, isolated failure causes a total outage it never warranted. The user loses the entire page because one widget's data source hiccuped.
**Correction:** Degrade gracefully, isolate non-essential failures so they remove only their own piece, while still logging/alerting the failure. Decide essential-vs-non-essential per failure. See `fail-fast-vs-graceful.md`.
