import { describe, expect, it } from "vitest";
import {
  isChatAvailableForDocument,
  mapAssistantResponse,
  mapHistoryToThread,
  getSuggestedQuestions,
} from "./chatPresentation.js";
import { createTranslator } from "../i18n/translate.js";

describe("isChatAvailableForDocument", () => {
  it("blocks processing and failed documents", () => {
    expect(isChatAvailableForDocument({ id: "1", status: "processing" })).toBe(
      false
    );
    expect(
      isChatAvailableForDocument({
        id: "1",
        status: "ready",
        hasReadableText: true,
      })
    ).toBe(true);
  });
});

describe("mapHistoryToThread", () => {
  it("maps API history items", () => {
    const thread = mapHistoryToThread([
      { id: "a", role: "user", message: "Hi", language: "en" },
      {
        id: "b",
        role: "assistant",
        message: "Answer",
        answerStatus: "answered",
        sourceReferences: [{ pageNumber: 1, quotedText: "text" }],
      },
    ]);
    expect(thread[1].citations).toHaveLength(1);
  });
});

describe("mapAssistantResponse", () => {
  it("preserves citations without inventing fields", () => {
    const msg = mapAssistantResponse({
      messageId: "1",
      answer: "After food.",
      language: "en",
      answerStatus: "answered",
      citations: [{ pageNumber: 1, quotedText: "after food" }],
    });
    expect(msg.citations[0].quotedText).toMatch(/after food/i);
    expect(msg.text).toBe("After food.");
  });
});

describe("getSuggestedQuestions", () => {
  it("uses translator for UI suggestions without altering API language codes", () => {
    const tHi = createTranslator("hi");
    const questions = getSuggestedQuestions(tHi);
    expect(questions[0]).toMatch(/डिस्चार्ज/);
  });
});
