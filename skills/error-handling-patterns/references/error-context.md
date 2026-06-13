# Error Context: Don't Lose the Cause

An error is only as useful as the information it carries. A propagating error that arrives at the top as "something went wrong" with no cause, no operation, and no stack is a debugging nightmare you built for yourself. The discipline is: as an error travels up, it accumulates context and never loses its root cause.

## What an error should carry

A good error answers, by the time someone reads it: **what operation failed, on what specific input or resource, and because of what underlying cause.** Minimum useful content:

- **What was being attempted** in domain terms ("failed to load user profile"), not just the mechanical failure ("ECONNREFUSED").
- **The specific subject**: which user, which file, which record, which URL. "Failed to load user profile" is better than "failed to load"; "failed to load profile for user 4823" is better still. The specific value is often the entire clue.
- **The underlying cause**: the original error that triggered this one, preserved, not paraphrased away.
- **Enough to locate it**: the stack trace or equivalent, intact, pointing at where it actually originated.

An error missing the cause sends the reader hunting; an error missing the subject makes it unreproducible; an error missing the operation makes it meaningless out of context.

## Wrap with context, chain the cause

When an error crosses a layer that can add meaning, wrap it: create a new error that states what *this* layer was doing, and attach the original as its cause. This builds a chain that reads, top to bottom, as the story of the failure: "couldn't render the dashboard, because couldn't load the user, because the database query failed, because the connection timed out." Each layer added its piece; none destroyed the layer below.

The mechanism differs by language (a `cause` property, `raise ... from`, wrapped error types), and the specifics are in the language files. The principle is universal: **add context by wrapping, never by replacing.** The original error and its stack must survive inside the wrapper.

## The cardinal sin: replacing the cause

The single most damaging context mistake is catching an error and throwing a brand-new generic one that discards the original:

- Catching a detailed database error and throwing `new Error("save failed")` deletes the actual reason (constraint violation? timeout? disconnect?) and the original stack. The new error's stack points at your catch block, not at where it broke. You've converted a diagnosable failure into a mystery.
- This is seductive because the new message reads cleanly and the original looked noisy. But the noise was the information. Keep it as the chained cause even while presenting a clean message on top.

If you must present a clean, generic message to a user (you often should, see `surfacing-errors.md`), that's a *surfacing* decision at the boundary, and it does not mean throwing away the cause internally. Clean message outward, full cause inward and in the logs. The two are not in tension; they're different audiences.

## Don't double-handle: log-and-rethrow

A common anti-pattern that pollutes logs: every layer catches the error, logs it, and re-throws. The same failure now appears five times in the logs at five levels, making it look like five problems and burying the one that matters. Pick one place to log (usually where it's finally handled or surfaced at a boundary), and let it propagate silently with its context until then. Adding context while propagating is good; logging at every level is noise.

## Context costs nothing at write time, everything at debug time

Adding "for user 4823 while loading profile" to an error when you write the code costs seconds. Reconstructing which user and which operation from a context-free "load failed" in production, weeks later, costs hours and sometimes can't be done at all. The asymmetry strongly favours over-contextualising errors as you write them. When in doubt, attach more context, not less.

## Sensitive data in errors

One counter-pressure: errors often flow into logs and sometimes to users, so don't embed secrets, credentials, full personal records, or security-relevant detail in error messages or context. Include the *identifier* (user 4823) not the *contents* (their password hash, their full record). This is the one case where you deliberately carry less. The identifier is enough to investigate; the sensitive payload is a leak waiting to happen.
