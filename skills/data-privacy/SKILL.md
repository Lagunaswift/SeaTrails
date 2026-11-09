---
name: data-privacy
description: "Use this skill to assess or build how an app collects, stores, uses, and deletes personal data in line with privacy law worldwide (GDPR, UK GDPR, CCPA/CPRA, and the common principles behind them). Trigger on phrases like 'GDPR', 'CCPA', 'privacy', 'personal data', 'PII', 'consent', 'cookie banner', 'data deletion', 'right to be forgotten', 'data retention', 'privacy policy', 'do I need consent', 'can I store this', 'data subject request', 'is this compliant', or when an app handles user data (accounts, emails, analytics, tracking, health/financial data) and the question is whether it does so lawfully. This is the privacy-and-compliance lens, for engineering and product decisions, not formal legal advice. It does not cover attacker-facing security (use ai-saas-security / code-audit) or data durability (use scaling-audit). Defaults to a prioritised assessment of privacy risks and the concrete changes to make. Flags clearly when something needs a real lawyer. Applies to any codebase serving users anywhere."
---

# Data Privacy

Assess the actual collection, use, sharing, retention and handling of people's data. Start with evidence from the application, browser/network behaviour, configuration and operational process. A policy page or consent banner alone does not establish that the underlying behaviour is correct.

## Scope and default behaviour

This is a read-only engineering/product assessment unless changes are requested. Map the organisation, users, purposes and jurisdictions before selecting obligations. Establishment, targeting, monitoring and specific statutory scope matter; neither hosting location nor a visitor's location alone establishes every applicable law. Do not automatically impose the world's strictest rule on every processing activity.

Flag genuinely unresolved legal scope, lawful-basis or interpretation questions as **[LEGAL]**, with the engineering facts needed for a decision. Continue the evidence work that can be completed. Do not claim legal compliance, invent approved policy text or treat an unavailable contract as a confirmed violation.

## Areas, in dependency order

### 1. Inventory and minimise

Trace directly entered, derived and logged information through databases, browser storage, caches, analytics, email, payment and AI services. Pseudonymous account/device IDs may still be personal data. Record purpose, access, retention and recipients; identify unnecessary fields or logging. Assess special-category and children's data from what is actually processed, not the app's industry label alone.

Read `references/data-inventory-and-minimisation.md`.

### 2. Lawful processing, storage/access and choices

Distinguish the basis for personal-data processing from rules for storing/accessing information on a device. Inspect cookies, local storage, SDKs, embeds, pixels and server forwarding. Where consent is required, verify prior blocking, meaningful choices and withdrawal in the real data flow. An applicable exception may have different conditions, information and objection requirements.

UK guidance now includes narrow statistical and appearance exceptions; do not apply an old blanket rule that all non-essential analytics require opt-in, or a new blanket rule that analytics are exempt. Marketing eligibility also depends on the jurisdiction, recipient and any applicable exception.

Read `references/lawful-basis-and-consent.md` and recheck current official guidance.

### 3. Truthful notices

Compare the privacy/cookie notice with observed purposes, recipients, retention, choices and rights process. Identify generic templates, missing facts or promises the app cannot fulfil. The engineering assessment should supply accurate facts for approved wording.

Read `references/transparency-and-policy.md`.

### 4. Rights and request handling

Check a discoverable, secure operational path for applicable access, correction, erasure, objection, restriction and portability requests. Access and portability have different scopes; erasure is not absolute. A workable manual process can be sufficient. Self-service is a product/scale choice unless promised or otherwise required.

Trace relevant data across stores and recipients, including lawful retained records and the backup/restore treatment. Use safe fixtures and documentation during an audit, not live deletion requests.

Read `references/data-subject-rights.md`.

### 5. Retention and recipients

Check purpose-specific retention and demonstrable deletion, restriction or anonymisation. Investigate unjustified indefinite accumulation rather than declaring every long retention period unlawful. Classify each recipient's actual role for each activity: processor, independent controller or joint controller. Assess relevant agreements and transfers against that role; not every third party is a processor and international processing is not automatically prohibited.

Read `references/retention-and-third-parties.md`.

### 6. Breach readiness

Check ownership, evidence and a response process for a personal-data incident, including applicable notification thresholds and deadlines. Security prevention belongs to `code-audit`/`ai-saas-security`; this lens covers privacy consequences and response readiness.

Read `references/breach-readiness.md`.

## How to report

For each material issue, identify the data flow, purpose, observed behaviour, applicable rule or unresolved scope, consequence and concrete remedy. Separate confirmed engineering failures from missing evidence and legal questions. Prioritise exposure, incompatible or unauthorised use, broken choices and inability to honour applicable rights by actual impact. Do not require a banner, account system, new tracking or self-service portal where the audited service has no corresponding need.

## Sources

Dated primary sources are attached to the relevant references. UK examples reflect ICO guidance checked 9 November 2026; recheck the current jurisdiction-specific rules at execution time. These examples do not establish the rules for every audience or processing activity.

## What to produce under a production-audit

Standalone, report as prose per "How to report". As a lens under `production-audit`, emit findings in the canonical schema (`production-audit/references/finding-schema.md`) instead, appended to the run's `raw-findings.jsonl` as discovered: prefix `PRIV`, category `privacy` — or `compliance` or `security` where the consequence lands there. The schema overrides the prose format above.

## Skills this leans on
- `ai-saas-security`, `code-audit`: preventing breaches (the security side); this skill owns the privacy obligations around the data and after a breach
- `scaling-audit`: data durability and backups, which complicate complete deletion, and observability, which determines whether you can assess a breach
- `release-and-ops`: secrets and logs that may contain personal data
