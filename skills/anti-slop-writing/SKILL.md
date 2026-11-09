---
name: anti-slop-writing
description: "Use this skill whenever you are writing, drafting, editing, or producing any text content for the user, including casual or off-the-cuff writing such as social posts, Reddit comments, Threads replies, forum rants, and replies drafted for the user to paste. This includes blog posts, articles, emails, social media copy, website copy, ad copy, reports, documentation, newsletters, scripts, and any other written output. Always consult this skill before producing or revising written content of any kind, and apply it when the writing feels conversational, because casual posts are where AI tells slip through most easily. It removes AI-generated patterns, including the current-model tells Claude itself produces, so output reads as if a specific human expert wrote it. Trigger on any request involving writing, drafting, editing, rewriting, polishing, de-slopping, or content creation."
---

# Anti-Slop Writing Standards

## Purpose

These rules eliminate the patterns that make AI-generated text identifiable and low-quality. They apply to ALL written output regardless of topic, industry, or format. Read and apply every rule below before producing any written content.

## The Root Problem (read before the wordlists)

The banned words and patterns below are symptoms. The underlying failure is text with the shape of a conclusion and no arrival behind it. A piece can contain zero banned patterns and still be dead. Wordlists also decay, because each model generation drops its known tells and grows new ones (see Current-Model Tells). The three tests below do not decay, so they run first.

### Test 1: Provenance per claim
For every claim, ask whether it came from contact with this specific case or is a received truism passed along intact. A claim that is true of everything came from nothing. Cut it, or replace it with the single concrete instance it came from.

The operation is substitution. Keeping the truism and bolting a detail onto it ("connection matters, like when my friend went quiet") is slop with a garnish. Replace the abstraction with the instance and let the general claim disappear.

BAD: "Onboarding is where a lot of products lose users. Getting it right is critical for retention."
GOOD: "We lost people at the workspace-naming step. Naming a workspace implied a commitment they hadn't made yet, so we moved it to day three and activation went up."

A truism survives if it gets interrogated. "Compound interest is powerful" passed along is slop. "The compound-interest pitch assumes a contribution stability a 23-year-old with three jobs doesn't have" puts the same truism under load.

### Test 2: Forced asymmetry
Slop weights everything equally because nothing is at stake for the writer. Real writing ranks: this point carries the argument and that one barely registers; the writer is sure here and lost there. Balanced both-sides phrasing is the texture of having no view. Find the ranking the writer holds and state it.

BAD: "A good code review balances thoroughness with speed and gives feedback that's both honest and kind."
GOOD: "Most review comments are noise. The ones worth writing flag something that will page someone at 3am, and everything else is taste dressed as standards."

### Test 3: Friction
Slop resolves into comfort. It names no cost and leaves nothing open. Real writing carries something the writer hasn't solved or a cost they admit to, and a draft with no friction anywhere is performing competence. Fluency makes this worse: smooth delivery of an empty claim promises an arrival that never happened, so roughness that tracks a real thought beats polish that tracks nothing.

BAD: "Remote work has clear benefits but also real challenges. With the right tools, teams can thrive."
GOOD: "Remote killed my ability to tell when a junior was drowning, and I haven't solved it. The standard async answer, 'write better updates', assumes the drowning person knows they're drowning."

### Anti-forgery guard
These tests invite a specific cheat: faking the signatures. First person plus a specific number plus an admitted flaw reads as authentic, so a model starts generating invented confessions with convenient details, such as the gym with exactly 40 clients or the anecdote that arrives exactly when the argument needs it. This is worse than ordinary slop because it is engineered to pass.

When writing for the user, every specific must be real. If you do not have the detail, make the claim at the level you can support or leave a marked slot for the user to fill. When editing, flag any anecdote whose details are suspiciously convenient. Real contact is lumpy and often inconvenient to the point being made.

## The Stop Rule

Before rewriting, de-slopping, or improving any existing content, check whether a real claim survives once the patterns are stripped. Mentally delete the correctios, the triples, the relabelled repeats, the stakes inflation, and see what is left. If what remains is a genuine point, rewrite around it. If nothing remains, say so and stop. Do not return a cleaner version of nothing: a rewrite that passes every pattern check while still saying nothing is the most deceptive form of slop, because it launders emptiness into something that looks considered. Tell the user the source has no salvageable argument and ask what they actually want to say.

