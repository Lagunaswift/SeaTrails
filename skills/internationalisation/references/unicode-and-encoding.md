# Unicode and character encoding

The foundation beneath all the others. If encoding is wrong, text corrupts for everyone outside basic English, accented characters become mojibake (Ã© instead of é), CJK turns to question marks or boxes, emoji vanish or break. Get this wrong and no amount of translation or formatting helps, because the characters themselves are being mangled. Get it right and it is invisible, which is the goal.

## UTF-8 everywhere, end to end

The single rule: use UTF-8 consistently across the entire stack, with no gaps where a different (or assumed) encoding can creep in:
- **Storage:** the database, tables, and columns set to a full UTF-8 encoding (note that some systems have a "utf8" that is *not* full Unicode, e.g. MySQL's historic `utf8` excludes 4-byte characters like many emoji and some CJK; use the genuinely-full variant like `utf8mb4`). Connection charset also UTF-8.
- **Transport:** HTTP responses declaring `charset=utf-8`; request bodies and APIs handling UTF-8.
- **Files and templates:** source and content files saved as UTF-8.
- **Display:** the page declaring UTF-8 (`<meta charset="utf-8">`).

The classic corruption happens at a boundary where one layer assumes a different encoding than another, the data is fine in the database but garbled on the page, or vice versa. Consistency across every hop is what prevents it. A single non-UTF-8 link in the chain corrupts everything passing through it.

## Unicode-aware string operations

Beyond encoding, string *operations* must not assume one character equals one byte or one code unit:
- **Length and truncation:** a character can be multiple bytes (and even multiple code units, or multiple code points for a single visual character, like an emoji with a skin-tone modifier). Truncating by byte count can cut a character in half, producing corruption; counting "characters" naively can miscount. Use Unicode-aware length/truncation, and beware truncating in the middle of a grapheme.
- **Sorting and comparison:** alphabetical order is locale-specific (German, Swedish, and Spanish sort certain characters differently; accented characters have locale-dependent ordering). Use locale-aware collation for sorting user-facing lists, not raw byte/code-point comparison, which produces wrong-looking order.
- **Case conversion:** upper/lowercasing has locale-specific rules (the Turkish dotted/dotless i is the famous example). Be cautious with case operations on user text.
- **Searching/matching:** may need to be accent- and case-insensitive in a locale-aware way.

## Accept real-world characters in input

A frequent, exclusionary bug: input validation that only accepts ASCII / A-Z, rejecting perfectly valid real names and data:
- **Names** contain accents, non-Latin scripts, apostrophes, hyphens, spaces, characters from every writing system. A "letters only, A-Z" name validator rejects a large fraction of real human names and is both broken and insulting. Accept the full range of Unicode letters.
- **Addresses, cities, and other free text** likewise span all scripts.
- Validate for genuine constraints (length, presence, a real email shape), not for an ASCII-only character set that excludes most of the world's names.

## What to flag
- Encoding not UTF-8 at some layer (storage, connection, transport, or display), or a partial "utf8" that drops 4-byte characters (emoji/some CJK).
- Byte-based string length/truncation that can split characters.
- Raw (non-locale-aware) sorting of user-facing text.
- Input validation restricting to ASCII / A-Z, rejecting valid non-English names and data.

## The honest framing
UTF-8 end to end is non-negotiable for any app serving a worldwide audience, one non-UTF-8 link in the chain corrupts text for everyone outside basic English, and the failure is the unmistakable garble of mojibake or boxes. Beyond encoding, treat strings as Unicode (not bytes) when measuring, truncating, and sorting, and never restrict input to ASCII, because real names and data use every script there is. This layer is invisible when correct and catastrophic when wrong, which is why it underpins everything else in internationalisation.

## Connection to other references
Correct encoding underlies bidirectional text (rtl-and-bidi.md) and all displayed translated content (text-and-translation.md). Storing full Unicode correctly is a `data-modelling` and `release-and-ops` (database config) concern. Accepting varied input without breaking overlaps `frontend-robustness` (defensive handling of unexpected characters) and the never-trust-input security boundary.
