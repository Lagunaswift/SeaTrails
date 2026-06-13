# Web Frontend

Browser bugs have observation tools the backend lacks (the devtools), and a recurring class of bug that almost nothing else has: "works in dev, breaks in prod." The core loop is unchanged; the tools and the dev/prod gap are what's specific.

## Use the devtools as your instrument

Before adding any logging, the browser already shows you most of what you need:

- **Network tab.** Did the request even fire? What status? What did it actually send and receive? A frontend bug is frequently a backend response that's wrong, missing, or shaped differently than the code expects. Confirm the response body before debugging the rendering of it. Check the request headers, payload, and timing too.
- **Console.** Errors and warnings, including the ones that scroll off before you look. Preserve log across navigations if the page reloads on failure.
- **Elements/DOM.** Is the element actually in the DOM with the attributes/classes you expect, or is the bug that it never rendered? Inspect computed styles for "my CSS isn't applying" (specificity, a later rule winning, a typo'd property silently ignored).
- **Application/Storage.** Cookies, localStorage, session, cache. State left over from a previous session causing a bug that a fresh incognito window doesn't show.

## The dev-vs-prod gap

A bug that only appears in the production build is one of the most common and most confusing frontend situations. The cause is in the build, not the logic:

- **Minification and mangling** renamed something your code referenced by string name (reflection, a key derived from a function/class name).
- **Tree-shaking** removed code it thought was unused but which had a side effect, or a dynamic import that the bundler couldn't see.
- **Environment variables** present in dev but not injected at build/runtime in prod, leaving an undefined config value.
- **Different base URL, API host, or CORS policy** between environments, so requests that work locally are blocked or 404 in prod.
- **Source maps absent**, so the prod error points at minified code. Get maps working first; everything else is guessing.
- **Caching/CDN** serving a stale bundle, so the deployed fix isn't actually running. Hard-reload, check the served asset hash, confirm the deploy completed.

When you see dev-works/prod-breaks, stop debugging the logic and start diffing the two environments: build config, env vars, hosts, cache.

## Rendering and state desync

- **Stale or out-of-sync UI.** The displayed state doesn't match the underlying data. Determine which is right: is the data wrong, or is the render not reflecting correct data? The network tab and a log of the state value settle it.
- **Hydration mismatch** (SSR/SSG): server-rendered HTML differs from the first client render, because of non-deterministic content (dates, random, locale, `window`-dependent values) used during render. The console warns explicitly; the fix is making first render deterministic, not suppressing the warning.
- **Layout/CSS bugs**: an element mispositioned or invisible. Inspect computed styles and the box model in Elements. "Invisible" is often `display:none`, zero height, off-screen transform, or `z-index`/overflow clipping, not a missing element. Confirm it's in the DOM first.
- **Event handling**: a handler not firing (not attached, attached to the wrong element, stopped by `preventDefault`/`stopPropagation` upstream) or firing too often (bubbling, re-binding each render).

## Cross-environment differences

- Browser/device/OS-specific failures: a feature unsupported in one engine, a vendor quirk, a viewport-size-dependent layout. Reproduce in the specific browser reported, not just your default.
- Extensions interfering (ad blockers, script blockers) producing failures that vanish in incognito. If incognito fixes it, suspect an extension or cached state.
- Locale/timezone-dependent bugs in date, number, and currency formatting.

## When the bug is actually the backend

The frontend is where the symptom shows, but the network tab often reveals the cause is a wrong API response. When the response body is already wrong, stop debugging the component and move the investigation to the server, taking the exact request/response with you as the reproduction.
