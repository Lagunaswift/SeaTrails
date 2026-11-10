# Website readiness profile

Select this profile for an audit of user-facing website or web-application pages. It supplies website context and recorded coverage to the existing lenses. It adds no lens, finding prefix, severity scale or fix authority. Continue the ordinary ledger, evidence-assurance and reconciliation process. The audit remains read-only unless the user has separately authorised a fix phase.

## Select and establish context

At Stage 0/1, add "website-readiness" to scope.review_profiles. Read this reference and website-readiness-coverage.md, then record the profile under coverage.website_readiness as specified below. A backend-only service needs no website profile. An authenticated app still needs journey, interaction and accessibility review; its private routes do not need public indexing.

Establish the intended audience, primary outcomes, supported locales/devices, public and private surfaces, account roles, payment model, published features and existing brand rules. Record supplied business policies, evidence permissions, crawler choices and access to provider settings. Distinguish explicit facts from assumptions. Missing business decisions are named, not invented.

Build a route/template/journey inventory alongside the source-file inventory. Include navigation and direct entry, valid and missing routes, empty and long content, access denial, loading, failures and recovery. Select representative templates and risky boundaries; name the sampling limits. Retain the revision, environment, safe accounts and test conditions. Read code-audit's boundary tests and ux-ui-patterns/website-completeness.md for the relevant journeys.

## Usability across complete tasks

At Stage 2, code-audit's UI/UX pass runs [nielsen-usability-review.md](../../ux-ui-patterns/nielsen-usability-review.md) against the selected journeys. That reference adapts Jakob Nielsen's ten perspectives into task probes and maps them to the existing controls. Include needed context between screens, the actual effect of exits/cancellation and usable help for unfamiliar tasks. Apply the review to static sites as well as applications; conditional operations need a product-based applicability decision.

Record an observation, applicability reason or precise untested scope for each HEUR-01 through HEUR-10 in the existing review notes referenced by the journeys topic's evidence. Link observations into interaction-states, mobile-accessibility, content-brand or layout-features when relevant; keep the native owner for each defect. A required perspective or task that remains unassessed makes the affected topic partial/blocked with a named limitation and scope.partial=true. The gate checks the existing declared records; it does not verify that these walkthroughs happened.

Keep the twelve topic IDs, 119-control mapping and existing finding schema. HEUR labels add traceability within evidence, without a separate score or finding prefix. An expert walkthrough cannot establish a conversion improvement or representative user preference. Optional shortcuts, help interfaces and sparse styling need the same contextual judgement as other feature/design choices.

## Topic ownership

Record all twelve topics. The owner is the existing lead lens used for this run; supporting lenses keep their established findings and consequence rules. A topic can be inapplicable for a stated product reason. Missing access or time is partial/blocked work, not inapplicability.

| Topic ID | Assess | Typical lead and supporting lenses |
|---|---|---|
| journeys | Primary outcomes, route/template inventory, ten usability perspectives, direct entry, interruption and recovery | code-audit; frontend-robustness |
| identity-navigation | Working navigation/contact actions, production name, favicon, starter residue and missing-page recovery | code-audit; seo-discoverability, mobile-and-responsive |
| access-security | Accounts, direct resource permissions, secrets, uploads, fetches, private caches and dependencies where present | code-audit; ai-saas-security, dependency-audit, infrastructure-config |
| commerce | Authoritative payment/entitlement and truthful offer, total commitment, terms and fulfilment | code-audit; data-privacy, email-deliverability |
| reliability-cost | Retries, data consistency, queries, quotas, recovery, monitoring and operational evidence | scaling-audit; release-and-ops |
| interaction-states | Real success/error/loading/empty states, cancellation outcomes, duplicate actions and preservation of work/context | frontend-robustness; code-audit |
| mobile-accessibility | Reflow, keyboard/focus, semantics, authentication, readable content and supported devices | accessibility; mobile-and-responsive, internationalisation |
| performance | Comparable runtime/field evidence, assets, bundles, rendering, caching and browser faults | performance; frontend-robustness |
| discovery-sharing | Intentional indexing, rendering for the intended consumer, metadata, canonical URLs, sitemap, social previews and crawler policy | seo-discoverability |
| privacy-measurement | Real storage/data flows, applicable obligations, notices, retention and useful truthful analytics | data-privacy; analytics-and-instrumentation, email-deliverability |
| content-brand | Accurate positioning, service information, proof, brand consistency and contextual copy | anti-slop-writing; taste-audit, code-audit |
| layout-features | Task-appropriate composition, implementation consistency and optional-feature decisions | impeccable-audit; taste-audit, code-audit |

Select a lens only for a relevant subject. A static brochure can use code-audit for interaction checks instead of selecting an async-state lens without an async surface. A topic with several supporting lenses is not complete merely because its lead ran; record any outstanding required work as partial and name it.

## Decision rules

Read the specialist references for the current technical requirements. Apply these rules when interpreting a checklist or screenshot:

