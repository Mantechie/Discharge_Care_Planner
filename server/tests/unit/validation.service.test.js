import { test } from "node:test";
import assert from "node:assert/strict";
import { validateExtraction } from "../../src/services/validation.service.js";
import { validateExtractionOutput } from "../../src/validators/extraction.validator.js";

const sourcePages = [
  {
    pageNumber: 1,
    text: "Take one tablet twice daily after food.",
  },
];

test("flags missing medication dose without inventing one", () => {
  const result = validateExtraction({
    extractedData: {
      summary: "",
      language: "en",
      sourceReferences: [],
      medications: [
        {
          name: "Example Medicine",
          dose: null,
          frequency: "twice daily",
          timing: null,
          foodInstruction: "not_specified",
          sourceReferences: [],
        },
      ],
      dailyInstructions: [],
      warningSigns: [],
      followUps: [],
      clarifications: [],
    },
    sourcePages,
  });

  assert.ok(
    result.issues.some((issue) => issue.code === "MEDICATION_DOSE_MISSING")
  );
});

test("flags inferred clock times from frequency alone", () => {
  const result = validateExtraction({
    extractedData: {
      summary: "",
      language: "en",
      sourceReferences: [],
      medications: [
        {
          name: "Example Medicine",
          dose: "one tablet",
          frequency: "twice daily",
          timing: "08:00 and 20:00",
          foodInstruction: "not_specified",
          sourceReferences: [],
        },
      ],
      dailyInstructions: [],
      warningSigns: [],
      followUps: [],
      clarifications: [],
    },
    sourcePages,
  });

  assert.ok(
    result.issues.some((issue) =>
      ["UNSUPPORTED_TIMING_INFERENCE", "FREQUENCY_TO_CLOCK_TIME_INFERENCE"].includes(
        issue.code
      )
    )
  );
});

test("rejects invalid food instruction enum in schema validation", () => {
  const result = validateExtractionOutput({
    summary: "test",
    language: "en",
    medications: [
      {
        name: "Medicine",
        foodInstruction: "after_meals_invalid",
      },
    ],
    dailyInstructions: [],
    warningSigns: [],
    followUps: [],
    clarifications: [],
  });

  assert.equal(result.valid, false);
});

test("rejects invalid provider JSON shape", () => {
  const result = validateExtractionOutput({
    summary: "test",
    language: "en",
    medications: [{ name: "Medicine" }],
    dailyInstructions: [],
    warningSigns: [],
    followUps: [],
    clarifications: [],
    unexpectedField: "not allowed",
  });

  assert.equal(result.valid, false);
});
