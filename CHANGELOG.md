# Changelog

## Unreleased

### Added

- Added a framework-free, single-user browser task manager with task creation,
  viewing, editing, completion/reopening, confirmed deletion, and All, Pending,
  and Completed filters.
- Added trimmed-title validation, distinct empty-list and no-match states,
  keyboard-operable controls, textual task statuses, and responsive styling.
- Added versioned browser-local storage with reload restoration, explicit
  unsaved-session warnings on storage failure, and user-confirmed recovery for
  unreadable saved data.
- Added Node.js tests for task-domain, storage-adapter, and controller
  behavior, along with local run and usage instructions in `README.md`.

### Scope and limitations

- The app is intended to run at `http://localhost:8000/`; no public deployment,
  backend, account, cross-device synchronization, or multi-tab synchronization
  is included.
- Browser-local task data can be lost if browser data is cleared, evicted, or
  unavailable; storage success is not a backup guarantee.
- The approved requirements acceptance gate is supported for the tested scope.
  `impl-plan.md` reconciles IMP-05 and IMP-06 as complete for that scope; this
  is not a claim of universal accessibility or browser coverage.
- The optional integrated-browser Escape-key assertion failed: the dialog
  remained open in that session. Installed Chrome and Edge runs separately
  reported Escape cancellation, and keyboard Cancel/confirm paths passed.
- Screen-reader/assistive-technology delivery, a full accessibility/contrast
  audit, headed visual review, physical-device testing, and sequential keyboard
  traversal in the recovery dialog were not run.
- Final documentation review identified stale verification-status wording;
  it was corrected and checked. Local release checks passed for the recorded
  scope. Commit, feature push, and PR creation were explicitly authorized on
  2026-10-14; merging and public deployment remain unauthorized.

### Verification evidence

- The final Verifier refresh recorded `node --test tests/*.test.mjs` passing:
  14 tests, 14 passed, 0 failed, 0 skipped, exit code 0 (Node.js
  `v24.21.0`). It also checked live-region semantics and runtime announcement
  text in the browser DOM; this does not establish screen-reader delivery.
- Earlier browser evidence in `verification.md` records headless Chrome
  `154.0.8037.100` and Edge `155.0.4283.45` at emulated CSS viewports
  390 × 844 and 1365 × 900. See that report for the scenarios and boundaries.
