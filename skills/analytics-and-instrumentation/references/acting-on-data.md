# Acting on the data

Analytics has value only if it changes decisions. Collected-and-ignored data is wasted effort and a privacy liability for nothing; confidently-wrong data is worse than none. This reference closes the loop: make the data visible, make it trustworthy, and keep every metric tied to a decision.

## Dashboards and review (visible and looked at)

- **Make the key metrics visible**, a dashboard showing the few metrics that matter (activation, the key funnel, retention, the core action), not buried in a tool nobody opens.
- **Actually review them** on some cadence. The failure is instrumenting carefully, then never looking, the data accumulates and informs nothing. A simple dashboard reviewed weekly beats an elaborate one ignored.
- **Show the actionable metrics, not the vanity ones** (measuring-the-right-things.md), a dashboard headlined by total signups trains everyone to watch the wrong number. Put activation and retention front and centre.
- Keep dashboards focused, a wall of fifty charts is as useless as none, because no one can see what matters.

## Data quality and trust

Instrumentation that is wrong or inconsistent produces confident wrong conclusions, which lead to worse decisions than having no data (because you act on them with false certainty). Protecting trust:
- **Verify instrumentation works:** when adding tracking, confirm events actually fire correctly with the right properties (test it), rather than assuming. Broken tracking that silently records nothing, or records wrong values, corrupts every analysis downstream.
- **Consistency** (event-design.md): inconsistent events fragment the data and mislead.
- **Watch for tracking breakage:** instrumentation can break silently (a refactor removes an event, a change alters its meaning), and you only notice when a metric mysteriously drops or a funnel looks wrong. Sanity-check when numbers move strangely, the cause is often broken tracking, not a real change.
- **Be honest about what the data can and cannot say:** sample sizes, segments, the where-not-why limit of funnels (funnels-and-dropoff.md). Overreading thin data is its own error.

## From metric to action

The discipline that ties it together, every metric should connect to a possible decision:
- For each key metric, know: if this moves, what would I do? Activation drops, investigate onboarding. Retention improves after a change, that change worked. Drop-off concentrates at a step, fix that step.
- If a metric would never change any decision, question why it is tracked (measuring-the-right-things.md, it is probably vanity/noise).
- **Close the loop:** make a change, watch the relevant metric, learn whether it worked. Analytics is most valuable as a feedback loop on decisions, not a passive report. This connects to how changes ship and get evaluated (`release-and-ops`, and gradual rollout where a metric tells you if a release is healthy).

## What to flag
- Data collected but never reviewed (instrumentation effort and privacy exposure for no decisions).
- Dashboards headlined by vanity metrics, or so cluttered the key metrics are lost.
- Unverified instrumentation / no check that events fire correctly (risk of confident wrong conclusions).
- Metrics tracked that connect to no possible decision (noise).
- No feedback loop, changes shipped without watching whether the relevant metric moved.

## The honest framing
Analytics pays off only when it changes what you do. Put the few metrics that matter on a dashboard you actually look at, make sure the instrumentation is correct enough to trust (verify events fire; suspect broken tracking when numbers move oddly), and keep every metric tied to a decision, if nothing would change based on it, do not track it. The highest form of this is the feedback loop: make a change, watch the metric, learn. Data that is collected, trusted blindly, or never acted on is effort spent for nothing; data that is visible, verified, and decision-linked is how a product actually improves.

## Connection to other references
Ties together the whole skill: actionable (not vanity) metrics (measuring-the-right-things.md), trustworthy events (event-design.md), funnel and retention insight (funnels-and-dropoff.md, activation-and-retention.md). The feedback loop on shipped changes connects to `release-and-ops` (releasing and watching the effect). Operational health dashboards are the sibling, `scaling-audit` (observability).
