# Senior Review Checklist

The patterns a senior developer checks during code review, organized by category. Each entry names the pattern, explains why it matters, and states what to do instead. These are not architectural smells (see `refactoring/references/code-smells.md`); they're the line-level and file-level tells of code that wasn't written carefully or wasn't reviewed before merging.

## Hardcoding and magic values

**Magic numbers.** A numeric literal in code with no explanation: `if (retries > 3)`, `setTimeout(fn, 86400000)`, `padding: 16`. The reader has to guess what the number means, and when the value needs to change, they have to find every instance. Replace with a named constant: `const MAX_RETRIES = 3`. The name is the documentation.

**Hardcoded strings.** URLs, hostnames, ports, API paths, error messages, and feature flags embedded as string literals. These change between environments, and finding them all when they do is a search-and-pray exercise. Extract to configuration, environment variables, or a constants file — one source of truth per value.

**Hardcoded timeouts and limits.** `timeout: 5000` scattered across the codebase, each potentially a different value for the same concept. Centralise timeouts, retry limits, page sizes, and rate limits so they can be tuned in one place.

**Enum-shaped strings.** Repeated string comparisons (`if (status === 'active')`) without a defined set of valid values. Use an enum, a const object, or a union type so the set is explicit and typos are caught by the compiler, not by users.

## Type safety

**Loose equality.** `==` and `!=` in JavaScript/TypeScript. These coerce types silently (`0 == ''` is true, `null == undefined` is true). Use `===` and `!==` everywhere. There is no case where loose equality is the right choice in application code.

**Blanket `any` types.** TypeScript with `any` on function parameters, return types, or variable declarations defeats the purpose of using TypeScript. Every `any` is a hole in the type system that the compiler can't check. Use `unknown` when the type is genuinely uncertain and narrow it with a type guard.

**Implicit type coercion.** Relying on JavaScript's implicit conversions: `if (count)` when count could be `0` (falsy but valid), `'' + num` for string conversion, `+str` for number parsing. Be explicit: `if (count !== undefined)`, `String(num)`, `Number.parseInt(str, 10)`.

**No type guards at boundaries.** Data from an API, a database, user input, or a file read is `unknown` at runtime regardless of what TypeScript says at compile time. If there's no runtime validation (Zod, io-ts, a manual check) at the point where external data enters, the types are a lie.

## Control flow

**Nested ternaries.** `a ? b ? c : d : e` is unreadable. Use an if/else block or extract a function. One level of ternary is fine for simple expressions; two or more is never fine.

**Redundant boolean logic.** `if (x) return true; else return false;` — just `return x` (or `return Boolean(x)` if coercion is intended). Similarly: `if (x === true)` instead of `if (x)`, `x ? x : default` instead of `x || default` (or `x ?? default` for nullish).

**Missing early returns.** A function that wraps its entire body in `if (condition) { ... 40 lines ... }` instead of `if (!condition) return;` at the top. Early returns flatten nesting and make the happy path obvious.

**Callback hell.** Nested callbacks three or more levels deep when `async/await` is available. This was unavoidable in 2014; it's a code smell now.

**Overly clever one-liners.** Dense expressions that save lines but cost readability: chained reduces, nested destructuring assignments, bitwise tricks for rounding. Write it in two lines if two lines are clearer. Cleverness is a maintenance cost.

**Negated conditions with else.** `if (!ready) { handleNotReady() } else { proceed() }` — flip the condition: `if (ready) { proceed() } else { handleNotReady() }`. Positive conditions are easier to read.

## Error handling hygiene

**Empty catch blocks.** `catch {}`, `catch(e) {}`, `.catch(() => {})`. Silences failures completely — the operation failed and nobody will ever know. At minimum, log the error. Usually, propagate it or handle it meaningfully.

**Catch-and-log-only.** `catch(e) { console.error(e) }` in code that should propagate the error or retry. Logging is not handling. If the caller expects this operation to either succeed or throw, swallowing the error with a log line breaks that contract.

**Pointless rethrow.** `catch(e) { throw e }`. Does nothing — remove the try/catch entirely. If you need to add context, wrap the error: `throw new Error('Failed to load user', { cause: e })`.

**Generic error messages.** `throw new Error('Something went wrong')`. The person debugging this at 2am needs to know *what* went wrong, *where*, and *with what input*. Include the operation, the relevant IDs, and the original error.

**Catch without type narrowing.** Catching all exceptions when only a specific one is expected. In TypeScript, `catch(e)` gives you `unknown` — narrow it before accessing properties.

## Naming and conventions

**Inconsistent casing.** `camelCase` mixed with `snake_case` mixed with `PascalCase` for the same kind of thing in the same file. Pick one convention per entity type (variables, functions, classes, files) and enforce it.

**Boolean names that don't read as predicates.** `active`, `visible`, `loading` work as properties. As standalone variables, prefer `isActive`, `isVisible`, `isLoading` — they read as yes/no questions, which is what a boolean answers.

**Meaningless abbreviations.** `usr`, `mgr`, `cnt`, `btn`, `idx` — save a few characters, cost every future reader a mental lookup. Spell it out unless the abbreviation is universal in the domain (`id`, `url`, `html`, `css`, `api`).

**Single-letter variables outside tiny loops.** `i` in a three-line for-loop is fine. `n`, `x`, `d` as function parameters or in a scope longer than five lines is not. The name should survive being read without its declaration visible.

**Names that describe the implementation, not the intent.** `stringArray`, `dataMap`, `userList` — these name the data structure, not what it represents. `usernames`, `permissionsByRole`, `activeSubscriptions` tell the reader what the code is about.

