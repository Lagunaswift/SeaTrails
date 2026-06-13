# Keeping Together vs Separating (Normalisation)

This is the highest-leverage modelling decision and the one most distorted by engine habits. Relational training says "normalise everything"; document-store training says "embed for your reads." Both are tactics, not principles. The principle underneath is store-agnostic, and this file is about reasoning to the right answer rather than defaulting to a tribe.

## The underlying principle

**Data that is a genuine, intrinsic part of one thing, with no independent identity, belongs with that thing. Data that is shared, independently addressable, or changes on its own schedule belongs on its own.**

That single sentence decides most cases:

- An order's shipping address *at the time of the order* is part of that order (it's a snapshot, it must not change when the customer later edits their address book). Keep it with the order.
- The customer's current address book is shared across orders and changes independently. It's its own thing, referenced.
- A blog post's title is intrinsic to the post. A blog post's author is a shared entity referenced by many posts.

Notice the address appears in both answers, in different roles. That's the key insight: the same real-world data can be "part of" one thing (a historical snapshot) and "its own thing" elsewhere (the live record). They are different data with different truth conditions, and conflating them is a real bug, not a style choice.

## The honest trade-off

Separating (referencing/normalising) and combining (embedding/duplicating) trade the same two costs against each other:

- **Separating** gives you one source of truth. Update it once, everyone sees the change. The cost is assembly: reading the whole picture means following references and combining, which is more work per read and can be slow or awkward.
- **Combining** gives you the whole picture in one place, fast to read. The cost is consistency: every copy of duplicated data must be kept in sync, and the more copies, the more places a missed update creates a lie. Duplicated data *will* drift unless something actively maintains it.

There is no free option. You are choosing which cost to pay: assembly cost on reads, or consistency cost on writes. Choose based on which dominates in your actual app.

## How to decide

Decide by access pattern and change pattern, not by which database you're using:

1. **Does the data have independent identity or get shared/referenced elsewhere?** If yes, it must have a canonical home as its own entity, full stop. You may *additionally* duplicate it for reads, but the source of truth is singular. Never let duplicated data be the only copy.
2. **How does it change?** Data that changes often, and where every reader must see the latest, resists duplication (every change means updating every copy). Data that's effectively immutable once written (a historical snapshot, a log line) is safe to duplicate freely, because it never needs re-syncing.
3. **What's the read/write ratio and shape?** If the common read needs the combined picture and reads vastly outnumber writes, combining/duplicating earns its consistency cost. If writes are frequent or the data is read in many different combinations, separating keeps you honest.
4. **What's the blast radius of inconsistency?** If a stale duplicate is merely cosmetic, duplication is cheap. If a stale duplicate means a wrong charge or a wrong permission, the consistency cost is severe and separation is safer.

## When duplication is the right call

Duplication is a legitimate, sometimes necessary tool. Use it deliberately when:

- The data is an immutable snapshot (price/address/terms *as of* an event). This isn't really duplication; it's a distinct historical fact that happens to resemble current data. Always store these.
- Reads dominate, the combined shape is needed constantly, and assembly is genuinely too expensive, and you have a concrete plan to keep copies consistent (or the source is immutable).
- The store's nature makes assembly across entities expensive enough that modelling around the read is the paradigm. That's a valid reason, but name it: "I am duplicating because my store penalises cross-entity reads and this read is hot," not "embedding is just how you do it."

The rule is: duplicate on purpose, with a consistency plan, never by accident or default.

## The consistency plan is mandatory if you duplicate mutable data

If you duplicate data that *can* change, you owe an answer to "what keeps the copies in sync?" The options are roughly: update all copies in one atomic operation, accept eventual consistency with a reconciliation process, or treat one copy as derived and rebuild it from the source. "I'll remember to update both" is not a plan; you won't, and the model shouldn't depend on human memory for correctness. If you can't state the consistency mechanism, don't duplicate mutable data.

## Don't normalise dogmatically either

The reverse mistake is real: shattering data into so many separate entities that the simplest read requires assembling many of them, in the name of purity, when the data is always read together and rarely changes independently. If two things are born together, die together, change together, and are always read together, the "separate them because normalisation" instinct is wrong. Combine them. Normalisation serves correctness and flexibility; when it serves neither and only adds assembly cost, it's cargo-culting.

## A practical default

When genuinely unsure: start normalised (separate, single source of truth), because it preserves the most options and prevents the consistency bugs that are hardest to detect. Denormalise specific hot paths later, when you have a measured read problem and a consistency plan, rather than pre-emptively. You can always add a duplicate for speed; you cannot easily recover a clean source of truth you flattened away.