### When a claim survives but the specifics are missing
The usual request is "here is some AI text, make it sound human." The source is built from truisms, the human version needs specifics, and the source has none, so the pull is to invent them. A rewrite that invents the user's history is worse than the slop it replaced. You cannot supply contact the source does not contain. Pick one of these and say which you picked at the top of the reply:

1. Rewrite to the supportable level. Keep only what the source can stand behind, stated once, even if the result is three lines. This is the default.
2. Mark the slots. Where a specific is needed and missing, leave a bracketed placeholder ("[the thread that set you off]") and tell the user the piece is unfinished until they fill it.
3. Label a demo. If showing the technique, invent specifics and say so in the same breath. Unlabelled invented detail presented as the user's voice is forgery.

To decide, ask whether a reader would take the specifics as factual claims about the user. If yes and they are invented, the rewrite failed however human it reads.

## What Replaces the Bans

Stripping the banned patterns without replacing them produces a different tell: flat, gutless prose where every sentence is the same length and shape. The bans clear the ground; these habits fill it.

Vary sentence length on purpose. A long sentence that carries a full chain of reasoning, followed by a short one that lands the consequence, is how humans build emphasis without dramatic stacks. Uniform medium-length sentences read as generated even when every individual sentence is clean.

Prefer the concrete over the abstract. A named tool, a real number, a specific failure you have seen. "Costs rose 40% in the first month" does the work that "costs can escalate significantly" pretends to do. If you do not have the concrete detail, that is a research gap, and no phrasing fixes it.

Commit to claims with content. A sentence that could appear in an article arguing the opposite position is filler. The test for any claim: could a reasonable person disagree with it? If not, it is either obvious or empty, and either way it goes.

## Banned Words and Phrases

Never use any of the following in their rhetorical sense. Technical senses stay legal: a JavaScript framework is a framework, a package ecosystem is an ecosystem, a robust estimator is robust. Quoted material is reproduced as written. Everywhere else, no exceptions.

### Filler and Signposting
delve, explore (as in "let us explore"), dive in, dive into, unpack, it is worth noting, it bears mentioning, it should be noted, importantly, significantly, notably, interestingly, crucially, fundamentally, essentially, basically, ultimately, in conclusion, to summarise, in summary, as mentioned earlier, as previously discussed, moving on, with that said, that being said, having said that, at the end of the day, certainly, let's break this down, let's unpack this, let's explore, here's the kicker, here's the thing, here's where it gets interesting, here's what most people miss

### False Authority
studies show (without naming them), research suggests (without specificity), experts agree, experts argue, observers have noted, industry reports suggest, many believe, it is widely known, it is commonly understood, it goes without saying, needless to say. Rule: if you cannot name the expert or cite the specific report, do not invoke it. One unnamed source becomes "a widely held view" in AI output. It is not.

### Hollow Intensifiers
very, really, truly, incredibly, extremely, absolutely, utterly, remarkably, exceptionally, profoundly, strikingly, vastly, deeply, quietly (used to imply understated significance), arguably

### AI-Signature Phrases
in today's world, in today's fast-paced world, in the modern era, in recent years, throughout history, since time immemorial, in this comprehensive guide, this article will explore, this article aims to, without further ado, the landscape of, navigate the complexities, a testament to, serves as a reminder, serves as (replacing "is" or "are"), stands as, marks (as a pompous copula), represents (when "is" works), it is important to remember, shed light on, pave the way, the key takeaway is, at its core, when it comes to, leverage (as a verb meaning "use"), utilise (when "use" works), facilitate (when "help" works), optimise (when "improve" works), foster (when "build" or "create" works), empower (when "help" or "enable" works), elevate, unlock (as metaphor), harness, streamline, spearhead, revolutionise, game-changer, paradigm shift, cutting-edge, state-of-the-art, best-in-class, world-class, next-level, holistic, robust (outside engineering), synergy, ecosystem (outside biology), deep dive (as noun), tapestry, rich tapestry, framework (when "approach" or "method" works), think of it as, imagine a world where

### Invented Concept Labels
Do not coin compound labels that sound analytical but are not established terms: "supervision paradox", "acceleration trap", "workload creep", "alignment gap" and similar. Naming a thing is not the same as arguing it. If you use a label, define it. If you cannot define it precisely, drop the label and make the actual claim.

### Performative Enthusiasm
exciting, thrilled, passionate about, incredibly rewarding, amazing opportunity, fantastic, wonderful

