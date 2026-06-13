# The four states of async

The core of frontend robustness. Anything that talks to a server, a data fetch, a form submit, an action, is asynchronous, and asynchronous things are not instant and do not always succeed. Every such operation has four possible states, and a robust UI handles all four. The dominant failure in fast-built UIs is building only the success state and leaving the others blank, frozen, or silent.

## The four states

**Loading.** The operation is in progress. The UI must show that something is happening, the user clicked or the page is fetching, and they need feedback. Without a loading state the user sees a frozen screen (did it work? should I click again?) or a blank where content will appear. Loading indicators:
- A spinner for short, indeterminate waits.
- A **skeleton** (greyed placeholder of the coming content) for page/section loads, which feels faster and prevents layout jump (also helps `performance`'s perceived speed).
- A disabled, "submitting..." control for an action in flight.

**Success.** The happy path: data arrived, action worked. Beyond just showing the result, an action often needs confirmation the user can perceive (the item saved, the message sent), so they know it succeeded rather than guessing.

**Error.** The operation failed, the request errored, the server rejected it, the network died. This is the most-skipped state and the most damaging to skip. The UI must:
- Show that it failed (not a blank screen, not a silent nothing, not a frozen spinner).
- Say what went wrong in human terms (not a raw stack trace or a bare "Error 500").
- Offer a way forward, retry, fix the input, contact support, so the user is not stuck.

**Empty.** The operation succeeded but there is no data, no results, an empty list, a new account with nothing yet. An undesigned empty state shows a blank area that looks broken ("is it still loading? is it broken?"). A deliberate empty state explains there is nothing yet and ideally what to do about it ("No projects yet, create your first one"). Empty is a success case, not an error, and it needs designing.

## Why all four, up front

The reason to design all four at the start rather than bolt them on: retro-fitting loading and error states onto a success-only build is harder and always incomplete, you miss cases. If every data fetch and every action is conceived as "what does this look like loading / succeeded / failed / empty," the robust behaviour falls out naturally. Most data-driven libraries (query libraries) hand you these states explicitly precisely because they are the real shape of async.

## What to flag
- Any fetch or action with no loading state (frozen/blank screen while it works).
- Any with no error state (silent failure, blank screen, or stuck spinner on failure).
- Lists/data areas with no empty state (blank that looks broken when there is no data).
- Success with no confirmation for actions where the user needs to know it worked.

## The honest framing
The single highest-value frontend-robustness habit: treat every async operation as having four states and build all four. The happy-path-only UI looks done in the demo and falls apart the moment a request is slow (no loading state), fails (no error state), or returns nothing (no empty state). Designing the four states up front is most of what makes a UI robust rather than fragile, and it is cheap if done from the start, painful if retrofitted.

## Connection to other references
The loading and error states must be perceivable to everyone (`accessibility`, announce them, do not rely on a visual-only spinner). The async state itself is a `state-management` concern (this is its UI-facing surface). Skeletons overlap `performance` (perceived speed). Form-specific submission states are detailed in form-submission.md.
