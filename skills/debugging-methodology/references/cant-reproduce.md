# When You Can't Reproduce It

Not being able to reproduce a bug is a distinct task with its own moves. It is not a licence to start reading code hopefully and patching where it looks suspicious. Until you can trigger it, you have no way to confirm a fix, so a fix written now is a pure guess. Treat "make it reproducible" as the current objective.

## First, question whether it's real and still happening

- Is the report describing current behaviour, or something already fixed? Confirm the version/build the reporter saw against what's running now.
- Is it actually a bug, or expected behaviour the reporter misunderstood? Restate what *should* happen and check that's agreed.
- Did it happen once, or does it recur? A one-time event during a deploy, a network blip, or a since-deleted bad record may not be reproducible because the cause no longer exists.

## Close the gap between your environment and theirs

Most "can't reproduce" cases are an environment difference. Enumerate what differs and eliminate each:

- **Data.** You're testing with clean data; the bug needs their specific record. Get the actual id, the actual row, the actual file. Reproduce against a copy of real (sanitised) data, not a fixture.
- **State and account.** Their user, their permissions, their feature flags, their tenant, their accumulated history. A bug that only hits accounts created before a migration won't show on a fresh signup.
- **Build and version.** Prod vs dev build, minification, different dependency versions, a different runtime version. "Works locally, breaks in prod" is nearly always a build or environment delta, see `web-frontend.md`.
- **Timing and scale.** Their slow network, their large dataset, their concurrent load. Throttle the network, inflate the dataset, add latency.
- **Client.** Their browser, OS, device, locale, timezone, screen size, extensions.

## Get more data from the failure you can't see

If you can't trigger it, instrument the place it happens so the *next* occurrence tells you everything:

- Add targeted logging around the suspected area that captures inputs, key state, and the branch taken, then wait for it to recur. Log the values you'd want if you were standing there when it failed.
- Add an error report/breadcrumb trail so the next failure ships you the stack, the inputs, and recent user actions.
- If there's an error-tracking system, mine it: how often, which users, which version, what's common across occurrences. The shared property across failures is the hidden variable.
- Ask the reporter for the exact sequence, a recording, a screenshot of the error, the timestamp (so you can find it in logs), and what they did immediately before.

## Reproduce by reasoning when you truly can't trigger it

Sometimes you genuinely cannot reproduce (rare hardware, a customer you can't access, a transient condition). Then:

- Read the code path with the reported symptom as the constraint and ask "what inputs or states would make this exact symptom occur?" Work backwards from the symptom to the conditions that force it.
- Form the hypothesis, then *construct* a reproduction from it: if the theory is "this breaks when the array is empty," feed it an empty array and confirm the symptom. You've now reproduced it via theory, which is as good as catching it in the wild.
- If a fix must ship without a confirmed reproduction, say so explicitly, make the smallest defensible change tied to the strongest hypothesis, add logging so you'll know if it recurs, and treat it as provisional rather than closed.

## Don't

- Don't fix where the code "looks wrong" if it's unrelated to the symptom. You'll add a change, the bug will recur, and now you have two unknowns.
- Don't close it as "can't reproduce" without leaving instrumentation behind. If it recurs, you want the next occurrence to be the last mystery, not a repeat of this one.
