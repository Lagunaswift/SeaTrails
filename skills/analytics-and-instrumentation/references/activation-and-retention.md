# Activation and retention

The two metrics most predictive of whether a product actually works, and the ones vanity metrics most often hide. Acquisition (signups, traffic) measures people arriving; activation measures whether they reach value; retention measures whether they stay. A product can pour users in the top while none activate or return, and the only metrics that expose that are these. This is why they outrank raw totals.

## Activation: do new users reach value?

Activation is the point where a new user first experiences the product's core value, the "aha moment," the first meaningful success that makes the product worth using. Examples: a messaging app, sent first message; a project tool, created first project and invited a teammate; an analytics tool, saw their first real chart of their own data.

- **Define the activation event for the product:** what is the moment a new user has genuinely "got it"? This is product-specific and worth thinking hard about, it is the thing onboarding should drive toward.
- **Measure the activation rate:** of new users, how many reach activation, and how quickly? A low activation rate means people sign up but never reach value, usually an onboarding problem (and a funnel to instrument, funnels-and-dropoff.md).
- Activation is the bridge between acquisition and retention: users who never activate almost never retain. Improving activation often does more than acquiring more users who will also fail to activate.

## Retention: do users come back?

Retention measures whether users return over time, the truest signal of lasting value. A product people use once and abandon is not working, however many signups it has.
- **Retention curves / cohorts:** take a cohort (users who signed up in a given week), and measure what fraction are still active after 1 day, 1 week, 1 month, etc. The curve's shape tells the story: a curve that drops to near-zero means no lasting value; one that flattens at some level means a core of users keeps returning (a "retained" base), the sign of product-market fit.
- **Cohort analysis** (comparing retention across cohorts over time) shows whether changes are improving retention, are users who joined this month retaining better than last month's?
- Define "active" meaningfully for the product (the action that constitutes real use, not just "opened the app").

## Why these outrank vanity totals

This is the heart of why measuring-the-right-things warns against cumulative totals:
- **Total signups always rises** and can look healthy while retention is zero, everyone who joins leaves, but the total still climbs because it never subtracts. The product is dying and the headline number looks great.
- **Retention exposes this immediately:** the retention curve crashing to zero shows the truth the signup line hides.
- So a product serious about knowing whether it works watches activation and retention, not the flattering accumulation. These are the metrics that can tell you the product is failing while signups grow, which is exactly the truth you need.

## What to flag
- No defined activation event / no activation measurement (cannot tell if new users reach value, the key onboarding question).
- No retention measurement (cannot tell if the product has lasting value, the most important blind spot).
- Headline metrics being acquisition/cumulative totals while activation and retention go unmeasured (watching the flattering number, missing the real one).
- "Active" defined trivially (app opened) rather than as real use.

## The honest framing
Activation (do new users reach value?) and retention (do they come back?) are the metrics that actually tell you whether a product works, and they are precisely what cumulative signup totals hide. Define the activation moment and measure how many new users reach it; measure retention with cohort curves to see whether anyone stays. A crashing retention curve reveals a dying product that a rising signups line would flatter. If you measure only a few things, measure these two, plus the core action, because they expose the truth that vanity metrics conceal.

## Connection to other references
These are the key metrics that measuring-the-right-things.md says to identify, and the antidote to the vanity totals it warns against. Activation is a funnel (funnels-and-dropoff.md). They depend on clean events and consistent identity (event-design.md). Lawful measurement of returning users defers to `data-privacy` (privacy-respecting-analytics.md).
