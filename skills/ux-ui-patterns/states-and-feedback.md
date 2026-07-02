# States and Feedback

## 1. Loading States

### The 100ms Rule

The user must see feedback within 100ms of any action. Between 100ms and 1 second, show a subtle indicator (spinner on a button, progress bar starting). Over 1 second, show a clear loading state with context ("Loading your conversations..."). Over 5 seconds, add a progress indicator or status message that updates.

### Skeleton Screens

Use skeleton screens (placeholder shapes matching the layout of content that is loading) instead of spinners for page-level and section-level loading. Skeleton screens communicate what is coming and feel faster than a centred spinner.

When to use skeletons:
- Page initial load
- Section content loading
- List items loading
- Card content loading

When to use spinners:
- Button actions (spinner replaces button label or appears next to it)
- Inline operations (saving, submitting)
- Background refreshes (small spinner in corner, not replacing content)

When to use progress bars:
- File uploads (show percentage)
- Multi-step processes (show which step)
- Long operations with measurable progress (show percentage or estimated time)

### Loading State Rules

- Never replace visible content with a full-page spinner. If the user was looking at data, keep that data visible and show loading for the new/updating portion only.
- If a loading operation takes longer than 10 seconds, provide a way to cancel.
- If loading fails, transition to the error state, not back to blank.
- Show loading in the location where content will appear (co-located loading), not in a global position.

---

## 2. Empty States

### Purpose

An empty state is an opportunity to guide the user, not a void to fill with a sad illustration. Every empty state should answer three questions:

1. **Why is this empty?** ("You have not created any projects yet" vs just "No projects")
2. **Is this expected?** (New account = expected empty. Search with no results = unexpected empty. These need different treatment.)
3. **What should the user do?** (Primary action that fills this state. Button, not just text.)

### Types

**First-use empty:** The user has never used this feature. Show what it does, why they would want to, and how to start. A single clear CTA.

**No results empty:** A search or filter returned nothing. Show what was searched, suggest modifications ("Try broadening your search" or "Remove some filters"), and offer a way to clear filters with one click.

**Cleared empty:** The user deleted or completed everything. Celebrate if appropriate ("All caught up!"), then show how to create more.

**Error-caused empty:** Data failed to load and the result looks empty. This is an error state, not an empty state. Show the error, not "No data."

### Implementation

- Always include a CTA in first-use empty states. "Get started" or "Create your first [thing]."
- For search/filter empty states, show the active filters and make each one removable with a single click.
- Do not show an empty table with headers and zero rows. Replace the entire table with the empty state message.

---

## 3. Error States

### Error Hierarchy

**Field-level errors:** Appear next to the specific field. "Email address is required." Red border on the field, error text below it. Appear when the field loses focus (on blur) or when the form is submitted.

**Section-level errors:** A group of related fields has a problem. "Shipping address is incomplete." Appear above the section, with links to the specific fields.

**Page-level errors:** The entire operation failed. "We could not save your changes. Please try again." Appear at the top of the page or in a toast notification. Include a retry action.

**System-level errors:** The entire application or a major service is down. "We are experiencing issues. Our team is working on it." Full-page or banner. Include status page link if available.

### Error Message Format

Every error message follows: **What happened** + **Why** (if knowable) + **What to do**.

```
Bad:  "Error"
Bad:  "Something went wrong"
Bad:  "Invalid input"
Good: "This email is already registered. Try signing in instead, or use a different email."
Good: "Could not connect to the server. Check your internet connection and try again."
Good: "File too large (52MB). Maximum size is 25MB."
```

### Error Recovery

- Preserve user input on error. If a form submission fails, the user should not have to re-enter anything.
- Provide a retry action for transient errors (network issues, server errors).
- Provide alternative paths for permanent errors ("Email already registered" → link to sign in page).
- For errors during multi-step processes, do not reset to step 1. Stay on the failing step.

---

## 4. Success States

