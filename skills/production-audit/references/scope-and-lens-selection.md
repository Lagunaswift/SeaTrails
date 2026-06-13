# Stage 1: Scope and lens selection

Before running anything, work out what the app is and therefore which lenses genuinely apply. Running every lens on every app pads the report with irrelevant findings (an SEO pass on an internal admin tool, an i18n pass on a single-locale prototype) that dilute the real ones and waste the reader's attention. Choosing the right lenses, and stating which you chose and why, is the first act of a good audit.

## Read the app first

Establish, from the codebase and any context given:
- **What it is:** a public consumer web app, an internal tool, an API, a static site, a mobile-first product, an e-commerce store. This drives most lens choices.
- **Who uses it and where:** authenticated users only or public; one region/language or worldwide; desktop, mobile, or both.
- **What it handles:** personal data, special-category data (health, finance), children's data, payments, AI calls, user-generated content. This drives the high-stakes lenses — and, for regulated data classes, a **legal duty** that does not wait for anyone to ask for it (see "Compliance is two things" below). Stage 0 records these in `stack_profile.data_classes`; read that before selecting the compliance lens.
- **Its stack and surfaces:** the framework, the data stores, the third-party services, the API routes, what is client- vs server-rendered.

A few minutes establishing this prevents both kinds of error: running lenses that do not apply, and missing ones that do. Stage 0 (`stack-adaptation.md`) produces the structured stack profile that feeds this — read it first so lens selection and lens phrasing both match the actual stack.

## The lens-applicability map

Consult `references/lens-registry.md` for the full details of each lens: its backing skill, passes, ownership, and supporting references. The registry is the single source of truth for what each lens does and how it's run. The map below tells you **when** to select each lens; the registry tells you **how** to run it.

Run a lens when its subject is present; skip it (and say so) when it is not:

- **`code-audit`**: always. Security and correctness apply to every app.
- **`ai-saas-security`**: when the app sends user input to an AI provider or returns AI output. Skip if there is no AI surface.
- **`scaling-audit`**: when the app has (or expects) real users, persistent data, or load. A throwaway prototype can get a light version; skip the deep version only for genuinely disposable things.
- **`release-and-ops`**: almost always; any app that deploys has secrets, config, and a release path. Lighter for a static site.
- **`data-privacy`**: when the app collects any personal data (accounts, analytics, emails, user content). Skip only for a genuinely data-free static site.
- **`performance`**: when there is a frontend users wait on. Skip for a pure backend API (its latency is a scaling concern instead).
- **`accessibility`**: when there is a user-facing UI. Skip for a headless API.
- **`email-deliverability`**: when the app sends email (transactional or marketing). Skip if it sends none.
- **`frontend-robustness`**: when there is a frontend with async actions/forms. Skip for static content with no interactivity.
- **`internationalisation`**: when the app targets, or plausibly will target, multiple languages/locales. For a firmly single-locale app, note it as deferred rather than run it in depth.
- **`seo-discoverability`**: when the app is public-facing and wants to be found. Skip for internal/auth-walled apps (note that sharing previews may still matter).
- **`mobile-and-responsive`**: when the app is used on phones/tablets (most public web apps). Skip for desktop-only internal tools.
- **`analytics-and-instrumentation`**: when the app is a product whose usage informs decisions. Skip for a static brochure; light for very early stage.
- **`anti-slop-writing`**: when the app has meaningful **user-facing copy** — a marketing/landing site, onboarding, rich microcopy, customer-facing emails. Audits that copy for AI-slop writing (the words, not the visuals — that is `frontend-design`). Light for a very early prototype; skip for a headless API, an internal dev tool, or an app with negligible copy.
- **`soc2-compliance`** (synthesis): runs after the atomic lenses, in one of **two distinct modes** — keep them apart, because one is optional and one is not (see "Compliance is two things" below):
  - **SOC 2 certification readiness** — keyed off a *stated* goal (a B2B/enterprise buyer, an auditor, a contractual requirement). Genuinely deferrable when there is no such goal; note it as deferred-if-relevant for any app holding customer data.
  - **Legal data-protection duty** — keyed off the **data class**, not a stated goal. When Stage 0's `stack_profile.data_classes` contains a regulated class (`special-category:*`, `financial`, `children`, `government-id`, `precise-location`), a reduced compliance pass is **in scope regardless of what anyone asked for**, and you run `soc2-compliance` in data-protection-duty mode to surface the impact-assessment / lawful-basis / children's-data gap under whichever framework applies (GDPR, HIPAA, PCI-DSS, COPPA, CCPA/CPRA…, by jurisdiction). This is **never** "not applicable."
- **`adversary-emulation`** (synthesis): when the app is security-sensitive (auth, personal/financial/health data, payments, multi-tenant). Runs last, chaining the atomic lenses' findings into attack paths. Skip for a static site with no backend and no data.