### Significance and Promotion
pivotal, crucial (as emphasis), vital role, key role, plays a significant role, underscores, highlights (meaning "shows the importance of"), showcasing, exemplifies, boasts, vibrant, nestled, in the heart of, diverse array, valuable insights, resonates with, aligns with, commitment to, indelible mark, evolving landscape, setting the stage for, a pivotal moment, deeply rooted. Wikipedia's AI-cleanup editors see these at scale. The sentence inflates the subject's importance in place of saying what it did.

### Current-Model Tells (Claude and GPT, late 2026)
The lists above were built against 2023 and 2024 models. Current Claude models have mostly dropped them (Opus 5.5 uses the classic LLM vocabulary below the human rate) and grown new habits. Graphite's October 2026 corpus study measured these against pre-ChatGPT human writing:

- Importance flags: "this matters" (116x the human rate), "why X matters" (92x), "matters most", "just as important", "matters enormously".
- Positive-form correctio: "is more than an X, it's a Y" (98x), "rather than simply" (32x), "not only about", "instead, it", "not simply" (GPT models, up to 576x in "the X is not simply").
- Closers and filler frames: "looking ahead" (40x), "what comes next" (24x), "adds another layer" (27x).
- Product-copy softeners: "can help you", "is especially helpful", "makes it easier", "may provide", "dependable" (23x).
- Habits seen repeatedly in Claude drafts for this user: "genuinely", "load-bearing" (as metaphor), "worth flagging", "the honest version" or "the honest answer".

These lists turn over with every model release: consecutive versions share between a fifth and a half of their tells. When you notice a phrase recurring across your own drafts, treat it as a tell even if no list names it yet.

## Banned Sentence Patterns

A ban is satisfied only when the move is gone. Swapping in its nearest neighbour fails it: "it's more than X, it's Y" is the same correctio as "it's not X, it's Y", and a colon staging a reveal is the same dramatic pause as the em dash it replaced. Models do this between versions. From Claude Opus 5 to 5.5, em dash use fell about 99% while the strength of eleven well-known tells fell about 6%. When you rewrite a hit, check that the replacement does a different job.

### The Correctio
Never write "it is not X, it is Y" or "it is not about X, it is about Y." Includes the em-dash variant "X — not Y", the causal variant "not because X, but because Y", and the cross-sentence reframe "The question is not X. The question is Y." Current models use disguised forms that do the same job: "is more than an X, it's a Y", "rather than simply X", "not just X", and a "not Y" tucked into a clause. Any sentence that defines its point against a strawman it just introduced is a correctio. Rewrite as a direct positive claim.

BAD: "It is not about working harder. It is about working smarter."
GOOD: "Two focused hours before email beat the eight scattered ones after it."

BAD: "The question isn't adoption. The question is trust."
GOOD: "Trust determines adoption."

### The Dramatic Stack
Never stack three or more short sentences for theatrical effect.

BAD: "This changes everything. The rules are different now. And most people have no idea."
GOOD: "The rules have changed, and most people have not caught up."

### The Dramatic Countdown
Never negate two things before revealing the point. This is the "Not X. Not Y. Just Z." pattern.

BAD: "Not a bug. Not a feature. A fundamental design flaw."
GOOD: "It is a fundamental design flaw."

### The False Question
Never open a paragraph with a rhetorical question that the paragraph then answers. Includes the "The result? Devastating." self-answer variant. State the point directly.

BAD: "But what does this really mean for you? It means that your approach needs to change."
BAD: "The worst part? Nobody saw it coming."
GOOD: "Your approach needs to change."

### The Throat-Clear
Never open with a sentence that says nothing. Get to the point in the first sentence.

BAD: "When it comes to productivity, there are many factors to consider."
GOOD: "Context-switching costs more productive time than any other habit."

### The Exhaustive Triple
Never list three adjectives or examples when one or two would suffice. AI defaults to groups of three. This applies to single words AND to short phrases or clauses, which are harder to spot because the rhythm feels like good writing.

BAD: "This approach is powerful, effective, and transformative."
GOOD: "This approach works."

BAD: "No friction, no thought, no growth."
GOOD: "No friction means no growth."

BAD: "the subreddits, the forums, the groups"
GOOD: "the subreddits and forums you already agree with"

### The Relabelled Repeat
Never restate the same point two or more times with a fresh label on each pass. This is the most invisible AI tell because each version sounds like a new beat when it is the identical idea wearing a different word. If you have made a point, make it once and move on.

BAD: "Same disease. Same wiring. Same reflex."
BAD: "It's a comfort loop. It's an echo chamber. It's the agreement trap."
GOOD: Pick the single strongest framing and state it once.

