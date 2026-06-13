# Optimistic updates and async race conditions

Two related advanced-robustness concerns: making the UI feel instant without making it lie (optimistic updates), and handling overlapping asynchronous operations correctly (race conditions). Both are about async that does not resolve in the simple one-at-a-time order the happy path assumes.

## Optimistic updates

An optimistic update shows the result of an action *before* the server confirms it: the user clicks "like", the heart fills instantly, rather than spinning until the server responds. It makes the UI feel fast and responsive, the action appears to take effect immediately.

The robustness catch: **the server might reject it, and then the UI has shown a success that did not happen.** A correct optimistic update has three parts:
1. **Apply the change immediately** in the UI (the optimistic part).
2. **Send the request** and wait for the real result.
3. **Reconcile:** if the server confirms, keep the change (and replace any temporary/placeholder data with the real data). If the server **rejects or errors, roll back** to the previous state and tell the user it did not work.

The failure is doing step 1 and skipping the rollback: the like appears to stick, but the server actually failed, and now the UI is lying, it shows a state the server does not have. Optimistic updates without rollback are worse than no optimism, because they create false confidence. Use them where the action almost always succeeds and instant feedback matters (likes, toggles, reordering); be more cautious where failure is likely or the stakes are high.

## Out-of-order responses

The classic UI race: the user types in a search box, each keystroke fires a request. They type "shoes" quickly. The request for "sho" happens to be slow and the request for "shoes" comes back first, then the slow "sho" response arrives *later* and overwrites the correct "shoes" results with stale ones. The UI now shows results for the wrong query.

This happens whenever multiple async operations can be in flight and resolve out of order. Handling:
- **Cancel superseded requests** (abort the in-flight request when a newer one starts).
- **Ignore stale responses:** track which request is current and discard responses that are not the latest (e.g. tag each request, only apply the response if it matches the most recent).
- Debounce rapid triggers (search-as-you-type) so fewer requests fire, reducing the race surface (also `performance`).

Search-as-you-type, rapid filtering, and any fast-repeated async action are where this bites. The symptom, "sometimes it shows the wrong/old results", is a race, not a flaky backend.

## Async cleanup and stale state

Other async-ordering hazards, mostly `state-management` territory seen from the UI:
- **Updates to unmounted components:** an async response arrives after the user has navigated away and the component is gone; applying the update errors or leaks. Cancel or guard async work on unmount.
- **Stale closures:** async callbacks capturing old state/props and acting on outdated values. A framework-specific hazard to be aware of.
- **Concurrent edits to the same client state** from multiple async sources stepping on each other (ties to `state-management`'s shared-state concerns).

## What to flag
- Optimistic updates with no rollback on failure (UI showing unconfirmed success, the worst of the set).
- Search/filter/rapid-async with no out-of-order handling (stale results overwriting fresh ones).
- No cancellation/guarding of async work on unmount/navigation.
- Rapid-fire requests with no debounce (race surface plus needless load).

## The honest framing
Optimistic updates are great for responsiveness but only if they roll back when the server says no, otherwise the UI is confidently wrong. And any time more than one async operation can be in flight, assume they can resolve out of order and handle it (cancel or ignore stale responses), or the UI will intermittently show the wrong thing in ways that look like random bugs. These are the subtler robustness issues, less common than missing loading states but genuinely confusing when they bite, and they all come down to async not behaving in the tidy order the happy path imagined.

## Connection to other skills
This is the UI-facing edge of `state-management` (async state, races, stale data are state problems). Debouncing and reducing requests also serve `performance`. Optimistic rollback pairs with the backend's actual success/failure, which relies on sound `error-handling-patterns`.
