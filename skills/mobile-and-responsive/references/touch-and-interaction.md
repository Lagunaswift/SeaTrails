# Touch targets and interaction

Check the device and input methods the product actually supports, including touch, mouse, keyboard and hybrid use. Do not depend on hover for essential information or operation.

## Target size and spacing

For WCAG 2.2 AA, success criterion 2.5.8 generally requires a pointer target at least 24 × 24 CSS pixels, with defined spacing, equivalent-control, inline, user-agent and essential exceptions. Measure the actual hit area and neighbouring targets, then evaluate the relevant exception. A 32-pixel target is not automatically an AA failure.

Larger targets, often around 44 × 44 CSS pixels, can improve touch comfort and are an enhanced recommendation. Do not mislabel that recommendation as the universal AA minimum. Padding can enlarge a hit area, but overlapping targets or an overlay intercepting taps can defeat it. Inline prose links have their own exception; do not blindly add padding that breaks reading layout.

## Hover and gestures

- Menus, tooltips and revealed controls need an appropriate tap/keyboard path where their content is needed. Check actual opening, dismissal and focus behaviour.
- Preserve native scrolling and zoom. Optional swipe, pull-to-refresh or other gestures should serve a task rather than be added because mobile supports them.
- Dragging needs a single-pointer alternative without dragging unless a criterion exception applies. Keyboard operation alone does not establish this alternative.
- Test target reachability with the on-screen keyboard, safe areas, sticky navigation, contact widgets and other overlays visible.

## Evidence and ownership

Report measured size/spacing or an observed interaction failure with viewport, device/input and state. Distinguish a standards failure from a comfort recommendation and from an untested real-device risk. `accessibility` owns the detailed WCAG interpretation; `frontend-robustness` owns general state/interaction failure.

## Sources checked 9 November 2026

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Target size minimum and exceptions](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
