# Reading Errors and Stack Traces

An error message is usually the single richest piece of evidence you have, and it's the most commonly skimmed. Read the whole thing before you do anything else. Treat it as a witness statement, not noise to scroll past.

## Read it top to bottom, then bottom to top

A stack trace has two ends and they tell you different things:

- **The innermost frame (where it threw)** tells you *what* failed: the exact operation, file, and line. This is where the error was raised, not necessarily where the bug is.
- **The outermost frame (the entry point)** tells you *how you got there*: the call path that led to the failure.

The bug usually lives somewhere on the path between them, often where *your* code calls into something else. Scan past the library frames to find the last line of your own code in the trace. That's your first suspect.

## Extract every fact the error gives you

Before forming any theory, list what the error literally states:

- **The exception type.** `TypeError` vs `ValueError` vs `KeyError` vs a custom domain error are completely different problems. The type narrows the cause more than the message does.
- **The exact message text**, including any interpolated values. "Cannot read property 'name' of undefined" tells you a specific access on a specific undefined thing. The interpolated value (a null id, an empty string, a wrong type) is a clue people discard.
- **The file and line**, confirmed against the actual running build, not the source you're looking at. A line number that points at a blank line or the wrong code means you're reading a different build than the one that ran (stale bundle, wrong deploy, missing source map).
- **The error code or errno** if present (`ECONNREFUSED`, `ENOENT`, HTTP status, database error number). These are precise and searchable.

## Distinguish the error from the cause

The error is a symptom that surfaced at a specific point. The cause is often upstream:

- "Undefined is not a function" at the point of call usually means the *real* bug is wherever that value was supposed to be assigned and wasn't.
- A database constraint violation surfaces at the write, but the cause is whatever produced the invalid data, possibly several steps earlier.
- A timeout surfaces at the caller, but the cause is in whatever it was waiting on.

Ask: "What had to already be true for this error to fire here?" That question walks you upstream toward the cause.

## Wrapped, chained, and swallowed errors

- **Chained errors** ("caused by" / `from` / nested `cause`): read the *original* error at the bottom of the chain, not just the top wrapper. Frameworks love to re-wrap an error three times; the innermost one is the truth.
- **Swallowed errors**: a bare `catch {}` or `except: pass` somewhere will have eaten the real error and produced a vague secondary symptom elsewhere. If the symptom makes no sense, search the code path for empty catch blocks that hid the first failure.
- **Re-thrown without context**: if a catch re-throws a new generic error, the stack trace may point at the re-throw site, not the origin. Find the original throw.

## Multi-error output

When several errors print at once:

- The **first** error is usually the cause; the rest are often cascade damage from it. Fix the first, then re-run before touching the others.
- Exception: in async/concurrent output, ordering is not reliable. Match errors to their source by content, not print order.

## When the line number lies

If the trace points somewhere that can't be right:

- You're running a different build than you're reading (stale cache, wrong branch deployed, container not rebuilt).
- Source maps are missing or wrong, so the line maps back to minified or transpiled code. Fix the source maps before trusting any line number.
- The error is thrown inside a macro, decorator, generated code, or hot-reloaded module where line attribution is unreliable.

Confirming "am I even reading the code that ran?" belongs here, and it's one of the highest-value checks when nothing makes sense.

## No stack trace at all

Some failures give you nothing: a silent wrong result, a hang, a process that exits 0 with bad output. Then the error-reading skill is moot and you fall back to the locate phase: binary-search the data flow to find where good becomes bad. See the main loop, phase 2.
