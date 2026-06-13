# Runtime and interaction performance

Why an app janks *after* it has loaded. A page can load fast and still feel bad if interactions are sluggish, scrolling stutters, or the UI freezes during work. This is main-thread performance: the browser does rendering and JavaScript on one thread, so heavy work there blocks everything, including responding to the user.

## The main-thread problem

The main thread handles JavaScript execution, layout, and painting. While it is busy with a long task, it cannot respond to input, the page is frozen, even if it looks loaded. This shows up as poor INP (interaction to next paint): the user clicks and nothing happens for a moment. The goal is keeping the main thread free to respond, by avoiding long tasks and moving heavy work off it.

**Long tasks blocking interaction.**
A chunk of synchronous JS that runs for hundreds of milliseconds (heavy computation, processing a large dataset, a giant synchronous loop) blocks input for its whole duration. Fixes: break long tasks into smaller chunks that yield to the browser, move heavy computation to a Web Worker (a separate thread), or do the work incrementally rather than all at once.

## Unnecessary re-rendering (component frameworks)

In React/Vue/etc., a common runtime cost is components re-rendering when they did not need to, a parent re-renders and cascades to children whose data did not change, an expensive computation runs on every render, a new object/function created each render defeats memoisation. The symptoms are jank during interaction and sluggish updates. The disciplines:
- Render only what changed; prevent cascades where children's inputs are unchanged (memoisation where it genuinely helps, not everywhere).
- Do not recompute expensive values on every render; cache them.
- Avoid creating new references each render where they feed equality checks.

Measure first (the framework's profiler shows what re-renders and why), the common mistake is sprinkling memoisation everywhere on a hunch, which adds complexity and can slow things down. Find the actual hot component, fix that.

## Large lists

Rendering a long list (thousands of rows) all at once creates thousands of DOM nodes, slow to create, heavy in memory, janky to scroll. Virtualisation (windowing) renders only the rows currently visible plus a small buffer, recycling as the user scrolls, so a list of any length costs about the same as a screenful. For any list that can grow large, virtualise it.

## Other runtime costs
- **Layout thrash:** repeatedly reading and writing layout properties in a loop forces the browser to recalculate layout many times. Batch reads and writes.
- **Heavy work on scroll/resize/input events** that fire rapidly, without throttling/debouncing, runs the handler far more than needed. Throttle or debounce high-frequency handlers.
- **Memory growth** (also a scaling concern): listeners not cleaned up, caches that only grow, leading to slowdown over a long session.

## What to flag
- Long synchronous tasks blocking interaction (poor INP), found via the profiler.
- A specific hot component re-rendering excessively (framework profiler), not a vague "add memoisation everywhere."
- Large lists rendered without virtualisation.
- High-frequency event handlers without throttle/debounce.

## The honest framing
Runtime performance is about keeping the main thread free to respond to the user. Measure with the profiler to find the actual long tasks and hot components, then fix those specifically, break up or offload long work, virtualise big lists, and stop the genuinely-excessive re-renders. Do not memoise on a hunch; it adds complexity and often does not help. As with all performance work: measure, fix the real bottleneck, measure again.

## Connection to other skills
`state-management` overlaps where re-rendering is driven by how state is structured and updated. `refactoring` governs the changes. Memory growth over a session also touches `scaling-audit`.
