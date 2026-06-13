# Failure as Part of the Contract

How an interface fails is part of its contract, as much as what it returns on success. Callers need to know, from the interface itself, what can go wrong, how they'll be told, and what they can do about it. An interface that's precise about success and vague about failure has only designed half its contract, and the undesigned half is where callers get surprised in production. This is the design-side companion to the error-handling skill: that skill covers how you *handle* failure; this covers how your interface *exposes* it.

## Failure modes are part of the signature

When you design what an interface returns, design what it does when it can't:

- **Enumerate the failure modes deliberately.** For each operation, what are the ways it can fail that the caller needs to distinguish? "Not found" vs "not allowed" vs "invalid input" vs "temporarily unavailable" are different failures the caller responds to differently. Lumping them into one opaque failure forces the caller to either treat them identically (wrong) or parse your messages to tell them apart (fragile).
- **Make the failure modes visible in the contract.** In a typed surface, this can be a Result type or a declared set of error types; in an HTTP surface, a documented set of status codes and error shapes. The caller should be able to learn what can fail by reading the interface, not by hitting failures in production and reverse-engineering them.
- **Distinguish recoverable from terminal failures** in how you expose them, so the caller knows which ones are worth retrying and which are permanent (this maps onto the transient/permanent split in the error-handling skill). An interface that reports a retryable timeout the same way as a permanent validation rejection denies the caller the information to respond correctly.

## Be consistent about how failure is reported

Within an interface, the same kind of failure should be reported the same way everywhere, so the caller writes one handling strategy rather than one per operation:

- **One failure mechanism, not several.** Don't have some operations throw, others return null, others return an error object, others return a status code, for the same kinds of failure. Pick the mechanism appropriate to the surface and apply it uniformly. Mixed mechanisms mean the caller must remember which operation fails which way, and they'll get it wrong.
- **Consistent error shape.** When you return error information, it should have the same structure across the interface (a code, a message, details), so callers parse and branch on it uniformly. See `consistency.md` and the HTTP surface file for the shape specifics.
- **Consistent vocabulary.** The same condition should have the same name everywhere. If it's "not found" here it's not "missing" there and "absent" elsewhere.

## Don't surprise the caller

The cardinal failure-design sin is the undocumented or unexpected failure mode, the way an interface can fail that the caller had no way to anticipate from the contract:

- **No silent failure.** An interface that fails by returning a normal-looking value (an empty result that actually means "the operation failed", a default that masks an error) lets the caller proceed on a false success. The failure must be distinguishable from a valid result (this is the design-side of the masking anti-pattern in the error-handling skill). If "no results" and "the search failed" are different, the interface must let the caller tell them apart.
- **No hidden effects on failure.** If a partially-completed operation leaves state changed when it "fails", that's part of the contract the caller must know. Better, design the operation to be atomic so failure leaves no trace (see the error-handling skill's partial-failure section). Either way, don't let the caller assume failure means nothing happened if something did.
- **No leaking internals through errors.** A failure that surfaces a raw database error, an internal stack trace, or an internal service name across the boundary leaks implementation (see `information-hiding.md`) and couples the caller to your internals, plus it's a confidentiality concern. Translate failures into the interface's own vocabulary before they cross the boundary. The caller should hear about failure in terms of *your contract*, not your plumbing.

## Validation failures should be precise and early

A specific, common failure mode worth designing well: the caller passed something invalid.

- **Reject invalid input at the boundary, immediately**, rather than accepting it and failing obscurely later (this is the misuse-resistance principle of failing early, see `misuse-resistance.md`).
- **Say what was wrong specifically.** "Invalid request" makes the caller guess; "endDate must be after startDate" makes the fix obvious. For multiple problems, report them together where you can, so the caller fixes everything at once rather than discovering errors one round-trip at a time.
- **Validation failure is the caller's fault and permanent**, so signal it as a non-retryable client error, distinct from your failures (which may be retryable). The caller should not retry a validation failure unchanged; the contract should make that obvious.

## The contract's failure half, stated

By the time the interface is designed, you should be able to state, for each operation: these are the ways it can fail, this is how you'll be told which one, this is which are worth retrying, and this is what state you're left in afterward. If you can't state that, the failure half of the contract is undesigned, and the gap is exactly where callers will be surprised. Design it with the same care as the success half, because in production the failure paths run more often than the demo ever showed.
