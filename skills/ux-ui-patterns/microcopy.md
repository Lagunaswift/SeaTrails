# Microcopy

## 1. Button Labels

### The Rule

Button labels describe what happens when you click them. Not what the button is for. Not what the user is about to do conceptually. What the system will do.

```
Bad:  "Submit"  (submit what?)
Bad:  "OK"      (OK to what?)
Bad:  "Yes"     (yes to what? This forces the user to re-read the dialog)
Good: "Delete project"
Good: "Send invoice"
Good: "Save changes"
Good: "Create account"
```

### Specificity

The more consequential the action, the more specific the label should be.

```
Low stakes:   "Save" is fine for a settings form
Medium stakes: "Send message" for a message composer
High stakes:  "Delete project and all contents" for a destructive action
```

### Verb First

Start button labels with a verb. The action comes first because the user scans for what they can do.

```
"Save draft" not "Draft save"
"Add to cart" not "Cart addition"
"Export as PDF" not "PDF export"
```

### Primary vs Secondary

The primary action (the one you want the user to take) is visually prominent. The secondary action (cancel, go back, dismiss) is visually subdued.

In destructive confirmation dialogs, the destructive action is the primary action but should be styled as dangerous (red, outline) and the safe action ("Keep project") should be styled as the visually stable choice.

---

## 2. Error Messages

### Structure

Every error message: what went wrong + what to do about it.

```
Bad:  "Invalid input"
Good: "Email address is not valid. Check for typos — it should look like name@example.com."

Bad:  "Error 403"
Good: "You do not have permission to view this page. Contact your admin to request access."

Bad:  "Request failed"
Good: "Could not save your changes because the connection was lost. Your changes are saved locally and will sync when you are back online."
```

### Tone

Errors are already frustrating. The message should be calm, specific, and helpful. Never blame the user ("You entered an invalid email"). State the problem objectively ("This email address is not valid").

Do not apologise excessively. One "sorry" in a major error is fine. "We are sorry for the inconvenience and we truly apologise for this issue" is grovelling. State the problem and the solution.

### Technical Information

Do not show technical details to non-technical users. Log the stack trace and error code server-side. Show the user a human message.

If technical users might need the error detail (API users, developers), provide it in an expandable section or a copyable error ID they can send to support.

---

## 3. Empty State Copy

### First-Use Empty States

Explain the feature, motivate usage, and provide a clear action.

```
Title: "No projects yet"
Body: "Projects help you organise your work. Create your first project to get started."
CTA: [Create project]

Not:
Title: "Welcome to your dashboard!"
Body: "This is where you will see all your amazing projects! Get started on your journey today!"
```

Keep it factual. The feature sells itself by being useful, not by exclamation marks.

### No Results

Tell the user what you searched for and how to get results.

```
"No results for 'invioce' — did you mean 'invoice'?"
"No results matching your filters. Try removing some filters or broadening your search."
"No transactions in March 2026. Showing all time instead? [Show all]"
```

Always offer a path forward. Never leave the user at a dead end.

---

## 4. Confirmation Dialog Copy

### Title

State the action as a question: "Delete this project?" or "Send this invoice?"

### Body

State the consequences. Only the consequences the user might not already know.

```
Good: "This will permanently delete the project and all 23 files inside it. This cannot be undone."
Bad:  "Are you sure you want to delete? Deleting will delete this item." (redundant)
```

### Actions

Specific verbs, not generic.

```
Good: "Delete project" / "Keep project"
Good: "Send invoice" / "Go back"
Bad:  "Yes" / "No"
Bad:  "OK" / "Cancel"
```

---

## 5. Placeholder Text

### What Placeholders Are For

Showing format examples and providing brief hints when the label needs clarification.

```
Label: "Email"         Placeholder: "jane@example.com"
Label: "Phone"         Placeholder: "+44 7700 900000"
Label: "Date of birth" Placeholder: "DD/MM/YYYY"
Label: "Search"        Placeholder: "Search by name, email, or ID..."
```

### What Placeholders Are Not For

