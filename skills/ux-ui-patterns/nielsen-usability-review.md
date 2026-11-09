# Nielsen usability review

Apply these prompts to complete user journeys during code-audit's UI/UX pass. They adapt Jakob Nielsen's [ten usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), checked 9 November 2026. The labels follow the source order; the probes below are SeaTrails procedures for the existing audit controls.

HEUR-01 through HEUR-10 identify the source perspective. Keep the existing finding IDs, severity rules and report fields. These labels add no controls, lens or score. Use the website profile's existing topics and evidence for the reviewed scope, observations and limitations.

## Contents

- [Run the journey](#run-the-journey)
- [Review prompts](#review-prompts)
- [Evidence and reporting](#evidence-and-reporting)

## Run the journey

Establish the audience, primary task and approved product behaviour. Record the role, environment, source revision and supported device or input method. Use real product vocabulary and supplied business facts; mark assumptions about users' experience.

Select representative routes and states from the website inventory. Follow an ordinary completion, then exercise a relevant mistake or interruption with safe test data. Include direct entry and a return to earlier work where the journey supports them. For repeated work, use realistic data volume. A public information page may need only reading and navigation; it does not acquire a checkout or onboarding flow through this review.

Consider each prompt against the selected task. State a scope reason when it has no applicable interaction, and name any missing evidence. Required work blocked by browser or provider access stays partial. Use [website-completeness.md](website-completeness.md) for commercial facts, and the detailed forms, navigation and feedback references for applicable components. An optional capability's absence needs a product decision before it becomes an implementation requirement.

## Review prompts

### HEUR-01: Progress and outcomes

Trigger a meaningful action and observe the pending, completed and failed states. Compare the visible claim with the operation's established result: a local draft, queued request and delivered message have different outcomes. On refresh or return, check that the state remains understandable. Show an uncertain outcome honestly and reconcile a consequential write before offering a retry.

Owners: frontend-robustness; accessibility for perceivable status. Controls: UX-05, UX-10, A11Y-05, REL-01.

### HEUR-02: Familiar terms and models

Trace one task using only the labels, icons and instructions available to its intended audience. Check that item names, units and ordering match the product's domain. Compare a control's implied action with its actual result. Preserve specialist vocabulary where users need it; unsupported assumptions about unfamiliarity require research or a stated limitation. Internal table names exposed in a consumer journey need a specific, supported replacement.

Owners: code-audit; anti-slop-writing for wording quality; internationalisation for locale meaning. Controls: BASE-01, UX-01, UX-04, UX-06, BRAND-01, BRAND-07, CONV-01.

### HEUR-03: Exit and undo

Enter an edit, selection or multi-step process and deliberately change direction. Check the available exit, retained work and the resulting state. Test undo or redo where the product supports reversible editing. Distinguish closing a waiting screen, cancelling queued work and reversing a committed action. Confirm that any recovery promise works after its relevant failure or timing boundary. An irreversible action needs clear commitment and an appropriate safe alternative before execution.

Owners: code-audit; frontend-robustness for state recovery. Controls: UX-06, UX-10, REL-08, PAY-03, OPT-20.

### HEUR-04: Predictable conventions

Compare equivalent tasks on neighbouring screens. Check whether the same label, icon or status produces the same result, and whether distinct actions remain distinguishable. Exercise expected browser and keyboard behaviour, including the history model of routed overlays. Keep familiar conventions when they serve the task; a proposed deviation needs an observed benefit and consistent execution.

Owners: code-audit; impeccable-audit for visual consistency; accessibility for input behaviour. Controls: UX-01, UX-02, UX-06, BRAND-03, BRAND-04, BRAND-07.

### HEUR-05: Prevent costly mistakes

Probe a plausible wrong target, invalid value or accidental repeat using safe fixtures. Prioritise consequences such as sending to the wrong recipient or applying a bulk action to hidden selections. Check relevant constraints and defaults before commitment. A confirmation should show the actual target and consequence; routine reversible actions can use a working recovery path. Backend validation and idempotency remain required where the action needs them.

Owners: code-audit; frontend-robustness; accessibility for understandable validation. Controls: UX-04, UX-06, PAY-01, PAY-02, REL-02, A11Y-05, OPT-20.

### HEUR-06: Avoid memory burden

At each step, identify which earlier facts the user needs now. Check that selected records, previous answers, relevant constraints and the current price or commitment are visible or readily retrievable. Exercise comparison and correction without memorising opaque identifiers or re-entering safe data already supplied. Preserve meaningful labels after typing and context when returning to a list. This review covers the whole journey, including tasks outside forms and authentication; apply privacy limits to retained information.

Owners: code-audit; accessibility; frontend-robustness for retained state. Controls: UX-02, UX-04, UX-10, A11Y-05, A11Y-09, CONV-02, CONV-03.

### HEUR-07: Efficient repeat work

Complete a first-use task, then repeat it with representative workload. Identify repeated entry or navigation that has an observed cost. Assess existing accelerators alongside the ordinary route, including discoverability and keyboard conflicts. Shortcuts, bulk actions and customisation remain conditional choices; recommend one only with a concrete task benefit and implementation cost. Preserve controls needed by occasional users.

Owners: code-audit; accessibility; mobile-and-responsive for supported input methods. Controls: UX-03, UX-04, CONV-03, OPT-05, OPT-07, OPT-09, OPT-10.

### HEUR-08: Relevant content and hierarchy

Name the decision that each questioned element supports. Apply keep, rewrite, restyle or remove using [the shared design context](../production-audit/references/design-review-context.md). Preserve useful brand expression, explanatory copy and meaningful category or status labels. A dense comparison table, system font or "Overview" eyebrow can serve the task. Identify the actual duplication, distraction or obscured priority before changing it; assess visual claims at the relevant viewport and theme.

Owners: impeccable-audit; taste-audit on its selected surfaces; code-audit for task failures. Controls: BRAND-05, BRAND-07, UX-03, CONV-01.

### HEUR-09: Useful error recovery

Cause a relevant failure safely and follow the displayed remedy. Check that the message identifies the affected item or field, states the known problem and offers an action that works. Preserve appropriate input and keep the error available long enough to act on it. Verify keyboard access and status announcements. A retry must account for a possibly completed write; never infer failure solely from a lost response.

Owners: frontend-robustness; accessibility; code-audit for consequential correctness. Controls: UX-04, UX-05, UX-07, UX-10, REL-01, A11Y-05.

### HEUR-10: Task-focused help

Attempt an unfamiliar or exceptional task with the help available at that point. Follow its steps against the current interface and permissions. Verify prerequisites, examples and the route back to work; check support links when escalation is needed. Essential instructions must remain accessible without hover. A short instruction may be sufficient. FAQs, search, tooltips and help centres are optional formats whose usefulness depends on the task and content volume.

Owners: code-audit; anti-slop-writing for copy quality; accessibility for access to instructions. Controls: UX-04, UX-05, UX-07, UX-08, A11Y-05, SEO-09, OPT-11, OPT-14, OPT-16.

## Evidence and reporting

Record the route or step, expected behaviour and observed result with a retrievable evidence reference. Source inspection can establish a contradictory label or state branch. Rendered evidence supports appearance in its captured state; interaction supports the exercised path. Follow the existing source-assurance and verification contracts. A heuristic observation cannot establish a measured conversion gain or users' preferences.

Route defects by their actual consequence and merge shared root causes. A misleading instruction that loses data belongs with correctness; a wording preference stays with content. Describe the task failure before suggesting a component. Missing optional features, justified keep decisions and strengths remain in coverage/context. Preserve the reported survivors when associating evidence with existing website topics.

Keep untested steps and audience assumptions visible in limitations. Record an unassessed required journey as partial under the existing contract. The audit stays read-only; execute fixes only within separately authorised scope.
