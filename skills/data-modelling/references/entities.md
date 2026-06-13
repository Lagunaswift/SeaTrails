# Entities

An entity is a thing in your domain that has its own identity: you create it, refer to it, and reason about it as a unit. Getting the entity boundaries right is the foundation, because relationships, integrity, and queries are all defined in terms of entities. Draw them wrong and everything above is built on sand.

## The "thing or property of a thing?" test

The central decision is whether something deserves to be its own entity or is just an attribute of another. Run these tests:

- **Independent identity.** Would you ever need to point at this thing from somewhere else, or refer to the same instance twice? An address you might reuse, reference, or share is an entity; a one-off note that belongs to exactly one record and nothing else points at it is a field.
- **Independent lifecycle.** Does it get created, updated, or deleted on its own schedule, separate from its apparent parent? A thing that outlives or predates its parent, or changes independently, wants to be its own entity.
- **Independent existence.** Can it exist without the thing it seems attached to? A category that exists whether or not any product uses it is an entity. A product's "weight" cannot exist without the product; it's a field.
- **Cardinality pressure.** If there can be *many* of it per parent, it's almost certainly an entity (or at least its own collection), not a field. "Phone number" looks like a field until you realise people have several.

If a candidate passes the identity and lifecycle tests, model it as an entity with its own key. If it's intrinsic to one record, has no independent identity, and there's exactly one of it, it's a field.

## Two opposite failure modes

- **Burying an entity as a field** because it's simpler today. You store `author_name` as text on every article instead of an `author` entity. It works until you need the author's bio, until two articles share an author whose name then changes, until you want to list an author's articles. Now the "simple" choice forces a painful extraction with messy data (which "John Smith" rows are the same person?). When in doubt and the thing has any identity of its own, lean toward making it an entity; promoting later is harder than it looks.
- **Entity-itis**: promoting every attribute into its own entity, so reading one logical record requires assembling a dozen tiny ones. This buries the model in indirection and makes the common read expensive for no benefit. A value that's intrinsic, singular, and never referenced independently should just be a field. Indirection has a cost; spend it where identity or sharing justifies it.

The skill is calibration. Most beginners err toward burying entities as fields (it looks simpler); some over-correct into entity-itis. Ask the four tests, don't guess.

## Identity and keys

Every entity needs a way to identify a specific instance unambiguously and stably.

- **Prefer a surrogate key** (a generated id with no business meaning) as the stable identity. It never needs to change because the real world changed, and nothing outside the system depends on its value.
- **Be wary of natural keys** (email, username, SKU, national ID) as the primary identity. They look unique and stable until they aren't: emails get reassigned, "unique" business codes get reused, people change names, a supposedly-national id isn't present for every record. Natural keys make excellent *unique constraints* and lookup keys; they make fragile *primary identities*. If you key everything off email and an email changes, every reference breaks.
- **A key should be stable for the life of the entity.** If the value you're keying on can ever change, it's the wrong key. Changing a primary identity after references exist is one of the most painful migrations there is.
- **Composite identity** (an entity identified only by the combination of two others, like a line item identified by order + product) is legitimate, common in join entities, and covered in `relationships.md`.

## Granularity: what's one entity vs several

Sometimes the question isn't entity-vs-field but where one entity ends and another begins:

- A thing that has two genuinely different sets of attributes depending on a type may be one entity with a type discriminator, or several entities. Decide by how much they share and how often you treat them uniformly.
- A thing whose attributes naturally cluster into groups that are queried, updated, or secured separately may be worth splitting even if it's "one thing" conceptually.
- Resist modelling a single real-world thing as several entities just because the current UI shows it across several screens. That's modelling the UI, not the domain (see the cardinal question in the main skill).

## Naming

Name entities for what they *are* in the domain, as a singular noun, not for their role in one feature or their position in a UI. `Subscription`, not `BillingScreenRow`. Good entity names are a sign the boundaries are right; if you can't name it cleanly, the boundary is probably wrong.
