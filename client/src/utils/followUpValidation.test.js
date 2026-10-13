import { describe, expect, it } from "vitest";
import {
  validateClarificationResolution,
  validateFollowUpDraft,
} from "./followUpValidation.js";

describe("validateFollowUpDraft", () => {
  it("rejects invalid date format", () => {
    const result = validateFollowUpDraft({
      title: "Follow up",
      appointmentDate: "13/10/2026",
    });
    expect(result.valid).toBe(false);
  });
});

describe("validateClarificationResolution", () => {
  it("requires note for professional confirmation", () => {
    const result = validateClarificationResolution({
      requiresProfessionalConfirmation: true,
      resolutionNote: "",
    });
    expect(result.valid).toBe(false);
  });

  it("allows dismissal with note when not clinical", () => {
    const result = validateClarificationResolution({
      requiresProfessionalConfirmation: false,
      resolutionNote: "Confirmed by phone with clinic.",
    });
    expect(result.valid).toBe(true);
  });
});
