# Lawful basis, storage/access and consent

Map each purpose, data flow, audience and jurisdiction before assessing the control. A lawful basis for personal-data processing and permission to store/access device information are separate questions. A banner's presence, an SDK's marketing label or the word "cookieless" cannot settle either.

## Inspect actual behaviour

Inventory cookies, local storage, scripts/SDKs, embeds, pixels, link decoration, fingerprinting and server-side forwarding. Record the destination, payload, identifiers, purpose, lifetime and responsible recipient. Check whether information is accessed or sent before a choice; a visually disabled banner category can still leak events through another path.

For purposes requiring consent, inspect an informed, specific, active opt-in with no preselected optional categories; refusal should be as easy as acceptance. Withdrawal should be accessible and stop subsequent relevant processing. Consent records and the stated purpose must match the actual implementation.

## Conditional UK exceptions

ICO guidance updated in 2026 includes narrow exceptions for statistical purposes and appearance, alongside other defined exceptions. Do not infer eligibility from the name of a vendor or from all analytics being "first party".

For the statistical exception, verify service-improvement purpose, aggregate non-personal results, no decisions about individual people, limited retention of individual information for aggregation and any third party acting solely on the service's behalf for that purpose. Check clear information and a simple, free means to object. Review appearance uses against their own current conditions. If the implementation falls outside an exception, assess the relevant consent requirement; do not silently reinterpret the purpose to qualify.

These storage/access exceptions do not remove separate personal-data obligations. Other jurisdictions may require different controls. Record an unresolved applicability question as **[LEGAL]**, with the configuration and data-flow evidence.

## Verify the choice states

Use a fresh browser profile and safe test events. Observe storage and outgoing requests for: no choice, accept, reject, custom choices, withdrawal and return visit. Test that any required pre-choice blocking works, refusal/objection persists appropriately, withdrawn categories stop and authorised essential functions still work. Include server forwarding and embedded services in the evidence. Test the exception's objection path where that is the applicable control rather than forcing a consent banner.

No access to the consent platform or server destination means that part remains unverified, not passed.

## Marketing and follow-up

Check the current rules for recipient type and jurisdiction, including valid consent or an applicable exception such as a qualifying UK soft opt-in. Verify unsubscribe, objection/suppression and the separation of transactional messages from marketing. Cart reminders are not automatically authorised merely because an address was entered. Refer delivery mechanics to `email-deliverability`; an audit does not send messages.

## Sources checked 9 November 2026

- [ICO storage and access technologies guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/)
- [ICO exceptions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)
- [ICO consent in practice](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice/)
- [ICO direct-marketing planning](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/direct-marketing-guidance/plan-direct-marketing/)

Recheck current guidance and applicable law before making a compliance determination.
