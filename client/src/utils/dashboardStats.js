import { buildTaskProgress } from "./taskProgress.js";

export function buildTaskStats(taskItems) {
  const progress = buildTaskProgress(taskItems);
  return {
    hasTaskRecords: progress.hasTaskRecords,
    total: progress.hasTaskRecords ? progress.total : null,
    completed: progress.hasTaskRecords ? progress.completed : null,
    remaining: progress.hasTaskRecords ? progress.remaining : null,
    skipped: progress.hasTaskRecords ? progress.skipped : null,
  };
}

export function countUpcomingFollowUps(followUpItems) {
  if (!Array.isArray(followUpItems)) {
    return null;
  }

  return followUpItems.filter((item) => item.status === "upcoming").length;
}

export function countOpenClarifications(clarifications, carePlan) {
  if (Array.isArray(clarifications)) {
    return clarifications.filter((item) => item.status === "open").length;
  }

  if (carePlan?.openClarificationCount != null) {
    return carePlan.openClarificationCount;
  }

  return null;
}

export function canShowResultsDashboard(carePlan) {
  if (!carePlan) {
    return false;
  }
  return ["draft", "review_required", "ready"].includes(carePlan.status);
}

export function isCarePlanClinicallyReady(carePlan) {
  return carePlan?.status === "ready";
}
