# Surfacing Errors at the Boundaries

Where errors reach the edges of the system, they get reported, and the same failure usually needs reporting differently to different audiences at once. A database timeout is, simultaneously: a clean "try again in a moment" to the user, a structured error response to an API caller, a logged stack trace with full context for whoever debugs it, and possibly an alert to whoever's on call. Surfacing well means serving all the relevant audiences from one failure, each with what *they* need and nothing they don't.

## Three audiences, three needs

- **The user** needs to know what happened in their terms and what to do about it. They do not need (and must not see) stack traces, internal identifiers, error codes from your database, or the underlying exception. "We couldn't save your changes, please try again" is useful; `SequelizeConnectionError at line 4823` is frightening, useless, and a small information leak.
- **The calling system** (for an API) needs a structured, consistent, machine-readable error it can program against: a stable error code, an appropriate status, a clear message, and enough detail to handle it, without internal implementation leaking through.
- **The operator/developer** needs the full truth: the complete error chain with its root cause, the stack, the context (which user, which operation, which input), and the timestamp, all in the logs. This audience gets everything the other two are spared.

The mistake is serving one audience's needs to another: showing the operator's stack trace to the user, or logging only the user's sanitised message so the operator can't debug. One failure, three renderings.

## User-facing messages

- **Say what happened and what to do.** "Payment couldn't be processed, your card wasn't charged, please check your details and retry" tells the user the outcome, reassures on the important point, and gives a next action. "Error" tells them nothing.
- **Match the message to the failure class.** A validation error should name the field and the fix ("email address is missing the @"); a transient failure should suggest retry ("temporarily unavailable, try again shortly"); an unexpected failure should apologise generically without exposing internals ("something went wrong on our end, we've been notified"). Collapsing all three into one generic message wastes the chance to help.
- **Never leak internals.** No stack traces, no raw exception text, no internal IDs, no SQL, no file paths, no dependency names. Beyond being unhelpful, these are reconnaissance for an attacker and a confidentiality leak. The clean outward message is also a security boundary.
- **Don't blame the user for system failures**, and don't claim user error when it's yours. Tone matters: the message is the system taking responsibility, not scolding.

## API error responses

- **Be consistent and structured.** Every error response should share one shape (an error code, a human-readable message, optionally a field/detail breakdown and a correlation id), so callers can handle errors uniformly instead of parsing prose. An API that returns errors in five different shapes is one every caller mishandles.
- **Use the right status semantics.** Distinguish client errors (the caller did something wrong, they should fix and not blindly retry) from server errors (your fault, retry may help) from "try later" (rate limit, temporary). The status is the caller's first signal for how to react; getting it wrong (a `200` with an error body, a `500` for a validation failure) breaks their handling.
- **Include a correlation id.** A unique id per request/error that appears in both the response and your logs lets a caller report "I got error abc123" and lets you find the exact failure with full context in your logs. This is the bridge between the sanitised outward error and the full internal one.
- **Stable error codes over message text.** Callers should branch on a stable code, not on the message string (which you'll want to reword). The code is the contract; the message is for humans.

## Logging vs alerting: a critical split

Logging and alerting are different jobs and conflating them breaks both:

- **Logging** records what happened for later investigation. Log failures with full context and the complete error chain, at a level that reflects severity. The log is the record you'll read *when you already know something's wrong* and need detail. Log generously; logs are cheap and the missing log line is the one you needed.
- **Alerting** interrupts a human *now* because something needs attention. Alert only on what genuinely warrants waking someone or breaking their focus: the system is failing, a dependency is down, error rates spiked, something is actively wrong. Alerting on every logged error trains everyone to ignore alerts (alert fatigue), and a muted alert is the same as no alert.

The distinction that drives the split: **expected, handled failures get logged, not alerted** (a user's invalid input is not an emergency); **unexpected or systemic failures get alerted** (the database is unreachable is an emergency). A system that alerts on every validation error is one where the real outage alert arrives in a flood nobody reads. Separate "record this" from "interrupt someone about this," and be far more selective with the second.

## Severity levels with meaning

Log levels are only useful if they mean something consistent, so you can filter "show me the real problems" from "show me everything." A rough, conventional split:

- **Error**: something failed that shouldn't have; needs investigation. Genuine failures, unexpected exceptions, unrecoverable operational errors.
- **Warning**: something recoverable or concerning happened; degraded behaviour, a fallback engaged, a retry was needed, approaching a limit. Worth noticing, not yet failing.
- **Info**: significant normal events; useful for tracing what happened without being a failure.
- **Debug**: detailed diagnostic noise, off in production normally, on when investigating.

The discipline is using them consistently: if half-handled routine conditions are logged as Error, "Error" stops meaning "real problem" and the level becomes useless for filtering. An expected, handled failure is at most a Warning, often just Info. Reserve Error for things that are actually wrong.

## Correlation across a request

For anything that spans multiple operations or services, carry a correlation/trace id through the whole request so all the log lines and errors for one user action can be tied together. Without it, a failure's log lines are scattered across services with no way to reassemble the story; with it, "what happened to request abc123" is answerable. This is the single highest-value logging practice for any system with more than one moving part.
