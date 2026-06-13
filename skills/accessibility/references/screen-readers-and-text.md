# Screen readers and text alternatives

What non-visual users receive. A screen reader turns the interface into speech (or braille), reading the text and semantics. Anything conveyed only visually, an image's content, an icon's meaning, a colour-coded status, a change that just appeared, is invisible to these users unless there is a text or semantic equivalent. The job is making sure everything meaningful is available non-visually.

## Alt text on images

Images need text alternatives, but the right alternative depends on the image's role:
- **Meaningful images** (a photo conveying information, a chart, a logo that is also a link) need `alt` text describing their content or function. "Graph showing sales rising through Q3," not "image" or a filename.
- **Decorative images** (a background flourish, a divider) should have an explicitly empty `alt=""`, which tells the screen reader to skip them. Empty alt is deliberate and correct here; *missing* alt is the bug (a screen reader may then read the filename, "IMG_4821.jpg", which is noise).
- **Functional images** (an icon that is a button) need alt describing the action ("Search"), not the picture ("magnifying glass").

The distinction matters: meaningful gets described, decorative gets empty alt, neither gets left to chance. Missing alt on a meaningful image hides information; missing empty-alt on a decorative one adds noise.

## Labels on form controls

Every input needs a programmatically associated label, not just text sitting near it visually. A `<label>` correctly linked to its input (via `for`/`id` or wrapping) means the screen reader announces "Email, edit text" when the field is focused; a visually-adjacent but unassociated label means the user reaches an unlabelled field and has no idea what to type. This is one of the most common and most blocking form failures. (More in forms-and-inputs.)

## Accessible names for icon-only controls

A button with only an icon and no text (a bare hamburger, an X to close, a magnifier) has no accessible name, the screen reader announces "button" with no indication of what it does. These need an accessible name, via visually-hidden text or an `aria-label` ("Close", "Open menu", "Search"). Icon-only controls without names are a pervasive fast-built failure; every one should answer "what would a screen reader call this?"

## Announcing dynamic change (live regions)

When content changes without a page reload, a form submits and a success message appears, a search updates results, an error shows, a sighted user sees it but a screen-reader user does not, unless it is announced. ARIA live regions (`aria-live`) tell the screen reader to announce updates to a region as they happen. Use them for:
- Status messages (saved, error, loading complete).
- Results updating after a search/filter.
- Anything important that appears or changes without the user navigating to it.

Without live regions, a screen-reader user submits a form and hears nothing, no idea whether it worked. Use them judiciously (overuse is noisy), on the changes that matter.

## Where ARIA fits

ARIA attributes (`aria-label`, `aria-live`, `aria-describedby`, roles, states) fill gaps that semantic HTML cannot, naming an icon button, announcing a live update, describing a widget's state. The rule: **use ARIA to enhance, not to replace.** A real `<button>` needs no `role="button"`. The first rule of ARIA is to not use ARIA if a native element does the job. It is a patch for genuine gaps (custom widgets, dynamic announcements, naming), layered on correct structure, never a substitute for using the right element.

## What to flag
- Missing alt on meaningful images (information hidden) or missing empty-alt on decorative ones (noise).
- Form controls without associated labels.
- Icon-only buttons/controls with no accessible name.
- Dynamic updates (success, error, results) not announced to screen readers.
- ARIA misused to fake semantics that a real element would provide.

## The honest framing
The principle is that everything a sighted user perceives, an image's meaning, an icon's purpose, a status change, must reach a non-visual user through text or semantics. Describe meaningful images, label every control, name every icon button, and announce the changes that matter. These are small, concrete additions, but their absence is what makes an interface a confusing stream of "button, button, edit text, image" to someone relying on a screen reader.

## Connection to other references
Rests on semantic-structure (screen readers convey semantics). Labels and errors detailed in forms-and-inputs. Confirming the actual experience requires a real screen-reader test (testing-accessibility), automated tools cannot tell whether alt text is *meaningful*, only whether it exists.
