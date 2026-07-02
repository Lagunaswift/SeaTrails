---
name: code-audit
description: "Use this skill when asked to review, audit, assess, or improve an existing codebase or a piece of existing code for problems: security holes, bugs, fragile structure, missing tests, poor error handling, bad state management, weak interfaces, or general quality and safety. Trigger on phrases like 'review this code', 'audit the codebase', 'look over this', 'check this for issues', 'is this safe', 'is this production-ready', 'find problems in', 'what's wrong with this code', 'security review', 'code review', 'clean up this project', 'assess this codebase', or when pointed at a repo, directory, or file and asked to find and optionally fix what's wrong. This is the orchestration entry point for reviewing existing code: it sequences the review into passes and applies the relevant specialist skills as lenses. Defaults to reporting issues; fixes only when asked. Does NOT design new features from scratch (use the relevant design skills) or debug one specific known failure (use debugging-methodology)."
---

# Code Audit

The entry point for reviewing existing code and finding what's wrong with it, safely. This skill does not contain the domain knowledge itself; it *orchestrates* the specialist skills, sequencing a review into ordered passes, applying the right skill as the lens for each pass, prioritising what it finds by severity, and, when asked, fixing issues under a discipline that can't silently break behaviour. Point it at a file, a directory, or a whole repo and it knows what to look at, in what order, and how to report or remediate.

## Two modes: report by default, fix only when asked

- **Report mode (default).** Find issues, prioritise them by severity, explain each, and propose a fix, without changing any code. This is the default because changing code you've just met is risky, and the person should decide what to act on. Produce the findings report (format below) and stop.
- **Fix mode (only when explicitly asked).** After reporting, or when the person says to fix, remediate issues, but only under the safety discipline below, which is non-negotiable: no fix ships without a way to verify it preserved intended behaviour, and structural changes never mix with behavioural ones. If the person says "fix it" but there's no test net and no quick way to establish one for a risky change, say so and treat that as a finding rather than charging ahead blind.

Default to report mode unless the person clearly asked for changes ("fix", "remediate", "clean it up and apply the changes"). When unsure which they want, report first and ask before changing anything.

## The cardinal rule of auditing

**Never remediate beyond your ability to verify, and never change structure and behaviour in the same step.** An audit that "fixes" issues by changing code with no test net and no behaviour check is not improving the codebase; it's introducing unverified changes to code the author understood better than the reviewer does at first contact. Every fix is governed by the refactoring and testing disciplines: establish a net (or note its absence as a blocker), change in small verified steps, keep structural and behavioural changes separate. A reviewer's confidence is the most dangerous thing in the room; the disciplines are what keep it from causing harm.

## The passes, in priority order

Review in this order, because the order is the priority order: a security hole outranks a bug outranks a fragile structure outranks a style issue. Do the high-severity passes first so that if the review is time-boxed, the most important findings surface first. Each pass applies a specialist skill as its lens.

### Pass 1: Security (highest priority)

Security issues are first because they're the highest-cost failures and the ones a reviewer most reliably adds value on (authors miss their own holes). Sweep for the vulnerability classes and apply the security skills as the lens:

- **Apply `ai-saas-security`** for anything that sends user input to an AI provider or returns AI output, and for its general web-security checklist (auth, injection, XSS, CSRF, secrets, headers, dependencies, sessions, payments, multi-tenant isolation). Its checklist and "Common Mistakes" are a ready-made audit list.
- **Apply `saas-production-security`** for production-hardening concerns (its specific coverage applies as the lens for deployment, infrastructure, and production-security posture).
- The security pass looks for: missing or broken auth and authorisation, injection (SQL/NoSQL/command/prompt), secrets in source, missing input validation, insecure defaults, XSS/CSRF gaps, exposed internals in errors, dependency vulnerabilities, missing rate limiting and cost controls on AI endpoints, and cross-tenant/cross-user data leakage.

Security findings are almost always report-first even in fix mode, because a wrong security fix is worse than the hole. Flag, explain the risk, propose the fix, and apply it only with care and verification.

### Pass 2: Correctness

Bugs and behaviours that are wrong or fragile. Apply these lenses:

- **`error-handling-patterns`** for failure handling: swallowed errors (empty catches, ignored returns), catching at the wrong layer, lost error context, missing failure paths, naive retries, no resilience around external calls, and partial-failure hazards.
- **`state-management`** for state bugs: the same fact stored in two places that can drift, derived values stored instead of computed, illegal state combinations (several booleans encoding one condition), uncontrolled mutation, per-request state leaking across requests, and concurrency on shared state.

