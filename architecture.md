# Task Management App Architecture

**Status: Proposed — pending Design Reviewer review and explicit human approval.**

This document translates the user-approved `requirements.md` into a proposed
implementation architecture. It does not approve the design, authorize
implementation, or change the requirements.

## 1. Basis, constraints, and decisions still open

### Confirmed requirements and constraints

- `requirements.md` records user approval on **2026-10-14**. The user also
  explicitly confirmed the requirements baseline and asked to continue with the
  Architect stage on that date.
- Deliver a single-user browser task manager. Persist in the same browser
  storage context; there is no backend, account, authentication, or
  cross-device synchronization.
- Support task add, list, complete/reopen, edit, confirmed delete, and All /
  Pending / Completed filters; preserve the specified validation, messages,
  and filter behavior.
- Keep the current session usable in memory when persistence fails, while
  explicitly distinguishing unsaved state. Never silently replace unreadable
  saved data.
- Core operations must be keyboard usable and the interface usable on phone and
  desktop layouts. Verification must record the actual Chrome and Edge versions
  and viewport sizes tested.
- No framework, existing application scaffold, performance target, task-count
  limit, or title-length limit is approved or established by the requirements.
  No implementation files or existing technology stack were present in the
  inspected repository root.

### Proposed choices (not yet approved)

- A static, client-rendered web application using semantic HTML, CSS, and
  browser-native JavaScript modules, with no framework or runtime dependency.
  This is the smallest complete option for the defined local-only interactions
  and avoids introducing a build system or backend without a requirement.
- Browser `localStorage` is the persistence adapter because the requirements
  explicitly call for browser-local storage. Persist one versioned JSON
  snapshot, rather than introducing a database or synchronization mechanism.
- An app-managed deletion confirmation dialog, rather than an unconfirmed
  delete action. Use native `<dialog>` and explicit Confirm/Cancel buttons,
  with keyboard focus handling.
- Treat any storage access exception or invalid saved document as a
  session-degraded condition: preserve the stored bytes, disable automatic
  writes for that page session, and allow task operations on the in-memory
  list. Offer a separate, explicit destructive recovery action for unreadable
  data.

### Unresolved decisions for design review / human approval

1. Approve or replace the proposed plain HTML/CSS/JavaScript approach, since
   no stack has been selected by the user.
2. Approve the interaction and wording for explicit corrupt-data recovery.
   This proposal uses a deliberate “Replace unreadable saved data” action and
   a second confirmation before replacing it with an empty task collection.
3. Confirm the eventual hosting/origin convention. Data is scoped to browser
   storage for that origin; changing origin changes the visible saved list.
4. No task-title length limit or performance target is specified. None is
   introduced here; practical browser limits remain an operational constraint.

## 2. System boundary and component responsibilities

The application is one static browser application. It has no server-side
component and makes no external service calls.

| Component | Responsibility | Boundary / non-responsibility |
| --- | --- | --- |
| **Task UI** | Render the title form, status filters, task rows, inline edit form, accessible status controls, empty/no-match states, storage notices, and delete/recovery dialogs. Route user actions to the application controller. | Does not directly read or write storage or own task business rules. User-provided text is rendered as text, never interpreted as markup. |
| **Application controller** | Own the in-memory task collection, active filter, transient edit/dialog state, persistence mode, and status messages. Coordinate domain operations, persistence, and rendering. | Filter selection and transient UI state are not persisted. Does not claim remote or cross-tab state. |
| **Task domain operations** | Validate and normalize titles; create tasks; edit, toggle, or delete exactly one task by stable ID; derive visible tasks and empty/no-match conditions. Preserve unrelated tasks and status. | Pure in-memory operations; no DOM or storage dependencies. |
| **Local-storage adapter** | Read and validate the versioned document; serialize and write complete task snapshots; surface read/write failures without suppressing them. | Never performs silent corruption repair, partial salvage, or automatic replacement of malformed data. |
| **Accessible interaction layer** | Manage native form submission, focus movement/restoration for dialogs and editing, keyboard operation, and polite/urgent announcements of validation and persistence state. | Uses native controls and browser accessibility semantics; does not rely on color as the only status signal. |

### Suggested source organization

These are proposed implementation boundaries, not files being created in this
Architect stage:

