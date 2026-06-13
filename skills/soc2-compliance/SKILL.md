---
name: soc2-compliance
description: "Audit a codebase for the TECHNICAL controls that SOC 2 evidence depends on — access control, encryption, change management, monitoring, audit logging, availability, confidentiality, and the Privacy criteria. Maps each Trust Services Criterion to its code evidence and flags controls with no backing. Trigger on: 'SOC 2', 'SOC2 readiness', 'Trust Services Criteria', 'compliance audit', 'are we audit-ready', 'control gaps', or when a production-audit selects this lens. NOT a substitute for a CPA audit — covers the engineering control subset only."
---

# SOC 2 Compliance (technical control mapping)

## The boundary — state this first, every time

SOC 2 is an **organisational** audit performed by a licensed CPA firm against the AICPA Trust Services Criteria. A large part of it lives in policies, HR processes, physical security, vendor contracts, risk assessments, and board oversight — **none of which are in a code repository.** This lens cannot tell you whether you will pass SOC 2. It can only audit the **technical/engineering control subset**: the controls whose evidence is implemented in code and infrastructure. Every report from this lens must say so plainly, or it misleads. The output is "here are the technical controls an auditor will look for evidence of, and which ones your code currently has no evidence for" — a readiness signal for the engineering slice, not a compliance verdict.

The five categories: **Security** (the mandatory Common Criteria, CC1–CC9), and the optional **Availability**, **Processing Integrity**, **Confidentiality**, **Privacy**. Type I assesses whether controls are *designed*; Type II assesses whether they *operated* over a 3–12 month window (which needs durable logs and history — flag where the system keeps no evidence trail at all, because that blocks Type II regardless of design).

## Two trigger modes — certification readiness vs. legal data-protection duty

This lens runs for two different reasons, and the reason changes what it produces and whether it was optional:

- **Certification-readiness mode** — triggered by a *stated* SOC 2 / audit-readiness goal. Runs the full CC1–CC9 + optional-category mapping below. This is the "are we ready for an auditor" pass, and with no stated goal it is genuinely deferrable.
- **Data-protection-duty mode** — triggered by the **data class**, not by any stated goal. When the orchestrator's stack profile shows a regulated `data_classes` value (`special-category:*` health/mental-health/crisis/biometric, `financial`, `children`, `government-id`, `precise-location`), this lens runs a **reduced, mandatory pass** focused on the legal duty that attaches to that data **under whatever framework applies to it**. SOC 2 is usually *not even the right framework here* — say so, and map to the one that is. The deliverable is "this data class creates these legal duties, and here is the evidence gap for each," framed as `category: compliance`, severity by legal exposure.

**Which framework applies depends on the data class *and the jurisdiction* (where the users and the data are) — not on which framework you happen to know.** Detect the class from the code; the jurisdiction usually cannot be read from the repo, so name the framework(s) that plausibly apply and **flag that jurisdiction must be confirmed**. The map (examples, not exhaustive — apply the one(s) that fit):

| Data class | Framework(s) and core duty (confirm by jurisdiction) |
|---|---|
| `special-category:health` | **EU/UK GDPR** (Art. 9 explicit-consent or other condition + a DPIA); **US HIPAA** if a covered entity / business associate handling PHI; sectoral health-privacy laws elsewhere. Core duty: a heightened lawful basis, a documented impact assessment, breach notification. |
| `special-category:*` (race, religion, sexuality, politics, union, biometric, genetic) | GDPR Art. 9; **US state biometric laws** (e.g. Illinois BIPA) for biometric/genetic; explicit consent + minimisation. |
| `financial` | **PCI-DSS** for cardholder data; **US GLBA** for financial institutions; **EU PSD2/SCA** for payment auth; GDPR if EU users. Core duty: scoped storage, encryption, strong authentication. |
| `children` | **US COPPA** (under-13); **UK Age-Appropriate Design Code** and equivalent state codes; GDPR Art. 8 age-of-consent. Core duty: age assurance, verifiable parental consent, data-minimisation by default, no behavioural profiling of minors. |
| `government-id` | GDPR; **US state data-breach + ID-theft laws**; minimisation + encryption + breach notice. |
| `precise-location` | GDPR consent; **US state privacy laws** (e.g. CCPA/CPRA treat precise geolocation as sensitive PI). |
| `personal` (baseline) | GDPR / UK GDPR; **US state privacy laws** (CCPA/CPRA, VCDPA, …). Standard data-subject rights — no *special* duty beyond these. |

