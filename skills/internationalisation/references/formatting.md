# Locale-aware formatting: dates, numbers, currency

The same underlying value is written differently in different locales, and hard-coding one locale's format does not just look foreign elsewhere, it actively misleads. "03/04/2025" is March 4th to an American and April 3rd to nearly everyone else. The rule throughout: never hand-build these formats; use locale-aware formatting that adapts to the user's locale.

## Dates and times

Date format varies sharply by locale:
- Order: MM/DD/YYYY (US), DD/MM/YYYY (most of Europe and much of the world), YYYY/MM/DD (much of East Asia).
- Separators, month names, and whether months/days are named or numbered all vary.
- 12-hour vs 24-hour clocks.

A hand-built date string (`month + "/" + day + "/" + year`) is locked to one locale and ambiguous or wrong in others. Use locale-aware date formatting (the platform's `Intl.DateTimeFormat` in JS, or the equivalent in any stack), which takes a date and a locale and produces the correctly-formatted string. This also interacts with timezones (timezones.md), format for display in the user's locale *and* zone.

## Numbers

Numeric formatting differs in ways that change meaning:
- **Decimal separator:** `1.5` (US/UK) vs `1,5` (much of Europe), the comma and period swap roles.
- **Thousands separator:** `1,000,000` vs `1.000.000` vs `1 000 000` (space) vs the Indian system (`10,00,000`).
- So `1,000` could be one thousand or one (with a decimal comma) depending on locale, genuine ambiguity.

Use locale-aware number formatting (`Intl.NumberFormat` or equivalent), never string-manipulate numbers into display form by hand. Parsing user-entered numbers must also respect their locale's separators.

## Currency

Currency combines several locale-and-currency-specific things:
- **The symbol and its position:** `$1,000.00`, `1.000,00 €` (symbol after, in many European locales), `€1.000,00`, and so on.
- **Decimal places:** most currencies use 2, some use 0 (Yen) or 3, hard-coding 2 is wrong for some.
- **The currency itself:** showing a price is not just formatting a number, it must carry the correct currency. Translating a price's *number* without handling currency (showing "1,000" without making clear it is yen vs dollars vs euros) is meaningless or misleading.

Use locale-and-currency-aware currency formatting (`Intl.NumberFormat` with currency style). And keep the distinction clear: the *display format* is locale-driven; the *currency* is a product/data decision (what currency is this price in), which may also involve conversion, a separate concern from formatting.

## The standard tools
Most modern platforms provide locale-aware formatting built in (the `Intl` family in JavaScript: `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat`, `Intl.PluralRules`; equivalents elsewhere). Use them. They encode the locale rules so you do not have to, and they are far more correct than anything hand-built. Reaching for manual string formatting of dates/numbers/currency is the anti-pattern.

## What to flag
- Hand-built date strings (locale-locked, ambiguous, the highest-impact formatting bug because it misleads about *which day*).
- Hard-coded number formatting (wrong separators in other locales).
- Currency shown with a fixed symbol/format, or a price number without clear currency.
- Parsing user-entered dates/numbers assuming one locale's format.

## The honest framing
Dates, numbers, and currency are written differently around the world, and hard-coding one locale's format is not a cosmetic issue, it makes data ambiguous or wrong for everyone else (a misread date can mean a missed appointment; a misread number can mean a tenfold error). Use the platform's locale-aware formatting for all three, driven by the user's locale, and never hand-assemble these formats. The tools exist precisely because the rules are too varied to get right by hand.

## Connection to other references
Date display depends on timezone too (timezones.md), format in the user's locale and zone. Plural forms (for "1 item" vs "2 items") are locale-edge-cases.md. The currency-vs-conversion distinction touches product/data decisions beyond formatting.
