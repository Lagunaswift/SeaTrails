# Right-to-left and bidirectional layout

Several major writing systems, Arabic, Hebrew, Persian, Urdu, read right-to-left, and hundreds of millions of people use them. An interface built left-to-right only does not merely look slightly off in RTL; it breaks, controls in the wrong place, text misaligned, the whole reading flow reversed from what it should be. Supporting RTL is both a layout-direction problem and a bidirectional-text problem.

## The layout must flip, not just the text

In an RTL locale, the entire layout mirrors: what was on the left goes to the right and vice versa. Navigation that was left-aligned becomes right-aligned, a back arrow points the other way, content flows from the right edge. This is more than translating the words, the spatial arrangement reverses. The job is making the layout direction-aware so it flips correctly when the locale is RTL.

## Use logical CSS properties, not physical ones

The key technical practice: write layout in terms of *logical* direction (start/end) rather than *physical* direction (left/right), so it adapts automatically:
- Use logical properties, `margin-inline-start` instead of `margin-left`, `padding-inline-end` instead of `padding-right`, `inset-inline-start`, `text-align: start` instead of `text-align: left`, and so on.
- Set the document/section `dir="rtl"` (and `lang`) for RTL locales, and let logical properties resolve "start" to the right and "end" to the left automatically.
- The anti-pattern is hard-coded `left`/`right`, which does not flip and leaves RTL layouts broken. Hard-coded physical directions throughout are the main thing that makes a codebase RTL-hostile.

Done with logical properties, a single layout serves both directions; done with physical properties, RTL needs a whole parallel set of overrides, fragile and incomplete.

## Bidirectional (bidi) text

Even within RTL content, some elements run left-to-right, numbers, Latin-script words, URLs, code, embedded in otherwise right-to-left text. This mixed-direction (bidirectional) content needs correct handling so the pieces sit in the right order and do not visually scramble. The Unicode bidirectional algorithm handles most of this automatically when the text direction is correctly marked, but:
- Mark the base direction correctly (the `dir` attribute) so the algorithm has the right context.
- User-generated content of unknown direction may need isolation (so an RTL username embedded in an LTR sentence, or vice versa, does not reorder surrounding text). Use direction isolation for inserted content of unknown direction.

## Mirroring icons and directional elements

Elements whose meaning depends on direction should mirror in RTL:
- Directional icons: back/forward arrows, "next" chevrons, progress indicators, undo/redo, these point the logical way, so they flip in RTL (a "back" arrow points right in RTL).
- But *not* everything mirrors: icons with intrinsic direction unrelated to reading (a clock, a checkmark, a logo) should not flip. The judgement is whether the icon's direction is about reading flow (mirror it) or is intrinsic (leave it).
- Layout-level directional things (which side a sidebar is on, slide-in direction) flip.

## What to flag
- Hard-coded `left`/`right` (physical properties) throughout, instead of logical start/end (makes RTL break, the core finding).
- No `dir`/`lang` handling for RTL locales.
- Mixed-direction content (numbers, Latin words in RTL text) not handled / no isolation for unknown-direction user content.
- Directional icons that do not mirror in RTL (back arrows pointing the wrong way).
- Layout tested only LTR, so RTL breakage is unknown.

## The honest framing
Supporting right-to-left is not a translation afterthought, it is a layout-direction requirement that affects the whole interface. The single practice that makes it tractable is using logical CSS properties (start/end) instead of physical (left/right) from the start, so the layout flips automatically; retrofitting RTL onto a codebase full of hard-coded left/right is a slog. Mark text direction correctly so bidirectional text resolves properly, mirror the icons whose meaning is directional, and actually test in an RTL locale, because the breakage is invisible until you do.

## Connection to other references
RTL is triggered by the locale (text-and-translation.md's locale handling sets `dir`). The layout flexing for both directions overlaps `frontend-design` (the design must work mirrored) and `frontend-robustness` (handling varied content). Unicode correctness underlies bidi text (unicode-and-encoding.md).