```text
index.html
src/
  main.js                 # startup and composition
  app-controller.js       # application state and action orchestration
  task-domain.js          # validation, task operations, selectors
  local-task-storage.js   # localStorage adapter and document validation
  task-view.js            # DOM rendering and event bindings
styles/
  app.css                 # responsive layout, visible focus and status styles
```

No package manager, framework, bundler, test tool, or hosting setup is assumed.
If a later implementation selects a build tool or additional dependency, it
needs its own rationale and must not broaden scope.

## 3. Data model and persistence contract

### In-memory task

```text
Task = {
  id: string,                 // stable unique identifier; not the title
  title: string,              // trimmed, nonempty user-visible text
  status: "pending" | "completed"
}
```

Duplicate titles are valid because operations target `id`, not `title`.
Generate a unique identifier per created task using
`crypto.randomUUID()` in the supported current Chrome/Edge environment; ensure
the generated ID is not already present in the current collection. Do not add a
title length limit not found in the requirements.

### Stored document

Use one origin-scoped key, proposed as `task-manager.tasks`, with a JSON value:

```json
{
  "schemaVersion": 1,
  "tasks": [
    { "id": "stable-id", "title": "Example", "status": "pending" }
  ]
}
```

The adapter validates the whole document before exposing it to the controller:
supported schema version; array shape; unique nonempty IDs; string titles that
are nonempty and already trimmed; and status exactly `pending` or `completed`.
An absent key represents a new empty list. Do not persist the active filter or
transient editing/confirmation state.

### Persistence behavior and failure handling

1. Startup reads the key inside an exception boundary. On an absent key, use an
   empty in-memory list. On valid data, load the full list. Neither case should
   claim a new change has just been saved.
2. On malformed JSON, unsupported schema, or invalid records, reject the
   document as a whole. Do not discard individual records, replace the key, or
   automatically write an empty list. Show a persistent warning explaining
   saved data is unreadable and has not been overwritten.
3. Any `localStorage` access exception, including unavailable storage or
   quota/security errors, changes the current page session to **persistence
   unavailable**. Display a persistent warning; do not report save success or
   automatically retry writes for the rest of that page session. Keep the
   current list and all normal task operations available in memory.
4. For ordinary mutation, first compute the candidate in-memory task list,
   then attempt to write the complete candidate document. If `setItem` returns
   normally, commit that candidate as the current list and indicate that the
   latest snapshot was accepted by browser storage. If it throws, still commit
   the candidate in memory, switch to session-degraded mode, and indicate
   prominently that the latest changes are session-only and will not be saved.
   Rendering and task use continue regardless of the write result. Do not
   describe browser acceptance as a backup or cross-device guarantee.
5. In corrupt-data mode, ordinary mutations affect only the in-memory list and
   never write the corrupt key. Provide a distinct recovery command. Only after
   the user explicitly selects replacement and confirms a destructive
   confirmation may the adapter replace the old value with the current
   in-memory list (initially empty if the user has not made session changes).
   If that write fails, keep the session list, retain the warning, and report
   that saved data remains unreplaced. Cancelling preserves the stored value.
6. Keep storage warning/status visible and persistent while degraded. A reload
   starts a new read attempt; clearing browser data may permanently remove the
   saved list as the requirements state.

This is best-effort browser-local persistence, not a transactional backup
system. `localStorage` is synchronous and browser-controlled; the app can report
whether its access/write call succeeded, not guarantee physical durability.

## 4. Interfaces and behavioral contracts

The following language-neutral signatures describe module contracts; they are
not implementation code.

### Task domain

```text
normalizeTitle(raw: string) -> Result<TrimmedNonEmptyTitle, ValidationError>
createTask(tasks, title, newId) -> tasks
renameTask(tasks, id, title) -> Result<tasks, NotFound | ValidationError>
setTaskStatus(tasks, id, status) -> Result<tasks, NotFound>
removeTask(tasks, id) -> Result<tasks, NotFound>
selectVisibleTasks(tasks, filter) -> Task[]
selectListMessage(tasks, filter) -> none | empty-list | no-filter-matches
```

Contracts:

- `normalizeTitle` trims leading/trailing whitespace and rejects an empty
  result. Both add and edit use the same validation. On rejection, leave the
  collection unchanged and provide a readable, associated message.