- Require a demonstrable defect, an applicable obligation or an approved product requirement. A framework, hosting subdomain, public client identifier or source map is not a defect merely by existing.
- Separate public search, social previews, training crawlers and user-triggered retrieval. Preserve the owner's policy. A private app shell and a public information page need different rendering/indexing assessments.
- Assess heading meaning and page purpose. A preferred single-H1 convention does not turn every other count into an accessibility or ranking failure.
- Apply privacy rules to actual purposes, processing and jurisdictions. A banner is not proof of consent, and its absence alone is not proof of a breach. Verify any claimed exception and the relevant behaviour.
- Match security to the architecture. CORS is not authorisation; a client-disabled button is not durable idempotency; a budget alert is not an enforced spending ceiling.
- Preserve useful conventions and the approved brand. For eyebrows, cards, icons, gradients, typography and repeated patterns, use keep/rewrite/restyle/remove with an observed reason. Read design-review-context.md. Words such as "Overview" and "Introduction", uppercase labels and gerunds are not findings by themselves.
- Review existing features even when adding the feature would have been optional. A published password toggle, dark theme or offline mode must meet its actual promise.
- Never invent customer evidence, biographies, guarantees, research, policy terms or measurement results. Name the missing fact or owner decision.

## Optional-feature catalogue

Record one decision for each ID below. These are product options, not a list of mandatory additions. Use the relevant existing lens when a feature exists or a requirement is approved. A justified absence is a normal result. Keep a concrete benefit and implementation cost in any recommendation.

| ID | Feature and when useful | If present or approved, inspect |
|---|---|---|
| OPT-01 | Dark mode for supported reading/app tasks | Theme preference, initial rendering, both themes' contrast and maintainability |
| OPT-02 | Language switcher for real supported translations | Complete routes/content/forms/errors, locale metadata and sensible fallback |
| OPT-03 | Back-to-top on long pages | Keyboard/touch naming, scroll/focus behaviour, reduced motion and obstruction |
| OPT-04 | Reading progress/time for substantial articles | Article-specific progress, reasonable estimate and unobtrusive display |
| OPT-05 | Copy/share for reusable content | Actual clipboard/share outcome, fallback, truthful feedback and private-link policy |
| OPT-06 | Save-for-later/recently-viewed for repeat discovery | Ownership, persistence, removal, account switching and shared-device privacy |
| OPT-07 | Shortcuts for repeated app work | Discovery, typing/browser/assistive-technology conflicts and single-character controls |
| OPT-08 | Custom text sizing beyond browser controls | Working native zoom first, persistence and layout/function at changed size |
| OPT-09 | Interactive tables for exploration | Headers, accessible sorting, correct ordering and narrow-width access |
| OPT-10 | Search/filter/sort for enough content to justify it | Relevant permitted results/suggestions, stable order, clear reset/no-results and URL/back behaviour |
| OPT-11 | Expandable/searchable FAQs for genuine questions | Accurate answers, accessible disclosure and useful filtering; no rich-result promise |
| OPT-12 | Autosave/drafts for costly input | Saving/saved/failed distinctions, interruption/conflict recovery and sensitive-data handling |
| OPT-13 | Password visibility where passwords exist | Accessible name/state, focus, no accidental submit or logging, password-manager support |
| OPT-14 | Contents navigation for long structured material | Correct headings/anchors, keyboard use and destinations clear of sticky UI |
| OPT-15 | Offline access for a defined offline task | Accurate scope, stale/versioned data, queued writes/conflicts and private-cache isolation |
| OPT-16 | Rich tooltips for supplementary help | Keyboard/touch availability, dismissal/persistence and visible essential instructions |
| OPT-17 | Loading animation for a real wait | Useful status plus timeout/failure handling, reduced motion and low rendering cost |
| OPT-18 | Sticky header/CTA or floating contact for the task | Focus/content/consent/virtual-keyboard overlap, reflow, safe areas and competing overlays |
| OPT-19 | Print treatment for printable material | Print preview, readable content/page breaks and removal of irrelevant controls |
| OPT-20 | Confirmation for consequential actions | Correct target, clear commitment, cancellation, focus and proportionate undo |
| OPT-21 | Before-and-after gallery with relevant evidence | Permission, factual context, comparable presentation and no misleading manipulation |
| OPT-22 | Cart reminders as an approved marketing capability | Applicable eligibility/consent, timing, purchase suppression and opt-out; no live send in the audit |
| OPT-23 | A/B tests with a question and suitable data | Hypothesis, primary metric, assignment, analysis/stopping rule, guardrails and uncertainty |
| OPT-24 | llms.txt for maintained public documentation/navigation | Accurate public links and ownership; optional, with no ranking or citation guarantee |

Internationalisation owns translation behaviour; accessibility owns accessible controls; frontend-robustness owns saved state, clipboard and offline correctness; code-audit owns access boundaries. Data-privacy owns retained history, drafts and tracking. Analytics and email-deliverability retain experiment and reminder responsibilities. The catalogue does not create duplicate findings across these owners.

## Layout vocabulary

