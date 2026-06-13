# Environments

How the app knows where it is running and behaves correctly there. The goal is one build that runs identically in every environment, differing only by injected configuration, and a safe place to test changes before users see them.

## Config as injection

**The same artifact everywhere.**
The build that runs in production should be the same build that ran in staging, with no code differences between environments. Anything that varies (database URL, API endpoints, feature flags, environment name) is injected as configuration at runtime, not baked into the code or branched with `if (production)` logic scattered around. Branching behaviour on environment inside the code is a smell: it means the thing you tested in staging is not the thing running in production.

**Where config comes from.**
Configuration is read from environment variables (or a config service) provided by the platform, the same mechanism as secrets but for non-secret values. The code declares what config it needs; the environment supplies it.

## Environment parity

**Staging should resemble production.**
A staging environment that differs significantly from production (different database engine, different config, missing services) tests something that is not what you will ship. The closer staging mirrors production, the more a "works in staging" result means "will work in production." Total parity is rarely practical, but the gaps should be known, not accidental.

**The danger of no staging at all.**
Pushing changes straight to production with no intermediate environment means every change is tested live, on real users. For a hobby app this may be an acceptable tradeoff; for an app with users it is a recipe for user-facing breakage. At minimum, a way to run the production build against non-production data before it goes live.

## Startup validation

**Fail fast on bad config.**
The app should validate its required configuration at startup and refuse to start (loudly) if something required is missing or malformed, rather than starting fine and then failing at runtime the first time it tries to use the missing value. A missing database URL should crash on boot with a clear message, not produce a confusing error three screens into a user flow an hour later. Check whether config is validated up front (a schema, an explicit check) or just read ad hoc wherever it is needed.

This connects to `scaling-audit` (a config value like an encryption key that is needed but unvalidated is both an ops and a durability risk) and to good `error-handling-patterns` (fail fast, fail clear).

## What to flag, by stage
- Prototype: config-as-injection and startup validation are cheap and worth having even early. No staging is acceptable; note it.
- Real users: no staging environment and environment-branching scattered through the code are real findings, you are testing in production and shipping untested-in-prod-shape changes.
- Growing: parity gaps between staging and production become the source of "it worked in staging but broke in prod" incidents; tighten them.

## The honest framing
The payoff of getting this right is that "it worked when I tested it" becomes trustworthy. Most "but it worked on my machine / in staging" incidents trace back to an environment difference the code was silently depending on. One injected-config build plus a prod-shaped staging environment removes that whole class of surprise.
