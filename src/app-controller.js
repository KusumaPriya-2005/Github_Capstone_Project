import {
  createTask,
  removeTask,
  renameTask,
  selectListMessage,
  selectVisibleTasks,
  setTaskStatus,
  TASK_FILTERS,
} from "./task-domain.js";

export function createAppController({ storage, render, createId }) {
  const state = {
    tasks: [],
    filter: "all",
    mode: "loading",
    storageMessage: "Loading saved tasks…",
    validation: null,
    editingId: null,
    pendingDeleteId: null,
    recoveryRequested: false,
    announcement: "",
  };

  function snapshot() {
    return {
      ...state,
      tasks: state.tasks.map((task) => ({ ...task })),
      visibleTasks: selectVisibleTasks(state.tasks, state.filter),
      listMessage: selectListMessage(state.tasks, state.filter),
    };
  }

  function publish(announcement = "") {
    state.announcement = announcement;
    render(snapshot());
  }

  function start() {
    const result = storage.loadTasks();
    if (result.ok) {
      state.tasks = result.tasks;
      state.mode = "ready";
      state.storageMessage =
        result.kind === "loaded"
          ? "Saved tasks loaded. New changes will be saved in this browser."
          : "Changes will be saved in this browser.";
    } else if (result.kind === "unreadable") {
      state.mode = "unreadable";
      state.storageMessage =
        "Saved task data is unreadable and has not been overwritten. Changes in this session are not saved. You can continue using tasks in memory.";
    } else {
      state.mode = "unavailable";
      state.storageMessage =
        "Browser storage is unavailable. Changes in this session are not saved; you can continue using tasks in memory.";
    }
    publish();
  }

  function commit(candidate, announcement) {
    state.tasks = candidate;
    state.validation = null;

    if (state.mode === "ready") {
      const result = storage.saveTasks(candidate);
      if (result.ok) {
        state.storageMessage = "Latest changes saved in this browser.";
      } else {
        state.mode = "unavailable";
        state.storageMessage =
          "Could not save changes. Your latest changes are available in this session only and will not be saved.";
      }
    } else if (state.mode === "unreadable") {
      state.storageMessage =
        "Saved task data is unreadable and has not been overwritten. Your changes are available in this session only.";
    }

    publish(announcement);
  }

  function add(rawTitle) {
    const result = createTask(state.tasks, rawTitle, createId);
    if (!result.ok) {
      state.validation = { target: "add", message: result.error };
      publish(result.error);
      return result;
    }
    commit(result.tasks, `Added “${result.task.title}”.`);
    return result;
  }

  function beginEdit(id) {
    if (!state.tasks.some((task) => task.id === id)) return false;
    state.editingId = id;
    state.validation = null;
    publish();
    return true;
  }

  function saveEdit(id, rawTitle) {
    const result = renameTask(state.tasks, id, rawTitle);
    if (!result.ok) {
      state.validation = { target: "edit", id, message: result.error };
      publish(result.error);
      return result;
    }
    state.editingId = null;
    commit(result.tasks, "Task title updated.");
    return result;
  }

  function cancelEdit(id) {
    if (state.editingId !== id) return;
    state.editingId = null;
    state.validation = null;
    publish("Edit cancelled. The task was not changed.");
  }

  function requestDelete(id) {
    if (!state.tasks.some((task) => task.id === id)) return false;
    state.pendingDeleteId = id;
    publish();
    return true;
  }

  function confirmDelete() {
    const id = state.pendingDeleteId;
    if (!id) return;
    const result = removeTask(state.tasks, id);
    state.pendingDeleteId = null;
    if (!result.ok) {
      publish(result.error);
      return;
    }
    commit(result.tasks, "Task deleted.");
  }

  function cancelDelete() {
    if (!state.pendingDeleteId) return;
    state.pendingDeleteId = null;
    publish("Deletion cancelled. No task was deleted.");
  }

  function toggleStatus(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    const status = task.status === "pending" ? "completed" : "pending";
    const result = setTaskStatus(state.tasks, id, status);
    if (result.ok) {
      commit(
        result.tasks,
        status === "completed" ? "Task marked completed." : "Task reopened.",
      );
    }
  }

  function selectFilter(filter) {
    if (!TASK_FILTERS.includes(filter)) return;
    state.filter = filter;
    publish(`Showing ${filter === "all" ? "all" : filter} tasks.`);
  }

  function requestReplacement() {
    if (state.mode !== "unreadable") return;
    state.recoveryRequested = true;
    publish();
  }

  function cancelReplacement() {
    if (!state.recoveryRequested) return;
    state.recoveryRequested = false;
    publish("Saved data was not replaced.");
  }

  function confirmReplacement() {
    if (!state.recoveryRequested || state.mode !== "unreadable") return;
    const result = storage.replaceUnreadableDocument(state.tasks, true);
    state.recoveryRequested = false;
    if (result.ok) {
      state.mode = "ready";
      state.storageMessage =
        "Unreadable saved data was replaced with the tasks currently in this session. Latest changes saved in this browser.";
      publish("Unreadable saved data replaced.");
    } else {
      state.mode = "unavailable";
      state.storageMessage =
        "Could not replace unreadable saved data. It remains unreplaced; your current tasks are available in this session only.";
      publish("Replacement failed. The current session is still available.");
    }
  }

  return Object.freeze({
    start,
    snapshot,
    add,
    beginEdit,
    saveEdit,
    cancelEdit,
    requestDelete,
    confirmDelete,
    cancelDelete,
    toggleStatus,
    selectFilter,
    requestReplacement,
    cancelReplacement,
    confirmReplacement,
  });
}
