# Production Incidents

A live production incident inverts the normal priority. When users are actively affected, stopping the harm comes before understanding the cause. This is the one sanctioned exception to "no fix before you understand it," and it comes with a strict condition: mitigation and root-cause are two separate steps, and the second is not optional once the fire is out.

## Triage first: how bad, how fast

Before acting, size it:

- **Blast radius.** All users or some? Data being corrupted, or just an error shown? Money moving wrongly? Data being lost or leaked? A cosmetic bug in prod is not an incident and does not earn the exception, debug it normally.
- **Trajectory.** Stable-bad, or getting worse each minute? A growing data-corruption or a leak escalates the urgency of mitigation over understanding.
- **Reversibility.** Is the damage accumulating and permanent (lost/corrupted data, sent emails, charged cards), or transient (errors that stop once fixed)? Permanent, accumulating damage is the strongest case for immediate mitigation.

## Mitigate to stop the bleeding

The goal is to make the harm stop, by the fastest safe means, even if it's ugly:

- **Roll back.** If the incident started after a deploy, reverting to the last known-good version is usually the fastest and safest mitigation. "What changed?" is answered by the deploy log. Roll back first, diagnose the bad version offline.
- **Disable the feature.** Feature flag off, route disabled, job paused. Cut the specific capability that's causing harm rather than the whole system if you can.
- **Cut off the damage source.** Stop the runaway job, block the abusive input, pause the queue, take the corrupting writer offline. Protect data integrity above availability when those conflict and data loss is on the table.
- **Degrade gracefully.** Serve a cached or read-only version, show a maintenance state, fail closed on the affected path while the rest runs.

Record what you changed and when, in real time. You will need it to undo the stopgap and to write the post-incident account.

## The stopgap is not the fix

A rollback, a flag flip, or a disabled route stops the harm; it does not explain the bug. After the incident is contained and users are safe, the bug still exists in the rolled-back code or behind the flag. Now run the full normal loop against it, offline, without time pressure: reproduce, locate, hypothesise, confirm cause, fix properly, verify. Only then re-enable the feature or re-deploy.

Skipping this is how the same incident recurs next week. The pressure is gone once the fire is out, which is exactly why the discipline has to be deliberate: nobody is forcing you to finish, so you have to.

## Preserve evidence before it's gone

Mitigation can destroy the evidence you'll need to find the cause. Before you roll back or restart:

- Capture logs, metrics, and traces from the failure window; restarts and rollbacks often rotate or clear them.
- Snapshot the corrupted data or bad state if feasible, so you can reproduce against it later. A restart that "fixes" it also erases your reproduction.
- Note the exact timestamps so you can correlate across systems afterward.

## After: the honest account

Once fixed properly, write down what happened, what the cause was, how it was mitigated, how it was fixed, and what would have caught it earlier (a test, an alert, a guard). This isn't ceremony; the "what would have caught it" item is how the class of bug stops recurring. Keep it blameless and factual. The output is a prevention, not a culprit.
