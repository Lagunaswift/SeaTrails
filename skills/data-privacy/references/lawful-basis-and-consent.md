# Lawful basis and consent

Why the app is allowed to process each piece of personal data, and where genuine consent is required. The engineering-relevant part is consent and tracking, where the implementation directly determines compliance. The choice of lawful basis for a given purpose is a legal determination. **[LEGAL]**

## Lawful basis, briefly [LEGAL]

Under GDPR/UK GDPR, every processing of personal data needs a lawful basis (consent, contract, legitimate interests, legal obligation, and others). You do not always need consent, processing necessary to provide the service the user signed up for often rests on contract, not consent. Picking the right basis for each purpose is a legal call; do not assume everything needs consent, and do not assume nothing does. Flag this for a lawyer/DPO. The engineering job is to implement whatever basis applies correctly, which for consent-based processing means implementing consent properly.

## Consent done properly

Where consent is the basis (notably for non-essential tracking and for marketing), it has to be real consent, not the dark-pattern version most sites use. Valid consent is:
- **Freely given:** the user can refuse without losing the core service. "Accept all or you can't use the site" is generally not valid for non-essential processing.
- **Specific and informed:** the user knows what they are agreeing to, per purpose, before it happens.
- **Unambiguous and opt-in:** an affirmative action. Pre-ticked boxes, "by continuing you agree", and implied consent do not count.
- **As easy to withdraw as to give:** refusing/withdrawing must be as easy as accepting.

A compliant cookie/consent banner therefore has a "reject" option as prominent as "accept", does not pre-tick anything, and does not fire the non-essential trackers until the user opts in.

## Tracking and analytics, the common violation

This is where fast-built apps most often break the law without realising. Cookies and identifiers beyond the strictly necessary (analytics, advertising, most third-party scripts) generally require prior opt-in consent under GDPR/ePrivacy. The frequent mistakes:
- Loading Google Analytics, Meta Pixel, or similar on page load, before any consent. The tracker has already run by the time the banner appears.
- A banner that only has "Accept", or where "reject" is hidden or harder.
- Treating "strictly necessary" loosely, only genuinely essential cookies (session, security, load balancing) are exempt from consent; analytics and marketing are not.

The fix: non-essential trackers must not fire until the user has opted in, and the user must be able to decline as easily as accept. This usually means a consent-management setup that gates script loading on the user's choice.

## Marketing email consent

Marketing email generally needs consent and always needs a working, easy unsubscribe (and an accurate "why you're getting this"). This ties to any email funnel the app runs and to email-deliverability (unsubscribe handling is both a legal duty and a deliverability factor). Transactional email (a receipt, a password reset) is different from marketing and rests on different ground, do not conflate them. **[LEGAL]** for the marketing/transactional line in a specific case.

## Regional note (worldwide apps)
Consent-first is the GDPR/UK/EU model. Some regimes (notably California's CCPA/CPRA) lean more on opt-out and disclosure than prior opt-in for certain processing. For a worldwide audience, the safe default is to meet the strictest applicable standard (consent-first), since you will have EU/UK users. The exact obligations per region are **[LEGAL]**.

## What to flag, by stage
- No tracking, no marketing, transactional email only: consent is largely not the issue; confirm analytics genuinely is not running pre-consent.
- Has analytics/tracking: the pre-consent firing of trackers and accept-only banners are the high findings. Fix by gating non-essential scripts on opt-in.
- Marketing email: confirm consent and a working unsubscribe; flag the basis for review.

## The honest framing
The most common real violation in this area is analytics that runs before consent behind an accept-only banner. It is widespread, it is genuinely non-compliant under GDPR, and it is fixable with a proper consent gate. Flag it plainly, and separate the engineering fix (gate the scripts) from the legal question of which basis applies to what (lawyer/DPO).
