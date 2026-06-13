# Single Source of Truth

Every fact the program holds should have exactly one canonical home. Everything else that needs that fact reads from the home or computes from it; nothing keeps its own independent copy. This is the cardinal rule of state management, and it's the one principle that, held consistently, prevents the entire category of drift bugs, the bugs where the program believes two contradictory things about the same fact because it's storing that fact in two places.

## Why a second copy is a synchronisation problem forever

The moment a fact lives in two places that can each change independently, correctness depends on every piece of code that updates one *also* updating the other, every time, forever, including the code paths you'll write next year and the ones you'll forget about:

- Update path A changes copy 1 but not copy 2. Now they disagree. Every reader of copy 2 is working from a stale belief.
- A new feature adds a third writer that updates copy 1, doesn't know copy 2 exists, and the drift widens.
- The bug doesn't announce itself, nothing errors, the program just holds inconsistent state and produces wrong results that surface far from the cause (which is exactly the data-and-state debugging difficulty).

No amount of careful updating *fully* solves this, because it relies on perfect discipline across all writers for all time. The only robust fix is structural: don't have the second copy. One home means there's nothing to drift against.

## Establishing the canonical home

For each genuine fact (from `identifying-state.md`), decide its single home deliberately:

- **The home is wherever the fact naturally originates or is owned.** The input lives where it's entered. The fetched data lives in the store that fetched it. The "where are we in the process" lives in the one place that runs the process. Put the fact where its owner is, and let others refer to it there.
- **Everyone else reads from the home or receives it**, rather than copying it. In a frontend, components read the shared state rather than each holding a copy. In a backend, the request handlers read the one store rather than each caching the value. The fact flows *out* from its home to the readers; it doesn't get *replicated* into them.
- **Derived consequences are computed from the home** (see `derived-state.md`), not stored alongside it. The home holds the input; the consequences are functions of it.

## The cost of every duplicate

Treat every proposed second copy of a fact as a cost to be justified, not a convenience to be taken:

- It's a synchronisation obligation on all current and future writers.
- It's a place the program can hold a contradiction.
- It's a bug that's hard to detect (no error) and hard to trace (effect far from cause).

Against that, the benefits people reach for a copy for, "it's convenient to have it here too", "it saves a lookup", are usually not worth it. The default answer to "should I store this fact here as well?" is no, read it from its home instead.

## When a copy is genuinely necessary

Some copies are unavoidable, and the point is deliberateness rather than zealotry. A copy is justified when:

- **Performance genuinely demands it.** Reading from the home is too slow or too frequent, so a local cache of the fact is warranted. This is the derived-state caching case (see `derived-state.md`): legitimate, but it comes with a mandatory invalidation/consistency plan. A cache without an invalidation strategy is just drift you scheduled.
- **A boundary forces it.** The fact lives in one system and is needed in another (a client holding a copy of server state, one service holding data owned by another). The copy crosses a boundary you can't read across cheaply or synchronously.
- **A snapshot is the intent.** You deliberately want the value *as it was at a moment*, independent of later changes to the source (the price at order time). This isn't really a duplicate, it's a distinct fact that happens to have started as a copy, and it's correct for it to diverge from the source. Recognise it as its own state, not a copy to keep synced.

In every justified case, the rule becomes: **one writable home, and the copies are explicitly downstream of it**, kept consistent by a named mechanism (re-fetch, invalidation, event propagation, accepted staleness with a bound). The home is the truth; the copies are caches of the truth that know they're caches. What you never want is two homes that both accept writes and are each treated as authoritative, that's not a cache, that's a contradiction waiting to happen.

## The reconciliation question

Whenever you do have a copy, you owe an answer to: *what happens when the home changes?* The acceptable answers are roughly: the copy is re-derived/re-fetched, the copy is invalidated and recomputed on next read, the copy is updated by propagation from the home, or the copy is a snapshot that's *meant* to be frozen. The unacceptable answer is "the copy is updated by whoever remembers to update it", because that's the drift bug restated as a plan. If you can't name the reconciliation mechanism, you don't have a managed copy, you have a future inconsistency.
