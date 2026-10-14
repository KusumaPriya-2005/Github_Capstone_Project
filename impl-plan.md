# Implementation Plan — Task Management App

## Planning basis and approval gates

- **Requirements:** `requirements.md` records explicit user approval of the
  baseline on 2026-10-14. This plan does not expand or reinterpret that scope.
- **Architecture:** `architecture.md` retains its historical “Proposed” status.
  The later and authoritative approval record in `design-review.md` says the
  user approved the framework-free HTML/CSS/browser-native JavaScript design
  and the corrupt-data replacement flow on 2026-10-14. Do not treat the older
  status text as a new unresolved decision or edit the source artifact here.
- **Design review:** DR-01 and DR-02 are recorded resolved. DR-03's scope
  decision is resolved as fixed localhost only, with no public deployment in
  this run. `verification.md` records the exact-origin execution-context and
  browser checks as completed for the tested scope; this reconciles the
  pre-verification gate below without changing the approved origin or scope.
- **Plan/task approval gate:** All implementation and verification tasks below
  were awaiting explicit user approval. The user approved the plan and
  authorized implementation on 2026-10-14; see the exact approval record
  below. This authorizes planned work only, not commits, pushes, PRs, or public
  deployment. Verification was performed separately and its status is
  reconciled below from `verification.md`.
- **Fixed local origin and serving approach:** Use exactly
  `http://localhost:8000/`, serving the repository root as static files with
  Python's standard-library server:
  `python -m http.server 8000 --bind 127.0.0.1`
  (run from the repository root). Do not use `file://`, change host/port, or
  publish/deploy the app. Confirm that the command is available and that the
  browser reaches this exact origin before relying on the approach. If it is
  unavailable or the origin cannot be used, stop for a user decision rather
  than silently choosing a different serving tool or origin.
- **Path convention:** The paths under “Expected paths” are proposed: no
  application implementation scaffold was present in the inspected root, and
  the paths derive from the suggested organization in `architecture.md` §2.
  Confirm them against repository state when implementation is approved; do
  not overwrite unrelated files if new work appears.
- **No extra tooling:** Do not add a framework, package manager, runtime
  dependency, build system, backend, or test runner. Use browser/manual
  acceptance checks unless a later explicitly approved decision changes this.
- **Status reconciliation:** This plan's implementation-stage observations
  predate the verification recorded in `verification.md` and are retained as
  historical context where noted. Current task statuses below are based on
  that evidence. Final draft documentation review remains pending and is not
  represented as completed by this reconciliation.

## Prioritized tasks

### IMP-01 — Implement isolated task-domain operations

- **Priority:** P1 — foundational
- **Status:** Implemented; domain tests pass in
  `node --test tests/*.test.mjs` (14/14 suite tests pass; 2026-10-14)
- **Dependencies:** None beyond the plan/task approval gate
- **Expected paths (proposed):** `src/task-domain.js`
- **Requirements/design:** FR-01 through FR-06; architecture §§2, 3, 4, 8.
- **Completion criteria:**
  1. Shared title normalization trims leading/trailing whitespace and rejects
     empty or whitespace-only titles without changing task state.
  2. Creation produces one Pending task, accepts duplicate titles, and gives
     each task a stable unique ID using the approved `crypto.randomUUID()`
     approach; operations target IDs, not titles.
  3. Rename changes only the selected title; status change changes only the
     selected status; removal removes only the selected task.
  4. The All/Pending/Completed selectors preserve the distinction between no
     tasks and existing tasks with no matches. The active filter is not mutated
     by task-domain operations.
  5. Confirmed interaction-level scenarios demonstrate invalid/add/edit/cancel,
     duplicate-title independence, toggle, removal, and active-filter edge
     cases without adding a test framework or product constraints.

### IMP-02 — Implement local-storage adapter and failure-safe persistence

- **Priority:** P1 — required for same-browser persistence
- **Status:** Implemented; adapter tests pass in
  `node --test tests/*.test.mjs` (14/14 suite tests pass; 2026-10-14)
