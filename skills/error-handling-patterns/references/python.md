# Python

The agnostic principles hold; this covers Python's specific mechanics and traps. Python uses exceptions throughout, with a rich built-in hierarchy and several features (chaining, `else`, context managers) that directly support good handling, and a few sharp edges.

## Catch specific exceptions, not bare except

Python's biggest error-handling trap is the over-broad catch:

- **`except:` (bare)** catches *everything*, including `KeyboardInterrupt` and `SystemExit`, so it can swallow Ctrl-C and prevent clean shutdown. Almost never correct. If you must catch broadly, `except Exception:` at least leaves the system-exit signals alone, but even that is usually too broad.
- **Catch the narrowest exception that represents the failure you can handle.** `except FileNotFoundError:` not `except Exception:`. A broad catch silently absorbs bugs (a `TypeError` from your own mistake) along with the operational error you meant to handle, hiding the bug. Specificity is what keeps a handler from eating your own errors.
- Catch multiple specific types with a tuple: `except (ConnectionError, TimeoutError):`. Handle different exception types differently when they need different responses, rather than one broad block.

## Use the exception hierarchy

Python's built-in exceptions form a tree, and catching a base type catches its subtypes. Know the useful nodes: `OSError` (and its subclasses `FileNotFoundError`, `PermissionError`, `ConnectionError`, `TimeoutError`), `ValueError`, `KeyError`, `TypeError`, `LookupError`. Catch at the right level of the tree, specific enough to not over-catch, general enough to handle related failures together when appropriate.

- Define **custom exceptions** by subclassing `Exception` (not `BaseException`) for your domain's failures, so callers can catch them specifically. A small hierarchy (`AppError` base, specific subclasses) lets callers choose their granularity.
- Never subclass `BaseException` directly for ordinary errors; that's reserved for system-level signals you don't want caught by normal handlers.

## Chaining: raise from

Python chains exceptions automatically and explicitly, use it to preserve the cause (see `error-context.md`):

- **Implicit chaining**: if an exception is raised *inside* an `except` block, Python attaches the original as `__context__` automatically, and the traceback shows both.
- **Explicit chaining**: `raise NewError("loading profile failed") from original` sets `__cause__` and makes the relationship deliberate and clear in the traceback ("The above exception was the direct cause..."). Use `raise ... from` when you wrap a low-level error in a domain-level one.
- **Suppress chaining** with `raise NewError() from None` only when the original genuinely shouldn't be shown (rare, usually when the original is an implementation detail that leaks). Don't suppress reflexively; the chain is usually the information you want.

The anti-pattern is `except SomeError: raise MyError("failed")` *without* `from`, which still implicitly chains via `__context__` but reads as if you didn't think about the cause. Be explicit with `from`.

## try/except/else/finally

Python's `else` and `finally` clauses make handling precise:

- **`else`** runs only if the `try` block raised nothing. Put the code that should run on success *and that you don't want to accidentally catch* here, not in the `try`. This keeps the `try` block narrow, only the line that can fail, so the `except` doesn't accidentally catch an exception from unrelated success-path code. A too-large `try` block is a common way to over-catch.
- **`finally`** runs no matter what, for cleanup. As in other languages, a `return` in `finally` swallows a pending exception, avoid it.
- Keep `try` blocks minimal: wrap only the operation that can fail, with the success-path code in `else`. A `try` wrapping twenty lines catches exceptions from all twenty, including ones you didn't mean to handle.

## Context managers for cleanup

Use `with` (context managers) for anything that must be released, files, locks, connections, transactions. The `with` block guarantees cleanup on both success and exception, replacing manual `try/finally`. This is the idiomatic Python answer to "make sure this gets closed even if it fails," and it's cleaner and harder to get wrong than explicit `finally`. Write custom context managers (`contextlib.contextmanager` or `__enter__`/`__exit__`) for your own acquire/release pairs.

## EAFP vs LBYL

Python idiom favours **EAFP** ("easier to ask forgiveness than permission"), try the operation and catch the failure, over **LBYL** ("look before you leap"), check preconditions first. `try: d[key] except KeyError:` over `if key in d:` followed by access. EAFP avoids the check-then-act race (the state can change between check and use) and is usually clearer. But this is for *expected* conditions handled as part of normal flow; it is not licence to wrap everything in try/except. Match it to genuinely expected outcomes.

## Don't catch what's really a bug

`TypeError`, `AttributeError`, `NameError`, and `KeyError` from your own code are usually programmer errors (see `classifying-failures.md`), bugs to fix, not conditions to handle. Catching them broadly hides the bug. If you find yourself catching these to keep the program running, the fix is in the code that raised them, not in a handler around it.

## Surfacing

- An uncaught exception prints a traceback and exits, fine for scripts, not for services. Long-running Python (a server, a worker) needs a top-level handler at each entry point that logs the full traceback (`logging.exception()` captures it automatically inside an `except`) and keeps the process alive for the next request.
- Use the `logging` module, not `print`, for errors, with levels (see `surfacing-errors.md`). `logging.exception()` inside an `except` block logs the message plus the full traceback at Error level, the right tool for recording a handled failure.
