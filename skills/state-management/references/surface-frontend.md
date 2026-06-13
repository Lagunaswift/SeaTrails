# Surface: Frontend and UI State

UI state is where the principles get their sharpest test, because the interface is a *view* of state and any drift shows up directly as a wrong screen. The frontend translation of the principles, framework-agnostic in concept though the mechanisms have framework-specific names.

## The interface is a function of state

The healthiest mental model for a UI: the rendered interface is a pure function of the current state. Given the state, the view is determined; change the state, the view follows. This model is what makes UIs predictable, you reason about what state the program is in, and the view is the consequence, rather than reasoning about a sequence of imperative DOM manipulations.

- This makes the single-source-of-truth and derived-state principles concrete: the view *derives* from state, so anything visible should be computed from state, never stored as a separate fact the view reads. The "view = f(state)" model is derived-state taken to its conclusion, the entire screen is a derived value.
- The corollary: when the UI is wrong, the question is "is the state wrong, or is the derivation wrong?" Usually the state is right and something stored a derived value that drifted, or the state itself holds a contradiction (see below). A UI bug is very often a state-structure bug.

## Categories of frontend state, kept separate

Frontend state isn't monolithic; conflating its categories causes a lot of trouble. Keep them distinct:

- **Local UI state**: ephemeral, belongs to one component, irrelevant elsewhere, an input's current text, whether a dropdown is open, a hover state. Keep it local (see `scope-and-ownership.md`); lifting it or globalising it is over-scoping. Most state is this, and it should stay where it's used.
- **Shared application state**: facts several parts of the UI need, the current user, a shopping cart, app-wide settings. This is lifted to a shared owner or a store, with the single-source-of-truth discipline, one home, components read from it.
- **Server state** (cached remote data): data that actually lives on the server and is *cached* in the client. This is the most mishandled category because it's not really client state at all, it's a client-side copy of server-owned truth (a justified copy across a boundary, see `single-source-of-truth.md`), and it needs the copy's obligations: knowing when it's stale, refetching, invalidating. Treating fetched server data as ordinary local state, owned and mutated freely on the client, is a classic error, the client then holds a copy that drifts from the server with no reconciliation. Server state wants caching/synchronisation handling (whether hand-rolled or via a data-fetching library), not the same treatment as a local toggle.
- **URL/route state**: state that lives in the URL (the current page, query params, filters worth bookmarking). The URL is a legitimate, often-overlooked source of truth, putting "which item is selected" in the URL rather than in component state can make it the single home and get shareability for free. Don't duplicate URL state into component state that then drifts from the URL.

The frequent bug is putting a fact in the wrong category, server data treated as local state, shared state duplicated into locals, URL state copied into component state. Decide which category each fact is, and handle it per that category.

## Reactivity and derived values

Reactive frameworks recompute the view when state changes, which is what makes "view = f(state)" practical. Use the reactivity for derivation rather than fighting it:

- **Derive in the render/computed layer, don't store.** A filtered list, a total, a validity flag should be computed from state during rendering (or in a memoised computed value), not stored in separate state and manually kept in sync. Storing it reintroduces drift; the framework will happily recompute it for you. This is `derived-state.md` in frontend form, and it's the single most common frontend state mistake: state that should have been a computed value.
- **Memoise expensive derivations on their inputs.** When a derivation is costly, the safe cache is one keyed on its inputs (the framework's memoisation tools), so it's structurally fresh, inputs change, it recomputes; inputs stable, it reuses. This is the safe caching form from `derived-state.md`, and frameworks give it to you directly.
- **Effects synchronise with the outside, they're not for deriving.** Using a side-effect to compute one piece of state from another (watch this, then set that) recreates the stored-derived bug with extra steps and timing hazards, the derived value is now stored, updated asynchronously, and can be momentarily stale or wrong. Reserve effects for genuinely external synchronisation (fetching, subscriptions, the DOM, other systems), and derive in-app values directly. "I'm using an effect to keep one state in sync with another" is almost always a derived value that should be computed, not stored.

## Illegal UI states show up as broken screens

The multiple-boolean trap (see `illegal-states.md`) is rampant in UIs and visible when it bites: the `isLoading`/`isError`/`isSuccess` triple renders a spinner over an error message, or nothing at all, when the flags fall into an illegal combination. Modelling the fetch as one status variant (`idle`/`loading`/`success`-with-data/`error`-with-error) makes the view a clean switch over the legal states and makes the incoherent screens impossible. Whenever a UI shows two contradictory things at once (loading and loaded, empty and populated), suspect independent flags encoding one condition, and collapse them into one variant.

## Keep writes controlled even in the UI

The transition discipline (see `transitions.md`) applies: prefer changing shared/app state through defined updates (actions, a store's methods, a reducer) rather than letting any component mutate shared state directly. Local state can be simple, but shared state with many potential writers benefits from a chokepoint, it's what keeps a growing UI's state followable as the number of components touching it grows. Match the formality to the state: a local toggle needs none; a shared cart with many interacting writers earns controlled updates.