## Compliance is two things — do not collapse them into one "not applicable"

The single most damaging scoping error this audit can make is to look at a pre-launch solo product, see "no stated SOC 2 goal," and exclude all of compliance as not-applicable — while the app quietly processes data that carries a legal duty. Keep these two apart, always:

- **Compliance *certification* (e.g. SOC 2 Type II)** is an *optional commercial goal*: you pursue it because a buyer or contract requires it. With no such buyer, it is genuinely deferrable, and "deferred — no B2B/enterprise buyer requiring it" is an honest exclusion.
- **A legal *data-protection duty*** is **not optional and not opt-in**. It attaches to the *data the app processes*, the moment it processes it, regardless of stated goals, company size, or launch stage. *Which* framework imposes it depends on the data class **and the jurisdiction** — GDPR/UK GDPR (impact assessment + heightened lawful basis), US HIPAA (health/PHI), PCI-DSS (card data), COPPA and age-appropriate-design codes (children), CCPA/CPRA and other state laws (sensitive PI), and so on. The duty is general; only the statute name is local. A consumer app touching health, crisis/mental-health, financial, or children's data carries one of these whether or not the operator has ever heard of SOC 2.

So the rule: **certification can be deferred; a legal duty cannot.** When Stage 0's `stack_profile.data_classes` shows a regulated class, run the reduced data-protection-duty pass (`soc2-compliance` maps the class to the framework(s) that apply) and report the gap as **in scope** — never fold it into "not applicable for a pre-launch product." Because jurisdiction usually can't be read from the repo, name the framework(s) that plausibly apply and flag that the operator must confirm which governs. The honest exclusion note reads, e.g.: *"SOC 2 certification deferred — no B2B buyer requires it. But this app processes special-category (health) data, so a documented impact assessment and a heightened lawful basis are a legal duty that is in scope under the applicable framework (GDPR if EU/UK users; HIPAA if a US covered entity — confirm jurisdiction); the data-protection-duty pass ran and its gaps are reported below."* That is sharper and more useful than "no stated compliance goal," and it generalises to any regulated app, not just one jurisdiction. The harness enforces this: a regulated `data_classes` value with the compliance duty excluded is a hard failure (`audit-check.mjs`), so the error cannot ship as prose.

The data-protection-duty findings are usually *already present* under other lenses' badges — an undisclosed processor and no special-category backups (`data-privacy`), no admin-read audit trail (`scaling-audit`), deletion that breaks the published privacy policy (`data-privacy`). The compliance pass's job is to *name them as the legal-duty gap under the applicable framework*, not re-discover them.

## State the scope explicitly

Open the audit by stating what was assessed and what was deliberately excluded, so the report is not mistaken for exhaustive over surfaces it never covered:
- **In scope:** the lenses run, and the parts of the codebase covered (which directories, routes, rules, configs).
- **Out of scope, and why:** lenses skipped because they do not apply ("no SEO pass: the app is auth-walled and internal"), and parts of the code not examined.
- This honesty is part of the audit's credibility and mirrors the "what I could not assess" section the final report ends with (report-format.md).

## Plan the run: applicable, and will-it-fit
Two distinct questions, and the scope statement must separate them:
- **Which lenses apply** (the applicability map above). Lenses that do not apply are excluded for good, named in "out of scope."
- **Which lenses will actually run this session.** A full sweep of all *applicable* lenses on a substantial codebase frequently will not finish in one session. Decide up front whether this is a single run or a staged one, and if the applicable set is large, plan to run the highest-stakes lenses first and the rest in a follow-up.

Keep these separate in the report. A lens that does not apply ("internal tool, no SEO") and a lens that applies but has not run yet ("data-privacy applies, deferred to follow-up run") are completely different: the first needs no further work, the second is an open gap in coverage that the reader must know about. Conflating them, listing a not-yet-run lens as if it were out of scope, hides a real hole. State applicable-but-deferred lenses explicitly as pending, not as excluded.

## What to produce from this stage
A short scope statement: what the app is, which lenses apply, which of those will run this session versus a follow-up, which are excluded as not-applicable (and why), and what parts of the codebase are covered. This frames everything that follows and prevents the failure modes, padding with inapplicable lenses, silently leaving a relevant surface unaudited, and presenting a partial run as complete.

## The honest framing
Match the lenses to the app. Always run security and correctness; run the high-stakes lenses (privacy, scaling, ops) whenever their subject is present; skip the ones that genuinely do not apply and say so. Padding an internal tool's report with SEO and i18n findings does not make the audit more thorough, it makes it less useful by burying what matters. State the scope up front, including what you chose not to look at, so the reader knows exactly what the audit does and does not cover.
