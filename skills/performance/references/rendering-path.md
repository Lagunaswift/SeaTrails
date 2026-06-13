# The critical rendering path

What stands between the page loading and the user seeing and using it. Even with light assets and a small bundle, a page can feel slow if it blocks on the wrong things before painting, or makes the user wait for everything before showing anything.

## Render-blocking resources

**Synchronous scripts and styles in the head.**
A script tag without `async`/`defer` in the head blocks the browser from rendering until that script downloads and runs. A large stylesheet blocks paint until it loads. These render-blocking resources delay first paint, the user stares at a blank page while they load.
- Scripts that are not needed for first paint should be `defer` (run after parse) or `async` (run when ready), or moved out of the critical path.
- Critical CSS (what is needed to render the first view) can be inlined so paint is not blocked on a stylesheet fetch; the rest loaded after.

## Show something fast, then fill in

**The blank-screen-until-everything-loads problem.**
Many apps (especially client-rendered SPAs) show nothing until the JS has loaded, run, fetched data, and rendered, a long blank or spinner while all that happens. Better approaches:
- **Server-render or pre-render** the initial HTML so the user sees real content immediately, then hydrate. This is what server-side rendering and static generation buy you: content on first paint instead of after the JS round-trip.
- **Show a shell/skeleton** immediately (layout, placeholders) and stream content in, rather than a blank screen until everything is ready. Perceived speed is about showing *something* useful fast.
- **Stream** where the framework supports it: send the parts of the page that are ready while slower parts (data-dependent sections) load, rather than holding the whole page for the slowest piece.

## The page waiting on data

If the first render blocks on a data fetch (load page → fetch → then show), the user waits for the round-trip before seeing anything. Options: render the static shell immediately and load data into it; fetch critical data server-side so it arrives with the HTML; or prioritise the above-the-fold data and defer the rest.

## Layout shift (CLS)

Content that loads without reserved space shoves other content around as it arrives, an image with no dimensions, an ad/banner slot that appears late, a font swap that resizes text, web content injected above existing content. Beyond being measured (CLS), it is genuinely annoying and causes mis-taps. The fix is reserving space for anything that loads late (dimensions on images, min-heights on dynamic slots, stable font fallbacks) so the layout does not jump.

## What to flag
- Render-blocking scripts/styles delaying first paint.
- A fully client-rendered app showing a blank screen / long spinner before first content, where server-rendering or a skeleton would show something fast.
- First render blocking on a data fetch with nothing shown meanwhile.
- Layout shift from unreserved space for late-loading content.

## The honest framing
Perceived speed is often more about *when the user sees something useful* than total load time. A page that shows a real shell in 0.5s and fills in over the next second feels far faster than one that shows nothing for 1.5s then appears complete, even if the second finishes sooner. Get something meaningful on screen fast, stream the rest, and stop the layout jumping while it arrives.

## Connection to other skills
`frontend-design` owns what the shell/skeleton looks like; this owns getting it on screen fast. The data-fetching strategy overlaps `network-and-requests`.
