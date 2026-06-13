# Python

The core loop is unchanged. This covers the failure shapes that recur in Python and the tooling that observes them.

## Read the traceback correctly

Python tracebacks read **most recent call last**: the bottom frame is where it threw, the top is the entry point. Read the bottom first for *what* failed, then walk up for *how you got there*. The last line is the exception type and message; the type narrows the cause faster than the message:

- `AttributeError: 'NoneType' object has no attribute 'x'`: something you expected to be an object is `None`. Find where it should have been assigned and wasn't (a function that returned `None` implicitly, a `.get()` that missed, a query with no result).
- `KeyError` / `IndexError`: accessing a key/index that isn't there. The missing key is named in the message; trace where the container was built.
- `TypeError`: wrong type passed, often a `None` where a value was expected, or a string where a number was.
- `ImportError` / `ModuleNotFoundError`: almost always environment, not code. See below.

For chained exceptions, read past "During handling of the above exception, another exception occurred" to find the *original* error at the top of the chain; the bottom one is often just the handler failing.

## Environment issues (the most common time-sink)

Python's biggest source of "it works on my machine" is environment mismatch:

- **Wrong interpreter / venv.** The code runs against a different Python or a different virtualenv than you think, so installed packages are missing or the wrong version. Confirm with `import sys; print(sys.executable)` and `print(sys.path)` at the actual failure point, not in a fresh shell.
- **`ModuleNotFoundError` for an installed package** means you installed it into a different environment than the one running. Check which pip maps to which python.
- **Version skew.** A dependency at a different version than expected. `pip show <pkg>` or `pip freeze` against the *running* interpreter.
- **Import shadowing.** A local file named the same as a stdlib or installed module (`random.py`, `email.py`, `queue.py`) silently shadows it, producing bizarre `ImportError`s or `AttributeError`s on the real module. Check for a local file matching the import name.

## Mutable default arguments

`def f(items=[])` creates the list **once**, shared across all calls. Mutating it leaks state between calls, a textbook intermittent bug where the second call sees the first call's data. Symptom: a function accumulates state it shouldn't. Fix: default to `None` and create inside. Always suspect this when a function's behaviour depends on how many times it's been called.

## Scope and binding

- **Late binding in closures/loops.** A lambda or function defined in a loop that captures the loop variable sees its *final* value, not the value at definition time. Classic with `for i in range(): callbacks.append(lambda: i)`, where all callbacks end up seeing the last `i`.
- **`UnboundLocalError`.** Assigning to a name anywhere in a function makes it local throughout, so a read before the assignment fails even if there's a global of that name. Look for a variable that's both read from outer scope and assigned locally.
- **Mutating while iterating.** Changing a list/dict during iteration over it raises or skips elements. Iterate over a copy.

## Numeric and equality

- Integer vs float division, float imprecision in comparisons (`0.1 + 0.2 != 0.3`). Compare floats with a tolerance, not `==`.
- `is` vs `==`: `is` checks identity, `==` checks equality. `is` works on `None`/`True`/`False` by convention and breaks on values (it may pass for small cached ints and fail for others, a trap).
- Truthiness of empty containers, `0`, and `None` all being falsy; a check meant to catch "missing" also catches "empty" or "zero."

## Async

- Forgetting `await` returns a coroutine object instead of running it; a "coroutine was never awaited" warning points at this.
- Blocking (synchronous) calls inside an async function stall the whole event loop. A mysteriously serial async program often has a blocking call hidden in it.
- Mixing async libraries/loops, or calling async from sync without a runner.

## Tooling

- **`pdb` / `breakpoint()`.** Drop `breakpoint()` at the suspected line to get an interactive prompt with the live state. `pp` to pretty-print, `w` for the stack, `u`/`d` to move frames, `l` for context.
- **Post-mortem.** `python -m pdb script.py` or `pdb.post_mortem()` in an except block drops you into the debugger *at the point of the exception* with all frames intact, far better than guessing from the traceback.
- **`logging` over `print`** for anything you'll keep, with levels so you can dial verbosity without deleting probes.
- For a wrong value with no exception, fall back to the locate phase: bisect the data flow with prints/breakpoints to find where good becomes bad.
