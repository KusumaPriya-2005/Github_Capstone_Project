# Design Review — Task Management App

**Review status: Human-approved architecture and local execution scope**

## Review basis and approval state

- Requirements: root `requirements.md`, recorded as user-approved on
  **2026-10-14**. The user explicitly asked to continue the workflow on that
  date. This approval is for the requirements baseline only.
- Architecture: root `architecture.md`, reviewed as a proposed design. Its own
  status says pending review and explicit human approval.
- Review scope: requirements coverage; security, reliability, scalability,
  maintainability, accessibility, compatibility, and operational design risks.
- No implementation or tests were performed as part of this review.
- **Architecture approval received on 2026-10-14.** After this review, the user
  selected "Approve the proposed architecture and confirmed corrupt-data
  replacement flow." This is approval of the design, not test evidence.

## Overall assessment

The architecture provides traceable responses for all seven functional
requirements and the three non-functional requirements. Its component
separation, stable-ID task operations, full-snapshot persistence, explicit
storage-failure handling, corrupt-data preservation, and text rendering
guidance are directionally consistent with the approved requirements. It also
appropriately leaves browser compatibility and accessibility verification to a
later stage rather than claiming unperformed tests.

No Critical or High-severity design defect was identified from the artifacts
reviewed. The architecture nevertheless contains proposed product/technology
choices that need explicit human approval, and an unresolved hosting-origin
assumption that should be settled before implementation verification. The
design and local execution scope were subsequently approved by the user as
recorded below. Actual browser behavior remains unverified.

## Findings

### DR-01 — Framework-free browser stack is a proposed, unapproved choice

- **Severity:** Medium
- **Blocking:** Yes — blocks explicit design approval until the user approves
  this choice or requests a revision.
- **Evidence/reference:** `architecture.md` §1, “Proposed choices,” proposes a
  static client-rendered app using HTML/CSS/browser-native JavaScript modules
  without a framework or runtime dependency. §1, unresolved decision 1, says
  this has not been selected by the user. `requirements.md` NFR-02 explicitly
  leaves framework and implementation choices to architecture; it does not
  approve this particular choice.
- **Impact:** The proposal is plausible for the stated local-only scope, but
  selecting it commits the project to a technology and delivery approach not
  specified in the approved baseline. Treating it as already approved would
  bypass the architecture decision gate.
- **Recommendation:** Ask the user to explicitly approve the framework-free
  static HTML/CSS/JavaScript proposal or request a revision. Keep the decision
  proposed until that response is received.
- **Resolution/status:** Resolved by explicit user approval on 2026-10-14 of
  the framework-free HTML/CSS/JavaScript architecture.

### DR-02 — Destructive corrupt-data recovery behavior needs explicit approval

- **Severity:** Medium
- **Blocking:** Yes — blocks explicit design approval until the user approves
  the recovery behavior or requests a revision.
- **Evidence/reference:** `architecture.md` §1, “Proposed choices,” proposes a
  “Replace unreadable saved data” action followed by a second confirmation.
  §3 item 5 and §5 define ordinary in-memory changes while corrupt data remains
  untouched, followed by a user-authorized replacement write. §9 identifies
  the recovery UX and session-only editing before replacement as matters for
  review. `requirements.md` FR-07 AC-07.5 requires an explicit user decision
  before replacement, but does not prescribe this exact two-step interaction
  or what happens to session-only changes before replacement.
- **Impact:** Confirmed replacement can discard the only stored copy of
  unreadable data. The proposed safeguards align with the requirement's
  non-overwrite rule, but the exact interaction and replacement of the current
  in-memory collection are consequential behavior choices.
- **Recommendation:** Obtain explicit human approval of the proposed recovery
  interaction and its consequence (replacement of the unreadable stored value
  with the current in-memory task collection), or ask for a revision. The
  warning and confirmation must clearly communicate the destructive effect.
- **Resolution/status:** Resolved by explicit user approval on 2026-10-14 of
  replacement with the current in-memory collection only after explicit action
  and confirmation. The destructive-effect warning remains required.

### DR-03 — Hosting origin and secure execution context remain unspecified

- **Severity:** Medium
- **Blocking:** No for deciding the high-level architecture; yes before
  implementation verification can claim reliable task creation and
  same-context persistence.
- **Evidence/reference:** `architecture.md` §1, unresolved decision 3, leaves
  the hosting/origin convention open and notes that an origin change changes
  the visible saved list. §2 proposes browser-native JavaScript modules and
  §3 specifies origin-scoped `localStorage`; §3 also proposes
  `crypto.randomUUID()` for task IDs without specifying a supported execution
  context or fallback. `requirements.md` FR-07 AC-07.1 requires restoration in
  the same browser storage context, and NFR-02 requires Chrome/Edge verification.