Choose composition for the content and task. These twelve patterns provide names for discussion; none is a required feature. F- and Z-patterns are design heuristics, not observed eye-tracking evidence about this product's users.

| Pattern | Appropriate question |
|---|---|
| Single column | Does a sequential reading or mobile task benefit from one clear order? |
| Two column | Does a sidebar/detail or navigation/content relationship aid the task? |
| Grid | Do comparable products or gallery items need consistent scanning? |
| F-pattern | Is a text-heavy page organised into meaningful headings and scan points? |
| Z-pattern | Does a simple landing composition lead coherently to its main action? |
| Split screen | Does image/pitch or a genuine two-way choice warrant equal prominence? |
| Magazine | Do stories need clear editorial ranking and different prominence? |
| Asymmetrical | Does uneven emphasis express a real hierarchy without confusing reading order? |
| Holy Grail | Does an app need navigation, central work and supplementary controls together? |
| Masonry | Do mixed-height media justify the visual order and accessible DOM order? |
| Hero landing | Does one offer need an initial explanation and action before supporting detail? |
| Full screen | Does a focused story/task justify a screen, with scrolling and zoom still usable? |

Test real content lengths, narrow viewports, zoom, focus and empty/error states before recommending a layout change. Preserve useful dashboard density. A marketing preference cannot establish that a working product table should become a card gallery.

## Coverage contract

The profile adds two arrays inside coverage.website_readiness: topics and features. It uses the existing report.json and renderer; it is not a separate report. Every topic ID above and all OPT-01 through OPT-24 must appear once. The gate checks declared structure and references, not whether a claim is true.

Each topic contains:

| Field | Contract |
|---|---|
| id | One of the twelve topic IDs above |
| owner | Registered existing lens; for applicable assessed work it must have run |
| applicability | applicable or not_applicable |
| reason | Non-empty factual scope/applicability explanation |
| status | assessed, partial, blocked or not_applicable |
| surfaces | Array naming the actual routes/templates/states considered |
| evidence | Array of mode/ref objects described below |
| finding_ids | Array of surviving canonical report finding IDs, empty when no defect was found |
| limitations | Array of non-empty explanations of remaining assessment work |

Assessed means the stated assessment was performed with the recorded evidence. It does not mean the topic passed or the whole product is safe. Applicable assessed topics need surfaces and evidence. Partial/blocked topics need named limitations and scope.partial=true; their owner must be selected and either run or explicitly deferred. A not_applicable topic needs that same status and a reason, with no evidence, findings or remaining assessment limitations; its registered owner need not be selected. An assessed topic cannot hide unassessed required work in its limitations.

Each feature contains id, presence, decision, reason, finding_ids, evidence and limitations. Presence is present, absent or unknown. Present features use keep, improve or remove with evidence. Absent features use not_needed, recommend, approved or decision_required with a product reason. Unknown presence uses blocked, named limitations and scope.partial=true. A recommendation or owner decision about an absent optional feature does not by itself make the audit partial. Approved records an existing product requirement; it is not permission granted by the auditor to implement it. Keep means no change recommended within the assessed scope, not a certification.

All finding_ids refer to reported survivors after deduplication. Do not reference raw-only, dropped or merged-away IDs. Present features with observed defects must link the appropriate findings; optional recommendations and strengths do not create artificial ledger entries. Do not list findings on a feature whose presence is still unknown, or on a justified absent feature merely because it is missing.

Each evidence entry is an object with mode (source, rendered, interactive or provider) and a non-empty ref. The reference names a retrievable observation/artifact and its context. For source, include source location/revision and captured evidence reference. For rendered evidence, include route, state, viewport, theme and revision. For interactive evidence, include the safe steps, expected/observed result and environment. For provider evidence, identify the product/environment, redacted setting/observation and capture date. These references supplement the source-assurance protocol; that protocol does not authenticate screenshots or provider access. Under `assurance_version: 2` an entry may carry `observation`, the id of a recorded observation whose subject is this topic or feature id; `rendered` and `interactive` entries must carry one that names a completed `web` observation (`observation-contract.md`). A walkthrough nobody recorded is a limitation under version 2.

Document browser, console/network and supported-device checks where needed. Reading source alone cannot demonstrate a completed payment, keyboard journey, rendered contrast or current live configuration. Mark those outstanding requirements partial/blocked. The renderer includes every topic, feature decision and limitation so a summary cannot conceal skipped work.

## Remediation order and completion

Feed defects into the existing severity, verification and remediation-order rules. Start with observed active exposure, money/data loss and blockers to safe testing. Then address the primary task and recovery, accessibility/mobile barriers, performance/discovery, factual/commercial clarity and appropriate polish. Dependencies can change that sequence; state why each priority comes first. Optional additions follow a product decision and do not displace a verified blocker.

For an authorised fix phase, use the native craft skills, focused regression checks and before/after journey evidence. Preserve the original finding identity and record what was actually rechecked. A passing structural gate means the report is internally consistent; it does not prove all defects were detected. Externally controlled settings and unavailable evidence remain named outstanding work.
