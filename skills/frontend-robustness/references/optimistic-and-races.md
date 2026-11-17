# Optimistic updates and async race conditions

Two related advanced-robustness concerns: making the UI feel instant without making it lie (optimistic updates), and handling overlapping asynchronous operations correctly (race conditions). Both are about async that does not resolve in the simple one-at-a-time order the happy path assumes.

## Optimistic updates

An optimistic update shows the result of an action *before* the server confirms it: the user clicks "like", the heart fills instantly, rather than spinning until the server responds. It makes the UI feel fast and responsive, the action appears to take effect immediately.

The provisional display must remain distinguishable from an authoritative outcome. Where optimism suits a reversible task:

1. Apply the local preview while retaining the identity of the pending change.
2. Send the request and preserve the user's latest intent while awaiting the result.
3. Reconcile confirmed success with the returned state. On confirmed rejection, restore or correct the affected change without overwriting later edits. A lost response leaves the outcome unknown; inspect authoritative state before retrying or claiming the server rejected the write.

Test success, rejection, timeout and out-of-order responses with safe fixtures. Recovery must preserve unrelated work and avoid duplicate effects. Payments, permissions and delivery claims require their actual authoritative result. A product may use ordinary pending feedback when a provisional preview offers little benefit.

## Out-of-order responses

The classic UI race: the user types in a search box, each keystroke fires a request. They type "shoes" quickly. The request for "sho" happens to be slow and the request for "shoes" comes back first, then the slow "sho" response arrives *later* and overwrites the correct "shoes" results with stale ones. The UI now shows results for the wrong query.

This happens whenever multiple async operations can be in flight and resolve out of order. Handling:
- **Cancel superseded requests** (abort the in-flight request when a newer one starts).
- **Ignore stale responses:** track which request is current and discard responses that are not the latest (e.g. tag each request, only apply the response if it matches the most recent).
- Debounce rapid triggers (search-as-you-type) so fewer requests fire, reducing the race surface (also `performance`).

Aborting a client request does not prove that a server write stopped. For mutations, reconcile the committed outcome and use the established idempotency/state policy. Debouncing may coalesce replaceable intent; independently meaningful events must retain their semantics.

Search-as-you-type, rapid filtering, and any fast-repeated async action are where this bites. The symptom, "sometimes it shows the wrong/old results", is a race, not a flaky backend.

## Async cleanup and stale state

Other async-ordering hazards, mostly `state-management` territory seen from the UI:
- **Updates to unmounted components:** an async response arrives after the user has navigated away and the component is gone; applying the update errors or leaks. Cancel or guard async work on unmount.
- **Stale closures:** async callbacks capturing old state/props and acting on outdated values. A framework-specific hazard to be aware of.
- **Concurrent edits to the same client state** from multiple async sources stepping on each other (ties to `state-management`'s shared-state concerns).

## What to flag
- Provisional state presented as confirmed success, unknown outcomes treated as rejection, or recovery that overwrites later work.
- Search/filter/rapid-async with no out-of-order handling (stale results overwriting fresh ones).
- No cancellation/guarding of async work on unmount/navigation.
- Repeated requests that cause demonstrated stale state or unnecessary work, without an appropriate cancellation, deduplication or coalescing policy.

## Evidence boundary

Record which requests were issued, their actual order and the authoritative state after reconciliation. A local preview or mocked rejection alone cannot establish delivery, durable persistence or correct handling of a committed write whose response was lost. Use S17.06 in `ux-ui-patterns/design-execution-review.md` for the website coverage mapping.

## Connection to other skills
This is the UI-facing edge of `state-management` (async state, races, stale data are state problems). Debouncing and reducing requests also serve `performance`. Optimistic rollback pairs with the backend's actual success/failure, which relies on sound `error-handling-patterns`.
