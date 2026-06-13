# Handling slow and failed requests

Real networks are slow, flaky, and sometimes down, and the UI meets those conditions constantly once it leaves the developer's fast connection. A UI built assuming requests are instant and always succeed breaks in exactly the ways users hit most: the eternal spinner, the silent failure, the frozen screen. This is the four states (async-states.md) applied specifically to the adverse network conditions that trigger the loading-too-long and error states.

## The stuck-spinner problem

The signature failure: a request hangs (slow server, lost connection, a response that never comes), and the UI shows a spinner forever. The user waits, then waits more, with no idea whether it is working, broken, or hung. Prevention:
- **Timeouts.** A request that has not responded within a reasonable time should be treated as failed, surfacing the error state with a retry, rather than spinning indefinitely. The UI should never be able to spin forever.
- **A way out.** Even mid-load, the user should not be trapped; a long load can offer a cancel or a "still working..." with eventual failure handling.

A spinner with no timeout and no failure path is one of the most common and most frustrating robustness bugs.

## Retry, for the user and automatically

Transient failures (a blip, a momentary drop) are common and often succeed on a second try:
- **User-facing retry:** the error state should offer a retry action, let the user try again without reloading the whole page or re-navigating. Far better than a dead end.
- **Automatic retry** for idempotent reads, with backoff, can paper over transient blips before the user even sees an error, but it must be bounded (not retry forever) and coordinated with the backend's own resilience (`error-handling-patterns` owns retry/backoff/circuit-breaker). Do not auto-retry non-idempotent actions blindly (a retried payment without idempotency double-charges, ties to form-submission and `error-handling-patterns`).

## The offline / total-failure case

What happens with no connection at all, or a fully-down backend:
- The UI should recognise and communicate it ("You appear to be offline", "Can't reach the server") rather than freezing or showing cryptic errors.
- Where appropriate, queue actions to send when connection returns, or at minimum preserve the user's work (form-submission's input preservation) so a drop does not destroy it.
- Not every app needs full offline support, but every app should fail *comprehensibly* when the network is gone, not freeze.

## Slow is not the same as broken (but feels it)

A response that eventually arrives after 8 seconds is technically a success, but to the user it felt broken, they may have clicked away or re-submitted. Handling slowness:
- Show loading immediately (no dead time before the spinner/skeleton).
- For known-slow operations, set expectations ("This can take a moment").
- Combine with perceived-speed techniques (skeletons, optimistic updates) where they fit, though that is `performance`'s domain.

## Test under real conditions
The reason these bugs ship is that they are invisible on a fast local connection. Throttle the network (DevTools can simulate slow/offline) and test: what does the UI do when this request takes 10 seconds? When it fails? When there is no connection? Those are the conditions real users have, especially on mobile.

## What to flag
- Requests with no timeout / spinners that can hang forever.
- Failures with no retry affordance (dead-end error states).
- No handling of the offline / backend-down case (freeze or cryptic error).
- Auto-retry of non-idempotent actions (double-action risk).
- Never tested under throttled/failed network (so these bugs are unknown).

## The honest framing
Assume every request can be slow, can fail, and can hit no connection at all, because for real users on real networks, they regularly do. The UI must never spin forever (timeouts), must offer a way forward when something fails (retry, not a dead end), and must fail comprehensibly offline rather than freezing. These conditions are invisible on a developer's fast connection, which is exactly why they ship broken; throttle the network and test them deliberately.

## Connection to other skills
Retry/backoff/circuit-breaker/idempotency on the backend side: `error-handling-patterns` (the UI's retry handling pairs with it). The loading/error states themselves: async-states.md. Perceived-speed techniques for slowness: `performance`. Input preservation through a drop: form-submission.md.
