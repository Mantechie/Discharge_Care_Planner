import { describe, expect, it } from "vitest";
import {
  formatDocumentedValue,
  formatFoodInstruction,
  isCarePlanReadyForContinue,
} from "./extractionLabels.js";

describe("formatDocumentedValue", () => {
  it("labels missing values", () => {
    expect(formatDocumentedValue(null)).toBe(
      "Not specified in the document"
    );
    expect(formatDocumentedValue("")).toBe(
      "Not specified in the document"
    );
  });

  it("preserves explicit values", () => {
    expect(formatDocumentedValue("twice daily")).toBe("twice daily");
  });
});

describe("formatFoodInstruction", () => {
  it("does not invent food timing", () => {
    expect(formatFoodInstruction("not_specified")).toBe(
      "Not specified in the document"
    );
    expect(formatFoodInstruction("after_food")).toBe("After food");
  });
});

describe("isCarePlanReadyForContinue", () => {
  it("blocks continue when clarifications are open", () => {
    expect(
      isCarePlanReadyForContinue({
        status: "draft",
        openClarificationCount: 2,
      })
    ).toBe(false);
  });

  it("allows continue when draft and no open clarifications", () => {
    expect(
      isCarePlanReadyForContinue({
        status: "draft",
        openClarificationCount: 0,
      })
    ).toBe(true);
  });
});
