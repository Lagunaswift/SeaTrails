---
name: debugging-methodology
description: "Use this skill whenever investigating, diagnosing, or fixing a bug, defect, crash, regression, performance problem, flaky test, or any behaviour that differs from what was expected, in any language or stack. Trigger on phrases like 'this is broken', 'why is this happening', 'it works locally but not in prod', 'this used to work', 'intermittent', 'sometimes it fails', 'I can't figure out why', 'help me debug', 'track down', 'root cause', 'this error', or any time a stack trace, error message, or unexpected output is pasted. Also trigger proactively whenever about to fix reported broken behaviour, BEFORE writing a fix, to enforce reproduce-first discipline and prevent symptom-patching. Applies to logic bugs, crashes, race conditions, integration failures, data corruption, UI defects, and 'mystery' behaviour with no obvious cause."
---

# Debugging Methodology

A stack-agnostic method for finding and fixing the actual cause of a defect, instead of guessing at fixes or burning time reading code with no hypothesis.

This skill exists to counter two opposite failure modes, both of which waste time and both of which produce fixes that don't hold:

1. **Patching before understanding.** Changing code to make the symptom disappear before the cause is known. The symptom moves or returns later, often disguised.
2. **Unguided spelunking.** Reading code, adding logging everywhere, and trying changes without a hypothesis being tested. Hours pass, context fills, nothing converges.

The discipline below replaces both with a loop: reproduce, locate, hypothesise, test one thing, confirm cause, fix, verify the fix actually addresses the cause.

## The cardinal rule

**Do not write a fix until you can reproduce the bug and can name its cause.** A change that makes the symptom go away is not a fix unless you can explain *why* it was happening. If you can't explain the mechanism, you've moved the bug, not killed it. When tempted to skip ahead to a fix, stop and ask: "Can I reproduce this on demand, and can I state the cause in one sentence?" If no to either, you're not ready.

The only exception is an active production incident where stopping the bleeding takes priority over understanding (see `references/production-incidents.md`). Even then, the mitigation and the root-cause fix are separate steps, and the second is not optional.

## The loop

Work these phases in order. Most bugs are solved without reaching the end. Don't skip a phase to feel faster, skipping is what makes debugging slow.

### 1. Reproduce

You cannot fix what you cannot trigger. Before anything else, get the bug to happen reliably.

- Nail down the exact inputs, state, and steps that produce it. Vague reports ("it's slow sometimes") are not reproductions, they're rumours.
- Find the **minimal** reproduction. Strip away everything that isn't required to trigger it. Each thing you remove that doesn't stop the bug is a thing eliminated as the cause.
- If it only happens sometimes, the variable is something you're not controlling yet: timing, ordering, concurrency, external state, data shape, cache, clock, randomness. Reproducing intermittent bugs is its own discipline, see `references/intermittent-and-heisenbugs.md`.
- Record the reproduction so you can re-run it after the fix. A failing test that captures the bug is the ideal form, it doubles as the regression guard.

If you genuinely cannot reproduce it, that is itself the current task. Do not move to "locate" by reading code hopefully. Gather more data: logs, the exact environment, the specific user/record, a recording. See `references/cant-reproduce.md`.

### 2. Locate

Narrow down *where* the cause lives before reasoning about *why*. The goal is to shrink the search space from "the whole system" to a few lines.

- **Binary-search the failure.** Find a point where state is known-good and a point where it's known-bad, then bisect. This applies to data flowing through a pipeline (where does the value first go wrong?), to a call stack (which layer corrupts it?), and to history (`git bisect` when "it used to work").
- **Verify your assumptions, don't trust them.** The bug is almost always in something you're certain is fine. Confirm the input is what you think, the function is being called, the branch is taken, the value is what you assume. Most stuck debugging is built on one false belief held as fact.
- **Read the error properly.** The full stack trace, the actual exception type, the real message. Read it top to bottom. The first line people skip is often the answer. See `references/reading-errors.md`.
- **Instrument to observe, not to guess.** Add logging or breakpoints to *test a specific question* ("is this value null here?"), not to scatter output and hope something jumps out. Each probe should be placed to split the remaining search space.

