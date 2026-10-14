# Task Management Requirements

## Status and provenance

- Status: **Approved by the user** on 2026-10-14.
- Approval: the user selected "Approve this baseline and create requirements.md"
  after reviewing the scope, behavior, quality baseline, and exclusions below.
- Source: `.github/Inputs/Input_user_stories.docx`, stories US-01 through US-07.
- Run ID: `20261014-163401-df5ba3a0`.
- Feature branch: `sdlc/task-management-20261014-163401-df5ba3a0`.
- Target repository: `KusumaPriya-2005/Github_Capstone_Project`; PR base: `main`.
- This approval applies to requirements only. Architecture, implementation,
  verification, and release have not been completed or approved by this document.

## Scope

Deliver a single-user, browser-based task-management web app. Users can add, view,
complete/reopen, edit, delete, and filter tasks. Persist tasks in browser-local
storage without a backend.

### In scope

- All seven source user stories and their acceptance criteria.
- Task titles and Pending/Completed status.
- All, Pending, and Completed filters.
- Deletion confirmation, title validation, and empty-list messages.
- Same-browser persistence and explicit storage-failure warnings.
- Keyboard accessibility and usable phone/desktop layouts.

### Out of scope

- Accounts, authentication, password reset, and multi-user authorization.
- Backend services and cross-device synchronization.
- Multi-tab synchronization.
- Import/export, due dates, and reminders.

The earlier password-reset story is not part of this workflow run.

## Functional requirements and acceptance criteria

### FR-01: Add a task (US-01)

Users can enter a title and add a new task.

- AC-01.1: Adding a valid title creates one task with Pending status.
- AC-01.2: Leading and trailing whitespace is removed before storing the title.
- AC-01.3: Empty or whitespace-only titles are rejected with a readable
  validation message; no task is created.
- AC-01.4: The task is present in the list and visible when the active filter
  includes Pending tasks. Adding a task does not change the selected filter.
- AC-01.5: Duplicate titles are allowed; tasks remain independently editable,
  toggleable, and deletable.

### FR-02: View tasks (US-02)

Users can view all existing tasks.

- AC-02.1: The All filter shows every task's title and completion status.
- AC-02.2: When there are no tasks, the app shows a clear empty-list message.
- AC-02.3: Pending and Completed states are visibly distinguishable without
  relying on color alone.

### FR-03: Complete and reopen tasks (US-03)

Users can change a task between Pending and Completed.

- AC-03.1: Marking a Pending task Completed visibly updates its status.
- AC-03.2: Marking a Completed task Pending visibly updates its status.
- AC-03.3: A status change affects only the selected task.
- AC-03.4: The selected filter remains active and its displayed results update
  immediately to reflect the changed status.

### FR-04: Edit a task (US-04)

Users can update an existing task's title.

- AC-04.1: Saving a valid edit updates the selected task's displayed title.
- AC-04.2: Edited titles follow the same trimming and nonempty validation as
  newly added titles. A rejected edit leaves the existing title unchanged.
- AC-04.3: Cancelling an edit leaves the task unchanged.
- AC-04.4: Editing does not change the task's completion status or other tasks.

### FR-05: Delete a task (US-05)

Users can delete a selected task after confirming the action.

- AC-05.1: Requesting deletion requires confirmation before removing the task.
- AC-05.2: Confirming deletion removes only the selected task from the list.
- AC-05.3: Cancelling deletion leaves all tasks unchanged.
- AC-05.4: Empty-list or no-match messaging updates when deletion removes the
  last task or last task matching the active filter.

### FR-06: Filter tasks (US-06)

Provide All, Pending, and Completed filters.

- AC-06.1: All displays every task; Pending and Completed display only tasks
  with the corresponding status.
- AC-06.2: The active filter remains selected during add, edit, status-change,
  and delete operations.
- AC-06.3: When tasks exist but none match the selected filter, show an
  appropriate no-match message distinct from the empty-list message.

### FR-07: Persist tasks between sessions (US-07)

Use browser-local storage to save and restore task titles and statuses.

- AC-07.1: When storage is available, successfully saved tasks are restored
  after reload or reopening the app in the same browser storage context.
- AC-07.2: Additions, title edits, status changes, and confirmed deletions are
  reflected in saved data and survive reload after successful saving.
- AC-07.3: If loading or saving is unavailable or fails, show a clear,
  persistent warning that changes are not saved. Do not report save success.
- AC-07.4: When storage fails, the current task list remains usable in memory
  for the session, including normal task operations.
- AC-07.5: Unreadable saved data produces a clear warning and is not silently
  overwritten. Recovery requiring replacement of existing saved data needs an
  explicit user decision; it must not be treated as an automatic successful save.

## Non-functional requirements

### NFR-01: Accessibility

- Core add, edit, toggle, delete-confirmation, and filter operations are usable
  with the keyboard, without requiring a pointing device.
- Controls have visible labels and visible focus indicators.
- Validation and storage-error messages are readable.
- Completion state is communicated with more than color alone.

### NFR-02: Responsive layout and compatibility

- Core task operations remain usable on phone-sized and desktop-sized layouts.
- Verify the app in current Chrome and Edge. Record the actual versions and
  viewport sizes checked during verification; do not claim untested coverage.
- Exact layout, framework, and implementation choices belong to architecture.

### NFR-03: Persistence reliability and error transparency

- Do not silently drop invalid input, conceal storage errors, or present
  in-memory changes as successfully persisted changes.
- Preserve unaffected tasks during edits, status changes, and deletions.
- Clearly distinguish verified persistence from unsaved session-only state.

## Edge cases

- Empty or whitespace-only titles on add and edit.
- Titles with leading/trailing whitespace and duplicate titles.
- Cancelling an edit or deletion confirmation.
- Toggling the last task matching the active filter to another status.
- Adding a Pending task while the Completed filter is active.
- Deleting the final task or final matching task.
- Reloading after successful additions, edits, toggles, and deletions.
- Unavailable browser storage, failed saves, and unreadable saved data.
- Clearing browser data: saved tasks may be removed; recovery is not promised.

## Assumptions and dependencies

- One user operates within one browser storage context.
- Persistence depends on the browser retaining local storage for the app's
  origin; another browser, device, or origin does not share the saved task list.
- Clearing browser data can remove tasks; no backup or recovery service exists.
- Persistence testing requires a browser environment in which local storage can
  be enabled and storage-error cases can be exercised.
- The architecture stage will select technologies, interfaces, and the storage
  representation. No framework or backend has been implicitly approved.
- No numeric performance target, task-count limit, or title-length limit was
  specified. Do not invent a requirement or impose a consequential limit without
  user confirmation.

## Handoff and remaining gates

- Requirements clarification and user confirmation: **Completed**.
- Requirements artifact: **Created from the approved baseline**.
- Architecture and design review: **Pending**.
- Architecture approval: **Not received**.
- Implementation plan, implementation, code review, verification, and release:
  **Not started**.
- No implementation or test results are claimed here.
- Next applicable stage is Architect, using this approved artifact. Any material
  scope or behavior change requires user confirmation before proceeding.
