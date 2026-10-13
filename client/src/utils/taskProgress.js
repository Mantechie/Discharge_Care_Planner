export const TASK_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  SKIPPED: "skipped",
};

export function buildTaskProgress(taskItems) {
  if (!Array.isArray(taskItems)) {
    return {
      hasTaskRecords: false,
      total: null,
      completed: null,
      remaining: null,
      skipped: null,
    };
  }

  const activeTasks = taskItems.filter((task) => task?.id);
  const total = activeTasks.length;
  const completed = activeTasks.filter(
    (task) => task.status === TASK_STATUS.COMPLETED
  ).length;
  const remaining = activeTasks.filter(
    (task) => task.status === TASK_STATUS.PENDING
  ).length;
  const skipped = activeTasks.filter(
    (task) => task.status === TASK_STATUS.SKIPPED
  ).length;

  return {
    hasTaskRecords: total > 0,
    total,
    completed,
    remaining,
    skipped,
  };
}

export function nextTaskStatus(currentStatus, action) {
  if (action === "complete") {
    return currentStatus === TASK_STATUS.COMPLETED
      ? TASK_STATUS.PENDING
      : TASK_STATUS.COMPLETED;
  }
  if (action === "skip") {
    return currentStatus === TASK_STATUS.SKIPPED
      ? TASK_STATUS.PENDING
      : TASK_STATUS.SKIPPED;
  }
  return currentStatus;
}
