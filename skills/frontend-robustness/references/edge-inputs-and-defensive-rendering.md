# Edge inputs and defensive rendering

Not breaking on the data and inputs the happy path never considered. A UI built and tested with tidy, complete, expected data falls over when it meets the missing, the null, the enormous, the malformed, the real. Defensive rendering means the interface degrades gracefully on unexpected data rather than crashing or white-screening.

## Missing, null, and empty data

The most common crash: rendering data that is not there. The code assumes `user.profile.name` exists and renders it; for one user `profile` is null, and the whole component throws ("cannot read property 'name' of null/undefined"), often white-screening the page. Defences:
- **Assume any data can be missing.** Guard access to nested/optional data (optional chaining, defaults, conditional rendering) rather than assuming the shape is always complete.
- **Distinguish "loading" from "empty" from "missing".** No data yet because it is loading (loading state), legitimately empty (empty state, async-states.md), and a field that is unexpectedly absent are different; handle each rather than letting a null crash the render.
- **Provide fallbacks:** a default avatar when there is no image, "Unnamed" when a name is blank, a placeholder when a value is absent, so the UI renders something sensible instead of breaking or showing "undefined".

## Extreme and unexpected values

Happy-path data is medium-sized and well-formed; real data is not:
- **Very long strings:** a name, title, or message far longer than expected, does it wrap, truncate gracefully, or break the layout / overflow / push other elements off-screen? Long content should be handled (truncation with full view, wrapping) not assumed short.
- **Very large (or zero, or negative) numbers:** counts, prices, quantities at extremes, does the formatting and layout hold?
- **Unexpected characters:** emoji, right-to-left text, special characters, HTML-like content in user input, rendered safely (and without breaking layout or, critically, creating an injection, which is `ai-saas-security`/`code-audit` territory: never render user content as raw HTML).
- **Missing images / media:** a broken image URL should show a fallback, not a broken-image icon or a collapsed layout.

## Error boundaries: contain the blast radius

Even with careful guarding, a render can throw. Without containment, one component's error can take down the entire app (the white screen of death, a blank page where everything was). An **error boundary** (a component that catches render errors in its subtree and shows a fallback instead of crashing upward) limits the damage: the failing section shows an error state, the rest of the app keeps working. Wrap major regions (or the app) in error boundaries so a single bad component or unexpected data does not white-screen everything. This is the render-time equivalent of the error state, a place for a component failure to land gracefully.

## Defensive, not paranoid
The balance: guard against the unexpected data that realistically occurs (missing fields, long strings, broken images, empty states), without wrapping every line in defensive cruft. The judgement is "what data could realistically be different from the happy-path example", optional fields, user-supplied content, external data, and defend those, while trusting genuinely-guaranteed invariants. Over-defensive code that checks impossible conditions is its own noise.

## What to flag
- Rendering nested/optional data with no guard (null/undefined crash risk, especially anything that can white-screen).
- No handling of long strings (layout breakage) or extreme values.
- User-supplied content rendered as raw HTML (injection, escalate to `ai-saas-security`) or breaking layout.
- Broken-image / missing-media with no fallback.
- No error boundaries (one component's failure white-screens the whole app).

## The honest framing
The happy path uses clean, complete, medium-sized data; real users bring missing fields, null values, enormous strings, broken images, and content you did not anticipate. Defensive rendering means guarding the data that can realistically be unexpected so the UI degrades gracefully (fallbacks, truncation, conditional rendering) instead of crashing, and wrapping regions in error boundaries so that when something does throw, it fails in one place rather than white-screening everything. Build for the data you will actually get, not the tidy example.

## Connection to other skills
Rendering user content safely (never as raw HTML) is a security boundary, `ai-saas-security` / `code-audit`. Empty vs loading vs missing ties to async-states.md. The "what shape can this data be" question overlaps `data-modelling`. How fallbacks and truncation look is `frontend-design`.