- **Dependencies:** IMP-01
- **Expected paths (proposed):** `src/local-task-storage.js`
- **Requirements/design:** FR-07; NFR-03; architecture §§2–5, 7–8; DR-02.
- **Completion criteria:**
  1. The adapter reads/writes the approved versioned full snapshot using the
     architecture's `task-manager.tasks` key and validates the whole document,
     schema version, unique IDs, trimmed nonempty titles, and valid statuses.
  2. Missing saved data loads as an empty collection; valid saved data restores
     intact. Startup does not claim a new change was saved.
  3. Malformed JSON, unsupported schema, invalid records, and storage access
     exceptions return explicit failure outcomes; invalid saved bytes are not
     automatically rewritten or partially salvaged.
  4. An explicit replacement write is refused without confirmation. With
     explicit selection and second confirmation, it replaces unreadable data
     with the current in-memory collection; cancellation leaves saved data
     untouched, and a failed replacement is not reported as successful.
  5. Add/edit/status/delete snapshots are complete; a write failure does not
     erase the current session collection or create a false save-success
     indication.

### IMP-03 — Build semantic, accessible, responsive task interface

- **Priority:** P1 — user-facing functionality
- **Status:** Implemented. Historical implementation-stage note (2026-10-14):
  `node --check` passed for all source modules, while browser verification had
  not yet been performed. Subsequent browser and keyboard evidence is recorded
  in `verification.md`; see IMP-05 and IMP-06 below.
- **Dependencies:** IMP-01 (domain behavior and selectors)
- **Expected paths (proposed):** `index.html`, `src/task-view.js`,
  `styles/app.css`
- **Requirements/design:** FR-01 through FR-06; NFR-01 and NFR-02;
  architecture §§2, 4–6, 8.
- **Completion criteria:**
  1. Interface exposes labeled add/edit forms, All/Pending/Completed filters,
     textual task status, edit/cancel, delete confirmation, and distinct
     empty-list/no-match displays.
  2. Validation messages are readable and associated with their controls;
     persistent storage warnings and status do not rely on color alone.
  3. Core actions are keyboard operable; visible focus, sensible dialog focus
     and restoration, and readable non-color completion cues are present.
  4. User-provided titles are rendered as text, not interpreted as markup.
  5. Layout allows task titles to wrap and core controls to remain usable
     without horizontal scrolling on the phone and desktop viewports selected
     for later verification; do not invent a title-length limit or breakpoint
     requirement.

### IMP-04 — Integrate controller, UI, persistence, and recovery flows

- **Priority:** P1 — completes functional app behavior
- **Status:** Implemented; controller flow tests pass in
  `node --test tests/*.test.mjs` (14/14 suite tests pass; 2026-10-14)
- **Dependencies:** IMP-01, IMP-02, IMP-03
- **Expected paths (proposed):** `src/app-controller.js`, `src/main.js`;
  integration areas in `src/task-view.js` and `index.html`
- **Requirements/design:** FR-01 through FR-07; NFR-01 and NFR-03;
  architecture §§2–5, 7–8; approved DR-02 recovery behavior.
- **Completion criteria:**
  1. Startup loads the validated collection and defaults to All; user actions
     route through domain/controller operations, and the selected filter is
     unchanged by add, edit, toggle, and delete.
  2. Invalid edits leave existing tasks unchanged; cancel edit/delete leaves
     data unchanged; confirmed deletion removes only the selected task.
  3. Changes remain usable in memory after read/write failure, with a
     persistent warning that clearly distinguishes unsaved session-only state
     from a browser-accepted save. No false save-success message is emitted.
  4. Corrupt-data mode leaves unreadable saved bytes untouched during ordinary
     operations. The replacement action and second confirmation clearly
     disclose the destructive effect and replace only with the current
     in-memory collection after explicit confirmation.
  5. The active filter, task status/title, correct empty/no-match message, and
     persistent status warning remain consistent after each operation.

### IMP-05 — Verify execution context and persistence at the approved origin

- **Priority:** P1 — blocking gate for persistence/compatibility claims
- **Status:** Complete for the tested scope (2026-10-14); all four stated
  completion criteria are supported by `verification.md`. This supersedes the
  historical pending status recorded before verification.
