# AI-Generated Code Tells

Patterns that signal code was written by an AI and merged without senior review. Each pattern on its own might appear in human-written code; what makes them tells is when several co-occur in the same codebase, or when they appear in code that's otherwise competent (an AI writes syntactically correct code that misses the conventions a human absorbs from working on a team).

These patterns are not about whether the code works. AI-generated code often passes tests. The problem is that it's expensive to maintain, inconsistent with itself, and fragile under change — the same cost as junior code, at higher volume.

## Over-abstraction and unnecessary indirection

**Wrapper functions that add nothing.** A function that exists to call another function with no additional logic: `function getUser(id) { return fetchUser(id); }`. AI models produce these when they're uncertain whether a layer is needed. If the wrapper adds no value (no error handling, no caching, no mapping), inline it.

**Premature patterns.** A Strategy pattern with one strategy, a Factory that produces one type, an EventEmitter with one listener, an abstract class with one subclass. AI models apply design patterns eagerly because the training data is full of examples. A pattern earns its complexity when there are multiple concrete cases, not before.

**Configuration objects for things that don't change.** A `config` parameter with five fields, all hardcoded at every call site. This is indirection without flexibility. Hardcode the values where they're used, or if they genuinely vary, extract only the fields that vary.

**Interfaces for internal code that has one implementation.** An interface and a class that implements it, where nothing else ever will. In application code (not a library), this is premature abstraction. Use the concrete type until you have a second implementation or a test double that needs it.

## "Just in case" defensive code

**Guarding impossible states.** `if (user === null) throw new Error('user is null')` immediately after a line that would have already thrown if user were null. AI models add null checks defensively without reasoning about whether the null case is reachable. Every guard should protect against something that can actually happen; guards against impossible states are noise that obscures the guards that matter.

**Defensive copying when mutation isn't a risk.** `const copy = { ...obj }` before reading (not writing) the object, or spreading into a new array just to iterate it. Defensive copies are appropriate when a function might mutate the data; copying data you only read is waste.

**Redundant type assertions.** `as string` on something that's already typed as string, or `String(x)` on a value that can only be a string. The AI wasn't sure of the type and added a conversion to be safe. The solution is to fix the type, not to patch around it.

**Multiple layers of the same validation.** Input validated in the UI, validated again in the API handler, validated again in the service, validated again before the database write — the same check four times. Validate once at the system boundary; internal code trusts the validated type.

## Inconsistency within the same codebase

**Multiple patterns for the same operation.** Three different ways to make an API call across the codebase (raw fetch in one file, axios in another, a custom wrapper in a third). Three different error handling approaches. Two different state management patterns in the same app. Human developers working on a team converge on one approach through code review; AI generates whatever fits the immediate context without checking what the rest of the codebase does.

**Style drift within a file.** The top of a file uses arrow functions and the bottom uses function declarations. One function uses async/await and the next uses `.then()`. Const in some places, let in others for values that never change. This signals different generation sessions pasted together without a consistency pass.

**Import style inconsistency.** Named imports in one file, default imports for the same library in another. Relative paths in some files, aliases in others. Path depth that varies (`../../utils` vs `@/utils` vs `utils`). A human codebase settles on one convention.

## Over-commenting and under-commenting

**Comments that narrate the code.** `// Get the user from the database` above `const user = await db.getUser(id)`. The code already says this. AI models add these because their training data includes heavily-commented tutorials and documentation. The comment earns its place only if it says *why*, not *what*.

**JSDoc on every function regardless of complexity.** A `@param id - The user's ID` `@returns The user object` on a function whose signature already says `(id: string): Promise<User>`. Documentation that repeats the types is noise. Document non-obvious behaviour, constraints, and side effects — not the type signature.

**No comments where they're needed.** A complex regex, a non-obvious business rule, a workaround for a specific browser bug, or a performance hack with no explanation. AI models tend to either comment everything or nothing; they rarely hit the human balance of "comment only the surprising parts."

## Code that looks competent but misses team conventions

**Perfect code that doesn't match the project.** A function that's well-structured in isolation but uses different conventions from everything around it: different error handling, different naming, different file structure, different import patterns. Human code evolves within its context; AI code is generated fresh each time.

