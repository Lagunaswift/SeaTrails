# Derived State: Compute, Don't Store

Anything that can be computed from your source-of-truth state should be computed when needed, not stored as its own state. A stored derived value is a second source of truth for the same fact (see `single-source-of-truth.md`), and it goes stale the instant the underlying state changes and the stored copy doesn't. Computing it instead makes it correct by construction: it's always a current function of current state, with nothing to keep in sync.

## The default: derive

When you need a value that's a function of state you already hold, compute it at the point of use rather than storing it:

- The total is `sum(items)`, computed where it's shown, not a `total` field updated on every change to `items`.
- The filtered/sorted view is `sort(filter(items, criteria))`, computed from the items and the criteria, not a separate `visibleItems` array maintained in parallel.
- "Is the form valid" is `validate(fields)`, computed from the fields, not an `isValid` flag toggled by every field's change handler.
- The display name is `format(user)`, computed where displayed, not a stored `displayName` updated whenever the user changes.

In each case, storing the derived value introduces the exact bug deriving avoids: the underlying state changes through some path that forgets to update the derived copy, and now the total is wrong, the view shows stale items, the form thinks it's valid when it isn't. Derivation has no such path because there's nothing stored to forget.

## Why stored-derived is the most common runtime state bug

This deserves its own emphasis because it's so frequent. The pattern is seductive: you have `firstName` and `lastName` in state, you need `fullName`, and the obvious move is to store `fullName` too and update it whenever the names change. Now there are three pieces of state for two facts, and the third can disagree with the first two, the moment any code updates `firstName` without re-deriving `fullName`. The fix is to never store `fullName` at all: compute it from the two names wherever it's needed. The same shape recurs everywhere, a count beside a list, an `isEmpty` beside a collection, a cached total beside line items, a "has unread" beside the messages. Each is a derived value masquerading as state, and each drifts. Train the reflex: when about to store a value, ask whether it's a function of other state you hold, and if so, derive it instead.

## When caching a derived value is justified

Computing on demand is the default, not an absolute. Caching a derived value (storing the computed result) is legitimate when computing it every time is genuinely too expensive for how often it's needed:

- An expensive aggregation over a large collection, recomputed on every render or every request, may cost more than it's worth. Caching the result is reasonable.
- A derivation that's needed very frequently and changes rarely is a good caching candidate, the cost of staleness management is low (rare changes) and the savings are high (frequent reads).

But a cached derived value is a stored copy, and it carries the same mandatory obligation as any copy: **an invalidation plan.** You must answer "when the underlying state changes, how does the cache become correct again?" The acceptable mechanisms:

- **Recompute on change**: when the source state changes, recompute and replace the cached value, so it's never stale. (This is fine when changes are less frequent than reads.)
- **Invalidate on change**: when the source changes, mark the cache invalid; recompute lazily on next read. (Defers the cost to when it's needed.)
- **Memoise on the inputs**: cache keyed by the input values, so the cache is automatically correct when inputs change because a new key means a new computation. Many reactive frameworks and memoisation tools do exactly this, and it's the safest form because staleness is structurally impossible, change the inputs and you get a fresh computation, not a stale hit.

The unacceptable mechanism is the same as always: "update the cache wherever I remember to." A cached derived value without an invalidation strategy is just a stored-derived bug with a performance excuse.

## In-memory staleness mirrors the caching problem of data

The staleness failures here are the runtime twin of the caching problems in the data world (multiple cache layers disagreeing, a TTL too long, a value that "fixes itself" after a refresh). The same diagnostic tells apply: if a value is wrong but becomes right after some action recomputes it (a refresh, a re-render, a restart), you're looking at a stale stored-derived value, and the fix is to derive it instead of storing it, or to fix the invalidation. A value that's correct when computed and wrong when stored-and-stale is the signature of this whole class.

## The judgement in one line

Derive by default; cache a derivation only when measured cost justifies it, and only with an invalidation mechanism that makes staleness structurally impossible or promptly corrected, never by hand-maintained updates. The cheapest derived value to keep correct is the one you never stored.
