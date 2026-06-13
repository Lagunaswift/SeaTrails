# Semantic structure and markup

The foundation. More accessibility problems trace back to non-semantic markup than to anything else, and most of them disappear when the right HTML element is used. Assistive technology understands an interface through its semantics: a screen reader announces a `<button>` as a button the user can press, but a `<div>` with a click handler is just text it reads past. Get the structure right and accessibility largely follows; get it wrong and no amount of ARIA fully recovers what the native element would have given for free.

## Use real interactive elements

The single most common and damaging mistake: building interactive controls from non-interactive elements.
- **Actions use `<button>`.** A real button is focusable, operable with Enter and Space, announced as a button, and disabled-able, all natively. A `<div onclick>` has none of this; keyboard users cannot reach or trigger it, and screen readers do not announce it as actionable. Recreating all that with `tabindex`, key handlers, and `role="button"` is fragile reinvention of what `<button>` does for free.
- **Navigation uses `<a href>`.** Links are focusable, keyboard-operable, announced as links, and work with browser navigation. A div that navigates on click is not a link to anyone not using a mouse.
- **Form controls use real form elements.** `<input>`, `<select>`, `<textarea>`, `<label>`, real controls come with labels, focus, keyboard behaviour, and screen-reader support built in.

The test: if it is clickable, is it a real button or link? If it takes input, is it a real form control? Clickable divs and spans are the headline accessibility bug in fast-built UIs.

## Heading hierarchy

Headings (`<h1>`–`<h6>`) are how screen-reader users understand and navigate page structure, they can jump between headings to scan, the way a sighted user skims. Requirements:
- A logical hierarchy: one main `<h1>`, sections under `<h2>`, subsections under `<h3>`, not chosen for visual size but for structural meaning. (Style separately; the level reflects structure, not appearance.)
- No skipped levels for visual reasons (h1 straight to h4).
- Headings that actually describe their section.

A page with no real headings, or headings chosen by how big they look, is a page a screen-reader user cannot navigate.

## Landmarks and regions

Landmark elements (`<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`) let assistive-tech users jump to the major regions of a page, skip to main content, go to navigation, directly. Without them, the user has to wade through everything linearly. Use the real landmark elements rather than generic divs for the page's major regions, and ensure there is a single `<main>` for the primary content.

## Lists, tables, and other structures

Mark up content as what it is: a list of items is a `<ul>`/`<ol>` (announced as "list, 5 items"), tabular data is a `<table>` with proper headers (so a screen reader can associate cells with their column/row headers), not a grid of divs. When structure is faked with generic elements, the meaning that assistive tech conveys is lost, the user hears a stream of text with no sense of the list, the table, the relationships.

## What to flag
- Clickable/interactive divs and spans that should be buttons or links (the top finding in most audits).
- Missing or illogical heading hierarchy; headings chosen by size.
- No landmark structure (everything in undifferentiated divs).
- Data tables or lists faked with divs, losing their semantics.

## The honest framing
Reach for the right native element before anything else. A real `<button>`, `<a>`, `<input>`, and a sensible heading-and-landmark structure give you focusability, keyboard operation, and screen-reader meaning for free, the things you would otherwise spend ARIA and JavaScript imperfectly reconstructing. The first accessibility pass on most apps is replacing the fake controls with real ones; it fixes more barriers per change than anything else.

## Connection to other references
This underpins keyboard-and-focus (native elements are keyboard-operable by default) and screen-readers-and-text (semantics are what screen readers convey). ARIA, used to patch genuine gaps, only works well on top of correct structure; it is covered where it is needed in those references, never as a substitute for this.