### 3. Hypothesise and test one variable

Once the search space is small, form a specific, falsifiable hypothesis and test it in isolation.

- State it concretely: "The list is empty because the fetch resolves after the render reads it." Not "something's wrong with the async stuff."
- **Change one thing at a time.** If you change three things and the bug goes away, you've learned nothing about which mattered, and you may have introduced two new problems. One variable per experiment.
- Predict the result before you run it. "If this hypothesis is right, the log will show X." A surprise means the hypothesis is wrong, which is progress, not failure. Kill it and form the next one.
- Keep a short record of what you've ruled out. Stuck debugging often involves re-testing the same dead hypothesis because nobody wrote down that it was already eliminated.

### 4. Confirm the cause

Before fixing, prove the mechanism. You should be able to say: "The bug happens because X, which is why we see symptom Y, and here is the evidence." If you can make the bug appear and disappear on demand by toggling the suspected cause, you've confirmed it. A fix applied without this step is a guess wearing a fix's clothing.

### 5. Fix at the right level

Fix the cause, not the symptom, and at the right layer.

- Ask "why" up the chain. The null check that stops the crash may be hiding the real question: why was it null? A defensive guard at the symptom can be correct, or it can paper over a data-integrity bug three layers up. Decide deliberately, don't default to the nearest patch.
- Consider whether the same cause produces other latent bugs. One root cause often has several symptoms, only one of which got reported.
- Keep the fix minimal and reversible. Resist refactoring the surrounding code in the same change, it muddies the signal if the fix turns out wrong.

### 6. Verify

- Re-run the original reproduction. The exact one from phase 1. Confirm it now passes.
- Run the surrounding tests to check you didn't break a neighbour.
- Keep the reproduction as a regression test where practical, so this exact bug can't return silently.
- If you mitigated a production incident earlier with a stopgap, the real fix replaces it now, and you remove the stopgap deliberately.

## When stuck

If you've looped without converging, the problem is usually a false assumption from phase 2, or the bug isn't where you think. See `references/when-stuck.md` for specific unsticking moves: rubber-ducking, widening the bisection bounds, questioning the framework/library/platform last (not first), checking whether you're even debugging the right process/build/environment, and the "what changed?" audit.

## Anti-patterns

These are the recurring ways debugging goes wrong. Each is covered with the correction in `references/anti-patterns.md`:

- Shotgun debugging (changing many things at once hoping one works)
- Fixing the symptom and declaring victory without finding the cause
- Trusting an assumption you never verified
- Blaming the language, framework, or library before your own code
- Adding `try/catch` or a null guard to silence an error instead of understanding it
- Debugging the wrong environment, build, branch, or process
- Not reading the full error message
- Continuing to add probes with no hypothesis behind each one
- Re-testing already-eliminated hypotheses because nothing was written down

## Language and platform specifics

The core loop is universal. Tooling and common failure shapes are language-specific. Read the relevant file when the bug is in that environment:

- `references/javascript-typescript.md`: async/await timing, promise rejection, `this` binding, type coercion, Node vs browser, source maps, React render/effect timing, SSE/streaming
- `references/python.md`: tracebacks, mutable default args, import/scope issues, environment and venv mismatches, `pdb`, async pitfalls
- `references/web-frontend.md`: network tab, DOM/state desync, hydration mismatches, CORS, caching, the "works in dev not prod" build gap
- `references/data-and-state.md`: corrupted/unexpected data, schema mismatches, race conditions on shared state, ordering and idempotency

## Reference index

- `references/reading-errors.md`: how to extract everything an error/stack trace is telling you
- `references/intermittent-and-heisenbugs.md`: reproducing flaky and timing-dependent bugs
- `references/cant-reproduce.md`: what to do when you can't trigger it
- `references/when-stuck.md`: unsticking moves when the loop isn't converging
- `references/production-incidents.md`: mitigate-first protocol and the mitigation/root-cause split
- `references/anti-patterns.md`: the failure modes above, each with its correction
- Language/platform files as listed above
