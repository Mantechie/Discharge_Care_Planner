import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  speakText,
  stopSpeaking,
  getSpeechSupport,
} from "./textToSpeech.js";

describe("textToSpeech", () => {
  beforeEach(() => {
    const speak = vi.fn();
    const cancel = vi.fn();
    class MockUtterance {
      constructor(text) {
        this.text = text;
        this.lang = "";
        this.voice = null;
        this.onend = null;
        this.onerror = null;
      }
    }
    globalThis.SpeechSynthesisUtterance = MockUtterance;
    globalThis.window = {
      speechSynthesis: {
        speak,
        cancel,
        getVoices: () => [{ lang: "en-IN", name: "Test" }],
      },
      SpeechSynthesisUtterance: MockUtterance,
    };
  });

  afterEach(() => {
    stopSpeaking();
  });

  it("reports support when synthesis API exists", () => {
    expect(getSpeechSupport("en").supported).toBe(true);
  });

  it("speaks and can be stopped", async () => {
    const ok = await speakText("Hello care plan", "en");
    expect(ok).toBe(true);
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    stopSpeaking();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it("returns false when unsupported", async () => {
    delete window.speechSynthesis;
    await expect(speakText("Hi", "en")).resolves.toBe(false);
  });
});
