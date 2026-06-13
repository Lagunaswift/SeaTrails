---
name: data-modelling
description: "Use this skill whenever designing, reviewing, or changing how an application stores and structures its data, in any database or storage engine (relational, document, key-value, graph, or files). Trigger on phrases like 'design the schema', 'data model', 'how should I store', 'what fields', 'model this', 'database structure', 'should this be one table or two', 'how do I represent', 'relationship between', 'normalise', 'denormalise', 'should I embed or reference', or when defining the entities and relationships of a new feature or app. Also trigger proactively BEFORE writing storage code or migrations, and when reviewing an existing model for problems, because schema mistakes are expensive to reverse once data and code depend on them. Applies to designing from scratch, auditing a model, and evolving a model safely. Does NOT cover access control or security-rules modelling (that belongs to the security skills)."
---

# Data Modelling

A store-agnostic method for deciding what your data *is* before deciding where it goes. The principles here hold whether the destination is a relational database, a document store, a key-value cache, a graph, or flat files. Engine-specific tactics (index types, query syntax, partition keys) are deliberately out of scope; this is about the model, not the product.

## Why this matters more than most code

A function can be rewritten in an afternoon. A data model, once it has real data in it and code reading from it, resists change in proportion to how much depends on it. A wrong model doesn't announce itself; it taxes every feature built on top, forces awkward queries, breeds special-case code, and eventually demands a migration that's risky precisely because the model is load-bearing. The cost of a modelling mistake is paid continuously, by everyone who touches the data afterward. That asymmetry is why modelling deserves deliberate thought up front, even under time pressure.

## The cardinal question

**What is the real-world thing, and what is true about it independent of how any screen displays it or any feature uses it today?**

Model the domain, not the current UI and not the first feature. Screens change, features get added, the domain stays relatively stable. A model built around how the data is *shown* (or around one query you need right now) calcifies around a temporary shape and fights you the moment the second view or second feature arrives. Find the entities and truths that would still be true if you rebuilt the whole front end.

There is a real tension here with read-optimised stores, where you sometimes shape data around access patterns on purpose. That's a deliberate, eyes-open trade covered in `references/normalisation.md`, not a default. Start from the domain; depart from it only for a reason you can name.

## The method

Work these in order. Each phase has a dedicated reference with the depth.

### 1. Find the entities

Identify the distinct things in the domain. An entity is something with its own identity that you create, reference, and reason about on its own terms. The test: would you ever need to point at this thing from somewhere else, or track its existence independently? If yes, it's probably an entity, not a field on something else.

The common early mistake is burying a real entity as a field because it seems simpler now. The opposite mistake is promoting every attribute into its own entity and drowning in indirection. `references/entities.md` covers how to tell them apart, identity and keys, and the "is this a thing or a property of a thing?" decision.

### 2. Define the relationships

Determine how entities relate: one-to-one, one-to-many, many-to-many, and which side owns the link. Relationships are where models most often go subtly wrong, because the cardinality you assume today ("a user has one address") is frequently looser in reality ("a user has many addresses over time, and a current one"). Getting cardinality wrong is one of the most expensive mistakes to unwind. `references/relationships.md` covers cardinality, ownership and direction, many-to-many join modelling, and the most common cardinality misjudgements.

### 3. Decide what to keep together and what to separate

This is the embed-vs-reference, normalise-vs-denormalise decision. It's the highest-leverage modelling choice and the one most distorted by engine habits. The principle is store-agnostic: data that's a genuine part of one thing and has no independent identity belongs with it; data that's shared, independently addressable, or independently changing belongs on its own. `references/normalisation.md` covers the trade-off honestly, including when duplication is the right call, what it costs (every copy must be kept consistent), and how to decide based on read/write patterns rather than dogma.

### 4. Model state and time

Most real domains have things that change status, have a history, or are valid only for a period. Naive models store only the current state and silently destroy history that the business later turns out to need. Decide deliberately: do you need the current value only, or the sequence of changes? Is "deleted" a true removal or a state? `references/state-and-time.md` covers state machines as data, event/history vs current-state modelling, soft deletion, temporal validity, and audit trails.

### 5. Make illegal states unrepresentable

The best-modelled data makes bad states impossible to write down in the first place, rather than relying on application code to remember the rules. If two fields must never disagree, model them so they can't. If a record must have exactly one of three shapes, model the shapes, not a soup of nullable columns where any combination is physically storable. `references/integrity.md` covers constraints, making invalid combinations unrepresentable, where to enforce invariants, and the nullable-field trap.

### 6. Pressure-test against real use

Before committing, run the model against reality: the actual queries the app will make, the writes under concurrency, the data volume at scale, and the changes you can already foresee. A model that's elegant but can't answer the questions the app needs, or that requires a five-way assembly for the most common read, is the wrong model. `references/validation.md` covers walking your real access patterns through the model, spotting the read that's painful, and catching scale and concurrency problems before they're baked in.

## Evolving an existing model

Models change. The skill of changing one safely, without losing data or breaking readers, is its own discipline: additive-first changes, the expand/migrate/contract pattern, backfilling, and handling records written under the old shape. When the task is "change this existing model" rather than "design a new one," read `references/evolution.md`.

## Anti-patterns

The recurring ways data models go wrong, each with its correction, in `references/anti-patterns.md`:

- Modelling the UI or the first feature instead of the domain
- Burying a real entity as a field (or the reverse: entity-itis)
- Getting cardinality wrong, especially assuming one where reality has many
- Denormalising by default (or normalising dogmatically when reads demand otherwise)
- Storing only current state and destroying history the business needs
- Nullable-column soup where illegal combinations are physically writable
- A grab-bag "metadata" or JSON blob that becomes an unqueryable dumping ground
- Using a natural key that turns out not to be stable or unique
- Premature optimisation for scale the app doesn't have, at the cost of correctness
- No plan for how the model changes, so every change is a crisis

## Reference index

- `references/entities.md`: identifying entities, identity and keys, thing-vs-property
- `references/relationships.md`: cardinality, ownership, direction, many-to-many, common errors
- `references/normalisation.md`: embed vs reference, when to duplicate, the consistency cost, deciding by access pattern
- `references/state-and-time.md`: state machines, history vs current state, soft delete, temporal validity, audit
- `references/integrity.md`: constraints, unrepresentable illegal states, where invariants live, nulls
- `references/validation.md`: pressure-testing against queries, writes, scale, and foreseeable change
- `references/evolution.md`: changing a live model safely (expand/migrate/contract, backfills, mixed-shape data)
- `references/anti-patterns.md`: the failure modes above, each with its correction
