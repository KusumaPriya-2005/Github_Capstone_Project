# Task manager

A framework-free task list for one browser storage context. It supports adding,
editing, completing/reopening, deleting with confirmation, and filtering
Pending and Completed tasks. No account, backend, network service, or
cross-device synchronization is used.

## Run locally

From the repository root, run the standard-library Python server:

```text
python -m http.server 8000 --bind 127.0.0.1
```

Open **http://localhost:8000/** in a browser. Keep the server process running
while using the app. Stop it with Ctrl+C when finished. Do not open the page
with `file://`; browser modules and origin-scoped storage require the local
server. The supported run for this project is the fixed localhost origin above;
do not publish or deploy it as part of this workflow.

Tasks are stored in this browser's local storage for this origin. Different
browsers, devices, ports, or origins have separate task lists. Clearing browser
data can remove saved tasks. A “saved” message means the browser accepted the
local storage write; it is not a backup or guarantee against browser data loss.

## Use

- Enter a nonempty title and choose **Add task**. Titles are trimmed; duplicate
  titles are allowed.
- Use **All**, **Pending**, and **Completed** to filter the list.
- Use **Mark completed** or **Reopen** to change one task's status.
- Choose **Edit**, save a nonempty title, or cancel without changing the task.
- Choose **Delete** and confirm to remove a task.
- If browser storage becomes unavailable, continue using the in-memory list;
  the persistent warning explains that session changes are not saved.
- If saved data is unreadable, the app preserves it and does not write normal
  changes over it. **Replace unreadable saved data…** opens an additional
  confirmation. Confirming replaces the unreadable stored value with the
  current in-memory list; canceling leaves saved data untouched.

All task actions are available from the keyboard. Status is communicated with
text as well as visual styling.

## Run tests

With Node.js available, run the built-in test runner from the repository root:

```text
node --test tests/*.test.mjs
```

No package installation or build step is required.
