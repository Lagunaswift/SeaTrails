# Pressure-Testing the Model

A model that's elegant on paper can still be the wrong model. Before committing, run it against the reality it has to survive: the actual reads, the actual writes under concurrency, the actual volume, and the changes you can already see coming. This phase catches the mistakes that only show up in use, while they're still cheap to fix.

## Walk your real access patterns through it

List the questions the application will actually ask of the data, then trace each one through the model:

- **The common reads.** For each frequent read, what does answering it require? If the single most common read needs assembling five separate entities, that's a signal, either the model is over-separated for this access pattern, or you need a deliberate denormalisation (see `normalisation.md`). The most frequent read should be the easiest, not the hardest.
- **The common writes.** For each frequent write, how many places must change? If a routine update has to touch six records to stay consistent, you've probably duplicated mutable data without a sound consistency plan, or split something that should be together.
- **The filtering and sorting.** What do you filter, group, and sort by? Data you query on needs to be queryable, not buried inside a blob or derivable only by scanning everything. A field you'll filter by thousands of times a day shouldn't require unpacking a JSON column to read.
- **The reports and aggregates.** Anything that counts, sums, or rolls up across many records. These are where a model that's fine for single-record reads falls over.

If a needed question is awkward or impossible to answer against the model, that's the model telling you it's shaped wrong for the domain's real use. Better to hear it now.

## Stress the writes for concurrency

Reads forgive a lot; concurrent writes punish a sloppy model:

- For each write path, ask what happens if two of them run at once on the same data. Lost updates, duplicate creation, and check-then-act races (covered in `integrity.md`) are model problems as much as code problems, the model's constraints are what make them impossible rather than merely unlikely.
- Identify the invariants that must hold *across* a write (a balance that can't go negative, a count that must match reality). If keeping the invariant requires updating several records together, the model needs those to be updatable atomically, or it needs restructuring so the invariant lives in one place.
- A counter or aggregate maintained by hand across concurrent writers is a classic drift source. Either derive it (compute from the source of truth) or make its update atomic; don't trust increment-by-application-code under concurrency.

## Test against scale, but only real scale

Pressure-test volume honestly, in both directions:

- **The genuinely large collections.** Which entities grow without bound (events, logs, messages, line items)? A list of references stored on a parent record works at ten and dies at ten million. Unbounded growth attached to a single record is a model smell; growing things usually want to be their own collection that references the parent, not a field on the parent.
- **The hot records.** Is there a single record everything reads or writes (a global counter, one shared parent)? That's a contention and growth chokepoint the model should avoid concentrating.
- **Resist optimising for scale you don't have.** Equally important: don't contort the model for billions of records when you'll have thousands. Premature scale-optimisation buys complexity and pays for it in correctness and clarity, for a problem you may never have. Model for correctness first; the volume problems that are real will announce themselves, and the model that's clean is the easiest to optimise when they do. The goal is to avoid choices that *can't* scale, not to pre-build for scale you can't justify.

## Test against foreseeable change

You can't model for every future, but some changes are already visible on the horizon. Run them as thought experiments:

- "When we add a second type of X, does the model bend or break?" If a foreseeable variant forces a schema rebuild, consider whether a small generalisation now avoids it.
- "When this one-to-one becomes one-to-many" (it often does, see `relationships.md`), "how bad is that change?" If you already suspect the cardinality will loosen, leaning to the looser shape now is cheap insurance.
- "When the business wants the history of this" (see `state-and-time.md`), "have we already thrown it away?"

The balance: don't build speculative generality for changes that may never come (that's its own anti-pattern), but where a change is genuinely likely and the model would shatter on contact with it, a modest accommodation now beats a forced migration later. Judgement, not a rule: accommodate the changes you can actually see, ignore the ones you're inventing to justify complexity.

## The sign-off question

Before committing the model, you should be able to answer yes to: can it cleanly answer the reads the app actually needs, can it stay correct under the writes the app actually makes, will it hold at the scale the app actually reaches, and does it survive the changes you can already foresee? A no on any of these is cheaper to fix now, on a whiteboard, than after the data and the code depend on it.
