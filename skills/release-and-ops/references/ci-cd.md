# CI/CD and the path to production

How code gets from a commit to running in production. The goal is a path that is automated, repeatable, and gated, so that what ships is known, tested, and cannot be broken by a missed manual step.

## The questions that matter

**Is deployment automated or manual?**
A manual deploy (SSH in, pull, build, restart, by hand) is slow, error-prone, and unrepeatable, it depends on someone remembering the steps and doing them right every time, under pressure, possibly at 2am. An automated deploy (triggered by a commit or a command, running the same steps every time) removes the human-error surface and makes releases routine. Check: is there a pipeline/script, or is deploy a thing someone does by hand?

**Do checks run before deploy?**
The point of a pipeline is not just to deploy, it is to refuse to deploy broken code. Before a release reaches production, the pipeline should run the things that catch breakage: the test suite (ties to `testing-strategy`), type checks, linting, a build that must succeed, and ideally a secrets scan (so a committed key is caught before it ships, ties to `secrets-and-config.md`). A pipeline that deploys without gating on checks is just automated shipping of whatever was committed, including the broken commits.

**Is the trigger consistent and knowable?**
What is in production should always be answerable. A consistent trigger, deploy on merge to main, or on a version tag, means production always reflects a known commit. Ad hoc "deploy whenever someone runs the command from whatever branch they are on" makes it unclear what is actually live. Prefer a single, defined trigger.

## What a minimal pipeline does
In rough order of value:
1. On commit/PR: run tests, type checks, lint, build. Block merge if any fail.
2. On merge to main (or tag): run the checks again, then deploy automatically.
3. Optionally: secrets scan, dependency vulnerability scan.
4. On success: the new version is live (atomically, see `rollback-and-recovery.md`); on failure: it is not, and someone is told.

Even a small app benefits from the first step alone, automated checks on every change, before any deploy automation exists.

## What to flag, by stage
- Prototype: manual deploy is acceptable if it is simple and documented. The high-value addition even here is automated tests/build checks before deploy, so broken code is caught.
- Real users: a fully manual, ungated deploy is a real finding, broken releases will happen and there is nothing to stop them. Automated, gated deploy is the fix.
- Growing: consistency of trigger and the full check suite matter more as more people (or more AI agents) touch the code and the cost of a bad release rises.

## The honest framing
The value of CI/CD is that shipping stops being scary. When every change runs through the same gated, automated path, a release is routine and a broken commit is caught before users see it, rather than being a careful manual ritual where a missed step causes an outage. For an app built fast and changed often, this is what makes frequent shipping safe.

## Connection to other skills
`testing-strategy` owns what the tests should actually check (behaviour, not implementation); this reference owns running them as a deploy gate. `secrets-and-config.md` (in this skill) owns the secret-scanning check.
