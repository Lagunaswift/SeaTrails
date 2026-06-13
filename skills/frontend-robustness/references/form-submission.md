# Form submission and double-submit

Forms are where frontend robustness most directly prevents real damage. A mishandled submit does not just annoy, it can charge a card twice, create duplicate orders, or lose work the user spent time on. The three things a robust submit gets right: it cannot fire twice, it shows what is happening, and it never loses the user's input.

## Preventing double-submit

The classic failure: the user clicks Submit, nothing visibly happens (no loading state), so they click again, and the action fires twice, two orders, two charges, two messages. Prevention:
- **Disable the submit control the instant it is clicked**, and keep it disabled until the request resolves. A disabled button cannot be re-clicked.
- **Show in-flight feedback** ("Submitting...", a spinner on the button) so the user knows it is working and does not feel the need to re-click.
- This is the front-line defence, but it is not sufficient alone: a determined or unlucky user (network retry, back button, two tabs) can still cause duplicates. The real guarantee is **server-side idempotency** (`error-handling-patterns`), the backend recognising and de-duplicating a repeated request. The UI prevents the easy case; idempotency catches the rest. Both are needed for anything that costs money or creates records.

## Submission feedback

The user must know the outcome:
- **In progress:** the disabled, "submitting" state above.
- **Success:** clear confirmation, the form succeeded, here is what happened next (a success message, a redirect, the new item appearing). Silence after submit leaves the user unsure it worked.
- **Failure:** a clear error (see async-states error state), what went wrong and what to do, not a silent return to the form with no indication it failed.

## Never lose the user's input

A robust form preserves what the user typed when something goes wrong. The infuriating failure: the user fills a long form, submits, it fails (validation or server error), and the form is blank, they have to re-type everything. This drives abandonment and fury. Rules:
- **On error, keep the input.** The form retains every value; the user fixes the problem (one invalid field, a retry after a network blip) and resubmits without re-entering anything.
- **Show field-level errors in place** so they know which field to fix, with the rest of their input intact (validation.md).
- For long or important forms, consider preserving input against accidental navigation/refresh too (a draft, a warning before leaving), so a stray click does not destroy their work.

## Other submission robustness
- **Disable submit until the form is validly fillable** where appropriate, or validate on submit and guide, but do not let an obviously-incomplete form fire a doomed request silently.
- **Handle the slow submit:** if the request hangs, the user should not be stuck with a permanently disabled button and a spinner forever, there needs to be a timeout/error path (slow-and-failed-requests.md).
- **Confirm destructive actions** (delete, irreversible changes) before firing, a robustness-and-safety overlap.

## What to flag
- Submit control not disabled during submission (double-submit risk, especially on payments/orders, the highest-impact finding).
- No success confirmation after submit (user unsure it worked).
- Form cleared on error (input lost, forcing re-entry).
- No error path for a hung/failed submit (stuck forever).
- Destructive submits with no confirmation.

## The honest framing
A robust form cannot double-fire (disabled-on-submit in the UI, idempotency on the server), always tells the user the outcome, and never makes them re-type because something failed. The double-submit-charging-twice and the lost-input-on-error failures are both common in fast-built forms and both directly cost users (money, time, trust), which is why forms rank just below the four-states basics. Get disable-on-submit, clear outcome feedback, and input preservation right, and the form stops being a liability.

## Connection to other references
The submit's loading/success/error states are the four states (async-states.md) applied to a form. Field validation and error display: validation.md. The server-side idempotency that backs up double-submit prevention: `error-handling-patterns`. Error perceivability: `accessibility` (forms-and-inputs).
