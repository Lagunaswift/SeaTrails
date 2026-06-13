# Content and format

What in the message itself trips spam filters or earns trust. Once authentication and reputation are sound, the content is the last gate: a legitimate sender can still land in spam if the message looks like spam. The guiding idea is that filters are trained on what spam looks like, so the fix is to not look like spam, which mostly means being honest and well-structured.

## Spam-trigger patterns to avoid

Filters react to patterns common in spam:
- **Misleading or clickbait subject lines.** "RE:" or "FWD:" on a first-contact email, fake urgency, "you've won", promising something the body does not deliver. Subject must honestly reflect the content.
- **Shouting:** ALL CAPS, excessive!!! punctuation, $$$ and money symbols, "FREE" in caps.
- **Spammy phrases:** the classic filter-bait ("act now", "limited time", "risk-free", "guaranteed", "click here now"). You do not need to neurotically avoid every word, but a message dense with them reads as spam.
- **Link shorteners** (bit.ly etc.), which hide the destination and are heavily used by spammers; link to real, visible URLs on domains that match your sender.
- **Mismatched/suspicious links:** links whose domain differs from your sending domain, or that redirect, lower trust.

## Structure and format

- **Include a plain-text alternative** alongside the HTML version (multipart). HTML-only mail is more suspicious; a text part improves deliverability and serves clients that prefer text.
- **Healthy text-to-image ratio.** A big image with almost no text (sometimes done to hide spammy content from text-scanning filters) is a classic spam signal. Real text should carry the message; images supplement it.
- **Don't send one giant image** as the whole email. If images are blocked (many clients block by default), an image-only email shows nothing, and filters distrust it.
- **Clean, valid HTML.** Broken, bloated, or pasted-from-Word HTML can trip filters; keep email HTML simple and email-safe (inline styles, table layouts, the constrained email subset, not modern web CSS).
- **Reasonable size.** Very large emails are more likely to be clipped or flagged.

## Honesty in headers and identity

Filters and recipients both reward honesty:
- **Accurate From name and address** that matches who you are and your authenticated domain.
- **Honest subject** matching the body.
- **A real physical address / identification** in the footer is a legal requirement for marketing in many places (CAN-SPAM and others) and a trust signal.
- **Visible, honest unsubscribe** (also list-hygiene and legal).
- Nothing designed to deceive about who sent it or why, deception is exactly what authentication and filters exist to catch.

## The engagement angle
Content that genuinely interests recipients gets opened and engaged with, and engagement is a positive reputation signal (sender-reputation.md). So good, wanted, relevant content is not just nice, it actively helps deliverability over time. Mail nobody opens drifts toward spam regardless of perfect formatting.

## What to flag
- Misleading subjects, ALL CAPS, excessive punctuation, dense spam-phrase content.
- Link shorteners or links whose domain does not match the sender.
- HTML-only with no plain-text part; image-only or image-heavy emails with little text.
- No physical address / identification in marketing footers (legal and trust).
- Broken or bloated email HTML.

## The honest framing
The reliable way to pass content filters is to not resemble spam: an honest subject that matches an informative, mostly-text body, real links to your own domain, a plain-text alternative, a clear sender identity, and a visible unsubscribe. You do not need to obsess over individual "trigger words"; you need the message to look like what it is, a legitimate email a real person wanted. Honest, well-structured content also gets engagement, which feeds reputation, so the same choices help on both fronts.

## Connection to other skills
`anti-slop-writing` governs the *quality* of the copy (clear, non-spammy, well-written), which is adjacent to but distinct from deliverability format. The unsubscribe and identification requirements overlap `data-privacy` (legal duties). Engagement's reputation effect is in sender-reputation.md.
