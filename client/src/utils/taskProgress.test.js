import { describe, expect, it } from "vitest";
import {
  buildTaskProgress,
  nextTaskStatus,
  TASK_STATUS,
} from "./taskProgress.js";

describe("buildTaskProgress", () => {
  it("counts only supported statuses without double counting", () => {
    const progress = buildTaskProgress([
      { id: "1", status: "completed" },
      { id: "2", status: "pending" },
      { id: "3", status: "skipped" },
    ]);
    expect(progress).toEqual({
      hasTaskRecords: true,
      total: 3,
      completed: 1,
      remaining: 1,
      skipped: 1,
    });
  });

  it("returns empty stats for no tasks", () => {
    expect(buildTaskProgress([]).hasTaskRecords).toBe(false);
  });
});

describe("nextTaskStatus", () => {
  it("toggles completion", () => {
    expect(nextTaskStatus(TASK_STATUS.PENDING, "complete")).toBe(
      TASK_STATUS.COMPLETED
    );
    expect(nextTaskStatus(TASK_STATUS.COMPLETED, "complete")).toBe(
      TASK_STATUS.PENDING
    );
  });
});
