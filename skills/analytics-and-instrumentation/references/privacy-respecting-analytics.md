# Privacy-respecting analytics

Inspect what the implementation does. Vendor labels such as "cookieless", "anonymous" or "first party" do not establish whether identifiers, device access, personal data or onward disclosures are involved.

## Trace the flow

Map browser scripts, cookies/local storage, fingerprints, SDK calls, embeds, session replay and server forwarding to their destinations. Check the properties, retention, user/device identity, recipient role and purposes. Pseudonymous identifiers remain personal data where a person is identifiable; replacing an email with a stable ID does not automatically anonymise the record.

## Verify applicable choices

`data-privacy/references/lawful-basis-and-consent.md` owns the current rules. Where consent is required, verify blocking before opt-in and after refusal/withdrawal across browser and server paths. Where a valid exception applies, verify its actual conditions, information and objection controls. The UK's 2026 statistical/appearance exceptions are conditional, not blanket permission for analytics.

Use safe events to inspect no choice, acceptance, rejection, custom choices, withdrawal and return visits. Do not circumvent a refusal by silently switching to another identifier or endpoint. Account for measurement coverage gaps instead of claiming a complete population.

## Minimise and honour requests

Prefer aggregate data when sufficient. Avoid unnecessary names, emails, sensitive attributes, free text and identifying URL/UTM values. Check session-replay masking at capture and in transmitted payloads, not just in the playback UI. Trace applicable retention, access, objection and erasure handling through the analytics service; account for lawful exceptions and data that was genuinely anonymised.

A simpler measurement approach may reduce exposure, but neither absence of cookies nor presence of a consent banner establishes compliance. An audit does not install new analytics or change the owner's tracking policy.

## Sources checked 9 November 2026

- [ICO storage and access technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/)
- [ICO exceptions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)

Recheck current jurisdiction-specific requirements. `data-privacy` supplies the detailed scope, recipient-role and rights references.