- Creation adds one new `pending` task; title duplicates are not rejected.
- Rename changes only the selected task's title; status and other tasks remain
  unchanged. Cancel is a UI-only operation and does not call rename.
- Status change targets one ID only and changes only its status.
- Removal targets one ID only and can be invoked by the controller only after
  confirmation.
- Filter selection returns All, Pending, or Completed without changing task
  state. The active filter is preserved through every task operation.
- The empty-list message is used only when there are no tasks. The no-match
  message is used when tasks exist but none satisfy the selected filter.

### Persistence adapter

```text
loadTasks() -> Result<NoSavedDocument | ValidTaskSnapshot,
                       StorageUnavailable | UnreadableDocument>
saveTasks(snapshot) -> Result<StorageAccepted, StorageUnavailable>
replaceUnreadableDocument(snapshot, explicitUserConfirmation) ->
    Result<StorageAccepted, StorageUnavailable | ConfirmationRequired>
```

The adapter returns typed outcomes to the controller; it does not display
messages or silently recover. `replaceUnreadableDocument` must refuse to write
without the explicit confirmation signal from the UI/controller.

### Application actions and view outputs

Controller actions are `add(rawTitle)`, `beginEdit(id)`, `saveEdit(id, rawTitle)`,
`cancelEdit(id)`, `requestDelete(id)`, `confirmDelete(id)`,
`cancelDelete(id)`, `toggleStatus(id)`, `selectFilter(filter)`, and
`confirmReplaceUnreadableData()`.

The view receives a render model containing the visible task rows, active
filter, add/edit validation state, empty/no-match state, pending dialog state,
and persistence mode/message. It does not infer persistence status from task
contents. A save success indication is emitted only for a successful adapter
write of the latest full snapshot.

## 5. Data and event flows

### Startup and restoration

`main` → controller startup → storage adapter reads and validates one document
→ controller sets tasks and persistence mode → selectors apply the default
**All** filter → view renders tasks or the appropriate empty state. A read
exception or invalid document instead selects the degraded/corrupt warning
path; no write occurs during startup.

### Add / edit

User submits a labeled form → view sends raw title → domain trims and validates
→ on failure, keep the collection unchanged and announce the associated error;
on success, generate/use the target ID and produce a candidate list → controller
persists the full candidate unless degraded → controller retains the candidate
even on write failure → rerender using the unchanged active filter. Add creates
Pending state; an edit changes only title. A cancelled edit never reaches the
domain mutation or persistence path.

### Complete / reopen

User activates the labeled status control → controller/domain changes only that
task's status → persist or retain as session-only under failure rules → rerun
the active filter and render. If the task no longer matches Pending/Completed,
show the no-match state when other tasks exist, or the empty-list state only
when there are no tasks.

### Delete

User activates Delete → app opens a confirmation dialog naming the task → focus
moves into the dialog. Cancel or Escape closes without a mutation. Confirm
removes only that task ID, persists/retains according to storage mode, closes
the dialog, restores focus to a sensible surviving task/control, and rerenders
the active filter and correct empty/no-match message.

### Filter

User activates All, Pending, or Completed → controller changes only transient
filter state → selectors derive visible rows and empty/no-match message → view
updates selected/pressed state and accessible name/state. Task data and saved
document do not change.

### Storage degradation and corrupt-data recovery

Storage read/write failure → adapter returns a failure outcome → controller
preserves current in-memory tasks, enters the appropriate warning mode, and
continues routing normal actions without storage writes. Invalid stored content
is left untouched. For invalid data only, explicit replace action → clear
warning/confirmation explains the destructive consequence → cancel leaves data
untouched; confirm authorizes one replacement write → show success only if
storage accepts the replacement, otherwise retain session data and show a
persistent failure warning.

## 6. User experience, accessibility, and responsive design

- Use native labeled form controls and buttons; all actions are reachable by
  Tab/Shift+Tab and activatable by keyboard. Do not bind core actions only to
  pointer events.
- Associate validation text with the relevant input (`aria-describedby`) and
  use an appropriate live region for validation and changing storage status.
  Avoid repeatedly announcing the entire task list.
- Provide visible `:focus-visible` indicators with sufficient contrast.
  Preserve logical focus order; return focus after dialog close and editing
  cancellation/save.