A general-purpose impact assessment (GDPR calls it a **DPIA**; analogous assessments exist under other regimes) and a heightened lawful basis are the recurring duties for special-category data across frameworks — so the *structure* of the pass is framework-agnostic even though the statute names differ.

Keep the boundary honest in both directions: **certification can be deferred; a legal duty cannot.** Never report a regulated-data app as "compliance not applicable — no stated SOC 2 goal." Certification is deferrable; the data-protection duty is in scope the moment the app processes the data, under whichever framework governs it. (The production-audit harness enforces this — a regulated data class with the duty excluded as not-applicable is a hard failure.)

### Data-protection-duty pass (when triggered by data class)

Run these checks in addition to (or, for a pre-launch product with no certification goal, instead of) the full criteria mapping. They are written as **framework-agnostic duties**, each with the statute names as examples — apply the one(s) that fit the data class and jurisdiction (per the map above). Most evidence is *already in the ledger* under other lenses — re-project it, don't re-discover it:

- **Impact assessment necessity and absence.** Special-category or large-scale monitoring of individuals triggers a mandatory documented impact assessment (a **DPIA** under GDPR; analogous risk assessments under HIPAA's Security Rule, etc.). Is there any evidence of one (a `DPIA.md`, a risk register, a documented processing assessment)? Absence is the headline finding: "processes [class] data; no impact assessment exists; one is a legal precondition for this processing under [framework]."
- **Heightened lawful basis / authorisation for sensitive data.** Is there a basis beyond an ordinary terms checkbox — explicit consent or an equivalent statutory condition (GDPR Art. 9(2); HIPAA authorisation; verifiable parental consent under COPPA)? A single "I accept the terms" tick does not cover special-category processing under any of them.
- **Children's data.** If `data_classes` includes `children`: age assurance, verifiable parental-consent paths, data-minimisation by default, and no behavioural profiling of minors (US COPPA; UK and US-state Age-Appropriate Design Codes; GDPR Art. 8). Flag each absent control.
- **Processor / third-party transparency.** Every third party that sees the regulated data (AI providers, email, analytics, hosting) must be a disclosed processor with a contract and named in the privacy notice (GDPR Art. 28 processor terms; HIPAA Business Associate Agreements; CCPA service-provider terms). Re-project `data-privacy`'s undisclosed-processor findings here as the transparency gap.
- **Sensitive-data retention, backup, and erasure.** No backups for regulated data is an availability and breach-recoverability gap; deletion that leaves regulated records breaches the published policy and erasure/disposal rules (GDPR erasure; HIPAA/GLBA disposal; CCPA deletion); no admin-read audit trail means sensitive access is untraceable. Re-project the `scaling-audit` / `data-privacy` findings as the duty gaps they are.

Severity here is by **legal exposure on this data class**, not by how an auditor would score a control: a missing impact assessment on crisis/health data is high/critical, not a hygiene note. When jurisdiction is unknown, state the duty under the framework(s) that plausibly apply and flag that the operator must confirm which governs.

## How this lens works: map, then find gaps

This is largely a **mapping lens**. It consumes the findings the other lenses already produced (from the ledger) and re-projects them onto the criteria, then adds control-specific checks the other lenses don't frame as compliance. For each criterion: identify the expected technical control, check the code for evidence of it, and emit a finding for each control with weak or absent evidence. Cross-reference rather than re-discover — if `code-audit` already found "no MFA," that becomes the CC6.1 evidence gap; cite the existing finding id in `dedup.also_seen_by_lenses`.

## Passes (by criteria area)

### Pass 1: CC6 — Logical and physical access controls (highest priority)
- **CC6.1 Authentication:** is there strong auth? MFA available/enforced for privileged access? Session management sound?
- **CC6.1 Authorization:** least-privilege enforced server-side (not just hidden UI)? Role/permission checks on every privileged route?
- **CC6.1 Encryption at rest and in transit:** TLS enforced (HSTS, no plaintext fallback)? Sensitive fields encrypted at rest? Key management — keys in a secret store, not source?
- **CC6.2/6.3 Provisioning/deprovisioning:** is there a path to revoke access? Does account deletion/suspension actually cut off access (tokens invalidated)?
- **CC6.6 Boundary protection:** are admin/internal endpoints separated and protected? Dev/debug endpoints excluded from prod?
- **CC6.7 Data in transit to third parties:** is data sent to processors over TLS?

### Pass 2: CC7 — System operations (monitoring & incident response)
- **CC7.1/7.2 Monitoring:** is there logging of security-relevant events (auth, access, privilege changes, data export/deletion)? Anomaly/threshold alerting?
- **CC7.2 Audit trail:** is there a tamper-evident, retained audit log? (This is also what Type II evidence is built from — no log history = no Type II.)
- **CC7.3/7.4 Incident response:** are there hooks to detect and respond — error tracking, alerting integration, a documented runbook referenced in the repo?

### Pass 3: CC8 — Change management
- **CC8.1:** is there CI/CD with required checks? Code review enforced (branch protection, required approvals)? Separation between who writes and who deploys?
- Are changes traceable (commit history, PR linkage, deployment records/version stamps)?
- Are migrations reviewed and reversible? (overlaps release-and-ops)

### Pass 4: CC3 / CC4 — Risk assessment & monitoring of controls
- **CC4.1:** dependency vulnerability scanning (e.g. `npm audit`, `pip-audit`, Dependabot) in CI? Are critical advisories acted on?
- Is there a mechanism that would surface a control *failing* (e.g. alerting when auth errors spike, when backups fail)?

### Pass 5: Availability (optional category)
- Backups exist, are automated, and restore is tested? (overlaps scaling-audit — cite it)
- Redundancy / failover for critical dependencies? Documented RTO/RPO?
- Health checks and uptime monitoring?

### Pass 6: Confidentiality (optional category)
- Is confidential data classified and access-restricted by classification?
- Encryption of confidential data at rest and in transit?
- Secure disposal — does deletion actually remove confidential data everywhere? (overlaps data-privacy)

### Pass 7: Processing Integrity (optional category)
- Input validation on all write paths (complete, accurate, authorised processing)?
- Are critical calculations (billing, scoring, aggregates) correct and tested?
- Is there detection of processing errors (failed jobs surfaced, not swallowed)?

### Pass 8: Privacy (optional category — AICPA Privacy criteria, distinct from GDPR)
- Notice: is there a privacy notice covering collection/use/retention?
- Choice/consent: collected and honoured? (overlaps data-privacy — cite it)
- Access/correction/deletion: can a data subject exercise these? Do they work end to end?
- Retention/disposal: enforced, not just stated?
- Note: GDPR findings from `data-privacy` map here, but the Privacy TSC is its own framework — frame against the AICPA criteria, don't just copy GDPR language.

## What to produce

Findings in the canonical schema (`production-audit/references/finding-schema.md`), prefix `SOC2`, category `compliance`. Each finding names the criterion (e.g. "CC6.1 — encryption in transit"), the expected control, the evidence gap, and the remediation. Use `dedup.also_seen_by_lenses` to point at the underlying technical finding when another lens already found it.

A missing audit log / no event logging at all is high (blocks Type II and CC7). No access controls on privileged routes is high (CC6). No CI/change-management is medium-high (CC8). Missing optional-category controls are medium unless the org is scoping that category. Frame severity as **evidence-readiness**, and always include the boundary caveat that organisational controls are out of scope for a code audit.

## Overlapping skills

- `code-audit` (CC6 access/encryption), `release-and-ops` (CC8 change mgmt, secrets), `scaling-audit` (Availability, CC7 observability), `data-privacy` (Confidentiality disposal, Privacy criteria) — this lens does not re-find their issues, it maps them to criteria and adds the compliance-evidence framing.
