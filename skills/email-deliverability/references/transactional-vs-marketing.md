# Transactional vs marketing, and feedback processing

Two things that determine whether the right mail reaches the right person reliably: treating transactional and marketing email as the different things they are, and actually processing the bounce/complaint feedback the provider sends back.

## The two kinds of mail

**Transactional email** is triggered by and specific to one user's action: a password reset, an email-verification link, a receipt, an order confirmation, a security alert. The user is expecting it, often urgently. Deliverability here is critical, a password reset in spam is a locked-out user, a broken product. Transactional mail rests on the user relationship (they gave you the address to use the service), not on marketing consent, and generally does not carry a marketing unsubscribe (you cannot "unsubscribe" from password resets).

**Marketing email** is sent to many people to promote, inform, or nurture: newsletters, sequences, announcements, the seatrial-style funnel. It requires consent, must carry an easy unsubscribe, and is reputation-sensitive (complaints, engagement). It is the kind list-hygiene, consent, and reputation concerns mostly target.

**Why the distinction matters:** they have different rules (consent, unsubscribe), different urgency, and different reputation profiles. Conflating them causes problems, treating a password reset like marketing (adding unsubscribe, routing through a reputation-damaged channel) can break critical mail; treating marketing like transactional (no unsubscribe, assuming consent) breaks the law and reputation.

## Separating the streams

The strong practice for apps sending both: keep transactional and marketing mail on separate sending streams, ideally separate subdomains (see sending-setup.md). The reason is reputation isolation:
- If a marketing campaign draws complaints and damages its sending reputation, you do not want that to drag down the deliverability of password resets and receipts.
- Separated, a marketing reputation hit stays contained, and critical transactional mail keeps landing.

Some providers offer distinct streams/configurations for exactly this. At minimum, be aware that mixing both on one identity means a marketing misstep can sink your transactional mail.

## Processing bounces and complaints (the feedback loop)

Sending is only half the system; the provider sends information *back*, and the app must act on it. This is the most commonly skipped piece in fast-built apps.

- **Bounces:** when mail cannot be delivered, the provider reports it (hard bounce = permanent, the address is bad; soft = temporary). The app must record hard bounces and **stop sending to those addresses**. Continuing to mail known-bad addresses damages reputation (sender-reputation.md).
- **Complaints (feedback loops):** when a recipient marks mail as spam, providers (via feedback loops the sending provider participates in) report it back. The app must **suppress that address immediately**, never mail someone again who flagged you as spam. Ignoring complaints is one of the fastest ways to ruin reputation.
- **Mechanism:** reputable providers expose these via webhooks or an API. The app needs to consume them and maintain a **suppression list** of addresses never to send to (hard bounces + complainers + unsubscribes), and check it before every send.

Without this loop, the list steadily fills with dead and hostile addresses, every send to which erodes reputation, a slow, invisible decline until mail stops landing.

## What to flag
- Transactional and marketing mail not separated, where a marketing reputation hit could sink critical mail.
- Transactional mail (password reset, verification) at deliverability risk (unauthenticated, routed through a reputation-damaged or marketing channel).
- **No bounce processing**, hard bounces kept on the list and re-mailed.
- **No complaint processing / no suppression list**, spam-flaggers and bounces still being mailed (the top reputation-killer here).
- Marketing treated as transactional (no consent, no unsubscribe) or vice versa.

## The honest framing
Treat the two kinds of mail as different: protect transactional deliverability above all (it is a working product), and run marketing on a separate, consented, unsubscribe-bearing, reputation-managed stream. And close the feedback loop, consume the provider's bounce and complaint reports and maintain a suppression list, because a system that sends but never listens to what comes back will slowly mail its own reputation into the ground. Separation plus feedback processing is what keeps the password resets landing while the marketing runs alongside.

## Connection to other skills
Consent and unsubscribe duties: `data-privacy` and list-hygiene.md. Subdomain separation: sending-setup.md. Reputation impact of unprocessed bounces/complaints: sender-reputation.md. The webhook/suppression-list implementation touches `release-and-ops` (the integration and its config).
