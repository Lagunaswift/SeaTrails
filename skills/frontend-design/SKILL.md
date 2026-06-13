---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work. What carries either one is intentionality rather than raw intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

## AI-Generated Frontend Anti-Patterns

These are the specific, recognisable patterns that mark a frontend as AI-generated. They are the visual equivalent of "As an AI language model." Treat every pattern below as a hard constraint: do not produce it unless the user explicitly asks for it.

Each entry names the tell, explains why it reads as machine output, and gives the alternative. Do not satisfy the constraint by swapping one banned class for its neighbour (`shadow-lg` to `shadow-xl`, `purple-600` to `indigo-600`). The point is the judgement behind the choice, not the specific token.

### Structure & Layout

**The landing page formula.** Hero, then a three-feature grid with icons, then testimonials, then pricing, then a final CTA. This exact running order appears in so much AI output that the shape alone gives it away. Read the actual content and decide what the page has to communicate, in what order, with what emphasis. A page selling one idea well might be a single long argument with no feature grid at all.

**The default dashboard skeleton.** Four stat cards across the top (Revenue, Users, Orders, Growth, each with a coloured icon, a big number, and a green or red percentage with an up/down arrow), a three-column card grid in the middle, a data table at the bottom. This is "Hello World" for dashboards. Ask how many metrics the user actually needs and what the real hierarchy is. A single prominent figure with sparkline context often beats four equally weighted boxes. Consider dense single-column feeds, split-pane master-detail views, kanban swim lanes, timeline layouts, map-centric views, or full-screen visualisations with overlay controls.

**Unconsidered navigation.** Sidebars and top navs are fine; real products use them. The tell is that AI never weighs alternatives before reaching for sidebar-with-icon-label-rows or logo-left / nav-centre / avatar-right. Weigh tabs, command palettes, bottom bars, breadcrumb-driven hierarchy, full-screen overlays, contextual toolbars, or no persistent nav at all. Fit the navigation to the product's information architecture, not to the SaaS starter kit.

**Bento grids by reflex.** Mixed-size rounded tiles arranged in a masonry-ish grid, deployed whether or not the content has any real size hierarchy. The bento layout earns its place when some items genuinely deserve more space than others. Applied to a set of equal-weight features, it is just decoration pretending to be hierarchy.

**Reflexive symmetry.** Every grid even, every section centred, every layout balanced. Perfect symmetry in every section is itself a tell. Use asymmetry as a tool: offset headings, uneven column splits (7/5 rather than 6/6), left-weighted heroes, content that bleeds off one edge, elements placed deliberately off-grid.

### Spacing & Shape

**Uniform spacing.** AI puts `p-6 gap-6` or `p-8 gap-8` on everything, so nothing has density variation. Spacing is how you create rhythm and grouping. Some things sit deliberately tight (related controls, label-input pairs, tag clusters); others get room (section breaks, hero areas). The contrast between dense and open is the rhythm. Without it the layout reads flat.

**One radius for everything.** The same `rounded-xl` or `rounded-2xl` on a full-width container, a card, a badge, and a button. Scale radius with component size: small elements get tight corners or full pills, medium elements get moderate rounding, large containers get very subtle rounding or none.

**Pill-shaping every button.** A specific case of the above worth its own line: `rounded-full` on every button regardless of context. A fully rounded primary CTA next to fully rounded secondary buttons next to fully rounded chips flattens the hierarchy that radius is supposed to express. Reserve the pill for where it means something.

### Surface & Depth

**Shadow-only depth.** The single depth tool AI knows: `shadow-sm`, then `shadow-md`, then `shadow-lg` on hover, on every raised element. Real interfaces build depth with borders, inset shadows, background-colour shifts, hairline dividers, and layering as well. Reaching only for drop shadows produces the soft, floating, slightly weightless look that signals a template.

**Glassmorphism as a "premium" default.** `backdrop-blur-xl bg-white/10 border border-white/20` on cards and navs because it reads as modern. Glass works over rich photographic or video backgrounds where there is actually something to blur. Over a flat grey background it is a faintly transparent card blurring nothing.

**The drifting gradient blob.** Large blurred radial gradients (`blur-3xl` coloured orbs) floating behind a hero, often animated. This aurora-background look is one of the most dated AI landing-page tells there is. If the background needs atmosphere, derive it from the design's own language rather than dropping in glowing orbs.

### Colour & Type