- **Dependencies:** IMP-04
- **Expected paths (proposed):** No new tracked path required; serve the
  repository root at `http://localhost:8000/` with the standard-library
  command specified above.
- **Requirements/design:** FR-07 AC-07.1–AC-07.5; NFR-02; architecture §§1, 3,
  7; DR-03.
- **Completion criteria:**
  1. Record the actual server command and confirm the page loads at the exact
     approved origin `http://localhost:8000/`; do not use a different origin.
  2. In that origin, actually verify browser-native module loading,
     `crypto.randomUUID()` availability and ID generation, and `localStorage`
     read/write access. Record the browser/version and results; do not infer
     success from the design or the API's nominal support.
  3. At that same origin, verify a successful save followed by reload restores
     task title and status, and exercise an unavailable/failed storage case
     without presenting session-only changes as saved.
  4. If the serving command or any required execution-context check fails,
     mark the dependent verification blocked and request a decision; do not
     change origin, serving approach, or ID strategy silently.

**Evidence/status reconciliation:** The verification report records the
approved `python -m http.server 8000 --bind 127.0.0.1` command and successful
access to `http://localhost:8000/`; module initialization, `crypto.randomUUID()`
ID generation, and local-storage read/write were checked in Chrome
154.0.8037.100 and Edge 155.0.4283.45. Save/reload restoration and simulated
storage-failure behavior were also exercised in both browsers at that origin.
No origin or serving-approach change was needed. The report says none of the
attempted IMP-05/IMP-06 checks was blocked by tool availability.

### IMP-06 — Run requirement, accessibility, and browser acceptance verification

- **Priority:** P1 — required before reporting verified completion
- **Status:** Complete for the approved, tested scope (2026-10-14), with
  documented limitations in `verification.md`. The final Verifier refresh
  checked live-region semantics and runtime announcement text for invalid
  submission, addition, and filter selection, in addition to the recorded
  core keyboard, label, focus, validation, and status checks. Screen-reader
  delivery is not an explicit acceptance criterion and remains Not run;
  this status does not claim a full accessibility audit or universal coverage.
- **Dependencies:** IMP-04 and IMP-05
- **Expected paths (proposed):** No test runner or new test file is assumed.
  Verification results are recorded in the existing `verification.md`;
  this plan records task status and criteria reconciliation without claiming
  evidence beyond that report.
- **Requirements/design:** All FR-01–FR-07, NFR-01–NFR-03; architecture §7
  operational verification.
- **Completion criteria:**
  1. Exercise the requirement edge cases: whitespace/empty/duplicate titles;
     add while Completed is selected; edit/save/cancel; toggle the last item
     matching a filter; delete confirm/cancel; final-task and no-match states;
     reload after add/edit/toggle/delete.
  2. Exercise unavailable storage, failed writes, malformed JSON, invalid
     records, unsupported schema, corrupt-data warning/preservation,
     explicit replacement/cancel, and failed replacement. Confirm in-memory
     usability and accurate persistent warnings in each applicable case.
  3. Complete keyboard-only checks for add, edit, toggle, delete confirmation,
     and filters; inspect labels, focus visibility/restoration, associated
     validation, announcements, and status cues independent of color.
  4. Verify current Chrome and Edge at phone-sized and desktop-sized viewports.
     Record actual browser names/versions and exact viewport sizes checked;
     report only coverage actually exercised.
  5. Do not claim cross-origin, cross-device, multi-tab, public deployment,
     performance, title-length, or broader browser coverage.

**Criterion-by-criterion reconciliation:**

