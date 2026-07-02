---
name: internationalisation
description: "Use this skill to build or assess an app for use across languages, regions, and writing systems: translation/localisation of text, locale-aware formatting of dates, numbers, and currency, timezone handling, right-to-left layouts, Unicode/encoding correctness, and the architecture that makes an app translatable at all. Trigger on phrases like 'i18n', 'l10n', 'internationalisation', 'localisation', 'translation', 'multiple languages', 'multi-language', 'locale', 'timezone', 'date formatting', 'currency formatting', 'right-to-left', 'RTL', 'Arabic/Hebrew layout', 'Unicode', 'character encoding', 'worldwide users', or when an app serves users in different countries/languages and the question is whether it works correctly for all of them. This is the works-everywhere lens. It does not cover the marketing copy itself (use anti-slop-writing) or visual design (use frontend-design). Defaults to a prioritised assessment of internationalisation gaps and the fixes. Applies to any app for a worldwide audience."
---

# Internationalisation

The lens for one question: **does this app work correctly for users in different languages, regions, and writing systems, or only for the developer's own?** An app built for one language and locale bakes in assumptions, English text hard-coded in the UI, dates as MM/DD/YYYY, currency with a dollar sign, times in the server's zone, layouts that assume left-to-right, then break or mislead for everyone else. Internationalisation (i18n) is the architecture that lets an app be adapted to any locale; localisation (l10n) is doing the adapting. For a worldwide audience, the cost of getting this wrong ranges from awkward (a German date misread) to broken (a right-to-left layout that falls apart) to financially serious (a timezone bug booking the wrong day).

This does not cover the quality of the source copy (`anti-slop-writing`) or visual aesthetics (`frontend-design`); it covers whether the app functions correctly across locales.

## The cardinal principle

**Separate content and locale from code from the start; retrofitting i18n is far harder than building it in.** The expensive mistake is hard-coding English strings, US date/number formats, and a single timezone throughout the codebase, then trying to internationalise later, which means hunting every hard-coded string and format across the whole app. Building with text externalised and formatting locale-aware from the beginning costs little; bolting it on afterward is a major refactor. Even an app launching in one language benefits from the structure, because expansion later is then trivial rather than a rewrite.

## Assessment by default, build guidance when asked

Default to assessing where the app is locale-locked, hard-coded text, fixed formats, timezone assumptions, layout that assumes one direction, in priority order with fixes. Give architecture guidance (string externalisation, formatting libraries) when asked to build rather than assess.

## The areas, in priority order

### 1. Text externalisation and translation architecture (the foundation)
You cannot translate text that is welded into the code. This is the structural prerequisite for everything else.
- Is user-facing text externalised into translation files/catalogues keyed by locale, or hard-coded in components and templates?
- Is there an i18n framework/library handling locale selection and string lookup, or nothing?
- Are strings written to be translatable (no concatenation that assumes English word order; placeholders for variables, not string-building)?
`references/text-and-translation.md` covers externalisation, translation files, the framework, and writing translatable strings.

### 2. Locale-aware formatting: dates, numbers, currency
The same data is written differently everywhere; hard-coded formats mislead or confuse.
- **Dates:** MM/DD/YYYY (US) vs DD/MM/YYYY (most of the world) vs YYYY-MM-DD, "03/04" is two different days depending on locale. Use locale-aware formatting, never hand-built date strings.
- **Numbers:** decimal and thousands separators differ (1,000.50 vs 1.000,50 vs 1 000,50). Hard-coding one misreads in others.
- **Currency:** symbol, position, and decimal convention vary; and showing a price needs the right currency, not just a translated number.
`references/formatting.md` covers locale-aware date/number/currency formatting and the standard tools (Intl APIs and equivalents).

### 3. Timezones and time handling
The error class that causes real, costly bugs (wrong-day bookings, missed deadlines).
- Store and compute times in UTC; convert to the user's local timezone only for display.
- Never assume the server's timezone is the user's; never store local times without their zone.
- Handle daylight-saving transitions and the date-vs-datetime distinction correctly.
`references/timezones.md` covers UTC storage, display conversion, DST, and the common booking/scheduling bugs.

### 4. Right-to-left and bidirectional layout
Whole writing systems (Arabic, Hebrew, Persian, Urdu) read right-to-left, and a left-to-right-only layout breaks for them.
- Does the layout flip correctly for RTL (using logical properties / direction-aware CSS, not hard-coded left/right)?
- Are mixed-direction content (LTR text in an RTL page, numbers, URLs) handled?
- Do icons/controls that imply direction (back arrows, progress) mirror appropriately?
`references/rtl-and-bidi.md` covers RTL layout, logical CSS properties, bidirectional text, and mirroring.

### 5. Unicode and character encoding
The foundation that, when wrong, corrupts text for everyone outside basic ASCII.
- Is everything UTF-8 end to end (storage, transport, display), so accented, CJK, emoji, and all scripts survive intact?
- Are string operations Unicode-aware (length, truncation, sorting that respects locale rules), not byte-based assumptions that break on multibyte characters?
- Are names, addresses, and inputs accepting the full range of real-world characters, not just A-Z?
`references/unicode-and-encoding.md` covers UTF-8 everywhere, Unicode-aware string handling, and accepting real names/input.

### 6. Locale-aware content and edge cases
The subtler adaptations beyond text and format.
- Pluralisation rules differ by language (not just one/many; some languages have several plural forms); use the framework's plural handling, not "if count === 1".
- Text expansion: translated text can be much longer (German) or shorter; layouts must flex, not assume English length.
- Locale-specific content: addresses, phone formats, name order (family-name-first cultures), units (metric/imperial), first day of the week.
`references/locale-edge-cases.md` covers pluralisation, text expansion, and culturally-variable formats.

## How to report
Order by impact: hard-coded text (blocks translation entirely) and timezone bugs (cause real wrong-data errors) before subtler issues like text expansion. For each: the locale-locked assumption, who it breaks for, and the fix. Distinguish "this prevents the app working in other locales at all" from "this is awkward in some locales." Note that some issues only surface with actual non-English content and RTL testing.

## Scoping
Match to actual reach and plans. An app firmly for one locale with no expansion plans may legitimately defer most of this, but the cheap structural parts (UTF-8 everywhere, externalised strings, locale-aware date/number formatting, UTC time storage) are worth doing even then, because they cost little now and save a painful refactor if it ever goes international. For a genuinely worldwide app, the full set applies. The honest output for a single-locale app with worldwide ambitions is "you are locale-locked in these ways; the structural fixes (externalise text, format by locale, store UTC) are cheap now and expensive later, do those even before you translate."

## What to produce under a production-audit

Standalone, report as prose per "How to report". As a lens under `production-audit`, emit findings in the canonical schema (`production-audit/references/finding-schema.md`) instead, appended to the run's `raw-findings.jsonl` as discovered: prefix `I18N`, category `i18n` (its only category). The schema overrides the prose format above.

## Skills this leans on
- `frontend-design`: layouts must flex for text expansion and flip for RTL, the design has to accommodate i18n, not fight it
- `anti-slop-writing`: the quality of the source strings being translated (separate from the i18n mechanics)
- `data-modelling`: storing locale, timezone, and Unicode text correctly is partly a data-shape question
- `frontend-robustness`: text expansion and unexpected characters overlap defensive rendering (long/varied strings not breaking layout)
