# Debugging Anti-Patterns

Each entry is a way debugging reliably goes wrong, why it's seductive, and the correction. When you catch yourself doing one, stop and switch to the correction; don't push through.

## Shotgun debugging

**The pattern:** Changing several things at once, hoping the symptom clears, without a theory for any of them.
**Why it's tempting:** It feels like progress and faster than thinking. Under pressure, doing something beats understanding something.
**Why it fails:** If the bug clears you don't know which change did it, so you can't trust the fix or remove the dead changes. You've likely introduced new bugs, and you've learned nothing transferable. Worst case, two of your changes cancel out and the bug returns later.
**Correction:** One variable per experiment. Predict the result, run it, keep or revert based on the outcome. Slower per step, far faster to resolution.

## Symptom-patching

**The pattern:** Making the error stop without finding why it happened. The classic forms: a null check that swallows the real question, a `try/catch` that hides the throw, a default value that masks missing data, a retry that paves over a race.
**Why it's tempting:** The symptom is what got reported, and making it vanish looks like success.
**Why it fails:** The cause is still there. It resurfaces as a different symptom, often somewhere unrelated and harder to trace back. The null check that hid a data-integrity bug means corrupt data keeps spreading silently.
**Correction:** Ask "why" up the chain until you reach a cause you can fix at its level. A guard at the symptom can be correct, but only as a deliberate decision after you understand what produced the bad state, never as a reflex to silence the error.

## Silencing the error

**The pattern:** Wrapping failing code in an empty catch / `except: pass`, lowering a log level, or deleting the assertion that's "being annoying."
**Why it's tempting:** The error stops appearing.
**Why it fails:** You've blinded yourself to the failure, which continues, now invisible. The next person (or you, next month) gets a senseless downstream symptom with the original evidence destroyed.
**Correction:** An error you don't understand is information, not noise. Read it (see `reading-errors.md`), don't muzzle it. If something legitimately should be caught, catch that specific case and handle it deliberately, never a bare catch-all that eats everything.

## Trusting an unverified assumption

**The pattern:** Building your whole investigation on "the input is obviously valid" or "this function clearly works" without ever checking.
**Why it's tempting:** Verifying things you're sure about feels like wasted effort.
**Why it fails:** The bug is almost always inside the thing you didn't check, because you stopped looking there. Hours vanish into the 5% you suspect while the cause sits in the 95% you exonerated by assumption.
**Correction:** Make assumptions explicit and verify each with a direct probe. Start with the one you're most confident about.

## Blaming the platform first

**The pattern:** Concluding early that it's a bug in the language, framework, library, compiler, or hardware.
**Why it's tempting:** It's not your fault, and it excuses you from finding your own mistake.
**Why it fails:** It's almost never true. Mature tools have been exercised by millions; your three-day-old code has been exercised by you. Assuming the platform is broken stops you finding your actual bug.
**Correction:** Suspect your own code and your own use of the tool first. Verify your inputs to the boundary and its outputs back. Consider a genuine platform bug only after your code is cleared, and then confirm it against the tool's issue tracker before believing it.

## Debugging the wrong thing

**The pattern:** Carefully debugging code that isn't the code that ran: wrong branch, stale build, cached bundle, wrong environment, a duplicate file, a process from before your edit.
**Why it's tempting:** You assume the obvious: that what you edited is what executed.
**Why it fails:** Every observation is meaningless because you're not looking at the running system. This produces the most baffling, time-wasting sessions because nothing behaves as the code says it should.
**Correction:** Confirm you're running your code before reasoning about it. Drop an unmistakable marker and check it appears. Confirm the branch, build, environment, and process. Do this early when anything seems impossible.

## Probing without a hypothesis

**The pattern:** Adding logs and breakpoints everywhere and scanning the output hoping something jumps out.
**Why it's tempting:** More visibility feels like it must help, and placing a probe is easier than deciding what to ask.
**Why it fails:** Undirected output buries the signal and fills your attention with noise. You end up with pages of logs and no narrower search space.
**Correction:** Each probe tests one specific question and is placed to split the remaining search space in half. "Is this value null at this point?" not "let's see everything." Binary search, not floodlight.

## Re-testing dead hypotheses

**The pattern:** Without notes, you cycle back and re-check something you already eliminated an hour ago.
**Why it's tempting:** Memory blurs under fatigue and the dead idea still looks plausible.
**Why it fails:** You burn time confirming the same negative repeatedly and never advance the frontier.
**Correction:** Keep a running list of ruled-out hypotheses and what each experiment showed. The list is the difference between a search that converges and one that circles.

## Declaring victory without verifying the cause

**The pattern:** The symptom went away after a change, so it's fixed. Close the ticket.
**Why it's tempting:** Absence of symptom looks like presence of fix.
**Why it fails:** Coincidence, timing shifts, and masked symptoms all make a bug "disappear" without being fixed. If you can't explain *why* the change worked, you don't know that it did.
**Correction:** Before closing, confirm you can explain the mechanism, re-run the exact original reproduction, and ideally toggle the fix to show the bug returns and clears on demand. Keep the reproduction as a regression test.
