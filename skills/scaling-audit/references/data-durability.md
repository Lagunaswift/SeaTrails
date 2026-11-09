# Data durability and backups

The failure with no undo. Every other scaling problem degrades the app; this one ends it. If the data is gone, the business is gone. Check this first, always.

## The questions that matter

**Is there a backup of every datastore, and has it been restored?**
Record backup configuration and demonstrated recovery separately. Check the provider's actual frequency and retention where evidence is available; missing repository documentation does not establish that no backup or restore exists. For each datastore (primary DB, any cache holding the only copy of something, file/blob storage, anything stateful):
- Is it backed up automatically, on a schedule?
- How far back does retention go? (A backup that's overwritten hourly doesn't save you from a bug that corrupted data yesterday.)
- Has a restore been done, end to end, recently? If not, treat the backup as unverified.

**What happens after a wrong delete or bad migration?**
A migration, delete bug or bad `WHERE` clause can corrupt data. Restoring the last clean snapshot may also lose legitimate writes made since it; point-in-time recovery may narrow that loss window where supported and configured. Ask whether a bad write from an hour ago can be recovered, which later valid changes survive, and what evidence supports the answer.

**Single point of failure on the data layer.**
One database instance, on one disk, in one place, with no replica, is one hardware failure from total loss. At small scale this is often fine and not worth fixing; the point is to *know* it's the posture, so it's a conscious risk, not a surprise.

## Restore evidence and isolation

Require a dated restore result covering the stores needed for a recovered journey, with integrity checks and measured recovery time/data-loss window. A configured job or provider promise alone cannot demonstrate that result. [NCSC cloud-backup guidance](https://www.ncsc.gov.uk/collection/ransomware-resistant-backups/principles-for-ransomware-resistant-cloud-backups) includes testing whether recovery is possible.

For an authorised drill, restore into a disposable isolated destination. Before starting recovered services, disable or sandbox scheduled jobs, queue consumers, outbound messages, payments and webhooks. Use isolated credentials/storage and protect restored personal data from public access. Reapply deletion/retention requirements before any data returns to service, with `data-privacy` owning that policy. An ordinary audit may inspect existing evidence and propose the drill; it does not authorise a destructive production restore.

## What to flag, by stage
- Prototype / no real users: "no backups" is acceptable if the data is disposable. Say so. Don't gold-plate.
- Real users / real data: assess missing recovery against data replaceability, loss impact and the required recovery window. An unavailable restore record is an evidence gap; a demonstrated absence of recovery is a different finding.
- Growing: add the recovery-time question. How long to restore? An untested 12-hour restore is a 12-hour outage waiting to happen.

## Connection to data-modelling
The `data-modelling` skill governs how the data is shaped; this pass governs whether it survives. A migration is both a modelling change and a durability risk: the safe-migration discipline (expand-contract, reversible steps, never destructive-in-one-shot) lives at the intersection. When a finding here is about migrations, pull in `data-modelling`'s migration guidance for the fix.

## The honest framing for the report
Lead with a confirmed material recovery gap and its impact. State which data could be lost, the recovery path that was inspected and what remains unknown. A missing restore record supports "recovery is unverified", not an invented claim that all data would be permanently lost.
