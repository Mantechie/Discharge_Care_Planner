import { verifySourceReference } from "../utils/sourceReferences.js";
import { FOOD_INSTRUCTIONS } from "../models/CarePlan.js";

const CLOCK_TIME_PATTERN =
  /\b([01]?\d|2[0-3]):[0-5]\d(\s?(am|pm))?\b/i;
const FREQUENCY_PATTERN =
  /\b(twice daily|bd|b\.d\.|tid|three times|every\s+\d+\s+hours?)\b/i;

function issue({
  code,
  field,
  reason,
  sourceReferences = [],
  requiresProfessionalConfirmation = false,
  reviewPriority = "normal",
}) {
  return {
    code,
    field,
    reason,
    sourceReferences,
    requiresProfessionalConfirmation,
    reviewPriority,
  };
}

function sourceTextContains(sourcePages, pattern) {
  const text = sourcePages.map((page) => page.text || "").join("\n");
  return pattern.test(text);
}

function verifyAllReferences(sourceReferences, sourcePages, fieldPrefix, issues) {
  for (const [index, reference] of (sourceReferences || []).entries()) {
    const verification = verifySourceReference(reference, sourcePages);

    if (!verification.valid) {
      for (const code of verification.issues) {
        issues.push(
          issue({
            code,
            field: `${fieldPrefix}.sourceReferences[${index}]`,
            reason: "A source reference could not be verified against the document text.",
            sourceReferences: [reference],
            requiresProfessionalConfirmation: true,
            reviewPriority: "high",
          })
        );
      }
    }
  }
}

export function validateExtraction({ extractedData, sourcePages }) {
  const issues = [];

  if (!sourcePages?.length) {
    issues.push(
      issue({
        code: "SOURCE_TEXT_UNAVAILABLE",
        field: "sourcePages",
        reason: "No readable source pages were available for validation.",
        requiresProfessionalConfirmation: true,
        reviewPriority: "critical",
      })
    );
  }

  verifyAllReferences(
    extractedData.sourceReferences,
    sourcePages,
    "summary",
    issues
  );

  for (const [index, medication] of (extractedData.medications || []).entries()) {
    const fieldPrefix = `medications[${index}]`;

    if (!medication.name?.trim()) {
      issues.push(
        issue({
          code: "MEDICATION_NAME_MISSING",
          field: `${fieldPrefix}.name`,
          reason: "Medication name is missing.",
          reviewPriority: "high",
        })
      );
    }

    if (!medication.dose?.trim()) {
      issues.push(
        issue({
          code: "MEDICATION_DOSE_MISSING",
          field: `${fieldPrefix}.dose`,
          reason: "The source does not establish a clear dose.",
          requiresProfessionalConfirmation: true,
          reviewPriority: "high",
        })
      );
    }

    if (!medication.frequency?.trim()) {
      issues.push(
        issue({
          code: "MEDICATION_FREQUENCY_MISSING",
          field: `${fieldPrefix}.frequency`,
          reason: "Medication frequency is missing or unclear.",
          requiresProfessionalConfirmation: true,
          reviewPriority: "high",
        })
      );
    }

    if (
      medication.timing &&
      CLOCK_TIME_PATTERN.test(medication.timing) &&
      !sourceTextContains(sourcePages, CLOCK_TIME_PATTERN)
    ) {
      issues.push(
        issue({
          code: "UNSUPPORTED_TIMING_INFERENCE",
          field: `${fieldPrefix}.timing`,
          reason: "An exact clock time was present without clear support in the source text.",
          requiresProfessionalConfirmation: true,
          reviewPriority: "critical",
        })
      );
    }

    if (
      medication.frequency &&
      FREQUENCY_PATTERN.test(medication.frequency) &&
      medication.timing &&
      CLOCK_TIME_PATTERN.test(medication.timing) &&
      !sourceTextContains(sourcePages, new RegExp(medication.timing.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
    ) {
      issues.push(
        issue({
          code: "FREQUENCY_TO_CLOCK_TIME_INFERENCE",
          field: `${fieldPrefix}.timing`,
          reason: "Frequency alone does not justify an exact clock schedule.",
          requiresProfessionalConfirmation: true,
          reviewPriority: "critical",
        })
      );
    }

    if (
      medication.foodInstruction &&
      !FOOD_INSTRUCTIONS.includes(medication.foodInstruction)
    ) {
      issues.push(
        issue({
          code: "UNSUPPORTED_FOOD_INSTRUCTION",
          field: `${fieldPrefix}.foodInstruction`,
          reason: "Food instruction value is not supported.",
          reviewPriority: "high",
        })
      );
    }

    if (
      medication.foodInstruction &&
      medication.foodInstruction !== "not_specified" &&
      !sourceTextContains(
        sourcePages,
        /(before food|after food|with food|with meals|empty stomach)/i
      )
    ) {
      issues.push(
        issue({
          code: "FOOD_INSTRUCTION_UNSUPPORTED",
          field: `${fieldPrefix}.foodInstruction`,
          reason: "Food instruction is not clearly supported by the source text.",
          requiresProfessionalConfirmation: true,
          reviewPriority: "high",
        })
      );
    }

    verifyAllReferences(
      medication.sourceReferences,
      sourcePages,
      fieldPrefix,
      issues
    );
  }

  const medicationNames = (extractedData.medications || [])
    .map((item) => item.name?.trim().toLowerCase())
    .filter(Boolean);
  const duplicateNames = medicationNames.filter(
    (name, index) => medicationNames.indexOf(name) !== index
  );

  if (duplicateNames.length > 0) {
    issues.push(
      issue({
        code: "DUPLICATE_MEDICATION_CANDIDATE",
        field: "medications",
        reason: "Duplicate medicine candidates require review.",
        requiresProfessionalConfirmation: true,
        reviewPriority: "high",
      })
    );
  }

  for (const [index, followUp] of (extractedData.followUps || []).entries()) {
    const fieldPrefix = `followUps[${index}]`;

    if (followUp.date && !/^\d{4}-\d{2}-\d{2}$/.test(followUp.date)) {
      issues.push(
        issue({
          code: "INVALID_FOLLOW_UP_DATE",
          field: `${fieldPrefix}.date`,
          reason: "Follow-up date format is invalid.",
          reviewPriority: "normal",
        })
      );
    }

    verifyAllReferences(
      followUp.sourceReferences,
      sourcePages,
      fieldPrefix,
      issues
    );
  }

  for (const [index, warning] of (extractedData.warningSigns || []).entries()) {
    verifyAllReferences(
      warning.sourceReferences,
      sourcePages,
      `warningSigns[${index}]`,
      issues
    );
  }

  for (const [index, instruction] of (extractedData.dailyInstructions || []).entries()) {
    verifyAllReferences(
      instruction.sourceReferences,
      sourcePages,
      `dailyInstructions[${index}]`,
      issues
    );
  }

  for (const clarification of extractedData.clarifications || []) {
    issues.push(
      issue({
        code: "CLARIFICATION_REQUIRED",
        field: clarification.field,
        reason: clarification.reason,
        sourceReferences: clarification.sourceReferences || [],
        requiresProfessionalConfirmation: Boolean(
          clarification.requiresProfessionalConfirmation
        ),
        reviewPriority: "high",
      })
    );
  }

  const hasCritical = issues.some((entry) => entry.reviewPriority === "critical");
  const hasHigh = issues.some((entry) => entry.reviewPriority === "high");
  const readinessStatus = hasCritical || hasHigh ? "review_required" : "draft";

  return {
    issues,
    readinessStatus,
    hasBlockingIssues: issues.length > 0,
  };
}
