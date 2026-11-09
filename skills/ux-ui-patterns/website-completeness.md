# Website completeness and commercial journeys

Use this reference for code-audit's UI/UX pass on public websites and web applications, including static brochures. Audit the site's actual offer and tasks. Missing business facts require a named owner decision; never invent prices, contact details, testimonials, guarantees or legal policies.

## Establish the task and route inventory

Name the audience, what the visitor can do and the observable completion of that task. Separate marketing, account, administration and checkout surfaces. Enumerate routes and templates, their entry links, redirects and intentional access/indexing restrictions. Inspect one representative of each template plus materially different permissions, content lengths and error states. Sampling is recorded coverage, not proof that every route works.

Trace the primary journey from entry through completion and recovery. Include direct navigation, refresh, browser back, interrupted requests and session expiry where relevant. A static contact page needs working contact actions; it does not need account registration. A public service page should explain the service without requiring the visitor to infer it from decorative copy.

## Navigation and production identity

- Exercise header, footer, logo, social, in-page and primary-action links. Check intended destinations, new-tab behaviour, dead hashes, placeholder buttons, redirect loops and orphaned important pages. A low click count alone does not justify removing useful navigation.
- Check the mobile menu at narrow widths, with a keyboard and with the virtual keyboard present where relevant. Confirm open/close state, focus and scrolling. Coordinate accessibility findings with the accessibility lens.
- Visit an unknown route and refresh a valid nested route. Distinguish an intentional access response, a useful missing-page recovery and a server error. The SEO lens owns public status/indexing consequences; avoid issuing the same root-cause finding twice.
- Compare the intended production name, logo, favicon, browser title and footer across app, authentication, checkout, email and share previews. Starter text, fake data or framework branding is a defect only when it conflicts with the intended released product. Hosting on a provider subdomain and using React/Vite are not defects by themselves.
- Verify any advertised email, telephone, opening hours, service area and response promise against approved facts. Email and telephone actions should use appropriate destinations and remain understandable when copied. Do not require a phone number, physical address or opening hours for every business.
- Inspect copyright and policy information for accurate ownership and dates. A dynamic current year is a presentation choice, not a universal legal requirement.

## Offer, price and fulfilment

For paid products, compare the offer page, selected option, checkout, confirmation, receipt and resulting access. Use sandbox evidence or an existing authorised transaction; this audit does not authorise live charges or outbound messages.

Check currency, billing interval, renewal, trial conversion, relevant taxes/fees and total commitment. Physical products need the applicable shipping costs and delivery information; digital products need access timing and restrictions; booked services need their actual scheduling and cancellation rules. Distinguish a genuine price estimate from an amount already determined. Display only payment methods the configured provider and market support.

The security/correctness pass verifies server-authoritative prices, payment state and entitlement. This reference checks whether the user sees a truthful explanation of that behaviour. A success URL or optimistic animation cannot support a claim that payment, fulfilment or delivery completed.

Read published cancellation, refund and guarantee statements against the product's actual support and billing process. Flag contradictions, missing operational facts and unapproved promises. Route legal consequences to the applicable privacy/compliance owner and verify jurisdiction; do not generate a generic policy and call the obligation satisfied.

## Reduce demonstrated friction

Assess whether the primary action is clear after the offer has been explained. Its label should describe the action and any commitment. Check competing actions and repeated prompts in context. Sticky CTAs and floating contact buttons are optional; if present, inspect overlap with content, consent choices, focus and the virtual keyboard.

Review fields and steps against fulfilment, identity and ownership needs. Remove a field only in a separately authorised fix phase after identifying why it is unnecessary. Guest checkout is useful for some purchases; products with persistent private access may need an account. Progress indicators are appropriate when the flow has meaningful steps, not an automatic requirement on a single form.

Use supplied funnel evidence or task observations to locate friction. Treat conversion predictions as hypotheses. A/B testing requires an answerable question, suitable traffic and analysis; analytics-and-instrumentation owns that assessment. Do not report a percentage revenue gain inferred from appearance.

## Content and evidence

Check whether service/product pages describe distinct real offerings and provide the information needed for a decision. Useful FAQs, About pages, original research and comparison tables depend on the audience and available facts. There is no universal five-blog-post launch quota.

Verify founder stories, credentials, customer logos, reviews, before-and-after media and guarantees against supplied records and permissions. Check that product images depict the offered product and that comparisons use meaningful, supported differences. Missing proof is a factual gap to name; placeholder praise or invented customers cannot fill it.

Use the existing brand name, assets, voice and design references consistently. The shared production-audit design context governs keep/rewrite/restyle/remove decisions for eyebrows and familiar patterns. A useful category label can stay even if it is uppercase or uses a common word.

## Evidence and output

Record the route/template, state, role, viewport and source revision for each observation. Source inspection establishes what code says; interaction establishes what happened in the tested state. Missing browser or provider access stays visible as a limitation. Keep findings in the canonical ledger under their existing consequence owner. Optional omissions and elements deliberately kept belong in website-profile coverage, not positive or fabricated findings.
