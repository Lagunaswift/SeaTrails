# Stage 0: stack detection and cross-stack adaptation

This skill must drop into *any* repo and produce relevant findings — not assume Next.js + Firebase. The lens skills are written with concrete examples (because vague checklists produce vague findings), and many of those examples are JavaScript/Next/Firestore-flavoured. Those examples are **illustrations of a universal question**, not the question itself. This file is how the orchestrator translates them to the repo actually in front of it, and how it avoids both failure modes: emitting irrelevant findings ("no `loading.tsx`" in a Go API) and missing real ones ("no SQL injection check" in a Django app, because the lens example talked about Firestore).

## Run stack detection first, before any lens

Before Stage 1's lens selection, build a **stack profile** by reading the repo's manifest and entry points. Record it in `report.json` under `stack_profile`. Cheap, deterministic signals:

| Signal file / pattern | Tells you |
|---|---|
| `package.json` | Node/JS/TS; framework via deps (`next`, `react`, `vue`, `svelte`, `express`, `nest`, `remix`) |
| `requirements.txt`, `pyproject.toml`, `Pipfile` | Python; framework (`django`, `fastapi`, `flask`) |
| `go.mod` | Go; framework (`gin`, `echo`, `chi`, stdlib `net/http`) |
| `Gemfile` | Ruby; `rails` vs `sinatra` |
| `composer.json` | PHP; `laravel`, `symfony` |
| `pom.xml`, `build.gradle` | Java/Kotlin; `spring` |
| `Cargo.toml` | Rust; `axum`, `actix` |
| `*.csproj` | .NET / C# |
| ORM / DB deps (`prisma`, `sqlalchemy`, `gorm`, `activerecord`, `mongoose`, `firebase-admin`, `pg`, `mysql2`) | datastore family: **SQL** vs **document/NoSQL** |
| `Dockerfile`, `vercel.json`, `netlify.toml`, `serverless.yml`, `fly.toml`, `*.tf` | hosting / deploy model: container, serverless, PaaS, IaC |
| presence of `index.html` + no server deps | **static site** |
| no UI deps, only API/handler code | **headless backend / API** |
| `Cargo`/`go`/native + no web deps | CLI or library |

The profile to record: **language(s), framework, datastore family (SQL / document / none), rendering model (SSR / SPA / static / none), hosting model, the set of third-party services** (AI providers, payment, email, auth, analytics — detect by dependency and by env-var names), **and the data classes the app handles** (next section — this drives a legal duty, not just lens phrasing).

**Service-triggered deepeners.** Some detected services pull in a specialist checklist on top of the standard lenses:
- **Stripe** (`stripe` / `@stripe/*` dependency, `STRIPE_*` env vars, `/webhooks/stripe` routes) → the code-audit Security and Correctness passes additionally apply `stripe-best-practices` as a payment-integration checklist (webhook signature verification, idempotency keys, restricted/secret key handling, subscription-state correctness, refunds/disputes). See `lens-registry.md` Lens 1. Findings stay under code-audit's `SEC`/`COR` prefixes, tagged `also_seen_by_lenses: ["stripe-best-practices"]`.
- An **AI provider** dependency → the `ai-saas-security` lens is mandatory (not optional).

The stack profile drives two things: which lenses apply (a static site skips scaling/privacy-deletion/AI; a headless API skips accessibility/SEO/frontend-robustness) and how each lens's checks are phrased.

## Data-class detection (drives a legal duty, not just phrasing)

Beyond *what kind of app* it is, detect **what class of data it holds**, and record it in `stack_profile.data_classes` (an array of strings). This is not cosmetic: certain data classes create a **legal data-protection duty** — under whatever framework governs that data in the app's jurisdiction (GDPR/UK GDPR, HIPAA, PCI-DSS, COPPA, CCPA/CPRA, and the like) — that exists **whether or not anyone stated a compliance goal**. Stage 1 keys the compliance pass off this field, not off a stated goal (see `scope-and-lens-selection.md`), so detection here is what stops a real obligation being folded into "not applicable." *This step only detects the class* — the `soc2-compliance` lens maps the class to the framework(s) that apply (jurisdiction-dependent, and usually needs operator confirmation).

Detect by reading schema/model field names, route and collection names, env vars, feature names, and the privacy policy if present. The class tokens are framework-neutral on purpose — the same `special-category:health` triggers GDPR in the EU and HIPAA in the US. Cheap signals → class:

| Signal (field / route / feature names, services) | `data_classes` entry |
|---|---|
| `health`, `mood`, `symptom`, `diagnosis`, `medication`, `hrv`, `bodyweight`, `cycle`, `therapy`, crisis/`safeguarding`/self-harm flags, mental-health content | `special-category:health` |
| `ethnicity`, `religion`, `sexuality`/`orientation`, `politics`, `union`, `biometric`, `genetic` | `special-category:<kind>` |
| `isMinor`, `age`, `dateOfBirth` gating under-18, `parentalConsent`, `school`, a product aimed at children | `children` |
| `iban`, `accountNumber`, `sortCode`, `balance`, `transaction`, `income`, card/`pan`, a Stripe/Plaid/Open-Banking integration storing financial detail | `financial` |
| `ssn`, `nationalId`, `passport`, `driverLicense` | `government-id` |
| `latitude`/`longitude`/precise location history | `precise-location` |
| ordinary account data only (name, email, password hash, app preferences) | `personal` (baseline — standard data-subject rights, no *special* duty) |

