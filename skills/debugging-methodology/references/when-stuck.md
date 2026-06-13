# When Stuck

You've looped a few times and aren't converging. Being stuck almost always means one of three things: a false assumption you're holding as fact, the bug isn't where you think it is, or you're not actually observing what you believe you're observing. The moves below are ordered to surface those fast.

## Check you're debugging reality

Before anything clever, rule out the embarrassing-but-common causes of a bug that "makes no sense":

- **Are you running the code you're editing?** Stale build, uncompiled change, cached bundle, hot-reload that didn't reload, a running process from before your edit, editing the wrong file or a duplicate. Add a deliberate, unmistakable marker (a log line that says `XXXX HERE`) and confirm it appears. If it doesn't, you've found the problem: you weren't running your code.
- **Are you in the right environment?** Right branch, right deploy, right database, right config, right service. Pointing at staging while reading prod code produces pure nonsense.
- **Did it ever work?** "It used to work" is a testable claim. `git bisect` (or equivalent) the history to find the commit that introduced it. This converts an open-ended hunt into a binary search over time and is often the single fastest move when a regression is involved.

## Attack your assumptions

The bug is hiding inside something you're sure is correct, because you've stopped looking there. Make the implicit explicit:

- List what you're *assuming* is true: "the input is valid," "this function returns what I think," "this is called once," "this runs before that." Then verify each one directly with a probe rather than belief. The one you're most confident about is the prime suspect precisely because you haven't checked it.
- Question the boundary you trust most. People audit their own code and exonerate the library, the framework, the database, the platform. Usually the bug is in your code's *use* of those, not in them, but the only way to know is to verify your inputs to them and their outputs back, at the boundary.

## Widen and re-bisect

- If bisection isn't narrowing, your known-good and known-bad points may both be wrong. Move them further apart until you have a genuinely good point and a genuinely bad point, then bisect again.
- Check upstream of where you've been looking. If the value is already wrong by the time it reaches your suspected area, the cause is earlier. Walk the data back to its origin.

## Change your input to the problem

- **Rubber-duck it.** Explain the bug out loud, line by line, to someone or something that knows nothing. The act of stating each step forces you to justify the assumption you've been skating over, and that's usually where it breaks. This works embarrassingly often; do it before more exotic measures.
- **Write it down.** List what you've ruled out and what each experiment showed. Stuck debugging frequently involves silently re-testing a hypothesis you already killed two hours ago. The written record stops the loop.
- **Make the failing case smaller.** If the reproduction still has moving parts, keep deleting until it's the absolute minimum. Often the bug becomes obvious once the surrounding noise is gone, because the minimal case removes the thing you were wrongly blaming.

## Step away deliberately

If you've been heads-down long enough that you're re-reading the same lines, stop. Fatigue narrows attention onto the wrong spot and keeps it there. A break is a debugging technique, not a surrender; the solution arriving in the shower is your loosened attention finally considering the assumption you'd locked out. This is a real move, not a platitude, and it beats the eleventh unguided re-read.

## If it's genuinely beyond the code

- Consider the layer below: a real library bug, a platform quirk, a compiler/runtime issue, hardware, a corrupted dependency. This is last, not first, because it's rare and assuming it early stops you finding your own bug. But it does happen. Search the exact error against the library's issue tracker; if others hit it, you'll find it fast.
- Consider that two bugs are interacting and presenting as one confusing symptom. If the behaviour is internally contradictory, you may be looking at two causes. Separate them: find a reproduction for each independently.