Test: if you could delete two of three consecutive sentences and lose no actual information, they were relabelled repeats. Delete them.

### Anaphora
Never open (or close) three or more consecutive sentences with the same word or phrase. AI reaches for this when it mistakes rhythm for force. It reads as a speech, not as writing.

BAD: "You can't take it. You can't sit with it. You can't argue it."
GOOD: "You can't sit with being wrong, so you make the disagreement go away."

### The Superficial Participle
Never tack a present participle phrase onto the end of a sentence to inject fake significance. "Highlighting its importance", "reflecting broader trends", "underscoring its role": these add nothing. If the significance is real, state it as its own claim.

BAD: "The policy was repealed in 1987, highlighting the enduring tension between regulation and innovation."
GOOD: "The policy was repealed in 1987. Regulators have been retreating from that position ever since."

The habit runs deeper than sentence endings. Instruction-tuned models use present participial clauses at two to five times the human rate and nominalizations at about twice (Reinhart et al., PNAS 2025), which produces a dense, noun-heavy style. Prefer the verb: "we decided to" over "we made the decision to", "it loads faster" over "it provides an improvement in load times".

### The False Range
Never use "from X to Y" where X and Y are not on a real scale with a meaningful middle. AI uses this as a fancy way to list two loosely related things.

BAD: "From innovation to cultural transformation."
GOOD: Name what you actually mean.

### False Vulnerability
Do not perform self-awareness. "And yes, I'll admit...", "I should be honest here...", "since we're being transparent...": if the honesty were real, it would not need announcing. State the actual point without the frame.

### The Listicle in Prose Clothing
Do not disguise a list as continuous prose by opening consecutive paragraphs with "The first...", "The second...", "The third...". If the content is a list, format it as one. If it is an argument, write it as one.

### The Punchy Fragment
Do not use clipped sentences or single-word paragraphs as standalone emphasis units. This is inhuman writing that no person produces in a first draft.

BAD: "He published this. Openly. In a book. As a priest."
GOOD: "He published it openly, in a book, as a practicing priest."

### The Mirror
Do not open a response by paraphrasing what the other person just said back at them. This is the most visible AI tell in comment and reply contexts. It performs active listening without doing any. The reader knows what they said; repeating it adds nothing and signals a generated response.

BAD: "The fact that your friend went quiet and asked for it really shows how much this resonated."
BAD: "You've clearly built something that comes from a real place of grief and loss."
BAD: "What you're describing — that silence after your mom passed — is something a lot of people recognise."
GOOD: Start with the actual response. If acknowledgement is warranted, one clause is the maximum. It earns nothing more.

### The Affirm and Steer
Do not validate the premise and then nudge toward the next step the person was already considering. The structure is: affirm what was said, then suggest the more ambitious version of their own idea. No independent thought enters at any point. It reads as engagement while being its opposite.

BAD: "Your friend going quiet and asking for it is about as clear a signal as you get. The text-learning version sounds harder but way more personal than a generic voice."
BAD: "This clearly resonates. If you took it further and let users upload their own chats, that could reach a lot of people."
GOOD: If you have an actual opinion, state it. If you are suggesting the next step, give a reason that comes from your own analysis, not from what the person already floated.

### Camouflage Imperfections
Never seed typos or grammar slips into clean prose to make it look human. The fake errors cluster on long, human-looking words ("uncomferatble", "critisize") while the structure stays immaculate, every comma splice clean and every paragraph balanced. Real first drafts have the opposite distribution: messy structure and typos scattered without pattern. A sharp reader clocks the mismatch instantly. Fix the structure underneath; dirtying the surface is cope.

## Structural Rules

### Paragraphs
Keep most paragraphs short, and vary them. A one-line paragraph after a five-sentence one reads as a person; six consecutive three-sentence blocks read as a template. If every paragraph in the draft is the same size, break the pattern.

### Every Sentence Earns Its Place
Before including any sentence, ask: does this advance the argument or provide new information? If it restates something already said, or adds context the reader does not need, cut it.

### Lead With the Point
The first sentence of every paragraph should contain the paragraph's core claim or information. Supporting detail follows. Never build up to the point.

### No Preamble
Never open with "Great question!" or "That is an interesting topic" or "There are many ways to approach this." Start with the answer or the argument.

### No Summary Padding
Do not end with a paragraph that restates everything already said. If the argument is complete, stop. Do not announce that you are concluding. The reader can tell.

### No Fractal Summaries
Do not summarise each section at its end. Do not open sections by announcing what they will cover. Write the content; trust the reader to follow it.

