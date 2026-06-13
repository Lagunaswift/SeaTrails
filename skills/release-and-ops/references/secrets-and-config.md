# Secrets and config

The highest-priority ops concern, and the one fast-built apps get wrong most often. A secret is anything that grants access: API keys, database credentials, tokens, signing/encryption keys, webhook signing secrets, OAuth client secrets. The rule is simple and absolute: secrets never live in the code.

## The questions that matter

**Is any secret in the repository?**
Scan for keys hard-coded in source, committed `.env` files, credentials in config files, tokens in comments or test files. Anything matching the shape of a key (long random strings, `sk_`, `AKIA`, private-key blocks) is suspect. A `.gitignore` that excludes `.env` is necessary but not sufficient, the file may already be in history.

**Has a secret ever been committed, even if later removed?**
This is the trap. Deleting a secret from the current code does not remove it from git history; anyone with the repo can check out an old commit and read it. **Any secret that was ever committed must be treated as compromised and rotated**, regardless of whether it is in the current files. Removing it is not enough; the key is burned.

**Is anything secret in the client bundle?**
Front-end code is fully visible to every user (see `ai-saas-security` and the front-end-exposure concern). A key that ends up in the browser bundle, in `NEXT_PUBLIC_`-style public env vars, in client-side config, is public. Only keys that are genuinely safe to be public (publishable keys explicitly designed for the client) belong there.

**Where do secrets come from at runtime?**
The correct pattern: secrets are injected at runtime from the platform's secret store or environment settings (Vercel/Netlify/Railway/etc. project settings, a secrets manager, the deploy environment), never read from a file committed to the repo. The app reads them from the environment; the environment is configured outside the codebase.

**Are secrets segregated by environment?**
Dev, staging, and production should use different secrets. If a developer's leaked local key is the same as production's, a small leak becomes a full compromise. Different keys per environment contains the blast radius.

## Config that is not secret
Non-secret configuration (feature toggles, public URLs, environment name) should still be injected rather than hard-coded, so the same build runs everywhere. The principle is config-as-injection: the code is identical across environments; only the injected values differ. See `environments.md`.

## The fix direction when secrets are exposed
1. Rotate every exposed secret immediately (generate new ones, revoke the old).
2. Move secrets to the platform's env/secret settings.
3. Remove from the repo and, if they were committed, understand that history still holds them, rotation is the real fix, not deletion.
4. Add a secret-scanning check to CI so it cannot happen again (see `ci-cd.md`).

## The boundary with ai-saas-security
This reference owns the operational handling: where secrets live, how they are injected, rotation hygiene. `ai-saas-security` owns the attacker-facing consequences: what an exposed key lets an attacker do, cost abuse, and the front-end-exposure attack surface. When a finding is "this key is exposed," the fix is here; the impact assessment is there.