### Pass 3: Active debugging probe

Pass 2 finds issues by static reading. This pass goes deeper: apply **`debugging-methodology`** as a full lens to actively probe the code for hidden defects that static review misses.

- **Verify assumptions, don't trust them.** For every "this should be fine" in the codebase — a value assumed non-null, a function assumed called in order, a response assumed shaped a certain way — check whether the assumption is enforced or just hoped for. The bug is almost always in something everyone is certain is fine.
- **Binary-search data flows.** Trace critical data paths (user input to database, API response to UI render, auth token to permission check) and identify where state could first go wrong. Don't read the whole flow; bisect to the failure point.
- **Probe edge cases and boundary conditions.** What happens with empty arrays, null values, zero-length strings, concurrent requests, network timeouts, missing environment variables? Walk the unhappy paths that authors rarely test.
- **Check for the debugging anti-patterns in the code itself.** Swallowed errors that silence failures (`catch {}`, `.catch(() => {})`), defensive guards that hide real bugs (null checks that paper over data-integrity problems upstream), and retry loops with no backoff or limit — these are symptoms of prior debugging that patched symptoms instead of fixing causes.
- **Flag suspected vs confirmed.** An audit finding that says "this looks like it could fail" should be verified before it's reported as a defect, or clearly labelled as a hypothesis to check. If it can be reproduced, reproduce it. If not, label it as a hypothesis with the specific conditions under which it would manifest.
- **Intermittent and timing-dependent risks.** Look for race conditions, shared mutable state across async boundaries, order-dependent initialisation, and cache-sensitive paths. These won't surface in a static read but are the bugs that cause production incidents at 3am. Apply `debugging-methodology`'s intermittent-and-heisenbugs lens.

The debugging pass is what separates a surface-level review ("this code looks fine") from one that finds the bugs the author didn't know were there. It is the difference between reading code and interrogating it.

### Pass 4: Tests and verifiability

Whether the code can be safely changed at all, which gates everything in fix mode. Apply **`testing-strategy`** as the lens:

- Is the high-risk code (money, data integrity, core rules, complex logic) tested, with meaningful assertions, or is coverage an illusion of weak assertions?
- Are there tests at all on the parts most likely to break? Is the suite trustworthy (not flaky, not implementation-coupled, not inverted-pyramid)?
- For AI/non-deterministic code, is it tested by properties and evals, or by brittle exact-match assertions that will flake?
- The test pass has a special role: in fix mode, the *absence* of a net on code you need to change is itself a top finding, because it blocks safe remediation. Note where characterisation tests would be needed before any fix.

### Pass 5: Structure and design

The code's shape, where bad structure makes it hard to understand, change, or safe. Lower priority than the above because structural problems are usually slower-burning than security holes and correctness bugs, but they're where long-term cost accumulates. Apply these lenses:

- **`refactoring`** and its code-smells as the lens for structural problems: duplication, things too big, misleading names, tangled logic, change that ripples too far, dead code. The code-smells reference is effectively the structural-audit checklist.
- **`api-and-interface-design`** for the boundaries: leaky abstractions, inconsistent or misuse-permitting interfaces, oversized public surfaces, undocumented failure modes, breaking-change risks.
- **`data-modelling`** for the shape of persisted data: drift-prone duplication, missing entities, wrong cardinality, illegal states representable in the schema, no evolution plan.
- **`state-management`** also informs in-memory data shape (overlaps pass 2; report a state-shape issue once, under whichever pass surfaced it).

### Pass 6: UI, UX & Frontend Design (when applicable)

For code with a user interface, apply two complementary lenses. Skip entirely for non-UI code.

- **`ux-ui-patterns`** for usability and interaction patterns: form design, navigation structure, accessibility, responsive behaviour, data display, error states, empty states, loading states, and microcopy. This lens asks "can the user accomplish their task correctly and efficiently?"
- **`frontend-design`** for visual design quality and distinctiveness: typography choices, colour and theme coherence, spatial composition, motion and micro-interactions, depth and surface treatment, and whether the interface has a clear aesthetic point of view or defaults to generic AI-generated patterns. This lens asks "does this look like it was designed by a human with taste, or like it was generated from a template?" Apply the AI anti-pattern checklist from `frontend-design` — the landing-page formula, the default dashboard skeleton, uniform spacing, one-radius-for-everything, the purple-to-blue gradient, generic fonts, pill-shaped everything, and the other tells. An interface that functions perfectly but looks generated still undermines user trust and product credibility.

