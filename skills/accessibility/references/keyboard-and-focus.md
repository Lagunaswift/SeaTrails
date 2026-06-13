# Keyboard and focus

Everything must work without a mouse. Keyboard accessibility is non-negotiable: screen-reader users, people with motor impairments, people who simply prefer it, all navigate by keyboard. If something can only be done with a mouse, those users cannot do it at all. This is also the fastest manual test there is, unplug the mouse and try to use the app.

## Everything operable by keyboard

Every interactive element must be reachable (focusable via Tab) and operable (triggerable via keyboard). With real semantic elements (see semantic-structure) this is mostly free: buttons trigger on Enter/Space, links on Enter, form controls behave correctly. The failures come from:
- Fake controls (divs/spans) that are not focusable or have no key handlers, fix by using real elements.
- Custom widgets (menus, tabs, sliders, modals) built without keyboard support, these need the expected key interactions (arrow keys within a menu, Escape to close, etc.) per the established patterns.
- Mouse-only interactions (hover-only menus with no keyboard equivalent, drag-only actions with no alternative).

The test: Tab through the whole interface. Can you reach every control? Can you operate every one (activate buttons, open menus, fill forms, dismiss dialogs) using only the keyboard? Anything you cannot reach or operate is inaccessible to keyboard users.

## Visible focus indicator

Keyboard users need to see where focus is, which element will respond to their next keypress. Browsers provide a default focus outline; the common, damaging mistake is removing it for aesthetics (`outline: none`) without providing a replacement, which leaves keyboard users with no idea where they are, the interface becomes unusable for them even though nothing is technically broken.
- Never remove focus indication without replacing it with something at least as clear.
- A custom focus style is fine and often better, but it must be clearly visible against the background (this overlaps contrast).
- Focus indication should be obvious, not a subtle one-pixel change.

## Focus order

The order in which Tab moves through the page should follow the logical reading/usage order. Focus order is driven by DOM order, so a layout where the visual order and DOM order diverge (rearranged with CSS) can produce a confusing tab sequence that jumps around the page. Keep DOM order sensible; avoid positive `tabindex` values (they override natural order and cause exactly this chaos).

## Focus management in dynamic UI

Single-page apps and dynamic widgets have to manage focus deliberately, because content changes without a page load:
- **Opening a modal/dialog:** focus should move into it, and be trapped inside it while open (Tab cycles within the dialog, not back to the page behind), and Escape should close it. A modal that does not trap focus lets keyboard users tab off into the hidden page behind it, lost.
- **Closing it:** focus should return to where it was (the element that opened it), not jump to the top of the page.
- **Route changes in an SPA:** focus should move sensibly (often to the new page's heading) so the keyboard/screen-reader user is not left with focus on a stale element.
- **Newly revealed content:** focus may need to move to it so the user knows it appeared.

This deliberate focus management is the difference between a usable and an unusable dynamic interface for keyboard users.

## Keyboard traps

A keyboard trap is focus that gets stuck somewhere the user cannot Tab out of, an embedded widget, a badly-built modal. The user is frozen, unable to reach the rest of the page. Trapping focus *inside an open modal on purpose* is correct (with Escape to leave); trapping it with no way out is a serious barrier. Test that focus can always move on, except where intentionally and escapably contained.

## What to flag
- Anything not reachable or operable by keyboard (the core failure).
- Focus outline removed without a visible replacement.
- Illogical focus order, or positive tabindex causing jumps.
- Modals/dialogs that do not trap focus while open or do not restore it on close.
- Any keyboard trap with no escape.

## The honest framing
The keyboard test is the cheapest, highest-value accessibility check you can run: put the mouse aside and try to complete every task. Most keyboard barriers come from fake controls (fixed by semantic markup) and from dynamic UI that does not manage focus (fixed by moving and trapping focus deliberately). Add a clearly visible focus indicator and a sensible tab order, and the interface becomes usable for a large group it would otherwise exclude entirely.
