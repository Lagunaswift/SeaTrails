# Data Modelling Anti-Patterns

Each entry is a recurring way models go wrong, why it's tempting, why it bites, and the correction. When you catch yourself doing one, stop and switch.

## Modelling the UI or the first feature

**The pattern:** The schema mirrors the current screens or the one feature you're building now. Tables named after pages, fields grouped by where they're displayed.
**Why it's tempting:** The UI is concrete and in front of you; the domain is abstract. Modelling what you can see feels safer.
**Why it bites:** Screens and features change constantly; the domain is stable. The moment a second view or feature needs the data differently, the UI-shaped model fights you, and you're reshaping storage to chase a layout change.
**Correction:** Model the domain, the things and truths that hold regardless of how they're displayed. Ask what would still be true if you rebuilt the entire front end. See the cardinal question in the main skill.

## Burying an entity as a field

**The pattern:** Storing what's really a distinct thing as a text field on another record (`author_name` instead of an `author` entity).
**Why it's tempting:** One fewer entity, one fewer join, simpler today.
**Why it bites:** The moment you need more about that thing, or it's shared, or it changes, you're extracting an entity from denormalised text with no clean identity, guessing which duplicate strings are the same thing.
**Correction:** Apply the entity tests (`entities.md`). If it has independent identity, lifecycle, or can occur many times, it's an entity. Promoting later is harder than starting right.

## Entity-itis

**The pattern:** The opposite, every attribute promoted to its own entity, so reading one logical record assembles a dozen.
**Why it's tempting:** It feels rigorous and maximally flexible.
**Why it bites:** Crushing indirection, expensive common reads, a model nobody can hold in their head, all to make independently-addressable things that are never addressed independently.
**Correction:** Intrinsic, singular, never-referenced values are fields. Spend indirection only where identity or sharing justifies it.

## Getting cardinality wrong

**The pattern:** Assuming "one" where reality has "many", usually across time (one address, one status, one price).
**Why it's tempting:** Today there's only one, and one is simpler.
**Why it bites:** Reality loosens, and widening a one-to-one to a one-to-many after data and references exist is a painful migration.
**Correction:** Pressure-test every "one", is it one *forever* or one *right now*? Lean to the looser cardinality when uncertain and the cost is low. See `relationships.md`.

## Denormalising by default

**The pattern:** Duplicating data across records reflexively, or because "that's how this store works", without a consistency plan.
**Why it's tempting:** Reads are fast and the whole picture is in one place.
**Why it bites:** Every copy of mutable data drifts. A missed update makes one copy lie, and stale duplicates cause the hardest-to-detect bugs because nothing errors, the data is just quietly wrong.
**Correction:** Keep a single source of truth. Duplicate only deliberately, for immutable snapshots or measured hot reads, and only with a concrete mechanism that keeps copies consistent. See `normalisation.md`.

## Normalising dogmatically

**The pattern:** Shattering data that's always read together, born together, and changed together, in the name of normal forms.
**Why it's tempting:** It feels correct and disciplined.
**Why it bites:** Every common read becomes a multi-way assembly for purity that buys nothing, because the data never actually varies independently.
**Correction:** Normalisation serves correctness and flexibility. When it serves neither and only adds assembly cost, combine. Judgement over dogma.

## Destroying history

**The pattern:** Storing only current state, overwriting on every change.
**Why it's tempting:** One value per field is the obvious default and the simplest model.
**Why it bites:** The business eventually asks what something *was*, or when it changed, or who changed it, and the answer was overwritten and is unrecoverable.
**Correction:** When history is plausibly needed, keep it, current state plus an append-only change log is cheap now and impossible to reconstruct later. See `state-and-time.md`.

## Nullable-column soup

**The pattern:** One wide table with nullable fields for every variant and a status string, so contradictory combinations are physically storable.
**Why it's tempting:** One table is fewer things to manage than several variant types.
**Why it bites:** Most of the combinations the nullables permit are illegal, and the rules live only in code, so the one path that forgets writes a contradiction that sits there corrupting reads.
**Correction:** Make illegal states unrepresentable, model variants so each holds only its valid fields, and constrain what you can't structure away. See `integrity.md`.

## The metadata blob dumping ground

**The pattern:** A catch-all JSON/`metadata` field where miscellaneous data accretes.
**Why it's tempting:** Infinitely flexible, no schema change needed to add something.
**Why it bites:** Anything in the blob is hard to query, filter, constrain, or index. It becomes an undocumented swamp where data you later need to query lives in a form you can't query, and nobody knows what keys exist.
**Correction:** Data you'll query, filter, or constrain belongs in real fields. A blob is acceptable only for genuinely opaque, never-queried payloads. The moment you filter by something inside the blob, it should have been a field.

## Fragile natural keys

**The pattern:** Keying an entity off a business value (email, username, SKU) assumed unique and stable.
**Why it's tempting:** It's already there and looks unique, why generate an id?
**Why it bites:** Business values change and get reused; when the key changes, every reference to it breaks, and a "unique" business code that turns out non-unique corrupts identity.
**Correction:** Use a stable surrogate key as identity. Keep natural keys as unique constraints and lookups, never as the thing references point at. See `entities.md`.

## Premature scale contortion

**The pattern:** Distorting the model for billions of records when you'll have thousands.
**Why it's tempting:** It feels forward-thinking and senior.
**Why it bites:** You pay in complexity and lost correctness now, for a scale problem you may never have, and the contorted model is harder to reason about and change.
**Correction:** Model for correctness and clarity first. Avoid choices that *can't* scale, but don't pre-build for scale you can't justify. A clean model is the easiest to optimise when a real volume problem actually arrives. See `validation.md`.

## No evolution plan

**The pattern:** Treating the model as fixed, so every change becomes an ad-hoc scramble.
**Why it's tempting:** The model feels done when the app ships.
**Why it bites:** Models always change. Without the expand/migrate/contract discipline, changes break readers or corrupt data, and "simple" schema changes become production incidents.
**Correction:** Assume the model will change and change it safely, additive-first, breaking changes split into safe sequential steps. See `evolution.md`.
