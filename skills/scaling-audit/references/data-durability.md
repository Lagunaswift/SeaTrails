# Data durability and backups

The failure with no undo. Every other scaling problem degrades the app; this one ends it. If the data is gone, the business is gone. Check this first, always.

## The questions that matter

**Is there a backup of every datastore, and has it been restored?**
A backup nobody has restored is a guess, not a backup. The common failure is assuming the hosting provider "has backups" without knowing the frequency, the retention, or whether a restore actually works. For each datastore (primary DB, any cache holding the only copy of something, file/blob storage, anything stateful):
- Is it backed up automatically, on a schedule?
- How far back does retention go? (A backup that's overwritten hourly doesn't save you from a bug that corrupted data yesterday.)
- Has a restore been done, end to end, recently? If not, treat the backup as unverified.

**What happens after a wrong delete or bad migration?**
Most data loss is self-inflicted: a migration that drops a column, a bug that deletes the wrong rows, a bad `WHERE` clause. Snapshot-only backups don't help if the bad write happened after the last snapshot. Point-in-time recovery (the ability to restore to a moment just before the mistake) is the protection. Ask: if a bad write went out an hour ago, can it be undone, or is it permanent?

**Single point of failure on the data layer.**
One database instance, on one disk, in one place, with no replica, is one hardware failure from total loss. At small scale this is often fine and not worth fixing; the point is to *know* it's the posture, so it's a conscious risk, not a surprise.

## What to flag, by stage
- Prototype / no real users: "no backups" is acceptable if the data is disposable. Say so. Don't gold-plate.
- Real users / real data: no automated, retained, tested backup is the single highest-severity finding there is. It outranks everything else in the audit.
- Growing: add the recovery-time question. How long to restore? An untested 12-hour restore is a 12-hour outage waiting to happen.

## Connection to data-modelling
The `data-modelling` skill governs how the data is shaped; this pass governs whether it survives. A migration is both a modelling change and a durability risk: the safe-migration discipline (expand-contract, reversible steps, never destructive-in-one-shot) lives at the intersection. When a finding here is about migrations, pull in `data-modelling`'s migration guidance for the fix.

## The honest framing for the report
Lead with it if it's missing. "If your database dies or a bug corrupts it, the data is gone and there is no way back" is the most important sentence in most scaling audits, and the one fast-built apps most often need to hear. State it plainly, near the top, before anything about load or concurrency.
