# Transparency and privacy policy

Telling people honestly and accessibly what the app does with their data. The binding legal wording is a lawyer's job **[LEGAL]**; the engineering and product job is making sure the stated behaviour matches the actual behaviour, because a policy that describes something the app does not do (or omits something it does) is both useless and itself a misrepresentation.

## What a privacy policy needs to address

A privacy policy should cover, in plain language a normal user can follow:
- What personal data is collected (mapped to the data inventory).
- Why each category is collected (the purpose).
- The lawful basis, where required. **[LEGAL]**
- How long data is kept (retention).
- Who it is shared with: third-party processors (analytics, email, hosting, payment, the AI provider) and any other recipients.
- Whether data leaves the user's jurisdiction (international transfers). **[LEGAL]**
- How users exercise their rights (access, deletion, correction, objection) and how to contact you.
- For tracking: what cookies/identifiers are used and the consent choices.

## The match-reality principle (the engineering job)

The most common privacy-policy failure in fast-built apps is a generic template that does not describe the actual app. It claims practices the app does not follow, names data categories it does not collect, omits the analytics and third parties it actually uses, or describes rights the app cannot actually honour (a deletion right with no deletion mechanism, see data-subject-rights).

The principle: **the policy must describe what the app actually does.** This makes transparency partly an engineering responsibility, not just a legal-drafting one, because verifying the match requires knowing the real data flows (the inventory). When assessing a policy, check it against reality:
- Does it list the third parties the app actually sends data to (every analytics, email, hosting, AI, payment service)?
- Does it claim rights the app can actually deliver (if it says users can delete their data, can they)?
- Does it omit anything the app actually collects?

A lawyer drafts the binding text; the engineering side ensures the facts the text rests on are true.

## Accessibility of the notice

The policy and any privacy information must be genuinely accessible: findable (linked, not buried), readable (plain language, not only dense legalese), and presented before or at the point data is collected, not hidden after the fact. Just-in-time notices (a short explanation at the moment a specific data use happens) are good practice alongside the full policy.

## What to flag, by stage
- Collects nothing meaningful: a short honest statement may suffice; confirm with a lawyer whether a full policy is needed. **[LEGAL]**
- Has accounts/data: a real policy is required. The high finding is a generic template that does not match the app, or a policy promising rights (deletion) the app cannot honour. Fix the engineering reality first, then have the text drafted to match.
- Sensitive data / worldwide: full policy, lawyer-drafted, covering transfers and special categories. **[LEGAL]**

## The honest framing
The engineering contribution to transparency is making the policy true: the app must actually do what the policy says, and the policy must actually cover what the app does. A lawyer writes the words; the build determines whether the words are honest. A deletion clause with no deletion mechanism is worse than no clause, it is a documented promise the app breaks on every request.

## Connection to other references
The policy rests on the data inventory (what is collected, why, where it goes) and on data-subject-rights (the rights it must accurately describe and the app must actually honour). Build those first; the policy describes them.
