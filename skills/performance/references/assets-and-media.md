# Assets and media

Usually the biggest, easiest performance win. Unoptimised images are the single most common cause of slow page loads, and they are also among the easiest things to fix. Before touching JS or rendering, check the assets, the win is often here.

## Images

**Serving images far larger than displayed.**
The classic fast-built mistake: a 4000px, 4MB photo displayed in a 400px box. The browser downloads the full file and shrinks it. The fix is serving an image sized for its actual display (and appropriately sized variants for different screens via responsive images). This one change often halves page weight.

**Wrong or outdated format.**
Modern formats (WebP, AVIF) compress far better than older JPEG/PNG at the same quality. Serving large PNGs for photographs, or any uncompressed format, wastes bytes. Convert to a modern format with a fallback for old browsers (frameworks and image CDNs often do this automatically).

**Not compressed.**
Even in the right format and size, images should be compressed to a sensible quality. The difference between an uncompressed and a well-compressed image is usually invisible to the eye and large on the wire.

**Loaded eagerly when below the fold.**
Images far down the page are downloaded immediately even though the user may never scroll to them, competing for bandwidth with what is actually visible. Lazy loading (`loading="lazy"` or framework equivalents) defers off-screen images until they are near the viewport. The above-the-fold hero image should NOT be lazy-loaded (it is what LCP measures); everything below should be.

**No dimensions reserved (causes layout shift).**
An image with no width/height set lets the page reflow when it loads, shoving content around (the CLS problem). Always reserve the space (set dimensions or aspect-ratio) so the layout is stable as images arrive. This is both a performance metric (CLS) and a UX annoyance.

## Fonts

**Render-blocking or invisible-text delays.**
Web fonts can block text from showing (the page waits for the font) or cause a flash as the font swaps. Use `font-display: swap` (or `optional`) so text shows immediately in a fallback and swaps when the custom font loads, rather than the user staring at blank space.

**Too many weights and styles.**
Each font weight and style is a separate download. Loading eight weights when the design uses three is wasted bytes. Subset to what is actually used, and consider variable fonts (one file, many weights) where appropriate.

**Self-hosted vs third-party.**
Third-party font services add a connection to another origin (DNS, handshake) before the font loads. Self-hosting fonts (and preloading the critical ones) can be faster and avoids the extra origin.

## Other media
Large video/audio loaded eagerly is the same problem as images at larger scale: defer it, do not autoplay-download heavy media, use appropriate formats and streaming.

## What to flag
- The single largest image on the critical path, if it is oversized/uncompressed, this is usually the top finding and the biggest LCP win.
- Below-fold images not lazy-loaded.
- Images without reserved dimensions (CLS).
- Excessive font weights or render-blocking font loading.

## The honest framing
Assets are where the easy wins live. A typical slow page is dominated by one or two oversized images and a pile of font weights nobody needed. Right-size and compress the images, lazy-load what is below the fold, reserve dimensions to stop layout shift, and trim fonts, and you have often fixed most of the perceived slowness before touching a line of application code. Check here first.
