---
name: email-deliverability
description: "Use this skill to make application email actually reach the inbox rather than spam or oblivion: domain authentication (SPF, DKIM, DMARC), sender reputation, list hygiene, content that does not trip filters, bounce and complaint handling, and the transactional-vs-marketing distinction. Trigger on phrases like 'emails going to spam', 'deliverability', 'SPF', 'DKIM', 'DMARC', 'email not arriving', 'sender reputation', 'bounce', 'unsubscribe', 'why is my email in junk', 'set up email sending', 'Resend/SendGrid/Postmark/SES', 'verify my domain', 'cold email', or when an app sends email (welcome, password reset, notifications, newsletters, sequences) and the question is whether it lands. This is the does-the-email-arrive lens. It does not cover the wiring of sending email in code (that is general integration work) or marketing copy quality (use anti-slop-writing). Defaults to a prioritised assessment of deliverability risks and the concrete fixes. Applies to any app sending email from any provider."
---

# Email Deliverability

The lens for one question: **does the app's email actually reach the inbox?** Sending email is easy; getting it delivered is not. Mail providers (Gmail, Outlook, Apple) aggressively filter, and email that is not properly authenticated, or comes from a domain with no reputation, or looks like spam, lands in junk or is dropped entirely, with no error. The app thinks it sent; the user never sees it. For a password reset or a welcome email, that is a broken product; for a marketing sequence, it is wasted effort and damaged reputation.

This does not cover writing the sending code (general integration) or the quality of the copy (`anti-slop-writing`); it covers what determines whether correctly-sent email arrives.

## The cardinal principle

**Authenticate the domain, protect its reputation, and only send wanted mail; deliverability is earned and easily lost.** There is no trick that forces email into the inbox. Providers decide based on whether the sender is who they claim (authentication), whether recipients want and engage with the mail (reputation), and whether the content and list look legitimate. Get those right and email lands; neglect them and it does not, and a reputation damaged by spam complaints or bad lists takes real effort to rebuild. The work is upfront setup plus ongoing hygiene, not a one-time fix.

## Assessment by default, setup guidance when asked

Default to assessing the deliverability posture, authentication records, reputation risks, list and content practices, and flagging gaps in priority order. Give concrete setup steps (DNS records, provider config) when asked to set it up rather than assess.

## The areas, in priority order

### 1. Domain authentication: SPF, DKIM, DMARC (do this first)
The non-negotiable foundation. Without it, modern providers may reject or junk mail outright; Gmail and Yahoo now require it for bulk senders.
- **SPF:** a DNS record listing who is allowed to send for your domain. Missing or misconfigured SPF is an instant trust problem.
- **DKIM:** a cryptographic signature proving the mail genuinely came from your domain and was not altered. Set up via your sending provider.
- **DMARC:** a policy tying SPF and DKIM together, telling receivers what to do with mail that fails, and giving you reports. Increasingly required, not optional.
`references/authentication.md` covers what each record is, how they work together, setup, and the now-mandatory baseline.

### 2. Sending domain and provider setup
The identity you send from and the infrastructure behind it.
- Send from your own authenticated domain, not a free address (from-a-gmail.com via a service fails authentication and looks like spoofing).
- Consider a subdomain for bulk/marketing mail (e.g. mail.yourdomain) to isolate its reputation from your primary domain's.
- Use a reputable sending provider (Resend, Postmark, SendGrid, SES, etc.) configured correctly; shared vs dedicated IP tradeoffs.
`references/sending-setup.md` covers domain/subdomain strategy, provider choice, IP reputation, and warm-up.

### 3. Sender reputation
The ongoing score providers keep on you, the biggest factor in whether you stay in the inbox.
- Reputation is built by sending wanted mail that people open and engage with, and destroyed by spam complaints, sending to bad addresses, and sudden volume spikes.
- Warming up a new domain/IP gradually rather than blasting volume from cold.
- Monitoring reputation (provider dashboards, Google Postmaster Tools).
`references/sender-reputation.md` covers what builds and destroys reputation, warm-up, and monitoring.

### 4. List hygiene and consent
Who you send to, which directly drives reputation.
- Only send to people who asked (consent, ties to `data-privacy`); never bought or scraped lists, the fast route to being blocked.
- Confirmed/double opt-in for marketing reduces bad addresses and complaints.
- Remove hard bounces and complainers promptly; do not keep mailing dead or hostile addresses.
- A working, easy unsubscribe (one-click for bulk, now required by Gmail/Yahoo), and honouring it immediately (also a legal duty, `data-privacy`).
`references/list-hygiene.md` covers consent, opt-in, bounce/complaint removal, and unsubscribe.

### 5. Content and format
What trips spam filters in the message itself.
- Spam-trigger patterns: misleading subject lines, all-caps, excessive punctuation, spammy phrases, link shorteners, big image-only emails with no text.
- A healthy text-to-image/link ratio, a plain-text alternative alongside HTML, and links to domains that match the sender.
- Honest, accurate from-name, subject, and headers; nothing that looks like deception.
`references/content-and-format.md` covers spam triggers, structure, and the honesty that filters reward.

### 6. Transactional vs marketing (and bounce/complaint handling)
Treating the two kinds of mail correctly, and processing the feedback.
- **Transactional** (password reset, receipt, verification): expected, per-user, high deliverability need; keep it on a clean path, ideally separated from marketing so a marketing reputation hit does not sink password resets.
- **Marketing/sequences:** consent-based, unsubscribe-bearing, reputation-sensitive.
- **Process bounces and complaints:** the provider reports hard bounces and spam complaints, the app must act on them (suppress those addresses), or reputation erodes.
`references/transactional-vs-marketing.md` covers the split, separation strategy, and feedback processing.

## How to report
Order by impact: missing authentication (SPF/DKIM/DMARC) is the top finding because it can sink everything, then reputation/list risks (bought lists, no bounce handling, no unsubscribe), then content. For each: the current state, what it costs (mail junked, mail dropped, reputation damage, legal exposure), and the fix. Distinguish "this stops mail arriving" from "this slightly raises spam risk." Note what can only be confirmed by testing actual delivery (inbox-placement tests).

## Scoping
Match to volume and type. An app sending only low-volume transactional mail (password resets) from an authenticated domain needs the authentication and a clean from-domain and little else. An app running marketing sequences to a list needs the full set: authentication, reputation management, list hygiene, unsubscribe, content care. The honest minimum for any app sending email at all is SPF + DKIM + DMARC on a real domain; without those, even a perfect password-reset email may not arrive.

## Skills this leans on
- `data-privacy`: consent for marketing email, working unsubscribe, and the legal duties around both, this skill's list-hygiene and the privacy obligations are the same coin
- `anti-slop-writing`: the copy quality of the emails themselves (separate from whether they arrive)
- `release-and-ops`: DNS/domain configuration and the provider API keys live in the ops/secrets layer
