import { describe, expect, it, beforeEach } from "vitest";
import {
  readStoredLanguage,
  writeStoredLanguage,
  isSupportedLocale,
  resetSessionLanguage,
} from "./languagePreference.js";

describe("languagePreference", () => {
  beforeEach(() => {
    resetSessionLanguage();
  });

  it("defaults to English", () => {
    expect(readStoredLanguage()).toBe("en");
  });

  it("persists supported locale in session memory", () => {
    writeStoredLanguage("hi");
    expect(readStoredLanguage()).toBe("hi");
  });

  it("rejects unsupported locale writes", () => {
    writeStoredLanguage("fr");
    expect(readStoredLanguage()).toBe("en");
  });

  it("validates locales", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("hi")).toBe(true);
    expect(isSupportedLocale("de")).toBe(false);
  });
});
