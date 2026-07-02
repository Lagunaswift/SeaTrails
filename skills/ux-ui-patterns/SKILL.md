---
name: ux-ui-patterns
description: "Use this skill whenever building, designing, or reviewing user interfaces and user experiences for web or mobile applications. Covers interaction design patterns, state handling (loading, empty, error, success), form design, navigation and information architecture, data display, accessibility, responsive and mobile design, and microcopy. Trigger on any mention of: UX, UI patterns, user experience, usability, form design, error states, loading states, empty states, accessibility, a11y, responsive design, mobile design, navigation patterns, data tables, dashboard layout, onboarding flow, search UX, filter UX, pagination, modal design, toast notifications, or any request to build an interface where the interaction design matters. Also trigger when reviewing or improving an existing interface's usability. This skill covers how interfaces work. For how they look (aesthetics, visual design, anti-AI-patterns), see the frontend-design skill."
---

# UX and UI Patterns

This skill covers interaction design, usability, and user experience decisions. It tells you how interfaces should work, not how they should look. For visual design and aesthetics, see the `frontend-design` skill. These two skills are complementary — apply both when building interfaces.

Before building any interface, read the relevant reference files:

- `states-and-feedback.md` — Loading, empty, error, success, partial, offline states. Skeleton screens, progress indicators, toast/notification patterns, confirmation dialogs, optimistic updates, double-click prevention, button loading states, form submission guards, debouncing, drag-and-drop feedback, animation as feedback, perceived responsiveness thresholds
- `forms-and-input.md` — Form layout, validation, multi-step forms, inline editing, search, filtering, sorting, autocomplete, date/time pickers, file uploads
- `navigation-and-structure.md` — Information architecture, nav patterns, tabs, sidebars, command palettes, breadcrumbs, pagination, infinite scroll, deep linking, back button behaviour
- `data-display.md` — Tables, lists, cards, dashboards, charts, detail views, comparison views, master-detail, timelines, real-time data
- `accessibility.md` — WCAG compliance, keyboard navigation, screen readers, colour contrast, touch targets, focus management, reduced motion, ARIA, semantic HTML
- `responsive-and-mobile.md` — Breakpoints, touch targets, mobile navigation, bottom sheets, gestures, adaptive content, viewport considerations, thumb zones
- `microcopy.md` — Button labels, error messages, empty state copy, onboarding text, tooltips, confirmation dialogs, placeholder text, success messages

---

## Core Principles

### 1. The Interface Disappears When It Works

The user should not think about the interface. They think about their task. Every moment they spend figuring out where to click, what a label means, or why something is not responding is a failure of design. The goal is zero friction between intent and outcome.

### 2. Every State Is a Design Decision

A component has at minimum five states: empty, loading, loaded, error, and partial. Most MVPs design only the loaded state and treat the rest as afterthoughts. Production interfaces design all five deliberately, because users spend significant time in non-ideal states.

### 3. Show, Do Not Ask

If you can infer or default, do it. Every question you ask the user is a decision you are forcing them to make. Defaults should be the most common choice. Settings should be progressive — show the simple version, let advanced users dig deeper.

### 4. Feedback Is Immediate

Every user action produces visible feedback within 100ms. A button press changes visually. A form submission shows a loading state. A deletion shows confirmation. Silence is the enemy — if the user cannot tell whether their action registered, they will try again, causing duplicate actions or frustration.

### 5. Errors Are Recoverable

Every error state includes: what went wrong (in human language), why it happened (if knowable), and what the user can do about it. "Something went wrong" is a failure of error design. "Your file is too large (52MB). The maximum is 25MB. Compress or split the file and try again." is useful.

### 6. Consistency Within, Convention Without

Be consistent with your own patterns (same component behaves the same way everywhere in your app). Follow platform conventions for standard interactions (back button, pull to refresh, swipe to delete). Break conventions only when you have a measurably better alternative, not when you want to be clever.

---

## Quick Reference: Which File to Read

```
Building a form                    → forms-and-input.md
Building search or filters         → forms-and-input.md
Handling loading/error/empty        → states-and-feedback.md
Adding toast notifications          → states-and-feedback.md
Designing confirmation flows        → states-and-feedback.md
Preventing double clicks/submissions → states-and-feedback.md
Button loading states               → states-and-feedback.md
Building a data table               → data-display.md
Building a dashboard                → data-display.md
Choosing a navigation pattern       → navigation-and-structure.md
Adding pagination or infinite scroll → navigation-and-structure.md
Making something accessible         → accessibility.md
Building for mobile                 → responsive-and-mobile.md
Writing button labels or errors     → microcopy.md
Writing onboarding or empty states  → microcopy.md
```

---

## The Five-State Checklist

Before shipping any component or page, verify you have designed these states:

```
[ ] Empty state     — What does the user see before any data exists?
[ ] Loading state   — What does the user see while data is being fetched?
[ ] Loaded state    — What does the user see with data present? (This is the one everyone designs.)
[ ] Error state     — What does the user see when something fails?
[ ] Partial state   — What does the user see with incomplete or degraded data?
```

If any of these is "a blank white screen" or "the browser's default error page," the component is not finished.

---

## Common UX Failures

**No loading state.** The user clicks a button, nothing happens for 3 seconds, then the result appears. They have already clicked it two more times. Show a loading indicator within 100ms. Disable the button during processing.

**Destructive actions without confirmation.** A single click deletes data permanently. Add confirmation for any action that cannot be undone. Better: make actions undoable (soft delete with undo toast) so confirmation is unnecessary.

**Validation only on submit.** The user fills out 12 fields, submits, and discovers three errors at the top of the page. Validate inline as the user completes each field. Show errors next to the field that caused them, not in a list at the top.

**Modal overuse.** Every interaction opens a modal. Modals interrupt flow and stack context. Use modals for confirmation of destructive actions and short forms. Use inline expansion, drawers, or new pages for anything complex.

**Infinite scroll without position memory.** The user scrolls through 200 items, clicks one, goes to a detail view, presses back, and is sent to the top of the list. Preserve scroll position. Provide a way to jump back to where they were.

**Settings that require technical knowledge.** A toggle labelled "Enable WebSocket transport" means nothing to a non-technical user. Label settings by what they do for the user, not how they work internally. "Real-time updates" is the user-facing version.

**No empty state guidance.** A new user arrives at a dashboard that says "No data." What are they supposed to do? Empty states should explain why it is empty and what action will fill it. "No conversations yet. Start a new conversation to see your history here." with a prominent action button.

**Error messages written for developers.** "Error: ECONNREFUSED 127.0.0.1:5432" means nothing to a user. "We are having trouble connecting. Please try again in a moment." is what they need.

**Pagination that resets context.** The user is on page 7 of search results, opens a result, presses back, and lands on page 1. Preserve pagination state in the URL so back navigation works.