Record every class that applies (an app can be `["special-category:health", "financial", "children"]`). When a regulated class is present (`special-category:*`, `financial`, `children`, `government-id`), Stage 1 must run the data-protection-duty pass and the harness will fail an audit that excludes it as not-applicable — the signal detected here is the whole basis for that gate. When only `personal` applies, no special duty is triggered (standard data-privacy still runs). If genuinely no personal data is held (a static brochure), record `data_classes: []`.

The same fields also **elevate `data-privacy` to priority 1** (`lens-registry.md` Lens 5) — special-category, financial, or children's data makes the privacy lens a high-stakes pass, not a routine one.

## The translation table

When a lens names a stack-specific mechanism, read it as the **generic question** and check the equivalent for the detected stack. The lens skills are correct about *what* to look for; this table maps the *where*.

| Lens example (as written) | The universal question | SQL / Postgres / Rails / Django | Go / Java / .NET | Static site |
|---|---|---|---|---|
| "Firestore transactions for atomic writes" (scaling) | Are multi-step writes atomic? | DB transactions (`BEGIN/COMMIT`), row locks, `SELECT … FOR UPDATE` | same, via the driver/ORM | n/a |
| "Firestore security rules" (security) | Is data-layer access controlled server-side? | Row-level security, ORM scoping, query-level `where user_id = ?` | authz middleware + query scoping | n/a |
| "unbounded Firestore query / `.limit()`" (scaling) | Are list queries bounded/paginated? | `LIMIT`/`OFFSET`, keyset pagination | same | n/a |
| **(implied, often missing for NoSQL)** | **Injection** | **SQL injection: string-built queries, missing parameterisation/ORM placeholders — a TOP check for any SQL stack** | same | n/a (but check any backend it calls) |
| "`next/image`" (performance) | Are images optimised (format, lazy, dimensions)? | framework image helper, or `<img loading=lazy>` + responsive `srcset` + CDN | same | `srcset`, `loading=lazy`, compression, explicit dimensions |
| "`loading.tsx` / `error.tsx`" (frontend) | Do the four async states exist? | server-rendered loading/error pages, HTMX/Turbo states, spinner partials | n/a (no UI) or template states | n/a (no async) |
| "`'use client'` vs server component" (performance) | Is work on the right tier (server vs client)? | SSR templates vs client JS sprinkles | n/a | minimise client JS |
| "NEXT_PUBLIC_ env leak" (ops) | Are server-only secrets exposed to the client bundle? | check what's injected into templates / public JS | check what's compiled into client artifacts | check inline `<script>` and committed config |
| "service worker cache version" (ops) | Do clients get stale assets after deploy? | asset fingerprinting / cache-busting hashes | same | same |
| "Genkit / Gemini AI calls" (ai-saas-security) | Is there an AI surface to secure? | any LLM SDK (`openai`, `anthropic`, `cohere`, local) | same | usually none |

When in doubt, the rule is: **the lens's intent is portable; its vocabulary is not.** Apply the intent.

## Stack-specific checks the JS-flavoured lenses under-emphasise

Add these when the stack profile calls for them — they are easy to miss because the lens examples did not foreground them:

- **SQL stacks:** SQL injection (string-concatenated queries, missing parameterisation), N+1 via lazy ORM relations, missing DB indexes on filtered/sorted columns, connection-pool exhaustion, migrations that lock tables, missing row-level security.
- **Python:** unsafe `pickle`/`yaml.load`, `eval`/`exec` on input, `subprocess` with `shell=True`, Django `DEBUG=True` in prod, missing `SECRET_KEY` rotation, mass-assignment via `ModelForm`/serializers.
- **Go:** unchecked errors (`_ =`), goroutine leaks, missing `context` timeouts on outbound calls, `sql.DB` without `SetMaxOpenConns`, race conditions (suggest `-race`).
- **Java/Spring:** deserialization gadgets, SpEL/OGNL injection, missing `@PreAuthorize`, actuator endpoints exposed, XXE in XML parsers.
- **PHP/Laravel:** mass assignment (`$guarded`/`$fillable`), `env()` used outside config, debug bar in prod, unescaped Blade `{!! !!}`.
- **Static sites:** the audit is mostly SEO, performance, accessibility, and "is anything secret committed" — most server-side lenses report "not applicable (no backend)". Say so explicitly rather than inventing findings.
- **Mobile/native:** insecure local storage, hardcoded API keys in the binary, cleartext traffic, missing certificate pinning.

## Record the adaptation in scope

In the report's scope section, state the detected stack and any lenses skipped because of it ("static site: scaling, data-deletion, and AI lenses not applicable"). This keeps drop-in honesty: the reader sees the audit understood what kind of app it was looking at, and that lenses were skipped for a structural reason, not silently dropped. Skipped-as-inapplicable (recorded here) is distinct from skipped-as-deferred (a coverage gap) — keep them separate, per `scope-and-lens-selection.md`.
