# App Store readiness

Use S19.01 through S19.20 for an intended iOS/iPadOS App Store release, including a packaged web app. Establish platform, distribution channel, build/revision, OS, storefront, supported devices/localisations and review access. A browser-only website or PWA has no App Store obligation simply because it runs on an iPhone. Other Apple platforms and alternative distribution need their own applicability review; do not silently apply iOS-specific conditions to them.

The screenshot calls these routes to a ban. Assess the actual release condition and evidence. Submission rejection, app removal and developer-account termination are distinct outcomes. This module covers the supplied concerns, not every App Store requirement, and cannot guarantee Apple's decision. Read the [current App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) and linked topic guidance when executing; sources here were checked on 15 November 2026.

## Scope, authority and evidence

Inspect repository configuration, submitted assets and available App Store Connect settings. Rehearse applicable behaviour with disposable accounts, local/sandbox services and a stated request budget. Make no live submission, public metadata change, customer-data deletion, contact message, moderation report or review. Retain the ordinary audit-only authority; authorised fixes are a separate phase.

For every probe, record assessed/result, not applicable/reason or partial/blocked/missing scope in the existing release review notes. Retain build identifiers, capture dates, source locations and redacted provider evidence; do not publish reviewer credentials. Reuse another check only where its actual scope covers this probe. Route defects to native owners and merge root causes. S19 labels add no controls, score, lens or report fields.

Keep source, provider and executed evidence distinct under [evidence assurance](../../production-audit/references/evidence-assurance.md) and the [observation contract](../../production-audit/references/observation-contract.md). Browser success cannot establish native permissions, IPv6-only device behaviour, ATT or review access. Record native/device results in the release review with their actual method and limits; an automated process probe may use the existing execution contract when suitable. Do not relabel a manual device capture as a completed `web` observation or invent a new evidence mode. Where required evidence cannot be represented or obtained, retain the notes and mark the affected scope partial/blocked.

In the website profile, keep applicable web/source/provider evidence in its existing topic records and cross-reference the release notes. A wholly inapplicable topic retains empty evidence/findings/limitations arrays; explain its inapplicable probes in the reason or a referenced note. Native-only audits use the ordinary lens coverage rather than inventing website topics. Release-and-ops coordinates the assessment; privacy and functional consequences retain their owners.

## Contents

