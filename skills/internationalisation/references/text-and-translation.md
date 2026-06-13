# Text externalisation and translation architecture

The structural foundation of internationalisation. You cannot translate text that is hard-coded into components, templates, and logic, it has to live somewhere a translator can reach and the app can swap by locale. Getting this architecture right is the prerequisite for everything else; getting it wrong means the app cannot be translated at all until it is refactored.

## Externalise all user-facing text

Every string a user sees, labels, buttons, messages, errors, placeholders, emails, must be externalised: pulled out of the code into translation files (catalogues) keyed by a string identifier, with one file or set per locale. The code references a key (`t('checkout.submit')`); the framework looks up the right translation for the current locale. Hard-coded text (`<button>Submit</button>`) is invisible to translators and locked to one language.

The test: scan for user-facing literal strings sitting directly in components, templates, and server responses. Each one is untranslatable until externalised. The common fast-built state is English text strewn throughout the code, which is exactly the expensive-to-retrofit situation.

## Use an i18n framework

Do not hand-roll locale handling. Established i18n libraries (the ecosystem has mature ones for every stack) handle: detecting/selecting the user's locale, loading the right translation catalogue, looking up keys, falling back when a translation is missing, and the harder parts (pluralisation, interpolation, formatting). Rolling your own gets the easy part and misses the hard parts (especially plurals, see locale-edge-cases). The framework is the machinery; the translation files are the content.

## Locale selection and fallback
- **Detection:** how the app decides the user's locale, from their account setting, the browser's `Accept-Language`, a URL segment, or an explicit switcher. A well-built app respects an explicit user choice over a guessed one.
- **Fallback:** when a string is not translated in the user's locale, fall back to a default (often English) rather than showing a blank or the raw key. A half-translated app should degrade to readable, not broken.
- **Persistence:** remember the user's choice across sessions.

## Writing translatable strings

How strings are written determines whether they *can* be translated well:
- **No concatenation that assumes word order.** Building `"You have " + count + " messages"` by gluing pieces assumes English structure; other languages order words differently. Use a single template string with named placeholders (`"You have {count} messages"`) so the translator controls the whole sentence and its order.
- **Placeholders for variables, not string-building.** Pass values into the translation, do not assemble sentences from fragments in code.
- **Full sentences, not stitched fragments.** A sentence split across several keys (`"Click "` + link + `" to continue"`) is hard to translate because the order and grammar around the link vary by language. Keep translatable units whole.
- **Give translators context.** A key like `submit` is ambiguous; comments or descriptive keys help translators choose the right word (a "submit" button vs "submit" a form differ in many languages).
- **Avoid embedding meaning in formatting** that will not survive translation.

## What to flag
- User-facing text hard-coded in components/templates/responses (the foundational blocker, makes the app untranslatable).
- No i18n framework (locale handling absent or hand-rolled).
- String concatenation building sentences from fragments (assumes English word order, untranslatable well).
- No fallback for missing translations (blank or raw keys shown).

## The honest framing
The first and most important i18n decision is structural: externalise every user-facing string into translation catalogues and use a real i18n framework, from the start. This is cheap when built in and a large, error-prone hunt-and-replace when retrofitted. Write strings as whole templated sentences with placeholders, not concatenated fragments, so they can actually be translated well rather than just word-swapped. Even an app shipping in one language should do this, because it makes going multilingual later a content task, not a code rewrite.

## Connection to other references
The framework's handling of plurals and interpolation connects to locale-edge-cases.md. The source-string quality (clear, well-written English to translate from) is `anti-slop-writing`. Storing the user's locale preference is partly `data-modelling`.
