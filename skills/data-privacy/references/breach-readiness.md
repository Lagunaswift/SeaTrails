# Breach readiness (privacy side)

The obligations that arise *when* personal data is exposed, as distinct from preventing the exposure. Prevention is the security skills' job (`ai-saas-security`, `code-audit`); this is the privacy-law duty that kicks in after a breach, and the readiness that makes meeting it possible.

## The notification duties [LEGAL]

Many privacy regimes require you to act fast after a personal-data breach:
- **Regulator notification:** under GDPR, a notifiable personal-data breach must generally be reported to the supervisory authority within 72 hours of becoming aware of it. Other regimes have their own timelines and triggers.
- **Affected-individual notification:** where a breach is likely to result in high risk to people, you may have to tell the affected individuals too.

The exact triggers, timelines, and thresholds are jurisdiction-specific and a legal determination, flag them for a lawyer/DPO. The engineering and operational point is that these clocks are short, so readiness has to exist *before* a breach, not be improvised during one.

## What readiness actually requires

Meeting a 72-hour clock is impossible if you cannot answer basic questions about what happened. Readiness means being able to determine, quickly:
- **That a breach occurred at all.** This depends on observability (ties to `scaling-audit`'s observability pass and `ai-saas-security`). An app with no monitoring may not know it was breached for months, the first sign being data appearing somewhere it should not.
- **What data was affected.** Which users, which categories of personal data. This depends on the data inventory, you cannot say what was exposed if you do not know what you held and where.
- **The scope and cause.** Enough logging and forensic capability to understand what happened, without those logs themselves leaking personal data (logs holding PII are both a breach-assessment aid and a breach risk, see `release-and-ops` and `ai-saas-security`).

## A minimal breach plan

Even a small app should have, written down somewhere, before it is needed:
- Who is responsible for assessing and reporting a breach.
- The relevant regulator(s) and the notification route and deadline. **[LEGAL]**
- How to determine affected data and users (relying on inventory and logs).
- How to communicate with affected users if required.

For a solo operator this can be a short document, but its absence means a breach becomes a scramble against a legal clock with no plan.

## What to flag, by stage
- Minimal data: low breach consequence, but still confirm there is *some* way to know a breach occurred.
- Has accounts/personal data: the high finding is the combination of no observability (would not know a breach happened) and no inventory (could not say what was exposed), which together make the legal notification duty impossible to meet. Flag the readiness gap; the fixes live in observability and inventory.
- Sensitive / worldwide: a documented breach-response plan and lawyer/DPO involvement on the notification obligations. **[LEGAL]**

## The honest framing
Breach readiness is mostly about being able to answer "did it happen, what was taken, who is affected" fast enough to meet a short legal deadline. That capability is built from observability (knowing it happened) and the data inventory (knowing what you held), not from anything privacy-specific. The privacy-specific part, who to notify and when, is a lawyer's call, but it is unanswerable without the engineering readiness underneath it. Prevention is the security skills; this is making sure that if prevention fails, you can meet the obligations that follow.

## Connection to other skills
Prevention: `ai-saas-security`, `code-audit`. Knowing a breach occurred: observability in `scaling-audit`. Knowing what was exposed: the data inventory in this skill. Logs that aid assessment without themselves leaking: `release-and-ops` and `ai-saas-security`.
