---
name: frontend-robustness
description: "Use this skill to build or assess the interaction-level correctness of a UI: loading states, error states, empty states, form validation and submission, optimistic updates, handling slow and failed requests, and preventing the broken behaviours that appear when real conditions hit a happy-path UI. Trigger on phrases like 'loading state', 'error state', 'empty state', 'form validation', 'handle errors in the UI', 'what if the request fails', 'double submit', 'optimistic update', 'the UI breaks when', 'spinner', 'disabled button', 'race condition in the UI', 'stale data', or when building or reviewing how an interface behaves under real conditions (slow network, failures, edge inputs) rather than how it looks. This is the does-the-UI-behave lens, the engineering counterpart to visual design (use frontend-design for aesthetics). It does not cover load speed (use performance) or accessibility (use accessibility). Defaults to a prioritised review of where the UI breaks under real conditions. Works on any frontend."
---

# Frontend Robustness

The lens for one question: **does the interface behave correctly when reality is not the happy path?** A UI demoed on a fast connection with valid input and successful responses looks finished. The same UI meets slow networks, failed requests, empty data, double-clicks, and invalid input the moment real users arrive, and a happy-path-only build breaks: spinners that never end, buttons that submit twice, blank screens where an error should be, forms that lose the user's work. This skill covers the interaction-level correctness that determines whether a UI is actually usable, separate from how it looks (`frontend-design`) and how fast it loads (`performance`).

It overlaps `accessibility` (error and loading states must be perceivable to everyone) and `state-management` (much of this is about handling async state correctly) and references both.

## The cardinal principle

**Every async action has four states, not one; build all four.** A request can be idle, loading, succeeded, or failed, and real UIs spend meaningful time in loading and failed. The dominant frontend-robustness failure is building only the success state and treating loading and error as afterthoughts (or omitting them), which produces the frozen spinner, the silent failure, the blank screen. Designing every data fetch and every action for all four states up front is most of what separates a robust UI from a fragile one.

## Assessment by default, build guidance when asked

Default to assessing where the UI breaks under real conditions, missing states, unhandled failures, double-submit risks, lost input, in priority order with fixes. Give concrete build guidance (state patterns, validation approaches) when asked to build rather than assess.

## The areas, in priority order

### 1. The four states of async (loading, success, error, empty)
The core. Every data fetch and every action that talks to a server needs all four handled.
- **Loading:** show progress (spinner, skeleton, disabled control) so the user knows something is happening, not a frozen or blank screen.
- **Error:** show what went wrong and what to do (retry, fix input), not a blank screen, a silent failure, or a raw error dump.
- **Empty:** the "no data yet / no results" state designed deliberately (helpful empty state), not an accidental blank that looks broken.
- **Success:** the happy path, plus confirmation the action worked.
`references/async-states.md` covers the four states, why each matters, and designing them deliberately.

### 2. Form submission and double-submit
Where robustness most directly prevents real damage (duplicate orders, double charges).
- Disable the submit control while submitting, so a double-click or impatient re-click cannot fire the action twice (pairs with backend idempotency, `error-handling-patterns`).
- Show submission progress and the result (success or error) clearly.
- Preserve the user's input on error, never clear a form because the submit failed; let them fix and retry without re-typing.
`references/form-submission.md` covers double-submit prevention, submission feedback, and not losing input.

### 3. Validation: client and the truth on the server
Validating input usefully without trusting the client for correctness.
- Client-side validation for fast, helpful feedback (inline, as they go), but it is UX only, never the security/correctness boundary (the server validates for real, `ai-saas-security` / `code-audit`).
- Clear, specific, well-timed messages (not validating angrily on every keystroke before they have finished; not only on submit with no earlier guidance).
- Errors associated with their fields and perceivable non-visually (`accessibility`).
`references/validation.md` covers client/server split, validation timing, and message quality.

### 4. Handling slow and failed requests
What the UI does when the network is slow, flaky, or down, the conditions real users hit constantly.
- Timeouts and a path out of a stuck loading state (not an eternal spinner when a request hangs).
- Retry affordances for the user, and where appropriate automatic retry (coordinated with backend resilience, `error-handling-patterns`).
- Handling the offline / total-failure case rather than freezing.
- Not assuming requests are instant or always succeed, the happy-path assumption that breaks first.
`references/slow-and-failed-requests.md` covers timeouts, retry UX, offline/failure handling, and the stuck-spinner problem.

### 5. Optimistic updates and async race conditions
Making the UI feel fast without making it lie, and handling overlapping async correctly.
- Optimistic updates (show the result before the server confirms) feel instant but must roll back correctly if the server rejects, an optimistic update with no rollback shows the user a success that did not happen.
- Race conditions in the UI: responses arriving out of order (fast-typed search where an earlier slow response overwrites a later fast one), stale closures, updates to unmounted components. Ties to `state-management`.
`references/optimistic-and-races.md` covers optimistic update + rollback, out-of-order responses, and async cleanup.

### 6. Edge inputs and defensive rendering
Not breaking on the data and inputs the happy path did not consider.
- Rendering data that might be missing, null, empty, very long, or a different shape than expected, without crashing the UI (the undefined-is-not-an-object class of break).
- Very long strings, huge numbers, unexpected characters, missing images, gracefully handled.
- An error boundary so one component's render failure does not white-screen the whole app.
`references/edge-inputs-and-defensive-rendering.md` covers null/missing data, extreme values, and error boundaries.

## How to report
Order by user impact: things that cause real damage or total breakage (double-submit charging twice, an unhandled error white-screening the app, a permanently stuck spinner) before cosmetic gaps (a less-polished empty state). For each: the condition that triggers it, what the user experiences, and the fix. Frame around "what happens when this is slow / fails / has no data / gets clicked twice," the questions a happy-path build never asked.

## Scoping
Match to stakes. A static informational page has little async to get wrong; a data-driven app with forms, money, and real-time updates needs the full set. But the four-states discipline and double-submit prevention are cheap and prevent the most common, most damaging failures, they should be default for anything with a form or a fetch. The honest output for most fast-built apps is "the happy path is built; loading and error states are missing or partial, the submit can double-fire, and it breaks on empty/missing data, handle those and it becomes robust."

## Skills this leans on
- `frontend-design`: the visual/UX side; this is how the interface behaves, that is how it looks (the states this skill demands still need designing)
- `state-management`: async state, races, and stale data are state problems; this is their UI-facing edge
- `error-handling-patterns`: backend resilience (retry, timeout, idempotency) that the UI's retry/double-submit handling pairs with
- `accessibility`: loading/error/validation states must be perceivable to everyone, not only visible
- `performance`: perceived speed overlaps (skeletons, optimistic updates), but that skill is load speed, this is behavioural correctness
