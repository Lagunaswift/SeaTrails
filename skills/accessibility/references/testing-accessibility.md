# Testing accessibility

An automated pass establishes only that the tool found no violations within its supported rules and tested state. It does not prove accessibility or WCAG conformance. Do not attach a universal percentage to what automation can detect.

## Practical verification

1. **Scope:** list representative routes and complete tasks, including authentication, empty/loading/error/success states, overlays and responsive variants. Record the target standard and revision/environment.
2. **Automated checks:** use available tools such as axe or Lighthouse. Record tool/version, route/state, output and what was not covered. Review findings in context rather than blindly accepting scores.
3. **Keyboard:** complete the scoped tasks; inspect order, visible/unobscured focus, widget interactions, bypass links, dialogs, escape paths and route/state transitions.
4. **Screen reader:** test meaningful names, roles, states, headings, landmarks, alternatives, form errors and status changes. Record the actual browser/assistive-technology combination. If unavailable, say so; source inspection is not an executed screen-reader test.
5. **Visual and pointer:** measure contrast and targets, test 200% text resizing, 320 CSS-pixel reflow, text-spacing overrides, supported themes, motion settings and non-drag pointer alternatives.
6. **Other applicable criteria:** include media alternatives, time limits, error prevention, authentication and any content the practical sample has not addressed. For a formal assessment, review all applicable criteria and complete processes.

For high-impact services, testing with people with disabilities can reveal task barriers beyond the sampled technical checks. Record it as performed or recommended, never invented.

## Evidence and regression

Report each reproducible barrier with route/component, state, steps, observed outcome, relevant criterion and remediation. Separate confirmed barriers from manual checks still needed. Do not call a whole site compliant from a representative sample, a Lighthouse score or an absence of reported issues.

Where implementation is later authorised, use targeted automated regression tests for behaviour that can be asserted meaningfully, and retain manual verification for the rest. Missing CI tooling alone is not evidence that the interface fails WCAG.

## Sources checked 9 November 2026

- [WAI evaluation guidance](https://www.w3.org/WAI/test-evaluate/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
