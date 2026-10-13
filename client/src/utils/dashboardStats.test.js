import { describe, expect, it } from "vitest";
import {
  buildTaskStats,
  canShowResultsDashboard,
  countOpenClarifications,
} from "./dashboardStats.js";

describe("buildTaskStats", () => {
  it("returns null counts when task list is unavailable", () => {
    expect(buildTaskStats(null).hasTaskRecords).toBe(false);
    expect(buildTaskStats(null).total).toBeNull();
  });

  it("counts completed and pending tasks", () => {
    const stats = buildTaskStats([
      { id: "1", status: "completed" },
      { id: "2", status: "pending" },
      { id: "3", status: "pending" },
    ]);
    expect(stats).toEqual({
      hasTaskRecords: true,
      total: 3,
      completed: 1,
      remaining: 2,
      skipped: 0,
    });
  });
});

describe("countOpenClarifications", () => {
  it("counts open clarifications from API list", () => {
    expect(
      countOpenClarifications([
        { status: "open" },
        { status: "resolved" },
      ])
    ).toBe(1);
  });
});

describe("canShowResultsDashboard", () => {
  it("allows dashboard for ready and review_required plans", () => {
    expect(canShowResultsDashboard({ status: "ready" })).toBe(true);
    expect(canShowResultsDashboard({ status: "review_required" })).toBe(true);
    expect(canShowResultsDashboard(null)).toBe(false);
  });
});
