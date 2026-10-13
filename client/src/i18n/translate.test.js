import { describe, expect, it } from "vitest";
import { translate, interpolate } from "./translate.js";
import { mapHistoryToThread } from "../utils/chatPresentation.js";

describe("translate", () => {
  it("returns Hindi UI strings", () => {
    expect(translate("hi", "upload.heading")).toMatch(/अपलोड/);
  });

  it("falls back to English for missing keys", () => {
    expect(translate("hi", "nonexistent.key.xyz")).toBe("[nonexistent.key.xyz]");
    expect(translate("en", "nonexistent.key.xyz")).toBe("[nonexistent.key.xyz]");
  });

  it("interpolates placeholders", () => {
    expect(interpolate("Max {maxMb} MB", { maxMb: 10 })).toBe("Max 10 MB");
  });

  it("preserves clinical chat message text from API", () => {
    const thread = mapHistoryToThread([
      {
        id: "1",
        role: "assistant",
        message: "Tab. Metformin 500mg BD after food",
        language: "en",
      },
    ]);
    expect(thread[0].text).toBe("Tab. Metformin 500mg BD after food");
  });
});
