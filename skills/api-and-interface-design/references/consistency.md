# Consistency

Consistency is what lets a caller learn an interface once and then predict the rest of it. When similar things work similarly, the caller generalises from a few uses to the whole surface; when they don't, every call is a fresh lookup and every difference is a thing to memorise. Inconsistency is a tax paid on every single use of the interface, forever, by everyone.

## Predictability is the goal

The deep value of consistency is that it lets callers guess correctly. If `getUser` exists, the caller expects `getOrder` to work the same way and return the same shape of thing. If creating returns the created entity here, the caller expects it to return the created entity everywhere. A consistent interface rewards generalisation; an inconsistent one punishes it, training callers to trust nothing and check everything. Aim for an interface where a caller who's used part of it can correctly predict the rest without reading the docs.

## Naming conventions

Names are the most visible consistency surface, and small inconsistencies grate constantly:

- **One term per concept.** Pick `user` or `account` or `member` and use it everywhere; don't mix `getUser`, `fetchAccount`, `loadMember` for the same concept. Synonyms scattered across an interface make the caller wonder whether they're three different things.
- **One verb per operation type.** Decide whether retrieval is `get`, `fetch`, or `find`, and apply it uniformly. If `get` means "by id, throws if missing" and `find` means "by query, returns optional", that's a *useful* distinction applied consistently, fine. If they're used interchangeably, that's noise.
- **Consistent casing and formatting** to the ecosystem's norm (see conventions below). Mixed casing in one interface looks broken and makes names harder to recall.
- **Names should be honest and intent-revealing** (covered in `designing-for-the-caller.md`), but consistency adds: honest *and the same as its siblings*. A perfectly good name that breaks the pattern its neighbours follow is still a consistency cost.

## Predictable patterns and shapes

Beyond names, the structure of calls and responses should follow patterns:

- **Parameter order should be consistent** across related operations. If the id comes first here, it comes first everywhere. A caller who learns the order once shouldn't be tripped by an operation that reverses it.
- **Return shapes should be consistent** for similar operations. If list endpoints return `{ items, total }`, they all should; one that returns a bare array breaks the pattern and the caller's handling. If retrieval returns the entity, all retrievals should.
- **Error reporting should be uniform** (see `failure-as-contract.md`). The same kind of failure should be reported the same way across the whole interface, so callers write one handling path, not one per endpoint.
- **Units, formats, and conventions should be uniform.** All timestamps in the same format and timezone, all money in the same representation, all ids in the same form. A single endpoint that returns a date as a string while others use a number is a bug waiting to happen at every call site.

## Symmetry

Operations that come in natural pairs or sets should mirror each other:

- If there's a `create`, the `delete` should be its mirror: same identification, same shape, opposite effect. If `create` takes an object and `delete` takes a bare id in a different position, the asymmetry is a small constant friction.
- Getters and setters, open and close, subscribe and unsubscribe, encode and decode, the pair should be obviously a pair, with matching names and matching shapes. Asymmetric pairs make the caller relearn each half.
- Where an operation has an inverse, the inverse should exist and be named as such. An interface that lets you `lock` but makes you discover that unlocking is done some entirely different way is fighting the caller's reasonable expectation.

## Align with the ecosystem's conventions

An interface doesn't exist in isolation; it sits in a language, a framework, a platform, each with established conventions callers already know. Matching those conventions is consistency at the largest scale:

- Follow the **naming and structural conventions of the language/platform** (the casing, the idioms, the standard shapes). An interface that invents its own conventions forces callers to learn yours on top of the ones they already know, and looks foreign in their codebase.
- Follow the **conventions of the surface** (REST conventions for HTTP, the language's idioms for libraries, covered in the surface files). Callers bring strong expectations from every other API of that kind they've used; meeting those expectations is free usability, violating them is gratuitous friction.
- The exception: don't follow a convention into a genuinely worse design just to conform. Convention serves predictability; when a convention is actively harmful for your case, deviating is justified, but deviate deliberately and document it, because you're spending the caller's expectation to do so.

## Consistency vs the perfect individual choice

A real tension: sometimes the locally-best name, order, or shape for one operation breaks the pattern the rest of the interface follows. Usually, **consistency wins.** An interface where everything is the predictable 90%-good way beats one where each piece is individually optimal but collectively unpredictable, because the caller's cost of inconsistency (memorising every special case) exceeds the benefit of any single perfect choice. Reserve deviation for when the consistent choice is genuinely wrong, not merely imperfect. The pattern is worth more than the local optimum.
