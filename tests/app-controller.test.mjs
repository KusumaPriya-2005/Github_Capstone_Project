import assert from "node:assert/strict";
import test from "node:test";
import { createAppController } from "../src/app-controller.js";

function setup(load = { ok: true, kind: "empty", tasks: [] }, options = {}) {
  const saved = [];
  let writes = 0;
  const storage = {
    loadTasks: () => load,
    saveTasks(tasks) {
      writes += 1;
      if (options.failSave) return { ok: false, kind: "unavailable" };
      saved.push(structuredClone(tasks));
      return { ok: true, kind: "saved" };
    },
    replaceUnreadableDocument(tasks, confirmed) {
      if (options.failReplace) return { ok: false, kind: "unavailable" };
      assert.equal(confirmed, true);
      saved.push(structuredClone(tasks));
      return { ok: true, kind: "saved" };
    },
  };
  let latest;
  let nextId = 0;
  const controller = createAppController({
    storage,
    render: (state) => {
      latest = state;
    },
    createId: () => `id-${++nextId}`,
  });
  controller.start();
  return { controller, saved, state: () => latest, writeCount: () => writes };
}

test("keeps filters across add, edit, toggle, and confirmed delete", () => {
  const { controller, state, saved } = setup();
  controller.selectFilter("completed");
  controller.add(" One ");
  assert.equal(state().filter, "completed");
  assert.equal(state().listMessage, "no-filter-matches");

  controller.add("One");
  const [first, second] = state().tasks;
  controller.toggleStatus(first.id);
  assert.equal(state().filter, "completed");
  assert.deepEqual(state().visibleTasks.map((task) => task.id), [first.id]);

  controller.beginEdit(first.id);
  assert.equal(controller.saveEdit(first.id, " \t ").ok, false);
  assert.equal(state().tasks[0].title, "One");
  controller.cancelEdit(first.id);
  controller.beginEdit(first.id);
  controller.saveEdit(first.id, "  Updated  ");
  assert.equal(state().tasks[0].title, "Updated");
  assert.equal(state().tasks[0].status, "completed");

  controller.requestDelete(second.id);
  controller.cancelDelete();
  assert.equal(state().tasks.length, 2);
  controller.requestDelete(second.id);
  controller.confirmDelete();
  assert.deepEqual(state().tasks.map((task) => task.id), [first.id]);
  assert.equal(state().filter, "completed");
  assert.equal(saved.length, 5);
});

test("adding under Completed keeps the filter and retains the unmatched task", () => {
  const { controller, state } = setup();
  controller.selectFilter("completed");
  controller.add("A pending task");
  assert.equal(state().filter, "completed");
  assert.equal(state().tasks[0].status, "pending");
  assert.equal(state().listMessage, "no-filter-matches");
});

test("failed writes preserve in-memory changes and stop later write attempts", () => {
  const { controller, state, writeCount } = setup(undefined, { failSave: true });
  controller.add("Session task");
  assert.equal(state().mode, "unavailable");
  assert.match(state().storageMessage, /session only/);
  assert.equal(state().tasks.length, 1);
  controller.toggleStatus(state().tasks[0].id);
  assert.equal(state().tasks[0].status, "completed");
  assert.equal(writeCount(), 1);
});

test("unreadable data is preserved during normal edits and replaced only after confirmation", () => {
  const corrupt = { ok: false, kind: "unreadable" };
  const { controller, state, saved } = setup(corrupt);
  controller.add("In-memory task");
  assert.equal(state().mode, "unreadable");
  assert.match(state().storageMessage, /not been overwritten/);
  assert.equal(saved.length, 0);

  controller.requestReplacement();
  controller.cancelReplacement();
  assert.equal(saved.length, 0);
  controller.requestReplacement();
  controller.confirmReplacement();
  assert.equal(state().mode, "ready");
  assert.equal(saved.length, 1);
  assert.equal(saved[0][0].title, "In-memory task");
});

test("failed corrupt-data replacement does not claim success", () => {
  const { controller, state } = setup(
    { ok: false, kind: "unreadable" },
    { failReplace: true },
  );
  controller.add("Keep using this session");
  controller.requestReplacement();
  controller.confirmReplacement();
  assert.equal(state().mode, "unavailable");
  assert.match(state().storageMessage, /remains unreplaced/);
  assert.match(state().storageMessage, /session only/);
  assert.equal(state().tasks[0].title, "Keep using this session");
});
