# Relationships

Relationships connect entities, and they're where models most often go subtly wrong. The errors are quiet: you assume a cardinality that's true today, the model encodes it rigidly, and reality turns out looser. Fixing a wrong relationship after data exists is among the most expensive migrations, so this phase repays care.

## Establish cardinality honestly

For each relationship, ask how many of each side can relate to the other, and ask it about *reality over time*, not about the demo:

- **One-to-one.** Each A relates to exactly one B and vice versa. Genuinely rare. Often a one-to-one is really "one-to-at-most-one" (the B is optional) or a sign the two should be one entity. If you're splitting one real thing into two entities with a one-to-one link, ask why they aren't one entity; legitimate reasons exist (separate lifecycle, separate access, optionality, size) but "it felt tidy" isn't one.
- **One-to-many.** One A has many Bs, each B belongs to one A. The workhorse relationship. The B holds a reference to its A.
- **Many-to-many.** Many As relate to many Bs. This always needs a third thing to represent the link (see below). The most commonly under-modelled relationship, because people start with what looks like one-to-many and discover the "many" later.

## The cardinality you assume is usually too tight

The classic mistake is assuming "one" where reality has "many", especially across time:

- "A user has one address" becomes false fast: people have several, and a current one, and old ones you may need for past orders.
- "An order has one status" becomes false fast: it has a current status and a *history* of statuses, which the business will eventually want.
- "A product has one price" becomes false fast: it has a current price and a price history, and maybe per-region or per-currency prices.
- "A person has one email" becomes false fast: many, with one primary.

When you catch yourself modelling "one", pressure-test it: is it truly one forever, or one *right now*? If it's one-right-now with history that matters, you have a one-to-many plus a notion of "current" (see `state-and-time.md`). Loosening one-to-many later is far cheaper than discovering your one-to-one was always a lie. Lean toward the looser cardinality when uncertain and the cost of doing so is low.

## Ownership and direction

A relationship has a direction question (which side holds the reference) and an ownership question (whose lifecycle governs).

- **Which side references which** is partly an engine-shaped decision (where the foreign key or reference lives) but also a modelling one: the "many" side referencing the "one" side is the normal, flexible choice because it scales without rewriting the parent. Putting a growing list of child references on the parent is a common trap that makes the parent record grow unboundedly.
- **Ownership / cascade.** If the parent is deleted, what happens to the children? Owned children (an order's line items) die with the parent. Referenced-but-independent entities (the products those line items point at) must not. Decide cascade behaviour as part of the model, not as an afterthought when a delete first orphans something or wrongly destroys it.
- **Required vs optional.** Can a B exist without an A? A line item with no order is probably nonsense (required); a task with no assignee is fine (optional). Optionality is part of the relationship's definition and drives nullability and integrity rules.

## Modelling many-to-many

A many-to-many relationship cannot be stored as a relationship alone; it needs a third entity, the join (or association) entity, representing one link between one A and one B.

- The join entity is identified by the pair (A, B), often as a composite identity.
- **The join is frequently a real entity in disguise**, with attributes of its own. "Student enrolled in course" isn't just a link; it has an enrolment date, a grade, a status. The moment the link has its own attributes, it's a first-class entity and naming it as one (`Enrolment`, not `student_courses`) clarifies the whole model. Watch for this; an unnamed join table that accretes columns is a missed entity.
- If the link can occur more than once between the same pair (the same student enrolling in the same course in different terms), the pair alone isn't a unique identity and the join needs its own surrogate key plus the qualifying attribute (term).

## Self-referencing and hierarchies

Entities that relate to themselves (an employee's manager, a category's parent, a comment's reply-to) are common and fine. Decide the shape:

- A simple parent reference handles trees where you mostly walk up or down one level.
- Deep hierarchies you need to query across (all descendants, the whole ancestry) are awkward with a bare parent pointer and may need a different representation. Recognise early whether you'll query *across* the hierarchy or just *one hop*, because that determines whether a parent pointer suffices.

## Derived relationships

If a relationship can be computed from others, don't store it as a third independent link that can drift out of sync with the two it's derived from. Storing a derivable relationship creates a consistency burden (the stored copy and the computed truth can disagree). Store it only as a deliberate denormalisation with a plan to keep it consistent (see `normalisation.md`), never by accident.
