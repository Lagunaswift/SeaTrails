---
name: infrastructure-config
description: "Audit infrastructure and deployment configuration files checked into the repo: Dockerfiles, docker-compose, terraform, CloudFormation, Kubernetes manifests, CI/CD pipelines, nginx/apache configs, and cloud provider settings. Checks for: containers running as root, overly permissive IAM policies, exposed ports, missing security headers, secrets in build args, unpinned base images, privileged containers, and CI pipeline vulnerabilities. Trigger on: 'infrastructure audit', 'docker security', 'terraform review', 'CI/CD security', 'server config', 'cloud security', or when a production-audit selects this lens. Works by reading config files in the repo — does not connect to any cloud provider or run any container."
---

# Infrastructure Config

Audits the infrastructure and deployment configuration files that live in the repo: Dockerfiles, compose files, Terraform, CloudFormation, Kubernetes manifests, CI/CD pipelines, reverse proxy configs, and cloud IAM policies. Everything this lens checks is a file in the repo — it never connects to a cloud provider, runs a container, or queries a remote API.

## Why this matters

A codebase can pass every code-level security check and still be breached through a misconfigured Dockerfile, an overly permissive IAM role, or a CI pipeline that leaks secrets. These configuration files are code — they define the security posture of the deployment — but they're often written once, copied from a tutorial, and never reviewed.

## The passes

### Pass 1: Container security (Dockerfile, docker-compose)

**Dockerfile checks:**
- Running as root — no `USER` directive means the container runs as root. Add a non-root user and switch to it.
- `latest` tag on base images — `FROM node:latest` is unpinned and can change without notice. Pin to a specific version and digest.
- Secrets in build args — `ARG DB_PASSWORD` or `ENV API_KEY=...` bakes secrets into the image layer. Use runtime secrets instead.
- `COPY . .` without `.dockerignore` — copies everything including `.env`, `.git`, `node_modules`, and credentials into the image.
- No multi-stage build — the final image contains build tools, source code, and dev dependencies that aren't needed at runtime. Use multi-stage to ship only the compiled output.
- `ADD` instead of `COPY` — `ADD` can unpack tarballs and fetch URLs, which is rarely intended. Use `COPY` unless you need the extra behaviour.
- Missing `HEALTHCHECK` — the orchestrator can't tell if the container is actually serving traffic.

**docker-compose checks:**
- `privileged: true` — gives the container full host access. Almost never needed.
- `network_mode: host` — bypasses Docker's network isolation.
- Mounting sensitive host directories (`/etc`, `/var/run/docker.sock`, home directories).
- Hardcoded passwords in environment variables in the compose file.
- No resource limits (`mem_limit`, `cpus`) — a runaway container can starve the host.

### Pass 2: Cloud infrastructure (Terraform, CloudFormation)

**IAM and permissions:**
- `Action: "*"` or `Effect: Allow` with `Resource: "*"` — overly permissive policies that grant full access.
- IAM policies attached directly to users instead of roles.
- No MFA requirement on sensitive roles.
- Service accounts with admin privileges.

**Storage:**
- S3 buckets without encryption (`server_side_encryption_configuration` missing).
- S3 buckets with public access (`acl = "public-read"`, `block_public_access` not set).
- Database instances publicly accessible (`publicly_accessible = true`).
- No backup configuration on databases or storage.

**Networking:**
- Security groups with `0.0.0.0/0` on sensitive ports (SSH, database ports, admin panels).
- No VPC or subnet isolation for databases and internal services.
- Missing encryption in transit (no TLS on load balancers, internal services on HTTP).

**State management:**
- Terraform state stored locally instead of in a remote backend with locking.
- State file committed to the repo (contains secrets in plaintext).
- No state locking configured (concurrent applies can corrupt state).

### Pass 3: Kubernetes manifests

- Containers running as root (`securityContext.runAsNonRoot` not set or false).
- Privileged containers (`securityContext.privileged: true`).
- No resource requests or limits — scheduler can't make informed placement decisions and a pod can consume the entire node.
- `hostNetwork: true`, `hostPID: true`, `hostIPC: true` — breaks pod isolation.
- No network policies — all pods can talk to all other pods by default.
- Secrets in manifests instead of external secret management (Sealed Secrets, External Secrets, Vault).
- `imagePullPolicy: Always` without digest pinning — pulls whatever `latest` resolves to.
- No readiness or liveness probes.
- Service accounts with cluster-admin binding.

### Pass 4: CI/CD pipeline security

Read `.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/config.yml`, `bitbucket-pipelines.yml`:

- **Secrets in plain text** — passwords, tokens, or keys hardcoded in pipeline config instead of using the platform's secrets store.
- **Unpinned action/image versions** — `uses: actions/checkout@v3` is a mutable tag. Pin to a commit hash.
- **`pull_request_target` trigger** (GitHub Actions) — runs workflow code from the base branch but with write access to the repo. Combined with a checkout of the PR branch, this is a code injection vector.
- **Excessive permissions** — `permissions: write-all` or `contents: write` on workflows that only need read access.
- **Self-hosted runners on public repos** — any fork can run code on your infrastructure.
- **No branch protection** — check if the pipeline runs on push to main without requiring PR review.
- **Artifact leakage** — uploading build artifacts that contain `.env` files, credentials, or source maps.

### Pass 5: Reverse proxy and server config

Read `nginx.conf`, `.nginx`, `apache2.conf`, `.htaccess`, `Caddyfile`, or similar:

- **Missing security headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`. Check whether the proxy sets them.
- **Directory listing enabled** — `autoindex on` in nginx or `Options +Indexes` in Apache.
- **Default/example config left in place** — the default nginx welcome page, example virtual hosts, or commented-out blocks that reveal server structure.
- **TLS configuration** — SSLv3 or TLS 1.0/1.1 still enabled, weak cipher suites, missing HSTS.
- **Proxy pass to internal services over HTTP** — the public-facing proxy terminates TLS but talks to backends in plaintext over a network that isn't fully trusted.
- **No rate limiting at the proxy level** — no `limit_req_zone` (nginx) or equivalent.
- **Server version exposure** — `server_tokens on` (nginx) or `ServerSignature On` (Apache) reveals the exact server version.

### Pass 6: Environment and secrets files

- `.env` files committed to the repo (should be in `.gitignore`).
- `.env.example` or `.env.template` containing real values instead of placeholders.
- Credentials in any config file (`database.yml`, `config.json`, `settings.py`) — look for patterns like passwords, API keys, connection strings with credentials.
- Private keys (`.pem`, `.key`, `id_rsa`) in the repo.

## What to produce

Findings in the canonical schema, prefix `INFRA`, category `infrastructure`. Severity by impact: a container running as root with a public-facing service is high; a missing healthcheck is low. Publicly accessible databases, overly permissive IAM, and secrets in config are high or critical depending on what's exposed.

## Relationship to other skills

- **release-and-ops** covers secrets management and deploy safety at the application level. This lens covers the infrastructure layer beneath it.
- **code-audit** security pass checks application code for vulnerabilities. This lens checks the config files that determine how that code is deployed and exposed.
- **scaling-audit** covers application-level scaling concerns. This lens checks whether the infrastructure supports them (resource limits, replica config, autoscaling).