- Communicate task state with text such as “Pending” / “Completed” and an
  accessible status control label, not color alone. Use icons only when
  accompanied by text or an accessible name.
- Use `<dialog>` with explicit Cancel and destructive Confirm controls for
  deletion and corrupt-data replacement. Verify keyboard dismissal and focus
  restoration in supported browsers; if native dialog behavior falls short,
  provide equivalent managed focus behavior without changing the confirmation
  requirement.
- Use a narrow-screen-first, fluid single-column task list and forms. Allow
  task title text to wrap; keep controls reachable without horizontal scrolling
  at phone-sized and desktop-sized viewports. No exact breakpoints are a
  requirements constraint; select and verify them during implementation.
- Empty-list and no-match messages are distinct, descriptive, and retained as
  visible text; storage warnings are persistent and not color-only.

## 7. Security, reliability, scalability, and operations

### Security and privacy

- All task data remains in the browser origin's local storage; no network/API
  calls, accounts, credentials, or third-party services are in scope.
- Render titles with DOM text APIs (`textContent` or equivalent), never by
  concatenating untrusted task text into HTML. Validate all loaded records
  before using them.
- Treat local storage as user-controlled and origin-scoped, not a secure
  vault. The app has no secrets to store. Avoid logging task titles or saved
  content.
- Do not include externally loaded scripts, analytics, or dependencies in this
  proposal. Hosting security headers/CSP depend on the later hosting decision.

### Reliability

- Domain operations target stable IDs and produce a new candidate collection,
  preserving unaffected tasks. Full-snapshot writes avoid partial field-level
  persistence logic.
- All storage access, JSON parsing, schema checks, and writes are handled as
  explicit outcomes. A failed write never rolls back the usable in-memory
  operation or appears as a successful save.
- Corrupt and future-version documents fail closed, remain unmodified, and need
  an explicit user choice for replacement. No automatic migration or partial
  salvage is specified.
- A browser crash, device loss, cleared browser storage, origin change, or
  browser storage eviction can make data unavailable. There is no backup or
  recovery service in scope.

### Scalability and maintainability

- A single serialized collection in `localStorage` is appropriate to the
  stated single-user, no-backend scope; it has synchronous browser storage and
  quota limitations and is not designed for large task collections or
  concurrent tabs.
- Keep domain operations independent from the DOM and persistence adapter so
  validation and task behavior can be checked independently and storage/UI
  details can change without changing task rules.
- The schema version provides a boundary for future explicit migration work;
  version changes or migrations are not part of this requirements baseline.
- No task-count, title-length, response-time, or performance guarantees are
  invented. Do not impose a consequential cap without user confirmation.

### Operational verification (future stage; not performed here)

- Exercise add, edit, toggle, delete confirmation/cancel, filters, reload
  restoration, whitespace/duplicate titles, active-filter edge cases, empty and
  no-match states, inaccessible storage, failed writes, malformed JSON, invalid
  records, unsupported schema, and explicit corrupt-data recovery.
- Verify core operations with keyboard only and inspect focus, labels,
  validation, status announcements, and non-color completion cues.
- Verify current Chrome and Edge. Record actual browser versions and exact
  viewport sizes checked. This architecture has run no tests and asserts no
  browser compatibility results.

## 8. Requirements-to-design traceability

### Functional requirements

