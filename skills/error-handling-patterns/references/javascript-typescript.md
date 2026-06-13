# JavaScript and TypeScript

The agnostic principles hold; this covers how they're expressed in JS/TS and the language's specific traps. JS uses exceptions (`throw`/`try`/`catch`) plus promise rejection for async, and TS adds type-level concerns that don't fully cover errors.

## You can throw anything, so catch defensively

JavaScript lets you `throw` any value, a string, a number, an object, not just `Error`. This means a `catch` block cannot assume it received an `Error` with a `.message` and `.stack`. Code that does `catch (e) { log(e.message) }` breaks when something threw a string.

- Always throw `Error` (or a subclass), never a bare string or object. Throwing non-Errors loses the stack trace and breaks every handler that expects an Error.
- In `catch`, treat the caught value as `unknown` (TypeScript types it as `unknown` or `any`) and narrow before using: check `instanceof Error` before touching `.message`/`.stack`, and handle the non-Error case rather than assuming.

## TypeScript types don't include errors

A function's TS signature says what it returns on success; it says **nothing** about what it throws. `function load(): User` can throw, and the type gives no warning. This is the language's biggest error-handling gap:

- The type system won't remind you a call is fallible. You have to know. Treat any call that touches I/O, parsing, or external state as throwing, regardless of its clean-looking return type.
- For critical paths, consider a **Result-style return** (`{ ok: true, value } | { ok: false, error }`) that puts the failure *in* the type, forcing callers to handle it because the success value is only reachable after checking. This trades exception ergonomics for type-enforced handling; use it where silent unhandled failure is unacceptable, not everywhere (it's verbose).
- A type assertion (`as`) or `any` that lies about a value's shape produces a runtime error far from the assertion. These are self-inflicted unexpected failures; minimise `as` and never `as any` across a fallible boundary like `JSON.parse` (which returns `any` and will happily hand you a shape that doesn't match your type).

## Async: rejection is the async form of throwing

A rejected promise is async's exception. The traps are all about rejections going unhandled:

- **Unhandled rejection.** A promise that rejects with no `.catch` and no surrounding `try`/`await` produces an "unhandled rejection", far from the cause, often with a poor stack. Every promise chain must terminate in handling.
- **The missing `await`.** Calling an async function without `await` (or `.then`) means its rejection escapes the surrounding `try`/`catch` entirely, the `try` block finished before the promise settled. A `try`/`catch` around an *un-awaited* async call catches nothing. Always `await` inside `try` if you mean to catch it.
- **Fire-and-forget.** A promise you intentionally don't await (a background task) still needs a `.catch`, or its rejection is unhandled. If you truly mean to ignore it, attach a `.catch` that at least logs; don't leave it bare.
- **`async` in array callbacks.** Passing an `async` function to `forEach` doesn't await it, the rejections vanish and the loop doesn't wait. Use `for...of` with `await`, or `Promise.all(map(...))`, depending on whether you want sequential or concurrent.

## Promise.all vs allSettled

- **`Promise.all`** rejects as soon as *any* input rejects, and the other results are lost (the successful ones and the still-pending ones). Right when you need all-or-nothing and a single failure means the whole thing failed.
- **`Promise.allSettled`** waits for all and reports each as fulfilled or rejected, so partial success is visible. Right when you want every result regardless and intend to handle the failures individually (degrade gracefully per item). Reaching for `Promise.all` when you actually wanted partial results is a common cause of "one bad item killed the whole batch."
- **`AggregateError`** (from `Promise.any` and elsewhere) bundles multiple errors; when handling it, iterate its `.errors`, don't treat it as a single cause.

## Error chaining

Modern JS supports `new Error("context", { cause: originalError })`, use it to wrap while preserving the cause (see `error-context.md`). Custom error subclasses (`class NotFoundError extends Error`) let callers catch specifically by type with `instanceof`, which is how you avoid the over-broad catch; define meaningful error types rather than throwing generic `Error` everywhere and string-matching the message.

## finally and cleanup

`finally` runs whether the `try` succeeded or threw, use it for cleanup that must happen either way (closing handles, releasing locks). Beware: a `return` or `throw` inside `finally` overrides whatever the `try`/`catch` was returning or throwing, silently swallowing the original error. Never `return` from `finally`.

## Node vs browser surfacing

- Node: an uncaught exception or unhandled rejection can crash the process; set top-level handlers (`process.on('uncaughtException'|'unhandledRejection')`) as a last-resort net that logs and shuts down cleanly, not as routine handling.
- Browser: `window.onerror` / `unhandledrejection` events catch what escaped, route them to your error tracking. Unhandled errors in the browser fail silently for the user unless you surface them.
