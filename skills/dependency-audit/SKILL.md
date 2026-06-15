---
name: dependency-audit
description: "Audit a project's dependencies for supply chain and security risks by reading lock files, package manifests, and CI config. Checks for: missing lock files, unpinned versions, known-risky packages, dependency bloat, dev dependencies in production, postinstall scripts, and whether automated vulnerability scanning is wired into CI. Trigger on: 'dependency audit', 'supply chain', 'check my dependencies', 'are my packages safe', 'npm audit', or when a production-audit selects this lens. Works by reading files in the repo — does not call any external API or package registry."
---

# Dependency Audit

Checks a project's third-party dependencies for supply chain risk, version hygiene, and security posture by reading the files that are already in the repo: lock files, package manifests, CI configuration, and import statements. Every check in this lens works by reading files — it never calls a package registry, runs `npm audit`, or hits a CVE database.

## Why this matters

Most breaches through dependencies aren't zero-days. They're outdated packages with published CVEs that nobody updated, wildcard versions that silently pulled a compromised release, or postinstall scripts that ran arbitrary code at `npm install` and nobody noticed. These are all visible in the repo's files before anything runs.

## The passes

### Pass 1: Lock file hygiene

Check whether lock files exist and are committed. A project without a committed lock file has no reproducible builds — every install can pull different versions.

- `package-lock.json` or `yarn.lock` or `pnpm-lock.yaml` for Node.js projects
- `Pipfile.lock` or `poetry.lock` for Python
- `Gemfile.lock` for Ruby
- `go.sum` for Go
- `composer.lock` for PHP

Flag: lock file missing, lock file in `.gitignore`, lock file present but stale (manifest lists packages the lock doesn't contain).

### Pass 2: Version pinning

Read the package manifest (`package.json`, `requirements.txt`, `Gemfile`, `pyproject.toml`, etc.) and check version specifiers.

- **Wildcard versions** (`*`, `latest`) — the install pulls whatever is newest, including compromised releases. Always pin.
- **Overly broad ranges** (`>=1.0.0` with no upper bound) — allows major version bumps that may include breaking or malicious changes.
- **Caret and tilde ranges** (`^1.2.3`, `~1.2.3`) — acceptable for most libraries, but flag on security-critical packages (auth, crypto, payment) where even a patch-level change warrants review.
- **Git dependencies** (`git+https://...`, `github:user/repo`) — pulls from a mutable ref. If it's not pinned to a specific commit hash, the dependency can change without the manifest changing.

### Pass 3: Dependency count and bloat

Count direct and transitive dependencies (from the lock file). Flag when:

- Direct dependency count exceeds 80 (Node.js) or equivalent threshold for other ecosystems — every dependency is attack surface.
- A single dependency pulls in more than 50 transitive dependencies.
- Multiple versions of the same package exist in the dependency tree (version duplication).
- Dev dependencies are listed as production dependencies or vice versa.

### Pass 4: Known-risky patterns

Check for packages and patterns with documented history of supply chain attacks or security issues:

- **Packages with postinstall scripts** — read the `scripts` field in each dependency's `package.json` (via lock file metadata or `node_modules`). Postinstall scripts run arbitrary code at install time. Flag any dependency with `preinstall`, `install`, or `postinstall` scripts, especially if the script downloads or executes external content.
- **Typosquat indicators** — packages whose names are one character off from popular packages (`loadsh` vs `lodash`, `cross-env` vs `crossenv`).
- **Unmaintained packages** — no check for this in static analysis, but flag packages pinned to versions more than 3 major versions behind the ecosystem norm (e.g., a webpack 2.x dependency in a webpack 5.x ecosystem).
- **Deprecated patterns** — `request` (deprecated), `node-uuid` (replaced by `uuid`), `moment` (maintenance-only, replaced by `date-fns` or `dayjs`).

### Pass 5: Dev vs production boundaries

Check that dev-only dependencies don't leak into production:

- Dev dependencies imported in production source files (not just test files).
- Test frameworks, linters, or build tools listed in `dependencies` instead of `devDependencies`.
- Bundle analysis: if a bundler config exists (webpack, vite, esbuild), check whether it tree-shakes dev dependencies or bundles everything.

### Pass 6: CI vulnerability scanning

Check whether automated dependency scanning is configured in the CI pipeline:

- Does `.github/workflows/` contain a step that runs `npm audit`, `yarn audit`, `pip audit`, `bundler-audit`, `govulncheck`, or Snyk/Dependabot?
- Is GitHub's Dependabot configured (`.github/dependabot.yml`)?
- Is Renovate configured (`renovate.json`, `.renovaterc`)?
- If none of the above: flag that no automated dependency vulnerability scanning is in the CI pipeline.

Also check that CI-pinned action versions use commit hashes, not tags (`uses: actions/checkout@v3` is mutable; `uses: actions/checkout@abc123` is not).

## What to produce

Findings in the canonical schema, prefix `DEP`, category `supply-chain`. Most findings are medium — an unpinned version or missing lock file is a risk but not an active exploit. Escalate to high when: a postinstall script downloads external content, a known-compromised package pattern is detected, or security-critical packages (auth, crypto, payment) use wildcard versions.

## Relationship to other skills

- **release-and-ops** checks for secrets in config and CI/CD safety, but doesn't audit the dependency tree itself.
- **code-audit** security pass mentions dependency vulnerabilities but doesn't read lock files or check version pinning.
- **scaling-audit** may flag dependency-related performance issues but doesn't assess supply chain risk.
