# Validation: client and server

Validating user input so the experience is helpful while the correctness guarantee stays where it belongs, on the server. The robustness concern here is twofold: give the user fast, clear guidance (client-side), and never mistake that guidance for actual protection (server-side is the real boundary).

## The client/server split (do not confuse them)

**Client-side validation is for UX, not security or correctness.** It gives the user immediate feedback, this email looks malformed, this field is required, this password is too short, without a server round-trip. It makes the form pleasant and catches mistakes early. But it can be bypassed entirely (disabled JS, direct API calls, modified requests), so it guarantees nothing.

**Server-side validation is the real boundary.** Every rule that actually matters, for correctness, security, or data integrity, must be enforced on the server, which never trusts the client (`ai-saas-security`, `code-audit`, the "never trust the client" rule). The server validates regardless of what the client did.

The two work together: client-side for fast, friendly feedback; server-side for the actual guarantee. The mistake is doing only one, client-only (bypassable, unsafe) or server-only (works, but a slow, round-trip-per-error experience). Robust forms do both, the same rules ideally shared so they do not drift.

## Validation timing: not too eager, not too late

*When* validation fires shapes how it feels:
- **Validating on every keystroke from the start** is hostile, it shows "invalid email" while the user is still on the first character, error messages flashing as they type. Annoying and stressful.
- **Validating only on submit** leaves the user to fill the whole form blind, then get hit with all errors at once at the end.
- **The robust middle:** validate a field when the user leaves it (on blur) or after they have clearly finished, show success/clearing as they fix it, and re-validate on submit as the backstop. Give helpful guidance (format hints) up front, errors after they have had a fair chance to get it right. The feel should be a helpful guide, not a nagging critic.

## Message quality

Validation messages must be specific and actionable:
- **Say what is wrong and how to fix it:** "Password must be at least 8 characters", not "Invalid".
- **Per field, in place:** the error appears at the field it concerns, not a generic "form has errors" at the top with no indication where (see form-submission and accessibility).
- **Human language:** not regex dumps, not raw server validation codes.
- **Perceivable to everyone:** associated with the field programmatically and not conveyed by colour alone (`accessibility`, forms-and-inputs covers this fully).

## What to flag
- Client-side validation only, with the server trusting the input (a security/correctness hole, not just robustness, `ai-saas-security`).
- Server-only validation with no client feedback (clunky round-trip-per-error UX).
- Over-eager validation (erroring on the first keystroke) or submit-only validation (no early guidance).
- Vague messages ("invalid"), errors not tied to their field, or colour-only error indication.

## The honest framing
Validate on the client for a fast, kind experience and on the server for the actual guarantee, and never confuse the two: the client copy is courtesy, the server is the wall. Time the feedback to guide rather than nag (validate on blur, backstop on submit), and write messages that say what is wrong and how to fix it, at the field, in plain language. Good validation makes a form feel easy; the client/server discipline keeps it actually safe.

## Connection to other skills
The "never trust the client" boundary is `ai-saas-security` / `code-audit`, server-side validation is a security requirement, not only a robustness one. The accessibility of error messages (association, not-colour-alone) is `accessibility` (forms-and-inputs). Where validation feeds submission, see form-submission.md.
