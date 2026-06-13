# Funnels and drop-off

Understanding where users succeed and fail in a multi-step flow. A funnel measures progression through a sequence of steps (signup, onboarding, checkout) and reveals where people drop out, which is often the single most actionable thing analytics can tell you, because a drop-off step is a concrete, fixable problem with a measurable payoff.

## What a funnel is and why it matters

A funnel is an ordered sequence of steps toward a goal, with the count of users reaching each step:
- e.g. checkout: viewed cart, started checkout, entered payment, completed purchase.
- Each step has fewer users than the last (people drop out), the funnel narrows.
- The value is seeing *where* the biggest drops happen. If 80% drop between "entered payment" and "completed purchase," that step has a problem (a confusing form, a bug, an unexpected cost), and fixing it has a direct, measurable revenue effect.

Funnels turn a vague "conversion is low" into a specific "users abandon at the payment step," which is actionable. This is why funnel/drop-off analysis ranks high: it points at exactly what to fix.

## Defining funnel steps

- **Choose the key flows** worth instrumenting as funnels: the paths that matter most to the product (onboarding/activation, the core conversion, signup). Do not funnel everything, funnel the flows whose completion matters.
- **Define the steps deliberately** as events (event-design.md), each step a clear event fired when the user reaches it. The funnel is then the progression across those events.
- **Order and scope matter:** decide whether steps must be in strict order, and the time window (do they have to complete in one session, or over days).

## Reading drop-off

- **Find the biggest drop:** the step with the steepest fall is usually where to focus, fixing the worst leak has the most impact.
- **Conversion rate** through the whole funnel (start to finish) is the headline; per-step rates locate the problem.
- **Segment the funnel:** drop-off often differs by segment (new vs returning, mobile vs desktop, plan tier, traffic source). A funnel that drops badly only on mobile points at a mobile-specific problem (`mobile-and-responsive`). Segmenting turns "people drop here" into "people *on mobile* drop here," much more actionable.

## Where, not why

A funnel tells you *where* users leave, not *why*. The drop-off step is the question, not the answer. High drop at the payment step could be a bug, a confusing UI, an unexpected fee, a trust issue, the funnel locates it; finding the cause needs further investigation (session recordings, user feedback, testing the flow yourself, examining the step). Treat the drop-off as a signal pointing at where to look, then investigate the cause rather than assuming it.

## What to flag
- No funnel instrumentation on the key flows (so you cannot see where users drop, a major missed-insight gap).
- Funnels defined on unimportant flows while the key conversion path is unmeasured.
- Looking only at overall conversion without per-step drop-off (knowing it is low but not where).
- Not segmenting funnels (missing that the problem is specific to a segment like mobile).
- Treating the drop-off step as the cause rather than investigating why.

## The honest framing
Instrument the key flows as funnels so you can see exactly where users drop out, it is the most directly actionable analytics output, because a drop-off step is a specific, fixable problem with measurable payoff. Find the biggest leak, segment it (the problem is often specific to mobile, or new users, or a plan tier), fix that step, and watch the conversion improve. But remember the funnel shows *where*, not *why*, the steep drop tells you where to investigate, not what the cause is; that still needs looking.

## Connection to other references
Funnel steps are events (event-design.md) tied to a consistent identity. The activation funnel specifically connects to activation-and-retention.md. Segmenting by mobile ties to `mobile-and-responsive`. Acting on the found drop-off is acting-on-data.md.