**The default Tailwind palette as the real palette.** `blue-600` primary, `gray-100` backgrounds, `green-500` / `red-500` status states. These are scaffolding, not decisions. Derive the palette from the brand, the industry, the content, the chosen aesthetic.

**The purple-to-blue gradient.** `bg-gradient-to-r from-purple-600 to-blue-500` is as recognisable now as clip art, whether on a CTA or anywhere else. Its typographic cousin is `text-transparent bg-clip-text` gradient headings. If a gradient is warranted, build it from the project palette; most of the time a strong solid colour with real contrast is better.

**The dark developer-tool template.** Near-black background (`#0a0a0a`, slate-950), one electric accent (violet or cyan), a faint dot or line grid behind the hero, a monospace label or two. It has hardened into its own template, distinct from the purple gradient. Dark mode is fine; this specific costume is the tell.

**Generic display fonts.** Inter, Roboto, Arial, system stacks, and the AI convergence pick, Space Grotesk. Defaulting to any of these wastes the single highest-leverage aesthetic decision. Pick a distinctive display face with a refined body face, and do not land on the same pairing every time.

### Iconography & Decoration

**Defaulting to Lucide or Heroicons.** The first libraries AI reaches for, so every app ends up using the same fifteen glyphs (Home, Settings, User, Bell, Search, ChevronRight, Menu, X, Plus, ArrowRight, Check, Star, Heart, Mail, Calendar). If an icon set is needed, choose one that fits the aesthetic (Phosphor, Tabler, Remix, Iconoir) or draw custom SVG.

**The icon-in-a-coloured-circle.** AI shorthand for "make this look designed": an icon inside a `bg-blue-100 rounded-full p-3` circle above a heading, repeated down a feature list. Instantly readable as generated. If a section needs an anchor, use something tied to the content: an illustration fragment, a typographic mark, a number, a decorative border, a colour block.

**Emoji as iconography.** 🚀 ✨ 🎯 💡 dropped into headings, feature bullets, and buttons as a cheap stand-in for visual design. Reads as a hurried generation, not a considered interface. Use real icons or typographic treatment instead.

**Fake trust bars.** A "Trusted by" strip of greyed-out, evenly spaced, generic or placeholder company wordmarks. If there are no real logos to show, the strip is a lie that everyone recognises; cut it.

### Motion

**`transition-all duration-300` on everything.** No discrimination about what should animate. Animate intentionally: colour on a link hover, height on an accordion, opacity on a fade. Name the properties that transition and match duration to the interaction: roughly 150ms for hover feedback, 250ms for reveals, 400ms or more for layout shifts.

**The universal hover state.** `hover:scale(1.02)` plus `shadow-lg` on every card, button, and clickable element: the same subtle zoom-and-lift everywhere. Vary the response to the element's purpose. A text link underlines or shifts colour; a card moves a border; a button inverts; an image reveals an overlay.

### Content & Copy

**Microcopy that narrates instead of labelling.** Buttons that say "Click here to get started on your journey" rather than "Start." Headings that sell rather than identify. Descriptions like "This powerful dashboard helps you visualise your key metrics at a glance" where "Recent activity" would do. AI over-explains because verbosity scored well in training. Real product copy is lean.

**Placeholder content that smells generated.** "Welcome back, [User]" over sample data with exactly four metrics, three recent activities, and two notifications. If the interface needs example content, make it look like real data: some names long, some rows truncated, some fields empty, uneven counts.

### The Functional Ugliness Test

The meta-pattern beneath most of the above: **AI frontends have no ugly-on-purpose elements.** Real products carry dense data tables with tight rows and almost no decoration, cramped forms where twelve fields sit above the fold because the workflow demands it, utilitarian admin screens with no hero and no gradient, terminal-style tools, settings pages that are just a long list of toggles.

AI makes everything look like a marketing page because that is what scored well in training. The absence of functional ugliness is itself the tell. When the context calls for density, utility, or raw function over polish, commit to it. An admin table that stays usable at 50 rows is better design than a handsome card grid that shows six items before pagination.

## Final Reminder

Remember: Claude is capable of extraordinary creative work. The guidelines above set the floor, not the ceiling. Avoiding AI patterns is necessary but not sufficient. The goal is to produce frontends that look like they were designed by a human with opinions, taste, and deep understanding of the specific context. Every interface should feel like it was made for this particular problem, for this particular user, by someone who cared about this particular domain.
