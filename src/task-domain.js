export const TASK_STATUSES = Object.freeze(["pending", "completed"]);
export const TASK_FILTERS = Object.freeze(["all", ...TASK_STATUSES]);

export function normalizeTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  if (!title) {
    return { ok: false, error: "Enter a task title before saving." };
  }
  return { ok: true, title };
}

export function createTask(tasks, rawTitle, createId = () => crypto.randomUUID()) {
  const normalized = normalizeTitle(rawTitle);
  if (!normalized.ok) return normalized;

  let id;
  try {
    do {
      id = createId();
      if (typeof id !== "string" || !id.trim()) {
        return { ok: false, error: "A unique task ID could not be created." };
      }
    } while (tasks.some((task) => task.id === id));
  } catch {
    return {
      ok: false,
      error: "A task could not be created because a unique ID is unavailable.",
    };
  }

  const task = { id, title: normalized.title, status: "pending" };
  return { ok: true, task, tasks: [...tasks, task] };
}

export function renameTask(tasks, id, rawTitle) {
  const normalized = normalizeTitle(rawTitle);
  if (!normalized.ok) return normalized;
  if (!tasks.some((task) => task.id === id)) {
    return { ok: false, error: "That task is no longer available." };
  }
  return {
    ok: true,
    tasks: tasks.map((task) =>
      task.id === id ? { ...task, title: normalized.title } : task,
    ),
  };
}

export function setTaskStatus(tasks, id, status) {
  if (!TASK_STATUSES.includes(status)) {
    return { ok: false, error: "Choose a valid task status." };
  }
  if (!tasks.some((task) => task.id === id)) {
    return { ok: false, error: "That task is no longer available." };
  }
  return {
    ok: true,
    tasks: tasks.map((task) =>
      task.id === id ? { ...task, status } : task,
    ),
  };
}

export function removeTask(tasks, id) {
  if (!tasks.some((task) => task.id === id)) {
    return { ok: false, error: "That task is no longer available." };
  }
  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}

export function selectVisibleTasks(tasks, filter) {
  if (filter === "all") return [...tasks];
  if (!TASK_STATUSES.includes(filter)) return [];
  return tasks.filter((task) => task.status === filter);
}

export function selectListMessage(tasks, filter) {
  if (tasks.length === 0) return "empty-list";
  if (selectVisibleTasks(tasks, filter).length === 0) {
    return "no-filter-matches";
  }
  return "none";
}
