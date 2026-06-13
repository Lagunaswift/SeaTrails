# Refactoring Anti-Patterns

Each entry is a recurring way refactoring goes wrong, why it's tempting, why it bites, and the correction. When you catch yourself doing one, stop and switch.

## Changing behaviour while "just refactoring"

**The pattern:** A refactor that also changes what the code does, a "cleanup" that fixes a bug along the way, a "rename" that also tweaks the logic, a restructuring that improves behaviour while reshaping.
**Why it's tempting:** You're already in the code, the behaviour change is right there, and doing both at once feels efficient.
**Why it bites:** When something breaks, you can't tell whether the structural change or the behavioural change caused it, because you made both. The refactor's core guarantee, behaviour is preserved, is voided, so a green-to-red can't be attributed and the investigation that should be trivial becomes a tangle.
**Correction:** Never change structure and behaviour in one step (the cardinal rule). Do them as separate, separately-verified steps, refactor first, verify, then change behaviour, verify, or the reverse. Keep them in separate commits so the history stays clean. See `when-to-refactor.md`.

## Refactoring with no safety net

**The pattern:** Restructuring code with no test, no check, nothing that would catch a behaviour change, trusting that it looks equivalent.
**Why it's tempting:** Reading the code and seeing that it "obviously does the same thing" feels like enough, and writing tests first is more work than the refactor.
**Why it bites:** "It looks the same" is exactly the unreliable judgement refactoring exists to replace, human reading misses the edge cases (empty, null, boundary, error path) where the behaviour change actually hides. You ship a silent behaviour change you never intended and don't discover it until it causes a bug.
**Correction:** Establish a net before changing anything. Use existing tests (confirm they cover what you're touching), or write characterisation tests that pin current behaviour, or for untestable code make the smallest safe seam to get a test in. Verification, not belief. See `safety-net.md`.

## Big-bang refactoring

**The pattern:** A large restructuring done all at once, with no verification until the end.
**Why it's tempting:** It feels faster to just do the whole thing than to break it into fiddly small steps, and the end state is clear in your head.
**Why it bites:** If behaviour broke somewhere in the large change, you've turned a refactor into a debugging hunt, something in a big diff is wrong and you must find it. The code is broken throughout the middle, so an interruption strands you with non-working code, and reverting means losing all of it.
**Correction:** Small steps, each one keeping the code working, verified after each, committed at green. For changes too big for one step, use parallel change (expand/migrate/contract) so a large restructure is a sequence of small working steps. See `small-steps.md`.

## Refactoring code that didn't need it

**The pattern:** Restructuring working code that's out of your way and not causing bugs, because it offends your taste or because "cleaner is better."
**Why it's tempting:** The code looks wrong to you, and improving it feels productive and virtuous.
**Why it bites:** Every refactor costs time and adds risk to working code, for no benefit when the code wasn't an obstacle or a bug source. You've spent effort and introduced risk to satisfy an aesthetic preference, and possibly broken something that was fine.
**Correction:** Refactor for a reason, to understand or change code that's in your way, or to remove a structure causing bugs. "I'd have written it differently" is not a reason. Working code that's not your obstacle and not buggy can be left alone. See `when-to-refactor.md`.

## Mixing the refactor into a feature or fix commit

**The pattern:** The refactoring and a feature or bug fix land together in one commit/change, structural and behavioural changes interleaved in the diff.
**Why it's tempting:** It's all one piece of work in your head, so it goes in as one commit.
**Why it bites:** The diff is unreadable (structural noise obscures the behavioural change), review is harder, and if a behaviour change is later traced to this commit, you can't tell which line, the refactor or the feature, caused it. Bisecting and reverting both become messy.
**Correction:** Separate commits, refactoring commits contain only refactoring, behaviour commits contain only behaviour. The history then cleanly separates "changed structure" from "changed behaviour," which is reviewable and bisectable. See `small-steps.md`.

## Over-abstracting to remove duplication

**The pattern:** Mechanically unifying every piece of duplicated-looking code into a shared abstraction, including code that's only coincidentally similar.
**Why it's tempting:** Duplication is a smell and removing it feels correct, so all duplication looks like it should be eliminated.
**Why it bites:** Coincidental duplication, code that looks alike now but represents different things that will change independently, gets coupled by the shared abstraction, so a change needed for one forces a change to the other or a tangle of parameters and conditionals to keep them apart. The wrong abstraction is often more costly than the duplication it replaced.
**Correction:** Unify only *genuine* duplication, the same knowledge expressed twice, that will change together. When two things merely look similar but are conceptually distinct, leave them separate, even duplicated. Prefer waiting until you've seen the duplication a few times and confirmed it's the same thing before abstracting. See `code-smells.md`.

## Renaming or moving without updating all references

**The pattern:** Renaming or relocating something and missing some of the places that reference it.
**Why it's tempting:** Manual rename via search-and-replace, or moving by hand, feels quick.
**Why it bites:** A missed reference is a broken build at best (in typed code) or a silent bug at worst (in untyped or dynamic code), where the old name/location is still referenced and now points at nothing or the wrong thing.
**Correction:** Use the automated refactoring tool, which updates all references mechanically and can't miss one the way manual editing can. Where you must do it by hand, lean on the type system and a thorough reference search, and verify. See `common-refactorings.md` and `safety-net.md`.

## Refactoring without understanding the code

**The pattern:** Restructuring code you don't actually understand, moving things around based on surface appearance.
**Why it's tempting:** The code looks mechanical to rearrange, and understanding it fully first is slow.
**Why it bites:** You can't preserve behaviour you don't understand, you'll "simplify" away an edge case that mattered, or reorder something order-dependent, because you didn't know it was load-bearing. The net catches some of this, but you're working blind against it.
**Correction:** Understand what the code currently does before changing its shape, helped by characterisation tests (which force you to observe its actual behaviour) and by the net (which tells you when your incomplete understanding led you astray). If you can't understand it, that's a reason to go slower and pin more behaviour, not to rearrange hopefully. See `safety-net.md`.

## Leaving a refactor half-done

**The pattern:** Starting a large restructuring and not finishing, leaving both old and new structures present and partially adopted.
**Why it's tempting:** The interesting part (designing and starting the new structure) is done; finishing the migration and removing the old is tedious, and other work calls.
**Why it bites:** A half-migrated codebase has two ways of doing things, and everyone must understand both, worse than the single (if flawed) structure you started with. The leftover old structure becomes permanent debt nobody clears.
**Correction:** Scope refactors to what you can land, prefer steps each of which leaves the code coherent, and if using parallel change, finish the contract step (remove the old). Treat an unfinished migration as debt to clear, not a resting state. See `small-steps.md` and `structural-refactoring.md`.

## Chasing purity past usefulness

**The pattern:** Endless refactoring of already-good code in pursuit of an ideal of cleanliness, more abstractions, more indirection, more polish, past the point where it helps.
**Why it's tempting:** There's always a "cleaner" version imaginable, and refactoring can be more pleasant than the harder work it's avoiding.
**Why it bites:** Every refactor past "good enough to work with" adds cost and risk for no benefit, and over-abstraction and excess indirection actively make code harder to follow. Purity becomes its own mess, and the time is stolen from work that mattered.
**Correction:** The goal is code that's easy to work with, not maximally pure. When the benefit (easier to understand, easier to change, fewer bugs) has run out, stop. Recognise good-enough and move on. See `when-to-refactor.md`.
