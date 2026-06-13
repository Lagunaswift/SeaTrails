# Forms and Input

## 1. Form Layout

### Single Column

Use single-column forms by default. Multi-column forms increase error rates because users scan in Z-patterns and miss fields. The exception: very short related fields (city + postcode, first name + last name) can sit side by side if the relationship is obvious.

### Field Order

Order fields by: required information first, optional information last. Within required fields, order by the user's mental model, not your database schema. Name before email before password. Shipping address before billing address.

### Labels

- Place labels above fields, not beside them. Above-label forms are faster to scan and work better on mobile.
- Labels should be 2-4 words. "Email address" not "Please enter your email address below."
- Never use placeholder text as the only label. Placeholders disappear on focus, leaving the user without context.
- Placeholder text is for examples ("jane@example.com") or format hints ("DD/MM/YYYY"), not labels.

### Required vs Optional

Mark the minority. If most fields are required, mark optional ones with "(optional)". If most are optional, mark required ones with "(required)" or an asterisk with a legend. Never assume users know that asterisk means required.

### Field Sizing

Size fields to match expected input length. A postcode field should be short. An address field should be wide. A phone number field should be medium. Sizing communicates expected input before the user types anything.

---

## 2. Validation

### When to Validate

**On blur (field loses focus):** Validate after the user finishes a field, not while they are typing. Validating on every keystroke produces errors like "Email is invalid" when the user has typed "j" — they are not done yet.

**Exception: character counts and format guides.** If a field has a maximum length, show a live character counter as they type. If a field requires a specific format, show format guidance as they type (phone number auto-formatting, for example).

**On submit:** Validate everything on form submission as a safety net, even if inline validation already ran. The user may have bypassed inline validation (tabbed through a field without entering it, JS failed to load).

### Error Display

- Show the error message directly below the field it applies to, in red or your error colour.
- Add a red border to the errored field.
- Scroll to the first error if it is off-screen.
- Focus the first errored field.
- Keep the error visible until the user fixes the input (do not auto-dismiss after a timer).
- Clear the error when the input becomes valid (validate on change after an error has been shown).

### Error Messages

Field-specific. "Password must be at least 8 characters" not "Invalid password." If the rule is complex, state the rule: "Password needs 8+ characters" not "Password does not meet requirements."

---

## 3. Multi-Step Forms

### When to Use

Use multi-step (wizard) forms when:
- The form has more than 8-10 fields
- Fields naturally group into logical sections
- Later fields depend on earlier answers
- The process benefits from progressive commitment (the user feels invested after completing step 1)

### Progress Indication

Show: current step, total steps, step labels. "Step 2 of 4: Shipping address." A progress bar or step indicator at the top of the form.

### Navigation

- Allow backward navigation (the user can go back to change earlier answers).
- Preserve all entered data when navigating between steps.
- Validate the current step before allowing forward navigation.
- Show a summary/review step before final submission for important forms (checkout, application).

### Saving Progress

For long forms (applications, onboarding), auto-save progress so the user can return later. Show "Draft saved" with a timestamp. Provide a way to resume from where they left off.

---

## 4. Inline Editing

### Pattern

The user clicks a value to edit it in place, without navigating to a separate edit page or opening a modal. Useful for: names, titles, descriptions, simple fields.

### Implementation

- Click on text → text transforms into an input pre-filled with the current value.
- Show save/cancel buttons or use Enter to save, Escape to cancel.
- Show a pencil icon or underline on hover to indicate editability.
- Save on blur (clicking away) is controversial — it can cause accidental saves. Prefer explicit save action.
- Show a brief "Saved" indicator on successful save.

### When Not to Use

Do not use inline editing for: complex fields (date ranges, file uploads), fields that require validation context from other fields, or fields where accidental changes have serious consequences.

---

## 5. Search

### Anatomy

- Search input is prominent and discoverable. Top of the page or in the header.
- Search icon inside the input as a visual cue.
- Clear button (X) appears when the input has text.
- Keyboard shortcut (Cmd/Ctrl + K) for power users.

### Behaviour

- Search as you type with debounce (300ms delay after the user stops typing).
- Show results in a dropdown for quick navigation, or on a results page for comprehensive search.
- Highlight matching text in results.
- Show recent searches on focus (before the user types).
- "No results" state with suggestions: check spelling, try different terms, or browse categories.

### Search Results

- Show result count: "47 results for 'invoice'."
- Show what was matched (title, description, content) with the matching portion highlighted.
- Preserve the search query in the URL so it is shareable and survives page refresh.
- Provide sorting options (relevance, date, name) on the results page.

---

## 6. Filtering and Sorting

### Filter Patterns

**Filter bar:** Horizontal row of filter controls above the content. Best for 2-5 filters. Each filter is a dropdown, toggle, or chip set.

**Filter sidebar:** Vertical panel to the left of content. Best for 5+ filters or filters with many options. Collapsible on mobile.

**Filter chips:** Active filters shown as removable chips above the content. Each chip shows the filter name and value. Click to remove. "Clear all" link when multiple filters are active.

### Filter Behaviour

- Show result count updating as filters change: "Showing 23 of 156 items."
- Update results immediately on filter change (no "Apply" button needed for simple filters).
- For expensive filter operations (database-backed), use an "Apply" button or debounce.
- Preserve filter state in the URL so the filtered view is shareable and survives page refresh.
- Show active filter count on the filter button when filters are collapsed: "Filters (3)."

### Sorting

- Default sort should be the most useful order (newest first, most relevant, alphabetical — depends on content).
- Show current sort order clearly: "Sorted by: Date (newest first)."
- Sorting and filtering are independent. Changing a filter should not reset the sort order.

---

## 7. Date and Time Pickers

### Date Pickers

- Use a calendar widget for date selection when the user is choosing from upcoming dates (booking, scheduling).
- Use a text input with format hint for known dates (date of birth — nobody wants to click through a calendar to 1985).
- Show the expected format: "DD/MM/YYYY" or use separate day/month/year dropdowns to avoid format ambiguity.
- For date ranges, use two inputs with a visual connector, or a calendar with range selection.

### Time Pickers

- Use a dropdown with 15 or 30-minute intervals for scheduling.
- Use a text input for precise times.
- Show timezone clearly whenever times are displayed or selected.
- Default to the user's local timezone unless the context requires otherwise.

---

## 8. File Uploads

### UX Patterns

- Drag-and-drop zone with a click fallback ("Drag files here, or click to browse").
- Show accepted file types and size limit before the user tries to upload.
- Show upload progress with percentage and estimated time.
- Show a preview (thumbnail for images, filename and icon for documents) after upload.
- Allow removal of uploaded files before form submission.
- Support multiple file upload if the feature requires it.

### Error Handling

- Wrong file type: "This file type is not supported. Please upload a PDF, DOC, or TXT file."
- File too large: "This file is 52MB. Maximum size is 25MB."
- Upload failed: "Upload failed. Try again." with a retry button.
- Show errors per file, not as a batch error. If 3 of 5 files succeed, show success for those 3 and errors for the 2 that failed.
