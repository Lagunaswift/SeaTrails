# Retention and third parties

Follow the data after collection. Record each category's purpose, retention trigger, duration or review criteria, deletion/restriction mechanism and actual recipients. Unjustified indefinite accumulation is a finding; long retention is not automatically unlawful when a documented continuing purpose or obligation applies.

## Retention evidence

Inspect schedules, TTLs, cleanup jobs, archived exports, logs and backup lifecycles. Compare policy with observed configuration and available execution evidence. Check legal holds or other required retention separately. Anonymisation must prevent identification in the relevant context; a reversible identifier or linkable pseudonym is not enough.

Recommend a proportionate mechanism for the identified gap. An audit does not run destructive cleanup or invent legal retention periods.

## Classify recipients by activity

For each external service, identify what it receives, why, who determines purposes and means, where it processes data and any onward recipients. Its role may be processor, independent controller or joint controller, and can differ across activities. Do not label every analytics, payment, hosting or AI vendor a processor automatically.

Check the agreement and safeguards appropriate to the identified role, including processor instructions and subprocessor arrangements where applicable. Record missing access to agreements as unverified. Align the privacy notice and applicable rights-request propagation with the real relationship.

## International processing

Map regions, remote access and onward transfers against actual contractual and regulatory obligations. EU/UK data is not universally required to remain within EU/UK borders. Determine whether a restricted transfer arises and whether the relevant adequacy decision, safeguards or exception applies. Region selection alone does not prove transfer compliance. Flag unresolved interpretation as **[LEGAL]** and supply the facts needed to resolve it.

## Sources checked 9 November 2026

- [ICO controller and processor roles](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/controllers-and-processors/controllers-and-processors/what-are-controllers-and-processors/)
- [ICO determining a recipient's role](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/controllers-and-processors/controllers-and-processors/how-do-you-determine-whether-you-are-a-controller-or-processor/)

- [ICO international-transfer guide](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/a-brief-guide-to-international-transfers/)

Recheck current jurisdiction-specific retention and transfer requirements. `data-subject-rights.md` covers request handling; `scaling-audit` covers durable backup operation.
