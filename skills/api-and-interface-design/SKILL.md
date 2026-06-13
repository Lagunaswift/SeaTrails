---
name: api-and-interface-design
description: "Use this skill whenever designing or reviewing the boundary between parts of a system: an HTTP/REST API, a library or module's public functions, a class's methods, a service contract, or any point where one piece of code is called by another. Trigger on phrases like 'design an API', 'API design', 'endpoint', 'function signature', 'public interface', 'what should this return', 'parameters for', 'method signature', 'the contract', 'design the module', 'how should callers', 'naming this function', or when defining how something will be called. Also trigger proactively BEFORE writing a public function, endpoint, or module boundary that others (including future you) will call, since interface mistakes are expensive once callers depend on them. Covers naming and consistency, what to expose vs hide, designing for the caller, making misuse hard, and versioning/backward-compatibility. Does NOT cover the data model behind the interface (use data-modelling) or auth/access control (use the security skills)."
---

# API and Interface Design

A method for designing the boundary between a provider of functionality and its callers, so the boundary is predictable, hard to misuse, honest about what it hides, and survivable when it changes. "Interface" here is one concept with several surfaces: an HTTP endpoint, a library's public functions, a class's methods, a module's exports. The same principles govern all of them; the syntax differs, and where it matters the surface-specific detail lives in the reference files.

## The unifying idea: an interface is a contract

Every interface is a promise between two parties who shouldn't need to know each other's internals: the **provider** promises certain behaviour given certain inputs, and the **caller** relies on that promise without seeing how it's kept. Good interface design is good contract design: the promise is clear, consistent, minimal, hard to break by accident, and stable enough to depend on. Everything in this skill follows from taking the contract seriously, treating the caller as someone who has only the interface and none of your context, because that is exactly their situation.

The four ways contracts go wrong, which this skill exists to prevent:

1. **Leaking implementation.** The contract exposes how it's built, so callers couple to internals, and you can't change the implementation without breaking them.
2. **Inconsistency.** Similar things work differently across the interface, so callers can't predict behaviour and must memorise special cases.
3. **Permitting misuse.** The interface allows calls that are meaningless or wrong, so callers reach illegal states and discover the rules by hitting errors.
4. **Breaking on change.** The contract changes in a way that breaks existing callers, because it was never designed to evolve.

## The cardinal rule

**Design from the caller's side of the boundary, not the implementer's.** The interface should make sense to someone who knows what they want to do and nothing about how you do it. The most common root cause of a bad interface is designing it outward from the implementation, exposing what was easy to expose, naming things after internal mechanics, shaping calls around how the code happens to work, so the caller is forced to understand your internals to use it. Invert this: start from what the caller is trying to accomplish, design the call they'd want to make, and let the implementation adapt behind the boundary. A good interface lets the caller express their intent; a bad one makes them express your implementation.

## The method

### 1. Define the contract: what it promises, what it requires

Before syntax, state the promise in plain terms: given what inputs and preconditions, the interface does what and returns what, with what guarantees and what failure modes. This is the contract whether or not you write it down, and writing it down surfaces the vagueness. Two halves: what the caller must provide (preconditions, valid inputs), and what the provider guarantees in return (postconditions, outputs, effects, errors). An interface whose contract you can't state cleanly is one you don't understand well enough to expose yet. `references/contracts.md` covers preconditions and postconditions, total vs partial behaviour, and documenting the promise.

### 2. Design for the caller

Shape the interface around the caller's intent and the calls they'll actually make. The common operations should be easy and obvious; the rare ones possible. Don't make the caller assemble several calls or pass redundant information to express one intent. Don't expose knobs that exist only because they were easy to implement. `references/designing-for-the-caller.md` covers intent-shaped design, the "common case easy" principle, parameter design (count, order, named vs positional, booleans-as-traps), and not making callers do your bookkeeping.

### 3. Hide the implementation

