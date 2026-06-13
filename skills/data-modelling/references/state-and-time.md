# State and Time

Most real domains have things that change status, accumulate history, or are valid only for a period. The default naive model stores only the current value and silently discards the past. That's fine until the business asks a question about history that the model threw away, and now the answer is gone forever. Decide deliberately what about change and time you need to keep.

## Current state vs the history of states

The first question for any entity that changes: do you need only its current value, or the sequence of how it got there?

- **Current-state-only** is correct when the past genuinely doesn't matter (a user's display name, where nobody cares what it used to be). Store one value, overwrite on change.
- **History matters** far more often than first-pass models assume. "What was the order's status last Tuesday?" "When did this go from trial to paid?" "Who changed the price, and from what?" If any such question is plausible, storing only the current value destroys the answer. Once you overwrite, the previous value is unrecoverable; you can't reconstruct history you didn't keep.

When history matters, you have two broad shapes:

- **Current state plus a separate history/log** of changes. The entity holds its current value for fast reads; a separate append-only record captures each transition (what changed, when, by whom, from/to). Common and pragmatic.
- **Events as the source of truth**, with current state *derived* by replaying them. The log of what happened is canonical; "current state" is a computed projection. Powerful for domains where the sequence of events *is* the business (finance, audit-heavy systems), heavier to build, overkill for simple cases. Recognise when your domain is event-shaped, but don't reach for full event-sourcing for a to-do app.

The cheap insurance: if you're unsure whether history will matter, an append-only change log alongside current state is far easier to add now than to reconstruct later from data you didn't record.

## State as a modelled thing, not a free-text field

When an entity moves through defined statuses (draft, then submitted, then approved, then paid), model the states and the legal transitions, don't leave status as an unconstrained string that any code can set to anything.

- Enumerate the valid states explicitly so an invalid status can't be written.
- Know which transitions are legal. Not every state can follow every other; "paid" shouldn't jump back to "draft". Whether you enforce transitions in the data layer or application layer is an integrity question (see `integrity.md`), but the *model* should at least make the state set explicit and the transition rules known.
- A status field that drifts into a dozen ad-hoc string values nobody documented is a model that lost control of its own states. Watch for it.

## Soft deletion: is "deleted" a removal or a state?

Deciding how deletion works is a modelling choice with consequences:

- **Hard delete** removes the row. Simple, truly gone, unrecoverable. Correct when there's no reason to keep it and no references depend on it.
- **Soft delete** (a `deleted_at` timestamp or status) keeps the data and marks it inactive. Necessary when you need recoverability, audit, or when other records still reference it and a hard delete would orphan them or destroy history (an order referencing a now-"deleted" product still needs that product's details).

Soft delete has real costs that the model and every query must then honour: every read has to remember to exclude soft-deleted records, or deleted data leaks back into views. Uniqueness constraints get complicated (can a new record reuse the email of a soft-deleted one?). Decide deliberately, and if you soft-delete, make "exclude deleted" the default path so forgetting it fails safe. Don't soft-delete reflexively; it's not free.

## Temporal validity: data true only for a period

Some facts are true only for a span: a price effective for a date range, a subscription valid between two dates, an assignment that started and may end. Model the validity period explicitly (a start and an optional end) rather than storing only "current" and losing the ability to ask "what was true on this date?".

- "Current" then becomes a query (the record whose period contains now), not a separate stored flag that can disagree with the dates.
- Beware overlapping periods when they shouldn't overlap (two "current" prices). That's an integrity rule the model should make hard to violate.

## Audit trails

When you need to know not just *what* the data is but *who changed it and when*, that's an audit requirement, and it's a modelling decision, not something to bolt on later. Capturing actor, timestamp, and before/after at the point of change is cheap; reconstructing it after the fact from data that never recorded it is impossible. If the domain is regulated, financial, or trust-sensitive, assume audit is required and model it from the start.

## The through-line

Time and state are where models quietly lose information. The asymmetry is brutal: keeping history is cheap and reversible (you can always stop keeping it), while reconstructing discarded history is usually impossible. When in doubt about whether you'll need the past, keep it.
