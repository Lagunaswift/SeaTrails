---
name: data-privacy
description: "Use this skill to assess or build how an app collects, stores, uses, and deletes personal data in line with privacy law worldwide (GDPR, UK GDPR, CCPA/CPRA, and the common principles behind them). Trigger on phrases like 'GDPR', 'CCPA', 'privacy', 'personal data', 'PII', 'consent', 'cookie banner', 'data deletion', 'right to be forgotten', 'data retention', 'privacy policy', 'do I need consent', 'can I store this', 'data subject request', 'is this compliant', or when an app handles user data (accounts, emails, analytics, tracking, health/financial data) and the question is whether it does so lawfully. This is the privacy-and-compliance lens, for engineering and product decisions, not formal legal advice. It does not cover attacker-facing security (use ai-saas-security / code-audit) or data durability (use scaling-audit). Defaults to a prioritised assessment of privacy risks and the concrete changes to make. Flags clearly when something needs a real lawyer. Applies to any codebase serving users anywhere."
---

# Data Privacy

The lens for one question: **does this app handle people's personal data lawfully and honestly?** Privacy law is not optional and it is not only an EU concern, GDPR (EU), UK GDPR, CCPA/CPRA (California), and a growing list of others impose real obligations with real fines, and they apply based on where the *users* are, not where the app is hosted. An app serving users worldwide is subject to the strictest regime its users fall under. Fast-built apps routinely collect more than they need, store it forever, track without consent, and have no way to delete a user, all of which are violations waiting to be noticed.

**This skill is not legal advice.** It covers the engineering and product decisions that determine compliance and flags clearly where a qualified lawyer or DPO is required. It does not cover security against attackers (`ai-saas-security`, `code-audit`) or keeping data alive (`scaling-audit`); it overlaps with both (a breach is a security *and* a privacy event) and references them.

## The cardinal principle

**Collect the least, keep it the shortest, be honest about it, and be able to delete it.** Almost every privacy obligation reduces to those four. Most fast-built apps fail all four by default: they collect everything available, keep it indefinitely, never clearly say what they do, and have no deletion path. Fixing those four covers the large majority of practical privacy risk for a typical app. The detail and the edge cases are where a lawyer earns their fee; the four principles are where the engineering lives.

## Assessment by default, with clear legal flags

Default to assessing what personal data the app touches and where it falls short, in priority order, with concrete fixes. Where a question is genuinely legal (lawful basis for a specific use, whether a given regime applies, drafting a policy's binding text), say so and point to a lawyer/DPO rather than inventing a ruling. **[LEGAL]** marks those points.

## The areas, in priority order

### 1. Data inventory and minimisation (start here)
You cannot protect or govern data you have not catalogued. First establish what personal data the app actually collects and why.
- What personal data is collected (directly entered, derived, logged, or from third parties)? Personal data is anything identifying a person: name, email, IP, device IDs, location, and more.
- Is each piece actually needed, or collected just because it was available? Minimisation means collecting only what a clear purpose requires.
- Any special-category data (health, biometric, sexual orientation, race, religion, political views) or children's data? These carry much stricter rules. **[LEGAL]**
`references/data-inventory-and-minimisation.md` covers what counts as personal data, special categories, and the minimisation test.

### 2. Lawful basis, consent, and tracking
Why the app is allowed to process each piece of data, and where genuine consent is required.
- Tracking and analytics: cookies/identifiers beyond the strictly necessary generally need prior consent (GDPR/ePrivacy), a real opt-in, not a pre-ticked box or "by using this site you agree". A compliant cookie banner lets users refuse as easily as accept.
- Marketing email needs consent and a working unsubscribe (ties to email-deliverability and to the funnel you may have built).
- The specific lawful basis for a given processing purpose is a legal determination. **[LEGAL]**
`references/lawful-basis-and-consent.md` covers consent done properly, cookie/tracking rules, and the consent-vs-other-basis distinction.

### 3. Transparency: privacy policy and notice
Telling people, honestly and accessibly, what you do with their data.
- Is there a privacy policy, and does it actually match what the app does (not a generic template describing things the app does not do, or omitting things it does)?
- Does it cover what is collected, why, how long it is kept, who it is shared with (third parties, processors), and how to exercise rights?
- The binding legal wording should be lawyer-reviewed; the engineering job is making sure the stated behaviour matches the real behaviour. **[LEGAL]** for the policy text.
`references/transparency-and-policy.md` covers what a policy must address and the match-reality principle.

### 4. Data subject rights: access and deletion
People have enforceable rights over their data; the app must be able to honour them.
- Deletion ("right to be forgotten"): can a user's data actually be deleted, fully, across every store (database, backups, logs, caches, third-party processors)? Most fast-built apps cannot, deletion that misses collections or third parties is incomplete. (Ties to `scaling-audit` durability: backups complicate deletion.)
- Access/portability: can a user be given a copy of their data on request?
- Is there an actual process (even a manual one) to handle these requests within the legal time limits?
`references/data-subject-rights.md` covers building deletion that is complete, access/export, and request handling.

### 5. Retention and third parties
Not keeping data longer than needed, and controlling where it flows.
- Retention: is there any policy/mechanism to delete or anonymise data after it is no longer needed, or is everything kept forever by default? Indefinite retention of personal data is a violation in itself.
- Third parties/processors: every external service that touches personal data (analytics, email, hosting, the AI provider) is a processor you are responsible for; they need appropriate agreements and adequate safeguards. **[LEGAL]** for the agreements.
- International transfers: sending EU/UK personal data to other jurisdictions has specific requirements. **[LEGAL]**
`references/retention-and-third-parties.md` covers retention limits, processors, and transfer issues.

### 6. Breach readiness (privacy side)
The privacy obligations when data is exposed, distinct from preventing the breach.
- Many regimes require notifying regulators (often within 72 hours under GDPR) and sometimes affected users after a personal-data breach. Is there any plan for that?
- Can you even tell what data was affected (ties to observability and to `ai-saas-security`)?
`references/breach-readiness.md` covers notification duties and what readiness means; prevention lives in the security skills.

## How to report
Order by risk and likelihood of enforcement: no deletion path, tracking without consent, and indefinite retention of sensitive data are the common high-consequence findings. For each: what the app does now, which principle/obligation it breaches, and the concrete change. Separate the engineering fixes (which you can make) from the **[LEGAL]** items (which need a lawyer/DPO). Never state a definitive legal ruling; describe the obligation and recommend professional review for the binding parts.

## Scoping
Match to what the app handles and who it serves. A no-account static site collecting nothing has almost no obligations, say so. An app with accounts, analytics, marketing email, or special-category data (health, finance) serving a worldwide audience carries the full set and should assume the strictest applicable regime. The honest output for a simple app is often "you collect little; do these three things (consent for analytics, a real deletion path, an accurate policy) and you have covered the main practical risk", and for a data-heavy one, "get a lawyer/DPO involved, here is what to fix on the engineering side meanwhile."

## What to produce under a production-audit

Standalone, report as prose per "How to report". As a lens under `production-audit`, emit findings in the canonical schema (`production-audit/references/finding-schema.md`) instead, appended to the run's `raw-findings.jsonl` as discovered: prefix `PRIV`, category `privacy` — or `compliance` or `security` where the consequence lands there. The schema overrides the prose format above.

## Skills this leans on
- `ai-saas-security`, `code-audit`: preventing breaches (the security side); this skill owns the privacy obligations around the data and after a breach
- `scaling-audit`: data durability and backups, which complicate complete deletion, and observability, which determines whether you can assess a breach
- `release-and-ops`: secrets and logs that may contain personal data
