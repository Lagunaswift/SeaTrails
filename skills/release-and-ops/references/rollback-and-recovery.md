# Rollback and recovery

The single most valuable release capability: getting back to the last working state fast. Most release incidents are not the bug, they are the time spent unable to undo it. An app that can roll back in seconds turns a bad deploy into a non-event; one that cannot turns it into an outage that lasts as long as the fix takes.

## The questions that matter

**Can you restore the previous version quickly?**
When a release is broken, the first move is not "debug it live", it is "get back to what worked, then debug calmly." Check whether that is possible and fast:
- Does the platform keep previous deploys and allow instant promotion of the last good one? (Most modern hosts do, Vercel, Netlify, etc., the question is whether the team knows to use it.)
- Or is rollback a manual redeploy of an older commit, which is slower but workable?
- Or is there no rollback at all, the only way forward is to fix-forward under pressure? That is the dangerous state.

**Are deploys atomic?**
During a deploy, do users ever hit a half-deployed state, some requests on the new version, some on the old, or static assets from one version with code from another? Atomic deploys switch all traffic at once, so there is no in-between. Non-atomic deploys produce weird, hard-to-reproduce errors during every release.

**Is there a path back for data changes?**
Code rollback is easy; data is not. If a release included a database migration, rolling back the code does not roll back the migration. A migration that dropped a column or transformed data may have no way back, the old code now runs against a schema it does not expect, or the data is simply gone. This is why schema changes and code changes should be decoupled (see `release-safety.md`, expand-contract) and why migrations should be reversible where possible. This ties to `data-modelling` (migration safety) and `scaling-audit` (data durability).

## Recovery beyond rollback

**How long to recover from a total failure?**
Distinct from rolling back a bad release: if the running environment is destroyed (host failure, account issue, deleted resource), how long to get back up? This is where reproducibility (`reproducibility.md`) and backups (`scaling-audit`'s durability pass) meet, you can only recover quickly if the system can be rebuilt and the data restored.

## What to flag, by stage
- Prototype: a way to redeploy a previous commit is enough. Flag if there is genuinely no path back at all.
- Real users: no fast rollback is a high finding, it means every bad deploy is an extended outage. One-click rollback is usually available on the platform and just needs to be known and practised.
- Growing: atomic deploys and decoupled migrations become important, the cost of a half-deployed state or an irreversible migration grows with the user base.

## The honest framing
Lead with rollback if it is missing. "When a deploy breaks, how do you get back to working?" is a question most fast-built apps cannot answer, and the answer "we don't, we fix forward" guarantees that the next bad release is an incident rather than a blip. A practised, fast rollback is the cheapest insurance in the release process.
