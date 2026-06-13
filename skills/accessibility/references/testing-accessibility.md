# Testing accessibility

How to actually know whether an interface is accessible, rather than assuming. The central truth: automated tools catch only part of the picture, and the most important barriers are found only by using the interface the way disabled users do. A clean automated scan is a floor, not a pass.

## Automated tools: necessary, not sufficient

Automated accessibility checkers (axe, Lighthouse's accessibility audit, WAVE, and similar) scan the page and flag violations they can detect programmatically. They are fast, repeatable, and worth running, ideally in CI so regressions are caught. What they reliably catch:
- Missing alt attributes, missing form labels.
- Colour contrast below thresholds.
- Missing accessible names on some controls.
- Certain ARIA misuse and structural issues.

What they **cannot** catch, which is the majority of real-world barriers:
- Whether alt text is *meaningful* (it can see alt exists, not whether it describes the image well).
- Whether the keyboard experience actually works (focus order making sense, no traps, dynamic focus management).
- Whether the screen-reader experience is coherent (does the page make sense read aloud, are changes announced).
- Whether labels actually describe their fields, whether errors are understandable, whether the flow is usable.

Studies and practice consistently find automated tools catch only a minority (often cited around a third) of WCAG issues. So: run them, fix what they find, but **never report "accessible" on an automated pass alone.** That is the most common false claim in this area.

## The keyboard test (do this always)

The cheapest, highest-value manual test: put the mouse aside and operate the entire interface with the keyboard.
- Tab through everything, can you reach every control?
- Operate every control (buttons, menus, forms, dialogs) with the keyboard?
- Is the focus indicator always visible, so you can see where you are?
- Does focus order make sense, no jumping around?
- Can you always move focus on, no traps (except escapable modals)?
- In dynamic UI, does focus move sensibly when things open, close, and change?

This single test surfaces a large share of real barriers and needs no special tools.

## The screen-reader test (the real check)

The only way to know the non-visual experience is to use a screen reader, VoiceOver (built into macOS/iOS), NVDA (free, Windows), TalkBack (Android), or Narrator (Windows). Navigate the key flows with the screen on or off:
- Is every control announced with a meaningful name and role?
- Do images convey the right thing (described where meaningful, skipped where decorative)?
- Are forms labelled, and are errors announced and findable?
- Are dynamic changes (success, errors, results) announced?
- Does the page have a navigable heading/landmark structure?
- Does the whole flow make sense as speech?

It takes practice to use a screen reader, but even a basic pass through the main flows reveals barriers nothing else will.

## A practical testing routine
1. **Automated scan** (axe/Lighthouse), ideally in CI, fix what it flags. The fast floor.
2. **Keyboard pass**, mouse aside, complete every key task. Catches the operability barriers.
3. **Screen-reader pass** through the main flows. Catches the non-visual-experience barriers.
4. **Zoom/contrast check**, 200% zoom, contrast ratios, greyscale for colour-alone (see colour-and-visual).
5. Ideally, **real users** with disabilities for anything high-stakes, nothing substitutes for actual usage.

## What to flag
- Reliance on automated testing alone (claiming accessible from a clean scan).
- No keyboard testing (the cheapest test, often skipped).
- No screen-reader testing (so the non-visual experience is unknown).
- No accessibility checks in CI to prevent regressions.

## The honest framing
Run the automated tools, but treat them as the floor: they prove the absence of some problems, never the presence of accessibility. The keyboard pass and a basic screen-reader pass through the main flows find the barriers that actually exclude people, and they cost little but attention. The honest statement after an automated scan is "no automated violations found, manual keyboard and screen-reader testing still needed to confirm," never "it's accessible."

## Connection to other skills
`testing-strategy` for building automated a11y checks into the test/CI suite. The manual passes verify what the other references in this skill prescribe, structure, keyboard/focus, screen-reader support, colour, forms.