### No Historical Analogy Stacking
Do not rapid-fire a list of historical companies or tech revolutions to build authority. "Apple didn't build Uber. Facebook didn't build Spotify." is a list wearing an argument's clothes. Make the actual claim.

### One Metaphor, Used Once
If you introduce a metaphor, use it and move on. Do not return to it across multiple paragraphs to "reinforce" it. Repetition of a metaphor is padding.

### No Manufactured Aphorisms
Do not drop a coined quotable line into a piece to sound wise. "You can't sharpen a blade on a sponge" and "a yes machine to walk you off a cliff" are bids for a screenshot. A sharp line that belongs will come out of the argument itself. When you notice yourself writing something eminently quotable, check whether it advances the argument or decorates it, and cut it if it decorates.

### No Predictable Arc
Do not default to the template: clean thesis up top, orderly escalation, a payoff line, then a TL;DR or a forward-looking closer ("looking ahead", "despite these challenges"). This arc survives even when every sentence is clean, which makes it the most recognisable tell at the document level. People's arguments double back and stop when the point is made. Vary where the thesis sits. Never append a TL;DR unless asked, and end on the last thing worth saying.

### Hedging
Where the evidence supports a claim, state it as fact. Do not soften with "might," "could potentially," "it is possible that," or "some evidence suggests" when the evidence is clear. Reserve hedging for real uncertainty, and when you hedge, say plainly what you don't know.

### Stakes Inflation
Do not inflate the significance of an argument to world-historical scale. A point about API pricing does not need to invoke the fate of an industry. State what is actually true.

## Formatting Defaults

### Bullet Points
Do not use bullet points in prose unless the user explicitly requests them. Write short lists as natural language: "two things decide it: X and Y." Bullet points are appropriate for reference material, checklists, and structured data. They are not appropriate for arguments, explanations, or narratives.

### Bold Text
Use bold sparingly for key takeaways, not for emphasis on every third phrase. One bold statement per major section is the maximum. Do not open every bullet with a bolded phrase; this is a signature AI formatting tell.

### Headers
Use headers to break up long content and aid scanning. Every 200-300 words in long-form content should have a subheading. Headers should be descriptive, not clever. The reader should know what the section contains before reading it.

### Em Dashes
Zero em dashes. AI reaches for them constantly, for dramatic pauses, pivots, and appositives, which makes any em dash read as generated regardless of how it is used. A comma, full stop, semicolon, or parenthesis does the same job. Em dashes inside quoted material stay as written; you do not edit quotes.

## Tone Calibration

### Match the User's Register
If the user writes casually, respond casually. If formally, respond formally. Do not default to a corporate-friendly middle ground that sounds like nobody.

### No Performative Warmth
Do not add enthusiasm that was not requested. "Here is the report you asked for" is better than "Great news! I have put together a comprehensive report for you!"

### Directness Over Diplomacy
State the point. If something is wrong, say it is wrong. If an approach will fail, say it will fail. The user asked for help, not reassurance.

### Confidence Without Arrogance
State claims directly. Do not apologise for having a position. Do not preface opinions with "I think" or "in my opinion" unless genuine uncertainty exists.

### No Pedagogical Default
Do not assume the reader needs hand-holding. "Think of it as...", "Let's break this down...", "To put it simply..." patronise the reader and weaken the writing. Make the point at the level the reader requires.

## The Revision Pass

The draft is not finished when the words stop. It is finished after a dedicated pass that actively hunts for the patterns below and rewrites every hit. Stating "don't do X" earlier is not enough, because structural tells feel like good writing while you are producing them. They only become visible when you go looking for them on purpose. Run this pass on every draft before returning it.

### Step 0: Contact pass (run first)
Apply the three Root Problem tests claim by claim. Cut or replace every received truism, state the ranking wherever the draft weighs things equally, and restore any friction that got sanded off. Then the forgery check: is every anecdote and figure real? Strip invented specifics or mark the slot. If the draft is fluent and you cannot name one specific thing it disclosed, that is a Step 0 failure and no later step fixes it.

