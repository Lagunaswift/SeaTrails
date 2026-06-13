# Retention and third parties

Two ongoing obligations: not keeping personal data longer than needed, and controlling where it flows once it leaves your code. Both are routinely ignored by fast-built apps, which keep everything forever and send data to third parties without tracking or agreements.

## Retention: don't keep it forever

Holding personal data indefinitely is itself a violation of the storage-limitation principle (GDPR and good practice generally): data should be kept only as long as the purpose requires, then deleted or anonymised. Fast-built apps default to keeping everything forever because deletion is extra work nobody built.

The engineering question for each category of personal data: **how long is it actually needed, and what happens after?**
- Is there any mechanism that deletes or anonymises data past its useful life (old logs, inactive accounts, expired sessions, abandoned signups)?
- Or does everything accumulate indefinitely by default?

The fix is a retention approach: define how long each category is kept, and implement automatic deletion/anonymisation past that (a scheduled job, a TTL, a periodic cleanup). Anonymisation, stripping data of anything that identifies a person, is an alternative to deletion where you want to keep aggregate value (analytics) without keeping personal data. Note that "anonymised" must be genuine; if it can be re-linked to a person, it is still personal data.

Less retention also reduces every other risk: less to secure, less to disclose in a breach, less to delete on request, less to export. It compounds with minimisation.

## Third parties and processors

Every external service that receives personal data is a "processor" you remain responsible for. Fast-built apps wire up analytics, email, hosting, payment, and AI providers without tracking that each one now holds user data on your behalf.

For each third party that touches personal data:
- **Know it exists and what it receives.** Map every service personal data flows to (this is part of the data inventory). The AI provider receiving user messages, the analytics service receiving behaviour, the email service receiving addresses, all are processors.
- **A processor agreement / DPA.** You generally need a data-processing agreement with each, governing how they handle the data. Most reputable services offer one. **[LEGAL]** for whether you have the right ones.
- **Propagating deletion.** When a user is deleted, processors must delete too (see data-subject-rights).
- **Disclosure.** The privacy policy must name the categories of third party (see transparency).

## International transfers [LEGAL]

Sending personal data across borders, EU/UK data to other countries, carries specific requirements (adequacy, standard contractual clauses, or equivalent). For a worldwide app this is common (a US-hosted service with EU users, an AI provider in another jurisdiction). The mechanism that makes a transfer lawful is a legal determination; flag it. The engineering-relevant part is simply knowing where data physically goes, which countries/regions your processors operate in, so the legal review has the facts.

## What to flag, by stage
- Minimal data: retention and processors may be light; still note any analytics/email/AI processor and confirm a policy exists.
- Has accounts/data: the high findings are indefinite retention (nothing is ever deleted) and unmapped third parties (data going to services nobody tracked). Define retention and inventory the processors.
- Worldwide / sensitive: full processor agreements and transfer mechanisms, lawyer/DPO involved. **[LEGAL]**

## The honest framing
Two simple disciplines cover most of this: delete data when it is no longer needed (don't keep everything forever), and know every external service your users' data flows to. The legal instruments (DPAs, transfer mechanisms) are a lawyer's job, but they depend on the engineering facts, what is kept how long, and where it goes, which only the build can establish.

## Connection to other skills
Retention deletion is the same machinery as data-subject deletion (`data-subject-rights`) and the scheduled-cleanup pattern from `scaling-audit`. The processor map is part of the data inventory. `release-and-ops` covers where data physically runs (relevant to transfers).
