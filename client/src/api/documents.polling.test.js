import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./config.js", () => ({
  STATUS_POLL_INTERVAL_MS: 5,
  STATUS_POLL_MAX_ATTEMPTS: 90,
}));

vi.mock("./http.js", () => ({
  apiFetch: vi.fn(),
}));

import { pollDocumentStatus } from "./documents.js";

import { apiFetch } from "./http.js";

describe("pollDocumentStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  it("stops on terminal success status", async () => {
    apiFetch
      .mockResolvedValueOnce({ data: { status: "processing", id: "1" } })
      .mockResolvedValueOnce({ data: { status: "ready", id: "1" } });

    const updates = [];
    const promise = pollDocumentStatus("doc-1", {
      onUpdate: (value) => updates.push(value.status),
    });
    await vi.runAllTimersAsync();
    const status = await promise;

    expect(status.status).toBe("ready");
    expect(updates).toEqual(["processing", "ready"]);
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it("stops on failure status", async () => {
    apiFetch.mockResolvedValueOnce({ data: { status: "failed", id: "1" } });

    const status = await pollDocumentStatus("doc-1");
    expect(status.status).toBe("failed");
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
