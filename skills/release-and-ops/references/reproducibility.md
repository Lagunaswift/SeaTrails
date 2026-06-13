# Reproducibility and infrastructure

Whether the running system could be recreated if it vanished. A system you cannot rebuild is a system you cannot recover, cannot move, and cannot reason about. The question: if the production environment were destroyed tomorrow, could you stand up an identical one from what is in version control?

## Pets versus cattle

The distinction: a "pet" is a server someone set up by hand, tuned over time, and could not exactly recreate, it is unique and irreplaceable, and its loss is a crisis. "Cattle" are servers defined by code, so any instance can be destroyed and an identical one created from the definition, the individual instance is disposable. Fast-built apps almost always run on pets: a host someone configured manually, with steps that were never written down.

**The test:** could someone other than you (or you, six months from now) recreate the production environment from what is in the repository, without tribal knowledge? If the honest answer is no, the system is a pet, and that is both a recovery risk and a bus-factor risk.

## What makes a system reproducible

**Infrastructure as code, or at least documented.**
The infrastructure (services, environment, runtime versions, how it is wired) should be defined in version-controlled files (infra-as-code) or, at minimum, documented in a runbook precise enough to follow. Manual setup that lives only in someone's memory or in the running machine is the opposite of reproducible.

**Pinned dependencies.**
A build is only reproducible if it pulls the same dependencies every time. Lockfiles (package-lock.json, yarn.lock, poetry.lock, Cargo.lock, etc.) pin exact versions so a rebuild today produces what it produced last month, not "whatever is latest now," which may include breaking changes or, worse, a compromised package version. Check that lockfiles exist and are committed, and that the build uses them (installs from the lockfile, not a fresh resolve). Unpinned dependencies also intersect with supply-chain security.

**A documented or scripted build.**
The steps to go from source to a running build should be captured (a script, a Dockerfile, a documented sequence), not improvised each time. A container definition is the strongest form, it captures the runtime, the dependencies, and the build in one reproducible artifact.

## What to flag, by stage
- Prototype: full infra-as-code is overkill. The cheap, high-value items even here: committed lockfiles (so the build is reproducible) and a short written note of how it is deployed (so it is not pure tribal knowledge).
- Real users: a hand-configured, undocumented production environment is a real finding, you cannot recover quickly from its loss and you cannot safely change it. Move toward defined, documented infrastructure.
- Growing: full infra-as-code and containerisation pay off, they make the system recoverable, movable, and scalable (this is where reproducibility meets `scaling-audit`'s ability to run multiple identical instances).

## The honest framing
Reproducibility is invisible until you need it, the day the host has an outage, the account gets locked, a resource is deleted, or you need to move providers. At that moment, a reproducible system is a few commands to rebuild, and a pet is a frantic reconstruction from memory while users wait. Lockfiles and a written deploy process are the minimum; they cost almost nothing and remove the worst of the risk.

## Connection to other skills
`scaling-audit` shares this concern from the growth angle, you cannot run multiple identical instances if you cannot reproduce one. The durability of data (backups) lives there; the reproducibility of the system lives here; together they define how fast you can recover from a total failure.