- [S19.01: Android in the listing](#s1901-android-in-the-listing)
- [S19.02: Called it beta](#s1902-called-it-beta)
- [S19.03: Hidden feature](#s1903-hidden-feature)
- [S19.04: Breaks on IPv6](#s1904-breaks-on-ipv6)
- [S19.05: Lorem ipsum left in](#s1905-lorem-ipsum-left-in)
- [S19.06: DIY rate-us popup](#s1906-diy-rate-us-popup)
- [S19.07: No camera reason](#s1907-no-camera-reason)
- [S19.08: Google login only](#s1908-google-login-only)
- [S19.09: User data to AI](#s1909-user-data-to-ai)
- [S19.10: Website wrapper](#s1910-website-wrapper)
- [S19.11: Screenshots show the submitted app](#s1911-screenshots-show-the-submitted-app)
- [S19.12: Account deletion can start in the app](#s1912-account-deletion-can-start-in-the-app)
- [S19.13: Downloaded software has an applicable distribution basis](#s1913-downloaded-software-has-an-applicable-distribution-basis)
- [S19.14: Content reporting reaches a moderation process](#s1914-content-reporting-reaches-a-moderation-process)
- [S19.15: Reviewers can access the relevant journeys](#s1915-reviewers-can-access-the-relevant-journeys)
- [S19.16: Tracking follows the applicable ATT decision](#s1916-tracking-follows-the-applicable-att-decision)
- [S19.17: Support and review contacts are reachable](#s1917-support-and-review-contacts-are-reachable)
- [S19.18: Icons and identity have defensible provenance](#s1918-icons-and-identity-have-defensible-provenance)
- [S19.19: Store metadata describes the product accurately](#s1919-store-metadata-describes-the-product-accurately)
- [S19.20: Ratings activity is authentic](#s1920-ratings-activity-is-authentic)

## S19.01: Android in the listing

**Applicability/check:** Review the app and submitted metadata for other-platform names, branding or captured UI. Guideline 2.3.10 has an exception for specifically approved interactive functionality; do not erase a legitimate integration without checking its approval and purpose. Compare assets across supported devices and localisations.

**Acceptance:** Record each questionable asset and its correction or supported exception. Listing images represent the submitted Apple build; a website's legitimate Android download link is outside this probe.

Owners: `release-and-ops`, `impeccable-audit`. Existing controls: BRAND-04, OPS-03.

Sources: [Apple policy update, 2.3.10](https://developer.apple.com/news/?id=flmb6ri3); [screenshot guidance](https://developer.apple.com/help/app-review/guideline-reference/2-3-3-screenshots/).

## S19.02: Called it beta

**Applicability/check:** Compare distribution intent with release readiness. Guideline 2.2 directs beta distribution to TestFlight. Inspect unfinished flows and inaccurate release claims; deleting the word “beta” does not finish an app. Subscription free trials are a separate supported offer, not automatically beta software.

**Acceptance:** Record the intended channel, build and completed journeys, or a concrete readiness gap. Keep genuine test distribution identified accurately.

Owners: `release-and-ops`. Existing controls: BASE-04, UX-09, OPS-01.

Sources: [Guideline 2.2](https://developer.apple.com/app-store/review/guidelines/#beta-testing); [TestFlight](https://developer.apple.com/testflight/); [subscription trials](https://developer.apple.com/app-store/subscriptions/).

## S19.03: Hidden feature

**Applicability/check:** Reconcile shipped functionality, remote flags, region/account variants and review instructions. Apple's October 2026 update moved the hidden-functionality rule to 2.5.19; 2.3.1 still addresses review disclosure. Investigate concealment or inaccessible review paths, without treating ordinary progressive disclosure as proof of deception.

**Acceptance:** A feature inventory maps to reproducible reviewer access and specific notes. Document dormant or undisclosed paths and required remediation; do not enable production features merely to test them.

Owners: `release-and-ops`, `code-audit`. Existing controls: BASE-02, OPS-02, OPS-03.

Sources: [October 2026 clarification](https://developer.apple.com/news/?id=92th7e5i); [complete-review information](https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review).

## S19.04: Breaks on IPv6

**Applicability/check:** Exercise network-dependent app journeys on a recorded IPv6-only DNS64/NAT64 test network. Inspect address literals, address-family assumptions and SDK dependencies. An internet server can remain reachable through translation; do not require an immediate server rewrite or removal of every IPv4 reference.

**Acceptance:** Device/build/network evidence covers launch, authentication and representative data operations without cellular fallback. Source inspection or ordinary Wi-Fi success alone leaves this check unverified.

Owners: `release-and-ops`, `code-audit`. Existing controls: BASE-04, REL-01, OPS-01.

Source: [Apple IPv6 requirements and test conditions](https://developer.apple.com/support/ipv6/).

## S19.05: Lorem ipsum left in

**Applicability/check:** Search shipped strings, remote content, metadata and assets for unintended samples; inspect rendered onboarding, empty/error states and less-used screens. Apple's completeness guidance rejects unfinished placeholder content. Preserve useful field hints and intentionally supplied example content.

**Acceptance:** Each search hit has a context-based disposition. The submitted build and referenced destinations contain the intended content, with unresolved business facts assigned to their owner rather than invented.

Owners: `release-and-ops`, `code-audit`. Existing controls: UX-01, UX-09, OPS-01.

Source: [Apple common submission issues: placeholder content](https://developer.apple.com/app-store/review/).

## S19.06: DIY rate-us popup

**Applicability/check:** For App Store rating solicitation, inspect triggers and the selected StoreKit API; Guideline 5.6.1 disallows custom review prompts. Distinguish a support survey from rating solicitation. A persistent product-page review link is supported; the system prompt may not appear, including in TestFlight.

**Acceptance:** Evidence identifies invocation, timing, dismissal and continued operation when no prompt appears. No task depends on obtaining a rating, and no custom popup replaces the system solicitation.

Owners: `release-and-ops`, `frontend-robustness`. Existing controls: UX-05, UX-06, OPS-01.

Sources: [Guideline 5.6.1](https://developer.apple.com/app-store/review/guidelines/#customer-reviews); [RequestReviewAction behaviour and review links](https://developer.apple.com/documentation/storekit/requestreviewaction).

## S19.07: No camera reason

**Applicability/check:** Where app or SDK paths access the camera, inspect the built usage description, localisations and corresponding feature. Explain the actual use through `NSCameraUsageDescription`; a resource name or vague benefit is insufficient. Investigate unnecessary access rather than inventing a justification.

**Acceptance:** Capture the permission explanation and allowed/denied/restricted outcomes using safe fixtures. Denial produces truthful recovery; code and actual resource use match the explanation. Record unavailable device evidence.

Owners: `data-privacy`, `release-and-ops`. Existing controls: PRIV-01, PRIV-03, UX-05, OPS-01.

Sources: [purpose-string requirements](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-purpose-strings); [protected-resource implementation](https://developer.apple.com/documentation/uikit/requesting-access-to-protected-resources).

## S19.08: Google login only

**Applicability/check:** Identify whether third-party sign-in authenticates the app's primary account. Apply current 4.8, recording any exemption and its preconditions. Where required, assess the alternative against its limited-collection, private-email and advertising-consent conditions. Google sign-in alone does not establish a violation; do not require a new login method where an exemption applies.

**Acceptance:** Evidence supports the exception or demonstrates the equivalent option, including signup, private-email handling, cancellation and recovery. An Apple button or ordinary email/password form alone does not prove the requirements are met.

Owners: `release-and-ops`, `code-audit`, `data-privacy`. Existing controls: SEC-03, PRIV-01, OPS-03.

Source: [current Guideline 4.8 and exceptions](https://developer.apple.com/app-store/review/guidelines/#login-services).

## S19.09: User data to AI

**Applicability/check:** Trace personal data reaching third-party AI, including server forwarding and SDKs. Apple's 5.1.2 clarification requires clear disclosure and prior explicit permission. Identify recipient, payload and purpose; distinguish on-device processing from external transfer. A generic AI label is insufficient evidence either way.

**Acceptance:** Safe fixtures demonstrate no relevant transfer before permission or after refusal. Observed payloads match disclosures and settings; withdrawal affects subsequent transfers. Include provider retention and sensitive-data limitations in the existing privacy review.

Owners: `data-privacy`, `code-audit`. Existing controls: PRIV-01, PRIV-02, PRIV-03, PRIV-05.

Source: [Apple's third-party AI clarification](https://developer.apple.com/news/?id=ey6d8onl).

## S19.10: Website wrapper

**Applicability/check:** Evaluate lasting utility and the actual app experience under 4.2; using web technology is not itself the failure. The marketing-material restriction includes a catalogue exception. Compare primary tasks with the packaged experience; do not add gratuitous permissions or native features to manufacture a distinction.

**Acceptance:** Document useful completed journeys, platform behaviour and any substantive experience gap. A working WebView proves neither rejection nor approval. Preserve a valid browser-only product when no App Store release is intended.

Owners: `release-and-ops`, `taste-audit`, `mobile-and-responsive`. Existing controls: BASE-01, BRAND-01, UX-06, OPS-01.

Source: [Guideline 4.2: minimum functionality](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality).

## S19.11: Screenshots show the submitted app

For each device and localisation, compare the submitted images with the review build. More than half must show the app in use; a minority of splash or marketing images is permitted. Check that overlays leave the functionality legible.

Acceptance evidence: a labelled image inventory and matching build captures, with the in-use count for each set. Preserve truthful promotional images that fit the rule.

Owners: release-and-ops; impeccable-audit. Existing controls: OPS-03, BRAND-06.

Primary reference: [Apple screenshot guidance](https://developer.apple.com/help/app-review/guideline-reference/2-3-3-screenshots).

## S19.12: Account deletion can start in the app

Apply when the app supports account creation, including automatic guest accounts or registration on the web. Trace initiation through actual account/data deletion, allowing disclosed lawful retention. Deactivation alone is insufficient. A direct website completion link is allowed; additional support-assisted steps have a limited highly regulated industry exception. Ordinary apps must avoid support-only deletion.

Acceptance evidence: disposable-account flow and backend deletion fixtures, including identity-token revocation where applicable. Verify disclosed processing time and subscription consequences; an active subscription must not force users to wait until expiry. Record any untested downstream deletion.

Owners: data-privacy; code-audit; release-and-ops. Existing controls: PRIV-05, SEC-03, PAY-03, OPS-03.

Primary reference: [Apple account-deletion guidance](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion).

## S19.13: Downloaded software has an applicable distribution basis

Inventory fetched executable code, OTA updates and hosted software separately from content. Check feature changes against 2.5.2. Its limited educational exception requires viewable/editable source. Section 4.7 permits specified HTML5/JavaScript mini apps/games, streaming games, chatbots, plug-ins and retro-console/PC-emulator games, with additional conditions. JavaScript alone establishes no exemption.

Acceptance evidence: loader paths and build configuration tied to a documented rule or exception. For 4.7, examine moderation, payments/privacy, native-API permission, per-software consent, the software index/universal links and age restrictions. Use isolated fixtures for execution boundaries. Escalate unresolved eligibility without asserting approval or automatic rejection.

Owners: release-and-ops; code-audit; dependency-audit. Existing controls: OPS-03, SEC-13, SEC-12.

Primary reference: [Apple Guidelines 2.5.2 and 4.7](https://developer.apple.com/app-store/review/guidelines/).

## S19.14: Content reporting reaches a moderation process

Apply current 1.2 to user-contributed content, including AI content creation apps; hosted software under 4.7 also has moderation duties. A visible report control alone proves little. Trace filtering, report intake, response ownership, abusive-user blocking and support contact.

Acceptance evidence: inert content fixtures reach a private test queue, blocking changes the intended interaction, and the operator can identify the response process. Record missing operational evidence. A static informational app does not acquire a report-button requirement from this screenshot.

Owners: code-audit; release-and-ops; ai-saas-security when AI applies. Existing controls: UX-06, UX-08, SEC-04; SEC-15 when applicable.

Primary reference: [Apple Guidelines 1.2 and 4.7.1](https://developer.apple.com/app-store/review/guidelines/).

## S19.15: Reviewers can access the relevant journeys

For gated features, inspect the review-access plan: working demo accounts or an appropriate complete demonstration mode. Record prior Apple approval where Guideline 2.1 requires it for a substitute mode. Cover relevant roles and purchase states, including an expired-subscription account where required. Check that supporting services and instructions let reviewers reproduce the submitted experience.

Acceptance evidence: a rehearsal against disposable review data and redacted review-note coverage. Keep credential values out of the report. An inaccessible journey remains blocked; a screenshot or prerecorded walkthrough alone does not demonstrate access.

Owners: release-and-ops; code-audit. Existing controls: OPS-03, SEC-03, BASE-03.

Primary references: [Apple complete-review guidance](https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review); [Guideline 2.1](https://developer.apple.com/app-store/review/guidelines/#app-completeness).

## S19.16: Tracking follows the applicable ATT decision

Classify actual SDK/data flows against Apple's tracking definition before requiring a prompt. Ordinary first-party analytics does not automatically qualify. When ATT applies, check the supported OS/storefront interface and test undetermined, denied, restricted and authorised states with intercepted fixtures.

Acceptance evidence: SDK configuration and network traces establish that tracking waits for permission and stops after withdrawal. Website consent or another identifier cannot override an ATT refusal. Check for coercive access gates and distinguish functional webviews from open-web browsing where Apple's exception applies.

Owners: data-privacy; analytics-and-instrumentation; release-and-ops. Existing controls: PRIV-01, PRIV-02, PRIV-04, OPS-03.

Primary reference: [Apple privacy and data-use guidance](https://developer.apple.com/app-store/user-privacy-and-data-use/).

## S19.17: Support and review contacts are reachable

Check the in-app support route, public Support URL and private App Review contact fields separately. Follow each URL, inspect the destination, and check that the details belong to the responsible operator. Apply address/phone disclosure requirements only where relevant to the distribution context.

Acceptance evidence: destination captures, redacted metadata and confirmed support ownership. A successful page response with no usable contact route fails this check. Do not send a test message without separate authorisation.

Owners: release-and-ops; code-audit. Existing controls: UX-08, OPS-03.

Primary references: [Apple platform metadata](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information), [Apple support placement guidance](https://developer.apple.com/app-store/ratings-and-reviews/).

## S19.18: Icons and identity have defensible provenance

Inspect the submitted icon variants and app name for impersonation or unapproved use of another developer's identity. Gather original asset sources or relevant permissions. Similarity should prompt a specific comparison; do not infer infringement from a shared visual convention alone.

Acceptance evidence: an asset/permission trail tied to the submitted build and a reasoned identity review. Unresolved ownership stays a documented dependency requiring the rights holder's evidence.

Owners: release-and-ops; impeccable-audit. Existing controls: BRAND-04, BRAND-06, BASE-05.

Primary reference: [Apple copycat and impersonation guidance](https://developer.apple.com/help/app-review/guideline-reference/4-1-prevent-copycat-rejection).

## S19.19: Store metadata describes the product accurately

Review every submitted localisation. Validate the name's two-to-30-character limit and subtitle's 30-character limit, then inspect relevance. Descriptive language can remain; unrelated popular-brand references or misleading terms need a finding supported by the actual text.

Acceptance evidence: metadata export, measured field lengths and comparison with working features. Keep app-name, subtitle and keyword-field checks distinct. Record the reason for each proposed rewrite.

Owners: release-and-ops; seo-discoverability. Existing controls: SEO-03, BRAND-01, OPS-03.

Primary references: [Apple app-information fields](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information), [Apple metadata relevance guidance](https://developer.apple.com/help/app-review/guideline-reference/4-1-prevent-copycat-rejection).

## S19.20: Ratings activity is authentic

Inspect review-prompt code and disclosed acquisition arrangements for fabricated or purchased reviews, rewards tied to submitting ratings or reviews regardless of sentiment, sentiment-based routing that withholds critical feedback from App Store review requests, or access conditioned on rating. Ordinary requests after meaningful use can remain. Where a prompt exists, rehearse the supported Apple mechanism in a test build without submitting feedback. Inspect agency instructions as well as app code when supplied.

Acceptance evidence: prompt paths and documented marketing arrangements, with external visibility limits recorded. Apple investigates manipulation; serious or repeated violations can remove apps or developer accounts. A suspicious review alone does not prove developer involvement or an automatic ban.

Owners: release-and-ops; code-audit. Existing controls: CONV-04, BRAND-06, OPS-03.

Primary references: [Apple rating-manipulation policy](https://developer.apple.com/app-store/review/guidelines/#business), [Apple investigation and enforcement guidance](https://developer.apple.com/help/app-review/after-submitting-for-review/review-status/), [Apple ratings API guidance](https://developer.apple.com/app-store/ratings-and-reviews/).
