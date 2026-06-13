# Locale-aware content and edge cases

The subtler adaptations beyond translating text and formatting dates, the ones that are easy to miss because English happens not to need them. These bite specific locales hard even when the basics are right.

## Pluralisation

English has two plural forms (one item / many items), so developers write `count === 1 ? "item" : "items"`. Many languages have more, and different rules:
- Some languages have a single form regardless of count; others have two, three, four, or more (Arabic has six plural categories; Russian and Polish have several based on the number's ending).
- The "if count is 1" logic is simply wrong for these, it produces grammatically broken text in any language whose plural rules differ from English.

The fix: use the i18n framework's pluralisation support (backed by `Intl.PluralRules` or CLDR plural rules), which selects the correct form for the count *and* the locale. Translators provide each plural form the language needs; the framework picks the right one. Never hand-write plural logic with an English-shaped conditional.

## Text expansion and contraction

Translated text is rarely the same length as the English source:
- German and Finnish often run much longer (compound words, longer constructions), translated UI text can be 30 to 100 percent longer than English.
- Some languages run shorter.
- CJK text may be shorter in character count but need different line-height.

A layout built tightly around English string lengths breaks when text expands, buttons overflow, labels truncate or wrap awkwardly, fixed-width elements clip. The fix: design layouts that flex with content length (no fixed widths assuming English; room to grow; graceful wrapping), and test with the longest realistic translations (German is a good stress test). This overlaps `frontend-robustness` (long strings not breaking layout) and `frontend-design` (flexible layouts).

## Name and address formats

Highly variable and frequently got wrong:
- **Name order:** "first name / last name" is not universal, many cultures put the family name first, some use a single name, some have multiple family names. Forms that force "First name" + "Last name" mis-handle a large fraction of the world. Where possible, use a single "full name" field, or be thoughtful about ordering and not assume Western structure.
- **Address formats** vary enormously, field order, whether postcodes exist, state/province presence, building/street conventions. A rigid US-style address form (street, city, state, ZIP) does not fit most countries. Allow flexible address entry rather than forcing one country's shape.
- **Honorifics and name display** (family-name-first display in some locales) vary.

## Other culturally-variable formats
- **Phone numbers:** formats and lengths differ by country; validate/format per country rather than one pattern.
- **Units:** metric vs imperial (distance, weight, temperature), show in the user's expected units.
- **First day of the week:** Sunday vs Monday (and others) varies, calendars and date pickers should respect the locale's week start.
- **Postal codes:** present in some countries, absent in others, format varies, do not require a "ZIP code" universally or validate it US-style.

## What to flag
- Pluralisation done with English-shaped `count === 1` logic (breaks in many languages).
- Layouts built tightly around English string lengths (break on text expansion, German especially).
- Rigid first-name/last-name and US-style address forms that do not fit other cultures.
- Phone/postcode validation assuming one country's format; units or week-start hard-coded to one locale.

## The honest framing
These are the locale edge cases that English does not force you to think about, so they get missed: real pluralisation (use the framework's, not an English `=== 1`), layouts that survive much-longer translations, and forms that do not assume Western name and address structure. None is exotic, each affects large populations, and each makes the app feel either genuinely localised or carelessly English-first. Handle plurals through the framework, build flexible layouts, and design forms (names, addresses, phones, postcodes, units, week-start) that do not bake in one country's conventions.

## Connection to other references
Pluralisation runs through the i18n framework (text-and-translation.md) and the `Intl` family (formatting.md). Text expansion overlaps `frontend-robustness` (long strings) and `frontend-design` (flexible layout). Storing names/addresses flexibly is `data-modelling`.
