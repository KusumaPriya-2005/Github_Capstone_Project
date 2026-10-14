import assert from "node:assert/strict";
import test from "node:test";
import {
  createTask,
  normalizeTitle,
  removeTask,
  renameTask,
  selectListMessage,
  selectVisibleTasks,
  setTaskStatus,
} from "../src/task-domain.js";

test("normalizes titles and rejects blank input", () => {
  assert.deepEqual(normalizeTitle("  Write notes \n"), {
    ok: true,
    title: "Write notes",
  });
  assert.equal(normalizeTitle(" \t ").ok, false);
  assert.equal(normalizeTitle(null).ok, false);
});

test("creates separate pending tasks with duplicate titles and unique IDs", () => {
  const first = createTask([], " Same ", () => "one");
  const second = createTask(first.tasks, "Same", () => "one" === "one" ? "two" : "unused");
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    second.tasks.map(({ id, title, status }) => ({ id, title, status })),
    [
      { id: "one", title: "Same", status: "pending" },
      { id: "two", title: "Same", status: "pending" },
    ],
  );
});

test("a failed ID generator leaves the collection unchanged", () => {
  const tasks = [{ id: "1", title: "Keep", status: "pending" }];
  const result = createTask(tasks, "New", () => {
    throw new Error("unavailable");
  });
  assert.equal(result.ok, false);
  assert.deepEqual(tasks, [{ id: "1", title: "Keep", status: "pending" }]);
});

test("rename, status changes, and removal target one stable ID", () => {
  const tasks = [
    { id: "1", title: "First", status: "pending" },
    { id: "2", title: "Second", status: "pending" },
  ];
  const renamed = renameTask(tasks, "1", "  Updated ");
  assert.deepEqual(renamed.tasks, [
    { id: "1", title: "Updated", status: "pending" },
    tasks[1],
  ]);
  assert.equal(renameTask(tasks, "1", "  ").ok, false);
  assert.deepEqual(tasks[0], { id: "1", title: "First", status: "pending" });

  const completed = setTaskStatus(tasks, "2", "completed");
  assert.deepEqual(completed.tasks, [tasks[0], { ...tasks[1], status: "completed" }]);
  assert.equal(setTaskStatus(tasks, "2", "unknown").ok, false);
  assert.deepEqual(removeTask(completed.tasks, "1").tasks, [completed.tasks[1]]);
});

test("selectors distinguish an empty list from a filter with no matches", () => {
  const tasks = [{ id: "1", title: "Done", status: "completed" }];
  assert.equal(selectListMessage([], "all"), "empty-list");
  assert.equal(selectListMessage(tasks, "pending"), "no-filter-matches");
  assert.equal(selectListMessage(tasks, "all"), "none");
  assert.deepEqual(selectVisibleTasks(tasks, "pending"), []);
});
