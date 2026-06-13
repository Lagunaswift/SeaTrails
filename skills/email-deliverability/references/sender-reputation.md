# Sender reputation

The ongoing score mail providers keep on your sending domain and IP, and the single biggest factor in whether your mail stays in the inbox once you are authenticated. Authentication proves who you are; reputation decides whether providers trust mail from that proven identity. It is earned slowly through good sending and lost quickly through bad, and a damaged reputation takes real effort to rebuild.

## What builds reputation

- **Sending mail people want and engage with.** Opens, replies, and especially people moving mail *out* of spam into the inbox all signal to providers that your mail is wanted. Engagement is the strongest positive signal.
- **Consistent, predictable volume.** Steady sending patterns look legitimate; erratic spikes look like a compromised account or a spam run.
- **Low complaint and bounce rates.** Mail that rarely gets marked spam and rarely bounces (because the list is clean) builds trust.
- **Authenticated, aligned mail** (SPF/DKIM/DMARC all passing) over time.

## What destroys reputation

- **Spam complaints.** When recipients click "mark as spam," it directly damages reputation. A small complaint rate (often cited threshold around 0.1–0.3%) is enough to cause problems. The causes: mailing people who did not clearly consent, mailing too often, hard-to-find unsubscribe.
- **Sending to bad addresses.** High hard-bounce rates (addresses that do not exist) signal a poor or purchased list and damage reputation fast. Hitting spam traps (addresses that exist only to catch spammers) is especially damaging.
- **Sudden volume spikes.** Going from near-zero to a large blast looks like abuse and can get you throttled or blocked.
- **Low engagement.** Mail nobody opens, over time, tells providers it is unwanted even without explicit complaints.

## Warming up a new domain or IP

A brand-new sending domain (or dedicated IP) has *no* reputation, and providers are wary of unknown senders suddenly sending volume. Warm-up means ramping gradually: start with low volume to your most engaged recipients, increase steadily over days/weeks as positive signals accumulate, rather than blasting your whole list on day one from a cold domain. Sending a large first campaign from a fresh domain is a common way to land straight in spam and start with a bad reputation. (Shared-IP senders on a good provider are largely spared the IP warm-up, but a new *domain* still benefits from a gentle start.)

## Monitoring reputation

You cannot manage what you cannot see:
- **Google Postmaster Tools:** free, shows your domain's reputation, spam-complaint rate, and authentication results as Gmail sees them. Essential if you send to Gmail addresses (most people).
- **Provider dashboards:** reputable providers surface delivery rates, bounces, complaints, and sometimes reputation indicators.
- **DMARC reports** (see authentication.md): show authentication pass/fail across receivers.
- Watch the trend: a rising complaint or bounce rate is an early warning to fix list/consent practices before reputation craters.

## What to flag
- A new domain about to send significant volume with no warm-up plan.
- No reputation monitoring (flying blind, especially no Google Postmaster Tools).
- Practices that will damage reputation: mailing un-consented lists, no bounce/complaint suppression (see list-hygiene), over-frequent sending, hard-to-find unsubscribe.
- Erratic volume patterns.

## The honest framing
Reputation is the long game of deliverability. There is no shortcut: send mail people genuinely want, to a clean list, at a steady pace, with easy unsubscribe, and reputation builds and mail lands. Send to people who did not ask, ignore bounces, or blast volume from a cold domain, and reputation falls and even your password resets start hitting spam. Warm up new domains gently, monitor with Google Postmaster Tools, and treat every spam complaint as the expensive signal it is.

## Connection to other skills
List hygiene and consent (list-hygiene.md) are the practices that most directly protect reputation, and they overlap with `data-privacy` (consent, unsubscribe as a legal duty). Bounce/complaint processing is in transactional-vs-marketing.md.
