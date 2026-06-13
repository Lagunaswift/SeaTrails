# Event design and schema

How events are structured determines whether the resulting data is analysable or a mess. Analytics data that is inconsistently named, haphazardly structured, or sprinkled in ad hoc by whoever added a feature becomes untrustworthy and hard to work with, you cannot answer questions cleanly from a tangle of `buttonClick`, `clicked_button`, `BtnClick`, and `user_clicked_the_button` all meaning different or overlapping things. Deliberate event design keeps the data usable.

## Consistent naming convention

Pick one naming scheme and apply it everywhere:
- A common, clear convention is **object-action**: `signup_completed`, `project_created`, `checkout_started`, `video_played`. The object (what) and the action (what happened to it) in a consistent order and case.
- Consistent case and separator (snake_case is common), consistent tense (past tense for completed actions reads well: `order_placed`).
- The point is not which convention, it is *one* convention, applied consistently, so events are predictable and groupable. Mixed conventions fragment the data and make analysis error-prone.

## Useful properties (not everything)

Events carry properties (attributes) that give context for segmentation and analysis:
- Attach properties that let you answer the questions that matter: for `project_created`, perhaps the project type, the plan tier, how the user got there. Enough to segment ("activation rate by plan tier", "drop-off by traffic source").
- But do not dump everything onto every event, irrelevant properties are noise and a privacy risk (especially avoid PII in properties where an ID suffices, privacy-respecting-analytics.md / `data-privacy`). Properties should earn their place like events do.
- Consistent property names across events (always `plan_tier`, not `plan` here and `tier` there) so they can be analysed together.

## A tracking plan

The discipline that keeps event design coherent as a product and team grow: a **tracking plan**, a deliberate, documented definition of the events you track, their properties, and what each means. Rather than developers inventing event names ad hoc as they build features (which fragments the schema), events are defined intentionally against the plan. Benefits:
- Consistency (no duplicate/variant events for the same thing).
- Shared understanding (everyone knows what `activated` means and when it fires).
- Analysability (the data matches a known schema).

Even a lightweight plan (a shared document listing events and properties) beats ad hoc tracking. For a solo builder it is still worth a few minutes' intentional design rather than scattering events.

## Identity and stitching
- Track events against a consistent user identifier so a user's actions can be connected over time (essential for funnels and retention), while respecting privacy (use an internal ID, not PII, privacy-respecting-analytics.md).
- Handle the anonymous-to-identified transition (a user is anonymous before signup, identified after), so pre- and post-signup behaviour can be connected where appropriate and lawful.

## What to flag
- Inconsistent event naming (mixed conventions, duplicate/variant names for the same action), making data fragmented and unreliable.
- Ad hoc tracking with no plan (events sprinkled in by feature, no coherent schema).
- Events with no useful properties (cannot segment) or stuffed with irrelevant/PII properties (noise and privacy risk).
- No consistent user identity for connecting actions over time (breaks funnels/retention).

## The honest framing
Design events deliberately: one naming convention (object-action works well) applied consistently, useful properties that enable the segmentation you need without dumping everything or leaking PII, and a tracking plan so events are defined on purpose rather than invented ad hoc. The difference between analysable data and an untrustworthy mess is mostly this consistency. It is unglamorous and it is what makes every other analytics question answerable, fragmented events produce confident wrong answers.

## Connection to other references
Clean events serve the right metrics (measuring-the-right-things.md) and make funnels (funnels-and-dropoff.md) and retention (activation-and-retention.md) computable. PII minimisation in properties and identity handling defer to `data-privacy` (privacy-respecting-analytics.md). Data trustworthiness connects to acting-on-data.md.
