# Release safety practices

Techniques that shrink the blast radius of a bad release. The earlier passes make releases repeatable and reversible; these make individual changes safer to ship, so a problem affects fewer users for less time, or can be switched off without a deploy at all.

These are higher-maturity practices. An early app does not need them; a growing one benefits a lot. Flag their absence as "would reduce risk," not "this is broken."

## Feature flags

**Decouple deploy from release.**
A feature flag lets code ship to production while staying off, then be turned on (and off) without a deploy. This separates two things that are usually fused: deploying the code and exposing the feature. The benefits:
- Risky changes ship dark, tested in production conditions, then enabled deliberately.
- If a newly-enabled feature misbehaves, it is switched off instantly, no deploy, no rollback, just a flag flip.
- Features can be enabled for a subset of users first (see gradual rollout).

The cost is added complexity (flags must be managed and eventually removed, stale flags are their own mess). Worth it for risky or large changes; overkill for trivial ones.

## Gradual rollout

**Don't release to everyone at once.**
Releasing a change to 100% of users simultaneously means a bug hits everyone simultaneously. Gradual rollout (canary releases, percentage rollouts) exposes the change to a small fraction first, watches for problems (ties to observability in `scaling-audit`), and widens only if it is healthy. A bad change caught at 5% of users is a minor incident; the same change at 100% is a major one. Requires the observability to actually see whether the canary is healthy, otherwise it is just a slower way to break everything.

## Decoupling schema from code (expand-contract)

**The pattern that makes data changes rollback-safe.**
The hardest rollback problem is a database migration shipped with code (see `rollback-and-recovery.md`): roll back the code and it no longer matches the schema. Expand-contract solves it by splitting a schema change into steps that are each individually safe and reversible:
1. **Expand:** add the new structure (new column/table) without removing the old. Old and new code both work.
2. **Migrate:** move/backfill data and switch the code to use the new structure, the old one still present as a fallback.
3. **Contract:** only after the new code is proven stable, remove the old structure.

At each step, the code and schema are compatible, so a rollback never lands code against an incompatible schema. This ties directly to `data-modelling` (migration design) and is the practice that makes `rollback-and-recovery.md`'s "path back for data changes" actually achievable.

## What to flag, by stage
- Prototype / early: none of this is needed. Mention it only if a specific imminent change is risky enough to warrant a flag.
- Real users: expand-contract for any non-trivial migration is worth adopting, it is the difference between a reversible and an irreversible data change. Feature flags for genuinely risky features.
- Growing: gradual rollout and feature flags become standard practice, the cost of an all-at-once bad release is high enough to justify the machinery.

## The honest framing
These are the practices that separate "shipping is always a little scary" from "shipping is routine even for risky changes." They are not required to ship safely at small scale, fast rollback and gated CI cover the basics, but as the user base and change frequency grow, they are what keep the blast radius of any single mistake small.
