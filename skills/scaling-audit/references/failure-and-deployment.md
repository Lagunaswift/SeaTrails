# Single points of failure and deployment

What happens when the one thing dies. Fast-built apps are usually one process, one container, one server, with no plan for it going away. This pass finds where "it" is a single point with no backup, and whether the system can even be rebuilt.

## Single points of failure

**The one instance.**
One container or one VM running the whole app means any crash, deploy, or host failure is a full outage. At small scale, a few seconds of downtime on restart is often acceptable, name it and move on. The risk grows with users: the same single instance that's fine at 5 users is an availability problem at 5,000, and a memory leak or a crash loop takes everything down with no failover.

**State trapped in the process.**
If the app holds important state in memory (sessions, queues, in-progress work, caches that are the only copy), then restarting the process loses it, and running a second copy for redundancy is impossible because the two copies don't share state. This is the hidden blocker to scaling horizontally: you can't just "run more copies" if each copy has its own private state. The fix direction is making the app stateless, pushing shared state to a datastore the instances share. This ties directly to `state-management`.

**The single-thread / single-worker trap.**
A specific, common fast-built failure: the app is trying to run many concurrent jobs (multiple agents, parallel tasks, background work) but is inadvertently pinned to a single thread or single worker, so the "concurrent" work actually runs one at a time and falls over or stalls under load. Check the process/worker model against what the app is actually trying to do concurrently.

## Deployment and reproducibility

**Is the running system a pet or cattle?**
Can the app be torn down and rebuilt from scratch (code + config + infra definition), or is the live instance a hand-tended pet that nobody could recreate if it vanished? If the deploy involved manual steps someone did once and didn't write down, the system is unreproducible, and that's both a scaling blocker and a bus-factor risk. Look for: is there a defined build/deploy (a script, a config, a pipeline), or is it "I SSH'd in and set it up"?

**Config and environment.**
Is configuration in the deploy (env vars, infra-as-code), or scattered in the running instance? Scattered config is part of what makes a system unreproducible.

## What to flag, by stage
- Prototype: single instance is fine. Flag only if state-in-memory will block them from ever scaling without a rewrite, so they know now.
- Real users: single instance with no restart/failover and no reproducible deploy is a high finding, an outage is a question of when, and recovery is slow if the system can't be rebuilt.
- Growing: statelessness becomes the gating issue for running multiple instances. If state is trapped in the process, that's the thing to fix before horizontal scaling is even possible.

## Connection to other skills
`state-management` owns the stateless-app and shared-state discipline that this pass depends on. When the finding is "state is trapped in the process," the fix is a state-management problem.
