# Timezones and time handling

The error class that causes real, costly bugs rather than mere awkwardness: a wrong-day booking, a deadline missed by hours, a "today" that is yesterday for half the users. Time is deceptively hard because the same instant has different local representations everywhere, and the developer's own timezone is an invisible assumption baked in until someone in another zone hits it.

## The core rule: UTC for storage and computation, local only for display

The discipline that prevents most timezone bugs:
- **Store every timestamp in UTC** (or as an absolute instant), not in local time. A row that says "2pm" without a zone is meaningless, 2pm where?
- **Compute in UTC.** Comparisons, durations, scheduling logic all work on the absolute instant, free of local ambiguity.
- **Convert to the user's local timezone only at the point of display**, using locale-aware formatting (formatting.md). The same stored UTC instant displays as different local times for users in different zones, correctly.

The anti-pattern is storing local times, or doing date logic in the server's local time, which produces an app that is correct only for users in the server's zone and subtly wrong for everyone else.

## Never assume the server's timezone is the user's

A pervasive hidden assumption: code uses the server's local time (or the developer's machine's) as if it were the user's. The server might be in UTC, in US-East, in whatever the host defaults to, none of which is the user's zone. "Today", "now", "end of day", "this week" all depend on *whose* timezone, and the answer must be the user's, not the server's. Determine the user's timezone (from their setting, or the browser) and compute user-facing day boundaries in it.

## The day-boundary problem

Many real bugs live at the boundary between a date and a time:
- "Show me today's orders", today ends at midnight in *whose* zone? An order placed at 11pm in Tokyo is a different calendar day than the UTC date suggests.
- A daily deadline, a "valid until" date, a "posted on" date, all need to resolve to the user's local day, not the server's.
- A date-only value (a birthday, a holiday) is different from a datetime, it has no time/zone and should not be shoved through timezone conversion (which can shift it to the wrong day). Treat date-only and instant-in-time as distinct types.

## Daylight saving and offset changes

Timezones are not fixed offsets, they shift with daylight saving, and the rules change over time and vary by region. This means:
- An offset like "UTC+1" is not a timezone; a timezone is a named region (e.g. `Europe/London`) whose offset varies through the year. Store/handle timezones as named zones, not fixed offsets, so DST is handled correctly.
- Times during a DST transition can be ambiguous or non-existent (the clock skips or repeats an hour); careful scheduling accounts for this.
- Use a proper timezone library / the platform's timezone-aware APIs, which carry the up-to-date zone database, never hand-calculate offsets.

## What to flag
- Timestamps stored in local time rather than UTC (the root cause of most timezone bugs).
- Date/time logic using the server's timezone as if it were the user's ("today"/"now" computed server-side).
- Fixed offsets used instead of named timezones (DST handled wrongly).
- Date-only values pushed through timezone conversion (shifting them to the wrong day).
- Hand-rolled offset math instead of a timezone-aware library.

## The honest framing
Store and compute in UTC, convert to the user's local zone only for display, and never assume the server's timezone is anyone's but its own. Handle timezones as named regions (so daylight saving is correct) and keep date-only values distinct from instants. These rules prevent the genuinely costly timezone bugs, the wrong-day booking, the deadline that passed hours early for some users, which are among the most common and most damaging i18n errors because they corrupt *data and decisions*, not just presentation.

## Connection to other references
Display formatting of the converted local time is formatting.md (locale-aware). Storing UTC instants and the date-vs-datetime type distinction is partly `data-modelling`. The user's timezone preference is stored like their locale (text-and-translation.md's persistence point).
