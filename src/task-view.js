function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setFocusKey(node, key) {
  node.dataset.focusKey = key;
  return node;
}

function makeButton(text, className, action, taskId, focusKey) {
  const button = element("button", className, text);
  button.type = "button";
  button.dataset.action = action;
  button.dataset.taskId = taskId;
  if (focusKey) setFocusKey(button, focusKey);
  return button;
}

export function createTaskView() {
  let controller;
  const editDrafts = new Map();
  const addForm = document.querySelector("#add-form");
  const addInput = document.querySelector("#new-task-title");
  const addError = document.querySelector("#add-error");
  const taskList = document.querySelector("#task-list");
  const listMessage = document.querySelector("#list-message");
  const storageStatus = document.querySelector("#storage-status");
  const announcements = document.querySelector("#announcements");
  const replaceButton = document.querySelector("#replace-data");
  const deleteDialog = document.querySelector("#delete-dialog");
  const deleteDialogMessage = document.querySelector("#delete-dialog-message");
  const replaceDialog = document.querySelector("#replace-dialog");
  let deleteReturnFocusKey = null;
  let editReturnFocusKey = null;
  let actionReturnFocusKey = null;

  function renderEditForm(task, state) {
    const form = element("form", "edit-form");
    form.dataset.taskId = task.id;
    const label = element("label", "", "Edit task title");
    const input = element("input");
    input.type = "text";
    input.value = editDrafts.get(task.id) ?? task.title;
    input.id = "edit-task-title";
    input.name = "title";
    input.dataset.focusKey = `edit-input-${task.id}`;
    const errorId = "edit-error";
    input.setAttribute("aria-describedby", errorId);
    const error = element("p", "field-error");
    error.id = errorId;
    const validation =
      state.validation?.target === "edit" && state.validation.id === task.id
        ? state.validation.message
        : "";
    error.textContent = validation;
    if (validation) input.setAttribute("aria-invalid", "true");
    label.htmlFor = input.id;

    const save = element("button", "button button-primary", "Save");
    save.type = "submit";
    const cancel = makeButton(
      "Cancel",
      "button button-secondary",
      "cancel-edit",
      task.id,
    );
    const actions = element("div", "task-actions");
    actions.append(save, cancel);
    form.append(label, input, error, actions);
    return form;
  }

  function renderTask(task, state) {
    const item = element("li", "task-item");
    item.dataset.taskId = task.id;

    if (state.editingId === task.id) {
      item.append(renderEditForm(task, state));
      return item;
    }

    const detail = element("div", "task-detail");
    const title = element("p", "task-title", task.title);
    const status = element(
      "span",
      `task-status status-${task.status}`,
      task.status === "completed" ? "Completed" : "Pending",
    );
    detail.append(title, status);

    const actions = element("div", "task-actions");
    const nextStatus =
      task.status === "pending" ? "completed" : "pending";
    const toggle = makeButton(
      task.status === "pending" ? "Mark completed" : "Reopen",
      "button button-secondary",
      "toggle",
      task.id,
      `toggle-${task.id}`,
    );
    toggle.setAttribute(
      "aria-label",
      `${task.status === "pending" ? "Mark" : "Reopen"} ${task.title} as ${nextStatus}`,
    );
    const edit = makeButton(
      "Edit",
      "button button-secondary",
      "edit",
      task.id,
      `edit-${task.id}`,
    );
    const remove = makeButton(
      "Delete",
      "button button-danger",
      "delete",
      task.id,
      `delete-${task.id}`,
    );
    actions.append(toggle, edit, remove);
    item.append(detail, actions);
    return item;
  }

  function render(state) {
    for (const button of document.querySelectorAll("[data-filter]")) {
      const active = button.dataset.filter === state.filter;
      button.setAttribute("aria-pressed", String(active));
    }

    const validation =
      state.validation?.target === "add" ? state.validation.message : "";
    addError.textContent = validation;
    if (validation) addInput.setAttribute("aria-invalid", "true");
    else addInput.removeAttribute("aria-invalid");

    const messages = {
      "empty-list": "No tasks yet. Add a task to get started.",
      "no-filter-matches": `There are no ${state.filter} tasks.`,
      none: "",
    };
    listMessage.textContent = messages[state.listMessage];
    taskList.replaceChildren(
      ...state.visibleTasks.map((task) => renderTask(task, state)),
    );

    if (actionReturnFocusKey) {
      const target = document.querySelector(
        `[data-focus-key="${CSS.escape(actionReturnFocusKey)}"]`,
      );
      const fallback = document.querySelector(
        `[data-focus-key="filter-${CSS.escape(state.filter)}"]`,
      );
      (target || fallback || addInput).focus();
      actionReturnFocusKey = null;
    }

    storageStatus.textContent = state.storageMessage;
    storageStatus.classList.toggle(
      "storage-warning",
      state.mode === "unavailable" || state.mode === "unreadable",
    );
    replaceButton.hidden = state.mode !== "unreadable";
    announcements.textContent = state.announcement;

    if (state.pendingDeleteId) {
      const task = state.tasks.find((item) => item.id === state.pendingDeleteId);
      deleteDialogMessage.textContent = task
        ? `Delete “${task.title}”? This action cannot be undone.`
        : "This task is no longer available.";
      if (!deleteDialog.open) deleteDialog.showModal();
    } else if (deleteDialog.open) {
      deleteDialog.close();
      const returnFocus =
        (deleteReturnFocusKey &&
          document.querySelector(`[data-focus-key="${CSS.escape(deleteReturnFocusKey)}"]`)) ||
        document.querySelector(`[data-focus-key="filter-${CSS.escape(state.filter)}"]`) ||
        addInput;
      returnFocus.focus();
      deleteReturnFocusKey = null;
    }

    if (state.recoveryRequested && !replaceDialog.open) {
      replaceDialog.showModal();
    } else if (!state.recoveryRequested && replaceDialog.open) {
      replaceDialog.close();
      const returnFocus = replaceButton.hidden
        ? document.querySelector(
            `[data-focus-key="filter-${CSS.escape(state.filter)}"]`,
          ) || addInput
        : replaceButton;
      returnFocus.focus();
    }

    if (state.editingId) {
      document
        .querySelector(`[data-focus-key="edit-input-${CSS.escape(state.editingId)}"]`)
        ?.focus();
      editReturnFocusKey = null;
    } else if (editReturnFocusKey) {
      document
        .querySelector(`[data-focus-key="${CSS.escape(editReturnFocusKey)}"]`)
        ?.focus();
      editReturnFocusKey = null;
    }
  }

  addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = controller.add(addInput.value);
    if (result.ok) {
      addForm.reset();
      addInput.focus();
    } else {
      addInput.focus();
    }
  });

  document.addEventListener("click", (event) => {
    const filter = event.target.closest("[data-filter]");
    if (filter) {
      controller.selectFilter(filter.dataset.filter);
      return;
    }

    const dialogAction = event.target.closest("[data-dialog-action]");
    if (dialogAction) {
      event.preventDefault();
      switch (dialogAction.dataset.dialogAction) {
        case "confirm-delete":
          controller.confirmDelete();
          break;
        case "cancel-delete":
          controller.cancelDelete();
          break;
        case "confirm-replace":
          controller.confirmReplacement();
          break;
        case "cancel-replace":
          controller.cancelReplacement();
          break;
      }
      return;
    }

    if (event.target.closest("#replace-data")) {
      controller.requestReplacement();
      return;
    }

    const action = event.target.closest("[data-action]");
    if (!action) return;
    const { taskId, action: name } = action.dataset;
    switch (name) {
      case "toggle":
        actionReturnFocusKey = `toggle-${taskId}`;
        controller.toggleStatus(taskId);
        break;
      case "edit":
        editReturnFocusKey = `edit-${taskId}`;
        controller.beginEdit(taskId);
        break;
      case "cancel-edit":
        editReturnFocusKey = `edit-${taskId}`;
        editDrafts.delete(taskId);
        controller.cancelEdit(taskId);
        break;
      case "delete":
        deleteReturnFocusKey = `delete-${taskId}`;
        controller.requestDelete(taskId);
        break;
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest(".edit-form");
    if (!form) return;
    event.preventDefault();
    const taskId = form.dataset.taskId;
    const input = form.querySelector("input[name='title']");
    editDrafts.set(taskId, input.value);
    editReturnFocusKey = `edit-${taskId}`;
    const result = controller.saveEdit(taskId, input.value);
    if (result.ok) editDrafts.delete(taskId);
    else input.focus();
  });

  for (const dialog of [deleteDialog, replaceDialog]) {
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      if (dialog === deleteDialog) controller.cancelDelete();
      else controller.cancelReplacement();
    });
  }

  addInput.addEventListener("input", () => {
    addInput.removeAttribute("aria-invalid");
    addError.textContent = "";
  });

  document.addEventListener("input", (event) => {
    const input = event.target.closest(".edit-form input[name='title']");
    if (input) editDrafts.set(input.closest(".edit-form").dataset.taskId, input.value);
  });

  return Object.freeze({
    render,
    connect(nextController) {
      controller = nextController;
    },
  });
}
