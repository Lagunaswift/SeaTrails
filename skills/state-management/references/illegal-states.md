# Making Illegal States Unrepresentable

Structure runtime state so that contradictory and impossible combinations cannot be expressed at all, rather than relying on code to avoid producing them. This is the same principle that appears in data-modelling (for stored data) and interface design (for calls), applied here to in-memory state: if the shape of the state can't represent an illegal combination, no code path, present or future, can put the program into that combination. The bug class is designed out, not guarded against.

## The classic culprit: several booleans for one condition

The most common way runtime state admits illegal combinations is encoding one underlying condition as several independent flags. Consider tracking an async operation with three booleans:

- `isLoading`, `isError`, `isSuccess` as three independent booleans gives eight combinations, and most are nonsense: loading-and-error, success-and-error, loading-and-success, all-three-true, all-three-false. Only a few are legal. The illegal ones are not just theoretically possible, they happen, when one code path sets `isError` true but forgets to set `isLoading` false, and now the UI is told it's both loading and errored, and renders something incoherent.

The underlying truth is that the operation is in *one* of a few states: not-started, loading, succeeded (with data), or failed (with an error). It's a single condition with a handful of values, mis-encoded as several independent booleans that can contradict.

## The fix: model the condition as one explicit variant

Represent the condition as a single piece of state that can hold only the legal values, each carrying exactly the data valid for that value:

- Instead of three booleans, one status that is one of: `idle`, `loading`, `success` (carrying the data), `error` (carrying the error). Now "loading and error simultaneously" cannot be expressed, because the status is one value, not three flags. The data only exists in the `success` shape; the error only exists in the `error` shape. The illegal combinations have no representation.
- This is a tagged union / discriminated union / sum type in languages that have them, and the pattern works even in languages that don't: a single `status` field plus the rule that each status implies which other fields are present. The stronger the type system, the more the compiler enforces it; even without types, collapsing the booleans into one status variable removes the contradictions.

The win is identical to the data and interface versions: the program can no longer hold a self-contradictory belief, because the contradiction is unspeakable in the chosen shape.

## Look for the pattern everywhere state has "modes"

The multiple-boolean trap recurs anywhere state has mutually exclusive modes encoded as independent pieces:

- A selection: `hasSelection` boolean plus a `selectedItem` that might be null lets "has selection but item is null" and "no selection but item is set" both exist. Model it as one nullable `selection` (present or absent), and "has selection" is derived from it, not a separate flag that can disagree (this also connects to `derived-state.md`, the boolean was a stored-derived value *and* an illegal-state enabler).
- A form: separate `isSubmitting`, `isSubmitted`, `hasError` flags that can combine illegally, versus one `submissionStatus` with legal values.
- A connection: `isConnecting`, `isConnected`, `isDisconnected` versus one `connectionState`.
- A wizard: a `currentStep` number plus per-step booleans that can disagree with the step, versus one state that is the current step.

The tell is several pieces of state that are *supposed* to relate in constrained ways but are structurally independent. Whenever you find that, the constraint lives only in code (and will be violated), and the fix is a shape that builds the constraint in.

## Tie the data to the state it belongs with

A second dimension of illegal states: data that's only meaningful in certain modes, stored independently of the mode. The error message that's only relevant when errored, the result that only exists when succeeded, the progress that only applies while loading. Stored as flat independent fields, you get illegal combinations (an error message present during success, a result present during loading). Stored *inside* the variant that owns them (the error lives in the `error` shape, the data in the `success` shape), they can only exist when valid. This mirrors the nullable-column trap in data-modelling: don't store mode-specific data in fields that exist regardless of mode; attach it to the mode.

## Where the type system can't fully enforce it

In dynamically-typed or weakly-typed surfaces, you can't always make illegal states *unrepresentable* at compile time. The principle still applies, structurally:

- Use a single status value rather than multiple flags even without enforced unions, the discipline of "one mode variable" prevents most contradictions even when the language won't check it.
- Centralise the state's construction and transitions (see `transitions.md`) so the few places that produce state are the only places that need to maintain the invariants, rather than every mutation site.
- Validate the state's consistency at the chokepoints if the language gives no structural guarantee, failing loudly on an illegal combination rather than rendering it.

The goal is unchanged across surfaces: reduce, as far as the tools allow, the set of states the program can be in to the set of states that are actually legal. Every illegal state you make unrepresentable is a bug that becomes impossible rather than merely discouraged.