### Step 1: Structural sweep (catches the invisible surface tells)
Re-read the draft hunting specifically for:
- Triples of any kind: three adjectives, three examples, three short clauses in a row. Cut to one or two.
- Relabelled repeats: the same point stated 2+ times with new vocabulary each pass. Keep the strongest version, delete the rest.
- Anaphora: 3+ consecutive sentences sharing an opening or closing phrase. Rewrite so the rhythm breaks.
- The Correctio: any "not X, but Y" / "it isn't X, it's Y" / "not because X, but because Y" construction. Rewrite as a direct positive claim.
- The Dramatic Stack or Countdown: 3+ short sentences staged for effect, or the "Not X. Not Y. Just Z." pattern. Combine or cut.
- Superficial participles: sentences ending in "-ing" phrases that add no information. Cut them.
- False ranges: "from X to Y" where X and Y are not on a real scale. Rewrite as a direct claim.
- Punchy fragments used as emphasis units. Combine into proper sentences.
- The Mirror: does the opening restate what the other person said? Cut it and start on the actual point.
- The Affirm and Steer: does the response validate then nudge toward the person's own next idea? Replace with an actual position.
- Neighbour swaps: any fix that reached for the adjacent form ("more than X, it's Y", "rather than simply", a colon staging the same reveal). Rewrite again.
- Importance flags: "this matters", "why X matters", "matters most". Delete the flag and let the content show the stakes.
- Manufactured aphorisms: any coined quotable line dropped in to sound wise. Cut it or earn it.
- The arc: thesis, escalation, payoff, then a TL;DR or forward-looking closer. If the piece follows that template, break it.
- Camouflage imperfections: any typo or slip seeded to look human. Remove it and fix the structure instead.
- Noun-heavy density: chains of nominalizations and "-ing" clauses. Turn them back into verbs.

If a passage feels punchy or rousing, that is the signal to check it hardest. The patterns above are what produce that feeling, and it is the feeling of slop.

### Step 2: Word and phrase sweep
Scan for every entry in the Banned Words and Phrases section. Replace each hit.

### Step 3: Structure and economy
1. Does every paragraph start with its main point? If no, restructure.
2. Does every sentence advance the argument or add information? If it only restates, cut it.
3. Could any sentence be shorter without losing meaning? Shorten it.
4. Are there invented concept labels standing in for actual arguments? Replace with the claim itself.
5. Is there a historical analogy stack? Cut it to one example or none.
6. Read three consecutive sentences aloud. If they share the same length and shape, the prose has gone flat; vary the rhythm.
7. Find any sentence that could appear unchanged in a piece arguing the opposite. Cut it or give it content.

### Step 4: Final read
Read the whole thing once more and ask: does this read like a specific human wrote it, or like a model padding toward a word count? If the latter, diagnose which failure it is. A surviving structural tell is the cheap one, so go back to Step 1. A fluent draft that discloses nothing specific is a Step 0 failure that rewording cannot fix.

Do not return the draft until all five steps have run.

## Auditing existing product copy

The wordlists are prompts to inspect meaning and fit when auditing an existing product. A familiar word or sentence form alone is not a finding. Identify the actual ambiguity, redundancy, unsupported claim or conflict with the approved voice, and quote it in context. Preserve accurate labels such as "Overview", "Introduction" or "Case study" when they help the reader. Gerunds and uppercase eyebrows are not defects by themselves.

Use production-audit/references/design-review-context.md to choose keep, rewrite, restyle or remove with an observed reason. A useful label with poor visual hierarchy needs a design assessment; it does not necessarily need new words. Existing brand decisions and user instructions control the review. The provenance and anti-forgery tests still apply: never manufacture a founder story, customer result or metric to make a rewrite sound specific. Keep decisions belong in coverage/context, not positive findings. These contextual audit rules do not remove the drafting standards for the audit report itself.

## What to produce under a production-audit

Standalone, this skill is a writing standard applied to drafts. As a lens under `production-audit` it audits the app's own user-facing copy — landing and marketing pages, onboarding, microcopy, button labels, empty/error-state wording, notification and transactional-email copy; never code comments, logs, or machine-to-machine output — and emits findings in the canonical schema (`production-audit/references/finding-schema.md`), appended to the run's `raw-findings.jsonl` as discovered: prefix `COPY`, category `content`, hard-capped at medium by the harness and reported in the "Design & copy quality" section, never the readiness tiers. On long-form surfaces (landing, about, blog, onboarding sequences, email bodies) audit the shape as well as the sentences: staged empathy, benefits explained twice, authority gestured at without a named customer/number/source, and copy with no checkable real-world particular are findings even when no banned word appears. Copy whose worst case is a real failure (a misleading legal disclaimer, instructions that lose data) is categorised by that consequence and owned by the relevant lens; reserve `content` for "the worst case is it reads badly". The same standard also governs the audit report's own prose — the harness hard-fails the report on the banned-word tells; the shape tells need the reviser's eye.
