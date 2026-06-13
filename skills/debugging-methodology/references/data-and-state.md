# Data and State

This is a bug *class* rather than a language: the problem is wrong, corrupted, or out-of-sync data, or state that two things touch in a bad order. These are among the hardest bugs because the symptom often appears far from the cause, in time and in code. The core loop still applies; locating is the hard part because you have to trace data back to its origin.

## Trace data to its origin

When a value is wrong, the cause is wherever it was last written correctly versus first written wrongly. Binary-search the data's journey:

- Find a point where the data is known-good and a point where it's known-bad. Bisect between them. The transition point is your bug.
- Walk *backwards* from the symptom. The crash reads a bad value; the bug is wherever that value was produced. Keep going upstream until you reach the write that should have been correct and wasn't.
- Don't assume the data was correct when it entered your view. The corruption may predate the code you're looking at: a bad migration, a previous version that wrote malformed records, a manual edit. Check the data's history, not just the current read path.

## Schema and shape mismatches

- **The data isn't the shape the code expects.** A field renamed, a type changed (string vs number), a nested object flattened, an array where a scalar was expected, an optional field that's sometimes absent. The code reads the old shape; the data has the new shape, or vice versa.
- **Records from different eras.** After a schema change, old records have the old shape and new ones have the new shape, so the bug fires only for old data. This is a classic "works for new signups, breaks for existing users." Reproduce against an *old* record specifically.
- **Boundary deserialisation.** Data crossing a boundary (JSON parse, API, queue, storage) loses its type guarantees. A value typed as a number in code can arrive as a string from the wire. Verify the runtime shape at the boundary, don't trust the declared type.
- **Null/empty/missing distinctions.** Absent key vs present-but-null vs present-but-empty are three different states that code often conflates. A bug that hits only some records is frequently one of these three being handled as another.

## Race conditions on shared state

Two operations touch the same state and the result depends on their ordering. See `intermittent-and-heisenbugs.md` for reproducing these; this is about the shapes:

- **Read-modify-write races.** Two actors read a value, each modifies its own copy, each writes back; one overwrites the other. Lost updates. The fix is usually atomic operations, transactions, or optimistic locking with version checks, not a lock bolted on after.
- **Check-then-act races.** Code checks a condition (does this exist? is there capacity?) then acts on it, but the state changed between check and act. The fix is making check-and-act atomic, not adding a second check.
- **Ordering assumptions.** Code assumes A completes before B because it usually does, until load or latency reorders them. Make the dependency explicit rather than relying on timing.

## Idempotency and duplicates

- An operation that isn't idempotent runs twice (a retry, a double-click, a redelivered message, a reconnected stream) and produces duplicate effects: double charges, duplicated records, repeated side effects. Duplicated output is the tell.
- The fix is making the operation idempotent (dedupe key, upsert, "exactly once" via a processed-marker), not trying to guarantee it only ever runs once, which you usually can't.
- Reconnecting streams or consumers that replay from a buffer without resetting accumulated state produce duplicate content. Reset accumulated state on reconnect.

## Caching and staleness

- A cache returning a value after the underlying data changed: stale read. Determine whether the cache should have been invalidated and wasn't, or the TTL is too long for the use.
- Multiple cache layers (in-memory, CDN, browser, query cache) where one is stale while others are fresh, producing inconsistent reads depending on which layer answers.
- A bug that fixes itself after a while (the TTL expiring) or after a restart (clearing in-memory cache) points squarely at caching.

## State leakage between contexts

- State that should be per-request, per-user, or per-session bleeding across boundaries: module-level mutable state, a misused singleton, a connection or client reused with leftover state, a tenant's data visible to another. This is both a correctness bug and a security one.
- Reproduce by running two contexts in sequence in the same process and checking whether the second sees the first's state.

## Confirming a data/state bug is fixed

Because these bugs are intermittent and far-removed, verification is stricter:

- Reproduce against the *actual* offending data, not a clean fixture.
- For races, use the forced-failure harness (artificial delay, parallel load) from `intermittent-and-heisenbugs.md` and show it holds across many iterations, not one lucky pass.
- For data corruption, check whether bad records already exist from before the fix; the fix stops new corruption but you may also need a one-off cleanup of the data the bug already damaged.
