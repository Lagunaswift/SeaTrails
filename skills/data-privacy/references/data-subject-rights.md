# Data subject rights and request handling

Check whether the organisation can fulfil applicable requests accurately and securely. Rights have conditions and exceptions; do not equate deleting an account with erasing every record, or assume every access request is a portability request.

## The operational path

- Confirm a discoverable request/contact route, named owner, appropriate identity verification and tracked response deadlines under the applicable regime.
- Trace relevant data through primary/related records, logs, caches, search indexes, exports and external recipients. Avoid exporting another person's data or overcollecting identity documents.
- Access, correction, erasure, restriction and objection need their own handling. Portability has a narrower scope; under UK GDPR it generally concerns provided data processed automatically on consent/contract grounds, subject to the detailed rules.
- A secure, documented manual process can be sufficient. Do not require new self-service screens unless the product promises them, the applicable obligation requires them or operational scale justifies them.

## Erasure and lawful retention

Erasure is not absolute. Identify the requested scope and any applicable retention exception, such as required records or legal claims. Document the retained category, purpose, access restriction and expiry; do not present an account deletion as total erasure when records remain lawfully retained.

Follow the request through relevant recipients according to their actual role and applicable obligations. A payment provider or other independent controller may have its own retention duties; not every third party is a processor that must blindly delete on command.

For backups, inspect documented expiry, access restrictions and measures to keep erased data beyond use until replacement. A restore must not silently reactivate erased or suppressed records; verify the restore/reconciliation procedure with safe fixtures or existing drill evidence. Do not promise surgical deletion from every immutable snapshot.

## Audit evidence

Use code/configuration, documented operations and synthetic-account tests in an authorised environment. Record which stores and external services were verified, any lawful exclusions, response tracking and untested parts. An audit does not authorise deleting live accounts, submitting real rights requests or contacting third parties.

## Sources checked 9 November 2026

- [ICO right to erasure](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/)
- [ICO right to data portability](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-data-portability/)

Recheck current scope, exceptions and deadlines. Legal interpretation should use the actual data/processing facts. Backup durability belongs to `scaling-audit`; this reference owns the rights consequence.