- Not labels. Placeholders disappear on focus. If the label disappears, the user loses context.
- Not instructions. "Please enter your email address here" as placeholder text adds nothing.
- Not required field indicators. Use "(required)" in the label.

### Placeholder Contrast

Placeholder text should be visually lighter than user-entered text (to distinguish empty from filled) but still readable. Minimum contrast of 4.5:1 against the background per WCAG. Many default placeholder colours fail this.

---

## 6. Tooltips and Help Text

### Tooltips

Use for: brief additional context on hover/focus. Icon meanings, abbreviation expansions, field format hints.

- Trigger on hover (desktop) and long-press or focus (mobile).
- Keep tooltips under 10 words.
- Do not put essential information in tooltips — users may never see them.
- Do not put interactive content (links, buttons) in tooltips.

### Inline Help Text

For form fields that need more explanation than a label provides, use help text below the field (same position as error messages, but in a muted style).

```
Label: "API key"
Help text: "Find this in your account settings under Developer > API Keys."
```

Help text is always visible, unlike tooltips. Use it when the information is important for completing the field correctly.

### Info Icons

A small "?" or "i" icon next to a label, triggering a tooltip or expandable help section. Use sparingly — if every field needs an info icon, the labels are not clear enough.

---

## 7. Loading and Progress Copy

### What to Say While Waiting

If the wait is expected (submitting a complex form, generating a report), tell the user what is happening.

```
"Creating your account..."
"Generating report — this usually takes about 30 seconds."
"Analysing document (3 of 7 pages processed)..."
"Saving your changes..."
```

Keep it factual. Do not add personality or jokes to loading messages unless the brand warrants it. A banking app should not say "Crunching those numbers!" while processing a payment.

### Progress Indicators

If progress is measurable, show it: "Uploading: 67%" or "Step 3 of 5."
If progress is not measurable, show activity: a spinner with a status message. Update the message periodically to show the system is still working, not stuck.

---

## 8. Onboarding Copy

### Principles

- Teach by doing, not by reading. Guided tasks ("Create your first project") over tutorial text ("Here is how projects work").
- One concept at a time. Do not explain 5 features in one tooltip tour.
- Skippable. Always. The user may already know. Force-walking them through a tour they cannot skip builds resentment.
- Contextual. Show the tip when the user reaches the feature, not upfront in a 10-step walkthrough they will forget by step 3.

### Welcome Messages

```
Good: "Welcome to [App]. Create a project to get started." [Create project]
Bad:  "Welcome to [App]! We are so excited to have you here. Let us show you around! [Start tour]"
```

The user signed up because they have a job to do. Help them do it. The tour is optional.

---

## 9. Settings and Preferences Copy

### Label by Outcome

```
Bad:  "Enable WebSocket transport"
Good: "Real-time updates"

Bad:  "Configure SMTP relay"
Good: "Email delivery settings"

Bad:  "Toggle dark mode"
Good: "Dark mode" (with a toggle — "toggle" is what the control does, not what the setting is)
```

### Descriptions

Each setting has a one-line description of what it does, not how it works.

```
Setting: "Email notifications"
Description: "Receive an email when someone comments on your projects."

Not: "When enabled, the system dispatches SMTP messages to your registered address upon comment events."
```

### Destructive Settings

Settings that are hard to reverse (deleting data, disconnecting integrations, revoking access) should have clear warnings and confirmation steps, using the same patterns as destructive action confirmation.

---

## 10. System Status Messages

### Maintenance

```
"Scheduled maintenance on Saturday 24 May, 2:00-4:00 AM UTC. You may experience brief interruptions."
```

State: when, how long, what the impact is. Do not say "We will be performing routine maintenance to improve your experience." That is filler. State the facts.

### Incidents

```
"Some users are experiencing slow response times. Our team is investigating. Last updated 5 minutes ago."
```

State: what is affected, that you are aware and working on it, when you last checked. Update regularly. Do not say "We apologise for any inconvenience" — say what is happening and when it will be fixed.

### Deprecation

```
"This feature will be removed on 1 November 2026. [Learn about the replacement] [Migrate now]"
```

State: what is changing, when, what to do. Provide the action, not just the announcement.
