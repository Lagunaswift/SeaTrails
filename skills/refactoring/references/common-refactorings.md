# Common Refactorings

Most refactoring is the application of known, named transformations, each with a safe procedure that preserves behaviour when followed carefully. Knowing the common ones turns refactoring from risky freehand editing into applying a move you know is safe. These are language-independent in concept; the mechanics are nearly identical everywhere, and where a tool can perform one, the tool is safer than doing it by hand because it changes all the references mechanically without the human error of missing one.

## Prefer the tool

Before the catalogue: many of these are built into editors and IDEs as automated refactorings (rename, extract, inline, move). An automated refactoring performs the transformation across every reference at once, mechanically, which removes the single biggest source of refactoring bugs, the missed reference. When the tool can do it, use the tool, then verify. Hand-perform only what the tool can't, and with extra care.

## Rename

The highest-value, most-frequent refactoring: give something a name that states what it is or does (see `code-smells.md` on naming).

- **Procedure:** change the name at its definition and at every reference, all in one step, then verify. The danger is missing a reference, which is exactly why the automated rename (which finds them all) is far safer than search-and-replace (which catches false matches and misses dynamic ones).
- A type system makes this nearly free and safe: a missed reference won't compile. In untyped code, the missed reference is a silent bug, so the tool matters more.

## Extract function (and its inverse, inline)

**Extract** pulls a piece of a larger function into its own named function, the primary tool against long functions and duplication.

- **Procedure:** identify the block to extract; determine its inputs (the variables it reads from the surrounding scope, which become parameters) and its outputs (the variables it produces that the caller needs, which become return values); create the new function with those parameters and returns; replace the original block with a call to it; verify. Done carefully, behaviour is identical because you've only moved code, not changed what it computes.
- The careful part is the inputs and outputs: get the parameters and returns exactly right, or you change behaviour (a variable that should have been passed in but was captured, an output that wasn't returned). This is where a moment's care preserves behaviour and haste breaks it.

**Inline** is the inverse: replace a call to a function with the function's body, used when a function's indirection isn't earning its keep. Procedure: substitute the body for the call, adjusting names, then verify. Useful for undoing an extraction that didn't help, or collapsing a needless layer.

## Extract variable (and inline)

**Extract variable** names a sub-expression, especially to make a complex conditional readable (see `code-smells.md`).

- **Procedure:** assign the sub-expression to a well-named variable, replace the original occurrence with the variable, verify. A sprawling boolean becomes a named condition; a repeated sub-expression becomes a single named value. Behaviour is preserved as long as the expression has no side effects that the extraction would reorder (be careful extracting expressions that mutate or depend on order).

## Move

**Move** relocates a function, field, or piece of logic to where it belongs, the fix for feature envy and misplaced responsibility (see `code-smells.md`).

- **Procedure:** move the thing to its new home; update all references to its new location; verify. As with rename, the risk is references, and the tool that updates them all is safer than manual moving. Moving a function closer to the data it uses, or a piece of logic into the unit responsible for it, improves locality without changing what runs.

## Replace tangled conditionals with clearer structure

Several refactorings target convoluted conditional logic (see `code-smells.md` on tangled logic):

- **Guard clauses / early return:** replace deep nesting with early returns for the exceptional cases, leaving the main path un-nested. Procedure: invert a condition and return early for it, de-nesting the rest; verify each inversion preserves the logic (this is where off-by-one in the logic creeps in, so go carefully and lean on tests).
- **Decompose a conditional:** extract the condition, the then-branch, and the else-branch into named functions, so the structure reads as intent. Procedure: extract each piece (using extract function), verify.
- **Replace a type-switching chain:** a long if/else or switch on a type code, repeated in several places, can often be replaced by a structure where each type knows its own behaviour (polymorphism, a lookup table, a strategy). This is a larger refactoring, done in small steps via parallel change (see `small-steps.md`), and it removes the shotgun-surgery smell where adding a type means editing every switch.

## Introduce parameter object

When a function has a long parameter list, or the same cluster of parameters travels together through many functions, group them into one object (connects to interface design's parameter guidance and the long-parameter-list smell).

- **Procedure:** create the object type holding the cluster; change the function to take the object; update callers to pass it; verify. For a widely-used signature, do this as a parallel change (add an overload or new function taking the object, migrate callers, remove the old). The grouped parameters also become extensible additively later (a benefit shared with interface design).

## Split (and its inverse, combine)

**Split** divides a unit with too many responsibilities into focused units (the fix for large modules/classes and divergent change, see `code-smells.md`).

- **Procedure:** identify the distinct responsibility to separate; move its data and the functions that operate on it into a new unit (using move); update references; verify. This is a larger, higher-blast-radius refactoring, see `structural-refactoring.md` for module-level splits and the care they need. Do it in small steps via parallel change.

**Combine** is the inverse, merging units that were split too finely or that always change together. Procedure: move the members of one into the other, update references, remove the empty unit, verify.

## Remove dead code and speculative generality

The simplest refactoring: delete what isn't used (see `code-smells.md`).

- **Procedure:** confirm it's genuinely unused (no references, no dynamic/reflective use, no external callers if it's a public interface, this last check matters, see `structural-refactoring.md` and interface design), then delete it; verify. Confirming "genuinely unused" is the careful part: a type system and a reference search make it reliable for internal code; for anything with external callers, "unused" is much harder to establish and removal becomes a breaking change, not a refactor.

## The common thread

Each transformation has a procedure whose careful execution preserves behaviour, and a specific spot where carelessness breaks it (the inputs/outputs of an extraction, the references of a rename or move, the logic of a conditional inversion, the "genuinely unused" of a deletion). Knowing the procedure tells you where the care goes. Combined with the safety net (verify after each, see `safety-net.md`) and small steps (one transformation at a time, see `small-steps.md`), each refactoring becomes a known-safe move rather than a freehand edit, which is the difference between refactoring and just changing code and hoping.
