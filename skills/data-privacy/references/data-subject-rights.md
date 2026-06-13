# Data subject rights

People have enforceable rights over their personal data, and the app has to be able to honour them. The engineering-heavy ones are deletion and access; both require that the app can actually find and act on all of a person's data, which most fast-built apps cannot do completely.

## Deletion (the "right to be forgotten")

A user can ask for their personal data to be deleted, and in many cases you must comply. The engineering challenge: **complete deletion across every place the data lives.** Fast-built apps usually delete the main user row and miss the rest. A real deletion has to account for:
- The primary database, every table holding the user's data, not just the `users` row but related records (their posts, sessions, activity, anything keyed to them).
- Logs that contain personal data (a frequent miss, request logs full of emails/IPs).
- Caches and search indexes holding copies.
- Backups, this is the hard one. You generally cannot surgically delete one user from a backup snapshot. The accepted approach is usually that backups age out on their retention schedule and the data is not restored to live systems; document the approach. This intersects with `scaling-audit`'s durability pass (backups exist precisely so you cannot easily erase things). **[LEGAL]** on the exact backup obligation.
- Third-party processors, every external service you sent the data to (analytics, email, the AI provider) must also delete it; you are responsible for propagating the request.

The test: when a user asks to be deleted, can you actually remove them everywhere, and do you know everywhere is? If deletion misses collections or third parties, the right is not honoured.

## Access and portability

A user can request a copy of the personal data you hold about them, and in some cases in a portable (machine-readable) format. The engineering job is being able to gather all of a person's data and export it. This relies on the same "know where all their data is" capability as deletion, build it once and both rights become feasible.

## Other rights (briefly)
Users may also have rights to correct inaccurate data, object to certain processing, and restrict processing. These are usually less engineering-heavy (correction is often just editing) but the app should not make them impossible (e.g. data the user can never correct).

## The request-handling process

Beyond the technical capability, there has to be a *process*:
- A way for users to make a request (an email address, a form) that is findable (in the privacy policy).
- Handling within the legal time limit (GDPR is generally one month; **[LEGAL]** for specifics and other regimes).
- Identity verification before acting (so one user cannot request another's data or deletion).

For a small app a manual process is fine, but it must exist and be honoured. For a larger app, self-service (a "download my data" / "delete my account" button) is better and scales.

## What to flag, by stage
- No accounts / trivial data: rights may barely apply; confirm scope.
- Has accounts: the high finding is **no deletion path at all**, or a deletion that only removes the main record and leaves data in related tables, logs, and third parties. This is common and it means the app cannot honour a legal right it (or its policy) claims to. Build complete deletion.
- Worldwide / sensitive: self-service rights, documented backup-deletion approach, and processor propagation; involve a lawyer/DPO on the obligations. **[LEGAL]**

## The honest framing
The deletion right is where policy meets reality most sharply. Many apps' privacy policies promise users can delete their data, while the app has no mechanism to do it completely, a broken promise repeated on every request. Building complete, cross-store deletion (and the access/export that reuses the same capability) is the core engineering work of data-subject rights. Backups are the legitimately hard part; handle them by retention-expiry-plus-no-restore and document it, rather than pretending you can surgically erase a snapshot.

## Connection to other skills
`scaling-audit` (durability) explains why backups make deletion hard, they exist to prevent erasure. `release-and-ops` covers logs that may hold personal data needing deletion. The capability to find all of a person's data also depends on a clean data inventory (see data-inventory-and-minimisation).
