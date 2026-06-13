# Sending domain and provider setup

The identity you send from and the infrastructure behind it. Even with authentication in place, the choice of from-domain, whether you isolate bulk mail, and how the sending provider is configured all affect whether mail lands.

## Send from your own domain

Mail should come from an address on a domain you own and have authenticated, `hello@yourdomain.com`, not a free-provider address. Sending "from" a gmail.com or outlook.com address via a third-party service fails authentication (you cannot publish SPF/DKIM for gmail.com) and looks like spoofing to receivers. Always send from your own authenticated domain. A no-reply address is acceptable for transactional mail, though a real reply-to that reaches you is friendlier and can help engagement.

## Subdomain strategy for reputation isolation

Reputation attaches to the sending domain. A useful practice for apps sending both kinds of mail: send marketing/bulk mail from a subdomain (e.g. `mail.yourdomain.com` or `news.yourdomain.com`) separate from transactional mail (and from your human business email on the root domain). The benefit:
- If a marketing campaign draws spam complaints and damages reputation, it damages the *subdomain's* reputation, not your primary domain's, so your password resets and your personal business email keep landing.
- Different streams can be authenticated and monitored separately.

For a low-volume app this can be overkill; for one running marketing sequences alongside critical transactional mail, isolating them is worth it. At minimum, be aware that all mail from one domain shares one reputation.

## Choosing and configuring a provider

Use a reputable transactional/bulk email provider (Resend, Postmark, SendGrid, Amazon SES, Mailgun, and similar) rather than sending directly from your own server. They handle the sending infrastructure, provide DKIM signing, manage IP reputation, and process bounces/complaints, all things that are hard to do well yourself. Configure it correctly: complete the domain verification (the SPF/DKIM records they give you), and use their bounce/complaint webhooks (see transactional-vs-marketing.md).

## Shared vs dedicated IP

Providers send either from a shared pool of IPs (used by many of their customers) or a dedicated IP (just you):
- **Shared IP:** reputation is pooled, you benefit from the provider keeping the pool clean, and a single sender's mistake is diluted. Best for low-to-moderate volume, no warm-up burden. The usual right choice for most apps.
- **Dedicated IP:** reputation is entirely yours, good at high, consistent volume, but it must be *warmed up* (see sender-reputation.md) and needs steady volume to maintain reputation; low or erratic volume on a dedicated IP can actually hurt. Only worth it at scale.

Most apps should use shared IPs from a good provider unless volume is high enough to justify and sustain a dedicated one.

## What to flag
- Sending from a free-provider address (gmail/outlook) rather than an owned, authenticated domain.
- Marketing and critical transactional mail sharing one domain's reputation with no isolation, when volume/stakes would justify a subdomain.
- Sending directly from an app server rather than a reputable provider (hard to authenticate, no reputation management, no bounce handling).
- A dedicated IP at low/erratic volume (reputation cannot be sustained), or a fresh dedicated IP used without warm-up.

## The honest framing
For most apps the right setup is: a reputable provider, sending from your own authenticated domain, on shared IPs, with marketing isolated to a subdomain if you run campaigns alongside critical transactional mail. That covers the infrastructure side; the rest of deliverability is reputation and list hygiene on top of it. Avoid the two classic mistakes, sending from a free address, and reaching for a dedicated IP before volume justifies it.

## Connection to other skills
Provider API keys and DNS configuration live in `release-and-ops` (secrets and domain config). The reputation that this setup protects is detailed in sender-reputation.md.