| Criterion | Reconciled status | Evidence / remaining limitation |
| --- | --- | --- |
| 1. Functional requirement edge cases and reloads | Complete for exercised scenarios | `verification.md` records whitespace/empty/duplicate titles, active-filter add, edit/cancel, filter-match toggles, delete confirm/cancel, empty/no-match states, and reload checks after mutations in Chrome and Edge. |
| 2. Storage failures and corrupt-data recovery | Complete for exercised scenarios | Read/write exceptions, malformed/invalid/unsupported data, preservation, replacement cancel/confirm, failed replacement, and in-memory use/warnings were exercised. Storage failures were simulated; this does not establish behavior under every OS or browser privacy setting. |
| 3. Keyboard and accessibility inspection | Complete for approved tested scope | Supplemental keyboard-only traversal covered add, filters, toggle, edit/save/cancel, delete/cancel/confirm and focus restoration; labels, focus indication, validation, status text, and non-color cues were inspected. Final Verifier refresh checked live-region semantics and runtime announcement text. Screen-reader delivery, a full accessibility audit, and recovery-dialog sequential traversal remain unverified optional coverage; no such success is claimed. |
| 4. Current Chrome/Edge and phone/desktop viewports | Complete for tested scope | Chrome 154.0.8037.100 and Edge 155.0.4283.45 were tested at 390 × 844 and 1365 × 900 CSS px. These were headless/emulated viewports, not physical devices or headed visual review. |
| 5. Scope boundaries | Complete | The report makes no claims for the listed excluded coverage. |

The integrated-browser supplemental run had one failed optional Escape-key
assertion; that dialog remained open in that environment. The installed Chrome
and Edge scenario runs separately verified Escape cancellation of the delete
dialog, and keyboard Cancel/confirm paths passed. Treat the integrated-browser
assertion as a documented environment-specific limitation, not as a passed
check or as evidence of a required application failure.

## Requirement and design coverage

| Coverage | Planned tasks |
| --- | --- |
| FR-01 Add | IMP-01, IMP-03, IMP-04, IMP-06 |
| FR-02 View and empty-list state | IMP-01, IMP-03, IMP-04, IMP-06 |
| FR-03 Complete/reopen | IMP-01, IMP-03, IMP-04, IMP-06 |
| FR-04 Edit and validation | IMP-01, IMP-03, IMP-04, IMP-06 |
| FR-05 Confirmed delete | IMP-01, IMP-03, IMP-04, IMP-06 |
| FR-06 Filters and no-match state | IMP-01, IMP-03, IMP-04, IMP-06 |
| FR-07 Persistence and corrupt-data policy | IMP-02, IMP-04, IMP-05, IMP-06 |
| NFR-01 Keyboard/accessibility | IMP-03, IMP-04, IMP-06 |
| NFR-02 Responsive layout and Chrome/Edge | IMP-03, IMP-05, IMP-06 |
| NFR-03 Persistence transparency/reliability | IMP-02, IMP-04, IMP-05, IMP-06 |
| DR-01/DR-02 approved design/recovery | IMP-01–IMP-04, IMP-06 |
| DR-03 fixed localhost execution gate | IMP-05, IMP-06 |

## Plan approval record

- **Exact user approval:** “Approve the plan and begin implementation”
- **Date:** 2026-10-14
- **Authorized scope:** approved, unblocked implementation tasks IMP-01
  through IMP-04, including appropriate tests and directly relevant run/use
  documentation.
- **Explicit exclusions:** no commits, pushes, PRs, or public deployment.
- **Historical verification status at plan approval:** IMP-05 and IMP-06
  remained verification tasks. Implementation approval and passing unit tests
  were not themselves evidence that browser checks had passed. Python 3.14.7
  and the standard-library HTTP server were available; subsequent browser and
  localhost checks are recorded in `verification.md` and reconciled above.

## Risks and intentionally excluded work

- **Approval risk:** Resolved for IMP-01 through IMP-04 by the user approval
  recorded above. Verification evidence is now reconciled in the IMP-05 and
  IMP-06 status entries; final draft documentation review remains pending.
- **Origin/tool availability:** Python 3.14.7 and its standard-library HTTP
  server were available, and `verification.md` records browser behavior at the
  exact localhost origin for the tested scope. Do not extend those results
  beyond the browsers, versions, viewports, and scenarios recorded there.
- **Architecture artifact status:** `architecture.md` has not been rewritten;
  its historical status wording is superseded for approval purposes by the
  later approval record in `design-review.md`. Preserve both records.
- **Intentionally excluded:** backend, accounts/authentication,
  cross-device or multi-tab synchronization, import/export, due dates,
  reminders, public deployment, additional frameworks/dependencies/build
  systems, and unapproved performance/task-count/title-length constraints.
