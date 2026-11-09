# WCAG 2.2 checks that are easy to miss

Use the project's stated target; the default here is WCAG 2.2 AA. Check exact success-criterion wording and exceptions before reporting a standards failure. This list supplements the other references and is not a complete conformance checklist.

| Area | Audit check and evidence |
| --- | --- |
| Target size, 2.5.8 | Measure the pointer target in CSS pixels. AA generally requires at least 24 × 24, with spacing, equivalent-control, inline, user-agent and essential exceptions. Evaluate the actual exception before failing a smaller target. A 44 × 44 target is an enhanced/comfort recommendation, not the universal AA minimum. |
| Dragging, 2.5.7 | Test a single-pointer alternative that does not require dragging unless dragging is essential or the user agent controls it. Keyboard support alone does not establish this pointer alternative. |
| Focus not obscured, 2.4.11 | Check focused controls with sticky navigation, cookie notices, dialogs and mobile keyboards. At AA the component must not be entirely hidden by author-created content; a stronger fully visible target may be a design recommendation. |
| Accessible authentication, 3.3.8 | Do not require a cognitive-function test without a supported exception or assistance. Test password managers, copy/paste and available alternatives. Do not require users to memorise, transcribe or solve a puzzle when an accessible route can be provided. Check the criterion's recognised exceptions before failing a flow. |
| Redundant entry, 3.3.7 | Previously entered information in the same process should be auto-populated or selectable, subject to the security, essential and validity exceptions. |
| Consistent help, 3.2.6 | Where help mechanisms repeat across pages, check that their relative order is consistent. This does not require adding a new help feature to every site. |

Also review applicable existing requirements: keyboard access and no traps, bypass links, page/passage language, input purpose, status messages, error prevention, time limits, media alternatives and flashing content. Avoid claiming full WCAG coverage from this table.

## Sources checked 9 November 2026

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
- [Accessible authentication minimum](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum)