The two lenses are complementary: ux-ui-patterns catches a form with no error states; frontend-design catches a form that works perfectly but looks like every other AI-generated SaaS page. Both matter for production-grade user-facing code.

## How to remediate (fix mode)

When fixing, every change runs the refactoring and testing disciplines, no exceptions:

1. **Establish the net first.** Confirm tests cover what you're about to change (apply `testing-strategy`). If they don't, the safe path is to add characterisation tests pinning current behaviour before touching anything. If that's not feasible for a risky change, stop and report it as a blocker rather than fixing blind.
2. **Separate structural from behavioural fixes.** A refactor and a bug fix are different steps, verified separately, in separate commits (apply `refactoring`'s cardinal rule). Don't clean up and fix behaviour in one move, the break becomes unattributable.
3. **Small verified steps.** One change at a time, verify after each (run the tests), keep the code working throughout (apply `refactoring`'s small-steps discipline). Never a big-bang remediation.
4. **Fix the cause, at the right level.** For a bug, confirm the cause before fixing (apply `debugging-methodology`); don't patch a symptom. For a structural issue, fix at the level the smell points to.
5. **Re-verify and report what changed.** After each fix, the net is green and you can state what changed and why. Report the remediation as clearly as the original finding.

## How to report findings

Whether reporting-only or proposing fixes, structure findings so the person can act on them by priority:

- **Order by severity**, highest first: a security hole and a data-corruption bug come before a long function. Severity is cost-of-the-problem times likelihood, the same risk framing as testing prioritisation.
- **For each finding**: what it is, where (file and location), why it matters (the concrete risk or cost), and the proposed fix. Keep each finding tight, the person should grasp the risk and the remedy quickly.
- **Distinguish confirmed from suspected.** A reproduced bug is a defect; an "this looks fragile" is a hypothesis. Label which is which, and verify suspected bugs (apply `debugging-methodology`) before asserting them where feasible.
- **Don't drown the signal.** A report with two hundred trivial style nits buries the three security holes. Lead with what matters, group or summarise the minor, and be honest that the long tail is lower priority. The audit's value is in surfacing the important problems, not in volume.
- **Note what you could not assess.** If part of the codebase wasn't reviewable (not provided, not understood, out of scope), say so, rather than implying the review was exhaustive when it wasn't.

## Scoping the audit

- **Default sweep is prioritised, not exhaustive.** Security and correctness first, structure and UI after, and for a large codebase, depth-first on the high-risk areas (the money, the auth, the core domain, the data writes) rather than uniform shallow coverage of everything. A focused review of what matters beats a shallow pass over all of it.
- **Targeted on request.** If the person asks for a specific lens ("just review security", "check the state management"), run that pass alone.
- **Match effort to stakes.** A pre-launch audit of payment code warrants depth; a glance at a prototype warrants less. Don't gold-plate a review of code that doesn't need it (the same restraint as the refactoring skill's "when not to refactor").

## The skills this orchestrates

For reference, the lenses and what each covers:

- `ai-saas-security`, `saas-production-security`: security and production hardening (pass 1)
- `error-handling-patterns`: failure handling (pass 2)
- `state-management`: runtime state bugs (pass 2, and in-memory data shape in pass 5)
- `debugging-methodology`: active probing, assumption verification, edge-case and timing analysis (pass 3)
- `testing-strategy`: test quality and the safety net for fixes (pass 4, gates fix mode)
- `refactoring`: structural problems and the remediation discipline (pass 5, governs all fixes)
- `api-and-interface-design`: interface and contract issues (pass 5)
- `data-modelling`: persisted data shape (pass 5)
- `ux-ui-patterns`: usability, interaction patterns, accessibility (pass 6, UI code only)
- `frontend-design`: visual design quality, AI-pattern avoidance, aesthetic distinctiveness (pass 6, UI code only)

## What to produce under a production-audit

Standalone, report per "How to report findings". As a lens under `production-audit`, emit findings in the canonical schema (`production-audit/references/finding-schema.md`) instead, appended to the run's `raw-findings.jsonl` as discovered, with prefixes `SEC`/`COR`/`DBG`/`TST`/`STR`/`UIUX` by pass. Category follows the consequence: `security` or `correctness` for passes 1–5, `performance` where that is the cost, and for pass 6 `frontend` when an interaction failure has real impact, `accessibility` when the barrier locks someone out (both keep their real severity), or `design-aesthetic` only when the worst case is "it looks generic" (hard-capped at medium). The schema overrides the prose format.