**Boilerplate from a different framework version.** Code that follows patterns from the AI's training data that don't match the project's actual framework version. Class components in a hooks-era React app, `var` in modern JavaScript, callback-style Node.js in an async/await codebase.

**Missing project-specific patterns.** The project has a logging utility, but the AI-generated code uses `console.log`. The project has a custom error class, but the new code throws generic `Error`. The project has a response helper, but the new route builds the response object manually. AI doesn't grep the codebase for existing utilities before writing.

## Deferred implementations

The most dangerous AI pattern. The code looks complete — the file structure is there, the functions exist, the types are defined — but the actual work is deferred behind placeholders. AI does this because it generates structure eagerly and fills in behaviour on request. If nobody asks "did you actually implement this?", the stub ships.

**Placeholder return values.** A function that returns `[]`, `null`, `{}`, `true`, `0`, or a hardcoded string instead of computing the real result. The function signature promises behaviour; the body delivers a constant. Common in validation (`return true`), data fetching (`return []`), and permission checks (`return false` — which silently denies everyone, or `return true` — which silently allows everyone).

**TODO as implementation.** A function body that's a comment: `// TODO: implement this`, `// TODO: add validation`, `// TODO: connect to database`. The function exists, it's called, the caller handles its return value — but the function does nothing. AI produces these when it's building the call graph and hasn't been told to fill in every leaf. The caller looks correct. The leaf is empty.

**Stubbed error handling.** `catch(e) { // handle error here }` or `catch(e) { // TODO: proper error handling }`. The try/catch structure exists, which makes it look like errors are handled. They aren't. The error is silently swallowed, and the code continues as if nothing went wrong.

**Mock data in production paths.** Hardcoded arrays of users, products, or configuration that should come from a database or API. AI often generates these as examples during development and they survive into production because they work in demos. The tell: the data has suspiciously clean formatting, round numbers, and names like "John Doe" or "Acme Corp."

**Incomplete branching.** A switch statement or if/else chain that handles two of five cases, with the rest falling through to a default that returns nothing or throws a generic error. Sometimes there's a comment (`// handle other cases`), sometimes not. The code looks like it covers the domain; it covers a fraction of it.

**Deferred security.** Comments where security controls should be: `// TODO: add authentication`, `// TODO: check permissions`, `// TODO: rate limit this endpoint`, `// TODO: sanitize input`. These are the highest-risk deferrals because the code is reachable and unprotected, and the comment creates a false sense that someone knows about it.

**Fake configuration.** Config objects with hardcoded values that look like they should be environment-driven: `const config = { apiUrl: 'https://api.example.com', timeout: 5000, retries: 3 }`. The structure suggests configurability; the values are baked in.

**Empty lifecycle and hooks.** `useEffect(() => { // fetch data on mount }, [])` or `componentDidMount() { // initialize }`. The hook is registered, the dependency array is correct, the body is a comment. The component mounts and does nothing.

**How to catch it:** search for functions shorter than 5 lines that contain `return` followed by a literal (`true`, `false`, `null`, `[]`, `{}`), and for `TODO`/`FIXME`/`HACK` inside function bodies (not above them). A TODO above a function is a note; a TODO *as* the function body is a deferred implementation.

## Volume without depth

**Many files, shallow implementation.** A feature spread across a dozen files (types, utils, helpers, constants, hooks, components, tests) where three files would do. AI models tend to produce more files because they generate code in a pattern-completion mode that reaches for structure before substance. The tell is when the majority of files are thin wrappers or type re-exports.

**Exhaustive handling of cases that don't exist.** A switch statement with handlers for every possible status code when the API only returns three. A union type with ten variants when the domain has four. AI generates comprehensive code from general knowledge rather than from the specific requirements.

**Tests that test the implementation, not the behaviour.** Tests that assert internal state, mock everything, and break when you refactor without changing behaviour. AI generates tests that mirror the code's structure rather than testing what the code should *do*. The tell: every test reads like a line-by-line replay of the implementation.

## How to use this list

These patterns are signals, not proof. Human developers produce some of these patterns too, especially under time pressure. What makes a codebase read as AI-generated is the *density*: multiple tells co-occurring, inconsistency that no single author would produce, and competent syntax wrapping shallow judgment.

When auditing for AI-generated code, count the tells per file or per feature. One or two is normal. Five or more in the same area, especially the inconsistency tells, is a codebase that was generated and not reviewed.
