# Integrity: Making Illegal States Unrepresentable

The strongest data models make bad data physically impossible to write, rather than trusting every piece of application code, present and future, to remember the rules. Every invariant you enforce in the shape of the data is one you never have to debug as corrupted data later. This is the highest-value idea in modelling, and it's entirely store-agnostic in principle even where enforcement mechanisms differ.

## The core idea

If a combination of values should never exist, the best model makes it impossible to store that combination at all. The next best makes it enforced by a constraint the store checks. The weakest relies on application code remembering, which means the invariant holds only as long as every code path, forever, gets it right. Code forgets; shape doesn't.

Worked contrast: an entity that must be in exactly one of three states, each with different associated data.

- **Weak:** one table with nullable columns for every state's data, and a status string. Now `status = "shipped"` with a null shipped-date, or `status = "draft"` with a tracking number, are all physically storable. The rules ("shipped implies a date", "draft implies no tracking") live only in code, and any missed path writes a contradiction. You will later find records that violate rules you "always enforced".
- **Strong:** model the states so each carries only its own valid data, such that a draft simply has nowhere to put a tracking number and a shipped record cannot lack its date. The illegal combinations have no representation. The bug class is designed out, not guarded against.

You won't always reach the fully-unrepresentable ideal, especially in stores with flat, permissive shapes. But moving *toward* it, every field that can't hold a bad value, every constraint the store enforces, removes a category of future corruption.

## Constraints belong in the data, not just the code

For invariants you can't make structurally impossible, push enforcement as close to the data as the store allows:

- **Uniqueness** where duplicates would be wrong (one primary email per user, one active subscription per account). A uniqueness rule enforced only in application code fails the moment two requests race (see concurrency, below).
- **Required-ness** for fields that must always be present. A field that's logically mandatory but technically nullable will eventually be null.
- **Valid ranges and sets** (a quantity that can't be negative, a status that must be one of a known set). A status constrained to an enum can't drift into ad-hoc string values.
- **Referential integrity** so a reference can't point at something that doesn't exist, leaving an orphan.

The principle: the data layer is the last line that *every* writer passes through. Application code is many lines, some of which you haven't written yet. Invariants enforced at the data layer hold regardless of which code, or which bug, tries to violate them.

## Why "the app enforces it" isn't enough

"The application validates this before writing" fails for reasons that compound:

- **Multiple writers.** A second service, a migration script, a manual fix, an admin tool, or a future feature writes data without going through the same validation. The invariant silently stops holding.
- **Races.** Two concurrent requests each check "is this unique?", both see "yes", both write. Check-then-act in application code cannot guarantee uniqueness under concurrency; only a constraint at the data layer can (see `relationships.md` and the data-and-state debugging concerns).
- **Bugs and drift.** The one code path that forgets the rule corrupts data that then sits there, poisoning reads, until someone notices the contradiction months later with the cause long gone.

Application-level validation is good for fast user feedback and rich error messages. It is not a substitute for the invariant living in the data. Do both: friendly checks in the app, hard guarantees in the model.

## The nullable trap

Nullable fields are where illegal states sneak in, because every nullable field doubles the combinations of states a record can be in, and most of those combinations are meaningless:

- A field that's only meaningful in some states (a cancellation reason that's relevant only when cancelled) becomes a source of contradiction when it's populated in the wrong state or absent in the right one.
- Three nullable fields produce eight presence-combinations; if only two are valid, the other six are illegal states your model permits. Multiply across many fields and the space of writable-but-invalid records dwarfs the valid one.
- The fix is structural where possible (model the variants so each holds only its own fields) and constraint-backed where not (a check that ties the field's presence to the state that requires it). At minimum, know which null-combinations are legal and constrain the rest.

Distinguish the three meanings null can carry, because conflating them is its own bug: "not yet known", "known to be absent", and "not applicable in this state". If those mean different things in your domain, a single nullable field can't represent them cleanly and you need an explicit model for the distinction.

## Where to enforce: a hierarchy

When choosing how to protect an invariant, prefer in this order:

1. **Make it structurally impossible** (the bad state has no representation). Strongest, no enforcement needed because nothing can express the violation.
2. **A constraint the store enforces** (uniqueness, foreign key, check, not-null, enum). Strong, holds against all writers and races.
3. **A single chokepoint in code** that all writes provably go through. Acceptable when the store can't express the rule, but only as strong as the guarantee that nothing bypasses it.
4. **Scattered validation at call sites.** Weakest, holds only until one site forgets. Use for UX feedback, never as the sole guarantee of a real invariant.

Climb as high up this list as the invariant's importance and the store's capabilities allow. The cost of enforcement is paid once, at design time; the cost of corrupted data is paid repeatedly, forever, by everyone downstream.
