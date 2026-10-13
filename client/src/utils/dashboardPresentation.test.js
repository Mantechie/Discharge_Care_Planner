import { describe, expect, it } from "vitest";
import { formatDocumentedValue, formatFoodInstruction } from "./extractionLabels.js";

describe("dashboard medicine presentation", () => {
  const medication = {
    extracted: {
      frequency: "twice daily",
      timing: null,
      foodInstruction: "not_specified",
    },
    display: { timing: null, frequency: "twice daily" },
  };

  it("shows exact time only when documented", () => {
    expect(formatDocumentedValue(medication.display.timing)).toBe(
      "Not specified in the document"
    );
  });

  it("does not infer food instructions", () => {
    expect(formatFoodInstruction(medication.extracted.foodInstruction)).toBe(
      "Not specified in the document"
    );
  });
});