Expose the contract; hide everything else. Every internal detail that leaks across the boundary becomes something callers couple to and you can't change. Decide deliberately what is public (the promise) and what is private (how it's kept), and keep the public surface as small as it can be while still being useful. The smaller the surface, the more freedom you keep to change what's behind it. `references/information-hiding.md` covers encapsulation, minimal surface area, leaky abstractions, and why every public element is a commitment.

### 4. Be consistent

Within an interface, similar things should work similarly: naming, parameter order, return shapes, error reporting, units, conventions. Consistency is what lets a caller learn the interface once and predict the rest, instead of checking the docs for every call. Inconsistency is a tax paid on every use. `references/consistency.md` covers naming conventions, predictable patterns, symmetry (if there's a create, the delete should mirror it), and aligning with the conventions of the platform/ecosystem.

### 5. Make misuse hard, ideally impossible

The best interface makes incorrect calls difficult to express and illegal states impossible to reach, rather than relying on the caller to read the docs and remember the rules. Use the type system, required-vs-optional structure, and the shape of the calls to channel callers toward correct use and away from wrong use. If two parameters must agree, don't accept them separately; if an operation only makes sense in a certain state, don't expose it in the others. `references/misuse-resistance.md` covers making illegal calls unrepresentable, the type system as guardrail, failing at the earliest possible moment, and the pit-of-success principle.

### 6. Handle failure as part of the contract

How an interface reports failure is part of its contract, not an afterthought. Callers need to know what can fail, how they'll find out, and what they can do about it, consistently across the interface. This connects to the error-handling skill but from the design side: what failure modes the interface exposes and how. `references/failure-as-contract.md` covers errors as part of the signature, consistent error reporting, and not surprising callers with undocumented failure modes.

### 7. Design for change from the start

Interfaces with callers are expensive to change, so design them to evolve before you have to. Additive change should be safe; breaking change should be rare and managed. Decide your versioning and compatibility approach before the first caller arrives, because retrofitting it after is painful. `references/versioning-and-compatibility.md` covers what counts as a breaking change, additive-first evolution, versioning strategies, deprecation, and backward/forward compatibility, across HTTP and library surfaces.

## How the surfaces differ

The principles are shared; the expression differs. Read the relevant surface file for the specifics:

- `references/surface-http.md`: REST/HTTP APIs, resources and verbs, status codes, pagination, idempotency, request/response shape, statelessness
- `references/surface-library.md`: function and method signatures, modules and exports, return types, parameter objects, the public/private split in code
- The shared principle files above apply to both; the surface files are the translation layer.

## Anti-patterns

The recurring ways interfaces go wrong, each with its correction, in `references/anti-patterns.md`:

- Designing outward from the implementation instead of inward from the caller
- Leaky abstraction (internals visible through the contract)
- Boolean trap (opaque true/false parameters at call sites)
- Inconsistent naming, ordering, or return shapes across the interface
- A surface so large that everything is a commitment you can't change
- Accepting separate parameters that must agree (permitting illegal combinations)
- Stringly-typed interfaces (passing meaning in unvalidated strings)
- Undocumented or surprising failure modes
- Breaking changes shipped without versioning or deprecation
- Over-generalised interfaces built for callers who don't exist yet

## Reference index

- `references/contracts.md`: preconditions, postconditions, total vs partial, stating the promise
- `references/designing-for-the-caller.md`: intent-shaped design, common-case-easy, parameter design
- `references/information-hiding.md`: encapsulation, minimal surface, leaky abstractions
- `references/consistency.md`: naming, predictable patterns, symmetry, ecosystem conventions
- `references/misuse-resistance.md`: unrepresentable illegal calls, types as guardrails, pit of success
- `references/failure-as-contract.md`: errors as part of the signature, consistent failure reporting
- `references/versioning-and-compatibility.md`: breaking changes, additive evolution, versioning, deprecation
- `references/surface-http.md`: HTTP/REST specifics
- `references/surface-library.md`: function, method, and module specifics
- `references/anti-patterns.md`: the failure modes above, each with its correction
