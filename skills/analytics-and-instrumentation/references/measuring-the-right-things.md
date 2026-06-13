# Measuring the right things

The hardest and most important analytics question is not which tool to use, it is what to measure. Most analytics failures are not technical; they are measuring nothing useful, or measuring flattering numbers that decide nothing. This starts before any tracking code: decide what you need to know.

## Start from decisions, not data

The right order is question first, instrumentation second. Ask: what decisions am I trying to make, and what would I need to know to make them?
- "Should I keep building this feature?", measure whether anyone uses it.
- "Why are signups not converting to active users?", measure the activation funnel and where people drop.
- "Is the product actually valuable?", measure whether people come back (retention).

Then instrument exactly what answers those questions. The anti-pattern is "track everything and figure it out later", it buries the signal in noise, makes the data hard to work with, and creates privacy liability (every tracked thing is data you now hold, `data-privacy`). Tracking should be intentional: each event earns its place by informing a question you will act on.

The test for any event or metric: **what decision would this change?** If the honest answer is "none, it is just nice to know," it is probably noise. Nice-to-know is the enemy of a usable analytics setup.

## Vanity metrics versus actionable metrics

A vanity metric is one that looks good and informs nothing:
- **Cumulative totals that only ever rise:** total signups ever, total page views, total registered users. They always go up (that is what cumulative means), they feel like progress, and they tell you almost nothing about whether the product is working *now* or getting better. A product can have a beautiful rising total-signups line while actually dying (no one stays).
- **Raw counts without context:** "10,000 page views" means little without knowing from how many people, doing what, converting to what.

Actionable metrics inform a decision and can go down as well as up:
- **Rates and ratios:** activation rate, conversion rate, drop-off at a step, retention percentage, these reflect how well something works, not just how much has accumulated.
- **Cohort-based and time-bounded:** how this week's new users behave, not the all-time pile.
- **Tied to a decision:** if the drop-off at step 3 is high, you know to fix step 3.

The shift from vanity to actionable is usually the single biggest improvement in a product's analytics: stop watching the total-signups line go up, start watching whether new users activate and return.

## Choosing the key metrics

Most products have a small number of metrics that genuinely reflect health, not a dashboard of fifty. Commonly:
- **An activation metric:** do new users reach the core value (activation-and-retention.md)?
- **A retention metric:** do they come back?
- **A core-action metric:** are people doing the main valuable thing the product is for?
- Sometimes a conversion/funnel metric for the key flow.

Identifying these focuses everything else, the events you track, the funnels you build, the dashboard you watch, serve the few metrics that matter. A product that knows its three key metrics and watches them beats one drowning in fifty it ignores.

## What to flag
- Measuring nothing meaningful (flying blind on usage, activation, retention).
- Vanity metrics as the headline (cumulative totals, raw page views) that flatter without informing.
- "Track everything" with no question behind it (noise plus privacy liability).
- No identified key metrics, no clear sense of what reflects product health.

## The honest framing
Decide what you need to know before you track anything, and track only what answers a question you will act on. Replace the vanity metrics that only rise and decide nothing (total signups, page views) with actionable ones that can fall and that map to a decision (activation rate, drop-off, retention). Know your three or so key metrics and let them focus the rest. The test for every event is "what would I do differently based on this?", if nothing, do not track it. Good analytics is small, intentional, and decision-linked, not a firehose.

## Connection to other references
Activation and retention metrics: activation-and-retention.md. Funnel drop-off: funnels-and-dropoff.md. "Track only what you need" overlaps `data-privacy`'s minimisation (less tracked = less held). Clean event design to make it usable: event-design.md.