### Confirmation Patterns

**Inline success:** The action completed and the result is visible in context. A new item appears in the list. A status changes from "Draft" to "Published." No additional confirmation needed — the visible change is the confirmation.

**Toast/notification success:** The action completed but the result is not immediately visible, or the user needs reassurance. "Settings saved." Brief, auto-dismissing after 3-5 seconds. Include an undo action if the operation is reversible.

**Redirect success:** The action completed and the user should be somewhere else. Redirect to the result. "Invoice created" → redirect to the invoice page.

**Celebration success:** A significant milestone. Account created, first project completed, subscription upgraded. Brief, not obnoxious. A checkmark animation and a clear "What is next" prompt.

### Rules

- Do not show a success modal for routine actions. Saving a form, sending a message, uploading a file — these are expected to work. A toast is sufficient. A modal interrupts flow for no reason.
- Auto-dismiss success toasts. Do not make the user click "OK" on a success message.
- If the success state changes what the user can do next, make the next action obvious. "Project created" should be followed by options for what to do with it, not a dead end.

---

## 5. Partial and Degraded States

### What They Are

The data loaded but is incomplete, stale, or degraded. Examples:
- A list loaded but some items are missing thumbnails
- The page loaded from cache while fresh data is fetching
- Most features work but one external service is down
- Real-time data stopped updating

### Handling

- Show what you have. Do not show a loading screen when you have partial data.
- Indicate staleness. "Last updated 5 minutes ago" or a subtle visual indicator.
- Degrade individual features, not the entire page. If the chat feature is down, the dashboard still works. Show an inline error where the broken feature would be.
- If showing cached/stale data, offer a manual refresh option.

---

## 6. Offline States

### Detection

Monitor network status. When the user goes offline, immediately indicate it — do not wait for a request to fail.

### Behaviour

- Show a persistent banner: "You are offline. Some features may be unavailable."
- Queue actions that can be synced later (typing a message, editing a form).
- Disable actions that require connectivity (payment, file upload) with a clear explanation.
- When connectivity returns, sync queued actions and remove the banner.
- If the user tries an action that requires connectivity, explain why it did not work and that it will be retried when they are back online.

---

## 7. Optimistic Updates

### When to Use

Update the UI immediately as if the action succeeded, then reconcile with the server response. Use for:
- Toggling states (like, bookmark, follow)
- Reordering items (drag and drop)
- Simple edits (renaming, updating a field)
- Sending messages

### When Not to Use

Do not use optimistic updates for:
- Financial transactions (payment, transfer)
- Destructive actions (delete, remove access)
- Actions with complex validation (form submission with server-side rules)
- Actions where the server might reject (rate limited, quota exceeded)

### Rollback

If the server rejects the action, roll back the UI to its pre-action state. Show an error toast explaining what happened. Do not silently revert — the user needs to know their action did not persist.

---

## 8. Toast and Notification Patterns

### Toast Notifications

Brief, non-blocking messages that appear and auto-dismiss.

**Positioning:** Top-right or bottom-right on desktop. Top-centre on mobile (avoid bottom on mobile — it overlaps with navigation and keyboards).

**Duration:**
- Success: 3-5 seconds, auto-dismiss
- Info: 5 seconds, auto-dismiss
- Warning: 8 seconds or until dismissed
- Error: Until dismissed (the user needs to read it)

**Stacking:** If multiple toasts fire, stack them vertically with a maximum of 3 visible. Queue additional toasts.

**Content:** One line for the message. Optional action link ("Undo", "View", "Retry"). No titles or icons unless you have multiple severity levels to distinguish.

### In-App Notifications

For events that need attention but not immediate interruption:
- Badge count on a notification icon
- Notification drawer/panel accessible from the icon
- Each notification: brief description + timestamp + action link
- Mark as read on click or bulk mark-all

### When Not to Notify

