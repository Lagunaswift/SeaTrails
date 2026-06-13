# Mobile input and forms

Forms are harder on mobile (small screen, on-screen keyboard, touch precision) and also have mobile-specific opportunities to make them easier. Getting input right on mobile is a large, cheap usability win; getting it wrong makes forms, often the most important thing a user does, painful on the device most users are on.

## Correct input types for the right keyboard

Mobile on-screen keyboards adapt to the input type, and using the right type gives the user the right keyboard automatically:
- `type="email"`, a keyboard with @ and . readily available.
- `type="tel"`, a numeric phone pad.
- `type="number"` (or `inputmode="numeric"/"decimal"`), a number pad for numeric entry.
- `type="url"`, a keyboard with / and .com conveniences.
- `type="date"`/`time`, native date/time pickers.
- `inputmode` and `enterkeyhint` attributes further tune the keyboard and its action key.

Using `type="text"` for everything forces the user to switch keyboard modes manually to type an email or number, small friction repeated on every field. Correct input types are one of the cheapest, highest-value mobile improvements: a few attributes, a noticeably smoother form. (Also: appropriate `autocomplete` attributes let mobile autofill work, saving typing.)

## The on-screen keyboard obscuring inputs

When a mobile keyboard opens, it covers the bottom portion of the screen, and a focused input in that region can end up hidden behind the keyboard, the user is typing into a field they cannot see. Handle it:
- Ensure the focused field scrolls into the visible area when the keyboard opens (browsers often do this, but fixed-position layouts and custom scroll containers can break it).
- Be careful with fixed footers/headers and full-height layouts that interact badly with the keyboard opening (relates to the dynamic viewport, viewport-and-rendering.md).
- Test forms with the actual keyboard open, not just the layout at rest.

## Touch-friendly form controls

Form controls must be tappable (touch-and-interaction.md):
- Inputs, selects, checkboxes, radios, and buttons large enough to tap, with adequate spacing, tiny checkboxes and closely-packed radios are hard to hit.
- Prefer native controls (native select, date picker) where reasonable, they are touch-optimised by the OS and familiar to users; custom-built replacements often handle touch worse.
- Labels tappable to focus their control (also an `accessibility` point), a larger effective target.

## Reducing input effort on mobile
Typing on a phone is laborious, so reduce it:
- Autocomplete/autofill attributes so the browser can fill known data (name, email, address, one-time codes).
- Sensible defaults and smart input modes.
- Avoid asking for more than necessary on mobile (ties to form design generally).

## What to flag
- Generic `type="text"` where a specific type (email, tel, number, url) would give the right keyboard (the common, cheap-to-fix finding).
- Focused inputs obscured by the on-screen keyboard (typing blind), especially with fixed layouts.
- Tiny or closely-packed form controls hard to tap.
- Custom controls that handle touch worse than the native ones they replaced.
- Missing autocomplete attributes, making mobile users type what could autofill.

## The honest framing
Forms are where mobile usability is won or lost, and the wins are cheap. Set the correct input type on every field so the right keyboard appears (a few attributes, a much smoother form), make sure the keyboard does not hide the field being typed into, keep controls big enough to tap, and let autofill do its job. The signature cheap miss is `type="text"` everywhere, forcing manual keyboard-switching for emails and numbers on every field. Test forms on a real phone with the keyboard up, because the obscured-field and wrong-keyboard problems are invisible on desktop.

## Connection to other references
Control tappability is touch-and-interaction.md; keyboard-obscuring relates to the dynamic viewport (viewport-and-rendering.md). Label-tap and native controls overlap `accessibility`. Form behaviour and validation generally are `frontend-robustness` (form-submission, validation).
