---
name: code-quality
description: "Review a codebase for the line-level and structural patterns that distinguish senior-quality code from junior or AI-generated spaghetti: magic numbers, loose equality, empty catches, hardcoded values, naming inconsistencies, async anti-patterns, missing boundary validation, dead code, and the specific tells of AI-authored code. Trigger on: 'code quality', 'is this production quality', 'review this like a senior dev', 'clean code check', 'would this pass code review', 'is this AI code', 'spaghetti check', or when a production-audit selects this lens. Complements refactoring (which covers architectural smells and how to fix them) and code-audit (which sequences a multi-pass review). This skill is the checklist a senior dev runs in their head during PR review."
---

# Code Quality

The patterns a senior developer flags in code review before they'll approve a PR. These aren't architectural smells (covered by `refactoring`) or security holes (covered by `code-audit` Pass 1). They're the line-level and file-level tells that separate production-grade code from first-draft code, whether that first draft came from a junior dev or an AI.

## When to use

When reviewing code for professional quality — the kind of check that happens in a PR review, a codebase assessment, or a "is this ready for other people to maintain" audit. Also use when the question is specifically whether code was AI-generated and left unreviewed.

## What this is not

This is not about whether the code *works*. A codebase can pass every test and still be full of magic numbers, empty catches, and inconsistent naming. This skill catches the things that make code expensive to maintain, hard to onboard into, and fragile under change — the gap between "it runs" and "a senior dev wrote this."

## The review passes

### Pass 1: Hardcoding and magic values

Scan for unexplained numeric literals, hardcoded strings (URLs, ports, timeouts, error messages, feature flags), and values that should be named constants or configuration. See `references/senior-review-checklist.md` § Hardcoding and magic values.

### Pass 2: Type safety and equality

Scan for loose equality (`==`/`!=`), blanket `any` types in TypeScript, implicit type coercion, and missing type guards at system boundaries. See checklist § Type safety.

### Pass 3: Control flow

Scan for nested ternaries, redundant logic (`if (x) return true; else return false;`), missing early returns, callback hell where async/await is available, and overly clever one-liners that sacrifice readability. See checklist § Control flow.

### Pass 4: Error handling hygiene

Scan for empty catch blocks, pointless rethrows (`catch(e) { throw e }`), generic error messages that lose context, and catch-and-log-but-don't-handle. This complements `error-handling-patterns` (which covers architectural error strategy); this pass covers the line-level tells. See checklist § Error handling hygiene.

### Pass 5: Naming and conventions

Scan for inconsistent casing within the same file or module, boolean variables that don't read as predicates, meaningless abbreviations, single-letter variables outside trivial loops, and names that lie about what the code does. See checklist § Naming and conventions.

### Pass 6: Dead code and debug leftovers

Scan for `console.log` left in production code, commented-out code blocks, unresolved TODO/FIXME/HACK comments, unused imports, and unused variables. See checklist § Dead code and leftovers.

### Pass 7: Async discipline

Scan for unawaited promises (fire-and-forget by accident), sequential awaits that could be `Promise.all`, mixing `.then()` with `async/await` in the same file, missing timeouts on external calls, and no cancellation of abandoned work. See checklist § Async discipline.

### Pass 8: Mutation and side effects

Scan for functions that mutate their arguments, functions named "get" or "check" that also write, shared mutable state between modules, and modification of objects passed by reference without the caller knowing. See checklist § Mutation and side effects.

### Pass 9: Boundary hygiene

Scan for external data (API responses, user input, file reads, env vars) consumed without validation, assumed shapes without type guards, no null/undefined checks on data from outside the module, and string concatenation for SQL or HTML. See checklist § Boundary hygiene.

### Pass 10: Separation of concerns

Scan for business logic in route handlers or UI components, god components with page-length render functions, framework imports in domain logic, and files that mix data fetching, business rules, and presentation. See checklist § Separation of concerns.

### Pass 11: Deferred implementations

Scan for code that looks complete but quietly defers the real work: placeholder functions that return hardcoded values or empty arrays, TODO/FIXME comments standing in for actual logic, validation functions that always return true, stubbed error handling (`// handle error`), mock data in production code paths, incomplete switch/if chains that silently skip cases, and security-critical operations left as comments (`// TODO: add auth check`). AI-generated code does this constantly — it builds the scaffolding and skips the load-bearing parts without flagging that anything is missing. The structure looks finished; the behaviour is a stub. See `references/ai-code-tells.md` § Deferred implementations.

### Pass 12: AI-generated code tells

Scan for the patterns that specifically signal AI-authored code left unreviewed: over-abstraction, "just in case" defensive code against impossible states, inconsistent patterns across the same codebase, over-commented obvious code paired with under-commented subtle code, and unnecessary wrapper functions. See `references/ai-code-tells.md`.

## What to produce

Findings in the canonical schema (`production-audit/references/finding-schema.md`), prefix `QUAL`, category `code-quality`. Most findings will be medium or low — these are maintainability and professionalism issues, not safety issues. A finding only reaches high if it creates a real risk: an empty catch that silences a payment failure, a missing boundary check that lets malformed data propagate, or a mutation bug that corrupts shared state. In those cases the consequence drives the category (it becomes `correctness` or `security`, not `code-quality`), and the relevant lens owns it.

## Relationship to other skills

- **refactoring** covers architectural smells (duplication, god objects, tangled modules) and how to fix them safely. This skill covers the line-level patterns refactoring doesn't catalogue.
- **code-audit** sequences a multi-pass review and applies specialist skills as lenses. This skill can be one of those lenses (Pass 5: Structure could delegate here for line-level quality).
- **error-handling-patterns** covers error strategy (where to catch, how to propagate, resilience patterns). This skill flags the surface tells of bad error handling (empty catches, lost context) without prescribing the architecture.
- **testing-strategy** covers whether the code is testable and tested. This skill flags patterns that make code hard to test (tight coupling, hidden side effects, global state) as a quality issue.