Do not notify for:
- Actions the user themselves just performed ("You saved the file" — they know, they clicked Save)
- Routine system events the user does not care about
- Marketing or upsell messages disguised as notifications

---

## 9. Confirmation Patterns

### When to Confirm

Confirm before: permanent deletion, sending communications (email, invoice), financial transactions, permission changes, actions affecting other users, bulk operations.

Do not confirm before: saving, navigating, toggling preferences, actions that are easily undoable.

### Confirmation Dialog Design

- Title: what is about to happen ("Delete this project?")
- Body: consequences ("This will permanently delete the project and all its contents. This cannot be undone.")
- Actions: specific labels, not "OK/Cancel". Use "Delete project" / "Keep project" or "Send invoice" / "Go back". The destructive action should be visually distinct (red, outlined) and not the default focus.
- Never use confirmation for routine actions — it trains users to click through without reading.

### The Undo Pattern (Preferred)

Instead of asking "Are you sure?", perform the action and show an undo option. "Project deleted. Undo." The user can recover within 5-10 seconds. After the window closes, the action becomes permanent.

This is faster for the common case (the user meant to do it) and equally safe for the rare case (they did not). It replaces interrupting every user with protecting the few who made a mistake.

---

## 10. Interaction Feedback and Double-Action Prevention

### The Problem

The user clicks a button. Nothing visibly changes for 800ms while the request is processing. The user assumes it did not work and clicks again. Now you have two requests in flight — two payments, two messages sent, two records created. This is the single most common interaction bug in web applications.

### Button Loading States

Every button that triggers an asynchronous operation needs three visual states:

```
Idle:       Clickable. Normal appearance.
Loading:    Not clickable. Shows a spinner or loading indicator. Label changes or remains with spinner alongside it.
Disabled:   Not clickable. Visually muted. Used when preconditions are not met.
```

**On click:**
1. Immediately (< 50ms) switch to loading state
2. Disable the button (prevent further clicks)
3. Show a spinner inside the button (replacing the icon, or alongside the label)
4. Optionally change the label: "Save" → "Saving..." or "Send" → "Sending..."
5. On success: return to idle state (or show a brief success state — checkmark for 1 second, then idle)
6. On error: return to idle state so the user can retry

**Implementation:**

```
Button loading pattern:
  <button disabled={isLoading} onClick={handleClick}>
    {isLoading ? <Spinner /> : null}
    {isLoading ? "Saving..." : "Save"}
  </button>
```

Never rely only on `disabled` attribute visually. A greyed-out button with no spinner looks broken, not loading. The user needs to see that something is happening.

### Click Debouncing

For actions that should only fire once per interaction, debounce at the handler level:

```
Approaches (use at least one, preferably two):

1. Disable on click (UI layer):
   Set a loading/disabled flag on first click. Clear on completion.
   
2. Request deduplication (logic layer):
   Track in-flight request IDs. If the same action is already in flight, ignore the second click.
   
3. Server-side idempotency (API layer):
   Assign a unique key per action. Server rejects duplicate keys.
   (Covered in saas-production-security skill, production-readiness.md)
```

Use layers 1 and 2 for UI protection. Layer 3 is the safety net for cases where the client-side protection fails (race condition, JavaScript error, user opening two tabs).

### Form Submission Guards

Forms need specific protection beyond button disabling:

**Prevent double submission on Enter key.** Users press Enter to submit, then press Enter again impatiently. Handle the same way as button clicks — disable the form submission on first submit.

**Prevent resubmission on page refresh.** After a POST form submission, if the user refreshes the page, the browser asks "Resubmit form data?" The fix: redirect after successful submission (POST-Redirect-GET pattern). The user lands on a GET page, and refresh is safe.

**Prevent navigation during submission.** If the user navigates away while a form is submitting, the submission may be lost. Show a browser `beforeunload` confirmation: "You have unsaved changes. Leave anyway?" Use this sparingly — only for forms where data loss would be meaningful.

