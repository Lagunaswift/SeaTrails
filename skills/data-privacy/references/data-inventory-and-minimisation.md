# Data inventory and minimisation

You cannot govern data you have not catalogued. Every privacy assessment starts by establishing what personal data the app actually touches, because most fast-built apps do not know, they collect whatever is easy and never audit it.

## What counts as personal data

Personal data is anything that identifies a person, directly or in combination with other data. This is broader than people expect:
- Obvious: name, email, phone, postal address, date of birth, payment details.
- Often missed: IP address, device identifiers, cookie IDs, user-agent fingerprints, location, account IDs tied to a person, photos, anything user-generated that reveals identity.
- Derived: behavioural profiles, inferred preferences, anything computed about a person from their activity.

If a piece of data can be linked back to an individual, treat it as personal data. "We only store an ID, not their name" usually fails this, if the ID maps to a person, it is personal data.

## Special-category data (much stricter) [LEGAL]

Some data carries far heavier obligations: health data, biometric data (face, fingerprint), genetic data, sexual orientation, racial/ethnic origin, religious or political beliefs, trade-union membership. Processing these generally requires a stronger lawful basis (often explicit consent) and more care. An app handling any of these (a fitness app storing health metrics, for instance) is in special-category territory and should involve a lawyer/DPO. Children's data is similarly elevated, services likely to be used by minors have extra duties (age-appropriate design, parental consent thresholds that vary by jurisdiction).

## The minimisation test

For each piece of personal data the app collects, ask: **is this needed for a specific, stated purpose right now?** Minimisation (a core GDPR principle and good practice everywhere) means collecting only what a clear purpose requires, not everything that might one day be useful. Common failures:
- Collecting fields "just in case" (date of birth, phone, address) with no current use.
- Logging full request bodies or user objects that contain personal data incidentally.
- Storing third-party data pulled in via integrations beyond what is used.

The fix is to stop collecting what is not needed, and to stop *retaining* what was collected but is not used (ties to retention). Less data held is less risk, less to secure, less to delete, less to lose in a breach.

## Building the inventory

A practical inventory answers, for each category of personal data:
- What is it, and where is it stored (which tables, logs, caches, third-party services)?
- Why is it collected (the purpose)?
- How long is it kept?
- Who has access / where does it flow?

This inventory underpins everything else in the skill: you cannot write an accurate privacy policy, honour a deletion request, or assess a breach without knowing what data exists and where. Building it is the first task of any privacy assessment.

## What to flag, by stage
- Static site / no accounts / collects nothing: minimal obligations. Confirm it genuinely collects nothing (check analytics and logs, which often collect IPs/identifiers silently) and move on.
- App with accounts: build the inventory, apply the minimisation test, stop collecting unused fields. Flag any special-category or children's data for legal review.
- Data-heavy / sensitive: the inventory is essential and special-category handling needs a lawyer/DPO.

## The honest framing
The single most effective privacy improvement for most apps is collecting and keeping less. Every field you do not collect is a field you do not have to secure, disclose, delete, or explain. Start by finding what you hold, then cut what you do not need.
