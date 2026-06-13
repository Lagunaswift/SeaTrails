# Forms and inputs

Where accessibility most directly decides whether someone can complete a task. A form is the point of action, signing up, paying, contacting, and an inaccessible form does not just annoy, it blocks the user from doing the thing entirely. Forms concentrate several accessibility concerns (labelling, error handling, keyboard, screen-reader feedback) in one place, which is why they get their own pass.

## Labels: every control, properly associated

Every input, select, textarea, checkbox, and radio needs a label that is *programmatically associated* with it, not merely sitting nearby. Association (via `<label for>`/`id`, or wrapping the input in the label) means:
- The screen reader announces the label when the field is focused ("Email address, edit text").
- The label becomes a click target that focuses the input (helps motor-impaired and everyone).

The common failures:
- A visual label near the field but not associated, so a screen-reader user reaches an anonymous "edit text".
- Placeholder text used *as* the label, placeholders vanish when typing, are often low-contrast, and are not reliable labels. A placeholder is not a label.
- Icon-only or implied-label fields (a search box with just a magnifier) with no accessible name.

Every field must answer: when a screen-reader user focuses this, do they hear what it is for?

## Required fields, formats, and instructions

Information a sighted user infers visually must be conveyed to everyone:
- **Required** status communicated non-visually (not by red colour or an asterisk alone, give it accessible text/`aria-required`).
- **Expected format** stated in text the screen reader can reach (associated with the field via `aria-describedby`), not only shown as faint helper text or implied.
- **Instructions** before the field, programmatically connected, not floating nearby unassociated.

## Errors: identified, associated, described

Form errors are a frequent, blocking failure. Accessible error handling:
- **Identify the error in text**, not by colour alone (a red border tells a colour-blind user nothing). Say what is wrong.
- **Associate the error with its field** (via `aria-describedby`) so a screen-reader user, on reaching the field, hears the error, rather than a red outline they cannot perceive and an error message elsewhere they never find.
- **Announce that errors occurred** on submit (a live region or moving focus to an error summary), so the user knows the submission failed and why, instead of silence.
- **Describe how to fix it**, not just "invalid input", say what valid input looks like.

The worst-case inaccessible form: submit fails, a field turns red, a message appears somewhere visually, and a screen-reader user hears nothing, no idea it failed, why, or where. Fixing error association and announcement turns that from impossible into doable.

## Keyboard and structure
- The whole form must be completable by keyboard (real controls make this free, see keyboard-and-focus).
- Group related controls (a set of radios, an address block) with `<fieldset>`/`<legend>` so their relationship is conveyed.
- Logical focus order through the fields.

## What to flag
- Any control without an associated label (top form finding).
- Placeholders used as labels.
- Required/format/instructions conveyed only visually.
- Errors shown by colour alone, not associated with their field, or not announced on submit.
- Icon-only inputs with no accessible name.

## The honest framing
A form is where accessibility becomes pass/fail for completing a task. The essentials: associate a real label with every control, convey required-ness and format in text, and make errors text-based, tied to their field, and announced. The signature inaccessible form fails silently, the user submits, something goes red, and a non-visual user is left with no feedback at all. Getting labels and error association right is what lets everyone actually finish the form.

## Connection to other references
Labels and announcements rest on screen-readers-and-text; keyboard completion on keyboard-and-focus; error colours on colour-and-visual (don't rely on colour alone). Forms are where these converge, which is why they are the highest-stakes single surface.