| Requirement / acceptance criteria | Design response |
| --- | --- |
| **FR-01 / AC-01.1–AC-01.5 — Add** | Task UI sends form submission to the controller; shared domain normalization rejects blank input, trims accepted input, creates exactly one Pending task, allows duplicate titles, and uses stable IDs. Filter is transient and remains unchanged. A Pending task added under Completed remains stored and yields the appropriate no-match display. See §§2, 4, 5. |
| **FR-02 / AC-02.1–AC-02.3 — View** | Selector derives all rows for All, exposing title and textual status. Distinct empty/no-match state logic and text status cues are part of the view model. See §§4, 6. |
| **FR-03 / AC-03.1–AC-03.4 — Complete/reopen** | Status control sends one task ID to domain operation; only that status changes. Active filter is retained and selector/view update immediately, including no-match transition. See §§4, 5. |
| **FR-04 / AC-04.1–AC-04.4 — Edit** | Inline editor uses the same trim/nonempty validator; invalid input preserves prior task, valid input modifies title only, and cancel sends no mutation. Stable IDs preserve status and unrelated records. See §§2, 4, 5. |
| **FR-05 / AC-05.1–AC-05.4 — Delete** | Delete request opens an explicit confirmation dialog. Cancel performs no mutation; Confirm removes only the selected ID. The unchanged active filter is reapplied and produces correct empty/no-match messaging. See §§4–6. |
| **FR-06 / AC-06.1–AC-06.3 — Filter** | Three filter values feed a pure selector. Filter is UI state, not persisted or changed by add/edit/status/delete. Empty task collection and nonempty collection with zero matches use distinct messages. See §§2, 4, 5. |
| **FR-07 / AC-07.1–AC-07.5 — Persistence** | Versioned full snapshot in origin-scoped `localStorage`; successful reads restore tasks; successful writes include add/edit/status/delete. Read/write exceptions produce persistent warnings and session-only operation without false save claims. Invalid documents are preserved and blocked from automatic writes; explicit confirmed replacement is separate. See §§3, 5, 7. |

### Non-functional requirements

| Requirement | Design response |
| --- | --- |
| **NFR-01 — Accessibility** | Native labeled controls, keyboard event paths, visible focus, associated readable validation, live status messaging, text-based completion states, and keyboard-accessible dialogs with focus handling. Verify manually in the later verification stage. See §6. |
| **NFR-02 — Responsive layout and compatibility** | Propose fluid narrow-screen-first layout, wrapping titles and usable controls on phone and desktop. Chrome/Edge verification must record actual versions and viewport sizes; none are claimed by this document. See §§6, 7. |
| **NFR-03 — Persistence reliability and error transparency** | Validation feedback is explicit; storage outcomes are explicit; in-memory operations are not mislabeled saved; stable-ID updates preserve other tasks; corrupt data is not overwritten automatically. See §§3, 4, 7. |

## 9. Risks and assumptions for Design Reviewer

| Risk / assumption | Impact and proposed handling |
| --- | --- |
| Browser storage may be unavailable, quota-limited, cleared, evicted, or lost with the origin/browser/device. | Affected state may be session-only or lost. Warn clearly; do not imply backup or synchronization. This limitation follows the approved scope. |
| Corrupt saved data needs a recovery decision. | Replacing it can discard recoverable bytes. Preserve it by default; require an explicit replace action and separate confirmation. Review the exact recovery UX and whether session-only editing before replacement is acceptable. |
| A single full JSON snapshot is synchronous and has browser quota/size limits. | Appropriate for the stated simple single-user scope but not large-scale collections. There is no specified limit; do not invent one. |
| `localStorage` success indicates the browser API accepted a write, not a guarantee against later browser/device loss. | Use precise “saved in this browser” language, and retain clearing/storage caveats. |
| Origin changes create a separate storage namespace. | Deployment must preserve the intended origin if the user expects the same list; actual hosting/origin remains undecided. |
| Proposed framework-free stack has no evidence of an established project convention. | No scaffold/dependency was present in the inspected root. Confirm this proposal before implementation; adjust if project setup is introduced. |
| Native dialog and random UUID availability are assumed for current Chrome/Edge. | Validate actual browser behavior in implementation/verification; add an accessible fallback only if needed, without weakening confirmation or inventing support promises. |
| Behavior after invalid persisted content is not fully dictated beyond warning and explicit replacement. | This proposal uses a session-only in-memory list while preserving corrupt bytes, then offers confirmed replacement. Human review should approve this behavior and warning copy. |

## 10. Design-review handoff

- Requirements approval: recorded in root `requirements.md` and reaffirmed by
  the user for this Architect stage on **2026-10-14**.
- Proposed design: framework-free static browser app, domain/controller/view
  separation, versioned `localStorage` snapshot, explicit degraded/corrupt
  modes, and keyboard-accessible UI.
- Design review and explicit human architecture approval: **pending**.
- Implementation, tests, browser verification, and release: **not performed
  or claimed**.
- Next gate: Design Reviewer compares this proposal against every approved
  requirement, records findings and status in `design-review.md`, and obtains
  explicit human design approval before planning or implementation.
