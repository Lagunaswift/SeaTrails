# Intermittent Bugs and Heisenbugs

A bug that happens "sometimes" is a bug whose trigger you haven't identified yet. The word "intermittent" describes your knowledge, not the bug. The bug is deterministic; something you aren't controlling is varying. The whole job is to find and pin that variable.

## Find the hidden variable

Something differs between the runs that fail and the runs that pass. The usual suspects, roughly in order of frequency:

- **Timing and ordering.** Two operations race; the bug appears only when they finish in a particular order. Async code, callbacks, parallel requests, event handlers, effects firing in unexpected sequence.
- **Shared mutable state.** A value left over from a previous run, request, or test. Module-level state, a singleton, a cache, a connection pool, global config mutated somewhere.
- **External state.** A database row that exists on some runs, a file present or absent, a third-party API returning different data, a feature flag, time-of-day, the system clock.
- **Data shape.** The bug fires only for inputs with a specific property: empty, very large, unicode, null in an unexpected field, a record created before a schema change.
- **Concurrency level.** Fine with one user, breaks under load. The trigger is contention, lock ordering, or pool exhaustion that only appears at scale.
- **Randomness.** Anything seeded by `random`, UUIDs, hash ordering, or map/set iteration order that isn't guaranteed.
- **Environment.** Different machine, different CPU count, different timezone, different locale, different node/runtime version, different memory pressure.

## Make it happen on demand

You can't bisect a bug you can't trigger. Force the conditions:

- **For races**: add artificial delay (a sleep) on one side of the suspected race to widen the window and make the failure reliable. If a well-placed delay makes it fail every time, you've found the race and proven its shape.
- **For load/concurrency**: run the operation in a tight loop, or fire many in parallel, until it fails. A bug at 1-in-10000 becomes observable when you do 100000.
- **For data-dependent bugs**: collect the exact input that failed in the wild and replay it. Don't approximate it; get the real record.
- **For state leakage**: run the failing case twice in the same process. If the second run differs from the first, something is persisting between runs.
- **For ordering**: if a test suite fails only sometimes, run the tests in a fixed order, then shuffle deliberately. Order-dependent test failures mean shared state between tests.

## Heisenbugs: the bug that vanishes when observed

A bug that disappears when you add logging or attach a debugger is almost always a timing bug. The probe changed the timing enough to close the race window.

- The disappearance is itself a strong clue: it confirms timing-sensitivity. Don't be frustrated that the probe "fixed" it, treat it as a positive test result pointing at a race.
- Observe without perturbing timing: log to an in-memory buffer and dump it after, rather than synchronous I/O on the hot path. Use sampling or post-hoc tracing instead of blocking breakpoints.
- Reason about the concurrency model directly rather than stepping through it, since stepping serialises what was parallel and hides the bug.

## Once you can trigger it reliably

Drop back into the normal loop. A reliably-reproducing "intermittent" bug is just a bug. Bisect to locate, hypothesise the mechanism, confirm by toggling the variable (e.g. remove the artificial delay and show the race closes), then fix, usually by removing the shared state, enforcing ordering, making the operation idempotent, or adding proper synchronisation. Verify by running the forced-failure harness from above and showing it now holds across many iterations.

## Don't "fix" by retry alone

Wrapping a flaky operation in a retry can be a legitimate resilience measure for genuinely unreliable external calls. It is not a fix for a race condition or a logic bug in your own code; it just lowers the failure rate and hides the cause. Decide which situation you're in before reaching for retry.
