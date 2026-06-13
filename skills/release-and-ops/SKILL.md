---
name: release-and-ops
description: "Use this skill for everything between 'the code works' and 'it runs safely in production': deployment, releases, environment and config management, secrets handling, CI/CD pipelines, rollback, and infrastructure setup. Trigger on phrases like 'how do I deploy this', 'set up CI', 'environment variables', 'manage secrets', 'config', 'staging vs production', 'release process', 'rollback', 'ship to production', 'set up the pipeline', 'infrastructure', 'env file', '.env', 'deploy to Vercel/Netlify/Railway/Fly/AWS', or when reviewing how an app is built, released, and operated rather than how its code is written. This is the ship-it-safely lens. It does not cover whether the app scales under load (use scaling-audit), whether it is secure against attackers (use code-audit / ai-saas-security), or code correctness (use debugging-methodology). Defaults to a prioritised assessment of release and operational risks; gives setup guidance when asked. Applies to any codebase and any host."
---

# Release and Ops

The lens for one question: **can this app be shipped, configured, and operated safely, and rebuilt if it disappears?** Code that runs locally is half a product. The other half is how it gets to production, how its configuration and secrets are managed, how a broken release is undone, and whether the running system could be recreated from scratch. Fast-built apps usually skip all of this: config is hand-edited on the server, secrets are pasted into files, deploys are manual steps nobody wrote down, and there is no way back when a release breaks.

This does not cover load/growth (`scaling-audit`), attacker-facing security (`code-audit`, `ai-saas-security`), or logic bugs (`debugging-methodology`). It overlaps with all three at the edges (secrets are both an ops and a security concern; reproducible infra is both ops and scaling) and references them where they own the detail.

## The cardinal principle

**A release you cannot undo and a system you cannot rebuild are the two failures that turn a small mistake into a long outage.** Most release disasters are not the bug itself; they are the inability to get back to the last working state quickly. The value of this lens is making the path to production repeatable and the path back from a bad release fast, so that shipping is routine rather than risky.

## Assessment by default, setup guidance when asked

Default to assessing the release and ops posture: where config and secrets live, how deploys happen, whether there is a rollback, whether the system is reproducible, and flag the risks in priority order. Give concrete setup guidance (pipeline config, env structure) when asked to build rather than assess.

## The areas, in priority order

Ordered by how badly each bites and how commonly it is missing.

### 1. Secrets management (highest priority, also a security concern)
Where API keys, tokens, database credentials, and signing keys live. The most common and most damaging fast-built mistake.
- Secrets in the repo, in the client bundle, or hard-coded? Any secret ever committed must be rotated, history keeps it.
- Are secrets injected at runtime from a secret store / platform env settings, not from a committed file?
- Different secrets per environment (a leaked dev key must not open production)?
`references/secrets-and-config.md` covers secret handling, rotation, and the boundary with `ai-saas-security` (which owns the attacker-facing side).

### 2. Environment and configuration
How the app knows what environment it is in and behaves accordingly.
- Clean separation of config from code (the same build runs in dev/staging/prod, differing only by injected config)?
- Is there a staging environment, or do changes go straight to production untested in a prod-like setting?
- Config validated at startup so a missing/wrong value fails fast and loud, not silently at runtime?
`references/environments.md` covers config-as-injection, environment parity, and startup validation.

### 3. Rollback and recovery
What happens when a release is broken. The difference between a two-minute blip and an all-night incident.
- Can the previous version be restored quickly (instant rollback, previous deploy kept, or one-command revert)?
- Are releases atomic (users never hit a half-deployed state)?
- For changes that touch data (migrations), is there a safe path back, or is the migration one-way? (Ties to `data-modelling` and `scaling-audit`'s durability pass.)
`references/rollback-and-recovery.md` covers rollback strategy, atomic deploys, and reversible migrations.

### 4. CI/CD and the path to production
How code actually gets from a commit to running.
- Is deploy automated and repeatable, or a sequence of manual steps someone does by hand (and could do wrong)?
- Do tests/checks run before deploy, so a broken build cannot ship (ties to `testing-strategy`)?
- Is the deploy triggered consistently (on merge to main, on a tag), so what is in production is always knowable?
`references/ci-cd.md` covers pipeline structure, gating deploys on checks, and deploy triggers.

### 5. Reproducibility and infrastructure
Whether the running system could be recreated if it vanished.
- Is the infrastructure defined (infra-as-code, a container definition, a documented setup), or is the live system a hand-tended pet nobody could rebuild?
- Are dependencies pinned (lockfiles, pinned versions) so a rebuild produces the same thing, not whatever is latest today?
- Is the build itself reproducible and documented?
`references/reproducibility.md` covers infra-as-code, dependency pinning, and the pet-vs-cattle distinction (shared with `scaling-audit`).

### 6. Release safety practices
Reducing the blast radius of a bad release.
- Could risky changes go out behind a feature flag (ship dark, enable gradually) rather than all-at-once?
- Is there a way to release to some users first (gradual rollout) rather than everyone simultaneously?
- Are database changes decoupled from code changes so neither blocks the other's rollback (expand-contract)?
`references/release-safety.md` covers feature flags, gradual rollout, and decoupling schema from code.

## How to report
Order by risk: secrets exposure and no-rollback first (they cause the worst incidents), reproducibility and release-safety practices later (they reduce risk but are less acutely dangerous). For each: the current posture, what it risks, and the concrete fix. Distinguish "this will cause an incident" from "this is below best practice." Note what could not be assessed (some of this lives in platform settings, not the repo).

## Scoping
Match to stakes. A solo prototype on a hobby host does not need feature flags and gradual rollout; it does need secrets out of the repo and a way to roll back. A real app with users warrants the full set. The honest output for an early app is usually "get secrets out of the repo, get a one-click rollback, validate config at startup, and you're safe to ship; the rest comes as you grow."

## Skills this leans on
- `ai-saas-security`: the attacker-facing side of secrets and config; this skill owns the operational side, that one owns exposure/abuse
- `testing-strategy`: the checks that gate a deploy in CI
- `data-modelling`: safe, reversible migrations for the rollback pass
- `scaling-audit`: shares the reproducibility/pet-vs-cattle and durability concerns from the operational angle
