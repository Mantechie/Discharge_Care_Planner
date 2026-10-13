import { describe, expect, it } from "vitest";

const fixtureMedication = {
  id: "med-1",
  extracted: {
    name: "Example Medicine",
    dose: "one tablet",
    route: null,
    frequency: "twice daily",
    timing: null,
    foodInstruction: "after_food",
    duration: null,
    reviewStatus: "unreviewed",
    sourceReferences: [{ pageNumber: 1, quotedText: "twice daily after food" }],
  },
  display: {
    name: "Example Medicine",
    dose: "one tablet",
    frequency: "twice daily",
    timing: null,
    foodInstruction: "after_food",
  },
  hasCaregiverEdits: false,
};

describe("extraction fixture expectations", () => {
  it("keeps timing null when not documented", () => {
    expect(fixtureMedication.extracted.timing).toBeNull();
    expect(fixtureMedication.display.timing).toBeNull();
  });

  it("includes source references without invented page numbers", () => {
    expect(fixtureMedication.extracted.sourceReferences[0].pageNumber).toBe(1);
    expect(fixtureMedication.extracted.sourceReferences[0].quotedText).toMatch(
      /after food/i
    );
  });
});