**Verb confusion.** A function named `getUser` that also writes to a cache, or `validateInput` that also transforms it. The name promises one thing; the function does more. Either rename to reflect the real behaviour or split it.

## Dead code and leftovers

**Console.logs in production code.** Debugging output left in after the investigation. Use a proper logger with levels, or remove them. `console.log('here')` and `console.log('data:', data)` are the most common.

**Commented-out code blocks.** Code that's commented out "just in case." Version control exists for this — delete it. Commented-out code rots (it doesn't get updated when the surrounding code changes) and creates confusion about whether it was intentionally disabled or accidentally left.

**Unresolved TODO/FIXME/HACK.** These are promises to fix something later. If "later" never comes, they're just documented tech debt nobody tracks. Either do the work, file an issue, or remove the comment if the concern no longer applies.

**Unused imports and variables.** Dead imports and declarations that the linter should have caught. Their presence usually signals the linter isn't running, isn't configured, or is being ignored — which is itself a finding.

**Debug flags and test scaffolding.** `const DEBUG = true`, `if (DEV_MODE)`, test fixtures or mock data left in production code, environment checks that enable unsafe behaviour (`if (process.env.NODE_ENV !== 'production') allowAll()`).

**Deferred implementations disguised as done.** Functions that exist, are called, but return hardcoded values (`return true`, `return []`, `return null`) instead of doing real work. Validation that always passes, permission checks that always allow, data fetching that returns mock data. The code compiles and the tests pass (because the tests were written against the stub). See `ai-code-tells.md` § Deferred implementations for the full catalogue — this is the single most common way AI-generated code looks finished when it isn't.

## Async discipline

**Unawaited promises.** Calling an async function without `await` and without storing the promise. The operation runs in the background with no error handling and no guarantee it completes before the response is sent. This is the most common source of silent data loss in async code.

**Sequential awaits that could be parallel.** `const a = await fetchA(); const b = await fetchB();` when A and B are independent. Use `const [a, b] = await Promise.all([fetchA(), fetchB()])`. The sequential version takes the *sum* of both durations; the parallel version takes the *max*.

**Mixed async styles.** `.then().catch()` chains in the same file or function as `async/await`. Pick one style. Mixing them makes the control flow hard to follow and easy to get wrong (a `.catch()` on a promise inside an async function doesn't propagate to the outer try/catch).

**No timeout on external calls.** An HTTP request, database query, or third-party API call with no timeout. If the remote hangs, your request hangs forever. Always set a timeout on calls that leave your process.

**No cancellation.** Starting async work (a fetch, a computation, a subscription) that can outlive the context that needs its result (a React component unmounts, a request is aborted, a user navigates away) with no mechanism to cancel it. Leads to memory leaks, wasted work, and state updates on unmounted components.

**Fire-and-forget without intent.** If you deliberately don't await a promise (background logging, analytics, cache warming), mark it explicitly: `void sendAnalytics(event)` or a comment. Otherwise the reader can't tell if the missing await is intentional or a bug.

## Mutation and side effects

**Mutating function arguments.** A function that modifies the object passed to it: `function process(user) { user.status = 'processed'; }`. The caller doesn't expect their data to change. Return a new object or document the mutation prominently.

**"Get" that writes.** A function named `getX` or `checkX` that also modifies state, writes to a database, or triggers a side effect. Readers trust that "get" is a read operation. If it writes, rename it (`fetchAndCacheUser`, `ensureSession`).

**Shared mutable state.** A module-level variable that multiple functions read and write, especially across async boundaries. Order-dependent, race-prone, and untestable in isolation. Pass state explicitly or use a controlled store.

**Modifying objects from outer scope.** A nested function or callback that mutates a variable from its enclosing scope without the enclosing function making that obvious. The enclosing function's reader has to read every callback body to know what state changes.

## Boundary hygiene

**Trusting external data shapes.** Using API response fields without checking they exist or are the expected type. The TypeScript type annotation says `response.data.users` is `User[]`, but at runtime that's whatever the server sent. Validate at the boundary.

**No null/undefined checks on external data.** Accessing `.property` on something that could be null when it comes from outside your module. Internal code can trust its own invariants; external data cannot be trusted.

**String concatenation for SQL or HTML.** Building queries or markup by concatenating user input. Use parameterised queries, template engines, or framework-provided escaping. This is a security issue (covered in code-audit) but it's also a code quality tell — a senior dev would never write it this way.

**Raw environment variable access.** `process.env.DATABASE_URL` used directly throughout the code with no validation, no default, and no type conversion. Centralise env var access in one config module that validates required vars at startup and exports typed values.

**Unchecked `.json()` responses.** `const data = await response.json()` with no check on `response.ok` first. A 404 or 500 response will parse as JSON (often an error object) and get treated as valid data.

## Separation of concerns

**Business logic in route handlers.** An Express/Next.js route handler that contains the validation, the database query, the business rule, the response formatting, and the error handling all in one function. Extract the business logic so it can be tested without an HTTP layer.

**God components.** A React/Vue/Svelte component with a render function spanning hundreds of lines, mixing data fetching, state management, business rules, and presentation. Break into smaller components or extract hooks/composables for the non-visual logic.

**Framework imports in domain logic.** Business rules that import React, Express, or Prisma directly. Domain logic should be framework-agnostic — it takes plain data and returns plain data. The framework is the delivery mechanism, not the business.

**Mixed responsibilities per file.** A single file that defines a database model, exports API handlers, contains validation logic, and formats responses. Each responsibility should have a home. One file, one concern.

**Tight coupling to one provider.** Database queries, cloud API calls, or payment provider logic scattered directly through business code with no abstraction boundary. When the provider changes (and it will), every call site changes. Wrap external services behind an interface the business code calls.
