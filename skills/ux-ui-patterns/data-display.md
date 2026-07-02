# Data Display

## 1. Tables

### When to Use Tables

Use tables for data that needs to be compared, scanned, or acted upon in bulk. Tables work when: the data has consistent columns, users need to compare rows, sorting and filtering add value, and bulk actions are needed.

Do not use tables for: heterogeneous content (use cards), small datasets under 5 items (use a simple list), or mobile-primary interfaces (tables do not work well on narrow screens).

### Table Design

**Column headers:** Always visible. Sticky on scroll if the table is long. Sortable columns show a sort indicator (arrow). Active sort column is visually distinct.

**Row height:** Consistent. Dense rows (32-40px) for data-heavy tables with many rows. Comfortable rows (48-56px) for tables with fewer rows or more readable content.

**Alignment:** Left-align text. Right-align numbers. This makes both scannable — text reads naturally left-to-right, numbers align by magnitude when right-aligned.

**Row actions:** Place row-level actions at the far right. Show the most common action as a visible button, less common actions in a "..." menu. Do not put more than 2 visible action buttons per row — it creates visual noise.

**Selection:** Checkbox in the first column for row selection. "Select all" checkbox in the header selects the current page. If the dataset spans multiple pages, show "Select all 287 items" as a banner when "select all" is clicked.

**Empty rows:** If a cell has no data, show a dash "—" or "N/A", not a blank cell. Blank cells look like rendering errors.

### Responsive Tables

Tables on mobile are a problem. Options:

**Horizontal scroll:** Keep the full table, add horizontal scroll. Pin the first column (name/identifier) so it stays visible while scrolling. Works for data-literate users.

**Card conversion:** Below a breakpoint, convert each row into a card with key-value pairs stacked vertically. Works for tables with fewer columns.

**Column prioritisation:** Show only the most important 2-3 columns on mobile. Provide a "View details" link to see the full row.

---

## 2. Lists

### Simple Lists

Use for: ordered or unordered content where each item has a primary label and optional secondary text or metadata.

- Each item has a primary label (bold or prominent) and optional secondary line (smaller, muted).
- Action items (links, buttons) are right-aligned.
- Dividers between items. Use subtle lines, not heavy borders.
- Active/selected item has a background highlight.

### Grouped Lists

Group items by a shared attribute (date, category, status). Show a sticky group header that persists while scrolling through that group's items.

### Virtual Lists

For lists exceeding 100 items, use virtualisation (only render visible items in the DOM). Libraries: react-window, react-virtuoso. This keeps scrolling smooth regardless of list length. Show a total count so the user knows the full list size.

---

## 3. Cards

### When to Use Cards

Cards are for content that is heterogeneous (different items have different content types), visually rich (includes images, previews, or varied layouts), or browsable (the user scans and picks rather than comparing systematically).

### Card Design

- Consistent card size within a grid (even if content varies in length). Truncate or clamp text to maintain alignment.
- Primary action on the card itself (clicking the card navigates to detail).
- Secondary actions in a corner menu or footer.
- Visual hierarchy within the card: image/preview on top, title, metadata, actions.
- Do not overload cards with information. If a card has more than 5-6 pieces of information, the content needs a different display pattern.

### Card Grids

- Responsive columns: 1 column on mobile, 2-3 on tablet, 3-4 on desktop.
- Consistent gutter spacing (16-24px).
- Masonry layout only for image-heavy content where varying heights add visual interest. For data content, use uniform height.

---

## 4. Dashboard Design

### Widget Hierarchy

Not all metrics are equal. Establish visual hierarchy:

**Primary metrics (1-2):** Large, prominent. The first thing the user sees. These answer "how is my business/project doing right now?"

**Secondary metrics (3-6):** Smaller, grouped. Context for the primary metrics. Trends, breakdowns, comparisons.

**Detail sections:** Tables, lists, or charts that let the user dig deeper into specific areas.

### Dashboard Patterns

**Metric + Trend.** A large number with a sparkline or trend indicator. Shows the current value and recent direction.

**Comparison.** This period vs last period. Show the delta and whether it is positive or negative.

**Distribution.** Pie/donut charts (for 2-5 categories), bar charts (for more categories or time series), or segmented bars.

**Activity feed.** Recent events in chronological order. Useful for "what has happened since I last looked."

### Dashboard Mistakes

- Showing everything at once. If the user needs 30 seconds to find what they care about, the dashboard failed. Prioritise ruthlessly.
- Refreshing the entire dashboard on a timer. If one widget updates, update that widget. Do not flash the entire page.
- No date range selector. Every dashboard should let the user choose a time period. Default to the most useful range (last 7 days, this month, etc.).
- Charts without context. A chart showing a line going up is useless without labels, units, and time scale.

---

## 5. Charts

### Choosing Chart Types

**Line chart:** Trends over time. Use for continuous data with a time x-axis.
**Bar chart:** Comparison between categories. Use for discrete categories.
**Stacked bar:** Composition within categories.
**Pie/donut:** Proportion of a whole. Use only for 2-5 segments. More than 5 segments is unreadable.
**Scatter plot:** Correlation between two variables.
**Sparkline:** Trend indicator inline with other content. No axis labels, just shape.

### Chart Design

- Label axes. Always. Include units.
- Start y-axis at zero for bar charts (truncated y-axes exaggerate differences). For line charts, starting above zero is acceptable if the data range is narrow.
- Use colour meaningfully. Different series get different colours. Status colours (green = good, red = bad) match user expectations.
- Show values on hover (tooltip). The user should not have to estimate values from axis positions.
- Provide a legend when multiple series are shown. Place it close to the chart, not at the bottom of the page.
- Responsive: charts should resize with the container. On mobile, consider simplifying (fewer data points, larger touch targets on interactive charts).

---

## 6. Detail Views

### Master-Detail Pattern

A list or table (master) alongside a detail panel. Clicking an item in the master shows its details in the panel without full page navigation.

Use for: email clients, file managers, CRM contacts, any list where users frequently switch between items and want fast access.

**Implementation:**
- Desktop: side-by-side (list left, detail right) or list top with detail bottom.
- Mobile: list view → tap → detail view (full page), with back navigation.
- Keyboard navigation: arrow keys to move between list items, detail updates automatically.

### Standalone Detail Pages

Use when: the detail is complex enough to warrant its own page, or the item has its own set of actions and sub-navigation.

Structure: header with item identity and primary actions, tabbed or sectioned content below. Back link to the list.

---

## 7. Real-Time Data

### Update Patterns

**Auto-refresh.** Content updates on a timer. Show "Last updated: 30 seconds ago." Provide a manual refresh button. Pause auto-refresh when the user is actively interacting (filling a form, selecting text).

**WebSocket/SSE push.** Content updates as events arrive. Highlight new or changed items briefly (a flash of colour or a "New" badge). Do not scroll the user's viewport — new items appear at the expected position (top or bottom depending on sort order), and the user scrolls when ready.

**Optimistic local + server reconciliation.** The user sees their own changes immediately. Other users' changes arrive via push. Conflict resolution (last-write-wins or merge) happens transparently.

### Handling Stale Data

If the real-time connection drops, show an indicator: "Live updates paused. Reconnecting..." with a manual reconnect button. Continue showing the last known data rather than blanking the screen.
