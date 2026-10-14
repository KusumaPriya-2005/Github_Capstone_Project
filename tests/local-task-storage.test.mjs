import assert from "node:assert/strict";
import test from "node:test";
import {
  createTaskStorage,
  TASK_STORAGE_KEY,
  TASK_SCHEMA_VERSION,
} from "../src/local-task-storage.js";

function makeStorage(initial = null) {
  const values = new Map();
  if (initial !== null) values.set(TASK_STORAGE_KEY, initial);
  return {
    values,
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

const validTasks = [{ id: "one", title: "Example", status: "pending" }];

test("loads missing data and saves/restores a versioned full snapshot", () => {
  const backing = makeStorage();
  const adapter = createTaskStorage(() => backing);
  assert.deepEqual(adapter.loadTasks(), { ok: true, kind: "empty", tasks: [] });
  assert.deepEqual(adapter.saveTasks(validTasks), { ok: true, kind: "saved" });

  const stored = JSON.parse(backing.values.get(TASK_STORAGE_KEY));
  assert.equal(stored.schemaVersion, TASK_SCHEMA_VERSION);
  assert.deepEqual(stored.tasks, validTasks);
  assert.deepEqual(
    createTaskStorage(() => backing).loadTasks(),
    { ok: true, kind: "loaded", tasks: validTasks },
  );
});

test("rejects corrupt documents without overwriting them until confirmed", () => {
  for (const serialized of [
    "{not json",
    JSON.stringify({ schemaVersion: 2, tasks: [] }),
    JSON.stringify({ schemaVersion: 1, tasks: [{ ...validTasks[0], title: " bad " }] }),
    JSON.stringify({ schemaVersion: 1, tasks: [{ ...validTasks[0], status: "done" }] }),
    JSON.stringify({ schemaVersion: 1, tasks: [validTasks[0], validTasks[0]] }),
  ]) {
    const backing = makeStorage(serialized);
    const adapter = createTaskStorage(() => backing);
    assert.equal(adapter.loadTasks().kind, "unreadable");
    assert.deepEqual(adapter.saveTasks(validTasks), { ok: false, kind: "unreadable" });
    assert.deepEqual(
      adapter.replaceUnreadableDocument(validTasks, false),
      { ok: false, kind: "confirmation-required" },
    );
    assert.equal(backing.values.get(TASK_STORAGE_KEY), serialized);
    assert.deepEqual(
      adapter.replaceUnreadableDocument(validTasks, true),
      { ok: true, kind: "saved" },
    );
    assert.deepEqual(
      JSON.parse(backing.values.get(TASK_STORAGE_KEY)),
      { schemaVersion: TASK_SCHEMA_VERSION, tasks: validTasks },
    );
  }
});

test("storage access failure locks out automatic retry", () => {
  let calls = 0;
  const adapter = createTaskStorage(() => {
    calls += 1;
    if (calls === 1) {
      return {
        getItem: () => null,
        setItem: () => {
          throw new Error("quota");
        },
      };
    }
    throw new Error("should not retry");
  });
  assert.equal(adapter.loadTasks().ok, true);
  assert.equal(adapter.saveTasks(validTasks).kind, "unavailable");
  assert.equal(adapter.saveTasks(validTasks).kind, "unavailable");
  assert.equal(calls, 2);
});

test("unavailable storage during startup is reported without throwing", () => {
  const adapter = createTaskStorage(() => {
    throw new Error("blocked");
  });
  assert.equal(adapter.loadTasks().kind, "unavailable");
  assert.equal(adapter.saveTasks(validTasks).kind, "unavailable");
});
