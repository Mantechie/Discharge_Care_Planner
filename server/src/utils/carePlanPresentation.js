import { mapSourceReferenceForApi } from "./sourceReferences.js";

function mapMedicationForApi(medication, caregiverEdit) {
  const extracted = {
    name: medication.name,
    strength: medication.strength,
    dose: medication.dose,
    route: medication.route,
    frequency: medication.frequency,
    timing: medication.timing,
    foodInstruction: medication.foodInstruction,
    duration: medication.duration,
    sourceReferences: (medication.sourceReferences || []).map(
      mapSourceReferenceForApi
    ),
    reviewStatus: medication.reviewStatus,
    clarificationReason: medication.clarificationReason,
  };

  const display = {
    ...extracted,
    dose: caregiverEdit?.dose?.value ?? extracted.dose,
    frequency: caregiverEdit?.frequency?.value ?? extracted.frequency,
    timing: caregiverEdit?.timing?.value ?? extracted.timing,
    caregiverNotes: caregiverEdit?.notes?.value ?? null,
  };

  return {
    id: medication._id.toString(),
    extracted,
    display,
    hasCaregiverEdits: Boolean(
      caregiverEdit?.dose?.value ||
        caregiverEdit?.frequency?.value ||
        caregiverEdit?.timing?.value ||
        caregiverEdit?.notes?.value
    ),
  };
}

export function buildCarePlanPresentation(carePlan, { includeSnapshot = false } = {}) {
  const caregiverEdits = carePlan.caregiverEdits || {};
  const medicationEditMap = new Map(
    (caregiverEdits.medications || []).map((edit) => [
      edit.medicationId.toString(),
      edit,
    ])
  );

  return {
    id: carePlan._id.toString(),
    documentId: carePlan.documentId.toString(),
    status: carePlan.status,
    language: carePlan.language,
    isActive: carePlan.isActive,
    summary: {
      extracted: carePlan.extractedSnapshot?.summary ?? carePlan.summary,
      display: caregiverEdits.summary?.value ?? carePlan.summary,
      hasCaregiverEdit: Boolean(caregiverEdits.summary?.value),
    },
    medications: (carePlan.medications || []).map((medication) =>
      mapMedicationForApi(medication, medicationEditMap.get(medication._id.toString()))
    ),
    dailyInstructionItems: carePlan.dailyInstructionItems,
    warningSignItems: carePlan.warningSignItems,
    followUpItems: carePlan.followUpItems,
    dailyInstructions: carePlan.dailyInstructions,
    warningSigns: carePlan.warningSigns,
    followUps: carePlan.followUps,
    clarifications: (carePlan.clarifications || []).map((item) => ({
      id: item._id.toString(),
      field: item.field,
      question: item.question,
      reason: item.reason,
      sourceReferences: (item.sourceReferences || []).map(mapSourceReferenceForApi),
      requiresProfessionalConfirmation: item.requiresProfessionalConfirmation,
      reviewPriority: item.reviewPriority,
      status: item.status,
      resolvedAt: item.resolvedAt,
      resolutionHistory: item.resolutionHistory,
    })),
    validationIssues: carePlan.validationIssues,
    extractionProvenance: carePlan.extractionProvenance,
    reviewedByUserAt: carePlan.reviewedByUserAt,
    caregiverReviewNote: carePlan.caregiverReviewNote,
    caregiverReviewRecorded: Boolean(carePlan.reviewedByUserAt),
    clinicallyVerified: false,
    openClarificationCount: (carePlan.clarifications || []).filter(
      (item) => item.status === "open"
    ).length,
    createdAt: carePlan.createdAt,
    updatedAt: carePlan.updatedAt,
    extractedSnapshot: includeSnapshot ? carePlan.extractedSnapshot : undefined,
  };
}

export function buildExtractedSnapshot(carePlanLike) {
  return {
    summary: carePlanLike.summary,
    medications: carePlanLike.medications,
    dailyInstructionItems: carePlanLike.dailyInstructionItems,
    warningSignItems: carePlanLike.warningSignItems,
    followUpItems: carePlanLike.followUpItems,
    dailyInstructions: carePlanLike.dailyInstructions,
    warningSigns: carePlanLike.warningSigns,
    followUps: carePlanLike.followUps,
    clarifications: carePlanLike.clarifications,
  };
}
