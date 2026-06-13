# List hygiene and consent

Who you send to, which is the practice that most directly drives reputation (sender-reputation.md) and overlaps heavily with legal duty (`data-privacy`). A clean, consented list keeps reputation high and mail landing; a dirty or non-consented one destroys reputation and breaks the law. Most deliverability disasters trace back to the list, not the content.

## Consent: only send to people who asked

The foundation. Send only to people who actively opted in to hear from you. This is both a deliverability rule (un-consented recipients mark mail as spam, which wrecks reputation) and a legal one (GDPR/PECR and similar require consent for marketing, see `data-privacy`).

**Never use bought, scraped, or rented lists.** It is the fastest route to spam complaints, spam-trap hits, and being blocked, and it is generally illegal for marketing. People who did not ask to hear from you mark you as spam, and a few such complaints poison deliverability for everyone on the list. A bought list is not a shortcut; it is sabotage of your sending reputation.

## Opt-in: single vs confirmed (double)

- **Single opt-in:** someone enters their email and is subscribed. Simple, but vulnerable to typos (bounces) and malicious sign-ups of other people's addresses (complaints).
- **Confirmed / double opt-in:** they enter their email and must click a confirmation link before being added. Extra friction, but it guarantees the address is valid and the person actually wants the mail, which means fewer bounces, fewer complaints, and better engagement, all of which protect reputation. For marketing lists, confirmed opt-in is the stronger practice.

For a low-stakes transactional flow (you email the address someone gave to use the service) this is different ground; the consent concern is sharpest for marketing/newsletter lists.

## Bounce and complaint removal

A list decays, and continuing to mail dead or hostile addresses damages reputation:
- **Hard bounces** (address does not exist) must be suppressed immediately, never mailed again. Repeatedly hitting non-existent addresses is a strong negative signal.
- **Soft bounces** (temporary, mailbox full) can be retried but suppressed if they persist.
- **Complaints** (marked as spam) must be suppressed at once, never mail someone again who flagged you.
- The sending provider reports these (via webhooks/dashboard); the app must actually process them and stop sending to those addresses. A list that never removes bounces and complainers steadily rots reputation. (Processing detailed in transactional-vs-marketing.md.)

## Unsubscribe: easy, honoured, and now required

- Marketing mail must include a clear, easy unsubscribe, and Gmail/Yahoo now require **one-click unsubscribe** (a list-unsubscribe header) for bulk senders.
- Unsubscribes must be honoured promptly (a legal duty as well as a deliverability one), continuing to mail someone who opted out generates complaints and breaks the law.
- A hard-to-find or non-working unsubscribe backfires: instead of unsubscribing, people hit "mark as spam," which is far worse for reputation than losing the subscriber.

Making unsubscribe easy is counter-intuitively *good* for deliverability: it diverts people from the spam button.

## Engagement-based hygiene

Beyond removing bounces and complainers, periodically pruning or re-permissioning long-inactive subscribers (people who never open) helps, because low engagement drags reputation. A smaller list of engaged recipients deliverable to the inbox beats a huge list that mostly goes to spam.

## What to flag
- Any use of bought, scraped, or rented lists (top finding, both deliverability and legal).
- No confirmed opt-in on a marketing list (typo bounces, malicious signups).
- No processing of bounces/complaints (dead and hostile addresses kept on the list).
- No easy/one-click unsubscribe, or unsubscribes not honoured promptly.
- Never pruning long-inactive subscribers.

## The honest framing
Deliverability is mostly won or lost on the list. Send only to people who genuinely opted in, confirm their addresses, remove bounces and complainers the moment the provider reports them, and make unsubscribe trivially easy so people use it instead of the spam button. A clean, consented, engaged list keeps reputation strong; a bought or neglected one sinks it no matter how good everything else is. This is also where deliverability and `data-privacy` are the same discipline seen from two sides.

## Connection to other skills
`data-privacy` owns the legal side, consent for marketing, the unsubscribe duty, honouring opt-out, which is the same practice this reference frames for deliverability. Reputation impact is in sender-reputation.md; bounce/complaint processing mechanics in transactional-vs-marketing.md.
