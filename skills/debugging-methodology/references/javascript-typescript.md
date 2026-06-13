# JavaScript and TypeScript

The core loop is unchanged. What's specific here is the failure shapes that recur in JS/TS and the tooling that observes them. This covers Node, browser, and React.

## Async and timing (the largest category)

Most non-trivial JS bugs are timing bugs in disguise.

- **Reading state before a promise resolves.** A value is empty/undefined because the fetch that fills it hasn't resolved when the read happens. Symptom: works with a breakpoint or a delay, fails at speed (a heisenbug, see `intermittent-and-heisenbugs.md`). Confirm by logging at both the resolve and the read with timestamps; if the read logs first, that's the bug.
- **Unawaited promise.** A missing `await` means execution continues before the operation finishes. The function returns a pending promise instead of a value, or an error throws into the void. Look for an async call whose result is used immediately without `await`, and for functions that should be `async` but aren't.
- **Unhandled rejection.** A rejected promise with no `.catch` or surrounding `try` produces a logged "unhandled rejection" far from the cause and no useful stack. Find the promise chain that isn't terminated.
- **`Promise.all` vs sequential.** A bug that only appears when several operations run concurrently (shared state, ordering, rate limits) points at the `Promise.all`. Temporarily make it sequential to confirm the concurrency is the trigger.
- **Floating timers and intervals.** `setInterval`/`setTimeout` callbacks firing after the context they referenced is gone, or stacking up. Common in components that don't clean up.

## `this`, closures, and scope

- **`this` rebinding.** A method passed as a callback loses its `this`. Symptom: "cannot read property of undefined" inside a method that's fine when called directly. Look for a method used as a bare reference (`onClick={obj.method}`) rather than bound or wrapped.
- **Stale closure.** A closure captured a variable's value at creation time and doesn't see later updates. Endemic in React effects and event handlers. The captured value is "stale." Confirm by logging the captured variable inside the closure vs outside.

## Type coercion and equality

- `==` vs `===`, truthiness of `0`/`""`/`NaN`/`[]`/`{}`, `null` vs `undefined` distinctions. A condition that misbehaves on a falsy-but-valid value (like `0` or empty string) is often a truthiness check that should be an explicit comparison.
- `NaN` propagation: one bad arithmetic step poisons everything downstream and `NaN !== NaN`. Trace back to the first operation that produced it.
- TypeScript types are erased at runtime. A value typed as `string` can be a number at runtime if it crossed an untyped boundary (JSON parse, API response, `any`, a type assertion that lied). Don't trust the type over the runtime value when debugging; log the actual `typeof`.

## React-specific

- **Effect timing and dependencies.** An effect reading stale state, firing too often, or not firing because the dependency array is wrong. A missing dependency causes stale reads; an unstable dependency (new object/function each render) causes infinite loops.
- **Render vs commit.** State set during render, reading a ref before it's attached, expecting a state update to be synchronous (it's batched). A value that's "one update behind" is usually this.
- **Key instability.** List items with unstable or index keys causing wrong-component reuse, lost input state, or wrong items animating.
- **Double-invocation in StrictMode (dev).** Effects and renders run twice in development to surface impurity. A bug that only happens in dev and involves something firing twice is often this surfacing a real cleanup or idempotency problem, fix the underlying impurity rather than dismissing it.

## SSE and streaming

- Partial chunks: a streamed response read before a logical unit is complete, or a JSON fragment parsed mid-stream. Buffer until you have a complete unit.
- Connection lifecycle: the stream closing early, not being cleaned up, reconnecting and duplicating, or backpressure when the consumer is slower than the producer. Duplicated streamed content often means a stream that reconnected without resetting its accumulated buffer.
- Ordering: events arriving or being processed out of order when multiple streams or async handlers interleave.

## Node vs browser

- Different globals (`window`/`document` vs `process`/`Buffer`), different module resolution, different APIs. Code that assumes one environment crashing in the other.
- "Works in dev, breaks in prod build": minification, tree-shaking removing something with a side effect, environment variables not present at build time, different bundler behaviour. See `web-frontend.md`.

## Tooling

- **Source maps first.** Before trusting any line number from a prod or bundled build, confirm source maps are present and correct. A trace pointing at minified code or the wrong line means fix the maps before reading further.
- **Debugger over logs for state inspection**, logs over debugger for timing bugs (a breakpoint changes the timing and can hide a race). Use a conditional breakpoint to stop only on the failing case rather than stepping through thousands of fine iterations.
- **`node --inspect`** for server-side breakpoints; the browser devtools Sources panel for client.
- For unhandled rejections, enable the runtime's unhandled-rejection logging so they surface with a stack rather than silently.
