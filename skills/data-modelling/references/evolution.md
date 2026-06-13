# Evolving a Live Model

Changing a data model that already has data in it and code reading from it is a different task from designing one. The data must survive the change, and readers must keep working throughout. The core skill is never requiring the data and the code to change in the same instant, because you can't change both atomically across a running system.

## The asymmetry that governs everything

Additive changes are safe; subtractive and mutating changes are dangerous.

- **Adding** a new optional field, a new entity, or a new relationship doesn't break existing readers, they just ignore what they don't know about. Safe to do anytime.
- **Removing or renaming** a field, **changing a type**, **tightening a constraint**, or **changing a relationship's shape** breaks any reader that still expects the old shape, and breaks any existing data that doesn't satisfy the new rule.

So the strategy is always: turn dangerous changes into a sequence of safe ones.

## Expand, migrate, contract

The general-purpose pattern for any breaking change, done as separate deployable steps:

1. **Expand.** Add the new shape *alongside* the old one. New field next to the old field, new structure beside the existing one. Nothing reads the new shape yet; nothing has stopped reading the old. Deploy. The system runs on the old shape with the new shape sitting unused.
2. **Migrate.** Get data and code onto the new shape gradually. Update writers to populate *both* old and new (so new writes are correct in both shapes). Backfill existing records into the new shape (see below). Switch readers over to the new shape one at a time. Throughout, both shapes are valid and consistent, so any mix of old and new code works.
3. **Contract.** Once nothing reads or writes the old shape, remove it. Drop the old field, the old constraint, the dual-write. Deploy. Only now is the old shape gone, and by now nothing depends on it.

Each step is independently deployable and independently reversible. At no point does correctness require the data and all the code to flip simultaneously. That's the whole point: you've replaced one impossible atomic change with three safe sequential ones.

## Backfilling existing data

The records written before your change still have the old shape. The new model has to cope with them, or they have to be brought forward:

- **Backfill** means writing the new shape into old records, usually as a batch job. For large datasets this runs in batches, not one transaction, to avoid locking everything and to be resumable if it fails partway.
- A backfill must be **idempotent and resumable**: safe to run again if it dies halfway, because for real data volumes it will sometimes die halfway. Track progress so a re-run continues rather than restarting or double-applying.
- While the backfill is in flight, some records have the new shape and some don't. Readers during this window must tolerate both. This is why dual-writing (step 2) comes before the backfill completes, new records are already correct, and the backfill catches up the old ones.

## Handling mixed-shape data

During any non-trivial evolution, and sometimes permanently, your store contains records written under different versions of the model. Plan for it rather than being surprised by it:

- Readers should degrade gracefully on records missing newly-added data, a sensible default, not a crash. A reader that assumes every record has a field added last week will fall over on every older record.
- A version marker on records can help code know which shape it's looking at, especially when shapes have diverged enough that inference is unreliable.
- Decide whether mixed shapes are a temporary migration state (backfill will unify them) or a permanent reality (old records are immutable history and will always have the old shape). The latter is common and fine, but the code must know the old shape is a permanent possibility, not a transient one.

## Tightening a constraint on existing data

Adding a stricter rule (now-required, now-unique, now-within-range) to data that predates the rule will fail if existing records violate it. The sequence:

1. Find the existing records that violate the new rule, there are almost always some, and the ones you didn't expect are the interesting ones.
2. Decide what to do with violators: fix them, migrate them to a valid state, or accept they're grandfathered and the constraint applies only going forward.
3. Clean up the data *first*, then add the constraint. Adding the constraint before the data complies just fails the migration. The constraint is the last step, not the first.

## Changing identity or relationships

The most expensive evolutions touch keys and relationships, because references depend on them:

- Changing what identifies an entity, or splitting one entity into two, or merging two into one, ripples through everything that references it. These are major migrations; approach them with the expand/migrate/contract discipline and expect them to span multiple deploys.
- Changing a cardinality (one-to-one becoming one-to-many) is usually additive in the safe direction (loosening) and breaking in the strict direction (tightening). Loosening is the easier path, another reason to lean loose when first modelling (see `relationships.md`).

## Before any evolution

- **Know your current data's actual shape**, not the shape you think it has. Real data accumulated under old code and manual fixes contains surprises. Inspect it before assuming.
- **Have a way back.** A backup, a reversible step, or a tested rollback. Migrations fail; the ones that fail without a way back are the ones that become incidents.
- **Test the migration on a copy of real data**, not on clean fixtures. The fixtures pass; the real data with its accumulated weirdness is what breaks the migration.
