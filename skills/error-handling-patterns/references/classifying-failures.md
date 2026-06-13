# Classifying Failures

Before you decide how to handle a failure, classify it, because the class determines the correct response. The most common bad error handling comes from treating all failures as one undifferentiated thing: crashing on the recoverable, limping on the unrecoverable, retrying the unretryable. Two axes do most of the work.

## Axis one: expected vs unexpected

- **Expected failures** are part of normal operation. They will happen, routinely, to correct code given correct conditions. A file that's optionally present and isn't there. A user submitting input that doesn't validate. A uniqueness conflict when two people pick the same name. A network call that occasionally times out. These are not bugs; they're conditions the domain includes. They deserve explicit, designed handling, and often they shouldn't even be modelled as exceptional, they're just outcomes (see the control-flow note below).
- **Unexpected failures** mean an assumption was violated. A value that "can't be null" is null. A code path that "can't be reached" was reached. A data structure that's internally inconsistent. These usually indicate a bug, and the right response is the opposite of recovery: fail fast, loud, with maximum diagnostic information, so the bug gets found and fixed rather than papered over.

The error in conflating these: writing elaborate recovery for what's actually a bug (hiding it), or letting an expected, routine condition crash the program (fragility). When you classify a failure as "unexpected," resist the urge to handle it gracefully, graceful handling of a bug is just a quieter bug.

## Axis two: recoverable vs unrecoverable

- **Recoverable** means there's a meaningful alternative action that lets the program continue correctly. Retry the transient call. Fall back to a default. Use a cached value. Ask the user to fix their input. Skip the optional step. Recovery is only real if the program is *correct* afterward, not merely still running.
- **Unrecoverable** means there's no correct way to continue from here. The data needed is gone, the invariant is broken, the required dependency is down with no fallback. Continuing produces wrong results or corrupts state. The correct response is to stop this operation (and only this operation, not necessarily the whole system, see `fail-fast-vs-graceful.md`) and surface the failure.

The trap is the *false* recovery: returning a default, a null, or an empty result that lets execution continue when the failure was actually unrecoverable. The program limps on with wrong state, and the real failure resurfaces later as a corruption or a nonsensical result far from the cause. A "recovery" that leaves the program in a wrong state is worse than the crash it avoided.

## The two axes combine

|                | Recoverable | Unrecoverable |
|----------------|-------------|---------------|
| **Expected**   | Handle it: retry, fallback, ask user. The common, designed case. | Surface it cleanly: it's a known failure mode with no local fix, so report it to a layer/user that can respond. |
| **Unexpected** | Rare and suspicious: recovering from a bug. Usually means fail fast anyway and fix the assumption. | Fail fast and loud: this is a bug, stop and get maximum diagnostics. |

The most important cells are the corners: expected-recoverable (design the handling) and unexpected-unrecoverable (fail fast, don't hide). Most bad error handling moves a failure into the wrong cell, recovering from a bug, or crashing on a routine condition.

## Transient vs permanent (a sub-distinction within recoverable)

For failures in external calls, one more split decides whether to retry:

- **Transient**: likely to succeed if tried again. A timeout, a temporary network blip, a `503`, a rate-limit response, a brief contention conflict. Retrying (with backoff, see `resilience-patterns.md`) is appropriate.
- **Permanent**: will fail identically every time. A `404`, a `400` bad request, an authentication failure, a validation rejection. Retrying is pointless and harmful, it adds load and delays the inevitable error without changing the outcome. Retry only the transient; surface the permanent immediately.

Mistaking permanent for transient produces retry storms against a request that can never succeed. Mistaking transient for permanent gives up on a call that a single retry would have fixed. The classification has to be specific: in HTTP terms, retry `5xx` and `429`, never retry `4xx` except `429`.

## Programmer error vs operational error

A framing worth holding alongside the axes: **programmer errors are bugs in your code** (a wrong type passed, an impossible state, a typo'd property), and they should be fixed, not handled, the right "handling" is to fail fast so you notice and fix it. **Operational errors are expected runtime conditions** (the network is down, the disk is full, the input is bad) that correct code must anticipate and handle. Trying to "handle" a programmer error at runtime usually means catching a bug and continuing, which hides it. The distinction stops you wrapping defensive try/catch around what is really a bug to be fixed.

## How classification flows into the rest

Every later decision keys off this classification:

- Expected-recoverable, transient, becomes a retry (resilience patterns).
- Expected-recoverable, permanent, becomes a fallback or a propagation to where it can be handled.
- Expected-unrecoverable becomes clean surfacing.
- Unexpected (programmer error) becomes fail-fast with diagnostics.

Classify first; the right handling usually falls out of the class.