### Link and Navigation Click Feedback

For navigation actions (clicking a link that loads a new page or section):

- Show a loading indicator immediately. A progress bar at the top of the page (NProgress style) or a spinner replacing the clicked element.
- If using client-side routing, show route transition feedback. The default behaviour (nothing visible until the new page renders) feels broken on slow connections.
- Do not disable links during navigation — the user may intentionally click a different link to change their mind.

### Rapid Toggle Prevention

For toggle switches, like/unlike buttons, and other binary actions:

- Accept the first click immediately (optimistic update).
- Ignore subsequent clicks within a debounce window (300ms).
- If the user toggles rapidly (on-off-on-off), batch the final state and send one request for the settled value, not four requests.

```
Rapid toggle pattern:
  User clicks: ON → OFF → ON → OFF → ON
  Requests sent: [debounce...] → one request for final state (ON)
  Not: five separate requests
```

### Drag and Drop Feedback

During drag operations:

- Show a drag preview (ghost of the dragged element) immediately on drag start.
- Highlight valid drop targets as the user drags over them.
- Show an insertion indicator (line, gap, highlight) at the exact drop position.
- On drop: animate the element to its new position. Do not teleport.
- If the drop is rejected (invalid target), animate the element back to its original position.
- Disable other interactions during drag (no tooltips, no hover menus, no scrolling unless near the edge).

### Keyboard Interaction Feedback

Keyboard actions need the same feedback as mouse actions:

- Enter/Space on a button: same loading state as click.
- Tab focus: visible focus ring (covered in accessibility.md).
- Escape: closes the most recent overlay (modal, dropdown, popover) with visible transition.
- Keyboard shortcuts (Cmd+S, Cmd+Enter): show the same feedback as clicking the corresponding button. The user pressed a shortcut but expects to see the "Saving..." state.

### Scroll-Triggered Actions

For actions triggered by scroll position (infinite scroll load-more, sticky header changes, scroll-to-top button appearance):

- Debounce scroll handlers (16ms minimum — one frame at 60fps, or use `requestAnimationFrame` / `IntersectionObserver`).
- Do not trigger load-more on every scroll pixel. Trigger once when the user crosses a threshold (e.g., 200px from the bottom), then wait for the load to complete before allowing another trigger.
- Show a loading indicator at the scroll trigger point so the user knows more content is coming.

### Animation as Feedback

Use animation to confirm that an action registered:

```
Add to list:     New item slides in from the side or fades in with height animation
Remove from list: Item slides out or fades with height collapse (do not just vanish)
Reorder:         Item animates to new position
Toggle:          Switch slides with brief ease transition
Save:            Brief checkmark or green flash on the saved element
Error:           Brief shake animation on the errored element (subtle, not violent)
Copy to clipboard: Brief "Copied!" tooltip or icon swap (clipboard → checkmark)
```

These animations should be 150-300ms. Fast enough to feel responsive, slow enough to be perceived. Respect `prefers-reduced-motion` (see accessibility.md).

### What "Responsive" Actually Means

The thresholds for perceived responsiveness:

```
0-100ms:    Instant. User perceives this as immediate. Ideal for toggles, highlights, hover states.
100-300ms:  Fast. Acceptable for button feedback, transitions, simple operations.
300-1000ms: Noticeable delay. Show a loading indicator. Acceptable if the indicator appears within 100ms.
1-5s:       Slow. Show progress or a status message. User attention starts to drift.
5-10s:      Long. Show estimated time or progress percentage. Provide a way to cancel.
10s+:       Background it. Queue the task, show a notification when complete. Do not hold the user.
```

If your action falls in the 300ms-1s range, the loading indicator itself needs to appear within 100ms. A button that sits idle for 400ms then shows a spinner feels worse than a button that shows a spinner at 50ms and resolves at 400ms. The perception of speed is about how quickly the UI acknowledges the action, not how quickly the action completes.
