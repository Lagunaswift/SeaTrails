---
name: analytics-and-instrumentation
description: "Use this skill to decide what product usage to measure and how to instrument it well: choosing meaningful metrics, designing an event-tracking schema, building funnels, measuring activation and retention, and doing it without privacy violations or vanity-metric noise. Trigger on phrases like 'analytics', 'tracking', 'events', 'metrics', 'what should I measure', 'funnel', 'conversion tracking', 'retention', 'activation', 'product analytics', 'event tracking', 'KPIs', 'dashboard', 'instrument', 'Mixpanel/Amplitude/PostHog/GA', or when the question is understanding how people actually use a product through data. This is the measure-what-matters lens, product/usage analytics. It is distinct from operational/error observability (use scaling-audit for is-it-up/erroring) and from privacy compliance (use data-privacy for lawful tracking, which this skill defers to). Defaults to a prioritised view of what to measure and how to instrument it cleanly. Applies to any product wanting to understand user behaviour."
---

# Analytics and Instrumentation

The lens for one question: **does the product measure what actually tells you whether it is working, and is that measurement trustworthy?** Most products either measure nothing (flying blind on whether features are used, where users drop off, whether anyone comes back) or measure the wrong things (vanity metrics that feel good and decide nothing). Good instrumentation answers real questions, are people reaching value, where do they fall out of a flow, do they return, with data clean enough to trust. This is product analytics: understanding user behaviour, distinct from operational observability (is the system up and erroring, which is `scaling-audit`) and from the legality of tracking (which is `data-privacy`).

This does not cover ops/error monitoring (`scaling-audit`, observability) or privacy law (`data-privacy`, which this skill *defers to* on consent and PII). It is the measure-the-right-things-well lens.

## The cardinal principle

**Measure to answer a question you will act on; an event you would never make a decision from is noise, and a metric that only ever goes up is usually a vanity metric.** The point of analytics is decisions: what to build, fix, or change. Instrumentation should start from the questions that matter (are users activating? where do they drop? do they retain?) and capture what answers them, not "track everything" (which buries signal in noise and creates privacy risk) and not the flattering totals (total signups ever, page views) that feel like progress while telling you nothing actionable. Decide the question first, then instrument for it.

## Assessment by default, design guidance when asked

Default to assessing what the product measures (or fails to) against what would actually inform decisions, and flagging vanity metrics, gaps, messy event design, and privacy issues. Give instrumentation design guidance (event schema, funnel/retention setup) when asked to build rather than assess.

## The areas, in priority order

### 1. Measuring the right things (start here, before any tooling)
What to measure is a harder and more important question than which tool to use.
- **Start from decisions/questions:** what do you need to know to improve the product? (Are people reaching the core value? Where do they drop off? Do they come back?) Instrument those, not everything.
- **Avoid vanity metrics:** totals that only rise and flatter (cumulative signups, raw page views) rarely inform a decision. Prefer actionable metrics (activation rate, drop-off points, retention) tied to what you would change.
- **Identify the product's key metrics:** the few that genuinely reflect health (often an activation metric, a retention metric, and a core-action metric), not a dashboard of fifty.
`references/measuring-the-right-things.md` covers question-first instrumentation, vanity vs actionable metrics, and choosing key metrics.

### 2. Event design and schema
How events are structured determines whether the data is usable or a mess.
- **Consistent naming and structure:** a deliberate scheme for event names and properties (e.g. object-action like `signup_completed`), applied consistently, not ad hoc names that fragment the data.
- **Useful properties** on events (enough context to segment and analyse) without dumping everything.
- **A planned tracking schema** (a tracking plan) so events are defined intentionally and consistently across the app, rather than sprinkled by whoever added a feature.
`references/event-design.md` covers naming conventions, properties, and maintaining a tracking plan.

### 3. Funnels and drop-off
Understanding where users succeed and fail in multi-step flows.
- **Funnel instrumentation:** track the steps of a key flow (signup, onboarding, checkout) so you can see where users drop off, the single most actionable analytics output for improving conversion.
- Define the funnel steps deliberately and measure progression through them.
- Distinguish where people leave (the drop-off step) from why (which needs more investigation).
`references/funnels-and-dropoff.md` covers defining funnels, measuring drop-off, and reading conversion.

### 4. Activation and retention (the metrics that matter most)
Whether users reach value and whether they come back, the metrics most predictive of a product working.
- **Activation:** do new users reach the product's core value (the "aha" / first meaningful success), and how many, how fast? Define the activation event for the product.
- **Retention:** do users return over time? Retention curves (do they come back day 1, week 1, month 1) reveal whether the product has lasting value, far more than signup counts. A product can grow signups while retaining no one, retention exposes that.
- These usually matter more than acquisition totals, which is why they rank above raw counts.
`references/activation-and-retention.md` covers defining activation, retention curves/cohorts, and why these outrank vanity totals.

### 5. Privacy-respecting analytics (defers to data-privacy)
Measuring usage without violating privacy or the law.
- **Consent before non-essential tracking** (analytics cookies/identifiers generally need opt-in, this is `data-privacy`'s domain and this skill defers to it). Tracking must respect consent.
- **Minimise personal data in events:** track behaviour without unnecessarily capturing PII; avoid putting emails, names, or sensitive data in event properties where an ID or nothing would do (minimisation, `data-privacy`).
- Consider privacy-respecting/cookieless analytics approaches where they suffice.
`references/privacy-respecting-analytics.md` covers consent, PII minimisation in events, and the deferral to `data-privacy`.

### 6. Acting on the data (closing the loop)
Analytics only has value if it changes decisions.
- **Dashboards and review:** the key metrics visible and actually looked at, not collected and ignored.
- **Data quality and trust:** instrumentation that is correct and consistent enough to trust (broken or inconsistent tracking produces confident wrong conclusions, worse than no data).
- **From metric to action:** a metric should connect to a decision; if no one would act on it, question why it is tracked.
`references/acting-on-data.md` covers dashboards, data trust, and keeping analytics decision-linked.

## How to report
Order by what unlocks decisions: measuring nothing meaningful (flying blind) or measuring only vanity metrics (false comfort) are the top findings, then messy event design that makes data untrustworthy, then privacy issues, then the act-on-it loop. For each: what is measured or missing, what decision it does or does not inform, and the fix. Flag vanity metrics directly. Where tracking raises consent/PII issues, defer the legal specifics to `data-privacy`.

## Scoping
Match to stage and need. A pre-launch product with no users does not need elaborate analytics, it needs the instrumentation ready to learn once users arrive (an activation event, a key funnel). A live product making decisions needs the key metrics, clean events, and funnels. Avoid the opposite failure too: over-instrumenting (tracking everything, huge schemas, dashboards no one reads) is its own waste and a privacy liability. The honest output for most products is "you are either flying blind or drowning in vanity metrics; pick the three questions that matter (activation, the key funnel's drop-off, retention), instrument those cleanly and with consent, and act on them."

## Skills this leans on
- `data-privacy`: consent for tracking and PII minimisation in events, this skill defers to it for the lawful-tracking requirements; measure usage without breaching privacy
- `scaling-audit`: operational observability (is it up/slow/erroring) is the sibling measurement discipline; this is product usage, that is system health
- `belief-shift-engine`, product strategy: the questions worth measuring often come from the product/growth strategy that defines what success means
