import { describe, expect, it } from "vitest";
import { ApiClientError, userFacingMessage } from "./errors.js";

describe("userFacingMessage", () => {
  it("maps unauthorized to session guidance", () => {
    const error = new ApiClientError("x", { code: "UNAUTHORIZED" });
    expect(userFacingMessage(error)).toMatch(/session expired/i);
  });

  it("hides internal details for unknown errors", () => {
    expect(userFacingMessage(new Error("stack trace here"))).toMatch(
      /connection/i
    );
  });

  it("uses server message for generic api errors", () => {
    const error = new ApiClientError("Custom safe message.", {
      code: "OTHER",
    });
    expect(userFacingMessage(error)).toBe("Custom safe message.");
  });
});
