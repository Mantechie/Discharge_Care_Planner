import { describe, expect, it, vi } from "vitest";
import { onSessionExpired, notifySessionExpired } from "./sessionLifecycle.js";

describe("sessionLifecycle", () => {
  it("notifies registered listeners on session expiry", () => {
    const handler = vi.fn();
    const unsubscribe = onSessionExpired(handler);
    notifySessionExpired();
    expect(handler).toHaveBeenCalledTimes(1);
    unsubscribe();
    notifySessionExpired();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
