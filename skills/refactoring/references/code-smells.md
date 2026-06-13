# Code Smells: Recognising What to Refactor

Code communicates its structural problems through recognisable signs. A "smell" is a surface symptom that something underneath is wrong, not a certainty, a prompt to look. Smells are how you find what to refactor rather than guessing, and most point fairly directly at the refactoring that resolves them. The skill is recognising the sign, understanding what it indicates, and knowing it's a prompt to investigate, not an automatic command to change.

## Smells are prompts, not rules

Before the catalogue, the meta-point: a smell means "this is worth a look," not "this must be changed." Some smells are fine in context (a little duplication that isn't really the same thing, a longish function that's genuinely one coherent sequence). Treat each as a question, is this actually causing a problem here?, and refactor when the answer is yes. Mechanically eliminating every smell produces its own messes (notably over-abstraction from chasing every duplicate). Judgement applies.

## Duplication

The most important smell. The same logic, or the same knowledge, expressed in more than one place.

- **What it indicates:** a missing abstraction. The duplicated thing wants to exist once, in one place, with the copies referring to it. When it's duplicated, a change to the logic must be made in every copy, and the copies drift when one is updated and others aren't (the same drift problem as duplicated state and data).
- **What it calls for:** extract the common logic into one named thing (a function, a shared module) and replace the copies with references to it. But first confirm it's *genuine* duplication, the same knowledge, not two things that happen to look alike right now and will need to change independently. Unifying coincidental duplication couples things that should stay separate (see the wrong-abstraction warning in `anti-patterns.md`).

## Things that are too big

- **Long functions:** a function doing many things, spanning many lines, holding several levels of detail at once. Indicates multiple responsibilities crammed together. Calls for extracting the distinct pieces into well-named functions, so the original reads as a sequence of intentions and the details live in the extracted parts.
- **Large modules/classes:** a unit that's accumulated too many responsibilities, knows about too much, changes for too many different reasons. Indicates a missing split. Calls for separating the distinct responsibilities into focused units.
- **Long parameter lists:** a function taking many parameters. Indicates either too many responsibilities or a missing grouping. Calls for grouping related parameters into an object, or reconsidering whether the function does too much (this connects to interface design's parameter guidance).

The underlying principle: a unit (function, module) should have one clear responsibility and be comprehensible as a whole. When it's too big to hold in your head, that's the smell.

## Names that mislead or obscure

- **Unclear names:** `data`, `temp`, `doStuff`, `manager`, names that don't say what the thing is or does. Indicate that the author hadn't named the concept clearly, which usually means the concept isn't clear. Calls for renaming to state intent (and sometimes reveals that the thing has no clear single meaning, a deeper smell).
- **Names that lie:** a name describing what the code used to do, or what it does incidentally, rather than what it does now. Actively dangerous, readers trust names. Calls for renaming to the truth.
- Naming is the cheapest, highest-value refactoring. A good name removes the need for a comment and makes the code self-explaining. When you struggle to name something well, that difficulty is itself a smell, usually that the thing does more than one thing.

## Tangled and convoluted logic

- **Deep nesting:** many levels of conditionals/loops nested inside each other, indicating logic that's hard to follow and probably doing too much per level. Calls for flattening (early returns, extracting nested blocks into functions, guard clauses).
- **Complex conditionals:** sprawling boolean expressions and long if/else chains whose meaning is opaque. Calls for naming the conditions (extract the condition into a well-named variable or function) and often for replacing a type-switch chain with a cleaner structure.
- **Flag arguments and mode switches:** a parameter that makes a function behave in two different ways, indicating it's really two functions (connects to the boolean-trap in interface design). Calls for splitting into separate functions.

## Change that ripples too far

- **Shotgun surgery:** one logical change requires edits in many scattered places. Indicates that a single concept is smeared across the codebase instead of living in one place. Calls for gathering the scattered pieces into one unit so the change has one home.
- **The opposite, divergent change:** one unit has to be edited for many unrelated reasons. Indicates too many responsibilities in one place. Calls for splitting them apart.
- Both are about *locality of change*: a good structure means a given change touches one place; these smells mean it touches the wrong number of places (too many scattered, or one overloaded).

## Coupling and leak smells

- **Feature envy:** a function that's more interested in another unit's data than its own, constantly reaching into something else. Indicates it's in the wrong place. Calls for moving it to where the data it uses lives.
- **Inappropriate intimacy:** two units that know too much about each other's internals, so they can't change independently. Indicates a leaky boundary (connects to information-hiding in interface design). Calls for tightening the boundary, exposing operations instead of internals.
- **Leaky abstraction:** internals showing through an interface (covered in interface design). Calls for hiding what shouldn't be exposed.

## Dead and speculative code

- **Dead code:** code that's never reached or never used. Indicates leftover from past changes. Calls for deletion, dead code is pure cost (it's read, maintained, and trusted, for no benefit). Version control remembers it if you ever need it back.
- **Speculative generality:** abstraction, configuration, or extension points built for needs that never materialised. Indicates over-engineering for an imagined future (connects to the same anti-pattern in interface design). Calls for removing the unused flexibility, it's complexity with no payoff.

## Comments compensating for bad code

- **Comments that explain *what* confusing code does** (rather than *why* a non-obvious decision was made) are often a smell: the code should explain itself, and the comment is patching its failure to. Indicates code that should be clearer. Calls for refactoring the code (better names, extracted functions) until the explanatory comment is unnecessary. Comments explaining *why* (a non-obvious reason, a constraint, a deliberate trade) are valuable and stay; comments explaining *what* are often a refactor waiting to happen.

## Using smells well

Smells are a vocabulary for noticing, not a checklist to enforce. The workflow: notice a smell, ask whether it's actually causing a problem here (hard to understand, hard to change, breeding bugs), and if so, apply the refactoring it points to, under the full discipline (safety net, small steps). The smell tells you *where* to look and often *what* to do; the rest of the skill is *how* to do it safely.
