import { TASK_STATUSES } from "./task-domain.js";

export const TASK_STORAGE_KEY = "task-manager.tasks";
export const TASK_SCHEMA_VERSION = 1;

function validateTasks(value) {
  if (!Array.isArray(value)) return false;
  const ids = new Set();

  for (const task of value) {
    if (
      !task ||
      typeof task.id !== "string" ||
      !task.id.trim() ||
      ids.has(task.id) ||
      typeof task.title !== "string" ||
      !task.title.trim() ||
      task.title !== task.title.trim() ||
      !TASK_STATUSES.includes(task.status)
    ) {
      return false;
    }
    ids.add(task.id);
  }
  return true;
}

export function createTaskStorage(storageProvider = () => globalThis.localStorage) {
  let mode = "uninitialized";

  function storageUnavailable(error) {
    mode = "unavailable";
    return {
      ok: false,
      kind: "unavailable",
      message: "Browser storage is unavailable.",
      error,
    };
  }

  function loadTasks() {
    let storage;
    let serialized;
    try {
      storage = storageProvider();
      serialized = storage.getItem(TASK_STORAGE_KEY);
    } catch (error) {
      return storageUnavailable(error);
    }

    if (serialized === null) {
      mode = "ready";
      return { ok: true, kind: "empty", tasks: [] };
    }

    let document;
    try {
      document = JSON.parse(serialized);
    } catch (error) {
      mode = "unreadable";
      return {
        ok: false,
        kind: "unreadable",
        message: "Saved task data is unreadable and has not been overwritten.",
        error,
      };
    }

    if (
      !document ||
      document.schemaVersion !== TASK_SCHEMA_VERSION ||
      !validateTasks(document.tasks)
    ) {
      mode = "unreadable";
      return {
        ok: false,
        kind: "unreadable",
        message: "Saved task data is invalid and has not been overwritten.",
      };
    }

    mode = "ready";
    return {
      ok: true,
      kind: "loaded",
      tasks: document.tasks.map((task) => ({ ...task })),
    };
  }

  function writeSnapshot(storage, tasks) {
    storage.setItem(
      TASK_STORAGE_KEY,
      JSON.stringify({ schemaVersion: TASK_SCHEMA_VERSION, tasks }),
    );
    mode = "ready";
    return { ok: true, kind: "saved" };
  }

  function saveTasks(tasks) {
    if (!validateTasks(tasks)) {
      return { ok: false, kind: "invalid-snapshot" };
    }
    if (mode === "unavailable") {
      return { ok: false, kind: "unavailable" };
    }
    if (mode === "unreadable") {
      return { ok: false, kind: "unreadable" };
    }
    if (mode !== "ready") {
      return { ok: false, kind: "not-loaded" };
    }

    try {
      return writeSnapshot(storageProvider(), tasks);
    } catch (error) {
      return storageUnavailable(error);
    }
  }

  function replaceUnreadableDocument(tasks, confirmed) {
    if (confirmed !== true) {
      return { ok: false, kind: "confirmation-required" };
    }
    if (!validateTasks(tasks)) {
      return { ok: false, kind: "invalid-snapshot" };
    }
    if (mode !== "unreadable") {
      return { ok: false, kind: mode === "unavailable" ? "unavailable" : "not-unreadable" };
    }

    try {
      return writeSnapshot(storageProvider(), tasks);
    } catch (error) {
      return storageUnavailable(error);
    }
  }

  return Object.freeze({ loadTasks, saveTasks, replaceUnreadableDocument });
}
