---
name: analytics-and-instrumentation
description: "Use this skill to decide what product usage to measure and how to instrument it well: choosing meaningful metrics, designing an event-tracking schema, building funnels, measuring activation and retention, and doing it without privacy violations or vanity-metric noise. Trigger on phrases like 'analytics', 'tracking', 'events', 'metrics', 'what should I measure', 'funnel', 'conversion tracking', 'retention', 'activation', 'product analytics', 'event tracking', 'KPIs', 'dashboard', 'instrument', 'Mixpanel/Amplitude/PostHog/GA', or when the question is understanding how people actually use a product through data. This is the measure-what-matters lens, product/usage analytics. It is distinct from operational/error observability (use scaling-audit for is-it-up/erroring) and from privacy compliance (use data-privacy for lawful tracking, which this skill defers to). Defaults to a prioritised view of what to measure and how to instrument it cleanly. Applies to any product wanting to understand user behaviour."
---

# Analytics and Instrumentation

Assess whether measurement answers useful product questions and can be trusted. Start with the decisions the owner needs to make, then the minimum events and evidence needed. A site does not need a tracking SDK, persistent user identity or an experiment programme merely because those features are available.

## Assessment by default

Inspect existing instrumentation and data quality without installing trackers, changing consent settings or sending marketing messages. Give implementation guidance when requested. Operational/error monitoring belongs to `scaling-audit`; legal scope and tracking choices belong to `data-privacy`.

## Areas to assess

### 1. Questions and metrics

Identify the core task and meaningful outcomes: for example a completed enquiry, successful purchase or return to a recurring service. Choose denominators, time windows and segments that answer a decision. A one-off information site may not need account-level retention cohorts. Avoid collecting data that nobody will act on.

Read `references/measuring-the-right-things.md`.

### 2. Event definitions and delivery

Inspect consistent event/property definitions, the exact trigger and the distinction between an attempted action and confirmed success. Check duplicate browser/server delivery, retries, test traffic and environment separation. Reconcile representative conversions with their authoritative outcome where possible. Sanitise URLs, query parameters and campaign/UTM values before forwarding; do not send secrets, addresses or free-text form content by default.

Read `references/event-design.md`.

### 3. Funnels

Define steps and eligibility before calculating drop-off. Verify navigation/state changes do not double count or omit steps. A funnel identifies where measured users leave, not why they leave. Report selection gaps caused by consent, blocking or missing instrumentation.

Read `references/funnels-and-dropoff.md`.

### 4. Activation and retention

Where repeat usage matters, define a meaningful activation event and product-appropriate cohort/window. Check whether persistent identity is necessary and lawful before stitching sessions. Aggregate measurement can be enough for a different product question.

Read `references/activation-and-retention.md`.

### 5. Privacy and tracking controls

Map actual payloads, storage, vendors and server forwarding. Pseudonymous IDs may be personal data; cookieless or first-party branding does not establish an exemption. Check the applicable consent or exception/objection path through `data-privacy`, including pre-choice, refusal and withdrawal behaviour. Minimise collection and confirm applicable retention/rights handling.

Read `references/privacy-respecting-analytics.md`.

### 6. Decisions, experiments and follow-up

Check that reports are reviewed and instrumentation is trustworthy before interpreting changes. A before/after improvement does not itself establish causation. Experiments need a hypothesis, sensible assignment, primary metric, guardrails and a predeclared analysis plan; insufficient traffic may make a qualitative review more useful. Optional cart reminders need eligibility, suppression and privacy checks, not automatic activation.

Read `references/acting-on-data.md`.

## How to report

Prioritise by consequence: unauthorised disclosure/tracking, misleading outcome counts and decisions based on broken data can outweigh a missing dashboard. Record the route/event, payload or definition, actual observed delivery, intended decision and limitation. Separate observed instrumentation defects from unavailable provider evidence. Do not claim a conversion lift or causal explanation the data cannot support.

## Scoping

Recommend the smallest measurement plan that serves the product's actual questions. Existing provider access may be absent; state the resulting coverage limit. Optional experimentation, user stitching, reminders and dashboards are not launch requirements by default. Reference `data-privacy`'s dated official guidance for current legal interpretation.

## What to produce under a production-audit

Standalone, report as prose per "How to report". As a lens under `production-audit`, emit findings in the canonical schema (`production-audit/references/finding-schema.md`) instead, appended to the run's `raw-findings.jsonl` as discovered: prefix `ANL`, category `analytics` — or `privacy` where the consequence is consent or PII exposure. The schema overrides the prose format above.

## Skills this leans on
- `data-privacy`: consent for tracking and PII minimisation in events, this skill defers to it for the lawful-tracking requirements; measure usage without breaching privacy
- `scaling-audit`: operational observability (is it up/slow/erroring) is the sibling measurement discipline; this is product usage, that is system health
- product strategy (no skill in this suite): the questions worth measuring often come from the product/growth strategy that defines what success means