- **Impact:** A deployment/origin change can make a previously saved list
  appear absent. The choice of serving context also affects module loading,
  origin-scoped storage, and availability of the proposed secure-context
  browser API. Without a defined supported origin, persistence and task-ID
  behavior cannot be verified against the intended deployment.
- **Recommendation:** Before implementation verification, select and document
  the intended serving/origin convention, confirm the app runs in a context
  that supports its proposed modules and ID API, and test persistence at that
  stable origin. Do not imply continuity across origins.
- **Resolution/status:** Execution scope confirmed by the user on 2026-10-14:
  "Use a fixed localhost address; no public deployment in this run
  (Recommended)." Planning must document the exact stable localhost origin,
  and verification must confirm module loading, ID generation, and persistence
  there. Decision resolved; actual execution-context checks remain unverified.

## Requirement coverage

| Requirement | Review result | Evidence |
| --- | --- | --- |
| FR-01 Add | Covered in the design: trimming/nonempty validation, duplicate titles, Pending creation, stable IDs, and unchanged active filter. | `architecture.md` §§2–5, §8 |
| FR-02 View | Covered: All selector, distinct empty/no-match messages, and textual task status. | `architecture.md` §§4, 6, 8 |
| FR-03 Complete/reopen | Covered: status mutation targets one ID and preserves the selected filter. | `architecture.md` §§4–5, 8 |
| FR-04 Edit | Covered: shared validation, cancellation without mutation, title-only update. | `architecture.md` §§4–5, 8 |
| FR-05 Delete | Covered: explicit confirmation, cancel path, single-ID removal, and updated empty/no-match state. | `architecture.md` §§4–6, 8 |
| FR-06 Filter | Covered: All/Pending/Completed selectors, filter retained during operations, distinct no-match messaging. | `architecture.md` §§2, 4–5, 8 |
| FR-07 Persistence | Covered at design level: versioned origin-scoped snapshot, restoration, explicit write outcomes, session-only use on failures, preservation of unreadable data, and explicit replacement. Recovery details remain subject to DR-02. | `architecture.md` §§3–5, 7–8 |
| NFR-01 Accessibility | Design controls are specified, including keyboard paths, labels, focus, live messaging, and non-color status. Actual accessibility remains unverified. | `architecture.md` §6 and §7 “Operational verification” |
| NFR-02 Responsive/compatibility | Responsive intent and required browser/version/viewport recording are specified. No actual browser/version or viewport verification is claimed. Hosting context remains open under DR-03. | `architecture.md` §§1, 6–7 |
| NFR-03 Reliability/error transparency | Explicit storage outcomes, in-memory continuity, and no false save claims are specified. Corrupt-data replacement remains subject to DR-02. | `architecture.md` §§3–5, 7 |

## Accepted risks and scope limitations

These are documented limitations consistent with the approved requirements,
not findings that the architecture should unilaterally eliminate:

- Browser-local storage can be cleared, evicted, unavailable, quota-limited, or
  lost with browser/device data; no backup or cross-device recovery is in scope.
- `localStorage` is origin-scoped, synchronous, and not intended for large
  collections or cross-tab synchronization; multi-tab synchronization is out
  of scope.
- A successful browser storage API call is not a guarantee of physical
  durability. The architecture appropriately avoids describing it as backup.
- No task-count, title-length, or performance target is established; adding a
  consequential cap would require user confirmation.

## Approved decisions

- **Requirements baseline only:** approved by the user on 2026-10-14, as
  recorded in `requirements.md`.
- **Architecture decisions:** the user explicitly approved the proposed
  framework-free static browser app and confirmed corrupt-data replacement
  flow on 2026-10-14, resolving DR-01 and DR-02.

## Unresolved items and approval record

- **DR-01:** Resolved by human approval; see above.
- **DR-02:** Resolved by human approval; see above.
- **DR-03:** The user approved a fixed localhost address with no public
  deployment in this run. Document the exact origin in the implementation plan
  and verify it before claiming persistence/compatibility success.
- **Approver decision:** The user selected "Approve the proposed architecture
  and confirmed corrupt-data replacement flow" after being presented the two
  decisions, the unresolved hosting origin, and the absence of actual tests.
- **Conditions:** Use a fixed localhost origin and verify it. No PR or public
  deployment authorization was granted.
- **Exact approval state:** **Human-approved architecture.** DR-01 and DR-02
  are resolved. DR-03's execution scope is confirmed; its actual checks must be
  carried into planning as an explicit verification gate.
