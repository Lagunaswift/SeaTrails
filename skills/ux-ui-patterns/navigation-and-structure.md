# Navigation and Structure

## 1. Information Architecture

### Hierarchy Depth

Keep navigation hierarchy to 3 levels maximum. Beyond that, users lose their sense of position.

```
Level 1: Primary sections (Dashboard, Projects, Settings)
Level 2: Section pages (Settings → Account, Billing, Team)
Level 3: Detail views (Team → Member profile)
```

If your content requires deeper nesting, flatten it. Use search, filtering, and tagging instead of deep folder structures.

### User Mental Models

Structure navigation by what users want to do, not how your backend is organised.

```
Wrong (database structure):  Users → User #457 → User Settings → Notification Preferences
Right (task structure):      Settings → Notifications
```

Group by task, not by entity. "Billing" contains invoices, payment methods, and plan management — even though those are different database tables.

---

## 2. Navigation Patterns

### Top Navigation Bar

Use for: applications with 3-7 top-level sections and no deep hierarchy.
The standard. Logo left, nav items centre or left, user menu right.

- Highlight the active section clearly (bold text, underline, background colour — pick one, not all three).
- On mobile, collapse to a hamburger menu or move to bottom navigation.
- Keep nav items to single words or short phrases. "Projects" not "Project Management Dashboard."

### Sidebar Navigation

Use for: applications with many sections, deep hierarchy, or grouped navigation items.
Works well for dashboards, admin panels, and tools.

- Collapsible on desktop (icon-only mode saves space).
- On mobile, convert to an overlay drawer triggered by a hamburger icon.
- Group related items under section headers. Do not put 30 ungrouped links in a flat list.
- Show the active item and its parent group clearly.

### Bottom Navigation (Mobile)

Use for: mobile apps or mobile-first web apps with 3-5 primary sections.
Keeps primary actions within thumb reach.

- Maximum 5 items. More than that requires scrolling, which defeats the purpose.
- Icons with labels. Icons alone are ambiguous.
- Highlight active tab with colour, not just icon weight change.
- Do not put a menu/hamburger as a bottom nav item — it adds a tap to reach any secondary content.

### Tab Navigation

Use for: switching between views of the same content or closely related content.

- Tabs stay on the page. Clicking a tab does not navigate to a new URL (unless you are using URL-synced tabs for shareability, which is fine).
- Highlight the active tab with a clear indicator (underline, background, bold).
- Do not use tabs for unrelated content. If "Overview" and "Settings" are tabs, the user has no way to link directly to Settings.
- If tabs overflow horizontally, add horizontal scroll with arrows. Do not wrap tabs to a second row — it breaks the tab mental model.

### Command Palette

Use for: power users in complex applications.
Cmd/Ctrl + K opens a search-driven command interface.

- Search across navigation items, recent items, and actions.
- Show keyboard shortcuts next to actions.
- Group results by category (Pages, Actions, Recent).
- This supplements other navigation; it does not replace it.

---

## 3. Breadcrumbs

Use for: applications with 3+ levels of hierarchy where the user needs to know their position and navigate up.

- Show the full path: Home > Projects > Project Alpha > Settings.
- Each segment is a clickable link except the current page.
- On mobile, show only the parent level with a back arrow: "← Project Alpha."
- Do not use breadcrumbs for flat navigation (only top-level sections).

---

## 4. Pagination

### When to Use

Use pagination when:
- The dataset is large (100+ items)
- Each page load is a server request
- The user benefits from a sense of position ("Page 3 of 12")
- SEO matters (paginated pages are crawlable)

### Implementation

- Show: Previous, numbered pages, Next. For large datasets, show first, last, and pages around the current page: 1 ... 4 5 [6] 7 8 ... 24.
- Show total results: "Showing 51-75 of 287 results."
- Allow page size selection (10, 25, 50, 100 per page) for data tables.
- Store current page in the URL. Back button and direct links should work.
- When changing page, scroll to the top of the list.

### Infinite Scroll

Use when:
- The content is homogeneous (social feed, image gallery, message history)
- There is no meaningful position to preserve ("page 7 of a feed" is meaningless)
- Discovery/browsing is the primary interaction

Do not use when:
- The user needs to reach a specific position or compare items
- Footer content needs to be accessible (infinite scroll makes footers unreachable)
- The dataset is finite and the user wants a sense of progress

Implementation rules:
- Load more content well before the user reaches the bottom (trigger at 80% scroll).
- Show a loading indicator at the bottom while fetching.
- Provide a "scroll to top" button after significant scrolling.
- Preserve scroll position on back navigation.
- Show total count if known: "47 of 238 items."

---

## 5. Deep Linking and URL State

### What Goes in the URL

Any state that the user would want to share, bookmark, or return to via the back button:

```
Include in URL:
  Current page/view
  Active tab
  Search query
  Applied filters
  Sort order
  Pagination page
  Selected item ID
  Modal/drawer state (for significant modals)

Do not include in URL:
  Hover states
  Collapsed/expanded UI sections
  Tooltip visibility
  Transient form state (half-completed inputs)
  Toast notification state
```

### Back Button Behaviour

The back button should undo the last meaningful navigation action. Opening a modal is not navigation — back should not close a modal (Escape does that). Changing tabs may or may not be navigation depending on context.

Test your back button behaviour. If pressing back produces a surprising result, the user's mental model does not match your URL state management.

---

## 6. Routing and Transitions

### Page Transitions

- Instant content swap is fine for most applications. Do not add fade-in/fade-out transitions between pages unless the visual continuity genuinely helps orientation.
- If content is loading, show a progress bar at the top of the page (like YouTube or GitHub) rather than a full-page loading screen.
- Maintain scroll position when returning to a previous page.

### Modals and Drawers as Routes

For significant modals or drawers (editing a record, viewing a detail), consider making them routes. This gives them a URL, makes them shareable, and makes back-button behaviour predictable.

```
/projects/123         → project list with project 123 modal open
/projects/123/edit    → project list with edit drawer open for project 123
```

This is not required for every modal. Confirmation dialogs, quick settings, and minor interactions do not need URLs.
